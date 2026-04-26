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

export function NewApprovalRuleModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [conditionType, setConditionType] = useState('');
  const [operator, setOperator] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [approver, setApprover] = useState('');
  const [approverRole, setApproverRole] = useState('');
  const [deadline, setDeadline] = useState('');
  const [escalation, setEscalation] = useState('');

  const handleSave = () => {
    if (!name || !conditionType || !operator || !conditionValue || !approver || !approverRole) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    toast.success(`Regra "${name}" criada com sucesso`);
    onOpenChange(false);
    setName(''); setConditionType(''); setOperator(''); setConditionValue('');
    setApprover(''); setApproverRole(''); setDeadline(''); setEscalation('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Regra de Aprovação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Regra *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: PO acima de R$ 50.000" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Condição *</Label>
              <Select value={conditionType} onValueChange={setConditionType}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VALOR">Valor</SelectItem>
                  <SelectItem value="CATEGORIA">Categoria</SelectItem>
                  <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                  <SelectItem value="QUANTIDADE">Quantidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operador *</Label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger><SelectValue placeholder="Op." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=">">Maior que</SelectItem>
                  <SelectItem value=">=">Maior ou igual</SelectItem>
                  <SelectItem value="<">Menor que</SelectItem>
                  <SelectItem value="=">Igual a</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="50000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Aprovador *</Label>
              <Input value={approver} onChange={e => setApprover(e.target.value)} placeholder="Nome do aprovador" />
            </div>
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Select value={approverRole} onValueChange={setApproverRole}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRETOR">Diretor</SelectItem>
                  <SelectItem value="GERENTE">Gerente</SelectItem>
                  <SelectItem value="COORDENADOR">Coordenador</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prazo (horas)</Label>
              <Input type="number" value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="24" />
            </div>
            <div className="space-y-2">
              <Label>Escalação</Label>
              <Select value={escalation} onValueChange={setEscalation}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESCALAR_SUPERIOR">Escalar Superior</SelectItem>
                  <SelectItem value="APROVAR_AUTO">Auto-aprovar</SelectItem>
                  <SelectItem value="REPROVAR_AUTO">Auto-reprovar</SelectItem>
                </SelectContent>
              </Select>
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
