import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, UserPlus, DollarSign, Activity, ArrowUpRight, Clock, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockLeads, mockCustomers, mockDeals, mockInteractions, mockActivities, mockUsers, getUserById } from '@/data/mock-data';
import { DEAL_STAGE_LABELS, PIPELINE_LABELS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

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
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const cardHover = { rest: { scale: 1, y: 0 }, hover: { scale: 1.02, y: -4, transition: { duration: 0.25, ease: 'easeOut' } } };
const iconPulse = { rest: { scale: 1, rotate: 0 }, hover: { scale: 1.15, rotate: -5, transition: { duration: 0.3, ease: 'easeOut' } } };
const arrowSlide = { rest: { x: 0, opacity: 0 }, hover: { x: 4, opacity: 1, transition: { duration: 0.25 } } };

export default function DashboardPage() {
  const navigate = useNavigate();

  const totalLeads = mockLeads.length;
  const totalCustomers = mockCustomers.length;
  const activeDeals = mockDeals.filter(d => d.stage !== 'ganho' && d.stage !== 'perdido');
  const wonDeals = mockDeals.filter(d => d.stage === 'ganho');
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const conversionRate = totalLeads > 0 ? ((wonDeals.length / mockDeals.length) * 100).toFixed(1) : '0';
  const forecastRevenue = activeDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

  // Leads by source
  const leadsBySource = mockLeads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {} as Record<string, number>);
  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({ name, value }));

  // Deals by stage
  const stageData = (['novo_lead', 'contactado', 'proposta', 'ganho', 'perdido'] as const).map(stage => ({
    name: DEAL_STAGE_LABELS[stage],
    value: mockDeals.filter(d => d.stage === stage).length,
    total: mockDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
  }));

  // Stale deals (no interaction in 7+ days)
  const staleDeals = activeDeals
    .filter(d => d.last_interaction && new Date(d.last_interaction) < new Date(Date.now() - 7 * 86400000))
    .sort((a, b) => new Date(a.last_interaction || 0).getTime() - new Date(b.last_interaction || 0).getTime())
    .slice(0, 5);

  // Today's activities
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = mockActivities
    .filter(a => a.due_date.startsWith(todayStr) || a.status === 'atrasada')
    .filter(a => a.status !== 'concluida')
    .slice(0, 5);

  // Ranking by responsible
  const ranking = mockUsers.map(user => {
    const userDeals = mockDeals.filter(d => d.responsible_id === user.id && d.stage === 'ganho');
    return { user, deals: userDeals.length, revenue: userDeals.reduce((sum, d) => sum + d.value, 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  // Pipeline summary
  const pipelineSummary = (['vendas', 'imobiliario', 'marketing'] as const).map(p => ({
    name: PIPELINE_LABELS[p].replace('Pipeline ', ''),
    active: mockDeals.filter(d => d.pipeline === p && d.stage !== 'ganho' && d.stage !== 'perdido').length,
    value: mockDeals.filter(d => d.pipeline === p && d.stage !== 'ganho' && d.stage !== 'perdido').reduce((sum, d) => sum + d.value, 0),
    won: mockDeals.filter(d => d.pipeline === p && d.stage === 'ganho').reduce((sum, d) => sum + d.value, 0),
  }));

  // Conversion by source
  const conversionBySource = Object.entries(leadsBySource).map(([source, count]) => {
    const converted = mockDeals.filter(d => d.source === source && d.stage === 'ganho').length;
    const total = mockDeals.filter(d => d.source === source).length;
    return { source, leads: count, rate: total > 0 ? ((converted / total) * 100).toFixed(0) : '0' };
  });

  const PIE_COLORS = ['hsl(205 70% 50%)', 'hsl(152 60% 42%)', 'hsl(38 92% 50%)', 'hsl(0 72% 51%)', 'hsl(280 60% 50%)'];

  const stats = [
    { label: 'Total de Leads', numValue: totalLeads, prefix: '', suffix: '', icon: UserPlus, trend: '+12%', up: true, gradient: 'from-[hsl(205,70%,50%)] to-[hsl(205,80%,65%)]' },
    { label: 'Clientes Ativos', numValue: totalCustomers, prefix: '', suffix: '', icon: Users, trend: '+5%', up: true, gradient: 'from-[hsl(152,60%,42%)] to-[hsl(152,50%,55%)]' },
    { label: 'Taxa de Conversão', numValue: Math.round(Number(conversionRate) * 10) / 10, prefix: '', suffix: '%', icon: Activity, trend: '+2.3%', up: true, gradient: 'from-[hsl(210,60%,11%)] to-[hsl(210,50%,25%)]' },
    { label: 'Receita Fechada', numValue: Math.round(totalRevenue / 1000), prefix: 'R$ ', suffix: 'k', icon: DollarSign, trend: '+18%', up: true, gradient: 'from-[hsl(205,70%,45%)] to-[hsl(210,60%,35%)]' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu CRM</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={cardHover} initial="rest" whileHover="hover" className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} p-5 shadow-lg cursor-default group`}>
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-opacity duration-500" />
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-black/5 blur-xl" />
            <div className="relative flex items-start justify-between mb-4">
              <motion.div variants={iconPulse} className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <stat.icon className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex items-center gap-1">
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? 'text-emerald-200' : 'text-red-200'}`}>
                  {stat.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {stat.trend}
                </span>
                <motion.div variants={arrowSlide}><ArrowUpRight className="w-3.5 h-3.5 text-white/60" /></motion.div>
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white"><AnimatedNumber value={stat.numValue} prefix={stat.prefix} suffix={stat.suffix} /></p>
            <p className="text-sm text-white/70 mt-0.5">{stat.label}</p>
            <motion.div className="absolute bottom-0 left-0 h-[2px] bg-white/30" initial={{ width: '0%' }} whileInView={{ width: '100%' }} transition={{ duration: 0.8, delay: 0.3 }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Forecast + Pipeline Summary */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-1">Previsão de Receita</h3>
          <p className="text-xs text-muted-foreground mb-4">Valor ponderado por probabilidade</p>
          <div className="text-3xl font-bold">R$ {(forecastRevenue / 1000).toFixed(0)}k</div>
          <div className="text-sm text-muted-foreground mt-1">{activeDeals.length} negócios ativos</div>
        </div>
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo por Pipeline</h3>
          <div className="grid grid-cols-3 gap-4">
            {pipelineSummary.map(p => (
              <div key={p.name} className="text-center">
                <div className="text-sm font-medium mb-1">{p.name}</div>
                <div className="text-lg font-bold">R$ {(p.value / 1000).toFixed(0)}k</div>
                <div className="text-xs text-muted-foreground">{p.active} ativos</div>
                <div className="text-xs text-success font-medium">R$ {(p.won / 1000).toFixed(0)}k ganhos</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Leads por Origem</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="hsl(205 70% 50%)" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Negócios por Etapa</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stageData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {stageData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Conversion + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Taxa de Conversão por Canal</h3>
          <div className="space-y-3">
            {conversionBySource.map(s => (
              <div key={s.source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">{s.source}</span>
                  <span className="text-xs text-muted-foreground">{s.leads} leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${s.rate}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{s.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Ranking de Vendedores</h3>
          <div className="space-y-3">
            {ranking.map((r, idx) => (
              <div key={r.user.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-warning/20 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                  {idx + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold">{r.user.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.user.name}</div>
                  <div className="text-xs text-muted-foreground">{r.user.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">R$ {(r.revenue / 1000).toFixed(0)}k</div>
                  <div className="text-xs text-muted-foreground">{r.deals} negócios</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stale Deals + Today's Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Negócios Parados
          </h3>
          {staleDeals.length > 0 ? (
            <div className="space-y-3">
              {staleDeals.map(deal => {
                const daysSince = deal.last_interaction ? Math.floor((Date.now() - new Date(deal.last_interaction).getTime()) / 86400000) : 0;
                return (
                  <div key={deal.id} onClick={() => navigate(`/negocios/${deal.id}`)} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-medium">{deal.name}</div>
                      <div className="text-xs text-muted-foreground">R$ {deal.value.toLocaleString('pt-BR')}</div>
                    </div>
                    <span className="badge-status bg-warning/15 text-warning text-xs">{daysSince}d sem contato</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Todos os negócios estão em dia 🎉</p>
          )}
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Atividades do Dia
          </h3>
          {todayActivities.length > 0 ? (
            <div className="space-y-3">
              {todayActivities.map(a => {
                const responsible = getUserById(a.responsible_id);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-2 h-2 rounded-full ${a.status === 'atrasada' ? 'bg-destructive' : 'bg-accent'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(a.due_date), "HH:mm")} · {responsible?.name.split(' ')[0]}
                      </div>
                    </div>
                    {a.status === 'atrasada' && <span className="badge-status bg-destructive/15 text-destructive text-[10px]">Atrasada</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma atividade para hoje</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
