import { useState } from 'react';
import { useDemandForecast, DemandItem } from '@/hooks/useDemandForecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ShoppingCart, TrendingUp, Package, Printer, Share2, Truck } from 'lucide-react';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatQty(v: number, unit: string) {
  return `${v.toFixed(v < 10 ? 2 : 1)} ${unit}`;
}

export default function DemandForecastPage() {
  const [period, setPeriod] = useState(30);
  const [daysNext, setDaysNext] = useState(7);
  const { data, isLoading } = useDemandForecast(period, daysNext);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const { demandItems = [], totalEstimatedCost = 0, itemsNeedingPurchase = [], criticalItems = [] } = data || {};

  // Group by supplier
  const bySupplier: Record<string, DemandItem[]> = {};
  itemsNeedingPurchase.forEach(item => {
    const key = item.supplierName || 'Sem fornecedor';
    if (!bySupplier[key]) bySupplier[key] = [];
    bySupplier[key].push(item);
  });

  const generatePrintableList = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Lista de Compras</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
        h2 { font-size: 16px; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #e74c3c; color: #e74c3c; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
        th { background: #f9f9f9; font-weight: 600; }
        .right { text-align: right; }
        .total { font-size: 16px; font-weight: bold; margin-top: 16px; text-align: right; }
        .critical { color: #e74c3c; font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>`);
    w.document.write(`<h1>🛒 Lista de Compras Sugerida</h1>`);
    w.document.write(`<p class="subtitle">Baseada nos últimos ${period} dias · Próxima compra em ${daysNext} dias · ${new Date().toLocaleDateString('pt-BR')}</p>`);

    Object.entries(bySupplier).sort(([a], [b]) => a.localeCompare(b)).forEach(([supplier, items]) => {
      const subtotal = items.reduce((s, i) => s + i.estimatedCost, 0);
      w.document.write(`<h2>🏪 ${supplier}</h2>`);
      w.document.write(`<table><thead><tr><th>Produto</th><th class="right">Qtd. Sugerida</th><th class="right">Estoque Atual</th><th class="right">Custo Est.</th></tr></thead><tbody>`);
      items.forEach(item => {
        const critical = item.daysUntilStockout !== null && item.daysUntilStockout <= 3;
        w.document.write(`<tr><td${critical ? ' class="critical"' : ''}>${item.productName}${critical ? ' ⚠️' : ''}</td><td class="right">${formatQty(item.suggestedPurchase, item.unit)}</td><td class="right">${formatQty(item.currentStock, item.unit)}</td><td class="right">${formatCurrency(item.estimatedCost)}</td></tr>`);
      });
      w.document.write(`<tr><td colspan="3"><strong>Subtotal</strong></td><td class="right"><strong>${formatCurrency(subtotal)}</strong></td></tr>`);
      w.document.write(`</tbody></table>`);
    });

    w.document.write(`<p class="total">Total estimado: ${formatCurrency(totalEstimatedCost)}</p>`);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  const shareWhatsApp = () => {
    let msg = `🛒 *Lista de Compras*\n📅 ${new Date().toLocaleDateString('pt-BR')}\nBase: últimos ${period} dias\n\n`;
    Object.entries(bySupplier).sort(([a], [b]) => a.localeCompare(b)).forEach(([supplier, items]) => {
      msg += `*${supplier}*\n`;
      items.forEach(item => {
        const critical = item.daysUntilStockout !== null && item.daysUntilStockout <= 3;
        msg += `${critical ? '⚠️ ' : '• '}${item.productName}: ${formatQty(item.suggestedPurchase, item.unit)} (estoque: ${formatQty(item.currentStock, item.unit)})\n`;
      });
      msg += '\n';
    });
    msg += `💰 *Total estimado: ${formatCurrency(totalEstimatedCost)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Previsão de Demanda</h1>
          <p className="text-sm text-muted-foreground">Lista de compras inteligente baseada no histórico de vendas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generatePrintableList} disabled={itemsNeedingPurchase.length === 0}>
            <Printer className="h-4 w-4 mr-1" /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={shareWhatsApp} disabled={itemsNeedingPurchase.length === 0}>
            <Share2 className="h-4 w-4 mr-1" /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">Período de análise</Label>
          <Select value={String(period)} onValueChange={v => setPeriod(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dias até próxima compra</Label>
          <Input type="number" min={1} max={30} value={daysNext} onChange={e => setDaysNext(Number(e.target.value) || 7)} className="w-32" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ShoppingCart className="h-4 w-4" /> Itens p/ comprar</div>
            <p className="text-2xl font-bold">{itemsNeedingPurchase.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" /> Críticos</div>
            <p className="text-2xl font-bold text-destructive">{criticalItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Package className="h-4 w-4" /> Total produtos</div>
            <p className="text-2xl font-bold">{demandItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Custo estimado</div>
            <p className="text-2xl font-bold">{formatCurrency(totalEstimatedCost)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista de Compras</TabsTrigger>
          <TabsTrigger value="supplier">Por Fornecedor</TabsTrigger>
          <TabsTrigger value="all">Todos os Produtos</TabsTrigger>
        </TabsList>

        {/* Shopping List */}
        <TabsContent value="list" className="mt-4">
          {itemsNeedingPurchase.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum item precisa ser comprado no momento</p>
              <p className="text-xs mt-1">Cadastre fichas técnicas e registre vendas para gerar previsões</p>
            </CardContent></Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Consumo/sem</TableHead>
                    <TableHead className="text-right">Comprar</TableHead>
                    <TableHead className="text-right">Dias restantes</TableHead>
                    <TableHead className="text-right">Custo est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsNeedingPurchase.map(item => (
                    <TableRow key={item.productId} className={item.daysUntilStockout !== null && item.daysUntilStockout <= 3 ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.daysUntilStockout !== null && item.daysUntilStockout <= 3 && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.supplierName || '—'}</TableCell>
                      <TableCell className="text-right">{formatQty(item.currentStock, item.unit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatQty(item.weeklyConsumption, item.unit)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatQty(item.suggestedPurchase, item.unit)}</TableCell>
                      <TableCell className="text-right">
                        {item.daysUntilStockout !== null ? (
                          <Badge variant={item.daysUntilStockout <= 3 ? 'destructive' : item.daysUntilStockout <= 7 ? 'secondary' : 'outline'}>
                            {item.daysUntilStockout}d
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.estimatedCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* By Supplier */}
        <TabsContent value="supplier" className="mt-4 space-y-4">
          {Object.entries(bySupplier).sort(([a], [b]) => a.localeCompare(b)).map(([supplier, items]) => {
            const subtotal = items.reduce((s, i) => s + i.estimatedCost, 0);
            return (
              <Card key={supplier}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" /> {supplier}
                    <Badge variant="outline" className="ml-auto">{items.length} itens · {formatCurrency(subtotal)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.productId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          {item.daysUntilStockout !== null && item.daysUntilStockout <= 3 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          <span className="text-sm font-medium">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">estoque: {formatQty(item.currentStock, item.unit)}</span>
                          <span className="font-bold text-primary">{formatQty(item.suggestedPurchase, item.unit)}</span>
                          <span className="text-muted-foreground w-20 text-right">{formatCurrency(item.estimatedCost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {Object.keys(bySupplier).length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum item precisa ser comprado</CardContent></Card>
          )}
        </TabsContent>

        {/* All Products */}
        <TabsContent value="all" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mín.</TableHead>
                  <TableHead className="text-right">Consumo/dia</TableHead>
                  <TableHead className="text-right">Consumo/sem</TableHead>
                  <TableHead className="text-right">Dias restantes</TableHead>
                  <TableHead className="text-right">Sugestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandItems.map(item => (
                  <TableRow key={item.productId} className={item.suggestedPurchase > 0 ? 'font-medium' : 'text-muted-foreground'}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{formatQty(item.currentStock, item.unit)}</TableCell>
                    <TableCell className="text-right">{formatQty(item.minStock, item.unit)}</TableCell>
                    <TableCell className="text-right">{formatQty(item.avgDailyConsumption, item.unit)}</TableCell>
                    <TableCell className="text-right">{formatQty(item.weeklyConsumption, item.unit)}</TableCell>
                    <TableCell className="text-right">
                      {item.daysUntilStockout !== null ? (
                        <Badge variant={item.daysUntilStockout <= 3 ? 'destructive' : item.daysUntilStockout <= 7 ? 'secondary' : 'outline'}>
                          {item.daysUntilStockout}d
                        </Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.suggestedPurchase > 0 ? (
                        <span className="text-primary font-bold">{formatQty(item.suggestedPurchase, item.unit)}</span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {demandItems.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
