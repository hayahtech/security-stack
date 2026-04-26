import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Car } from 'lucide-react';

const reasons = ['Reunião', 'Entrega', 'Manutenção', 'Entrevista', 'Visita Comercial', 'Carga/Descarga', 'Outro'];
const availableSpots = ['V-01', 'V-04', 'D-02', 'PCD-01', 'C-02', 'C-03'];

interface NewVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewVehicleModal = ({ open, onOpenChange }: NewVehicleModalProps) => {
  const [form, setForm] = useState({
    plate: '', model: '', color: '', driver: '', occupants: '1', reason: '', spot: '', obs: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.plate || !form.driver || !form.reason) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    toast.success(`Veículo ${form.plate} registrado com sucesso!`);
    setForm({ plate: '', model: '', color: '', driver: '', occupants: '1', reason: '', spot: '', obs: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Car className="h-5 w-5 text-primary" />
            Registrar Entrada de Veículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Placa *</Label>
              <Input value={form.plate} onChange={e => update('plate', e.target.value)} placeholder="ABC-1234" className="mt-1 bg-secondary border-border text-foreground font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Modelo</Label>
              <Input value={form.model} onChange={e => update('model', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cor</Label>
              <Input value={form.color} onChange={e => update('color', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Motorista *</Label>
              <Input value={form.driver} onChange={e => update('driver', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Qtd. Ocupantes</Label>
              <Input value={form.occupants} onChange={e => update('occupants', e.target.value)} type="number" min="1" className="mt-1 bg-secondary border-border text-foreground font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Motivo *</Label>
              <Select value={form.reason} onValueChange={v => update('reason', v)}>
                <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Vaga</Label>
            <Select value={form.spot} onValueChange={v => update('spot', v)}>
              <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                <SelectValue placeholder="Selecionar vaga disponível" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availableSpots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea value={form.obs} onChange={e => update('obs', e.target.value)} rows={2} className="mt-1 bg-secondary border-border text-foreground resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="rounded-md px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all">
              Registrar Entrada
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewVehicleModal;
