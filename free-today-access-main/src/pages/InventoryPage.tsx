import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { Camera, ClipboardCheck, AlertTriangle, CheckCircle2, Loader2, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/export-utils';

interface CountItem {
  product_id: string;
  name: string;
  unit: string;
  barcode: string | null;
  expected: number;
  counted: number | null;
  focused: boolean;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [started, setStarted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products')
        .select('id, name, unit, quantity_current, barcode, cost_price')
        .eq('user_id', user!.id)
        .order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const startInventory = () => {
    if (!products) return;
    setCountItems(products.map(p => ({
      product_id: p.id,
      name: p.name,
      unit: p.unit,
      barcode: (p as any).barcode || null,
      expected: Number(p.quantity_current),
      counted: null,
      focused: false,
    })));
    setStarted(true);
  };

  const updateCount = (productId: string, value: number | null) => {
    setCountItems(items => items.map(i =>
      i.product_id === productId ? { ...i, counted: value, focused: false } : i
    ));
  };

  const focusProduct = (productId: string) => {
    setCountItems(items => items.map(i => ({
      ...i,
      focused: i.product_id === productId,
    })));
    // Scroll to element
    setTimeout(() => {
      document.getElementById(`count-${productId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(`count-input-${productId}`)?.focus();
    }, 100);
  };

  const handleScanResult = (code: string) => {
    const item = countItems.find(i => i.barcode === code);
    if (item) {
      focusProduct(item.product_id);
      toast.success(`Produto: ${item.name}`);
    } else {
      toast.error(`Código "${code}" não encontrado no estoque.`);
    }
  };

  const divergences = useMemo(() =>
    countItems.filter(i => i.counted !== null && i.counted !== i.expected),
    [countItems]
  );

  const countedCount = countItems.filter(i => i.counted !== null).length;

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      for (const item of divergences) {
        const diff = (item.counted ?? 0) - item.expected;
        // Update product
        await supabase.from('products').update({
          quantity_current: item.counted ?? 0,
          updated_at: new Date().toISOString(),
        }).eq('id', item.product_id);

        // Create stock_movement
        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          user_id: user.id,
          type: 'ajuste',
          quantity: Math.abs(diff),
          reason: `Inventário: ${diff > 0 ? 'acréscimo' : 'redução'} de ${Math.abs(diff)} ${item.unit}`,
          date: new Date().toISOString().split('T')[0],
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success(`✅ Estoque ajustado! ${divergences.length} produto(s) corrigido(s).`);
      setStarted(false);
      setCountItems([]);
      setConfirmOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    if (!search) return countItems;
    const q = search.toLowerCase();
    return countItems.filter(i => i.name.toLowerCase().includes(q) || i.barcode?.includes(q));
  }, [countItems, search]);

  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Inventário / Contagem de Estoque
          </h1>
          <p className="text-muted-foreground mt-1">
            Conte fisicamente cada produto e ajuste divergências automaticamente
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <ClipboardCheck className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Iniciar novo inventário</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              O sistema carregará todos os {products?.length || 0} produtos cadastrados com a quantidade esperada. 
              Você contará cada um e ao final poderá ajustar as divergências.
            </p>
            <Button size="lg" onClick={startInventory} disabled={isLoading || !products?.length}>
              <ClipboardCheck className="h-5 w-5 mr-2" /> Iniciar contagem
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Inventário em andamento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {countedCount}/{countItems.length} contados • {divergences.length} divergência(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <Camera className="h-4 w-4 mr-2" /> Modo Scanner
          </Button>
          {divergences.length > 0 && (
            <Button onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Ajustar estoque ({divergences.length})
            </Button>
          )}
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        mode="barcode"
        continuous
        onResult={handleScanResult}
        placeholder="Digite o código de barras"
      />

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
        </div>
      </div>

      {/* Products list */}
      <div className="space-y-2">
        {filtered.map(item => {
          const diff = item.counted !== null ? item.counted - item.expected : null;
          const hasDivergence = diff !== null && diff !== 0;

          return (
            <Card key={item.product_id} id={`count-${item.product_id}`} className={`transition-all ${item.focused ? 'ring-2 ring-primary' : ''} ${hasDivergence ? 'border-orange-300 dark:border-orange-700' : ''}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.unit}{item.barcode ? ` • ${item.barcode}` : ''}</p>
                  </div>
                  <div className="text-center w-20">
                    <p className="text-xs text-muted-foreground">Esperado</p>
                    <p className="text-sm font-semibold">{item.expected}</p>
                  </div>
                  <div className="w-28">
                    <p className="text-xs text-muted-foreground mb-1">Contado</p>
                    <Input
                      id={`count-input-${item.product_id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.counted ?? ''}
                      onChange={(e) => updateCount(item.product_id, e.target.value ? parseFloat(e.target.value) : null)}
                      className="h-8 text-center"
                      placeholder="-"
                    />
                  </div>
                  <div className="w-20 text-center">
                    {hasDivergence && (
                      <Badge variant={diff! > 0 ? 'outline' : 'destructive'} className="text-xs">
                        {diff! > 0 ? '+' : ''}{diff} {item.unit}
                      </Badge>
                    )}
                    {item.counted !== null && !hasDivergence && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirm adjustment dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Ajustar estoque
            </DialogTitle>
            <DialogDescription>
              {divergences.length} produto(s) com divergência serão ajustados:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {divergences.map(item => {
              const diff = (item.counted ?? 0) - item.expected;
              return (
                <div key={item.product_id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.expected} → {item.counted}</span>
                    <Badge variant={diff > 0 ? 'outline' : 'destructive'} className="text-xs">
                      {diff > 0 ? '+' : ''}{diff}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirmar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
