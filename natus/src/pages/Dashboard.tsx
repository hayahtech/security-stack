import { Link } from "react-router-dom";
import {
  Wallet, Target, ShoppingCart, TrendingUp, TrendingDown, PiggyBank,
  HeartPulse, Users, ShieldCheck, BarChart3, ArrowRight,
  Sparkles, Gift, Minus, CreditCard, FileUp,
  Percent, Briefcase, Heart, Star, Trophy, DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Mock data ────────────────────────────────────────────────────────────────

const evolucaoMensal = [
  { mes: "Nov", receitas: 10200, despesas: 7800 },
  { mes: "Dez", receitas: 13500, despesas: 9100 },
  { mes: "Jan", receitas: 11800, despesas: 8200 },
  { mes: "Fev", receitas: 12100, despesas: 7600 },
  { mes: "Mar", receitas: 11400, despesas: 8900 },
  { mes: "Abr", receitas: 12500, despesas: 8340 },
];

const despesasPorCategoria = [
  { name: "Moradia", value: 2800 },
  { name: "Alimentação", value: 1850 },
  { name: "Transporte", value: 980 },
  { name: "Saúde", value: 620 },
  { name: "Lazer", value: 540 },
  { name: "Outros", value: 1550 },
];

const PIE_COLORS = [
  "hsl(239,84%,62%)",
  "hsl(262,80%,64%)",
  "hsl(38,100%,58%)",
  "hsl(168,76%,42%)",
  "hsl(330,75%,60%)",
  "hsl(215,20%,55%)",
];

const rendimentos = [
  {
    tipo: "Dividendos",
    descricao: "ITSA4 · BBAS3 · PETR4",
    mesAtual: 312.40,
    acumuladoAno: 1_847.60,
    icon: TrendingUp,
    neon: "neon-card-emerald",
    accentClass: "text-emerald-600 dark:text-emerald-400",
    variacao: 8.3,
  },
  {
    tipo: "JSCP",
    descricao: "Juros sobre Capital Próprio",
    mesAtual: 118.90,
    acumuladoAno: 534.20,
    icon: Percent,
    neon: "neon-card-amber",
    accentClass: "text-amber-600 dark:text-amber-400",
    variacao: 2.1,
  },
  {
    tipo: "Remunerações",
    descricao: "Salário · PLR · Horas extras",
    mesAtual: 9_200.00,
    acumuladoAno: 36_800.00,
    icon: Briefcase,
    neon: "neon-card",
    accentClass: "text-primary",
    variacao: 0,
  },
  {
    tipo: "Doações Recebidas",
    descricao: "Família · Amigos",
    mesAtual: 0,
    acumuladoAno: 1_200.00,
    icon: Heart,
    neon: "neon-card-violet",
    accentClass: "text-violet-600 dark:text-violet-400",
    variacao: null,
  },
  {
    tipo: "Bonificações",
    descricao: "Bônus anual · Comissões",
    mesAtual: 0,
    acumuladoAno: 4_500.00,
    icon: Star,
    neon: "neon-card-amber",
    accentClass: "text-amber-600 dark:text-amber-400",
    variacao: null,
  },
  {
    tipo: "Prêmios",
    descricao: "Concursos · Sorteios",
    mesAtual: 0,
    acumuladoAno: 0,
    icon: Trophy,
    neon: "neon-card",
    accentClass: "text-primary",
    variacao: null,
  },
];

const dividasExistentes = [
  { nome: "Financiamento Veículo", parcela: 1240, vencimento: "05", totalDevido: 38400, parcelas: "19/36", cor: "neon-card-rose" },
  { nome: "Cartão Nubank", parcela: 890, vencimento: "12", totalDevido: 890, parcelas: "1/1", cor: "neon-card-amber" },
  { nome: "Empréstimo Pessoal", parcela: 520, vencimento: "20", totalDevido: 7280, parcelas: "6/20", cor: "neon-card-violet" },
];

const spark = (base: number, n = 8) =>
  Array.from({ length: n }, (_, i) => base + (Math.sin(i * 1.2) * base * 0.08));

const scoreFinanceiro = 72;
const saudeCor =
  scoreFinanceiro >= 80 ? "text-emerald-500" :
  scoreFinanceiro >= 60 ? "text-amber-500" : "text-rose-500";

const resumoMes = { receitas: 12500, despesas: 8340, saldo: 4160, poupanca: 33.3 };

const metas = [
  { label: "Reserva de Emergência", progresso: 68, meta: 30000, atual: 20400 },
  { label: "Viagem Europa 2027", progresso: 22, meta: 15000, atual: 3300 },
  { label: "Troca do carro", progresso: 45, meta: 60000, atual: 27000 },
];

const atalhos = [
  { to: "/orcamento-familiar", label: "Orçamento Familiar", icon: Wallet, cor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  { to: "/metas", label: "Metas", icon: Target, cor: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { to: "/compras-planejadas", label: "Compras Planejadas", icon: ShoppingCart, cor: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { to: "/analise-gastos", label: "Análise de Gastos", icon: BarChart3, cor: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  { to: "/investimentos", label: "Investimentos", icon: TrendingUp, cor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { to: "/aposentadoria", label: "Aposentadoria", icon: PiggyBank, cor: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  { to: "/saude-financeira", label: "Saúde Financeira", icon: HeartPulse, cor: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  { to: "/familia", label: "Família", icon: Users, cor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
  { to: "/consorcios", label: "Consórcios", icon: Users, cor: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  { to: "/protecao-garantias", label: "Proteção", icon: ShieldCheck, cor: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
  { to: "/relatorios/doacoes", label: "Doações", icon: Gift, cor: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  { to: "/importar-extrato", label: "Importar Extrato", icon: FileUp, cor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 56, h = 20;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
};

// ── KPI Card neon ─────────────────────────────────────────────────────────────
interface KpiProps {
  label: string; value: string; sub: string;
  variation?: number; sparkData: number[]; sparkColor: string;
  accentClass: string; neonClass: string;
}
function KpiCard({ label, value, sub, variation, sparkData, sparkColor, accentClass, neonClass }: KpiProps) {
  const TrendIcon = variation == null ? Minus : variation > 0 ? TrendingUp : TrendingDown;
  const trendColor = variation == null ? "text-muted-foreground" : variation > 0 ? "text-emerald-500" : "text-rose-500";
  return (
    <div className={`rounded-xl p-4 ${neonClass}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold font-display ${accentClass}`}>{value}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col">
          {variation != null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{variation > 0 ? "+" : ""}{variation}%</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground mt-0.5">{sub}</span>
        </div>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const totalDividas = dividasExistentes.reduce((s, d) => s + d.totalDevido, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Olá, bem-vindo ao Natus
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sua vida financeira pessoal, organizada.</p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">Abril 2026</Badge>
      </div>

      {/* KPI Cards neon — linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Score SVG */}
        <div className="neon-card rounded-xl p-4 col-span-2 lg:col-span-1 flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke="hsl(239,80%,68%)" strokeWidth="2.5"
                strokeDasharray={`${scoreFinanceiro} ${100 - scoreFinanceiro}`}
                strokeLinecap="round"
                className="drop-shadow-[0_0_6px_hsl(239,80%,68%)]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-black ${saudeCor}`}>{scoreFinanceiro}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Score</p>
            <p className="font-semibold text-sm">Saúde Financeira</p>
            <p className={`text-xs font-medium ${saudeCor}`}>
              {scoreFinanceiro >= 80 ? "Excelente" : scoreFinanceiro >= 60 ? "Boa" : "Atenção"}
            </p>
          </div>
        </div>

        <KpiCard label="Receitas" value={fmt(resumoMes.receitas)} sub="este mês"
          variation={3.2} sparkData={spark(resumoMes.receitas)}
          sparkColor="hsl(168,76%,42%)" accentClass="text-emerald-500" neonClass="neon-card-emerald" />

        <KpiCard label="Despesas" value={fmt(resumoMes.despesas)} sub="este mês"
          variation={-1.8} sparkData={spark(resumoMes.despesas)}
          sparkColor="hsl(0,84%,60%)" accentClass="text-rose-500" neonClass="neon-card-rose" />

        <KpiCard label="Poupança" value={`${resumoMes.poupanca}%`} sub={`${fmt(resumoMes.saldo)} guardados`}
          variation={1.4} sparkData={spark(resumoMes.poupanca)}
          sparkColor="hsl(239,80%,68%)" accentClass="text-primary" neonClass="neon-card" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="neon-card border-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receitas vs Despesas — Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={evolucaoMensal} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(239,84%,62%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(239,84%,62%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(0,84%,60%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), ""]} />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(239,84%,62%)" strokeWidth={2} fill="url(#gRec)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0,84%,60%)" strokeWidth={2} fill="url(#gDesp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="neon-card-violet border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={despesasPorCategoria} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={2}>
                  {despesasPorCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name) => [fmt(v), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full mt-1">
              {despesasPorCategoria.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-[10px] text-muted-foreground truncate">{cat.name}</span>
                  <span className="text-[10px] font-medium text-foreground ml-auto">
                    {Math.round((cat.value / despesasPorCategoria.reduce((s, c) => s + c.value, 0)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Rendimentos ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Rendimentos</h2>
            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
              {fmt(rendimentos.reduce((s, r) => s + r.acumuladoAno, 0))} no ano
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to="/investimentos">Ver detalhes <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rendimentos.map((r) => (
            <div key={r.tipo} className={`${r.neon} rounded-xl p-3.5 space-y-2.5`}>
              {/* Ícone + tipo */}
              <div className="flex items-center justify-between">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.neon === "neon-card-emerald" ? "bg-emerald-500/15" : r.neon === "neon-card-amber" ? "bg-amber-500/15" : r.neon === "neon-card-violet" ? "bg-violet-500/15" : "bg-primary/10"}`}>
                  <r.icon className={`h-3.5 w-3.5 ${r.accentClass}`} />
                </div>
                {r.variacao != null && r.variacao !== 0 && (
                  <span className={`text-[10px] font-medium ${r.variacao > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {r.variacao > 0 ? "+" : ""}{r.variacao}%
                  </span>
                )}
              </div>

              {/* Tipo */}
              <p className="text-[11px] font-semibold text-foreground leading-tight">{r.tipo}</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">{r.descricao}</p>

              {/* Valores */}
              <div className="space-y-1 border-t border-border/50 pt-2">
                <div className="flex justify-between items-baseline gap-1">
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Este mês</span>
                  <span className={`text-xs font-bold tabular-nums ${r.mesAtual > 0 ? r.accentClass : "text-muted-foreground"}`}>
                    {r.mesAtual > 0 ? fmt(r.mesAtual) : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-1">
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">No ano</span>
                  <span className={`text-xs font-semibold tabular-nums ${r.acumuladoAno > 0 ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {r.acumuladoAno > 0 ? fmt(r.acumuladoAno) : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dívidas existentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Dívidas Existentes</h2>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {fmt(totalDividas)} total
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to="/dividas">Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {dividasExistentes.map((d) => (
            <div key={d.nome} className={`rounded-xl p-4 ${d.cor}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium leading-tight">{d.nome}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{d.parcelas}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Parcela</span>
                  <span className="font-bold text-foreground">{fmt(d.parcela)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span className="font-medium">Dia {d.vencimento}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-border/50 pt-1 mt-1">
                  <span className="text-muted-foreground">Total devido</span>
                  <span className="font-bold text-rose-500">{fmt(d.totalDevido)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Importar extrato — CTA */}
      <div className="neon-card rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileUp className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Importe seus extratos</p>
          <p className="text-xs text-muted-foreground">PDF, CSV ou Excel — banco e cartão de crédito</p>
        </div>
        <Button size="sm" asChild>
          <Link to="/importar-extrato">Importar</Link>
        </Button>
      </div>

      {/* Metas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Progresso das Metas</h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link to="/metas">Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {metas.map((meta) => (
            <div key={meta.label} className="neon-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium leading-tight">{meta.label}</p>
                <span className="text-xs font-bold text-primary shrink-0">{meta.progresso}%</span>
              </div>
              <Progress value={meta.progresso} className="h-1.5 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmt(meta.atual)}</span>
                <span>{fmt(meta.meta)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atalhos */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Acessar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {atalhos.map((item) => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.cor}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
              <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
