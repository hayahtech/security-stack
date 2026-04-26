import { useState, useMemo } from 'react';
import { useAssets, useLiabilities, useCreateAsset, useCreateLiability, useDeleteAsset, useDeleteLiability } from '@/hooks/useBalanceSheet';
import { useProducts } from '@/hooks/useProducts';
import { useLoans } from '@/hooks/useLoans';
import { useTransactions } from '@/hooks/useTransactions';
import { useEquipment, calcDepreciation } from '@/hooks/useEquipment';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { exportPDF } from '@/lib/export-utils';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const assetCategories = [
  { value: 'caixa', label: 'Caixa e Equivalentes' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'equipamento', label: 'Máquinas e Equipamentos' },
  { value: 'veiculo', label: 'Veículos' },
  { value: 'imovel', label: 'Imóveis' },
  { value: 'outro_ativo', label: 'Outros Ativos' },
];

const liabilityCategories = [
  { value: 'fornecedor', label: 'Fornecedores' },
  { value: 'emprestimo', label: 'Empréstimos' },
  { value: 'imposto', label: 'Impostos' },
  { value: 'salario', label: 'Salários' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'outro_passivo', label: 'Outros Passivos' },
  { value: 'capital', label: 'Capital Investido (PL)' },
];

interface SectionLineItem {
  label: string;
  value: number;
  id?: string;
  deletable?: boolean;
}

