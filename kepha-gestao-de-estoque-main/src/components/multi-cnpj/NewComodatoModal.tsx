import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { companies } from '@/data/multiCnpjData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewComodatoModal({ open, onOpenChange }: Props) {
  const [item, setItem] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [holder, setHolder] = useState('');
  const [returnDue, setReturnDue] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [condition, setCondition] = useState('');

  const handleSave = () => {
    if (!item || !owner || !holder || !returnDue || !assetValue) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    toast.success(`Comodato "${item}" registrado com sucesso`);
    onOpenChange(false);
    setItem(''); setDescription(''); setOwner(''); setHolder('');
    setReturnDue(''); setAssetValue(''); setCondition('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Comodato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Item *</Label>
            <Input value={item} onChange={e => setItem(e.target.value)} placeholder="Ex: Gondola Refrigerada GR-100" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição do bem" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Proprietário *</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Detentor *</Label>
              <Select value={holder} onValueChange={setHolder}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prazo Devolução *</Label>
              <Input type="date" value={returnDue} onChange={e => setReturnDue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor do Bem (R$) *</Label>
              <Input type="number" value={assetValue} onChange={e => setAssetValue(e.target.value)} placeholder="15000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Condição</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NOVO">Novo</SelectItem>
                <SelectItem value="BOM">Bom</SelectItem>
                <SelectItem value="REGULAR">Regular</SelectItem>
                <SelectItem value="DESGASTADO">Desgastado</SelectItem>
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
