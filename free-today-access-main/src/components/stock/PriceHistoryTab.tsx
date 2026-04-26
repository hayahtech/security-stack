import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus, FileText, TrendingUp } from 'lucide-react';
import { useAllPriceHistory, usePriceHistory } from '@/hooks/usePriceHistory';
import { useProducts } from '@/hooks/useProducts';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useRecipes } from '@/hooks/useRecipes';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ProductPriceInfo {
  productId: string;
  name: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  variation: number;
  variationPct: number;
  lastChange: string;
  historyCount: number;
}

export default function PriceHistoryTab() {
  const { data: allHistory = [] } = useAllPriceHistory();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const { data: recipes = [] } = useRecipes();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  // Build per-product price info
  const productPrices = useMemo(() => {
    const byProduct: Record<string, typeof allHistory> = {};
    allHistory.forEach(h => {
      if (!byProduct[h.product_id]) byProduct[h.product_id] = [];
      byProduct[h.product_id].push(h);
    });

    const result: ProductPriceInfo[] = [];

    products.forEach((p: any) => {
      const history = byProduct[p.id] || [];
      // Sort by date desc
      history.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

      const currentPrice = Number(p.cost_price);
      const previousPrice = history.length > 0 ? Number(history[0].price) : currentPrice;
      // If we have 2+ records, use [0] as current, [1] as previous
      const prev = history.length >= 2 ? Number(history[1].price) : previousPrice;
      const curr = history.length >= 1 ? Number(history[0].price) : currentPrice;

      const variation = curr - prev;
      const variationPct = prev > 0 ? ((curr - prev) / prev) * 100 : 0;

      result.push({
        productId: p.id,
        name: p.name,
        unit: p.unit,
        currentPrice,
        previousPrice: prev,
        variation,
        variationPct,
        lastChange: history.length > 0 ? history[0].recorded_at : p.updated_at,
        historyCount: history.length,
      });
    });

    // Sort by absolute variation descending
    result.sort((a, b) => Math.abs(b.variationPct) - Math.abs(a.variationPct));
    return result;
  }, [allHistory, products]);

  // CMV impact ranking
  const cmvImpact = useMemo(() => {
    // For each product, estimate monthly consumption from recipes
    const impacts: { name: string; monthlyKg: number; impactPerUnit: number }[] = [];
    products.forEach((p: any) => {
      // Find recipe ingredients using this product
      let totalQty = 0;
      (recipes as any[]).forEach((r: any) => {
        (r.recipe_ingredients || []).forEach((ri: any) => {
          if (ri.product_id === p.id) totalQty += Number(ri.quantity);
        });
      });
      if (totalQty > 0) {
        impacts.push({
          name: p.name,
          monthlyKg: totalQty * 30, // rough estimate
          impactPerUnit: totalQty * 30, // R$1 increase * qty
        });
      }
    });
    impacts.sort((a, b) => b.impactPerUnit - a.impactPerUnit);
    return impacts.slice(0, 10);
  }, [products, recipes]);

  // Alerts: products with > 10% increase
  const alerts = productPrices.filter(p => p.variationPct > 10 && p.historyCount >= 2);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" /> Alertas de Variação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(a => (
              <div key={a.productId} className="flex items-center justify-between text-sm">
                <span className="font-medium">{a.name}</span>
                <Badge variant="destructive">+{a.variationPct.toFixed(1)}% vs última compra</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Product list with variation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variação de Preços por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço Atual</TableHead>
                <TableHead className="text-right">Preço Anterior</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Última Mudança</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productPrices.map(p => {
                const isUp = p.variation > 0;
                const isDown = p.variation < 0;
                return (
                  <TableRow key={p.productId} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProduct(p.productId)}>
                    <TableCell className="font-medium">
                      {p.name}
                      {p.variationPct > 10 && p.historyCount >= 2 && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">⚠</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{fmt(p.currentPrice)}/{p.unit}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(p.previousPrice)}/{p.unit}</TableCell>
                    <TableCell className={`text-right font-semibold ${isUp ? 'text-destructive' : isDown ? 'text-green-600' : ''}`}>
                      <span className="inline-flex items-center gap-1">
                        {isUp && <ArrowUpRight className="h-3 w-3" />}
                        {isDown && <ArrowDownRight className="h-3 w-3" />}
                        {!isUp && !isDown && <Minus className="h-3 w-3" />}
                        {fmt(Math.abs(p.variation))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isUp ? 'destructive' : isDown ? 'default' : 'secondary'}>
                        {p.variationPct > 0 ? '+' : ''}{p.variationPct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.lastChange).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {productPrices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum histórico de preço registrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CMV Impact */}
      {cmvImpact.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impacto no CMV (se preço subir R$1/unidade)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right">Consumo estimado/mês</TableHead>
                  <TableHead className="text-right">Impacto CMV (+R$1)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cmvImpact.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.monthlyKg.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">+{fmt(item.impactPerUnit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Negotiation report export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Relatório para Negociação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-[250px]"><SelectValue placeholder="Selecione fornecedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {(suppliers as any[]).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportNegotiationPDF(supplierFilter, allHistory, products)}>
              <FileText className="h-4 w-4 mr-2" /> Exportar PDF
            </Button>
          </div>
          {supplierFilter !== 'all' && (
            <div className="mt-4">
              <NegotiationSummary supplierId={supplierFilter} history={allHistory} products={products} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <ProductPriceDialog productId={selectedProduct} onClose={() => setSelectedProduct(null)} products={products} />
      )}
    </div>
  );
}

function NegotiationSummary({ supplierId, history, products }: { supplierId: string; history: any[]; products: any[] }) {
  const supplierHistory = history.filter((h: any) => h.supplier_id === supplierId);
  const byProduct: Record<string, number[]> = {};
  supplierHistory.forEach((h: any) => {
    if (!byProduct[h.product_id]) byProduct[h.product_id] = [];
    byProduct[h.product_id].push(Number(h.price));
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead className="text-right">Menor</TableHead>
          <TableHead className="text-right">Maior</TableHead>
          <TableHead className="text-right">Média</TableHead>
          <TableHead className="text-right">Atual</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(byProduct).map(([pid, prices]) => {
          const prod = products.find((p: any) => p.id === pid);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
          return (
            <TableRow key={pid}>
              <TableCell className="font-medium">{prod?.name || pid}</TableCell>
              <TableCell className="text-right text-green-600">{fmt(min)}</TableCell>
              <TableCell className="text-right text-destructive">{fmt(max)}</TableCell>
              <TableCell className="text-right">{fmt(avg)}</TableCell>
              <TableCell className="text-right font-semibold">{fmt(Number(prod?.cost_price || 0))}</TableCell>
            </TableRow>
          );
        })}
        {Object.keys(byProduct).length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
              Nenhum histórico para este fornecedor.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function ProductPriceDialog({ productId, onClose, products }: { productId: string; onClose: () => void; products: any[] }) {
  const { data: history = [] } = usePriceHistory(productId);
  const product = products.find((p: any) => p.id === productId);

  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map(h => ({
        date: new Date(h.recorded_at).toLocaleDateString('pt-BR'),
        price: Number(h.price),
      }));
  }, [history]);

  // Year-to-date variation
  const yearStart = history.filter(h => new Date(h.recorded_at).getFullYear() === new Date().getFullYear());
  const ytdVariation = yearStart.length >= 2
    ? ((Number(yearStart[0].price) - Number(yearStart[yearStart.length - 1].price)) / Number(yearStart[yearStart.length - 1].price)) * 100
    : 0;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Preços — {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge variant="outline">Preço atual: {fmt(Number(product?.cost_price || 0))}</Badge>
          <Badge variant={ytdVariation > 0 ? 'destructive' : 'default'}>
            Variação no ano: {ytdVariation > 0 ? '+' : ''}{ytdVariation.toFixed(1)}%
          </Badge>
        </div>

        {chartData.length > 1 && (
          <div className="h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map(h => (
              <TableRow key={h.id}>
                <TableCell className="text-sm">{new Date(h.recorded_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right font-medium">{fmt(Number(h.price))}</TableCell>
                <TableCell className="text-sm">{(h as any).suppliers?.name || '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {h.source === 'auto' ? 'Automático' : h.source === 'xml_nfe' ? 'NF-e' : h.source === 'stock_entry' ? 'Entrada' : 'Manual'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhum registro.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function exportNegotiationPDF(supplierId: string, history: any[], products: any[]) {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then((autoTableModule) => {
      const doc = new jsPDF();
      const filtered = supplierId === 'all' ? history : history.filter((h: any) => h.supplier_id === supplierId);

      doc.setFontSize(16);
      doc.text('Relatório de Preços — Negociação', 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

      const byProduct: Record<string, number[]> = {};
      filtered.forEach((h: any) => {
        if (!byProduct[h.product_id]) byProduct[h.product_id] = [];
        byProduct[h.product_id].push(Number(h.price));
      });

      const rows = Object.entries(byProduct).map(([pid, prices]) => {
        const prod = products.find((p: any) => p.id === pid);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((s, v) => s + v, 0) / prices.length;
        return [
          prod?.name || pid,
          fmt(min),
          fmt(max),
          fmt(avg),
          fmt(Number(prod?.cost_price || 0)),
          `${prices.length} registros`,
        ];
      });

      (doc as any).autoTable({
        startY: 35,
        head: [['Produto', 'Menor', 'Maior', 'Média', 'Atual', 'Registros']],
        body: rows,
      });

      doc.save('relatorio-precos-negociacao.pdf');
    });
  });
}
