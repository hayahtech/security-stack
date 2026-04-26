import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCreateStockEntry, StockEntryItem } from '@/hooks/useStockEntries';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Save, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/export-utils';

interface ItemRow {
  tempId: string;
  product_id: string;
  productName: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export function ManualEntryTab() {
  const { user } = useAuth();
  const createEntry = useCreateStockEntry();
  const [supplierId, setSupplierId] = useState<string>('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [nfeNumber, setNfeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { tempId: crypto.randomUUID(), product_id: '', productName: '', unit: 'un', quantity: 1, unit_price: 0 },
  ]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('un');
  const [newProductCategory, setNewProductCategory] = useState('outros');

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('suppliers').select('id, name').eq('user_id', user!.id).eq('active', true).order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, unit, cost_price, barcode').eq('user_id', user!.id).order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const total = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unit_price, 0), [items]);

  const addItem = () => {
    setItems([...items, { tempId: crypto.randomUUID(), product_id: '', productName: '', unit: 'un', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (tempId: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof ItemRow, value: any) => {
    setItems(items.map(i => {
      if (i.tempId !== tempId) return i;
      const updated = { ...i, [field]: value };
      if (field === 'product_id' && products) {
        const p = products.find(pr => pr.id === value);
        if (p) {
          updated.productName = p.name;
          updated.unit = p.unit;
          updated.unit_price = Number(p.cost_price);
        }
      }
      return updated;
    }));
  };

  const handleScanResult = (code: string) => {
    const product = products?.find(p => (p as any).barcode === code);
    if (product) {
      // Find empty row or add new
      const emptyRow = items.find(i => !i.product_id);
      if (emptyRow) {
        updateItem(emptyRow.tempId, 'product_id', product.id);
      } else {
        // Check if already in list — increment quantity
        const existing = items.find(i => i.product_id === product.id);
        if (existing) {
          updateItem(existing.tempId, 'quantity', existing.quantity + 1);
          toast.success(`${product.name}: quantidade +1`);
          return;
        }
        const newId = crypto.randomUUID();
        setItems(prev => [...prev, {
          tempId: newId, product_id: product.id, productName: product.name,
          unit: product.unit, quantity: 1, unit_price: Number(product.cost_price),
        }]);
      }
      toast.success(`Produto: ${product.name}`);
    } else {
      setNewProductBarcode(code);
      setNewProductOpen(true);
      setScannerOpen(false);
    }
  };

  const handleCreateNewProduct = async () => {
    if (!newProductName.trim() || !user) return;
    try {
      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        name: newProductName.trim(),
        unit: newProductUnit as any,
        category: newProductCategory as any,
        barcode: newProductBarcode || null,
      }).select().single();
      if (error) throw error;
      await refetchProducts();
      // Add to items
      const newId = crypto.randomUUID();
      setItems(prev => [...prev, {
        tempId: newId, product_id: data.id, productName: data.name,
        unit: data.unit, quantity: 1, unit_price: 0,
      }]);
      toast.success(`Produto "${data.name}" cadastrado!`);
      setNewProductOpen(false);
      setNewProductName('');
      setNewProductBarcode('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar produto.');
    }
  };

  const handleSave = async (status: 'rascunho' | 'confirmado') => {
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item válido.');
      return;
    }

    const entryItems: StockEntryItem[] = validItems.map(i => ({
      product_id: i.product_id,
      matched_product_id: i.product_id,
      unit: i.unit,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.quantity * i.unit_price,
      discount: 0,
      included: true,
    }));

    try {
      await createEntry.mutateAsync({
        supplier_id: supplierId || null,
        entry_type: 'manual',
        nfe_number: nfeNumber || undefined,
        nfe_date: entryDate,
        total_value: total,
        status,
        notes: notes || undefined,
        items: entryItems,
      });

      toast.success(status === 'confirmado'
        ? `✅ Entrada confirmada! ${validItems.length} produto(s) atualizado(s).`
        : 'Rascunho salvo com sucesso.'
      );

      setItems([{ tempId: crypto.randomUUID(), product_id: '', productName: '', unit: 'un', quantity: 1, unit_price: 0 }]);
      setNfeNumber('');
      setNotes('');
      setSupplierId('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar entrada.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {(suppliers || []).map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data da compra</Label>
          <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Número da nota (opcional)</Label>
          <Input value={nfeNumber} onChange={(e) => setNfeNumber(e.target.value)} placeholder="Ex: 001234" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {/* Scanner button */}
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
              <Camera className="h-4 w-4 mr-1" /> Escanear produto
            </Button>
          </div>

          <BarcodeScanner
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            mode="barcode"
            continuous
            onResult={handleScanResult}
            placeholder="Digite o código de barras"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 min-w-[200px]">Produto</th>
                  <th className="py-2 px-2 w-20">Un.</th>
                  <th className="py-2 px-2 w-28">Quantidade</th>
                  <th className="py-2 px-2 w-32">Preço unit.</th>
                  <th className="py-2 px-2 w-32 text-right">Subtotal</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.tempId} className="border-b border-border/30">
                    <td className="py-2 px-2">
                      <Select value={item.product_id} onValueChange={(v) => updateItem(item.tempId, 'product_id', v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione produto" /></SelectTrigger>
                        <SelectContent>
                          {(products || []).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-2">
                      <Input value={item.unit} onChange={(e) => updateItem(item.tempId, 'unit', e.target.value)} className="h-9 w-16" />
                    </td>
                    <td className="py-2 px-2">
                      <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.tempId, 'quantity', parseFloat(e.target.value) || 0)} className="h-9" />
                    </td>
                    <td className="py-2 px-2">
                      <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(item.tempId, 'unit_price', parseFloat(e.target.value) || 0)} className="h-9" />
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                    <td className="py-2 px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.tempId)} disabled={items.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar item
            </Button>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total geral</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre a entrada..." rows={2} />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSave('rascunho')} disabled={createEntry.isPending}>
          <Save className="h-4 w-4 mr-2" /> Salvar rascunho
        </Button>
        <Button onClick={() => handleSave('confirmado')} disabled={createEntry.isPending}>
          {createEntry.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Confirmar entrada
        </Button>
      </div>

      {/* New product dialog */}
      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar novo produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código de barras</Label>
              <Input value={newProductBarcode} readOnly className="font-mono bg-muted" />
            </div>
            <div>
              <Label>Nome do produto</Label>
              <Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} autoFocus placeholder="Ex: Mussarela Fatiada" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidade</Label>
                <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="un">un</SelectItem>
                    <SelectItem value="cx">cx</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingrediente">Ingrediente</SelectItem>
                    <SelectItem value="embalagem">Embalagem</SelectItem>
                    <SelectItem value="limpeza">Limpeza</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProductOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateNewProduct} disabled={!newProductName.trim()}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
