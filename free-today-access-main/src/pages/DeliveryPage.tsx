import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MapPin, ChevronRight, Package, Truck, CheckCircle2, AlertTriangle, ExternalLink, Printer } from 'lucide-react';
import { printKitchenOrder, printDeliveryOrder, paymentMethodLabel } from '@/lib/print';
import { useDeliveryOrders, useUpdateDeliveryStatus, useDeliveryEmployees } from '@/hooks/useDelivery';
import { channelLabel } from '@/hooks/useSales';

const columns: { key: string; label: string; icon: any; color: string }[] = [
  { key: 'recebido', label: 'Recebido', icon: Package, color: 'border-t-blue-500' },
  { key: 'em_preparo', label: 'Em Preparo', icon: Clock, color: 'border-t-orange-500' },
  { key: 'saiu_entrega', label: 'Saiu p/ Entrega', icon: Truck, color: 'border-t-purple-500' },
  { key: 'entregue', label: 'Entregue', icon: CheckCircle2, color: 'border-t-green-500' },
];

export default function DeliveryPage() {
  const [channelFilter, setChannelFilter] = useState('all');
  const { data: orders, isLoading } = useDeliveryOrders(channelFilter);
  const updateStatus = useUpdateDeliveryStatus();
  const { data: employees } = useDeliveryEmployees();

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [, setTick] = useState(0);

  // Live timer
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = { recebido: [], em_preparo: [], saiu_entrega: [], entregue: [] };
    orders?.forEach(o => {
      const s = o.delivery_status || 'recebido';
      if (g[s]) g[s].push(o);
    });
    return g;
  }, [orders]);

  // Metrics
  const now = new Date();
  const openOrders = (grouped.recebido?.length ?? 0) + (grouped.em_preparo?.length ?? 0) + (grouped.saiu_entrega?.length ?? 0);
  const deliveredToday = grouped.entregue?.length ?? 0;
  const lateOrders = orders?.filter(o => {
    if (['entregue', 'cancelado'].includes(o.delivery_status || 'recebido')) return false;
    const mins = (now.getTime() - new Date(o.created_at).getTime()) / 60000;
    return mins > (o.estimated_delivery_minutes || 45);
  }).length ?? 0;
  const avgTime = useMemo(() => {
    const delivered = grouped.entregue?.filter(o => o.delivery_delivered_at && o.created_at) ?? [];
    if (delivered.length === 0) return 0;
    const total = delivered.reduce((s: number, o: any) => s + (new Date(o.delivery_delivered_at).getTime() - new Date(o.created_at).getTime()) / 60000, 0);
    return Math.round(total / delivered.length);
  }, [grouped.entregue]);

  const handleAdvance = (order: any) => {
    const flow: Record<string, string> = { recebido: 'em_preparo', em_preparo: 'saiu_entrega', saiu_entrega: 'entregue' };
    const next = flow[order.delivery_status || 'recebido'];
    if (!next) return;

    if (next === 'saiu_entrega') {
      setPendingOrderId(order.id);
      setSelectedDriver('');
      setShowDriverModal(true);
      return;
    }

    updateStatus.mutate({ id: order.id, delivery_status: next as any });
  };

  const confirmDriver = () => {
    if (pendingOrderId) {
      updateStatus.mutate({
        id: pendingOrderId,
        delivery_status: 'saiu_entrega',
        delivery_employee_id: selectedDriver || undefined,
      });
    }
    setShowDriverModal(false);
    setPendingOrderId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery</h1>
          <p className="text-muted-foreground">Controle de pedidos e entregas</p>
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="ifood">iFood</SelectItem>
            <SelectItem value="rappi">Rappi</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Em aberto" value={openOrders} />
        <MetricCard label="Tempo médio" value={`${avgTime}min`} />
        <MetricCard label="Atrasados" value={lateOrders} alert={lateOrders > 0} />
        <MetricCard label="Entregues hoje" value={deliveredToday} />
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map(col => (
            <div key={col.key} className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg bg-muted/50 border-t-4 ${col.color}`}>
                <col.icon className="h-4 w-4" />
                <span className="font-semibold text-sm">{col.label}</span>
                <Badge variant="secondary" className="ml-auto">{grouped[col.key]?.length ?? 0}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2 pr-2">
                  {grouped[col.key]?.map((order: any) => (
                    <DeliveryCard
                      key={order.id}
                      order={order}
                      onAdvance={() => handleAdvance(order)}
                      showAdvance={col.key !== 'entregue'}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      )}

      {/* Driver selection modal */}
      <Dialog open={showDriverModal} onOpenChange={setShowDriverModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar Entregador</DialogTitle></DialogHeader>
          <div>
            <Label>Entregador</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {employees?.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}{e.role ? ` — ${e.role}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={confirmDriver}>Confirmar Saída</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 text-center">
        <p className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>
          {alert && <AlertTriangle className="inline h-5 w-5 mr-1" />}
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function DeliveryCard({ order, onAdvance, showAdvance }: { order: any; onAdvance: () => void; showAdvance: boolean }) {
  const now = new Date();
  const elapsed = Math.round((now.getTime() - new Date(order.created_at).getTime()) / 60000);
  const isLate = elapsed > (order.estimated_delivery_minutes || 45) && !['entregue', 'cancelado'].includes(order.delivery_status || 'recebido');

  const customer = order.customers;
  const address = customer ? [customer.address_street, customer.address_number, customer.address_neighborhood, customer.address_city].filter(Boolean).join(', ') : order.customer_name || 'Sem endereço';
  const mapsUrl = customer?.address_street ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

  const items = order.sale_items?.map((si: any) => `${si.quantity}x ${si.menu_items?.name}`).join(', ') || '';

  // Delivery time
  let deliveryTime = '';
  if (order.delivery_delivered_at && order.created_at) {
    const mins = Math.round((new Date(order.delivery_delivered_at).getTime() - new Date(order.created_at).getTime()) / 60000);
    deliveryTime = `${mins}min`;
  }

  return (
    <Card className={`${isLate ? 'border-destructive bg-destructive/5' : ''}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
          <Badge variant="outline" className="text-xs">{channelLabel(order.channel)}</Badge>
        </div>

        <p className="font-medium text-sm truncate">{order.customer_name || customer?.name || 'Cliente'}</p>

        {items && <p className="text-xs text-muted-foreground line-clamp-2">{items}</p>}

        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{address}</span>
        </div>

        {mapsUrl && (order.delivery_status === 'saiu_entrega' || order.delivery_status === 'em_preparo') && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink className="h-3 w-3" />Abrir no Maps
          </a>
        )}

        {order.employees?.name && <p className="text-xs">🛵 {order.employees.name}</p>}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs flex items-center gap-1 ${isLate ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />{elapsed}min
            </span>
            {deliveryTime && <span className="text-xs text-green-600">✓ {deliveryTime}</span>}
          </div>
          <span className="text-sm font-bold">R$ {Number(order.total_amount).toFixed(2)}</span>
        </div>

        {showAdvance && (
          <div className="flex gap-1 mt-1">
            <Button size="sm" className="flex-1" onClick={onAdvance} variant="outline">
              Avançar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              const items = order.sale_items?.map((si: any) => ({
                name: si.menu_items?.name || 'Item',
                quantity: si.quantity,
              })) || [];
              if (order.delivery_status === 'recebido' || order.delivery_status === 'em_preparo') {
                printKitchenOrder({
                  orderNumber: order.id.slice(0, 8),
                  items: items.map(i => ({ ...i })),
                  createdAt: order.created_at,
                });
              } else {
                printDeliveryOrder({
                  orderNumber: order.id.slice(0, 8),
                  driverName: order.employees?.name,
                  customerName: order.customer_name || customer?.name || 'Cliente',
                  customerPhone: customer?.phone,
                  address,
                  items,
                  total: Number(order.total_amount),
                  isPaid: true,
                  paymentMethod: paymentMethodLabel(order.payment_method),
                  notes: order.delivery_notes,
                  createdAt: order.created_at,
                });
              }
            }}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
