import { useState, useMemo } from 'react';
import { useSales, useTodaySaleItems, useCreateSale, useCancelSale, channelLabel, paymentLabel, statusLabel } from '@/hooks/useSales';
import { printCustomerReceipt, paymentMethodLabel } from '@/lib/print';
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import { useValidateCoupon, useUseCoupon, useLoyaltyPrograms, creditPoints, generateCouponCode, type Coupon } from '@/hooks/useLoyalty';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuItems } from '@/hooks/useMenuItems';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Minus, ShoppingBag, Users, Pizza, Beer, Receipt, X, Search, Ticket, Printer } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

type Channel = 'balcao' | 'delivery' | 'ifood' | 'rappi' | 'whatsapp';
type PayMethod = 'dinheiro' | 'pix' | 'cartao' | 'app';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export default function SalesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const { data: sales, isLoading } = useSales(dateFilter);
  const { data: todayItems } = useTodaySaleItems();
  const { data: menuItems } = useMenuItems();
  const createSale = useCreateSale();
  const cancelSale = useCancelSale();

  const [saleOpen, setSaleOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>('balcao');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('dinheiro');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  const { data: customers } = useCustomers();
  const createCustomer = useCreateCustomer();
  const validateCoupon = useValidateCoupon();
  const useCoupon = useUseCoupon();
  const { data: loyaltyPrograms } = useLoyaltyPrograms();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const activeSales = (sales || []).filter(s => s.status !== 'cancelado');
  const totalRevenue = activeSales.reduce((s, sale) => s + Number(sale.total_amount), 0);
  const totalOrders = activeSales.length;
  const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const ordersByChannel = useMemo(() => {
    const counts: Record<string, number> = {};
    activeSales.forEach(s => { counts[s.channel] = (counts[s.channel] || 0) + 1; });
    return counts;
  }, [activeSales]);

  const pizzasVendidas = useMemo(() => {
    return (todayItems || []).filter(i => (i as any).menu_items?.category === 'pizza').reduce((s, i) => s + i.quantity, 0);
  }, [todayItems]);

  const bebidasVendidas = useMemo(() => {
    return (todayItems || []).filter(i => (i as any).menu_items?.category === 'bebida').reduce((s, i) => s + i.quantity, 0);
  }, [todayItems]);

  // Hourly chart
  const hourlyData = useMemo(() => {
    const hours: Record<number, { count: number; total: number }> = {};
    for (let h = 10; h <= 23; h++) hours[h] = { count: 0, total: 0 };
    activeSales.forEach(s => {
      const h = new Date(s.created_at).getHours();
      if (hours[h]) {
        hours[h].count++;
        hours[h].total += Number(s.total_amount);
      }
    });
    return Object.entries(hours).map(([h, v]) => ({ hora: `${h}h`, pedidos: v.count, total: v.total }));
  }, [activeSales]);

  // Filtered sales for table
  const filteredSales = (sales || []).filter(s => {
    if (channelFilter !== 'all' && s.channel !== channelFilter) return false;
    if (paymentFilter !== 'all' && s.payment_method !== paymentFilter) return false;
    return true;
  });

  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'fixo') return Math.min(appliedCoupon.discount_value, cartTotal);
    if (appliedCoupon.discount_type === 'percentual') return cartTotal * (appliedCoupon.discount_value / 100);
    return 0;
  }, [appliedCoupon, cartTotal]);
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const addToCart = (item: { id: string; name: string; sale_price: number }) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.id);
      if (existing) return prev.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menu_item_id: item.id, name: item.name, quantity: 1, unit_price: Number(item.sale_price) }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === menuItemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(c => c.menu_item_id !== menuItemId);
      return prev.map(c => c.menu_item_id === menuItemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const filteredCustomers = useMemo(() => {
    if (!customers || !customerSearch) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5);
  }, [customers, customerSearch]);

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    setCouponError('');
    validateCoupon.mutate(couponCode, {
      onSuccess: (coupon) => {
        if (coupon.min_order_value > 0 && cartTotal < coupon.min_order_value) {
          setCouponError(`Pedido mínimo: R$ ${coupon.min_order_value}`);
          return;
        }
        setAppliedCoupon(coupon);
      },
      onError: (err: any) => setCouponError(err.message),
    });
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) return;
    createSale.mutate({
      channel,
      customer_name: customerName || undefined,
      table_number: tableNumber || undefined,
      payment_method: paymentMethod,
      total_amount: finalTotal,
      customer_id: selectedCustomerId || undefined,
      items: cart.map(c => ({
        menu_item_id: c.menu_item_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
        subtotal: c.quantity * c.unit_price,
      })),
    }, {
      onSuccess: async (sale) => {
        // Mark coupon as used
        if (appliedCoupon && sale) {
          useCoupon.mutate({ couponId: appliedCoupon.id, saleId: sale.id });
        }
        // Credit loyalty points
        if (selectedCustomerId && sale) {
          const activePrograms = (loyaltyPrograms || []).filter(p => p.active);
          for (const program of activePrograms) {
            let pts = 0;
            if (program.rule_type === 'por_pedido') pts = Math.floor(program.points_per_unit);
            else if (program.rule_type === 'por_valor') pts = Math.floor(finalTotal / (program.points_per_unit || 1));
            else if (program.rule_type === 'por_item') {
              const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
              pts = Math.floor(totalItems * program.points_per_unit);
            }
            if (pts > 0) {
              try {
                const customer = customers?.find(c => c.id === selectedCustomerId);
                const newBalance = await creditPoints({
                  customerId: selectedCustomerId,
                  familyGroupId: customer?.family_group_id,
                  saleId: sale.id,
                  programId: program.id,
                  points: pts,
                  description: `Venda #${sale.id.slice(0, 8)}`,
                  expirationDays: program.expiration_days,
                });
                const remaining = program.points_required - (newBalance % program.points_required);
                toast({
                  title: `✅ ${customerName} ganhou ${pts} pontos!`,
                  description: `Saldo: ${newBalance} pts${remaining <= program.points_required ? ` (faltam ${remaining} para recompensa!)` : ''}`,
                });
                // Auto-generate coupon when threshold reached
                if (newBalance >= program.points_required) {
                  const code = generateCouponCode(program.type === 'familia' ? 'FAM' : 'FID');
                  await supabase.from('coupons').insert({
                    user_id: user!.id, code, type: 'resgate',
                    discount_type: program.reward_type === 'desconto_percentual' ? 'percentual' : program.reward_type === 'item_gratis' ? 'item_gratis' : 'fixo',
                    discount_value: program.reward_value,
                    customer_id: selectedCustomerId,
                    program_id: program.id,
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  });
                }
                qc.invalidateQueries({ queryKey: ['loyalty_points'] });
                qc.invalidateQueries({ queryKey: ['loyalty_balance'] });
                qc.invalidateQueries({ queryKey: ['coupons'] });
              } catch { /* ignore */ }
            }
          }
        }
        setSaleOpen(false);
        setCart([]);
        setCustomerName('');
        setTableNumber('');
        setSelectedCustomerId(null);
        setCustomerSearch('');
        setAppliedCoupon(null);
        setCouponCode('');
      },
    });
  };

  const handleQuickCustomer = () => {
    if (!quickName || !quickPhone) return;
    createCustomer.mutate({ name: quickName, phone: quickPhone, birth_date: '2000-01-01', active: true, notes: null, family_group_id: null, address_street: null, address_number: null, address_complement: null, address_neighborhood: null, address_city: null, address_zipcode: null }, {
      onSuccess: () => { setQuickCustomerOpen(false); setQuickName(''); setQuickPhone(''); },
    });
  };

  const activeMenuItems = (menuItems || []).filter(m => m.active);
  const filteredMenu = activeMenuItems.filter(m => !menuSearch || m.name.toLowerCase().includes(menuSearch.toLowerCase()));

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Vendas</h1>
          <p className="text-sm text-muted-foreground">Registro e controle de vendas</p>
        </div>
        <Button onClick={() => setSaleOpen(true)} size="lg" className="gap-2">
          <Plus className="h-5 w-5" /> Nova Venda
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Clientes</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ShoppingBag className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Pedidos</p>
            <div className="text-xs text-muted-foreground mt-1 space-x-1">
              {Object.entries(ordersByChannel).map(([ch, cnt]) => (
                <Badge key={ch} variant="outline" className="text-[10px]">{channelLabel(ch)}: {cnt}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Pizza className="h-6 w-6 text-secondary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Pizzas</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{pizzasVendidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Beer className="h-6 w-6 text-secondary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Bebidas</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{bebidasVendidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Receipt className="h-6 w-6 text-[hsl(var(--success))] mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(ticketMedio)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[hsl(var(--success))]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Faturamento</p>
            <p className="text-lg font-bold text-[hsl(var(--success))]" style={{ fontFamily: 'Nunito' }}>{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="balcao">Balcão</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="ifood">iFood</SelectItem>
            <SelectItem value="rappi">Rappi</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Pagamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas formas</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
            <SelectItem value="app">App</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma venda encontrada</TableCell></TableRow>
            ) : (
              filteredSales.map(s => (
                <TableRow key={s.id} className={s.status === 'cancelado' ? 'opacity-50' : ''}>
                  <TableCell className="text-sm">{new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell className="text-sm">{s.customer_name || '—'}{s.table_number ? ` (Mesa ${s.table_number})` : ''}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{channelLabel(s.channel)}</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-[hsl(var(--success))]">{formatCurrency(Number(s.total_amount))}</TableCell>
                  <TableCell className="text-sm">{paymentLabel(s.payment_method)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'fechado' ? 'default' : s.status === 'cancelado' ? 'destructive' : 'secondary'} className="text-xs">
                      {statusLabel(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {s.status !== 'cancelado' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            printCustomerReceipt({
                              date: new Date(s.date).toLocaleDateString('pt-BR'),
                              orderNumber: s.id.slice(0, 8),
                              tableNumber: s.table_number || undefined,
                              items: (s as any).sale_items?.map((si: any) => ({
                                name: si.menu_items?.name || 'Item',
                                quantity: si.quantity,
                                total: Number(si.subtotal),
                              })) || [{ name: 'Venda', quantity: 1, total: Number(s.total_amount) }],
                              subtotal: Number(s.total_amount) + Number(s.discount_amount),
                              discount: Number(s.discount_amount),
                              total: Number(s.total_amount),
                              paymentMethod: paymentMethodLabel(s.payment_method),
                            });
                          }}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                            if (confirm('Cancelar esta venda?')) cancelSale.mutate(s.id);
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Hourly Chart */}
      {hourlyData.some(d => d.pedidos > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Vendas por Hora</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hora" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip formatter={(v: number, name: string) => name === 'total' ? formatCurrency(v) : v} />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* New Sale Dialog */}
      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Canal</Label>
                <Select value={channel} onValueChange={v => setChannel(v as Channel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balcao">Balcão</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="ifood">iFood</SelectItem>
                    <SelectItem value="rappi">Rappi</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pagamento</Label>
                <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PayMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente (busca)</Label>
                <Input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomerId(null); }} placeholder="Buscar por nome ou telefone" />
                {filteredCustomers.length > 0 && (
                  <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button key={c.id} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setSelectedCustomerId(c.id); setCustomerName(c.name); setCustomerSearch(c.name); }}>
                        {c.name} — {c.phone}
                      </button>
                    ))}
                  </div>
                )}
                {customerSearch && filteredCustomers.length === 0 && (
                  <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1" onClick={() => setQuickCustomerOpen(true)}>+ Cadastrar novo cliente</Button>
                )}
              </div>
              <div><Label>Mesa (opcional)</Label><Input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Nº da mesa" /></div>
            </div>

            {/* Menu items for adding */}
            <div>
              <Label>Cardápio</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar item..." value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {filteredMenu.map(item => {
                  const inCart = cart.find(c => c.menu_item_id === item.id);
                  return (
                    <Button key={item.id} variant={inCart ? 'default' : 'outline'} className="h-auto py-2 px-3 flex flex-col items-start text-left" onClick={() => addToCart(item)}>
                      <span className="text-sm font-medium truncate w-full">{item.name}</span>
                      <span className="text-xs opacity-70">{formatCurrency(Number(item.sale_price))}</span>
                      {inCart && <Badge className="mt-1 text-xs">{inCart.quantity}x</Badge>}
                    </Button>
                  );
                })}
              </div>
              {filteredMenu.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum item no cardápio. Cadastre itens em /cardápio primeiro.</p>}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="font-semibold text-sm">Itens do Pedido</p>
                {cart.map(item => (
                  <div key={item.menu_item_id} className="flex items-center justify-between">
                    <span className="text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.menu_item_id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addToCart({ id: item.menu_item_id, name: item.name, sale_price: item.unit_price })}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold w-20 text-right">{formatCurrency(item.quantity * item.unit_price)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">{formatCurrency(cartTotal)}</span>
                  </div>
                  {/* Coupon */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8 h-8 text-sm" placeholder="Código do cupom" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); setAppliedCoupon(null); }} />
                    </div>
                    <Button size="sm" variant="outline" className="h-8" onClick={handleApplyCoupon} disabled={!couponCode}>Aplicar</Button>
                  </div>
                  {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[hsl(var(--success))]">Desconto ({appliedCoupon.code})</span>
                      <span className="text-[hsl(var(--success))]">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-lg font-bold text-[hsl(var(--success))]">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaleOpen(false); setCart([]); }}>Cancelar</Button>
            <Button onClick={handleCreateSale} disabled={cart.length === 0 || createSale.isPending}>
              {createSale.isPending ? 'Salvando...' : 'Confirmar Venda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Customer Dialog */}
      <Dialog open={quickCustomerOpen} onOpenChange={setQuickCustomerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Cadastro Rápido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={quickName} onChange={e => setQuickName(e.target.value)} /></div>
            <div><Label>Telefone *</Label><Input value={quickPhone} onChange={e => setQuickPhone(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCustomerOpen(false)}>Cancelar</Button>
            <Button onClick={handleQuickCustomer} disabled={!quickName || !quickPhone}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
