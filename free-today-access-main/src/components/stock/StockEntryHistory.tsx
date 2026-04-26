import { useState } from 'react';
import { useStockEntries, useCancelStockEntry } from '@/hooks/useStockEntries';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, XCircle, Download, FileText, Package, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/export-utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const statusColors: Record<string, string> = {
  confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rascunho: 'bg-muted text-muted-foreground',
  cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeLabels: Record<string, string> = {
  manual: 'Manual',
  xml_nfe: 'XML/NF-e',
  compra_avulsa: 'Compra avulsa',
};

export function StockEntryHistory() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const cancelEntry = useCancelStockEntry();

  const { data: entries, isLoading } = useStockEntries({
    status: statusFilter || undefined,
    entry_type: typeFilter || undefined,
  });

  const { data: detail } = useQuery({
    queryKey: ['stock-entry-detail', detailId],
    queryFn: async () => {
      const { data } = await supabase
        .from('stock_entries')
        .select('*, suppliers(name), stock_entry_items(*, products:matched_product_id(name))')
        .eq('id', detailId!)
        .single();
      return data;
    },
    enabled: !!detailId,
  });

  const handleCancel = async () => {
    if (!cancelId || !cancelReason.trim()) {
      toast.error('Informe o motivo do cancelamento.');
      return;
    }
    try {
      await cancelEntry.mutateAsync({ entryId: cancelId, reason: cancelReason });
      setCancelId(null);
      setCancelReason('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const downloadXML = (xmlRaw: string, nfeNumber: string) => {
    const blob = new Blob([xmlRaw], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFe_${nfeNumber || 'sem_numero'}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="xml_nfe">XML/NF-e</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (entries || []).length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Nenhuma entrada encontrada
        </div>
      ) : (
        <div className="space-y-2">
          {(entries || []).map((entry: any) => (
            <Card key={entry.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {entry.suppliers?.name || 'Sem fornecedor'}
                          {entry.nfe_number ? ` — NF ${entry.nfe_number}` : ''}
                        </p>
                        <Badge variant="secondary" className="text-xs">{typeLabels[entry.entry_type] || entry.entry_type}</Badge>
                        <Badge className={`text-xs ${statusColors[entry.status]}`}>{entry.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.created_at)} — {entry.stock_entry_items?.length || 0} itens — {formatCurrency(Number(entry.total_value))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailId(entry.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {entry.xml_raw && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadXML(entry.xml_raw, entry.nfe_number)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {entry.status === 'confirmado' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setCancelId(entry.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Entrada</DialogTitle>
          </DialogHeader>
          {detail && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Fornecedor:</span> {detail.suppliers?.name || '-'}</div>
                  <div><span className="text-muted-foreground">Tipo:</span> {typeLabels[detail.entry_type]}</div>
                  <div><span className="text-muted-foreground">NF:</span> {detail.nfe_number || '-'}</div>
                  <div><span className="text-muted-foreground">Total:</span> {formatCurrency(Number(detail.total_value))}</div>
                </div>
                {detail.nfe_key && (
                  <p className="text-xs text-muted-foreground font-mono break-all">Chave: {detail.nfe_key}</p>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-2">Produto</th>
                      <th className="py-2 px-2">Qtd</th>
                      <th className="py-2 px-2 text-right">Unit.</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.stock_entry_items || []).map((item: any) => (
                      <tr key={item.id} className="border-b border-border/30">
                        <td className="py-2 px-2">{item.products?.name || item.nfe_product_name || '-'}</td>
                        <td className="py-2 px-2">{item.quantity} {item.unit}</td>
                        <td className="py-2 px-2 text-right">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="py-2 px-2 text-right">{formatCurrency(Number(item.total_price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar Entrada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O estoque será estornado automaticamente. Informe o motivo do cancelamento:
            </p>
            <div className="space-y-2">
              <Label>Motivo (obrigatório)</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex: Nota fiscal com erro, devolução..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelEntry.isPending}>
              {cancelEntry.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
