import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, Car, Camera } from 'lucide-react';

const hosts = ['João Diretor', 'Maria RH', 'Paulo Manutenção', 'Ana Financeiro', 'Carlos Logística'];
const reasons = ['Reunião', 'Entrega', 'Manutenção', 'Entrevista', 'Visita Comercial', 'Outro'];
const availableSpots = ['V-01', 'V-04', 'D-02', 'PCD-01', 'C-02', 'C-03'];

interface NewVisitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewVisitorModal = ({ open, onOpenChange }: NewVisitorModalProps) => {
  const [hasVehicle, setHasVehicle] = useState(false);
  const [form, setForm] = useState({
    name: '', cpf: '', rg: '', company: '', host: '', reason: '', badge: '',
    plate: '', model: '', color: '', spot: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.name || !form.cpf || !form.host || !form.reason) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (hasVehicle && !form.plate) {
      toast.error('Informe a placa do veículo');
      return;
    }
    toast.success(`Visitante ${form.name} registrado com sucesso!`);
    setForm({ name: '', cpf: '', rg: '', company: '', host: '', reason: '', badge: '', plate: '', model: '', color: '', spot: '' });
    setHasVehicle(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Visitante
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Importar documento */}
          <button
            onClick={() => {
              toast.info('Abrindo câmera para leitura de documento...');
              // Simulate OCR capture
              setTimeout(() => {
                update('name', 'Maria Aparecida Santos');
                update('cpf', '456.123.789-00');
                update('rg', '12.345.678-9');
                toast.success('Documento lido com sucesso! Dados preenchidos automaticamente.');
              }, 2000);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Camera className="h-4 w-4" />
            Importar Documento (Câmera)
          </button>

          {/* Dados pessoais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Nome completo *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">CPF *</Label>
              <Input value={form.cpf} onChange={e => update('cpf', e.target.value)} placeholder="000.000.000-00" className="mt-1 bg-secondary border-border text-foreground font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">RG</Label>
              <Input value={form.rg} onChange={e => update('rg', e.target.value)} className="mt-1 bg-secondary border-border text-foreground font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Empresa / Origem</Label>
              <Input value={form.company} onChange={e => update('company', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nº Crachá</Label>
              <Input value={form.badge} onChange={e => update('badge', e.target.value)} type="number" className="mt-1 bg-secondary border-border text-foreground font-mono" />
            </div>
          </div>

          {/* Visita */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Anfitrião *</Label>
              <Select value={form.host} onValueChange={v => update('host', v)}>
                <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {hosts.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
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

          <Separator className="bg-border" />

          {/* Veículo toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasVehicle"
              checked={hasVehicle}
              onCheckedChange={(c) => setHasVehicle(!!c)}
              className="border-border data-[state=checked]:bg-primary"
            />
            <label htmlFor="hasVehicle" className="flex items-center gap-1.5 text-xs font-medium text-foreground cursor-pointer">
              <Car className="h-3.5 w-3.5 text-primary" />
              Vincular veículo
            </label>
          </div>

          {hasVehicle && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/50 p-3">
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
                <Label className="text-xs text-muted-foreground">Vaga</Label>
                <Select value={form.spot} onValueChange={v => update('spot', v)}>
                  <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecionar vaga" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {availableSpots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="rounded-md px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all">
              Registrar Visitante
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewVisitorModal;