export default function BalanceSheetPage() {
  const { user } = useAuth();
  const { data: assets, isLoading: loadingAssets } = useAssets();
  const { data: liabilities, isLoading: loadingLiab } = useLiabilities();
  const { data: products } = useProducts();
  const { data: loans } = useLoans();
  const { data: transactions } = useTransactions({ scope: 'business' });
  const createAsset = useCreateAsset();
  const createLiability = useCreateLiability();
  const deleteAsset = useDeleteAsset();
  const deleteLiability = useDeleteLiability();

  // Bills receivable
  const { data: billsReceivable } = useQuery({
    queryKey: ['bills_receivable', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('bills').select('amount').eq('type', 'receber').eq('status', 'pending');
      if (error) throw error;
      return (data || []).reduce((s, b) => s + Number(b.amount), 0);
    },
    enabled: !!user,
  });

  // Bills payable (fornecedores)
  const { data: billsPayable } = useQuery({
    queryKey: ['bills_payable', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('bills').select('amount').eq('type', 'pagar').eq('status', 'pending');
      if (error) throw error;
      return (data || []).reduce((s, b) => s + Number(b.amount), 0);
    },
    enabled: !!user,
  });

  // Cash sessions balance
  const { data: cashBalance } = useQuery({
    queryKey: ['cash_balance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('cash_sessions').select('expected_balance, status').eq('status', 'aberto');
      if (error) throw error;
      return (data || []).reduce((s, cs) => s + Number(cs.expected_balance), 0);
    },
    enabled: !!user,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formSide, setFormSide] = useState<'asset' | 'liability'>('asset');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formType, setFormType] = useState('circulante');
  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const openForm = (side: 'asset' | 'liability') => {
    setFormSide(side);
    setFormName(''); setFormCategory(''); setFormType('circulante'); setFormValue(''); setFormDate(''); setFormNotes('');
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formName || !formCategory || !formValue) return;
    if (formSide === 'asset') {
      createAsset.mutate({ name: formName, category: formCategory, type: formType, value: parseFloat(formValue), acquisition_date: formDate || null, notes: formNotes || null });
    } else {
      createLiability.mutate({ name: formName, category: formCategory, type: formType, value: parseFloat(formValue), due_date: formDate || null, notes: formNotes || null });
    }
    setFormOpen(false);
  };

  // Computed values
  const stockValue = useMemo(() => (products || []).reduce((s, p) => s + Number(p.quantity_current) * Number(p.cost_price), 0), [products]);

  const loanCurrentInstallments = useMemo(() => {
    if (!loans) return 0;
    return loans.filter((l: any) => l.status === 'ativo').reduce((s: number, l: any) => s + Number(l.installment_amount), 0);
  }, [loans]);

  const loanLongTerm = useMemo(() => {
    if (!loans) return 0;
    return loans.filter((l: any) => l.status === 'ativo').reduce((s: number, l: any) => s + Math.max(0, Number(l.remaining_amount) - Number(l.installment_amount)), 0);
  }, [loans]);

  // Accumulated profit from transactions
  const accumulatedProfit = useMemo(() => {
    if (!transactions) return 0;
    const rev = transactions.filter(t => t.type === 'revenue' && t.status === 'paid').reduce((s, t) => s + Number(t.amount), 0);
    const exp = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + Number(t.amount), 0);
    return rev - exp;
  }, [transactions]);

  // Build balance sheet sections
  const manualAssetsCirc = (assets || []).filter(a => a.type === 'circulante');
  const manualAssetsNonCirc = (assets || []).filter(a => a.type === 'nao_circulante');
  const manualLiabCirc = (liabilities || []).filter(l => l.type === 'circulante' && l.category !== 'capital');
  const manualLiabNonCirc = (liabilities || []).filter(l => l.type === 'nao_circulante' && l.category !== 'capital');
  const capitalItems = (liabilities || []).filter(l => l.category === 'capital');

  // ATIVO
  const ativoCircItems: SectionLineItem[] = [
    { label: 'Caixa e equivalentes', value: cashBalance || 0 },
    { label: 'Estoque (custo)', value: stockValue },
    { label: 'Contas a receber', value: billsReceivable || 0 },
    ...manualAssetsCirc.map(a => ({ label: a.name, value: Number(a.value), id: a.id, deletable: true })),
  ];
  const totalAtivoCirc = ativoCircItems.reduce((s, i) => s + i.value, 0);

  // Equipment value from equipment module
  const { data: equipmentList } = useEquipment();
  const equipmentCurrentValue = useMemo(() => {
    if (!equipmentList) return 0;
    return equipmentList.filter(e => e.status !== 'baixado').reduce((s, e) => s + calcDepreciation(e).currentValue, 0);
  }, [equipmentList]);

  const ativoNonCircItems: SectionLineItem[] = [
    { label: 'Máquinas e Equipamentos', value: equipmentCurrentValue },
    ...manualAssetsNonCirc.map(a => ({ label: a.name, value: Number(a.value), id: a.id, deletable: true })),
  ];
  const totalAtivoNonCirc = ativoNonCircItems.reduce((s, i) => s + i.value, 0);
  const totalAtivo = totalAtivoCirc + totalAtivoNonCirc;

  // PASSIVO
  const passivoCircItems: SectionLineItem[] = [
    { label: 'Fornecedores (contas a pagar)', value: billsPayable || 0 },
    { label: 'Empréstimos (parcela corrente)', value: loanCurrentInstallments },
    ...manualLiabCirc.map(l => ({ label: l.name, value: Number(l.value), id: l.id, deletable: true })),
  ];
  const totalPassivoCirc = passivoCircItems.reduce((s, i) => s + i.value, 0);

  const passivoNonCircItems: SectionLineItem[] = [
    { label: 'Empréstimos (longo prazo)', value: loanLongTerm },
    ...manualLiabNonCirc.map(l => ({ label: l.name, value: Number(l.value), id: l.id, deletable: true })),
  ];
  const totalPassivoNonCirc = passivoNonCircItems.reduce((s, i) => s + i.value, 0);

  // PL
  const capitalTotal = capitalItems.reduce((s, l) => s + Number(l.value), 0);
  const plItems: SectionLineItem[] = [
    ...capitalItems.map(l => ({ label: l.name, value: Number(l.value), id: l.id, deletable: true })),
    { label: 'Lucros acumulados', value: accumulatedProfit },
  ];
  const totalPL = plItems.reduce((s, i) => s + i.value, 0);

  const totalPassivoPL = totalPassivoCirc + totalPassivoNonCirc + totalPL;
  const balanced = Math.abs(totalAtivo - totalPassivoPL) < 0.01;

  const isLoading = loadingAssets || loadingLiab;
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const renderSection = (title: string, items: SectionLineItem[], total: number, onDelete?: (id: string) => void) => (
    <div className="space-y-1">
      <p className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 text-sm">
          <span>{item.label}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{fmt(item.value)}</span>
            {item.deletable && item.id && onDelete && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm('Remover item?')) onDelete(item.id!); }}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-between py-1 px-2 border-t font-semibold text-sm">
        <span>Total</span>
        <span className="font-mono">{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" id="balance-sheet">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Balanço Patrimonial</h1>
          <p className="text-sm text-muted-foreground">Posição patrimonial simplificada</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPDF('balance-sheet', 'balanco-patrimonial')}>
            <Download className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Balance check */}
      {balanced ? (
        <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 gap-1">
          <CheckCircle className="h-3 w-3" /> Balanço equilibrado
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Diferença de {fmt(Math.abs(totalAtivo - totalPassivoPL))}
        </Badge>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATIVO */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">ATIVO</CardTitle>
              <Button variant="outline" size="sm" onClick={() => openForm('asset')}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderSection('Ativo Circulante', ativoCircItems, totalAtivoCirc, (id) => deleteAsset.mutate(id))}
            {renderSection('Ativo Não Circulante', ativoNonCircItems, totalAtivoNonCirc, (id) => deleteAsset.mutate(id))}
            {ativoNonCircItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum ativo não circulante cadastrado</p>
            )}
            <div className="flex justify-between py-2 px-2 bg-primary/10 rounded font-bold">
              <span>TOTAL DO ATIVO</span>
              <span className="font-mono">{fmt(totalAtivo)}</span>
            </div>
          </CardContent>
        </Card>

        {/* PASSIVO + PL */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">PASSIVO + PL</CardTitle>
              <Button variant="outline" size="sm" onClick={() => openForm('liability')}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderSection('Passivo Circulante', passivoCircItems, totalPassivoCirc, (id) => deleteLiability.mutate(id))}
            {renderSection('Passivo Não Circulante', passivoNonCircItems, totalPassivoNonCirc, (id) => deleteLiability.mutate(id))}
            {renderSection('Patrimônio Líquido', plItems, totalPL, (id) => deleteLiability.mutate(id))}
            <div className="flex justify-between py-2 px-2 bg-primary/10 rounded font-bold">
              <span>TOTAL PASSIVO + PL</span>
              <span className="font-mono">{fmt(totalPassivoPL)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formSide === 'asset' ? 'Novo Ativo' : 'Novo Passivo / Capital'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Forno industrial" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(formSide === 'asset' ? assetCategories : liabilityCategories).map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="circulante">Circulante (curto prazo)</SelectItem>
                  <SelectItem value="nao_circulante">Não Circulante (longo prazo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formValue} onChange={e => setFormValue(e.target.value)} /></div>
            <div><Label>{formSide === 'asset' ? 'Data de Aquisição' : 'Data de Vencimento'}</Label><Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
            <div><Label>Observações</Label><Input value={formNotes} onChange={e => setFormNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formName || !formCategory || !formValue}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
