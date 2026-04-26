import { useMemo } from 'react';
import { useScope } from '@/contexts/ScopeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useSales, useTodaySaleItems } from '@/hooks/useSales';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { DueAlerts } from '@/components/dashboard/DueAlerts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, Pizza, Users, Receipt, Gift, Ticket, Star, Info } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useCoupons, useFamilyGroups } from '@/hooks/useLoyalty';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  demoTransactions, demoCategories, demoChartData, demoPieData,
  demoLowStock, demoBirthdayCustomers
} from '@/lib/demo-data';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Dashboard() {
  const { scope } = useScope();
  const { data: transactions, isLoading } = useTransactions({ scope });
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const today = new Date().toISOString().split('T')[0];
  const { data: todaySales } = useSales(today);
  const { data: todayItems } = useTodaySaleItems();

  // Determine if we're using demo data
  const hasRealData = (transactions || []).length > 0;
  const isDemo = !hasRealData && !isLoading;

  const filtered = hasRealData ? (transactions || []) : (isDemo ? demoTransactions : []);
  const cats = hasRealData ? (categories || []) : (isDemo ? demoCategories : []);

  const revenue = filtered.filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const pendingCount = filtered.filter(t => t.status === 'pending').length;

  // CMV
  const stockExitTotal = useMemo(() => {
    const ingredientCats = cats.filter(c => c.group === 'Operacional').map(c => c.id);
    return filtered.filter(t => t.type === 'expense' && ingredientCats.includes(t.category_id || '')).reduce((s, t) => s + Number(t.amount), 0);
  }, [filtered, cats]);

  const cmvPercent = revenue > 0 ? (stockExitTotal / revenue) * 100 : 0;
  const cmvColor = cmvPercent < 35 ? 'text-[hsl(var(--success))]' : cmvPercent < 45 ? 'text-[hsl(var(--warning))]' : 'text-destructive';

  const lowStockItems = isDemo ? demoLowStock : (products || []).filter(p => Number(p.quantity_current) <= Number(p.quantity_min));

  const dueSoon = filtered.filter(t => {
    if (t.status !== 'pending' || !t.due_date) return false;
    const due = new Date(t.due_date);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  // Sales metrics
  const activeSales = (todaySales || []).filter(s => s.status !== 'cancelado');
  const customersToday = isDemo ? 18 : activeSales.length;
  const pizzasToday = isDemo ? 42 : (todayItems || []).filter(i => (i as any).menu_items?.category === 'pizza').reduce((s, i) => s + i.quantity, 0);

  // Monthly ticket médio
  const monthRevenue = filtered.filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0);
  const monthSalesCount = isDemo ? 156 : filtered.filter(t => t.type === 'revenue').length;
  const ticketMedio = monthSalesCount > 0 ? monthRevenue / monthSalesCount : 0;

  // Birthday customers
  const { data: allCustomers } = useCustomers();
  const birthdaySoon = useMemo(() => {
    if (isDemo) return demoBirthdayCustomers;
    if (!allCustomers) return [];
    const now = new Date();
    return allCustomers.filter(c => {
      const bd = new Date(c.birth_date + 'T12:00:00');
      const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
      const diff = (thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });
  }, [allCustomers, isDemo]);

  // Loyalty metrics
  const { user } = useAuth();
  const { data: coupons } = useCoupons();
  const { data: familyGroups } = useFamilyGroups();
  const { data: allPoints } = useQuery({
    queryKey: ['dashboard_points', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data, error } = await supabase.from('coupons').select('id').not('used_at', 'is', null).gte('used_at', monthStart);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const { data: loyaltyPrograms } = useQuery({
    queryKey: ['dashboard_programs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_programs').select('id, points_required');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeCoupons = isDemo ? 5 : (coupons || []).filter((c: any) => c.active && !c.used_at && c.valid_until >= new Date().toISOString().split('T')[0]).length;
  const redemptionsThisMonth = isDemo ? 12 : (allPoints || []).length;
  const birthdayCoupons = isDemo ? 2 : (coupons || []).filter((c: any) => c.type === 'aniversario' && c.active && !c.used_at).length;
  const familyGroupsCount = isDemo ? 8 : (familyGroups || []).length;

  const chartData = useMemo(() => {
    if (isDemo) return demoChartData;
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const now = new Date();
    return months.map((name, i) => {
      const monthTx = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === now.getFullYear();
      });
      return {
        name,
        receita: monthTx.filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0),
        despesa: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [filtered, isDemo]);

  const pieData = useMemo(() => {
    if (isDemo) return demoPieData;
    const expensesByGroup: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      const cat = cats.find(c => c.id === t.category_id);
      const name = cat?.group || 'Outros';
      expensesByGroup[name] = (expensesByGroup[name] || 0) + Number(t.amount);
    });
    return Object.entries(expensesByGroup).map(([name, value]) => ({ name, value }));
  }, [filtered, cats, isDemo]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>
          Dashboard {scope === 'personal' ? 'Pessoal' : 'do Negócio'}
        </h1>
        <p className="text-sm text-muted-foreground">Resumo financeiro</p>
      </div>

      {isDemo && (
        <Card className="border-[hsl(225,73%,57%)] bg-[hsl(225,73%,57%)]/5">
          <CardContent className="p-3 flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-[hsl(225,73%,57%)] shrink-0" />
            <span className="text-muted-foreground">
              Exibindo <strong className="text-foreground">dados de demonstração</strong>. Cadastre suas transações para ver dados reais.
            </span>
          </CardContent>
        </Card>
      )}

      <SummaryCards revenue={revenue} expenses={expenses} pendingCount={pendingCount} />

      {/* Extra cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link to="/cmv">
          <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">CMV</p>
              <p className={`text-xl font-bold ${cmvColor}`} style={{ fontFamily: 'Nunito' }}>{cmvPercent.toFixed(1)}%</p>
              <Badge variant="outline" className="text-[10px]">{cmvPercent < 35 ? 'Saudável' : cmvPercent < 45 ? 'Atenção' : 'Crítico'}</Badge>
            </CardContent>
          </Card>
        </Link>
        <Link to="/estoque">
          <Card className={`h-full cursor-pointer hover:shadow-md transition-shadow ${lowStockItems.length > 0 ? 'border-destructive' : ''}`}>
            <CardContent className="p-3 text-center">
              <Package className={`h-5 w-5 mx-auto mb-1 ${lowStockItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
              <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{lowStockItems.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${dueSoon.length > 0 ? 'text-[hsl(var(--warning))]' : 'text-muted-foreground'}`} />
            <p className="text-xs text-muted-foreground">Vencendo 7d</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{dueSoon.length}</p>
          </CardContent>
        </Card>
        <Link to="/vendas">
          <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <Pizza className="h-5 w-5 mx-auto mb-1 text-secondary" />
              <p className="text-xs text-muted-foreground">Pizzas Hoje</p>
              <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{pizzasToday}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Clientes Hoje</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{customersToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Receipt className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--success))]" />
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(ticketMedio)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/fidelidade">
          <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <Ticket className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Cupons Ativos</p>
              <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{activeCoupons}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-xs text-muted-foreground">Resgates Mês</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{redemptionsThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--warning))]" />
            <p className="text-xs text-muted-foreground">Aniv. c/ Cupom</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{birthdayCoupons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Famílias</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{familyGroupsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart data={chartData} />
        <CategoryPieChart data={pieData} />
      </div>

      {/* Birthday Card */}
      {birthdaySoon.length > 0 && (
        <Card className="border-l-4 border-l-[hsl(var(--warning))]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-[hsl(var(--warning))]" />
              <span className="font-semibold">Aniversariantes (próx. 7 dias)</span>
            </div>
            <div className="space-y-2">
              {birthdaySoon.map(c => {
                const bd = new Date(c.birth_date + 'T12:00:00');
                const msg = encodeURIComponent(`Olá ${c.name}! 🎂 Parabéns pelo seu aniversário! Temos uma surpresa especial para você. Venha nos visitar!`);
                const phone = c.phone.replace(/\D/g, '');
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{bd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <a href={`https://wa.me/55${phone}?text=${msg}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs h-7">WhatsApp</Button>
                    </a>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <DueAlerts transactions={filtered.map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        status: t.status as 'paid' | 'pending',
        due_date: t.due_date || undefined,
        type: t.type as 'revenue' | 'expense',
      }))} />
    </div>
  );
}
