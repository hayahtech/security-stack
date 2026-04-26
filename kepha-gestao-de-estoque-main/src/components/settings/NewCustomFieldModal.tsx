import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewCustomFieldModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  const showOptions = type === 'Seleção' || type === 'Multi-seleção';

  const handleSave = () => {
    if (!name || !type) {
      toast.error('Preencha nome e tipo do campo');
      return;
    }
    if (showOptions && !options) {
      toast.error('Informe as opções do campo');
      return;
    }
    toast.success(`Campo "${name}" criado com sucesso`);
    onOpenChange(false);
    setName(''); setType(''); setRequired(false); setOptions('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Campo Personalizado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Campo *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Código NCM" />
          </div>
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Texto">Texto</SelectItem>
                <SelectItem value="Número">Número</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="Booleano">Booleano (Sim/Não)</SelectItem>
                <SelectItem value="Seleção">Seleção</SelectItem>
                <SelectItem value="Multi-seleção">Multi-seleção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showOptions && (
            <div className="space-y-2">
              <Label>Opções (separadas por vírgula) *</Label>
              <Input value={options} onChange={e => setOptions(e.target.value)} placeholder="Ex: Brasil, China, EUA, Alemanha" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Campo obrigatório</Label>
            <Switch checked={required} onCheckedChange={setRequired} />
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
