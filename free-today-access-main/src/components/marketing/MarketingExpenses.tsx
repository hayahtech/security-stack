import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MarketingCampaign, CHANNEL_OPTIONS, INVESTMENT_TYPE_OPTIONS } from '@/hooks/useMarketingCampaigns';

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

interface Props {
  transactions: any[];
  categories: Category[];
  campaigns: MarketingCampaign[];
  onDelete: (id: string) => void;
  onSave: (data: any) => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MarketingExpenses({ transactions, categories, campaigns, onDelete, onSave }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [dueDate, setDueDate] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [recurrent, setRecurrent] = useState(false);
  const [recurrence, setRecurrence] = useState<'mensal' | 'semanal' | 'quinzenal'>('mensal');

  const activeCampaigns = campaigns.filter(c => c.status === 'ativa' || c.status === 'planejada');
  const selectedCampaign = campaigns.find(c => c.id === campaignId);
  const remainingBudget = selectedCampaign
    ? Number(selectedCampaign.budget) - Number(selectedCampaign.spent)
    : null;

  let filtered = transactions;
  if (campaignFilter !== 'all') {
    filtered = filtered.filter(t => t.campaign_id === campaignFilter);
  }
  if (search) {
    filtered = filtered.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()));
  }

  // Totals by campaign
  const totalsByCampaign: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.campaign_id) {
      totalsByCampaign[t.campaign_id] = (totalsByCampaign[t.campaign_id] || 0) + Number(t.amount);
    }
  });

  const handleSave = () => {
    if (!categoryId || !amount || !description) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    onSave({
      category_id: categoryId,
      amount: parseFloat(amount),
      date,
      description,
      status,
      type: 'expense',
      scope: 'business',
      due_date: status === 'pending' ? dueDate || undefined : undefined,
      campaign_id: campaignId || undefined,
      recurrent: recurrent || undefined,
      recurrence: recurrent ? recurrence : undefined,
    });
    setFormOpen(false);
    setCategoryId(''); setAmount(''); setDescription(''); setStatus('paid');
    setDueDate(''); setCampaignId(''); setRecurrent(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar despesa..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Campanha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {campaigns.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova Despesa
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma despesa de marketing encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t: any) => {
                const cat = t.categories || categories.find(c => c.id === t.category_id);
                const camp = campaigns.find(c => c.id === t.campaign_id);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {t.description}
                      {t.recurrent && <Badge variant="outline" className="ml-2 text-xs">Recorrente</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{cat?.name || '—'}</Badge></TableCell>
                    <TableCell className="text-xs">{camp?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-primary">
                      -{formatCurrency(Number(t.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                        if (confirm('Excluir esta despesa?')) onDelete(t.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Totals by campaign */}
      {Object.keys(totalsByCampaign).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(totalsByCampaign).map(([cid, total]) => {
            const camp = campaigns.find(c => c.id === cid);
            return camp ? (
              <Badge key={cid} variant="outline" className="text-xs py-1 px-2">
                {camp.name}: {formatCurrency(total)}
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Despesa de Marketing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campanha (opcional)</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma campanha..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem campanha</SelectItem>
                  {activeCampaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCampaign && remainingBudget !== null && (
                <p className={`text-xs mt-1 ${remainingBudget < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  Saldo restante: {formatCurrency(remainingBudget)}
                </p>
              )}
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva a despesa..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === 'pending' && (
              <div>
                <Label>Data de Vencimento</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={recurrent} onCheckedChange={setRecurrent} />
              <Label>Despesa recorrente</Label>
            </div>
            {recurrent && (
              <div>
                <Label>Frequência</Label>
                <Select value={recurrence} onValueChange={v => setRecurrence(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
