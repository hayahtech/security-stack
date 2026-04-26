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

export function NewBudgetModal({ open, onOpenChange }: Props) {
  const [costCenter, setCostCenter] = useState('');
  const [category, setCategory] = useState('');
  const [budgeted, setBudgeted] = useState('');
  const [period, setPeriod] = useState('');

  const handleSave = () => {
    if (!costCenter || !category || !budgeted || !period) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    toast.success(`Orçamento de R$ ${Number(budgeted).toLocaleString('pt-BR')} definido para ${costCenter}`);
    onOpenChange(false);
    setCostCenter(''); setCategory(''); setBudgeted(''); setPeriod('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Definir Orçamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Centro de Custo *</Label>
            <Select value={costCenter} onValueChange={setCostCenter}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CC-001 Operações SP">CC-001 Operações SP</SelectItem>
                <SelectItem value="CC-002 Logística">CC-002 Logística</SelectItem>
                <SelectItem value="CC-003 Comercial">CC-003 Comercial</SelectItem>
                <SelectItem value="CC-004 TI">CC-004 TI</SelectItem>
                <SelectItem value="CC-005 Marketing">CC-005 Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Compras Estoque">Compras Estoque</SelectItem>
                <SelectItem value="Frete e Logística">Frete e Logística</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor Orçado (R$) *</Label>
            <Input type="number" value={budgeted} onChange={e => setBudgeted(e.target.value)} placeholder="100000" />
          </div>
          <div className="space-y-2">
            <Label>Período *</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-Q1">2024 - Q1</SelectItem>
                <SelectItem value="2024-Q2">2024 - Q2</SelectItem>
                <SelectItem value="2024-Q3">2024 - Q3</SelectItem>
                <SelectItem value="2024-Q4">2024 - Q4</SelectItem>
                <SelectItem value="2025-Q1">2025 - Q1</SelectItem>
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
