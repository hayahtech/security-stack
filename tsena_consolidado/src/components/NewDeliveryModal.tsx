import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

const recipients = ['João Silva - TI', 'Maria RH', 'Carlos Compras', 'Ana Financeiro', 'Paulo Manutenção'];
const statusOptions = [
  { value: 'recebida', label: 'Recebida' },
  { value: 'aguardando', label: 'Aguardando retirada' },
  { value: 'entregue', label: 'Entregue' },
];

interface NewDeliveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewDeliveryModal = ({ open, onOpenChange }: NewDeliveryModalProps) => {
  const [form, setForm] = useState({
    sender: '', carrier: '', recipient: '', trackingCode: '',
    status: 'recebida', receivedBy: '', deliveredTo: '', notes: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.sender || !form.recipient || !form.receivedBy) {
      toast.error('Preencha os campos obrigatórios: remetente, destinatário e recebido por');
      return;
    }
    if (form.status === 'entregue' && !form.deliveredTo) {
      toast.error('Informe quem retirou a entrega');
      return;
    }
    toast.success(`Entrega de ${form.sender} registrada para ${form.recipient}`);
    toast.info(`Notificação enviada para ${form.recipient}`);
    setForm({ sender: '', carrier: '', recipient: '', trackingCode: '', status: 'recebida', receivedBy: '', deliveredTo: '', notes: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Nova Entrega
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Remetente *</Label>
              <Input value={form.sender} onChange={e => update('sender', e.target.value)} placeholder="Ex: Amazon, Magazine Luiza" className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Transportadora</Label>
              <Input value={form.carrier} onChange={e => update('carrier', e.target.value)} placeholder="Ex: Correios, Jadlog" className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Código de rastreio</Label>
              <Input value={form.trackingCode} onChange={e => update('trackingCode', e.target.value)} className="mt-1 bg-secondary border-border text-foreground font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Destinatário final *</Label>
              <Select value={form.recipient} onValueChange={v => update('recipient', v)}>
                <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {recipients.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Recebido por (portaria) *</Label>
              <Input value={form.receivedBy} onChange={e => update('receivedBy', e.target.value)} placeholder="Nome de quem recebeu" className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            {form.status === 'entregue' && (
              <div>
                <Label className="text-xs text-muted-foreground">Retirado por *</Label>
                <Input value={form.deliveredTo} onChange={e => update('deliveredTo', e.target.value)} placeholder="Nome de quem retirou" className="mt-1 bg-secondary border-border text-foreground" />
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Input value={form.notes} onChange={e => update('notes', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="rounded-md px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all">
              Registrar Entrega
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewDeliveryModal;
