import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditFilters {
  userId?: string;
  action?: string;
  tableName?: string;
  startDate?: string;
  endDate?: string;
}

const TABLE_LABELS: Record<string, string> = {
  sales: 'Vendas',
  cash_sessions: 'Sessões de Caixa',
  cash_movements: 'Movimentações de Caixa',
  employees: 'Funcionários',
  loans: 'Empréstimos',
  menu_items: 'Cardápio',
  products: 'Produtos',
  coupons: 'Cupons',
  loyalty_points: 'Pontos de Fidelidade',
  bills: 'Contas',
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Inserção',
  UPDATE: 'Edição',
  DELETE: 'Exclusão',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  EXPORT: 'Exportação',
  PRINT: 'Impressão',
  VIEW_REPORT: 'Visualização de Relatório',
};

export function useAuditLogs(filters: AuditFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['audit_logs', user?.id, filters],
    queryFn: async () => {
      let query = (supabase.from('audit_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.tableName) query = query.eq('table_name', filters.tableName);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59');

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!user,
  });
}

export function formatAuditDescription(log: AuditLog): string {
  const user = log.user_email?.split('@')[0] || 'Sistema';
  const table = TABLE_LABELS[log.table_name || ''] || log.table_name || '';
  const action = ACTION_LABELS[log.action] || log.action;

  if (log.action === 'DELETE' && log.table_name === 'sales') {
    const amount = log.old_value?.total_amount;
    return `${user} excluiu venda #${log.record_id?.substring(0, 8)} de R$${amount || '?'}`;
  }
  if (log.action === 'UPDATE' && log.table_name === 'menu_items') {
    const oldPrice = log.old_value?.sale_price;
    const newPrice = log.new_value?.sale_price;
    if (oldPrice !== newPrice) {
      return `${user} alterou preço de "${log.new_value?.name}" de R$${oldPrice} para R$${newPrice}`;
    }
  }
  if (log.action === 'INSERT' && log.table_name === 'cash_sessions') {
    return `${user} abriu sessão de caixa`;
  }

  return `${user} realizou ${action.toLowerCase()} em ${table}`;
}

export function isSuspiciousEvent(log: AuditLog): boolean {
  // Sale deleted
  if (log.action === 'DELETE' && log.table_name === 'sales') return true;
  // Price changed
  if (log.action === 'UPDATE' && log.table_name === 'menu_items') {
    if (log.old_value?.sale_price !== log.new_value?.sale_price) return true;
  }
  // Cash session opened outside business hours (before 6am or after midnight)
  if (log.action === 'INSERT' && log.table_name === 'cash_sessions') {
    const hour = new Date(log.created_at).getHours();
    if (hour < 6 || hour >= 0 && hour < 5) return true;
  }
  return false;
}

export { TABLE_LABELS, ACTION_LABELS };
