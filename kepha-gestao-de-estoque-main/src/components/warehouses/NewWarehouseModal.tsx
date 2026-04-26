import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewWarehouseModal({ open, onOpenChange }: Props) {
  const { warehouses } = useAppStore();
  const [form, setForm] = useState({
    name: '',
    city: '',
    state: '',
    capacity: '',
    manager: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.name || !form.city || !form.state || !form.capacity || !form.manager) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const newWarehouse = {
      id: `WH${String(warehouses.length + 1).padStart(3, '0')}`,
      name: form.name,
      city: form.city,
      state: form.state,
      capacity: parseInt(form.capacity),
      usedCapacity: 0,
      totalSKUs: 0,
      manager: form.manager,
      zones: [],
    };

    useAppStore.setState(state => ({ warehouses: [...state.warehouses, newWarehouse] }));
    toast.success('Armazém criado com sucesso!');
    setForm({ name: '', city: '', state: '', capacity: '', manager: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Armazém</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do Armazém *</Label>
            <Input placeholder="Ex: Centro de Distribuição Curitiba" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input placeholder="Ex: Curitiba" value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Input placeholder="Ex: PR" maxLength={2} value={form.state} onChange={e => update('state', e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Capacidade (m³) *</Label>
            <Input type="number" placeholder="Ex: 30000" value={form.capacity} onChange={e => update('capacity', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Responsável *</Label>
            <Input placeholder="Ex: João Silva" value={form.manager} onChange={e => update('manager', e.target.value)} />
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
