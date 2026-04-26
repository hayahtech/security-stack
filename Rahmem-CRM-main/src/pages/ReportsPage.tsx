import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockDeals, mockLeads, mockUsers } from '@/data/mock-data';
import { DEAL_STAGE_LABELS } from '@/types/crm';
import { Progress } from '@/components/ui/progress';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const cardHover = { rest: { scale: 1, y: 0 }, hover: { scale: 1.02, y: -4, transition: { duration: 0.25 } } };

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1.2 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / (duration * 1000), 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{prefix}{display.toLocaleString('pt-BR')}{suffix}</span>;
}

const PIE_COLORS = ['hsl(205 70% 50%)', 'hsl(152 60% 42%)', 'hsl(38 92% 50%)', 'hsl(0 72% 51%)', 'hsl(280 60% 50%)'];

type Period = '7d' | '30d' | '90d' | 'year';

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('year');

  // Filter deals by period
  const now = Date.now();
  const periodMs: Record<Period, number> = { '7d': 7 * 86400000, '30d': 30 * 86400000, '90d': 90 * 86400000, 'year': 365 * 86400000 };
  const cutoff = new Date(now - periodMs[period]).toISOString();
  const periodDeals = mockDeals.filter(d => d.created_at >= cutoff);

  const wonDeals = periodDeals.filter(d => d.stage === 'ganho');
  const totalWon = wonDeals.length;
  const totalRevenue = wonDeals.reduce((s, d) => s + d.value, 0);
  const conversionRate = periodDeals.length > 0 ? ((totalWon / periodDeals.length) * 100).toFixed(1) : '0';
  const avgTicket = totalWon > 0 ? totalRevenue / totalWon : 0;

  const stats = [
    { label: 'Negócios Ganhos', numValue: totalWon, prefix: '', suffix: '', icon: Target, gradient: 'from-[hsl(152,60%,42%)] to-[hsl(152,50%,55%)]' },
    { label: 'Receita Realizada', numValue: Math.round(totalRevenue / 1000), prefix: 'R$ ', suffix: 'k', icon: DollarSign, gradient: 'from-[hsl(205,70%,50%)] to-[hsl(205,80%,65%)]' },
    { label: 'Taxa de Conversão', numValue: Math.round(Number(conversionRate) * 10) / 10, prefix: '', suffix: '%', icon: TrendingUp, gradient: 'from-[hsl(210,60%,11%)] to-[hsl(210,50%,25%)]' },
    { label: 'Ticket Médio', numValue: Math.round(avgTicket / 1000), prefix: 'R$ ', suffix: 'k', icon: Users, gradient: 'from-[hsl(205,70%,45%)] to-[hsl(210,60%,35%)]' },
  ];

  // Revenue by month
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const revenueByMonth = monthNames.map((name, i) => {
    const monthDeals = wonDeals.filter(d => {
      const created = new Date(d.created_at);
      return created.getMonth() === i;
    });
    return { name, value: monthDeals.reduce((s, d) => s + d.value, 0) };
  }).filter(m => m.value > 0 || monthNames.indexOf(m.name) <= new Date().getMonth());

  // Leads by source
  const leadsBySource = mockLeads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({ name, value }));

  // Funnel data (vendas pipeline only)
  const vendasDeals = periodDeals.filter(d => d.pipeline === 'vendas');
  const funnelStages = ['novo_lead', 'contactado', 'proposta', 'ganho'] as const;
  const funnelData = funnelStages.map(stage => {
    const count = vendasDeals.filter(d => {
      const stageOrder = { novo_lead: 0, contactado: 1, proposta: 2, ganho: 3, perdido: -1 };
      return stageOrder[d.stage] >= stageOrder[stage];
    }).length;
    return { stage, label: DEAL_STAGE_LABELS[stage], count };
  });
  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1);

  // Seller ranking
  const sellerRanking = mockUsers.map(user => {
    const userDeals = periodDeals.filter(d => d.responsible_id === user.id);
    const userWon = userDeals.filter(d => d.stage === 'ganho');
    const revenue = userWon.reduce((s, d) => s + d.value, 0);
    const rate = userDeals.length > 0 ? ((userWon.length / userDeals.length) * 100).toFixed(0) : '0';
    const goal = 200000; // Meta fixa para demo
    return { user, won: userWon.length, revenue, rate, goal, pct: Math.round((revenue / goal) * 100) };
  }).sort((a, b) => b.revenue - a.revenue);

  const FUNNEL_COLORS = ['hsl(205 70% 50%)', 'hsl(38 92% 50%)', 'hsl(280 60% 50%)', 'hsl(152 60% 42%)'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análise de desempenho e métricas</p>
        </div>
        <div className="flex bg-secondary rounded-lg p-1">
          {([['7d', '7 dias'], ['30d', '30 dias'], ['90d', '90 dias'], ['year', 'Este ano']] as [Period, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${period === key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={cardHover} initial="rest" whileHover="hover" className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} p-5 shadow-lg cursor-default group`}>
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white"><AnimatedNumber value={stat.numValue} prefix={stat.prefix} suffix={stat.suffix} /></p>
            <p className="text-sm text-white/70 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Bar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Receita por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} />
              <Bar dataKey="value" fill="hsl(205 70% 50%)" radius={[4, 4, 0, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Leads por Origem</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {sourceData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Funnel */}
      <motion.div variants={item} className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6">Funil de Conversão (Pipeline Vendas)</h3>
        <div className="space-y-4">
          {funnelData.map((f, i) => {
            const pct = Math.round((f.count / maxFunnel) * 100);
            return (
              <div key={f.stage} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-right">{f.label}</div>
                <div className="flex-1 relative">
                  <div className="h-10 rounded-lg overflow-hidden bg-secondary/50">
                    <motion.div
                      className="h-full rounded-lg flex items-center px-3"
                      style={{ backgroundColor: FUNNEL_COLORS[i] }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    >
                      <span className="text-sm font-bold text-white">{f.count}</span>
                    </motion.div>
                  </div>
                </div>
                <div className="w-14 text-sm text-muted-foreground text-right">{pct}%</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Seller ranking */}
      <motion.div variants={item} className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Ranking de Vendedores</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendedor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Negócios Ganhos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita Gerada</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxa de Conversão</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Meta Atingida</th>
              </tr>
            </thead>
            <tbody>
              {sellerRanking.map((r, idx) => (
                <tr key={r.user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-warning/20 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                        {idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-bold">{r.user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.user.name}</div>
                        <div className="text-xs text-muted-foreground">{r.user.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{r.won}</td>
                  <td className="px-4 py-3 text-sm font-semibold">R$ {r.revenue.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{r.rate}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${r.pct >= 100 ? 'bg-success' : r.pct >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${Math.min(r.pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-10 text-right">{r.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
