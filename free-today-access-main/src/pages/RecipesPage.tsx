import { useState, useMemo } from 'react';
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe, calcRecipeCost } from '@/hooks/useRecipes';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Pencil, AlertTriangle, ChefHat, DollarSign } from 'lucide-react';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

interface IngredientRow { product_id: string; quantity: string; unit: string; waste_percentage: string; }

export default function RecipesPage() {
  const { data: recipes, isLoading } = useRecipes();
  const { data: menuItems } = useMenuItems();
  const { data: products } = useProducts();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [menuItemId, setMenuItemId] = useState('');
  const [yieldQty, setYieldQty] = useState('1');
  const [prepTime, setPrepTime] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);

  // Items without recipe
  const itemsWithRecipe = new Set((recipes || []).map((r: any) => r.menu_item_id));
  const itemsWithoutRecipe = (menuItems || []).filter(m => !itemsWithRecipe.has(m.id));

  // Margin alerts
  const alerts = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter((r: any) => {
      const { costPerUnit } = calcRecipeCost(r);
      const salePrice = Number(r.menu_items?.sale_price || 0);
      if (salePrice <= 0) return false;
      const margin = (salePrice - costPerUnit) / salePrice * 100;
      return margin < 30;
    });
  }, [recipes]);

  const openNew = () => {
    setEditId(null); setMenuItemId(''); setYieldQty('1'); setPrepTime(''); setNotes('');
    setIngredients([{ product_id: '', quantity: '', unit: 'kg', waste_percentage: '0' }]);
    setFormOpen(true);
  };

  const openEdit = (recipe: any) => {
    setEditId(recipe.id);
    setMenuItemId(recipe.menu_item_id);
    setYieldQty(String(recipe.yield_quantity));
    setPrepTime(recipe.prep_time_minutes ? String(recipe.prep_time_minutes) : '');
    setNotes(recipe.notes || '');
    setIngredients((recipe.recipe_ingredients || []).map((ri: any) => ({
      product_id: ri.product_id, quantity: String(ri.quantity), unit: ri.unit, waste_percentage: String(ri.waste_percentage),
    })));
    setFormOpen(true);
  };

  const addIngredientRow = () => setIngredients(prev => [...prev, { product_id: '', quantity: '', unit: 'kg', waste_percentage: '0' }]);
  const removeIngredientRow = (idx: number) => setIngredients(prev => prev.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, field: keyof IngredientRow, value: string) => {
    setIngredients(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  // Live cost preview
  const liveCost = useMemo(() => {
    const yld = parseFloat(yieldQty) || 1;
    let total = 0;
    ingredients.forEach(ing => {
      const product = (products || []).find(p => p.id === ing.product_id);
      if (!product) return;
      const qty = parseFloat(ing.quantity) || 0;
      const waste = parseFloat(ing.waste_percentage) || 0;
      total += qty * (1 + waste / 100) * Number(product.cost_price);
    });
    return { total, perUnit: total / yld };
  }, [ingredients, products, yieldQty]);

  const handleSave = () => {
    const parsedIngredients = ingredients.filter(i => i.product_id && i.quantity).map(i => ({
      product_id: i.product_id, quantity: parseFloat(i.quantity) || 0, unit: i.unit, waste_percentage: parseFloat(i.waste_percentage) || 0,
    }));
    if (editId) {
      updateRecipe.mutate({ id: editId, yield_quantity: parseFloat(yieldQty) || 1, prep_time_minutes: parseInt(prepTime) || undefined, notes: notes || undefined, ingredients: parsedIngredients });
    } else {
      createRecipe.mutate({ menu_item_id: menuItemId, yield_quantity: parseFloat(yieldQty) || 1, prep_time_minutes: parseInt(prepTime) || undefined, notes: notes || undefined, ingredients: parsedIngredients });
    }
    setFormOpen(false);
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Fichas Técnicas</h1>
          <p className="text-sm text-muted-foreground">Custo real de produção por item do cardápio</p>
        </div>
        <Button onClick={openNew} disabled={itemsWithoutRecipe.length === 0}><Plus className="h-4 w-4 mr-1" /> Nova Ficha</Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-semibold text-destructive">Alertas de Margem</span>
            </div>
            <div className="space-y-1 text-sm">
              {alerts.map((r: any) => {
                const { costPerUnit } = calcRecipeCost(r);
                const sp = Number(r.menu_items?.sale_price || 0);
                const margin = sp > 0 ? (sp - costPerUnit) / sp * 100 : 0;
                return (
                  <p key={r.id} className="text-destructive">
                    ⚠️ <strong>{r.menu_items?.name}</strong>: margem de {margin.toFixed(1)}% (custo {fmt(costPerUnit)} / venda {fmt(sp)})
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items without recipe */}
      {itemsWithoutRecipe.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Itens sem ficha técnica:</p>
            <div className="flex flex-wrap gap-2">
              {itemsWithoutRecipe.map(m => (
                <Badge key={m.id} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { setMenuItemId(m.id); openNew(); }}>
                  {m.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipes list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(recipes || []).map((recipe: any) => {
          const { costPerUnit, totalCost, ingredients: ings } = calcRecipeCost(recipe);
          const salePrice = Number(recipe.menu_items?.sale_price || 0);
          const margin = salePrice > 0 ? (salePrice - costPerUnit) / salePrice * 100 : 0;
          const minPrice = costPerUnit > 0 ? costPerUnit / 0.6 : 0; // 40% min margin

          return (
            <Card key={recipe.id} className={margin < 30 ? 'border-destructive' : margin < 50 ? 'border-[hsl(var(--warning))]' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ChefHat className="h-4 w-4" /> {recipe.menu_items?.name || 'Item removido'}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(recipe)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm('Excluir ficha técnica?')) deleteRecipe.mutate(recipe.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Custo Real</p>
                    <p className="font-bold text-lg">{fmt(costPerUnit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preço Venda</p>
                    <p className="font-bold text-lg">{fmt(salePrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Margem</p>
                    <p className={`font-bold text-lg ${margin >= 60 ? 'text-[hsl(var(--success))]' : margin >= 40 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>{margin.toFixed(1)}%</p>
                  </div>
                </div>

                <Progress value={Math.min(100, margin)} className="h-2" />

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Rendimento: {recipe.yield_quantity} un | Custo total: {fmt(totalCost)}</p>
                  {recipe.prep_time_minutes && <p>Preparo: {recipe.prep_time_minutes} min</p>}
                  <p className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Preço mín. sugerido (margem 40%): <strong>{fmt(minPrice)}</strong></p>
                </div>

                <div className="text-xs">
                  <p className="font-medium mb-1">Ingredientes:</p>
                  {ings.map((ing, idx) => (
                    <p key={idx} className="text-muted-foreground">
                      • {ing.name}: {ing.qty} {ing.unit} {ing.waste > 0 ? `(+${ing.waste}% perda)` : ''} — {fmt(ing.cost)}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editId && (
              <div>
                <Label>Item do Cardápio</Label>
                <Select value={menuItemId} onValueChange={setMenuItemId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {itemsWithoutRecipe.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Rendimento (unidades)</Label><Input type="number" step="1" value={yieldQty} onChange={e => setYieldQty(e.target.value)} /></div>
              <div><Label>Tempo de Preparo (min)</Label><Input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} /></div>
            </div>
            <div><Label>Observações</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Ingredientes</Label>
                <Button variant="outline" size="sm" onClick={addIngredientRow}><Plus className="h-3 w-3 mr-1" /> Ingrediente</Button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      {idx === 0 && <Label className="text-xs">Produto</Label>}
                      <Select value={ing.product_id} onValueChange={v => updateIngredient(idx, 'product_id', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Produto..." /></SelectTrigger>
                        <SelectContent>{(products || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Qtd</Label>}
                      <Input className="h-9 text-xs" type="number" step="0.01" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Unidade</Label>}
                      <Select value={ing.unit} onValueChange={v => updateIngredient(idx, 'unit', v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem><SelectItem value="g">g</SelectItem>
                          <SelectItem value="l">l</SelectItem><SelectItem value="un">un</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <Label className="text-xs">Perda %</Label>}
                      <Input className="h-9 text-xs" type="number" step="1" value={ing.waste_percentage} onChange={e => updateIngredient(idx, 'waste_percentage', e.target.value)} />
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      {(() => {
                        const p = (products || []).find(p => p.id === ing.product_id);
                        const cost = p ? (parseFloat(ing.quantity) || 0) * (1 + (parseFloat(ing.waste_percentage) || 0) / 100) * Number(p.cost_price) : 0;
                        return <span className="text-xs text-muted-foreground">{fmt(cost)}</span>;
                      })()}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIngredientRow(idx)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live cost preview */}
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-sm">
                <div className="flex justify-between">
                  <span>Custo total da receita:</span><strong>{fmt(liveCost.total)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Custo por unidade:</span><strong>{fmt(liveCost.perUnit)}</strong>
                </div>
                {menuItemId && (() => {
                  const item = (menuItems || []).find(m => m.id === menuItemId);
                  if (!item) return null;
                  const sp = Number(item.sale_price);
                  const margin = sp > 0 ? (sp - liveCost.perUnit) / sp * 100 : 0;
                  return (
                    <div className="flex justify-between mt-1">
                      <span>Margem estimada:</span>
                      <strong className={margin >= 60 ? 'text-[hsl(var(--success))]' : margin >= 40 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}>{margin.toFixed(1)}%</strong>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!editId && !menuItemId}>{editId ? 'Atualizar' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
