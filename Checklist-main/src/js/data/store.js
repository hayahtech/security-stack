// ═══════════════════════════════════════════════════════════════
// CheckFlow Pro — Data Store (Supabase)
// Prefixo de tabelas: checklist_
// ═══════════════════════════════════════════════════════════════

class CheckFlowDB {
  constructor() {
    this._session  = null;   // sessão Supabase cacheada (sync access)
    this._profile  = null;   // perfil do usuário logado (sync access)
    this._sectors  = [];     // setores cacheados na init (dados estáticos)
  }

  // ── Inicialização ─────────────────────────────────────────────
  async init() {
    // Escuta mudanças de auth (logout, refresh de token, etc.)
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      this._session = session;
      if (session) {
        await this._loadProfile(session.user.id);
      } else {
        this._profile = null;
      }
    });

    // Carrega sessão atual (pode já existir no localStorage)
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw new Error('Falha ao obter sessão: ' + sessionError.message);

    this._session = session;
    if (session) {
      await this._loadProfile(session.user.id);
    }

    // Cacheia setores (referência estática, raramente muda)
    const { data: sectors, error: sectorsError } = await supabaseClient
      .from('checklist_sectors')
      .select('*')
      .order('id');
    if (sectorsError) {
      console.error('[CheckFlow] Falha ao carregar setores:', sectorsError.message);
    }
    this._sectors = sectors || [];
  }

  async _loadProfile(userId) {
    try {
      const { data, error } = await supabaseClient
        .from('checklist_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) console.error('[CheckFlow] _loadProfile:', error.message);
      this._profile = data || null;
    } catch (err) {
      console.error('[CheckFlow] _loadProfile inesperado:', err?.message || err);
      this._profile = null;
    }
  }

  // ── Auth (síncronos — usam cache) ─────────────────────────────
  isAuthenticated() {
    return !!this._session;
  }

  getCurrentUser() {
    return this._profile;
  }

  async authenticate(email, password) {
    const rateCheck = this.checkLoginRateLimit(email);
    if (!rateCheck.allowed) {
      return { __rateLimited: true, waitSeconds: rateCheck.waitSeconds };
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      this.recordLoginFailure(email);
      return null;
    }

    this.clearLoginAttempts(email);
    await this._loadProfile(data.user.id);
    if (this._profile) {
      await this.addAuditLog(data.user.id, 'LOGIN', 'user', null, 'Login efetuado com sucesso');
    }
    return this._profile;
  }

  async logout() {
    const user = this.getCurrentUser();
    if (user) {
      await this.addAuditLog(user.id, 'LOGOUT', 'user', null, 'Logout efetuado');
    }
    await supabaseClient.auth.signOut();
    this._session = null;
    this._profile = null;
  }

  // ── Setores (síncronos — usam cache) ─────────────────────────
  getSectors()            { return this._sectors; }
  getSectorById(id)       { return this._sectors.find(s => s.id === parseInt(id)) || null; }
  getSectorBySlug(slug)   { return this._sectors.find(s => s.slug === slug) || null; }

  // ── Usuários ──────────────────────────────────────────────────
  async getUsers() {
    const { data } = await supabaseClient
      .from('checklist_profiles')
      .select('*')
      .order('created_at');
    return data || [];
  }

  async getUserById(id) {
    if (!id) return null;
    const { data } = await supabaseClient
      .from('checklist_profiles')
      .select('*')
      .eq('id', id)
      .single();
    return data || null;
  }

  async getUserByEmail(email) {
    const { data } = await supabaseClient
      .from('checklist_profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();
    return data || null;
  }

  async createUser(userData) {
    // signUp cria o auth.users; o trigger cria checklist_profiles automaticamente
    const { data: authData, error } = await supabaseClient.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { name: userData.name, role: userData.role },
      },
    });
    if (error) throw error;

    // Garante que o perfil tem os setores e role corretos
    if (authData.user) {
      await supabaseClient
        .from('checklist_profiles')
        .upsert({
          id:      authData.user.id,
          email:   userData.email,
          name:    userData.name,
          role:    userData.role,
          sectors: userData.sectors || [],
        });

      const currentUser = this.getCurrentUser();
      await this.addAuditLog(
        currentUser?.id, 'CREATE_USER', 'user', null,
        `Criou usuário "${userData.name}"`
      );
    }
    return authData.user;
  }

  async updateUser(id, updateData) {
    const before = await this.getUserById(id);
    const profileData = { ...updateData };
    delete profileData.password; // senha nunca vai na tabela profiles

    const { data: updated, error } = await supabaseClient
      .from('checklist_profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Atualiza cache se for o próprio usuário
    if (id === this._profile?.id) this._profile = updated;

    // Loga mudança de senha
    if (updateData.password && before) {
      await this.addAuditLog(
        this._profile?.id, 'CHANGE_PASSWORD', 'user', null,
        `Senha do usuário "${before.name}" foi alterada`
      );
    }
    return updated;
  }

  async deleteUser(id) {
    // Remove o perfil (a entrada em auth.users requer service role via Edge Function futura)
    await supabaseClient.from('checklist_profiles').delete().eq('id', id);
    const currentUser = this.getCurrentUser();
    await this.addAuditLog(currentUser?.id, 'DELETE_USER', 'user', null, `Usuário removido`);
  }

  // ── Checklists ────────────────────────────────────────────────
  async getChecklists(filters = {}) {
    let query = supabaseClient.from('checklist_checklists').select('*');

    if (filters.sector_id)         query = query.eq('sector_id', parseInt(filters.sector_id));
    if (filters.status)            query = query.eq('status', filters.status);
    if (filters.priority)          query = query.eq('priority', filters.priority);
    if (filters.assigned_to)       query = query.eq('assigned_to', filters.assigned_to);
    if (filters.is_template !== undefined)
                                   query = query.eq('is_template', filters.is_template);
    if (filters.search)            query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
    if (filters.date_from)         query = query.gte('created_at', filters.date_from);
    if (filters.date_to)           query = query.lte('created_at', filters.date_to);

    query = query.order('created_at', { ascending: false });
    const { data } = await query;
    return data || [];
  }

  async getChecklistById(id) {
    const { data } = await supabaseClient
      .from('checklist_checklists')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    return data || null;
  }

  async createChecklist(data) {
    const user = this.getCurrentUser();
    const { data: checklist, error } = await supabaseClient
      .from('checklist_checklists')
      .insert({ ...data, created_by: user?.id, status: 'pending', risk_score: 0 })
      .select()
      .single();
    if (error) throw error;

    if (data.items?.length) {
      const itemInserts = data.items.map((item, idx) => ({
        ...item, checklist_id: checklist.id, order_index: idx,
      }));
      await supabaseClient.from('checklist_items').insert(itemInserts);
    }

    await this.addAuditLog(user?.id, 'CREATE_CHECKLIST', 'checklist', checklist.id,
      `Criou checklist "${checklist.title}"`);
    return checklist;
  }

  async updateChecklist(id, data) {
    const user = this.getCurrentUser();
    const updateData = { ...data };
    if (data.status === 'completed') updateData.completed_at = new Date().toISOString();

    const { data: updated, error } = await supabaseClient
      .from('checklist_checklists')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    if (error) throw error;

    if (updated) {
      await this.addAuditLog(user?.id, 'UPDATE_CHECKLIST', 'checklist', parseInt(id),
        `Atualizou checklist "${updated.title}"`);
    }
    return updated;
  }

  async deleteChecklist(id) {
    const user = this.getCurrentUser();
    const cl = await this.getChecklistById(id);
    await supabaseClient.from('checklist_checklists').delete().eq('id', parseInt(id));
    if (cl) {
      await this.addAuditLog(user?.id, 'DELETE_CHECKLIST', 'checklist', parseInt(id),
        `Removeu checklist "${cl.title}"`);
    }
  }

  // ── Itens de Checklist ────────────────────────────────────────
  async getChecklistItems(checklistId) {
    const { data } = await supabaseClient
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', parseInt(checklistId))
      .order('order_index');
    return data || [];
  }

  async createChecklistItem(data) {
    const { data: item, error } = await supabaseClient
      .from('checklist_items').insert(data).select().single();
    if (error) throw error;
    return item;
  }

  async updateChecklistItem(id, data) {
    const { data: item } = await supabaseClient
      .from('checklist_items').update(data).eq('id', parseInt(id)).select().single();
    return item;
  }

  async deleteChecklistItem(id) {
    await supabaseClient.from('checklist_items').delete().eq('id', parseInt(id));
  }

  // ── Respostas ─────────────────────────────────────────────────
  async getResponses(checklistId) {
    const { data } = await supabaseClient
      .from('checklist_responses')
      .select('*')
      .eq('checklist_id', parseInt(checklistId));
    return data || [];
  }

  async addResponse(data) {
    const user = this.getCurrentUser();
    const { data: response, error } = await supabaseClient
      .from('checklist_responses')
      .upsert(
        { ...data, responded_by: user?.id, responded_at: new Date().toISOString() },
        { onConflict: 'checklist_id,item_id' }
      )
      .select()
      .single();
    if (error) throw error;

    const [items, responses] = await Promise.all([
      this.getChecklistItems(data.checklist_id),
      this.getResponses(data.checklist_id),
    ]);
    const newStatus = responses.length >= items.length ? 'completed' : 'in_progress';
    await this.updateChecklist(data.checklist_id, { status: newStatus });
    return response;
  }

  // ── Notificações ──────────────────────────────────────────────
  async getNotifications(userId) {
    const { data } = await supabaseClient
      .from('checklist_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async getUnreadCount(userId) {
    const { count } = await supabaseClient
      .from('checklist_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count || 0;
  }

  async markNotificationRead(id) {
    await supabaseClient.from('checklist_notifications')
      .update({ is_read: true }).eq('id', id);
  }

  async markAllNotificationsRead(userId) {
    await supabaseClient.from('checklist_notifications')
      .update({ is_read: true }).eq('user_id', userId);
  }

  // ── Logs de Auditoria ─────────────────────────────────────────
  async getAuditLogs(limit = 50) {
    const { data } = await supabaseClient
      .from('checklist_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  async addAuditLog(userId, action, entityType, entityId, details) {
    await supabaseClient.from('checklist_audit_logs').insert({
      user_id:     userId || null,
      action,
      entity_type: entityType,
      entity_id:   entityId || null,
      details,
      ip_address:  null,
    });
  }

  // ── Dashboard Stats ───────────────────────────────────────────
  async getDashboardStats() {
    const { data } = await supabaseClient
      .from('checklist_checklists')
      .select('status')
      .eq('is_template', false);
    const all = data || [];
    return {
      total:      all.length,
      completed:  all.filter(c => c.status === 'completed').length,
      pending:    all.filter(c => c.status === 'pending').length,
      inProgress: all.filter(c => c.status === 'in_progress').length,
      overdue:    all.filter(c => c.status === 'overdue').length,
    };
  }

  async getChartData() {
    const { data } = await supabaseClient
      .from('checklist_checklists').select('*').eq('is_template', false);
    const all = data || [];

    const sectorStats = this._sectors.map(s => {
      const sectorCl = all.filter(c => c.sector_id === s.id);
      return {
        sector: s.name, sectorId: s.id, color: s.color,
        total:     sectorCl.length,
        completed: sectorCl.filter(c => c.status === 'completed').length,
        pending:   sectorCl.filter(c => c.status === 'pending').length,
        overdue:   sectorCl.filter(c => c.status === 'overdue').length,
        avgRisk:   sectorCl.length > 0
          ? sectorCl.reduce((a, c) => a + Number(c.risk_score), 0) / sectorCl.length
          : 0,
      };
    });

    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timeline.push({
        date: dateStr,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        completed: all.filter(c => c.completed_at?.split('T')[0] === dateStr).length,
        created:   all.filter(c => c.created_at?.split('T')[0] === dateStr).length,
      });
    }

    const statusDist = {
      completed:  all.filter(c => c.status === 'completed').length,
      pending:    all.filter(c => c.status === 'pending').length,
      inProgress: all.filter(c => c.status === 'in_progress').length,
      overdue:    all.filter(c => c.status === 'overdue').length,
    };

    return { sectorStats, timeline, statusDist, heatmapData: [] };
  }

  async getAISuggestions() {
    const [stats, { data }] = await Promise.all([
      this.getDashboardStats(),
      supabaseClient.from('checklist_checklists').select('priority,status').eq('is_template', false),
    ]);
    const all = data || [];
    const suggestions = [];

    if (stats.total > 0 && stats.overdue / stats.total > 0.2) {
      suggestions.push({
        type: 'warning', icon: '⚠️', title: 'Taxa de Atraso Elevada',
        message: `${Math.round(stats.overdue / stats.total * 100)}% dos checklists estão atrasados.`,
      });
    }

    const criticalPending = all.filter(c => c.priority === 'critical' && c.status !== 'completed');
    if (criticalPending.length > 0) {
      suggestions.push({
        type: 'critical', icon: '🔴', title: 'Itens Críticos Pendentes',
        message: `${criticalPending.length} checklist(s) com prioridade CRÍTICA pendentes.`,
      });
    }

    suggestions.push({
      type: 'tip', icon: '💡', title: 'Sugestão de Melhoria',
      message: 'Use templates para checklists recorrentes e aumente a padronização.',
    });

    if (stats.completed > 0) {
      suggestions.push({
        type: 'success', icon: '🎉', title: 'Bom Desempenho!',
        message: `${stats.completed} checklists concluídos. Continue assim!`,
      });
    }

    return suggestions;
  }

  async calculateRiskScore(checklistIdOrObj) {
    const cl = typeof checklistIdOrObj === 'object'
      ? checklistIdOrObj
      : await this.getChecklistById(checklistIdOrObj);
    if (!cl) return 0;

    let score = ({ low: 1, medium: 3, high: 6, critical: 10 })[cl.priority] || 0;

    if (cl.status === 'overdue' && cl.due_date) {
      const daysOverdue = Math.floor((Date.now() - new Date(cl.due_date)) / 86400000);
      score += Math.min(daysOverdue * 0.5, 5);
    }

    const [items, responses] = await Promise.all([
      this.getChecklistItems(cl.id),
      this.getResponses(cl.id),
    ]);
    if (items.length > 0) score += (1 - responses.length / items.length) * 3;

    if ([3, 4, 8].includes(cl.sector_id)) score *= 1.3;
    return Math.min(Math.round(score * 10) / 10, 10);
  }

  // ── Rate Limiting (localStorage — controle client-side) ───────
  checkLoginRateLimit(email) {
    try {
      const data = JSON.parse(localStorage.getItem('checkflow_login_attempts') || '{}');
      const a = data[email] || {};
      if (Date.now() < (a.blockedUntil || 0)) {
        return { allowed: false, waitSeconds: Math.ceil((a.blockedUntil - Date.now()) / 1000) };
      }
    } catch {}
    return { allowed: true };
  }

  recordLoginFailure(email) {
    try {
      const key = 'checkflow_login_attempts';
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      let a = data[email] || { count: 0, lastAttempt: 0, blockedUntil: 0 };
      if (Date.now() - a.lastAttempt > 15 * 60 * 1000) a.count = 0;
      a.count++;
      a.lastAttempt = Date.now();
      if (a.count >= 5) { a.blockedUntil = Date.now() + 5 * 60 * 1000; a.count = 0; }
      data[email] = a;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }

  clearLoginAttempts(email) {
    try {
      const data = JSON.parse(localStorage.getItem('checkflow_login_attempts') || '{}');
      delete data[email];
      localStorage.setItem('checkflow_login_attempts', JSON.stringify(data));
    } catch {}
  }

  async resetData() {
    console.warn('[CheckFlow] resetData: use o Supabase Console para resetar dados em produção.');
  }
}

const db = new CheckFlowDB();
