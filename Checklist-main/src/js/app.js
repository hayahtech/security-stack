// ═══════════════════════════════════════════════════════════════
// CheckFlow Pro — Main Application Controller
// Initializes DB, Router, Layout, and wires everything together
// ═══════════════════════════════════════════════════════════════

class CheckFlowApp {
  constructor() {
    this.sidebarOpen = window.innerWidth > 768;
  }

  // Minimum role required per route (null = any authenticated user)
  static get ROUTE_PERMISSIONS() {
    return {
      '/dashboard':      null,
      '/checklists':     null,
      '/sectors':        null,
      '/notifications':  null,
      '/users':          'admin',
      '/reports':        ['admin', 'supervisor'],
      '/audit':          ['admin', 'supervisor'],
      '/settings':       'admin',
    };
  }

  hasAccess(route) {
    const required = CheckFlowApp.ROUTE_PERMISSIONS[route];
    if (!required) return true;
    const user = db.getCurrentUser();
    if (!user) return false;
    const allowed = Array.isArray(required) ? required : [required];
    return allowed.includes(user.role);
  }

  _showLoading() {
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:300px;flex-direction:column;gap:1rem;">
          <div style="width:40px;height:40px;border-radius:50%;border:3px solid var(--glass-border);border-top-color:var(--purple);animation:spin 0.8s linear infinite;"></div>
          <div style="color:rgba(240,240,248,0.4);font-size:14px;">Carregando...</div>
        </div>
      `;
    }
  }

  async init() {
    await db.init();

    // Auth + RBAC guard
    router.beforeEach = (route) => {
      if (route === '/login') return true;
      if (!db.isAuthenticated()) {
        router.navigate('/login');
        return false;
      }
      if (!this.hasAccess(route)) {
        showToast('Acesso negado. Permissão insuficiente.', 'error');
        router.navigate('/dashboard');
        return false;
      }
      return true;
    };

    // Register routes
    router.addRoute('/login',         ()       => this.renderLogin());
    router.addRoute('/dashboard',     ()       => this.renderDashboard());
    router.addRoute('/checklists',    (params) => this.renderChecklists(params));
    router.addRoute('/sectors',       (params) => this.renderSectors(params));
    router.addRoute('/users',         ()       => this.renderUsers());
    router.addRoute('/reports',       ()       => this.renderReports());
    router.addRoute('/notifications', ()       => this.renderNotifications());
    router.addRoute('/audit',         ()       => this.renderAudit());
    router.addRoute('/settings',      ()       => this.renderSettings());

    await this.renderLayout();
    router.start();

    // Responsive sidebar
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth <= 768) {
        this.closeSidebar();
      }
    }, 200));
  }

  // ── Layout ──────────────────────────────────────────
  async renderLayout() {
    const app = document.getElementById('app');
    const user = db.getCurrentUser();
    const unreadCount = user ? await db.getUnreadCount(user.id) : 0;

    app.innerHTML = `
      <!-- Sidebar -->
      <aside class="sidebar ${this.sidebarOpen ? '' : 'hidden'}" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">✓</div>
          <div class="sidebar-brand-text">
            <span class="sidebar-brand-name">CheckFlow Pro</span>
            <span class="sidebar-brand-tagline">Gestão Operacional</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section">
            <div class="sidebar-section-title">Principal</div>
            <button class="sidebar-item active" data-route="/dashboard" onclick="router.navigate('/dashboard')">
              <span class="sidebar-item-icon">${Icons.dashboard}</span>
              Dashboard
            </button>
            <button class="sidebar-item" data-route="/checklists" onclick="router.navigate('/checklists')">
              <span class="sidebar-item-icon">${Icons.checklist}</span>
              Checklists
            </button>
            <button class="sidebar-item" data-route="/sectors" onclick="router.navigate('/sectors')">
              <span class="sidebar-item-icon">${Icons.sectors}</span>
              Setores
            </button>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">Setores</div>
            ${db.getSectors().map(s => `
              <button class="sidebar-item" data-route="/sectors" onclick="router.navigate('/sectors/${s.slug}')">
                <span class="sidebar-item-icon">${s.icon}</span>
                ${s.name}
                <span class="sidebar-item-badge" style="display:none"></span>
              </button>
            `).join('')}
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">Gerenciamento</div>
            ${this.hasAccess('/users') ? `
            <button class="sidebar-item" data-route="/users" onclick="router.navigate('/users')">
              <span class="sidebar-item-icon">${Icons.users}</span>
              Usuários
            </button>` : ''}
            ${this.hasAccess('/reports') ? `
            <button class="sidebar-item" data-route="/reports" onclick="router.navigate('/reports')">
              <span class="sidebar-item-icon">${Icons.reports}</span>
              Relatórios
            </button>` : ''}
            <button class="sidebar-item" data-route="/notifications" onclick="router.navigate('/notifications')">
              <span class="sidebar-item-icon">${Icons.notifications}</span>
              Notificações
              ${unreadCount > 0 ? `<span class="sidebar-item-badge">${unreadCount}</span>` : ''}
            </button>
            ${this.hasAccess('/audit') ? `
            <button class="sidebar-item" data-route="/audit" onclick="router.navigate('/audit')">
              <span class="sidebar-item-icon">${Icons.audit}</span>
              Auditoria
            </button>` : ''}
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user" onclick="app.toggleUserMenu()">
            <div class="sidebar-user-avatar">${user ? getUserInitials(user.name) : 'U'}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user ? escapeHtml(user.name) : 'Usuário'}</div>
              <div class="sidebar-user-role">${user ? escapeHtml(user.role.charAt(0).toUpperCase() + user.role.slice(1)) : ''}</div>
            </div>
            <span style="color:var(--text-tertiary)">${Icons.logout}</span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-content" id="main-content">
        <!-- Header -->
        <header class="header" id="header">
          <button class="header-action-btn mobile-only" onclick="app.toggleSidebar()" id="menu-toggle">
            ${Icons.menu}
          </button>

          <div class="header-search">
            <span class="header-search-icon">${Icons.search}</span>
            <input type="text" placeholder="Buscar checklists, setores, usuários..." id="global-search" oninput="app.handleGlobalSearch(this.value)">
          </div>

          <div class="header-actions">
            <button class="header-action-btn" data-tooltip="Notificações" onclick="router.navigate('/notifications')">
              ${Icons.notifications}
              ${unreadCount > 0 ? '<span class="badge"></span>' : ''}
            </button>
            <button class="header-action-btn" data-tooltip="Configurações" onclick="router.navigate('/settings')">
              ${Icons.settings}
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content" id="page-content">
          <!-- Pages render here -->
        </main>
      </div>

      <!-- Toast Container -->
      <div class="toast-container" id="toast-container"></div>

      <!-- Modal Container -->
      <div class="modal-backdrop" id="modal-backdrop" onclick="if(event.target===this) closeModal('modal-backdrop')">
        <div class="modal" id="main-modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Modal</h3>
            <button class="modal-close" onclick="closeModal('modal-backdrop')">${Icons.close}</button>
          </div>
          <div class="modal-body" id="modal-body">
          </div>
          <div class="modal-footer" id="modal-footer">
          </div>
        </div>
      </div>
    `;
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  async toggleUserMenu() {
    if (confirm('Deseja sair do sistema?')) {
      await db.logout();
      router.navigate('/login');
    }
  }

  handleGlobalSearch(query) {
    if (query.length >= 2) {
      router.navigate('/checklists');
      setTimeout(() => {
        const searchInput = document.getElementById('checklist-search');
        if (searchInput) {
          searchInput.value = query;
          searchInput.dispatchEvent(new Event('input'));
        }
      }, 100);
    }
  }

  // ── Page Renderers ──────────────────────────────────
  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="login-card glass-card">
          <div class="login-logo">
            <div class="login-logo-icon">✓</div>
            <h1 class="login-title">CheckFlow Pro</h1>
            <p class="login-subtitle">Plataforma de Gestão de Checklists Operacionais</p>
          </div>

          <form onsubmit="app.handleLogin(event)">
            <div class="form-group">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-input" id="login-email" placeholder="seu@email.com" autocomplete="username" required>
            </div>
            <div class="form-group">
              <label class="form-label">Senha</label>
              <input type="password" class="form-input" id="login-password" placeholder="••••••••" autocomplete="current-password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top: var(--space-4)">
              Entrar
            </button>
          </form>
        </div>
      </div>
      <div class="toast-container" id="toast-container"></div>
    `;
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('[type="submit"]');

