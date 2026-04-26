import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { POStatus } from '@/types';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Search, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface LineItem {
  skuId: string;
  skuName: string;
  quantity: number;
  unitCost: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPOModal({ open, onOpenChange }: Props) {
  const { suppliers, skus } = useAppStore();
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [expectedDelivery, setExpectedDelivery] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [skuSearchOpen, setSkuSearchOpen] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const filteredSKUs = useMemo(() => {
    const q = skuSearch.toLowerCase();
    return skus.filter(s =>
      !lines.some(l => l.skuId === s.id) &&
      (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [skus, skuSearch, lines]);

  const totalValue = lines.reduce((acc, l) => acc + l.quantity * l.unitCost, 0);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const sup = suppliers.find(s => s.id === id);
    if (sup) {
      setExpectedDelivery(addDays(new Date(), sup.leadTime));
    }
  };

  const addLine = (skuId: string) => {
    const sku = skus.find(s => s.id === skuId);
    if (!sku) return;
    setLines(prev => [...prev, { skuId: sku.id, skuName: sku.name, quantity: 1, unitCost: sku.cost }]);
    setSkuSearchOpen(false);
    setSkuSearch('');
  };

  const updateLine = (index: number, field: 'quantity' | 'unitCost', value: number) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!supplierId || lines.length === 0) {
      toast.error('Selecione um fornecedor e adicione ao menos 1 item');
      return;
    }
    toast.success(`PO criado com ${lines.length} iten(s) — R$ ${totalValue.toLocaleString('pt-BR')}`);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSupplierId('');
    setLines([]);
    setExpectedDelivery(undefined);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm tracking-wider uppercase">Novo Pedido de Compra</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Crie um PO para reposição de estoque
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Fornecedor *</Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecionar fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Entrega Prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('h-8 text-xs justify-start', !expectedDelivery && 'text-muted-foreground')}>
                    <CalendarIcon className="h-3 w-3 mr-1.5" />
                    {expectedDelivery ? format(expectedDelivery, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expectedDelivery}
                    onSelect={setExpectedDelivery}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedSupplier && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground bg-muted/30 rounded px-3 py-1.5">
              <span>Lead time: <strong className="text-foreground">{selectedSupplier.leadTime}d</strong></span>
              <span>On-time: <strong className="text-foreground">{selectedSupplier.onTimeDeliveryRate}%</strong></span>
              <span>Fill rate: <strong className="text-foreground">{selectedSupplier.fillRate}%</strong></span>
              <span>Pgto: <strong className="text-foreground">{selectedSupplier.paymentTerms}</strong></span>
            </div>
          )}

          {/* Line Items */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Itens *</Label>
              <Popover open={skuSearchOpen} onOpenChange={setSkuSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1">
                    <Plus className="h-3 w-3" />
                    Adicionar item
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar SKU..." value={skuSearch} onValueChange={setSkuSearch} className="text-xs" />
                    <CommandList>
                      <CommandEmpty className="text-xs p-3 text-muted-foreground">Nenhum SKU encontrado</CommandEmpty>
                      <CommandGroup>
                        {filteredSKUs.map(sku => (
                          <CommandItem key={sku.id} value={sku.id} onSelect={() => addLine(sku.id)} className="text-xs">
                            <span className="font-mono text-muted-foreground mr-2">{sku.id}</span>
                            <span className="truncate">{sku.name}</span>
                            <span className="ml-auto font-mono text-muted-foreground">R$ {sku.cost.toLocaleString('pt-BR')}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {lines.length > 0 ? (
              <div className="border rounded overflow-hidden">
                {/* Table header */}
                <div className="flex items-center bg-muted/30 px-2 h-7 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="w-[80px] shrink-0">SKU</div>
                  <div className="flex-1">Produto</div>
                  <div className="w-[80px] shrink-0 text-right">Qtd</div>
                  <div className="w-[100px] shrink-0 text-right">Custo Unit.</div>
                  <div className="w-[90px] shrink-0 text-right">Subtotal</div>
                  <div className="w-[32px] shrink-0"></div>
                </div>
                {lines.map((line, i) => (
                  <div key={line.skuId} className="flex items-center px-2 h-9 border-t border-border/40 text-xs">
                    <div className="w-[80px] shrink-0 font-mono text-[10px] text-muted-foreground">{line.skuId}</div>
                    <div className="flex-1 truncate">{line.skuName}</div>
                    <div className="w-[80px] shrink-0">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateLine(i, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-6 text-xs font-mono text-right w-full"
                      />
                    </div>
                    <div className="w-[100px] shrink-0">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={line.unitCost}
                        onChange={(e) => updateLine(i, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="h-6 text-xs font-mono text-right w-full"
                      />
                    </div>
                    <div className="w-[90px] shrink-0 text-right font-mono text-xs font-medium">
                      R$ {(line.quantity * line.unitCost).toLocaleString('pt-BR')}
                    </div>
                    <div className="w-[32px] shrink-0 flex justify-center">
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeLine(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div className="flex items-center px-2 h-8 border-t bg-muted/20 text-xs font-medium">
                  <div className="flex-1"></div>
                  <div className="w-[90px] shrink-0 text-right font-mono">
                    R$ {totalValue.toLocaleString('pt-BR')}
                  </div>
                  <div className="w-[32px] shrink-0"></div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed rounded p-6 text-center text-xs text-muted-foreground">
                Nenhum item adicionado. Clique em "Adicionar item" acima.
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções especiais, condições..."
              className="text-xs min-h-[50px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} className="text-xs">
            Criar Pedido de Compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
