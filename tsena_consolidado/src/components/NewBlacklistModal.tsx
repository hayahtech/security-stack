import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ShieldBan } from 'lucide-react';

interface NewBlacklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewBlacklistModal = ({ open, onOpenChange }: NewBlacklistModalProps) => {
  const [form, setForm] = useState({ name: '', cpf: '', reason: '', addedBy: '' });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.name || !form.cpf || !form.reason) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    toast.success(`${form.name} adicionado à blacklist`);
    setForm({ name: '', cpf: '', reason: '', addedBy: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldBan className="h-5 w-5 text-destructive" />
            Adicionar à Blacklist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Nome completo *</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">CPF *</Label>
            <Input value={form.cpf} onChange={e => update('cpf', e.target.value)} placeholder="000.000.000-00" className="mt-1 bg-secondary border-border text-foreground font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Motivo do bloqueio *</Label>
            <Textarea value={form.reason} onChange={e => update('reason', e.target.value)} rows={3} placeholder="Descreva o motivo..." className="mt-1 bg-secondary border-border text-foreground resize-none" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Incluído por</Label>
            <Input value={form.addedBy} onChange={e => update('addedBy', e.target.value)} placeholder="Nome do responsável" className="mt-1 bg-secondary border-border text-foreground" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="rounded-md px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="rounded-md px-4 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:brightness-110 transition-all">
              Adicionar à Blacklist
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewBlacklistModal;
