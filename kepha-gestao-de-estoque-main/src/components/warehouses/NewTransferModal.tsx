import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransferModal({ open, onOpenChange }: Props) {
  const { warehouses, skus } = useAppStore();
  const [form, setForm] = useState({
    skuId: '',
    fromWarehouse: '',
    toWarehouse: '',
    quantity: '',
    notes: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.skuId || !form.fromWarehouse || !form.toWarehouse || !form.quantity) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (form.fromWarehouse === form.toWarehouse) {
      toast.error('Origem e destino devem ser diferentes');
      return;
    }

    toast.success('Transferência registrada com sucesso!');
    setForm({ skuId: '', fromWarehouse: '', toWarehouse: '', quantity: '', notes: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transferência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>SKU *</Label>
            <Select value={form.skuId} onValueChange={v => update('skuId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o SKU" /></SelectTrigger>
              <SelectContent>
                {skus.slice(0, 20).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.id} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Armazém Origem *</Label>
              <Select value={form.fromWarehouse} onValueChange={v => update('fromWarehouse', v)}>
                <SelectTrigger><SelectValue placeholder="Origem" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Armazém Destino *</Label>
              <Select value={form.toWarehouse} onValueChange={v => update('toWarehouse', v)}>
                <SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quantidade *</Label>
            <Input type="number" min="1" placeholder="Ex: 50" value={form.quantity} onChange={e => update('quantity', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Input placeholder="Notas adicionais" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
