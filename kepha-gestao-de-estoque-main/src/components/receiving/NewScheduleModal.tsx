import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewScheduleModal({ open, onOpenChange }: Props) {
  const { suppliers, purchaseOrders, docks } = useAppStore();
  const { toast } = useToast();

  const [supplierId, setSupplierId] = useState('');
  const [poId, setPoId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [dockId, setDockId] = useState('');
  const [driver, setDriver] = useState('');
  const [plate, setPlate] = useState('');
  const [notes, setNotes] = useState('');

  const filteredPOs = useMemo(() => {
    if (!supplierId) return [];
    return purchaseOrders.filter(po => po.supplierId === supplierId && !['RECEBIDO', 'FECHADO'].includes(po.status));
  }, [supplierId, purchaseOrders]);

  const freeDocks = docks.filter(d => d.status === 'LIVRE');

  const handleSubmit = () => {
    if (!supplierId || !poId || !date || !time || !driver || !plate) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    toast({ title: 'Agendamento criado', description: `Doca ${dockId || 'a definir'} · ${date} ${time}` });
    onOpenChange(false);
    setSupplierId(''); setPoId(''); setDate(''); setTime(''); setDockId(''); setDriver(''); setPlate(''); setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Novo Agendamento de Recebimento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fornecedor *</Label>
              <Select value={supplierId} onValueChange={(v) => { setSupplierId(v); setPoId(''); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">PO Vinculado *</Label>
              <Select value={poId} onValueChange={setPoId} disabled={!supplierId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={supplierId ? 'Selecionar PO' : 'Selecione fornecedor'} /></SelectTrigger>
                <SelectContent>
                  {filteredPOs.map(po => <SelectItem key={po.id} value={po.id} className="text-xs">{po.number} — {po.status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Data *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hora *</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Doca Preferencial</Label>
              <Select value={dockId} onValueChange={setDockId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                <SelectContent>
                  {freeDocks.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Motorista *</Label>
              <Input value={driver} onChange={e => setDriver(e.target.value)} placeholder="Nome completo" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Placa *</Label>
              <Input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={7} className="h-8 text-xs font-mono" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-xs" placeholder="Ex: Carga paletizada, necessita empilhadeira" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit}>Criar Agendamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
