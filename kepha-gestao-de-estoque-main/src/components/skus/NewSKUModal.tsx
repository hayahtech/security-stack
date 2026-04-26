import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/useAppStore';
import { SKU, Category, UnitOfMeasure, SKUStatus } from '@/types';
import { toast } from 'sonner';

const categories: Category[] = ['Eletrônicos', 'Vestuário', 'Casa', 'Alimentos', 'Industrial'];
const units: UnitOfMeasure[] = ['UN', 'KG', 'L', 'M', 'M2', 'M3', 'CX', 'PCT'];

interface NewSKUModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewSKUModal({ open, onOpenChange }: NewSKUModalProps) {
  const addSKU = useAppStore((s) => s.addSKU);
  const suppliers = useAppStore((s) => s.suppliers);

  const [form, setForm] = useState({
    name: '',
    category: '' as Category | '',
    brand: '',
    unit: 'UN' as UnitOfMeasure,
    cost: '',
    price: '',
    stock: '',
    reorderPoint: '',
    leadTime: '',
    barcode: '',
    supplierId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nome é obrigatório';
    if (!form.category) e.category = 'Categoria é obrigatória';
    if (!form.brand.trim()) e.brand = 'Marca é obrigatória';
    if (!form.cost || Number(form.cost) <= 0) e.cost = 'Custo deve ser maior que 0';
    if (!form.price || Number(form.price) <= 0) e.price = 'Preço deve ser maior que 0';
    if (!form.stock || Number(form.stock) < 0) e.stock = 'Estoque inválido';
    if (!form.reorderPoint || Number(form.reorderPoint) < 0) e.reorderPoint = 'Ponto de reposição inválido';
    if (!form.barcode.trim()) e.barcode = 'Código de barras é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const cost = Number(form.cost);
    const price = Number(form.price);
    const stock = Number(form.stock);

    const newSKU: SKU = {
      id: `SKU-${String(Date.now()).slice(-6)}`,
      name: form.name.trim(),
      category: form.category as Category,
      brand: form.brand.trim(),
      variants: 1,
      unit: form.unit,
      cost,
      price,
      stock,
      reserved: 0,
      available: stock,
      reorderPoint: Number(form.reorderPoint),
      leadTime: Number(form.leadTime) || 7,
      status: 'active' as SKUStatus,
      supplierId: form.supplierId || 'SUP-001',
      barcode: form.barcode.trim(),
      createdAt: new Date(),
      lastMovement: new Date(),
      markupPercent: price > 0 ? Math.round(((price - cost) / cost) * 100) : 0,
      priceWholesale: Math.round(price * 0.85 * 100) / 100,
      minPrice: Math.round(cost * 1.1 * 100) / 100,
      competitorPrice: Math.round(price * 0.95 * 100) / 100,
      salesVolume: 0,
    };

    addSKU(newSKU);
    toast.success(`SKU ${newSKU.id} criado com sucesso`);
    onOpenChange(false);
    setForm({ name: '', category: '', brand: '', unit: 'UN', cost: '', price: '', stock: '', reorderPoint: '', leadTime: '', barcode: '', supplierId: '' });
    setErrors({});
  };

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo SKU</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {/* Name */}
          <div className="grid gap-1">
            <Label className="text-xs">Nome do Produto *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Monitor LED 27pol" className="h-8 text-xs" />
            {errors.name && <span className="text-[10px] text-destructive">{errors.name}</span>}
          </div>

          {/* Category + Brand */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Categoria *</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <span className="text-[10px] text-destructive">{errors.category}</span>}
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Marca *</Label>
              <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Ex: Samsung" className="h-8 text-xs" />
              {errors.brand && <span className="text-[10px] text-destructive">{errors.brand}</span>}
            </div>
          </div>

          {/* Unit + Barcode */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => set('unit', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Código de Barras *</Label>
              <Input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="EAN-13" className="h-8 text-xs" />
              {errors.barcode && <span className="text-[10px] text-destructive">{errors.barcode}</span>}
            </div>
          </div>

          {/* Cost + Price */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Custo (R$) *</Label>
              <Input type="number" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="0.00" className="h-8 text-xs font-mono" />
              {errors.cost && <span className="text-[10px] text-destructive">{errors.cost}</span>}
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Preço Venda (R$) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" className="h-8 text-xs font-mono" />
              {errors.price && <span className="text-[10px] text-destructive">{errors.price}</span>}
            </div>
          </div>

          {/* Stock + Reorder */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Estoque Inicial *</Label>
              <Input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" className="h-8 text-xs font-mono" />
              {errors.stock && <span className="text-[10px] text-destructive">{errors.stock}</span>}
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Ponto de Reposição *</Label>
              <Input type="number" value={form.reorderPoint} onChange={(e) => set('reorderPoint', e.target.value)} placeholder="0" className="h-8 text-xs font-mono" />
              {errors.reorderPoint && <span className="text-[10px] text-destructive">{errors.reorderPoint}</span>}
            </div>
          </div>

          {/* Lead time + Supplier */}
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">Lead Time (dias)</Label>
              <Input type="number" value={form.leadTime} onChange={(e) => set('leadTime', e.target.value)} placeholder="7" className="h-8 text-xs font-mono" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Fornecedor</Label>
              <Select value={form.supplierId} onValueChange={(v) => set('supplierId', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit}>Criar SKU</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
