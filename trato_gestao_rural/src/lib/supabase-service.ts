import { supabase } from './supabase';
import type { InsertTables, UpdateTables } from '@/integrations/supabase/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function handleError(error: unknown, context: string): never {
  const msg = error instanceof Error ? error.message : String(error);
  throw new Error(`[${context}] ${msg}`);
}

// ── Properties ───────────────────────────────────────────────────────────────

export const propertiesService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('trato_properties')
      .select('*')
      .eq('user_id', userId)
      .order('nome');
    if (error) handleError(error, 'propertiesService.list');
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('trato_properties')
      .select('*')
      .eq('id', id)
      .single();
    if (error) handleError(error, 'propertiesService.getById');
    return data;
  },

  async create(property: InsertTables<'trato_properties'>) {
    const { data, error } = await supabase
      .from('trato_properties')
      .insert(property)
      .select('id')
      .single();
    if (error) handleError(error, 'propertiesService.create');
    return data;
  },

  async update(id: string, updates: UpdateTables<'trato_properties'>) {
    const { error } = await supabase
      .from('trato_properties')
      .update(updates)
      .eq('id', id);
    if (error) handleError(error, 'propertiesService.update');
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('trato_properties')
      .delete()
      .eq('id', id);
    if (error) handleError(error, 'propertiesService.delete');
  },
};

// ── Animals ──────────────────────────────────────────────────────────────────

