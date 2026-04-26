import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface NeighborhoodData {
  neighborhood: string;
  orderCount: number;
  totalRevenue: number;
  avgTicket: number;
  customerCount: number;
  percentage: number;
}

function useDeliveryZones() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['delivery_zones', user?.id],
    queryFn: async () => {
      // Fetch customers with neighborhoods + sales in parallel
      const [customersRes, salesRes, addressesRes] = await Promise.all([
        supabase.from('customers').select('id, name, address_neighborhood'),
        supabase.from('sales').select('id, customer_id, total_amount, status, channel').eq('status', 'fechado'),
        supabase.from('customer_addresses').select('customer_id, neighborhood'),
      ]);

      const customers = customersRes.data || [];
      const sales = salesRes.data || [];
      const addresses = addressesRes.data || [];

      // Build customer -> neighborhood map (prefer address table, fallback to customer field)
      const customerNeighborhood: Record<string, string> = {};
      customers.forEach(c => {
        if (c.address_neighborhood) customerNeighborhood[c.id] = c.address_neighborhood;
      });
      addresses.forEach(a => {
        if (a.neighborhood) customerNeighborhood[a.customer_id] = a.neighborhood;
      });

      // Aggregate by neighborhood
      const neighborhoodMap: Record<string, { orders: number; revenue: number; customers: Set<string> }> = {};

      sales.forEach(sale => {
        if (!sale.customer_id) return;
        const hood = customerNeighborhood[sale.customer_id];
        if (!hood || !hood.trim()) return;
        const key = hood.trim();
        if (!neighborhoodMap[key]) neighborhoodMap[key] = { orders: 0, revenue: 0, customers: new Set() };
        neighborhoodMap[key].orders++;
        neighborhoodMap[key].revenue += Number(sale.total_amount);
        neighborhoodMap[key].customers.add(sale.customer_id);
      });

      const totalOrders = Object.values(neighborhoodMap).reduce((s, n) => s + n.orders, 0);

      const neighborhoods: NeighborhoodData[] = Object.entries(neighborhoodMap)
        .map(([name, data]) => ({
          neighborhood: name,
          orderCount: data.orders,
          totalRevenue: data.revenue,
          avgTicket: data.orders > 0 ? data.revenue / data.orders : 0,
          customerCount: data.customers.size,
          percentage: totalOrders > 0 ? (data.orders / totalOrders) * 100 : 0,
        }))
        .sort((a, b) => b.orderCount - a.orderCount);

      // Customers without orders (potential)
      const customersWithOrders = new Set(sales.filter(s => s.customer_id).map(s => s.customer_id));
      const unexploredNeighborhoods: Record<string, number> = {};
      customers.forEach(c => {
        if (customersWithOrders.has(c.id)) return;
        const hood = customerNeighborhood[c.id];
        if (!hood?.trim()) return;
        unexploredNeighborhoods[hood.trim()] = (unexploredNeighborhoods[hood.trim()] || 0) + 1;
      });

      const unexplored = Object.entries(unexploredNeighborhoods)
        .map(([name, count]) => ({ neighborhood: name, inactiveCustomers: count }))
        .sort((a, b) => b.inactiveCustomers - a.inactiveCustomers);

      const avgTicketGlobal = totalOrders > 0
        ? Object.values(neighborhoodMap).reduce((s, n) => s + n.revenue, 0) / totalOrders
        : 0;

      return { neighborhoods, unexplored, totalOrders, avgTicketGlobal };
    },
    enabled: !!user,
  });
}

export default function DeliveryZonesPage() {
  const { data, isLoading } = useDeliveryZones();
  const [sortBy, setSortBy] = useState<'orders' | 'revenue' | 'ticket'>('orders');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const { neighborhoods = [], unexplored = [], totalOrders = 0, avgTicketGlobal = 0 } = data || {};

  const sorted = [...neighborhoods].sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    if (sortBy === 'ticket') return b.avgTicket - a.avgTicket;
    return b.orderCount - a.orderCount;
  });

  const top10 = sorted.slice(0, 10);
  const chartData = top10.map(n => ({
    name: n.neighborhood.length > 12 ? n.neighborhood.slice(0, 12) + '…' : n.neighborhood,
    pedidos: n.orderCount,
    faturamento: n.totalRevenue,
  }));

  const totalRevenue = neighborhoods.reduce((s, n) => s + n.totalRevenue, 0);
  const totalCustomers = new Set(neighborhoods.flatMap(() => [])).size;
  const uniqueNeighborhoods = neighborhoods.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Análise de Zona de Entrega</h1>
        <p className="text-sm text-muted-foreground">Descubra onde estão seus clientes e onde investir em marketing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><MapPin className="h-4 w-4" /> Bairros atendidos</div>
            <p className="text-2xl font-bold">{uniqueNeighborhoods}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Users className="h-4 w-4" /> Total de pedidos</div>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="h-4 w-4" /> Faturamento</div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /> Ticket médio</div>
            <p className="text-2xl font-bold">{formatCurrency(avgTicketGlobal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Bairros por Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name: string) => [name === 'faturamento' ? formatCurrency(value) : value, name === 'faturamento' ? 'Faturamento' : 'Pedidos']} />
                  <Bar dataKey="pedidos" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${i === 0 ? 'var(--primary)' : i < 3 ? 'var(--secondary)' : 'var(--muted-foreground)'})`} opacity={i < 3 ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ranking por Bairro</CardTitle>
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Por pedidos</SelectItem>
                <SelectItem value="revenue">Por faturamento</SelectItem>
                <SelectItem value="ticket">Por ticket médio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum dado de entrega encontrado</p>
              <p className="text-xs mt-1">Cadastre clientes com bairro e registre vendas para ver a análise</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Ticket médio</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((n, i) => {
                    const aboveAvg = n.avgTicket > avgTicketGlobal;
                    return (
                      <TableRow key={n.neighborhood}>
                        <TableCell>
                          {i < 3 ? (
                            <Badge variant={i === 0 ? 'default' : 'secondary'} className="w-7 justify-center">{i + 1}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm pl-2">{i + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{n.neighborhood}</TableCell>
                        <TableCell className="text-right font-semibold">{n.orderCount}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{n.percentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(n.totalRevenue)}</TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1">
                            {formatCurrency(n.avgTicket)}
                            {aboveAvg ? <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> : <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{n.customerCount}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unexplored Neighborhoods */}
      {unexplored.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> Bairros com Potencial Inexplorado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Clientes cadastrados nesses bairros ainda não fizeram pedidos — oportunidade para campanhas de marketing
            </p>
            <div className="flex flex-wrap gap-2">
              {unexplored.map(u => (
                <Badge key={u.neighborhood} variant="outline" className="gap-1 py-1.5 px-3">
                  <MapPin className="h-3 w-3" />
                  {u.neighborhood}
                  <span className="text-muted-foreground ml-1">({u.inactiveCustomers} clientes)</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
