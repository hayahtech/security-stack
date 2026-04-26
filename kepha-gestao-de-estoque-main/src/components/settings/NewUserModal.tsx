import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';
import type { UserRole } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewUserModal({ open, onOpenChange }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '' as UserRole | '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.name || !form.email || !form.role) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('E-mail inválido');
      return;
    }

    const newUser = {
      id: `USR${String(Date.now()).slice(-6)}`,
      name: form.name,
      email: form.email,
      role: form.role as UserRole,
      lastAccess: new Date(),
      status: 'active' as const,
    };

    useAppStore.setState(state => ({ users: [...state.users, newUser] }));
    toast.success('Usuário criado com sucesso!');
    setForm({ name: '', email: '', role: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input placeholder="Ex: Maria Santos" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" placeholder="Ex: maria@empresa.com.br" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Perfil de Acesso *</Label>
            <Select value={form.role} onValueChange={v => update('role', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem value="GERENTE">Gerente</SelectItem>
                <SelectItem value="OPERADOR">Operador</SelectItem>
                <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                <SelectItem value="AUDITOR">Auditor</SelectItem>
              </SelectContent>
            </Select>
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
