import { useState } from 'react';
import { useProducts, useCreateProduct, useStockMovements, useCreateStockMovement } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowDown, ArrowUp, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import PriceHistoryTab from '@/components/stock/PriceHistoryTab';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function StockPage() {
  const { data: products, isLoading } = useProducts();
  const { data: suppliers } = useSuppliers();
  const { data: movements } = useStockMovements();
  const createProduct = useCreateProduct();
  const createMovement = useCreateStockMovement();
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [exitFormOpen, setExitFormOpen] = useState(false);

  // Product form state
  const [pName, setPName] = useState('');
  const [pUnit, setPUnit] = useState<'kg' | 'l' | 'un' | 'cx' | 'g'>('un');
  const [pMin, setPMin] = useState('');
  const [pCost, setPCost] = useState('');
  const [pCategory, setPCategory] = useState<'ingrediente' | 'embalagem' | 'limpeza' | 'outros'>('ingrediente');
  const [pSupplier, setPSupplier] = useState('');

  // Movement form state
  const [mProduct, setMProduct] = useState('');
  const [mQuantity, setMQuantity] = useState('');
  const [mCost, setMCost] = useState('');
  const [mReason, setMReason] = useState('');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const lowStockCount = (products || []).filter(p => Number(p.quantity_current) <= Number(p.quantity_min)).length;
  const totalValue = (products || []).reduce((s, p) => s + Number(p.quantity_current) * Number(p.cost_price), 0);

  const handleCreateProduct = () => {
    createProduct.mutate({
      name: pName, unit: pUnit, quantity_min: parseFloat(pMin) || 0,
      cost_price: parseFloat(pCost) || 0, category: pCategory,
      supplier_id: pSupplier || undefined,
    });
    setProductFormOpen(false);
    setPName(''); setPMin(''); setPCost('');
  };

  const handleMovement = (type: 'entrada' | 'saida') => {
    createMovement.mutate({
      product_id: mProduct, type, quantity: parseFloat(mQuantity),
      cost_price: type === 'entrada' ? parseFloat(mCost) || undefined : undefined,
      reason: mReason || undefined,
    });
    setEntryFormOpen(false); setExitFormOpen(false);
    setMProduct(''); setMQuantity(''); setMCost(''); setMReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Estoque</h1>
          <p className="text-sm text-muted-foreground">Controle de produtos e insumos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEntryFormOpen(true)}><ArrowDown className="h-4 w-4 mr-1" /> Entrada</Button>
          <Button variant="outline" onClick={() => setExitFormOpen(true)}><ArrowUp className="h-4 w-4 mr-1" /> Saída</Button>
          <Button onClick={() => setProductFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Produtos</TabsTrigger>
          <TabsTrigger value="prices"><TrendingUp className="h-4 w-4 mr-1" /> Preços</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{(products || []).length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className={lowStockCount > 0 ? 'border-destructive' : ''}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className={`h-8 w-8 ${lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Itens em Alerta</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{lowStockCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Valor Total do Estoque</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(totalValue)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Products list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(products || []).map(p => {
              const isLow = Number(p.quantity_current) <= Number(p.quantity_min);
              const isCritical = Number(p.quantity_current) === 0;
              return (
                <Card key={p.id} className={isCritical ? 'border-destructive' : isLow ? 'border-[hsl(var(--warning))]' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      <Badge variant={isCritical ? 'destructive' : isLow ? 'secondary' : 'default'}>
                        {isCritical ? 'Crítico' : isLow ? 'Baixo' : 'OK'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Quantidade: <span className="font-medium text-foreground">{Number(p.quantity_current)} {p.unit}</span></p>
                      <p>Mínimo: {Number(p.quantity_min)} {p.unit}</p>
                      <p>Custo: {formatCurrency(Number(p.cost_price))}/{p.unit}</p>
                      {(p as any).suppliers?.name && <p>Fornecedor: {(p as any).suppliers.name}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent movements */}
          {movements && movements.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Movimentações Recentes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.slice(0, 20).map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{new Date(m.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm">{(m as any).products?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'entrada' ? 'default' : m.type === 'saida' ? 'secondary' : 'outline'}>
                            {m.type === 'entrada' ? 'Entrada' : m.type === 'saida' ? 'Saída' : 'Ajuste'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{Number(m.quantity)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.reason || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prices">
          <PriceHistoryTab />
        </TabsContent>
      </Tabs>

      {/* New Product Dialog */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={pName} onChange={e => setPName(e.target.value)} /></div>
            <div><Label>Unidade</Label>
              <Select value={pUnit} onValueChange={v => setPUnit(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem><SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">l</SelectItem><SelectItem value="un">un</SelectItem>
                  <SelectItem value="cx">cx</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade Mínima</Label><Input type="number" value={pMin} onChange={e => setPMin(e.target.value)} /></div>
            <div><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={pCost} onChange={e => setPCost(e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={pCategory} onValueChange={v => setPCategory(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingrediente">Ingrediente</SelectItem>
                  <SelectItem value="embalagem">Embalagem</SelectItem>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {suppliers && suppliers.length > 0 && (
              <div><Label>Fornecedor</Label>
                <Select value={pSupplier} onValueChange={setPSupplier}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProduct}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Dialog */}
      <Dialog open={entryFormOpen} onOpenChange={setEntryFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Entrada</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Produto</Label>
              <Select value={mProduct} onValueChange={setMProduct}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{(products || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade</Label><Input type="number" step="0.01" value={mQuantity} onChange={e => setMQuantity(e.target.value)} /></div>
            <div><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={mCost} onChange={e => setMCost(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryFormOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleMovement('entrada')}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={exitFormOpen} onOpenChange={setExitFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Saída</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Produto</Label>
              <Select value={mProduct} onValueChange={setMProduct}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{(products || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantidade</Label><Input type="number" step="0.01" value={mQuantity} onChange={e => setMQuantity(e.target.value)} /></div>
            <div><Label>Motivo</Label><Input value={mReason} onChange={e => setMReason(e.target.value)} placeholder="Produção, venda, perda..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitFormOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleMovement('saida')}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
