import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { MovementType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const adjustmentTypes: { value: MovementType; label: string }[] = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SAÍDA', label: 'Saída' },
  { value: 'AJUSTE', label: 'Ajuste' },
  { value: 'DEVOLUÇÃO', label: 'Devolução' },
  { value: 'AVARIA', label: 'Avaria' },
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'TRANSFERÊNCIA', label: 'Transferência' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAdjustmentModal({ open, onOpenChange }: Props) {
  const { skus, warehouses } = useAppStore();
  const [skuSearch, setSkuSearch] = useState('');
  const [skuOpen, setSkuOpen] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [type, setType] = useState<MovementType>('AJUSTE');
  const [quantity, setQuantity] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  const filteredSKUs = useMemo(() => {
    if (!skuSearch) return skus.slice(0, 20);
    const q = skuSearch.toLowerCase();
    return skus.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)).slice(0, 20);
  }, [skus, skuSearch]);

  const selectedSku = skus.find(s => s.id === selectedSkuId);

  const handleSubmit = () => {
    if (!selectedSkuId || !quantity || !warehouse) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    toast.success(`Movimentação registrada: ${type} de ${quantity} un de ${selectedSku?.name}`);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSkuId('');
    setType('AJUSTE');
    setQuantity('');
    setWarehouse('');
    setNotes('');
    setReason('');
    setSkuSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm tracking-wider uppercase">Novo Ajuste de Estoque</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registre uma movimentação manual no inventário
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* SKU Search */}
          <div className="grid gap-1.5">
            <Label className="text-xs">SKU *</Label>
            <Popover open={skuOpen} onOpenChange={setSkuOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="justify-between font-mono text-xs h-8">
                  {selectedSku ? (
                    <span className="truncate">{selectedSku.id} — {selectedSku.name}</span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Search className="h-3 w-3" /> Buscar SKU...
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar por nome ou código..."
                    value={skuSearch}
                    onValueChange={setSkuSearch}
                    className="text-xs"
                  />
                  <CommandList>
                    <CommandEmpty className="text-xs p-4 text-muted-foreground">Nenhum SKU encontrado</CommandEmpty>
                    <CommandGroup>
                      {filteredSKUs.map(sku => (
                        <CommandItem
                          key={sku.id}
                          value={sku.id}
                          onSelect={() => { setSelectedSkuId(sku.id); setSkuOpen(false); }}
                          className="text-xs"
                        >
                          <Check className={cn('mr-2 h-3 w-3', selectedSkuId === sku.id ? 'opacity-100' : 'opacity-0')} />
                          <span className="font-mono text-muted-foreground mr-2">{sku.id}</span>
                          <span className="truncate">{sku.name}</span>
                          <span className="ml-auto font-mono text-muted-foreground">{sku.stock} un</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div className="grid gap-1.5">
              <Label className="text-xs">Tipo *</Label>
              <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentTypes.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="grid gap-1.5">
              <Label className="text-xs">Quantidade *</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Warehouse */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Armazém *</Label>
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar armazém" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(wh => (
                  <SelectItem key={wh.id} value={wh.city} className="text-xs">{wh.city} — {wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Motivo</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Contagem física, devolução de cliente..."
              className="h-8 text-xs"
            />
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} className="text-xs">
            Registrar Movimentação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
