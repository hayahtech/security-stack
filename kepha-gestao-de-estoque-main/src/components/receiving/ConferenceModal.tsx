import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Dock, ConferenceItem, DivergenceReason } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Package, ClipboardCheck, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dock: Dock;
}

const divergenceReasons: { value: DivergenceReason; label: string }[] = [
  { value: 'AVARIA', label: 'Avaria' },
  { value: 'FALTA', label: 'Falta' },
  { value: 'EXCESSO', label: 'Excesso' },
  { value: 'PRODUTO_ERRADO', label: 'Produto Errado' },
  { value: 'VENCIDO', label: 'Vencido' },
];

export function ConferenceModal({ open, onOpenChange, dock }: Props) {
  const { purchaseOrders, users, updateDockStatus, addReceivingHistory, updateSKU, skus } = useAppStore();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nfNumber, setNfNumber] = useState('');
  const [nfSeries, setNfSeries] = useState('');
  const [nfKey, setNfKey] = useState('');
  const [nfDate, setNfDate] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [items, setItems] = useState<ConferenceItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [rejectPartial, setRejectPartial] = useState(false);

  const po = purchaseOrders.find(p => p.id === dock.poId || p.number === dock.poNumber);

  const initItems = () => {
    if (!po) return;
    const conferenceItems: ConferenceItem[] = po.lines.map(line => {
      const isCold = ['Alimentos'].includes(skus.find(s => s.id === line.skuId)?.category || '');
      return {
        skuId: line.skuId,
        skuName: line.skuName,
        orderedQty: line.quantity,
        nfQty: line.quantity + (Math.random() > 0.8 ? Math.floor(Math.random() * 3) - 1 : 0),
        checkedQty: 0,
        lot: '',
        temperature: isCold ? undefined : undefined,
        status: 'pending' as const,
      };
    });
    setItems(conferenceItems);
    setStep(2);
  };

  const checkedCount = items.filter(i => i.status !== 'pending').length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
  const divergentItems = items.filter(i => i.status === 'divergent');
  const okItems = items.filter(i => i.status === 'ok');

  const updateItem = (idx: number, updates: Partial<ConferenceItem>) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, ...updates };
      // Auto status
      if (updates.checkedQty !== undefined) {
        if (updated.checkedQty === updated.orderedQty) {
          updated.status = 'ok';
          updated.divergenceReason = undefined;
        } else if (updated.checkedQty > 0) {
          updated.status = 'divergent';
        }
      }
      return updated;
    }));
  };

  const handleFinalize = () => {
    // Update stock for accepted items
    okItems.forEach(item => {
      const sku = skus.find(s => s.id === item.skuId);
      if (sku) {
        updateSKU(sku.id, { stock: sku.stock + item.checkedQty, available: sku.available + item.checkedQty });
      }
    });
    if (!rejectPartial) {
      divergentItems.forEach(item => {
        const sku = skus.find(s => s.id === item.skuId);
        if (sku && item.checkedQty > 0) {
          updateSKU(sku.id, { stock: sku.stock + item.checkedQty, available: sku.available + item.checkedQty });
        }
      });
    }

    // Free dock
    updateDockStatus(dock.id, { status: 'LIVRE', supplierId: undefined, supplierName: undefined, poId: undefined, poNumber: undefined, arrivalTime: undefined });

    // Add history
    addReceivingHistory({
      id: `REC${Date.now()}`,
      date: new Date(),
      supplierId: dock.supplierId || '',
      supplierName: dock.supplierName || '',
      poId: po?.id || '',
      poNumber: po?.number || '',
      nfNumber,
      totalItems: items.length,
      totalValue: po?.totalValue || 0,
      divergences: divergentItems.length,
      inspector: users.find(u => u.id === inspectorId)?.name || 'Sistema',
      status: divergentItems.length === 0 ? 'CONCLUIDO' : rejectPartial ? 'RECUSADO' : 'COM_DIVERGENCIAS',
    });

    toast({
      title: '✅ Recebimento finalizado',
      description: `${okItems.length} itens OK, ${divergentItems.length} divergências · Doca liberada`,
    });
    onOpenChange(false);
    setStep(1);
    setItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Conferência de Recebimento — {dock.name}
            <Badge variant="outline" className="ml-2 text-[10px]">Etapa {step}/3</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs mb-2">
          {[
            { n: 1, label: 'Identificação', icon: Package },
            { n: 2, label: 'Conferência', icon: ClipboardCheck },
            { n: 3, label: 'Finalização', icon: CheckCircle2 },
          ].map(({ n, label, icon: Icon }, idx) => (
            <div key={n} className="flex items-center gap-1">
              {idx > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs',
                step === n ? 'bg-primary text-primary-foreground' : step > n ? 'bg-muted text-foreground' : 'text-muted-foreground'
              )}>
                <Icon className="h-3 w-3" />
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nº do PO</Label>
                <Input value={po?.number || dock.poNumber || ''} disabled className="h-8 text-xs bg-muted" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fornecedor</Label>
                <Input value={dock.supplierName || ''} disabled className="h-8 text-xs bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nº NF *</Label>
                <Input value={nfNumber} onChange={e => setNfNumber(e.target.value)} className="h-8 text-xs" placeholder="000000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Série</Label>
                <Input value={nfSeries} onChange={e => setNfSeries(e.target.value)} className="h-8 text-xs" placeholder="1" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Emissão</Label>
                <Input type="date" value={nfDate} onChange={e => setNfDate(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chave NF-e</Label>
              <Input value={nfKey} onChange={e => setNfKey(e.target.value)} className="h-8 text-xs font-mono" placeholder="00000000000000000000000000000000000000000000" maxLength={44} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Conferente Responsável *</Label>
              <Select value={inspectorId} onValueChange={setInspectorId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar conferente" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.status === 'active').map(u => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">{u.name} — {u.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={initItems} disabled={!nfNumber || !inspectorId} className="w-full">
              Iniciar Contagem <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{checkedCount} de {items.length} itens conferidos</span>
              <Progress value={progress} className="w-48 h-2" />
            </div>

            <div className="border rounded overflow-auto max-h-[50vh]">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">SKU</th>
                    <th className="text-left p-2 font-medium">Descrição</th>
                    <th className="text-center p-2 font-medium">Pedida</th>
                    <th className="text-center p-2 font-medium">NF</th>
                    <th className="text-center p-2 font-medium w-24">Conferida</th>
                    <th className="text-center p-2 font-medium">Lote</th>
                    <th className="text-center p-2 font-medium">Validade</th>
                    <th className="text-center p-2 font-medium">Temp °C</th>
                    <th className="text-center p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Divergência</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const isDivergent = item.status === 'divergent';
                    const isOk = item.status === 'ok';
                    const tempBad = item.temperature !== undefined && item.temperature > 7;
                    return (
                      <tr key={idx} className={cn(
                        'border-b',
                        isDivergent && 'bg-destructive/10',
                        isOk && 'bg-emerald-500/5',
                      )}>
                        <td className="p-2 font-mono">{item.skuId}</td>
                        <td className="p-2 max-w-[160px] truncate">{item.skuName}</td>
                        <td className="p-2 text-center font-mono">{item.orderedQty}</td>
                        <td className="p-2 text-center font-mono">{item.nfQty}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.checkedQty || ''}
                            onChange={e => updateItem(idx, { checkedQty: parseInt(e.target.value) || 0 })}
                            className="h-8 w-20 text-center text-sm font-mono mx-auto"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.lot || ''}
                            onChange={e => updateItem(idx, { lot: e.target.value })}
                            className="h-7 w-20 text-xs text-center"
                            placeholder="—"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="date"
                            value={item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''}
                            onChange={e => updateItem(idx, { expiryDate: e.target.value ? new Date(e.target.value) : undefined })}
                            className="h-7 w-28 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={item.temperature ?? ''}
                            onChange={e => updateItem(idx, { temperature: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className={cn('h-7 w-16 text-xs text-center', tempBad && 'border-destructive text-destructive')}
                            placeholder="—"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {isOk && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">OK</Badge>}
                          {isDivergent && <Badge className="bg-destructive/20 text-destructive border-0 text-[10px]">DIV</Badge>}
                          {item.status === 'pending' && <Badge variant="outline" className="text-[10px]">—</Badge>}
                        </td>
                        <td className="p-2">
                          {isDivergent && (
                            <Select value={item.divergenceReason || ''} onValueChange={(v) => updateItem(idx, { divergenceReason: v as DivergenceReason })}>
                              <SelectTrigger className="h-7 text-[10px] w-28"><SelectValue placeholder="Motivo" /></SelectTrigger>
                              <SelectContent>
                                {divergenceReasons.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>Voltar</Button>
              <Button size="sm" onClick={() => setStep(3)} disabled={checkedCount === 0}>
                Avançar para Finalização <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded p-3 text-center">
                <div className="text-2xl font-bold text-emerald-500">{okItems.length}</div>
                <div className="text-xs text-muted-foreground">Itens OK</div>
              </div>
              <div className="border rounded p-3 text-center">
                <div className="text-2xl font-bold text-amber-500">{divergentItems.length}</div>
                <div className="text-xs text-muted-foreground">Divergências</div>
              </div>
              <div className="border rounded p-3 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{items.filter(i => i.status === 'pending').length}</div>
                <div className="text-xs text-muted-foreground">Não conferidos</div>
              </div>
            </div>

            {divergentItems.length > 0 && (
              <div className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-1 text-xs font-medium"><AlertTriangle className="h-3 w-3 text-amber-500" /> Divergências encontradas</div>
                {divergentItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                    <span>{item.skuName}</span>
                    <span className="font-mono">Pedido: {item.orderedQty} · Conferido: {item.checkedQty}</span>
                    <Badge variant="outline" className="text-[10px]">{item.divergenceReason || 'N/A'}</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Observações gerais</Label>
              <Textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={2} className="text-xs" />
            </div>

            {divergentItems.length > 0 && (
              <div className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="text-xs font-medium">Recusar entrega parcial</div>
                  <div className="text-[10px] text-muted-foreground">Itens divergentes serão devolvidos ao fornecedor</div>
                </div>
                <Switch checked={rejectPartial} onCheckedChange={setRejectPartial} />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>Voltar</Button>
              <Button size="sm" onClick={handleFinalize}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar Recebimento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
