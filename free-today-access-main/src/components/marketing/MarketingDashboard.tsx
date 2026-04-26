import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Users, Percent } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, BarChart, Bar } from 'recharts';
import { MarketingCampaign, CHANNEL_OPTIONS } from '@/hooks/useMarketingCampaigns';

interface Props {
  campaigns: MarketingCampaign[];
  transactions: any[];
  allTransactions: any[];
  newCustomersCount: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(221,83%,53%)', 'hsl(142,76%,36%)', 'hsl(45,93%,47%)', 'hsl(280,65%,60%)', 'hsl(16,85%,56%)', 'hsl(190,80%,42%)', 'hsl(330,65%,50%)'];

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MarketingDashboard({ campaigns, transactions, allTransactions, newCustomersCount }: Props) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Marketing expenses this month
  const marketingThisMonth = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions, thisMonth, thisYear]);

  // Active campaigns
  const activeCampaigns = campaigns.filter(c => c.status === 'ativa');

  // Revenue this month
  const revenueThisMonth = useMemo(() => {
    return allTransactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'revenue' && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((s, t) => s + Number(t.amount), 0);
  }, [allTransactions, thisMonth, thisYear]);

  // Revenue last month
  const revenueLastMonth = useMemo(() => {
    const lm = thisMonth === 0 ? 11 : thisMonth - 1;
    const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
    return allTransactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'revenue' && d.getMonth() === lm && d.getFullYear() === ly;
    }).reduce((s, t) => s + Number(t.amount), 0);
  }, [allTransactions, thisMonth, thisYear]);

  // CAC
  const cac = newCustomersCount > 0 ? marketingThisMonth / newCustomersCount : 0;

  // ROI
  const roi = marketingThisMonth > 0
    ? ((revenueThisMonth - revenueLastMonth - marketingThisMonth) / marketingThisMonth) * 100
    : 0;

  // % of revenue
  const revenuePercent = revenueThisMonth > 0 ? (marketingThisMonth / revenueThisMonth) * 100 : 0;
  const percentColor = revenuePercent >= 3 && revenuePercent <= 8 ? 'text-[hsl(var(--success))]'
    : revenuePercent < 3 ? 'text-[hsl(var(--warning))]'
    : 'text-destructive';
  const percentLabel = revenuePercent >= 3 && revenuePercent <= 8 ? 'Saudável'
    : revenuePercent < 3 ? 'Baixo' : 'Alto';

  // Channel pie data
  const channelData = useMemo(() => {
    const byChannel: Record<string, number> = {};
    transactions.forEach(t => {
      const campaign = campaigns.find(c => c.id === t.campaign_id);
      const ch = campaign?.channel || 'outro';
      byChannel[ch] = (byChannel[ch] || 0) + Number(t.amount);
    });
    // Also count uncategorized marketing expenses
    transactions.filter(t => !t.campaign_id).forEach(t => {
      const catName = t.categories?.name?.toLowerCase() || '';
      if (catName.includes('anúncio')) byChannel['instagram'] = (byChannel['instagram'] || 0);
    });
    return Object.entries(byChannel).map(([key, value]) => ({
      name: CHANNEL_OPTIONS.find(c => c.value === key)?.label || key,
      value,
    })).filter(d => d.value > 0);
  }, [transactions, campaigns]);

  // Monthly marketing vs revenue chart
  const monthlyChart = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.slice(0, thisMonth + 1).map((name, i) => {
      const mktMonth = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === thisYear;
      }).reduce((s, t) => s + Number(t.amount), 0);
      const revMonth = allTransactions.filter(t => {
        const d = new Date(t.date);
        return t.type === 'revenue' && d.getMonth() === i && d.getFullYear() === thisYear;
      }).reduce((s, t) => s + Number(t.amount), 0);
      return { name, marketing: mktMonth, receita: revMonth };
    });
  }, [transactions, allTransactions, thisMonth, thisYear]);

  // Budget vs spent per active campaign
  const budgetChart = useMemo(() => {
    return activeCampaigns.map(c => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name,
      orcamento: Number(c.budget),
      gasto: Number(c.spent),
      over: Number(c.spent) > Number(c.budget),
    }));
  }, [activeCampaigns]);

  // Best channel insight
  const bestChannel = useMemo(() => {
    if (channelData.length === 0) return null;
    const sorted = [...channelData].sort((a, b) => a.value - b.value);
    return sorted[0];
  }, [channelData]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Investido no Mês</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(marketingThisMonth)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{activeCampaigns.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">CAC = Total Marketing ÷ Novos Clientes</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-xs text-muted-foreground">CAC</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>
              {newCustomersCount > 0 ? formatCurrency(cac) : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">{newCustomersCount} novos clientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {roi >= 0 ? <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">ROI = (Receita Atual - Receita Anterior - Gasto Mkt) ÷ Gasto Mkt × 100</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-xs text-muted-foreground">ROI Estimado</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>
              {marketingThisMonth > 0 ? `${roi.toFixed(1)}%` : '—'}
            </p>
            <Badge variant={roi >= 0 ? 'default' : 'destructive'} className="text-[10px]">
              {roi >= 0 ? 'Positivo' : 'Negativo'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Percent className={`h-5 w-5 mx-auto mb-1 ${percentColor}`} />
            <p className="text-xs text-muted-foreground">% do Faturamento</p>
            <p className={`text-xl font-bold ${percentColor}`} style={{ fontFamily: 'Nunito' }}>
              {revenueThisMonth > 0 ? `${revenuePercent.toFixed(1)}%` : '—'}
            </p>
            <Badge variant="outline" className="text-[10px]">{percentLabel}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Investimento por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados de canal ainda</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Marketing vs Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Marketing vs Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="marketing" name="Marketing" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="receita" name="Receita" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Chart */}
      {budgetChart.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Orçado vs Realizado por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={budgetChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="orcamento" name="Orçamento" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} />
                <Bar dataKey="gasto" name="Gasto" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insight Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Insight Automático</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {bestChannel && marketingThisMonth > 0 ? (
              <p>
                Seu canal com menor custo este mês foi <strong className="text-foreground">{bestChannel.name}</strong> ({formatCurrency(bestChannel.value)} investidos).
              </p>
            ) : (
              <p>Vincule despesas a campanhas para gerar insights automáticos.</p>
            )}
            {revenueThisMonth > 0 && marketingThisMonth > 0 && (
              <p>
                Você está investindo <strong className="text-foreground">{revenuePercent.toFixed(1)}%</strong> da receita em marketing.
                A média saudável para restaurantes é <strong className="text-foreground">3% a 8%</strong>.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
