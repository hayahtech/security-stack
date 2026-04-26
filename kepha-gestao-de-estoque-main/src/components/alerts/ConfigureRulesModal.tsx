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

export function ConfigureRulesModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [alertType, setAlertType] = useState('');
  const [threshold, setThreshold] = useState('');
  const [severity, setSeverity] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyApp, setNotifyApp] = useState(true);
  const [autoResolve, setAutoResolve] = useState(false);

  const handleSave = () => {
    if (!name || !alertType || !threshold || !severity) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    toast.success(`Regra "${name}" criada com sucesso`);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setAlertType('');
    setThreshold('');
    setSeverity('');
    setNotifyEmail(true);
    setNotifyApp(true);
    setAutoResolve(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Regra de Alerta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Regra *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Estoque crítico eletrônicos" />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Alerta *</Label>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW_STOCK">Estoque Baixo</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Sem Estoque</SelectItem>
                <SelectItem value="OVERSTOCK">Excesso de Estoque</SelectItem>
                <SelectItem value="EXPIRING">Vencimento Próximo</SelectItem>
                <SelectItem value="ANOMALY">Anomalia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limite (threshold) *</Label>
            <Input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="Ex: 10 unidades ou 30 dias" />
          </div>
          <div className="space-y-2">
            <Label>Severidade *</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="info">Informativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>Notificações</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">E-mail</span>
              <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">In-App</span>
              <Switch checked={notifyApp} onCheckedChange={setNotifyApp} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Auto-resolver quando normalizar</span>
              <Switch checked={autoResolve} onCheckedChange={setAutoResolve} />
            </div>
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