export const animalsService = {
  async list(userId: string, filters?: { propertyId?: string; species?: string; status?: string }) {
    let query = supabase
      .from('trato_animals')
      .select('*')
      .eq('user_id', userId);

    if (filters?.propertyId) query = query.eq('property_id', filters.propertyId);
    if (filters?.species) query = query.eq('species', filters.species);
    if (filters?.status) query = query.eq('current_status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) handleError(error, 'animalsService.list');
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('trato_animals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) handleError(error, 'animalsService.getById');
    return data;
  },

  async getByEid(eid: string, userId: string) {
    const { data, error } = await supabase
      .from('trato_animals')
      .select('*')
      .eq('user_id', userId)
      .eq('eid', eid)
      .maybeSingle();
    if (error) handleError(error, 'animalsService.getByEid');
    return data;
  },

  async create(animal: InsertTables<'trato_animals'>) {
    const { data, error } = await supabase
      .from('trato_animals')
      .insert(animal)
      .select('id')
      .single();
    if (error) handleError(error, 'animalsService.create');
    return data;
  },

  async update(id: string, updates: UpdateTables<'trato_animals'>) {
    const { error } = await supabase
      .from('trato_animals')
      .update(updates)
      .eq('id', id);
    if (error) handleError(error, 'animalsService.update');
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('trato_animals')
      .delete()
      .eq('id', id);
    if (error) handleError(error, 'animalsService.delete');
  },
};

// ── Weighings ────────────────────────────────────────────────────────────────

export const weighingsService = {
  async list(userId: string, filters?: { animalId?: string; dateFrom?: string; dateTo?: string }) {
    let query = supabase
      .from('trato_weighings')
      .select('*')
      .eq('user_id', userId);

    if (filters?.animalId) query = query.eq('animal_id', filters.animalId);
    if (filters?.dateFrom) query = query.gte('weigh_date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('weigh_date', filters.dateTo);

    const { data, error } = await query.order('weigh_date', { ascending: false });
    if (error) handleError(error, 'weighingsService.list');
    return data ?? [];
  },

  async create(weighing: InsertTables<'trato_weighings'>) {
    const { data, error } = await supabase
      .from('trato_weighings')
      .insert(weighing)
      .select('id')
      .single();
    if (error) handleError(error, 'weighingsService.create');

    // Update animal's current weight
    await supabase
      .from('trato_animals')
      .update({ current_weight: weighing.weight_kg })
      .eq('id', weighing.animal_id);

    return data;
  },

  async createBatch(weighings: InsertTables<'trato_weighings'>[]) {
    const { data, error } = await supabase
      .from('trato_weighings')
      .insert(weighings)
      .select('id');
    if (error) handleError(error, 'weighingsService.createBatch');
    return data ?? [];
  },
};

// ── Treatments ───────────────────────────────────────────────────────────────

export const treatmentsService = {
  async list(userId: string, filters?: { animalId?: string; type?: string }) {
    let query = supabase
      .from('trato_treatments')
      .select('*')
      .eq('user_id', userId);

    if (filters?.animalId) query = query.eq('animal_id', filters.animalId);
    if (filters?.type) query = query.eq('type', filters.type);

    const { data, error } = await query.order('treatment_date', { ascending: false });
    if (error) handleError(error, 'treatmentsService.list');
    return data ?? [];
  },

  async create(treatment: InsertTables<'trato_treatments'>) {
    const { data, error } = await supabase
      .from('trato_treatments')
      .insert(treatment)
      .select('id')
      .single();
    if (error) handleError(error, 'treatmentsService.create');
    return data;
  },

  async getAnimalsInWithdrawal(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('trato_treatments')
      .select('*, trato_animals!inner(ear_tag, name, eid)')
      .eq('user_id', userId)
      .gte('withdrawal_end_date', today);
    if (error) handleError(error, 'treatmentsService.getAnimalsInWithdrawal');
    return data ?? [];
  },
};

// ── Milk Yields ──────────────────────────────────────────────────────────────

export const milkService = {
  async list(userId: string, filters?: { animalId?: string; dateFrom?: string; dateTo?: string }) {
    let query = supabase
      .from('trato_milk_yields')
      .select('*')
      .eq('user_id', userId);

    if (filters?.animalId) query = query.eq('animal_id', filters.animalId);
    if (filters?.dateFrom) query = query.gte('production_date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('production_date', filters.dateTo);

    const { data, error } = await query.order('production_date', { ascending: false });
    if (error) handleError(error, 'milkService.list');
    return data ?? [];
  },

  async create(record: InsertTables<'trato_milk_yields'>) {
    const { data, error } = await supabase
      .from('trato_milk_yields')
      .insert(record)
      .select('id')
      .single();
    if (error) handleError(error, 'milkService.create');
    return data;
  },
};

// ── Reproductive Events ──────────────────────────────────────────────────────

export const reproductionService = {
  async list(userId: string, animalId?: string) {
    let query = supabase
      .from('trato_reproductive_events')
      .select('*')
      .eq('user_id', userId);

    if (animalId) query = query.eq('animal_id', animalId);

    const { data, error } = await query.order('event_date', { ascending: false });
    if (error) handleError(error, 'reproductionService.list');
    return data ?? [];
  },

  async create(event: InsertTables<'trato_reproductive_events'>) {
    const { data, error } = await supabase
      .from('trato_reproductive_events')
      .insert(event)
      .select('id')
      .single();
    if (error) handleError(error, 'reproductionService.create');
    return data;
  },
};

// ── Transactions ─────────────────────────────────────────────────────────────

export const transactionsService = {
  async list(userId: string, filters?: { type?: string; dateFrom?: string; dateTo?: string; status?: string; instrumentId?: string; categoryId?: string }) {
    let query = supabase
      .from('trato_transactions')
      .select('*')
      .eq('user_id', userId);

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.instrumentId) query = query.eq('instrument_id', filters.instrumentId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.dateFrom) query = query.gte('txn_date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('txn_date', filters.dateTo);

    const { data, error } = await query.order('txn_date', { ascending: false });
    if (error) handleError(error, 'transactionsService.list');
    return data ?? [];
  },

  async create(transaction: InsertTables<'trato_transactions'>) {
    const { data, error } = await supabase
      .from('trato_transactions')
      .insert(transaction)
      .select('id')
      .single();
    if (error) handleError(error, 'transactionsService.create');
    return data;
  },

  async update(id: string, updates: UpdateTables<'trato_transactions'>) {
    const { error } = await supabase
      .from('trato_transactions')
      .update(updates)
      .eq('id', id);
    if (error) handleError(error, 'transactionsService.update');
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('trato_transactions')
      .delete()
      .eq('id', id);
    if (error) handleError(error, 'transactionsService.delete');
  },
};

// ── Stock ────────────────────────────────────────────────────────────────────

export const stockService = {
  async listProducts(userId: string) {
    const { data, error } = await supabase
      .from('trato_stock_products')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) handleError(error, 'stockService.listProducts');
    return data ?? [];
  },

  async createProduct(product: InsertTables<'trato_stock_products'>) {
    const { data, error } = await supabase
      .from('trato_stock_products')
      .insert(product)
      .select('id')
      .single();
    if (error) handleError(error, 'stockService.createProduct');
    return data;
  },

  async listMovements(userId: string, productId?: string) {
    let query = supabase
      .from('trato_stock_movements')
      .select('*')
      .eq('user_id', userId);

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query.order('movement_date', { ascending: false });
    if (error) handleError(error, 'stockService.listMovements');
    return data ?? [];
  },

  async createMovement(movement: InsertTables<'trato_stock_movements'>) {
    const { data, error } = await supabase
      .from('trato_stock_movements')
      .insert(movement)
      .select('id')
      .single();
    if (error) handleError(error, 'stockService.createMovement');
    return data;
  },
};

// ── Equipment ────────────────────────────────────────────────────────────────

export const equipmentService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('trato_equipment')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) handleError(error, 'equipmentService.list');
    return data ?? [];
  },

  async create(equipment: InsertTables<'trato_equipment'>) {
    const { data, error } = await supabase
      .from('trato_equipment')
      .insert(equipment)
      .select('id')
      .single();
    if (error) handleError(error, 'equipmentService.create');
    return data;
  },

  async addMaintenance(record: InsertTables<'trato_maintenance_records'>) {
    const { data, error } = await supabase
      .from('trato_maintenance_records')
      .insert(record)
      .select('id')
      .single();
    if (error) handleError(error, 'equipmentService.addMaintenance');
    return data;
  },

  async addUsage(record: InsertTables<'trato_usage_records'>) {
    const { data, error } = await supabase
      .from('trato_usage_records')
      .insert(record)
      .select('id')
      .single();
    if (error) handleError(error, 'equipmentService.addUsage');
    return data;
  },
};

