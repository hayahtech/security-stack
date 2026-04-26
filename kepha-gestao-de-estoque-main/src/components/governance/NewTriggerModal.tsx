import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTriggerModal({ open, onOpenChange }: Props) {
  const [form, setForm] = useState({
    name: '',
    event: '',
    condition: '',
    action: '',
    url: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.name || !form.event || !form.condition || !form.action) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    toast.success('Gatilho criado com sucesso!');
    setForm({ name: '', event: '', condition: '', action: '', url: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Gatilho</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do Gatilho *</Label>
            <Input placeholder="Ex: Alerta de estoque baixo" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Evento *</Label>
            <Select value={form.event} onValueChange={v => update('event', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stock_low">Estoque abaixo do mínimo</SelectItem>
                <SelectItem value="stock_out">Estoque zerado</SelectItem>
                <SelectItem value="po_created">Pedido de compra criado</SelectItem>
                <SelectItem value="po_received">Pedido de compra recebido</SelectItem>
                <SelectItem value="price_change">Alteração de preço</SelectItem>
                <SelectItem value="expiry_near">Vencimento próximo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condição *</Label>
            <Input placeholder="Ex: Estoque < 10 unidades" value={form.condition} onChange={e => update('condition', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ação *</Label>
            <Select value={form.action} onValueChange={v => update('action', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione a ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Enviar e-mail</SelectItem>
                <SelectItem value="webhook">Disparar Webhook</SelectItem>
                <SelectItem value="notification">Notificação no sistema</SelectItem>
                <SelectItem value="auto_po">Gerar PO automática</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <Input placeholder="https://..." value={form.url} onChange={e => update('url', e.target.value)} />
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
