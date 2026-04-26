import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank: string | null;
  agency: string | null;
  account: string | null;
  type: string;
  balance: number;
  active: boolean;
  created_at: string;
}

export interface BankStatement {
  id: string;
  user_id: string;
  bank_account_id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  transaction_id: string | null;
  status: string;
  imported_at: string;
}

export function useBankAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bank-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('bank_accounts')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as BankAccount[];
    },
    enabled: !!user,
  });
}

export function useCreateBankAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BankAccount>) => {
      const { data, error } = await (supabase as any)
        .from('bank_accounts')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Conta bancária criada!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });
}

export function useBankStatements(accountId?: string, startDate?: string, endDate?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bank-statements', user?.id, accountId, startDate, endDate],
    queryFn: async () => {
      let query = (supabase as any)
        .from('bank_statements')
        .select('*')
        .order('date', { ascending: false });
      if (accountId) query = query.eq('bank_account_id', accountId);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BankStatement[];
    },
    enabled: !!user,
  });
}

export function useImportStatements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Omit<BankStatement, 'id' | 'imported_at'>[]) => {
      const rows = items.map(i => ({ ...i, user_id: user!.id }));
      const { error } = await (supabase as any)
        .from('bank_statements')
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-statements'] });
      toast({ title: 'Extrato importado com sucesso!' });
    },
    onError: (err: any) => toast({ title: 'Erro ao importar', description: err.message, variant: 'destructive' }),
  });
}

export function useConciliateStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ statementId, transactionId, status }: { statementId: string; transactionId?: string; status: string }) => {
      const update: any = { status };
      if (transactionId) update.transaction_id = transactionId;
      const { error } = await (supabase as any)
        .from('bank_statements')
        .update(update)
        .eq('id', statementId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-statements'] });
    },
  });
}

// OFX Parser
export function parseOFX(content: string): { date: string; description: string; amount: number; type: string }[] {
  const transactions: { date: string; description: string; amount: number; type: string }[] = [];
  
  // Match STMTTRN blocks
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = trnRegex.exec(content)) !== null) {
    const block = match[1];
    const dtPosted = block.match(/<DTPOSTED>(\d{8})/)?.[1] || '';
    const trnAmt = block.match(/<TRNAMT>([-\d.]+)/)?.[1] || '0';
    const name = block.match(/<NAME>(.*?)(?:\r?\n|<)/)?.[1]?.trim() || '';
    const memo = block.match(/<MEMO>(.*?)(?:\r?\n|<)/)?.[1]?.trim() || '';
    
    const amount = parseFloat(trnAmt);
    const year = dtPosted.substring(0, 4);
    const month = dtPosted.substring(4, 6);
    const day = dtPosted.substring(6, 8);
    const date = `${year}-${month}-${day}`;
    
    transactions.push({
      date,
      description: name || memo || 'Sem descrição',
      amount: Math.abs(amount),
      type: amount >= 0 ? 'credito' : 'debito',
    });
  }
  
  return transactions;
}

// CSV Parser (expects: data,descricao,valor)
export function parseCSV(content: string): { date: string; description: string; amount: number; type: string }[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return [];
  
  return lines.slice(1).map(line => {
    const parts = line.split(/[;,]/).map(p => p.trim().replace(/^"|"$/g, ''));
    const [dateStr, description, amountStr] = parts;
    
    // Try parsing date in DD/MM/YYYY or YYYY-MM-DD
    let date = dateStr;
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    
    const amount = parseFloat(amountStr?.replace(',', '.') || '0');
    return {
      date,
      description: description || 'Sem descrição',
      amount: Math.abs(amount),
      type: amount >= 0 ? 'credito' : 'debito',
    };
  }).filter(t => t.date && !isNaN(t.amount));
}