// ── Audit Log ────────────────────────────────────────────────────────────────

export const auditService = {
  async log(entry: InsertTables<'trato_audit_log'>) {
    await supabase.from('trato_audit_log').insert(entry);
  },

  async list(userId: string, filters?: { module?: string; action?: string; limit?: number }) {
    let query = supabase
      .from('trato_audit_log')
      .select('*')
      .eq('user_id', userId);

    if (filters?.module) query = query.eq('module', filters.module);
    if (filters?.action) query = query.eq('action', filters.action);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters?.limit ?? 100);
    if (error) handleError(error, 'auditService.list');
    return data ?? [];
  },
};

// ── Notifications ────────────────────────────────────────────────────────────

export const notificationsService = {
  async list(userId: string, unreadOnly = false) {
    let query = supabase
      .from('trato_notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) query = query.eq('read', false);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) handleError(error, 'notificationsService.list');
    return data ?? [];
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('trato_notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) handleError(error, 'notificationsService.markAsRead');
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('trato_notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) handleError(error, 'notificationsService.markAllAsRead');
  },
};

// ── Sync Queue ───────────────────────────────────────────────────────────────

export const syncService = {
  async getPending(userId: string) {
    const { data, error } = await supabase
      .from('trato_sync_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('synced', false)
      .order('created_at');
    if (error) handleError(error, 'syncService.getPending');
    return data ?? [];
  },

  async markSynced(ids: string[]) {
    const { error } = await supabase
      .from('trato_sync_queue')
      .update({ synced: true, synced_at: new Date().toISOString() })
      .in('id', ids);
    if (error) handleError(error, 'syncService.markSynced');
  },

  async addToQueue(entry: InsertTables<'trato_sync_queue'>) {
    const { error } = await supabase
      .from('trato_sync_queue')
      .insert(entry);
    if (error) handleError(error, 'syncService.addToQueue');
  },
};