    if (!email || !password) {
      showToast('Preencha e-mail e senha.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Autenticando...';

    try {
      const result = await db.authenticate(email, password);
      if (result && result.__rateLimited) {
        showToast(`Muitas tentativas. Aguarde ${result.waitSeconds}s.`, 'error');
        return;
      }
      if (result) {
        await this.renderLayout();
        router.navigate('/dashboard');
        showToast(`Bem-vindo(a), ${result.name}!`, 'success');
      } else {
        showToast('E-mail ou senha incorretos.', 'error');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  }

  // ── Dashboard ───────────────────────────────────────
  async renderDashboard() {
    const content = document.getElementById('page-content');
    this._showLoading();

    const user = db.getCurrentUser();
    const [stats, chartData, suggestions, notifications] = await Promise.all([
      db.getDashboardStats(),
      db.getChartData(),
      db.getAISuggestions(),
      user ? db.getNotifications(user.id) : Promise.resolve([]),
    ]);

    // Fetch audit logs + resolve users for recent activity
    const logs = await db.getAuditLogs(5);
    const logUserIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const logUsers = await Promise.all(logUserIds.map(id => db.getUserById(id)));
    const logUserMap = Object.fromEntries(logUserIds.map((id, i) => [id, logUsers[i]]));

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Visão geral dos checklists operacionais</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary" onclick="app.renderDashboard()">
            ${Icons.barChart} Atualizar
          </button>
          <button class="btn btn-primary" onclick="router.navigate('/checklists/new')">
            ${Icons.plus} Novo Checklist
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid stagger">
        <div class="kpi-card green animate-slide-up">
          <div class="kpi-card-header">
            <div class="kpi-card-icon">${Icons.checkCircle}</div>
            <span class="kpi-card-trend up">${Icons.arrowUp} 12%</span>
          </div>
          <div class="kpi-card-value" data-count="${stats.completed}">0</div>
          <div class="kpi-card-label">Concluídos</div>
        </div>

        <div class="kpi-card orange animate-slide-up">
          <div class="kpi-card-header">
            <div class="kpi-card-icon">${Icons.clock}</div>
            <span class="kpi-card-trend down">${Icons.arrowDown} 5%</span>
          </div>
          <div class="kpi-card-value" data-count="${stats.pending}">0</div>
          <div class="kpi-card-label">Pendentes</div>
        </div>

        <div class="kpi-card red animate-slide-up">
          <div class="kpi-card-header">
            <div class="kpi-card-icon">${Icons.alertTriangle}</div>
            <span class="kpi-card-trend down">${Icons.arrowUp} 3%</span>
          </div>
          <div class="kpi-card-value" data-count="${stats.overdue}">0</div>
          <div class="kpi-card-label">Atrasados</div>
        </div>

        <div class="kpi-card purple animate-slide-up">
          <div class="kpi-card-header">
            <div class="kpi-card-icon">${Icons.checklist}</div>
            <span class="kpi-card-trend up">${Icons.arrowUp} 8%</span>
          </div>
          <div class="kpi-card-value" data-count="${stats.total}">0</div>
          <div class="kpi-card-label">Total de Checklists</div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="glass-card chart-card animate-slide-up" style="animation-delay:200ms">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Evolução (30 dias)</h3>
            <div class="chart-card-actions">
              <button class="chart-period-btn active">30 dias</button>
              <button class="chart-period-btn">7 dias</button>
            </div>
          </div>
          <div class="chart-container">
            <canvas id="line-chart"></canvas>
          </div>
        </div>

        <div class="glass-card chart-card animate-slide-up" style="animation-delay:300ms">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Comparativo por Setor</h3>
          </div>
          <div class="chart-container">
            <canvas id="bar-chart"></canvas>
          </div>
        </div>

        <div class="glass-card chart-card animate-slide-up" style="animation-delay:400ms">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Distribuição de Status</h3>
          </div>
          <div class="chart-container" style="max-width: 300px; margin: 0 auto;">
            <canvas id="pie-chart"></canvas>
          </div>
        </div>

        <div class="glass-card chart-card animate-slide-up" style="animation-delay:500ms">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Mapa de Calor — Incidentes</h3>
          </div>
          <div id="heatmap-container" style="overflow-x:auto;"></div>
        </div>
      </div>

      <!-- Bottom Grid: Ranking + AI + Activity -->
      <div class="charts-grid" style="grid-template-columns: 1fr 1fr 1fr;">
        <!-- Sector Ranking -->
        <div class="glass-card p-6 animate-slide-up" style="animation-delay:600ms">
          <h3 class="chart-card-title mb-4">🏆 Ranking — Setores Críticos</h3>
          <div class="ranking-list">
            ${chartData.sectorStats
              .sort((a, b) => b.avgRisk - a.avgRisk)
              .slice(0, 5)
              .map((s, i) => `
                <div class="ranking-item">
                  <div class="ranking-position ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}">${i + 1}</div>
                  <span class="ranking-name">${s.sector}</span>
                  <span class="ranking-score" style="color: ${s.avgRisk > 6 ? 'var(--red)' : s.avgRisk > 3 ? 'var(--orange)' : 'var(--green)'}">${s.avgRisk.toFixed(1)}</span>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- AI Suggestions -->
        <div class="glass-card p-6 animate-slide-up" style="animation-delay:700ms">
          <h3 class="chart-card-title mb-4">🧠 Sugestões IA</h3>
          <div class="notification-list">
            ${suggestions.slice(0, 4).map(s => `
              <div class="notification-item">
                <div class="notification-icon ${s.type === 'critical' ? 'critical' : s.type === 'warning' || s.type === 'alert' ? 'warning' : s.type === 'success' ? 'success' : 'info'}">
                  ${s.icon}
                </div>
                <div class="notification-content">
                  <div class="notification-title">${s.title}</div>
                  <div class="notification-message">${s.message}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="glass-card p-6 animate-slide-up" style="animation-delay:800ms">
          <h3 class="chart-card-title mb-4">📋 Atividade Recente</h3>
          <div class="activity-timeline">
            ${logs.map(log => {
              const u = logUserMap[log.user_id];
              const typeClass = log.action.includes('DELETE') ? 'error' : log.action.includes('COMPLETE') ? 'success' : log.action.includes('CREATE') ? '' : 'warning';
              return `
                <div class="activity-item ${typeClass}">
                  <div class="activity-dot"></div>
                  <div class="activity-title">${escapeHtml(log.details)}</div>
                  <div class="activity-desc">${u ? escapeHtml(u.name) : 'Sistema'}</div>
                  <div class="activity-time">${formatRelativeTime(log.created_at)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Animate counters
    setTimeout(() => {
      document.querySelectorAll('[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count), 1200);
      });
    }, 200);

    // Render charts
    this.renderCharts(chartData);
  }

  renderCharts(data) {
    // Wait for Chart.js to be loaded
    if (typeof Chart === 'undefined') {
      setTimeout(() => this.renderCharts(data), 100);
      return;
    }

    const gridColor = 'rgba(255,255,255,0.06)';

    Chart.defaults.color = 'rgba(240,240,248,0.6)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Line Chart
    const lineCtx = document.getElementById('line-chart');
    if (lineCtx) {
      new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: data.timeline.map(t => t.label),
          datasets: [
            {
              label: 'Concluídos',
              data: data.timeline.map(t => t.completed),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34,197,94,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
            },
            {
              label: 'Criados',
              data: data.timeline.map(t => t.created),
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139,92,246,0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } } },
          scales: {
            x: { grid: { color: gridColor, drawBorder: false }, ticks: { maxTicksLimit: 10 } },
            y: { grid: { color: gridColor, drawBorder: false }, beginAtZero: true }
          },
          interaction: { mode: 'index', intersect: false },
        }
      });
    }

    // Bar Chart
    const barCtx = document.getElementById('bar-chart');
    if (barCtx) {
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: data.sectorStats.map(s => s.sector),
          datasets: [
            {
              label: 'Concluídos',
              data: data.sectorStats.map(s => s.completed),
              backgroundColor: 'rgba(34,197,94,0.7)',
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Pendentes',
              data: data.sectorStats.map(s => s.pending),
              backgroundColor: 'rgba(245,158,11,0.7)',
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Atrasados',
              data: data.sectorStats.map(s => s.overdue),
              backgroundColor: 'rgba(239,68,68,0.7)',
              borderRadius: 6,
              borderSkipped: false,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'rectRounded', padding: 20 } } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45 } },
            y: { grid: { color: gridColor, drawBorder: false }, beginAtZero: true }
          }
        }
      });
    }

    // Pie Chart
    const pieCtx = document.getElementById('pie-chart');
    if (pieCtx) {
      new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: ['Concluídos', 'Pendentes', 'Em Andamento', 'Atrasados'],
          datasets: [{
            data: [data.statusDist.completed, data.statusDist.pending, data.statusDist.inProgress, data.statusDist.overdue],
            backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 }
            }
          }
        }
      });
    }

    // Heatmap (custom HTML/CSS)
    this.renderHeatmap(data.heatmapData);
  }

  renderHeatmap(data) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12'];

    const getColor = (value) => {
      if (value === 0) return 'rgba(255,255,255,0.03)';
      if (value <= 2) return 'rgba(34,197,94,0.3)';
      if (value <= 4) return 'rgba(34,197,94,0.5)';
      if (value <= 6) return 'rgba(245,158,11,0.5)';
      if (value <= 8) return 'rgba(239,68,68,0.5)';
      return 'rgba(239,68,68,0.8)';
    };

    let html = '<div style="display:grid; grid-template-columns: 100px repeat(12, 1fr); gap:3px; align-items:center;">';

    // Header
    html += '<div></div>';
    weeks.forEach(w => {
      html += `<div class="heatmap-label text-center">${w}</div>`;
    });

    // Rows
    data.forEach(row => {
      html += `<div class="heatmap-label">${row.sector}</div>`;
      row.weeks.forEach(val => {
        html += `<div class="heatmap-cell" style="background:${getColor(val)};min-height:28px;" data-tooltip="${val} incidentes"></div>`;
      });
    });

    html += '</div>';
    html += '<div class="flex gap-3 mt-4" style="justify-content:center;">';
    html += '<span class="text-xs text-muted flex gap-1" style="align-items:center;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(34,197,94,0.3);"></span> Baixo</span>';
    html += '<span class="text-xs text-muted flex gap-1" style="align-items:center;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(245,158,11,0.5);"></span> Médio</span>';
    html += '<span class="text-xs text-muted flex gap-1" style="align-items:center;"><span style="width:12px;height:12px;border-radius:3px;background:rgba(239,68,68,0.8);"></span> Alto</span>';
    html += '</div>';

    container.innerHTML = html;
  }

  // ── Checklists ──────────────────────────────────────
  async renderChecklists(params) {
    const content = document.getElementById('page-content');

    // If params[0] is 'new', show create form
    if (params && params[0] === 'new') {
      await this.renderChecklistForm();
      return;
    }

    // If params[0] is a number, show detail
    if (params && params[0] && !isNaN(params[0])) {
      if (params[1] === 'edit') {
        await this.renderChecklistForm(parseInt(params[0]));
      } else {
        await this.renderChecklistDetail(parseInt(params[0]));
      }
      return;
    }

    // Templates page
    if (params && params[0] === 'templates') {
      await this.renderTemplates();
      return;
    }

    this._showLoading();

    // List page
    const [checklists, sectors] = await Promise.all([
      db.getChecklists({ is_template: false }),
      Promise.resolve(db.getSectors()),
    ]);

    const cardsHtml = await this._buildChecklistCards(checklists);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Checklists</h1>
          <p class="page-subtitle">${checklists.length} checklists encontrados</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary" onclick="router.navigate('/checklists/templates')">
            ${Icons.template} Templates
          </button>
          <button class="btn btn-primary" onclick="router.navigate('/checklists/new')">
            ${Icons.plus} Novo Checklist
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar" id="checklist-filters">
        <div class="header-search" style="max-width: 300px;">
          <span class="header-search-icon">${Icons.search}</span>
          <input type="text" class="form-input" placeholder="Buscar..." id="checklist-search" style="padding-left: var(--space-10);">
        </div>

        <select class="form-select" id="filter-sector" style="width: auto; min-width: 150px;">
          <option value="">Todos os Setores</option>
          ${sectors.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
        </select>

        <select class="form-select" id="filter-status" style="width: auto; min-width: 140px;">
          <option value="">Todos os Status</option>
          <option value="completed">Concluído</option>
          <option value="pending">Pendente</option>
          <option value="in_progress">Em Andamento</option>
          <option value="overdue">Atrasado</option>
        </select>

        <select class="form-select" id="filter-priority" style="width: auto; min-width: 140px;">
          <option value="">Prioridade</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>

        <input type="date" class="form-input" id="filter-date-from" style="width: auto;" placeholder="De">
        <input type="date" class="form-input" id="filter-date-to" style="width: auto;" placeholder="Até">
      </div>

      <!-- Checklist Grid -->
      <div class="checklist-grid stagger" id="checklist-grid">
        ${cardsHtml}
      </div>
    `;

    // Wire up filters
    const filterFn = debounce(() => this.applyChecklistFilters(), 300);
    document.getElementById('checklist-search').addEventListener('input', filterFn);
    document.getElementById('filter-sector').addEventListener('change', filterFn);
    document.getElementById('filter-status').addEventListener('change', filterFn);
    document.getElementById('filter-priority').addEventListener('change', filterFn);
    document.getElementById('filter-date-from').addEventListener('change', filterFn);
    document.getElementById('filter-date-to').addEventListener('change', filterFn);
  }

  async _buildChecklistCards(checklists) {
    if (checklists.length === 0) {
      return `
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">Nenhum checklist encontrado</h3>
          <p class="empty-state-text">Crie seu primeiro checklist clicando no botão acima.</p>
          <button class="btn btn-primary" onclick="router.navigate('/checklists/new')">
            ${Icons.plus} Criar Checklist
          </button>
        </div>
      `;
    }

    const cards = await Promise.all(checklists.map(async cl => {
      const sector = db.getSectorById(cl.sector_id);
      const [assignee, items, responses] = await Promise.all([
        db.getUserById(cl.assigned_to),
        db.getChecklistItems(cl.id),
        db.getResponses(cl.id),
      ]);
      const progress = items.length > 0 ? Math.round(responses.length / items.length * 100) : 0;
      const progressColor = progress >= 100 ? 'green' : progress >= 50 ? '' : progress >= 25 ? 'orange' : 'red';

      return `
        <div class="glass-card checklist-card animate-slide-up" onclick="router.navigate('/checklists/${cl.id}')">
          <div class="checklist-card-gradient" style="background: ${sector ? sector.gradient : 'var(--gradient-purple-blue)'}"></div>
          <div class="checklist-card-header">
            <div>
              <div class="checklist-card-title">${escapeHtml(cl.title)}</div>
              <div class="checklist-card-sector">${sector ? escapeHtml(sector.icon) + ' ' + escapeHtml(sector.name) : ''}</div>
            </div>
            <div class="flex gap-2">
              ${getStatusBadge(cl.status)}
            </div>
          </div>

          <div class="checklist-card-body">
            <div class="flex gap-2 mb-2">
              ${getPriorityBadge(cl.priority)}
              <span class="badge badge-gray">${getRecurrenceBadge(cl.recurrence)}</span>
            </div>
          </div>

          <div class="checklist-card-progress">
            <div class="progress-bar">
              <div class="progress-bar-fill ${progressColor}" style="width: ${progress}%"></div>
            </div>
            <div class="progress-info">
              <span>${responses.length}/${items.length} itens</span>
              <span>${progress}%</span>
            </div>
          </div>

          <div class="checklist-card-footer">
            <div class="checklist-card-assignee">
              <div class="checklist-card-avatar">${assignee ? getUserInitials(assignee.name) : '?'}</div>
              <span class="text-xs text-muted">${assignee ? escapeHtml(assignee.name.split(' ')[0]) : 'N/A'}</span>
            </div>
            <span class="checklist-card-date">${Icons.calendar} ${formatDate(cl.due_date)}</span>
          </div>
        </div>
      `;
    }));

    return cards.join('');
  }

  async applyChecklistFilters() {
    const search = document.getElementById('checklist-search').value;
    const sector = document.getElementById('filter-sector').value;
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;

    const filters = { is_template: false };
    if (search) filters.search = search;
    if (sector) filters.sector_id = sector;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;

    const grid = document.getElementById('checklist-grid');
    if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-tertiary);">Filtrando...</div>';

    const checklists = await db.getChecklists(filters);
    const html = await this._buildChecklistCards(checklists);
    if (grid) grid.innerHTML = html;
  }

  // ── Checklist Detail ────────────────────────────────
  async renderChecklistDetail(id) {
    const content = document.getElementById('page-content');
    this._showLoading();

    const cl = await db.getChecklistById(id);
    if (!cl) {
      content.innerHTML = '<div class="empty-state"><h3>Checklist não encontrado</h3></div>';
      return;
    }

    const sector = db.getSectorById(cl.sector_id);
    const [items, responses, assignee, riskScore] = await Promise.all([
      db.getChecklistItems(cl.id),
      db.getResponses(cl.id),
      db.getUserById(cl.assigned_to),
      db.calculateRiskScore(cl),
    ]);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <div class="flex gap-3" style="align-items:center; margin-bottom: var(--space-2);">
            <button class="btn btn-ghost btn-sm" onclick="router.navigate('/checklists')">
              ${Icons.chevronLeft} Voltar
            </button>
            <span class="badge badge-gray">${sector ? sector.icon + ' ' + sector.name : ''}</span>
          </div>
          <h1 class="page-title">${escapeHtml(cl.title)}</h1>
          <p class="page-subtitle">${escapeHtml(cl.description || '')}</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary" onclick="router.navigate('/checklists/${cl.id}/edit')">
            ${Icons.edit} Editar
          </button>
          <button class="btn btn-danger" onclick="app.deleteChecklist(${cl.id})">
            ${Icons.trash} Excluir
          </button>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: var(--space-6);">
        <div class="glass-card p-4">
          <div class="text-xs text-muted mb-2">Status</div>
          ${getStatusBadge(cl.status)}
        </div>
        <div class="glass-card p-4">
          <div class="text-xs text-muted mb-2">Prioridade</div>
          ${getPriorityBadge(cl.priority)}
        </div>
        <div class="glass-card p-4">
          <div class="text-xs text-muted mb-2">Risco</div>
          <span style="font-size:var(--text-xl);font-weight:700;color:${riskScore > 6 ? 'var(--red)' : riskScore > 3 ? 'var(--orange)' : 'var(--green)'}">${riskScore.toFixed(1)}</span>
          <span class="text-xs text-muted">/10</span>
        </div>
        <div class="glass-card p-4">
          <div class="text-xs text-muted mb-2">Prazo</div>
          <span class="text-sm">${formatDate(cl.due_date)}</span>
        </div>
        <div class="glass-card p-4">
          <div class="text-xs text-muted mb-2">Responsável</div>
          <div class="flex gap-2" style="align-items:center;">
            <div class="checklist-card-avatar">${assignee ? getUserInitials(assignee.name) : '?'}</div>
            <span class="text-sm">${assignee ? escapeHtml(assignee.name) : 'N/A'}</span>
          </div>
        </div>
        <div class="glass-card p-4">
          <div class="text-xs text-muted mb-2">Recorrência</div>
          <span class="text-sm">${getRecurrenceBadge(cl.recurrence)}</span>
        </div>
      </div>

      <!-- Checklist Items -->
      <div class="glass-card p-6">
        <h3 class="chart-card-title mb-6">Itens do Checklist</h3>
        <form id="checklist-response-form">
          ${items.map(item => {
            const response = responses.find(r => r.item_id === item.id);
            return this.renderResponseField(item, response);
          }).join('')}

          ${cl.status !== 'completed' ? `
            <div class="flex gap-3" style="justify-content:flex-end;margin-top:var(--space-6);">
              <button type="button" class="btn btn-secondary" onclick="app.saveChecklistResponses(${cl.id}, false)">
                Salvar Rascunho
              </button>
              <button type="button" class="btn btn-primary" onclick="app.saveChecklistResponses(${cl.id}, true)">
                ${Icons.check} Finalizar Checklist
              </button>
            </div>
          ` : '<div class="text-center text-muted mt-4">✅ Este checklist foi finalizado em ' + formatDateTime(cl.completed_at) + '</div>'}
        </form>
      </div>
    `;
  }

  renderResponseField(item, response) {
    const value = response ? response.value : (item.value || '');

    switch (item.field_type) {
      case 'checkbox':
        return `
          <div class="form-group">
            <label class="form-checkbox-group">
              <input type="checkbox" class="form-checkbox" data-item-id="${item.id}" ${value === 'true' ? 'checked' : ''}>
              <span>${escapeHtml(item.label)} ${item.is_required ? '<span style="color:var(--red)">*</span>' : ''}</span>
            </label>
          </div>
        `;

      case 'text':
        return `
          <div class="form-group">
            <label class="form-label">${escapeHtml(item.label)} ${item.is_required ? '<span style="color:var(--red)">*</span>' : ''}</label>
            <input type="text" class="form-input" data-item-id="${item.id}" value="${escapeHtml(value)}" placeholder="Digite aqui...">
          </div>
        `;

      case 'datetime':
        return `
          <div class="form-group">
            <label class="form-label">${escapeHtml(item.label)} ${item.is_required ? '<span style="color:var(--red)">*</span>' : ''}</label>
            <input type="datetime-local" class="form-input" data-item-id="${item.id}" value="${value ? value.slice(0, 16) : new Date().toISOString().slice(0, 16)}">
          </div>
        `;

      case 'image':
        return `
          <div class="form-group">
            <label class="form-label">${escapeHtml(item.label)} ${item.is_required ? '<span style="color:var(--red)">*</span>' : ''}</label>
            <div class="upload-area" onclick="this.querySelector('input').click()" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')">
              <div class="upload-icon">${Icons.upload}</div>
              <div class="upload-text">Clique ou arraste uma imagem</div>
              <div class="upload-hint">PNG, JPG até 5MB</div>
              <input type="file" accept="image/*" data-item-id="${item.id}" style="display:none" onchange="app.handleImageUpload(this, ${item.id})">
            </div>
            <div id="preview-${item.id}" style="margin-top:var(--space-2)"></div>
          </div>
        `;

      case 'signature':
        return `
          <div class="form-group">
            <label class="form-label">${escapeHtml(item.label)} ${item.is_required ? '<span style="color:var(--red)">*</span>' : ''}</label>
            <div class="signature-pad-container">
              <canvas class="signature-pad" id="sig-${item.id}" data-item-id="${item.id}"></canvas>
              <div class="signature-actions">
                <button type="button" class="btn btn-ghost btn-sm" onclick="app.clearSignature(${item.id})">Limpar</button>
              </div>
            </div>
          </div>
        `;

      default:
        return `<div class="form-group"><label class="form-label">${escapeHtml(item.label)}</label><input type="text" class="form-input" data-item-id="${item.id}" value="${escapeHtml(value)}"></div>`;
    }
  }

  async saveChecklistResponses(checklistId, finalize) {
    const form = document.getElementById('checklist-response-form');
    const user = db.getCurrentUser();
    const saves = [];

    form.querySelectorAll('[data-item-id]').forEach(el => {
      let value = '';
      if (el.type === 'checkbox') {
        value = el.checked ? 'true' : 'false';
      } else if (el.tagName === 'CANVAS') {
        value = el.toDataURL ? el.toDataURL() : '';
      } else {
        value = el.value;
      }

      if (value || el.type === 'checkbox') {
        saves.push(db.addResponse({
          checklist_id: checklistId,
          item_id: parseInt(el.dataset.itemId),
          responded_by: user ? user.id : null,
          value: value,
        }));
      }
    });

    await Promise.all(saves);

    if (finalize) {
      await db.updateChecklist(checklistId, { status: 'completed' });
      showToast('Checklist finalizado com sucesso!', 'success');
    } else {
      showToast('Rascunho salvo!', 'info');
    }

    await this.renderChecklistDetail(checklistId);
  }

  handleImageUpload(input, itemId) {
    const file = input.files[0];
    if (!file) return;

    // Validate file type by MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Tipo de arquivo inválido. Use JPG, PNG, GIF ou WEBP.', 'error');
      input.value = '';
      return;
    }

    // Validate file size (max 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Arquivo muito grande. Máximo permitido: 5 MB.', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById(`preview-${itemId}`);
      if (preview) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.cssText = 'max-width:200px;border-radius:var(--radius-md);border:1px solid var(--glass-border);';
        img.alt = 'Imagem anexada';
        preview.textContent = '';
        preview.appendChild(img);
      }
    };
    reader.readAsDataURL(file);
  }

  clearSignature(itemId) {
    const canvas = document.getElementById(`sig-${itemId}`);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  async deleteChecklist(id) {
    const user = db.getCurrentUser();
    if (!user || !['admin', 'supervisor'].includes(user.role)) {
      showToast('Sem permissão para excluir checklists.', 'error');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este checklist?')) {
      await db.deleteChecklist(id);
      showToast('Checklist excluído.', 'warning');
      router.navigate('/checklists');
    }
  }

  // ── Checklist Form (Create/Edit) ────────────────────
  async renderChecklistForm(editId) {
    const content = document.getElementById('page-content');
    this._showLoading();

    const sectors = db.getSectors();
    const isEdit = !!editId;

    const [users, cl] = await Promise.all([
      db.getUsers(),
      isEdit ? db.getChecklistById(editId) : Promise.resolve(null),
    ]);
    const existingItems = isEdit ? await db.getChecklistItems(editId) : [];

    content.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-ghost btn-sm mb-2" onclick="router.navigate('/checklists')">
            ${Icons.chevronLeft} Voltar
          </button>
          <h1 class="page-title">${isEdit ? 'Editar Checklist' : 'Novo Checklist'}</h1>
        </div>
      </div>

      <div class="glass-card p-6">
        <form id="checklist-form" onsubmit="app.handleChecklistSave(event, ${editId || 'null'})">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);">
            <div class="form-group">
              <label class="form-label">Título *</label>
              <input type="text" class="form-input" id="cl-title" required value="${cl ? escapeHtml(cl.title) : ''}" placeholder="Ex: Inspeção de Segurança">
            </div>
            <div class="form-group">
              <label class="form-label">Setor *</label>
              <select class="form-select" id="cl-sector" required>
                <option value="">Selecione...</option>
                ${sectors.map(s => `<option value="${s.id}" ${cl && cl.sector_id === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Responsável</label>
              <select class="form-select" id="cl-assignee">
                <option value="">Selecione...</option>
                ${users.map(u => `<option value="${u.id}" ${cl && cl.assigned_to === u.id ? 'selected' : ''}>${escapeHtml(u.name)} (${u.role})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridade</label>
              <select class="form-select" id="cl-priority">
                <option value="low" ${cl && cl.priority === 'low' ? 'selected' : ''}>Baixa</option>
                <option value="medium" ${cl && cl.priority === 'medium' ? 'selected' : ''} ${!cl ? 'selected' : ''}>Média</option>
                <option value="high" ${cl && cl.priority === 'high' ? 'selected' : ''}>Alta</option>
                <option value="critical" ${cl && cl.priority === 'critical' ? 'selected' : ''}>Crítica</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Recorrência</label>
              <select class="form-select" id="cl-recurrence">
                <option value="none" ${cl && cl.recurrence === 'none' ? 'selected' : ''}>Único</option>
                <option value="daily" ${cl && cl.recurrence === 'daily' ? 'selected' : ''}>Diário</option>
                <option value="weekly" ${cl && cl.recurrence === 'weekly' ? 'selected' : ''}>Semanal</option>
                <option value="monthly" ${cl && cl.recurrence === 'monthly' ? 'selected' : ''}>Mensal</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prazo</label>
              <input type="date" class="form-input" id="cl-due-date" value="${cl ? cl.due_date.split('T')[0] : ''}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea class="form-textarea" id="cl-description" placeholder="Descreva o checklist...">${cl ? escapeHtml(cl.description) : ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-checkbox-group">
              <input type="checkbox" class="form-checkbox" id="cl-is-template" ${cl && cl.is_template ? 'checked' : ''}>
              <span>Salvar como Template reutilizável</span>
            </label>
          </div>

          <!-- Dynamic Fields -->
          <div style="border-top:1px solid var(--glass-border);padding-top:var(--space-6);margin-top:var(--space-6);">
            <div class="flex-between mb-4">
              <h3 class="chart-card-title">Campos do Checklist</h3>
              <div class="flex gap-2">
                <button type="button" class="btn btn-ghost btn-sm" onclick="app.addField('checkbox')">+ Checkbox</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="app.addField('text')">+ Texto</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="app.addField('image')">+ Imagem</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="app.addField('signature')">+ Assinatura</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="app.addField('datetime')">+ Data/Hora</button>
              </div>
            </div>
            <div id="dynamic-fields">
              ${existingItems.map((item, idx) => this.renderDynamicField(idx, item.field_type, item.label, item.is_required)).join('')}
            </div>
          </div>

          <div class="flex gap-3" style="justify-content:flex-end;margin-top:var(--space-6);">
            <button type="button" class="btn btn-secondary" onclick="router.navigate('/checklists')">Cancelar</button>
            <button type="submit" class="btn btn-primary">${Icons.check} ${isEdit ? 'Salvar Alterações' : 'Criar Checklist'}</button>
          </div>
        </form>
      </div>
    `;

    this.fieldCounter = existingItems.length;
  }

  addField(type) {
    this.fieldCounter = (this.fieldCounter || 0) + 1;
    const container = document.getElementById('dynamic-fields');
    const typeLabels = {
      checkbox: 'Item de verificação',
      text: 'Campo de texto',
      image: 'Upload de imagem',
      signature: 'Assinatura digital',
      datetime: 'Data e hora',
    };

    container.insertAdjacentHTML('beforeend', this.renderDynamicField(this.fieldCounter, type, typeLabels[type], true));
  }

  renderDynamicField(idx, type, label, required) {
    const typeIcons = { checkbox: '☑️', text: '📝', image: '📷', signature: '✍️', datetime: '📅' };
    return `
      <div class="glass-card p-4 mb-4 animate-scale-in" id="field-${idx}" style="border-left: 3px solid var(--purple);">
        <div class="flex-between mb-2">
          <div class="flex gap-2" style="align-items:center;">
            <span>${typeIcons[type] || '📋'}</span>
            <span class="badge badge-purple">${type}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('field-${idx}').remove()" style="color:var(--red)">
            ${Icons.trash}
          </button>
        </div>
        <div class="flex gap-3">
          <input type="text" class="form-input" value="${escapeHtml(label)}" placeholder="Nome do campo" data-field-label>
          <input type="hidden" value="${type}" data-field-type>
          <label class="form-checkbox-group" style="white-space:nowrap;">
            <input type="checkbox" class="form-checkbox" ${required ? 'checked' : ''} data-field-required>
            <span class="text-sm">Obrigatório</span>
          </label>
        </div>
      </div>
    `;
  }

  async handleChecklistSave(e, editId) {
    e.preventDefault();
    const user = db.getCurrentUser();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;

    const data = {
      title: document.getElementById('cl-title').value,
      description: document.getElementById('cl-description').value,
      sector_id: parseInt(document.getElementById('cl-sector').value),
      assigned_to: parseInt(document.getElementById('cl-assignee').value) || (user ? user.id : null),
      priority: document.getElementById('cl-priority').value,
      recurrence: document.getElementById('cl-recurrence').value,
      due_date: document.getElementById('cl-due-date').value ? new Date(document.getElementById('cl-due-date').value).toISOString() : daysFromNow(7),
      is_template: document.getElementById('cl-is-template').checked,
      created_by: user ? user.id : null,
    };

    // Collect dynamic fields
    const fields = [];
    document.querySelectorAll('#dynamic-fields > div').forEach(el => {
      const label = el.querySelector('[data-field-label]');
      const type = el.querySelector('[data-field-type]');
      const required = el.querySelector('[data-field-required]');
      if (label && type) {
        fields.push({
          label: label.value,
          field_type: type.value,
          is_required: required ? required.checked : false,
          value: '',
        });
      }
    });

    try {
      if (editId) {
        await db.updateChecklist(editId, data);
        const oldItems = await db.getChecklistItems(editId);
        await Promise.all(oldItems.map(i => db.deleteChecklistItem(i.id)));
        await Promise.all(fields.map((f, idx) =>
          db.createChecklistItem({ ...f, checklist_id: editId, order_index: idx })
        ));
        showToast('Checklist atualizado com sucesso!', 'success');
      } else {
        data.items = fields;
        await db.createChecklist(data);
        showToast('Checklist criado com sucesso!', 'success');
      }
      router.navigate('/checklists');
    } catch (err) {
      showToast('Erro ao salvar checklist.', 'error');
      console.error('[CheckFlow] handleChecklistSave:', err?.message || err);
    } finally {
      btn.disabled = false;
    }
  }

  // ── Templates ───────────────────────────────────────
  async renderTemplates() {
    const content = document.getElementById('page-content');
    this._showLoading();

    const templates = await db.getChecklists({ is_template: true });

    const templateCards = await Promise.all(templates.map(async t => {
      const sector = db.getSectorById(t.sector_id);
      const items = await db.getChecklistItems(t.id);
      return `
        <div class="glass-card checklist-card animate-slide-up">
          <div class="checklist-card-gradient" style="background: ${sector ? sector.gradient : 'var(--gradient-purple-blue)'}"></div>
          <div class="checklist-card-header">
            <div>
              <div class="checklist-card-title">${escapeHtml(t.title)}</div>
              <div class="checklist-card-sector">${sector ? escapeHtml(sector.icon) + ' ' + escapeHtml(sector.name) : ''}</div>
            </div>
            <span class="badge badge-purple">${Icons.template} Template</span>
          </div>
          <div class="text-sm text-muted mb-4">${items.length} campos configurados</div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" onclick="app.useTemplate('${t.id}')">Usar Template</button>
            <button class="btn btn-ghost btn-sm" onclick="router.navigate('/checklists/${t.id}')">Ver</button>
          </div>
        </div>
      `;
    }));

    content.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-ghost btn-sm mb-2" onclick="router.navigate('/checklists')">
            ${Icons.chevronLeft} Voltar
          </button>
          <h1 class="page-title">Templates</h1>
          <p class="page-subtitle">Modelos reutilizáveis por setor</p>
        </div>
        <button class="btn btn-primary" onclick="router.navigate('/checklists/new')">
          ${Icons.plus} Novo Template
        </button>
      </div>

      <div class="checklist-grid stagger">
        ${templateCards.join('')}
      </div>
    `;
  }

  async useTemplate(templateId) {
    const template = await db.getChecklistById(templateId);
    if (!template) return;

    const items = await db.getChecklistItems(templateId);
    const newCl = await db.createChecklist({
      ...template,
      id: undefined,
      title: template.title + ' (Cópia)',
      is_template: false,
      status: 'pending',
      items: items.map(i => ({
        label: i.label,
        field_type: i.field_type,
        is_required: i.is_required,
        value: '',
      })),
      created_by: db.getCurrentUser()?.id || null,
    });

    showToast('Checklist criado a partir do template!', 'success');
    router.navigate('/checklists/' + newCl.id);
  }

  // ── Sectors ─────────────────────────────────────────
  async renderSectors(params) {
    const content = document.getElementById('page-content');

    if (params && params[0]) {
      await this.renderSectorDetail(params[0]);
      return;
    }

    this._showLoading();

    const sectors = db.getSectors();

    const sectorCards = await Promise.all(sectors.map(async s => {
      const checklists = await db.getChecklists({ sector_id: s.id, is_template: false });
      const completed = checklists.filter(c => c.status === 'completed').length;
      const overdue = checklists.filter(c => c.status === 'overdue').length;
      return `
        <div class="glass-card sector-card animate-slide-up" onclick="router.navigate('/sectors/${s.slug}')" style="cursor:pointer">
          <div style="position:absolute;inset:0;opacity:0.06;background:${s.gradient};border-radius:inherit;"></div>
          <div class="sector-card-icon" style="background:${s.gradient.replace('135deg', '135deg').replace(')', ', 0.15)')}">${s.icon}</div>
          <div class="sector-card-name">${escapeHtml(s.name)}</div>
          <div class="sector-card-count">${checklists.length} checklists</div>
          <div class="flex gap-2 mt-2" style="justify-content:center;position:relative;z-index:1;">
            <span class="badge badge-green">${completed} ✓</span>
            ${overdue > 0 ? `<span class="badge badge-red">${overdue} !</span>` : ''}
          </div>
        </div>
      `;
    }));

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Setores</h1>
          <p class="page-subtitle">Visão geral de todos os setores operacionais</p>
        </div>
      </div>

      <div class="sector-grid stagger">
        ${sectorCards.join('')}
      </div>
    `;
  }

  async renderSectorDetail(slug) {
    const content = document.getElementById('page-content');
    this._showLoading();

    const sector = db.getSectorBySlug(slug);
    if (!sector) {
      content.innerHTML = '<div class="empty-state"><h3>Setor não encontrado</h3></div>';
      return;
    }

    const checklists = await db.getChecklists({ sector_id: sector.id, is_template: false });
    const cardsHtml = await this._buildChecklistCards(checklists);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn-ghost btn-sm mb-2" onclick="router.navigate('/sectors')">
            ${Icons.chevronLeft} Voltar
          </button>
          <h1 class="page-title">${sector.icon} ${escapeHtml(sector.name)}</h1>
          <p class="page-subtitle">${escapeHtml(sector.description)} — ${checklists.length} checklists</p>
        </div>
        <button class="btn btn-primary" onclick="router.navigate('/checklists/new')">
          ${Icons.plus} Novo Checklist
        </button>
      </div>

      <div class="checklist-grid stagger">
        ${cardsHtml}
      </div>
    `;
  }

  // ── Users Management ────────────────────────────────
  async renderUsers() {
    const content = document.getElementById('page-content');
    this._showLoading();

    const [users, sectors] = await Promise.all([
      db.getUsers(),
      Promise.resolve(db.getSectors()),
    ]);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuários</h1>
          <p class="page-subtitle">${users.length} usuários registrados</p>
        </div>
        <button class="btn btn-primary" onclick="app.showUserModal()">
          ${Icons.plus} Novo Usuário
        </button>
      </div>

      <div class="glass-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Setores</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <div class="flex gap-3" style="align-items:center">
                      <div class="sidebar-user-avatar" style="width:32px;height:32px;font-size:12px">${getUserInitials(u.name)}</div>
                      <span class="font-semibold" style="color:var(--text-primary)">${escapeHtml(u.name)}</span>
                    </div>
                  </td>
                  <td>${escapeHtml(u.email)}</td>
                  <td>
                    <span class="badge ${u.role === 'admin' ? 'badge-purple' : u.role === 'supervisor' ? 'badge-blue' : 'badge-gray'}">
                      ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-1 flex-wrap">
                      ${(u.sectors || []).slice(0, 3).map(sid => {
                        const s = sectors.find(x => x.id === sid);
                        return s ? `<span class="badge badge-gray">${s.icon}</span>` : '';
                      }).join('')}
                      ${(u.sectors || []).length > 3 ? `<span class="badge badge-gray">+${u.sectors.length - 3}</span>` : ''}
                    </div>
                  </td>
                  <td>${formatDate(u.created_at)}</td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-ghost btn-sm" data-tooltip="Editar" onclick="app.showUserModal('${u.id}')">${Icons.edit}</button>
                      <button class="btn btn-ghost btn-sm" style="color:var(--red)" data-tooltip="Excluir" onclick="app.deleteUserConfirm('${u.id}')">${Icons.trash}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async showUserModal(userId) {
    const currentUser = db.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Apenas administradores podem gerenciar usuários.', 'error');
      return;
    }

    const [user, sectors] = await Promise.all([
      userId ? db.getUserById(userId) : Promise.resolve(null),
      Promise.resolve(db.getSectors()),
    ]);

    document.getElementById('modal-title').textContent = user ? 'Editar Usuário' : 'Novo Usuário';
    document.getElementById('modal-body').innerHTML = `
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input type="text" class="form-input" id="user-name" value="${user ? escapeHtml(user.name) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input type="email" class="form-input" id="user-email" value="${user ? escapeHtml(user.email) : ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Senha ${user ? '(deixe vazio para manter)' : ''}</label>
        <input type="password" class="form-input" id="user-password" value="" placeholder="••••••••" ${user ? '' : 'required'}>
      </div>
      <div class="form-group">
        <label class="form-label">Perfil</label>
        <select class="form-select" id="user-role">
          <option value="operator" ${user && user.role === 'operator' ? 'selected' : ''}>Operador</option>
          <option value="supervisor" ${user && user.role === 'supervisor' ? 'selected' : ''}>Supervisor</option>
          <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Setores</label>
        <div class="flex gap-2 flex-wrap">
          ${sectors.map(s => `
            <label class="form-checkbox-group" style="cursor:pointer">
              <input type="checkbox" class="form-checkbox" value="${s.id}" ${user && user.sectors && user.sectors.includes(s.id) ? 'checked' : ''}>
              <span class="text-sm">${s.icon} ${escapeHtml(s.name)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
    document.getElementById('modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal('modal-backdrop')">Cancelar</button>
      <button class="btn btn-primary" onclick="app.saveUser(${userId ? `'${userId}'` : 'null'})">${Icons.check} Salvar</button>
    `;

    openModal('modal-backdrop');
  }

  async saveUser(userId) {
    const name = document.getElementById('user-name').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const sectors = [];
    document.querySelectorAll('#modal-body .form-checkbox[value]').forEach(cb => {
      if (cb.checked) sectors.push(parseInt(cb.value));
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || name.trim().length < 2) {
      showToast('Nome deve ter ao menos 2 caracteres.', 'error');
      return;
    }
    if (!email || !emailRegex.test(email)) {
      showToast('E-mail inválido.', 'error');
      return;
    }
    if (password && password.length < 8) {
      showToast('A senha deve ter ao menos 8 caracteres.', 'error');
      return;
    }

    // Check for duplicate email (excluding current user on edit)
    const existing = await db.getUserByEmail(email);
    if (existing && existing.id !== userId) {
      showToast('Este e-mail já está cadastrado.', 'error');
      return;
    }

    try {
      if (userId) {
        const data = { name: name.trim(), email: email.trim().toLowerCase(), role, sectors };
        await db.updateUser(userId, data);
        showToast('Usuário atualizado!', 'success');
      } else {
        if (!password) {
          showToast('Defina uma senha.', 'error');
          return;
        }
        await db.createUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          sectors,
          avatar: null,
        });
        showToast('Usuário criado!', 'success');
      }

      closeModal('modal-backdrop');
      await this.renderUsers();
    } catch (err) {
      showToast('Erro ao salvar usuário: ' + (err.message || 'Tente novamente.'), 'error');
      console.error('[CheckFlow] saveUser:', err?.message || err);
    }
  }

  async deleteUserConfirm(userId) {
    const currentUser = db.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Apenas administradores podem excluir usuários.', 'error');
      return;
    }
    if (currentUser.id === userId) {
      showToast('Você não pode excluir sua própria conta.', 'error');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      await db.deleteUser(userId);
      showToast('Usuário excluído.', 'warning');
      await this.renderUsers();
    }
  }

  // ── Reports ─────────────────────────────────────────
  async renderReports() {
    const content = document.getElementById('page-content');
    this._showLoading();

    const sectors = db.getSectors();
    const [stats, checklists] = await Promise.all([
      db.getDashboardStats(),
      db.getChecklists({ is_template: false }),
    ]);

    const tableRows = await this._buildReportRows(checklists.slice(0, 20));

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Relatórios</h1>
          <p class="page-subtitle">Exportar dados e histórico completo</p>
        </div>
      </div>

      <!-- Report Filters -->
      <div class="glass-card p-6 mb-6">
        <h3 class="chart-card-title mb-4">Filtros do Relatório</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:var(--space-4);">
          <div class="form-group">
            <label class="form-label">Setor</label>
            <select class="form-select" id="report-sector">
              <option value="">Todos</option>
              ${sectors.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="report-status">
              <option value="">Todos</option>
              <option value="completed">Concluído</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="overdue">Atrasado</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data Inicial</label>
            <input type="date" class="form-input" id="report-from">
          </div>
          <div class="form-group">
            <label class="form-label">Data Final</label>
            <input type="date" class="form-input" id="report-to">
          </div>
        </div>
        <div class="flex gap-3" style="margin-top:var(--space-4);">
          <button class="btn btn-primary" onclick="app.generateReport()">
            ${Icons.barChart} Gerar Relatório
          </button>
          <button class="btn btn-secondary" onclick="app.exportReportCSV()">
            ${Icons.download} Exportar CSV
          </button>
          <button class="btn btn-secondary" onclick="exportToPDF()">
            ${Icons.download} Exportar PDF
          </button>
        </div>
      </div>

      <!-- Report Preview -->
      <div class="glass-card p-6" id="report-preview">
        <h3 class="chart-card-title mb-4">Resumo Geral</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:var(--space-4);margin-bottom:var(--space-6);">
          <div class="text-center">
            <div style="font-size:var(--text-3xl);font-weight:700;color:var(--purple)">${stats.total}</div>
            <div class="text-sm text-muted">Total</div>
          </div>
          <div class="text-center">
            <div style="font-size:var(--text-3xl);font-weight:700;color:var(--green)">${stats.completed}</div>
            <div class="text-sm text-muted">Concluídos</div>
          </div>
          <div class="text-center">
            <div style="font-size:var(--text-3xl);font-weight:700;color:var(--orange)">${stats.pending}</div>
            <div class="text-sm text-muted">Pendentes</div>
          </div>
          <div class="text-center">
            <div style="font-size:var(--text-3xl);font-weight:700;color:var(--red)">${stats.overdue}</div>
            <div class="text-sm text-muted">Atrasados</div>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table" id="report-table">
            <thead>
              <tr>
                <th>Checklist</th>
                <th>Setor</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async _buildReportRows(checklists) {
    const rows = await Promise.all(checklists.map(async cl => {
      const sector = db.getSectorById(cl.sector_id);
      const [assignee, risk] = await Promise.all([
        db.getUserById(cl.assigned_to),
        db.calculateRiskScore(cl),
      ]);
      return `
        <tr>
          <td style="color:var(--text-primary);font-weight:500">${escapeHtml(cl.title)}</td>
          <td>${sector ? escapeHtml(sector.icon) + ' ' + escapeHtml(sector.name) : ''}</td>
          <td>${getStatusBadge(cl.status)}</td>
          <td>${getPriorityBadge(cl.priority)}</td>
          <td>${assignee ? escapeHtml(assignee.name) : 'N/A'}</td>
          <td>${formatDate(cl.due_date)}</td>
          <td>
            <span style="color:${risk > 6 ? 'var(--red)' : risk > 3 ? 'var(--orange)' : 'var(--green)'};font-weight:600">${risk.toFixed(1)}</span>
          </td>
        </tr>
      `;
    }));
    return rows.join('');
  }

  async generateReport() {
    const sector = document.getElementById('report-sector').value;
    const status = document.getElementById('report-status').value;
    const dateFrom = document.getElementById('report-from').value;
    const dateTo = document.getElementById('report-to').value;

    const filters = { is_template: false };
    if (sector) filters.sector_id = sector;
    if (status) filters.status = status;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;

    const tbody = document.querySelector('#report-table tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:1rem;color:var(--text-tertiary);">Gerando...</td></tr>';

    const data = await db.getChecklists(filters);
    const rows = await this._buildReportRows(data);
    if (tbody) tbody.innerHTML = rows;

    showToast(`Relatório gerado: ${data.length} registros.`, 'success');
  }

  async exportReportCSV() {
    const checklists = await db.getChecklists({ is_template: false });
    const exportData = await Promise.all(checklists.map(async cl => {
      const sector = db.getSectorById(cl.sector_id);
      const [assignee, risk] = await Promise.all([
        db.getUserById(cl.assigned_to),
        db.calculateRiskScore(cl),
      ]);
      return {
        Titulo: cl.title,
        Setor: sector ? sector.name : '',
        Status: cl.status,
        Prioridade: cl.priority,
        Responsavel: assignee ? assignee.name : '',
        Prazo: formatDate(cl.due_date),
        Risco: risk.toFixed(1),
        Criado: formatDate(cl.created_at),
      };
    }));
    exportToCSV(exportData, 'checkflow_relatorio');
  }

  // ── Notifications ───────────────────────────────────
  async renderNotifications() {
    const content = document.getElementById('page-content');
    this._showLoading();

    const user = db.getCurrentUser();
    const notifications = user ? await db.getNotifications(user.id) : [];

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Notificações</h1>
          <p class="page-subtitle">${notifications.filter(n => !n.is_read).length} não lidas</p>
        </div>
        <button class="btn btn-secondary" onclick="app.markAllRead()">
          ${Icons.check} Marcar todas como lidas
        </button>
      </div>

      <div class="glass-card">
        <div class="notification-list p-4">
          ${notifications.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🔔</div>
              <h3 class="empty-state-title">Sem notificações</h3>
              <p class="empty-state-text">Você está em dia!</p>
            </div>
          ` : notifications.map(n => `
            <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="app.readNotification('${n.id}', ${n.related_checklist_id || 'null'})">
              <div class="notification-icon ${n.type === 'critical' || n.type === 'overdue' ? 'critical' : n.type === 'warning' ? 'warning' : n.type === 'info' ? 'info' : 'success'}">
                ${n.type === 'critical' || n.type === 'overdue' ? Icons.alertTriangle :
                  n.type === 'warning' ? Icons.alertTriangle :
                  Icons.info}
              </div>
              <div class="notification-content">
                <div class="notification-title">${escapeHtml(n.title)}</div>
                <div class="notification-message">${escapeHtml(n.message)}</div>
                <div class="notification-time">${formatRelativeTime(n.created_at)}</div>
              </div>
              <div>
                ${getPriorityBadge(n.priority)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  async readNotification(id, checklistId) {
    await db.markNotificationRead(id);
    if (checklistId) {
      router.navigate('/checklists/' + checklistId);
    } else {
      await this.renderNotifications();
    }
  }

  async markAllRead() {
    const user = db.getCurrentUser();
    if (user) {
      await db.markAllNotificationsRead(user.id);
      await this.renderNotifications();
      await this.renderLayout();
      router.navigate('/notifications');
      showToast('Todas as notificações foram marcadas como lidas.', 'success');
    }
  }

  // ── Audit Logs ──────────────────────────────────────
  async renderAudit() {
    const content = document.getElementById('page-content');
    this._showLoading();

    const logs = await db.getAuditLogs(50);

    // Batch fetch unique users
    const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const users = await Promise.all(userIds.map(id => db.getUserById(id)));
    const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));

    const actionColors = {
      CREATE: 'badge-green',
      COMPLETE: 'badge-green',
      LOGIN: 'badge-blue',
      UPDATE: 'badge-orange',
      DELETE: 'badge-red',
      EXPORT: 'badge-purple',
      LOGOUT: 'badge-gray',
    };

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Logs de Auditoria</h1>
          <p class="page-subtitle">Histórico completo de ações do sistema</p>
        </div>
        <button class="btn btn-secondary" onclick="app.exportAuditCSV()">
          ${Icons.download} Exportar
        </button>
      </div>

      <div class="glass-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => {
                const u = userMap[log.user_id];
                const colorClass = Object.entries(actionColors).find(([k]) => log.action.includes(k))?.[1] || 'badge-gray';
                return `
                  <tr>
                    <td class="text-xs">${formatDateTime(log.created_at)}</td>
                    <td>
                      <div class="flex gap-2" style="align-items:center">
                        <div class="sidebar-user-avatar" style="width:24px;height:24px;font-size:10px">${u ? getUserInitials(u.name) : '?'}</div>
                        <span>${u ? escapeHtml(u.name) : 'Sistema'}</span>
                      </div>
                    </td>
                    <td><span class="badge ${colorClass}">${escapeHtml(log.action)}</span></td>
                    <td>${escapeHtml(log.details)}</td>
                    <td class="text-xs text-muted">${log.ip_address || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ── Settings ────────────────────────────────────────
  renderSettings() {
    const content = document.getElementById('page-content');
    const user = db.getCurrentUser();
    if (!user || user.role !== 'admin') {
      content.innerHTML = '<div class="empty-state"><h3>Acesso negado</h3></div>';
      return;
    }

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Configurações</h1>
          <p class="page-subtitle">Configurações administrativas do sistema</p>
        </div>
      </div>

      <div class="glass-card p-6 mb-6">
        <h3 class="chart-card-title mb-4">Segurança</h3>
        <div class="form-group">
          <label class="form-label">Autenticação</label>
          <p class="text-sm text-muted">Autenticação gerenciada pelo Supabase Auth com suporte a sessões persistentes e refresh automático de tokens.</p>
        </div>
        <div class="form-group">
          <label class="form-label">Rate limiting de login</label>
          <p class="text-sm text-muted">Após 5 tentativas falhas, o acesso é bloqueado por 5 minutos.</p>
        </div>
        <div class="form-group">
          <label class="form-label">Segurança de dados</label>
          <p class="text-sm text-muted">Dados protegidos por Row Level Security (RLS) no Supabase. Cada usuário acessa apenas seus próprios dados conforme o perfil de acesso.</p>
        </div>
      </div>

      <div class="glass-card p-6">
        <h3 class="chart-card-title mb-4">Dados</h3>
        <p class="text-sm text-muted mb-4">Para gerenciar dados diretamente, acesse o painel do Supabase.</p>
        <button class="btn btn-danger" onclick="app._confirmResetData()">
          Reiniciar todos os dados locais
        </button>
      </div>
    `;
  }

  async _confirmResetData() {
    if (confirm('Isso apagará todos os dados e reiniciará o sistema. Continuar?')) {
      await db.resetData();
      await this.renderLayout();
      router.navigate('/dashboard');
      showToast('Dados reiniciados.', 'warning');
    }
  }

  async exportAuditCSV() {
    const logs = await db.getAuditLogs(100);
    const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
    const users = await Promise.all(userIds.map(id => db.getUserById(id)));
    const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));

    const data = logs.map(log => ({
      Data: formatDateTime(log.created_at),
      Usuario: userMap[log.user_id] ? userMap[log.user_id].name : 'Sistema',
      Acao: log.action,
      Detalhes: log.details,
      IP: log.ip_address || '',
    }));
    exportToCSV(data, 'checkflow_auditoria');
  }
}

// Initialize on DOM ready
const app = new CheckFlowApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init().catch(err => {
    console.error('[CheckFlow] Erro na inicialização:', err?.message || err);
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1.5rem;font-family:'Inter',sans-serif;padding:2rem;text-align:center;">
          <div style="font-size:3rem;">⚠️</div>
          <h2 style="color:#f87171;margin:0;font-size:1.25rem;">Erro ao conectar</h2>
          <p style="color:rgba(240,240,248,0.5);margin:0;max-width:360px;font-size:0.875rem;">
            Não foi possível inicializar o sistema. Verifique sua conexão com a internet e tente novamente.
          </p>
          <button onclick="location.reload()" style="padding:0.625rem 1.5rem;background:linear-gradient(135deg,#8b5cf6,#3b82f6);border:none;border-radius:8px;color:#fff;font-size:0.875rem;cursor:pointer;font-family:inherit;">
            Tentar novamente
          </button>
        </div>
      `;
    }
  });
});
