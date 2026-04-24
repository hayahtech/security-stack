import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { useFazenda } from "@/contexts/FazendaContext";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown,
  Beef, Baby, MilkOff, ArrowLeftRight, Weight, Syringe, Target,
  CalendarDays, AlertTriangle, ChevronRight, Clock, Activity, Package, Wrench,
  Download, Map, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { calcHerdAverageGmd } from "@/data/gmd-utils";
import { getLowStockProducts } from "@/data/estoque-mock";
import { getPendingMaintenanceAlerts } from "@/data/maquinas-mock";

// ── Mock Data ──────────────────────────────────────────────
const cashFlowData = [
  { mes: "Out", receita: 48000, despesa: 32000, saldo: 16000 },
  { mes: "Nov", receita: 52000, despesa: 38000, saldo: 14000 },
  { mes: "Dez", receita: 61000, despesa: 41000, saldo: 20000 },
  { mes: "Jan", receita: 45000, despesa: 35000, saldo: 10000 },
  { mes: "Fev", receita: 58000, despesa: 40000, saldo: 18000 },
  { mes: "Mar", receita: 63000, despesa: 37000, saldo: 26000 },
];

const herdData = [
  { label: "Touros", count: 12, variation: 0 },
  { label: "Bezerros", count: 87, variation: 5 },
  { label: "Bezerras", count: 64, variation: 3 },
  { label: "Novilhos", count: 134, variation: -2 },
  { label: "Novilhas", count: 98, variation: 8 },
  { label: "Nov. Reposição", count: 45, variation: 1 },
  { label: "Vacas", count: 210, variation: -4 },
  { label: "Vacas Prenhas", count: 142, variation: 12 },
  { label: "Total Rebanho", count: 792, variation: 23 },
];

const recentActivities = [
  { type: "financeiro", icon: ArrowLeftRight, desc: "Venda de 15 bezerros — Fazenda Boa Vista", date: "08/03/2026", value: "R$ 45.000,00" },
  { type: "rebanho", icon: Beef, desc: "Entrada de 8 novilhas — Lote #142", date: "07/03/2026", value: "8 cabeças" },
  { type: "pesagem", icon: Weight, desc: "Pesagem lote #137 — média 320kg", date: "06/03/2026", value: "320 kg" },
  { type: "financeiro", icon: ArrowLeftRight, desc: "Pagamento de ração — Nutrifarm", date: "05/03/2026", value: "R$ 12.800,00" },
  { type: "rebanho", icon: Baby, desc: "Nascimento de 3 bezerros — Pasto Norte", date: "04/03/2026", value: "3 cabeças" },
  { type: "financeiro", icon: ArrowLeftRight, desc: "Recebimento de leite — Laticínio São José", date: "03/03/2026", value: "R$ 8.200,00" },
  { type: "pesagem", icon: Weight, desc: "Pesagem lote #139 — média 285kg", date: "02/03/2026", value: "285 kg" },
  { type: "financeiro", icon: ArrowLeftRight, desc: "Pagamento de veterinário", date: "01/03/2026", value: "R$ 3.500,00" },
];

const lowStockItems = getLowStockProducts();
const maintenanceAlerts = getPendingMaintenanceAlerts();

const alerts = [
  { type: "vencimento", icon: Wallet, text: "Conta de energia vence em 3 dias", severity: "warning" as const },
  { type: "vencimento", icon: Wallet, text: "Parcela financiamento vence em 5 dias", severity: "warning" as const },
  { type: "vacina", icon: Syringe, text: "12 animais com vacina de brucelose em atraso", severity: "destructive" as const },
  { type: "vacina", icon: Syringe, text: "Vermifugação do lote #135 atrasada 10 dias", severity: "destructive" as const },
  { type: "meta", icon: Target, text: "Despesas operacionais a 92% do limite mensal", severity: "warning" as const },
  ...lowStockItems.map((p) => ({
    type: "estoque" as string,
    icon: Package,
    text: `Estoque baixo: ${p.name} (${p.currentQty} ${p.unit})`,
    severity: (p.currentQty <= 0 ? "destructive" : "warning") as "destructive" | "warning",
  })),
  ...maintenanceAlerts.map((a) => ({
    type: "manutencao" as string,
    icon: Wrench as React.ElementType,
    text: `Manutenção pendente: ${a.asset.name}`,
    severity: "warning" as "destructive" | "warning",
  })),
];

const calendarEvents: Record<number, string[]> = {
  3: ["Vacina Lote #140"],
  8: ["Hoje"],
  11: ["Conta Energia"],
  13: ["Parcela Financ."],
  18: ["Pesagem Lote #141"],
  22: ["Pagto Ração"],
  25: ["Reunião Laticínio"],
  30: ["Fechamento Mês"],
};

// ── Components ─────────────────────────────────────────────

function SectionHeader({ title, link, linkLabel = "Ver tudo" }: { title: string; link: string; linkLabel?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={() => navigate(link)}>
        {linkLabel} <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FinancialCards() {
  const saldoTotal = 187450;
  const aReceber = 63000;
  const aPagar = 37000;
  const resultado = aReceber - aPagar;

  const cards = [
    { title: "Saldo Total", value: saldoTotal, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { title: "A Receber", value: aReceber, icon: ArrowDownCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "A Pagar", value: aPagar, icon: ArrowUpCircle, color: "text-destructive", bg: "bg-destructive/10" },
    {
      title: "Resultado do Mês",
      value: resultado,
      icon: resultado >= 0 ? TrendingUp : TrendingDown,
      color: resultado >= 0 ? "text-primary" : "text-destructive",
      bg: resultado >= 0 ? "bg-primary/10" : "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.title} className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{c.title}</span>
              <div className={`${c.bg} ${c.color} rounded-lg p-2`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className={`text-2xl font-bold font-display ${c.color}`}>
              {c.value < 0 ? "- " : ""}R$ {Math.abs(c.value).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CashFlowChart() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Fluxo de Caixa — Últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
            />
            <Line type="monotone" dataKey="receita" stroke="hsl(142, 50%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Receita" />
            <Line type="monotone" dataKey="despesa" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Despesa" />
            <Line type="monotone" dataKey="saldo" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Saldo" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Mapeamento de categoria → imagem de fundo e variante de cor
const herdCardMeta: Record<string, { img: string; dark: boolean }> = {
  "Touros":          { img: "/assets/animais/touros-dark.png",   dark: true  },
  "Bezerros":        { img: "/assets/animais/bezerros.png",      dark: true  },
  "Bezerras":        { img: "/assets/animais/bezerros.png",      dark: false },
  "Novilhos":        { img: "/assets/animais/vacas-dark.png",    dark: true  },
  "Novilhas":        { img: "/assets/animais/vacas-light.png",   dark: false },
  "Nov. Reposição":  { img: "/assets/animais/vacas-light.png",   dark: false },
  "Vacas":           { img: "/assets/animais/vacas-dark.png",    dark: true  },
  "Vacas Prenhas":   { img: "/assets/animais/vacas-light.png",   dark: false },
  "Total Rebanho":   { img: "/assets/animais/rebanho-dark.png",  dark: true  },
};

function HerdCard({ label, count, variation }: { label: string; count: number; variation: number }) {
  const meta = herdCardMeta[label] ?? { img: "/assets/animais/rebanho-dark.png", dark: true };
  const { img, dark } = meta;

  const isTotal = label === "Total Rebanho";

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl h-[110px] select-none
        ${dark
          ? "bg-[#0e1208] border border-[#2a3a10]/60"
          : "bg-white border border-amber-100/80"}
        shadow-md hover:shadow-lg hover:scale-[1.015] transition-all duration-200 cursor-default
      `}
    >
      {/* ── Faixa verde inferior (acento) */}
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${dark ? "bg-gradient-to-r from-green-700 via-green-500 to-transparent" : "bg-gradient-to-r from-green-600 via-green-400 to-transparent"}`} />

      {/* ── Linha diagonal dourada */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            to bottom right,
            transparent 0%,
            transparent calc(45% - 1px),
            ${dark ? "rgba(201,168,76,0.55)" : "rgba(180,140,30,0.45)"} calc(45% - 1px),
            ${dark ? "rgba(201,168,76,0.55)" : "rgba(180,140,30,0.45)"} calc(45% + 1px),
            transparent calc(45% + 1px)
          )`,
        }}
      />

      {/* ── Foto (lado direito, clip diagonal) */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[58%]"
        style={{ clipPath: "polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      >
        <img
          src={img}
          alt={label}
          className="w-full h-full object-cover object-center"
          style={{ filter: dark ? "brightness(0.82) contrast(1.05)" : "brightness(0.95)" }}
          draggable={false}
        />
        {/* gradiente de fusão foto↔fundo */}
        <div
          className="absolute inset-0"
          style={{
            background: dark
              ? "linear-gradient(to right, rgba(14,18,8,0.55) 0%, transparent 40%)"
              : "linear-gradient(to right, rgba(255,255,255,0.5) 0%, transparent 40%)",
          }}
        />
      </div>

      {/* ── Conteúdo textual (lado esquerdo) */}
      <div className="absolute inset-0 flex flex-col justify-center pl-5 pr-[46%]">
        <p
          className={`font-display font-black leading-none tracking-tight
            ${isTotal ? "text-[2.4rem]" : "text-[2.2rem]"}
            ${dark ? "text-amber-400" : "text-amber-600"}
          `}
          style={{ textShadow: dark ? "0 2px 8px rgba(0,0,0,0.6)" : "none" }}
        >
          {count.toLocaleString("pt-BR")}
        </p>
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.18em] mt-1 truncate
            ${dark ? "text-amber-300/70" : "text-amber-700/70"}`}
        >
          {label}
        </p>

        {/* badge de variação */}
        {variation !== 0 && (
          <span
            className={`mt-2 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-fit
              ${variation > 0
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
              }`}
          >
            {variation > 0 ? "▲" : "▼"} {Math.abs(variation)}
          </span>
        )}
      </div>
    </div>
  );
}

function HerdGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {herdData.map((h) => (
        <HerdCard key={h.label} label={h.label} count={h.count} variation={h.variation} />
      ))}
    </div>
  );
}

function RecentActivities() {
  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {recentActivities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="rounded-lg bg-muted p-2">
                <a.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{a.desc}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.date}
                </p>
              </div>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{a.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsList() {
  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className={`rounded-lg p-2 ${a.severity === "destructive" ? "bg-destructive/10" : "bg-yellow-500/10"}`}>
                <a.icon className={`h-4 w-4 ${a.severity === "destructive" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"}`} />
              </div>
              <p className="text-sm text-foreground flex-1">{a.text}</p>
              <Badge variant={a.severity === "destructive" ? "destructive" : "secondary"} className="shrink-0">
                {a.severity === "destructive" ? "Urgente" : "Atenção"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCalendar() {
  const today = 8;
  const daysInMonth = 31;
  const firstDayOfWeek = 6; // March 2026 starts on Sunday (0)
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground mb-3 font-display">Março 2026</p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((d) => (
            <span key={d} className="text-[10px] font-medium text-muted-foreground pb-1">{d}</span>
          ))}
          {blanks.map((b) => (
            <span key={`b-${b}`} />
          ))}
          {days.map((d) => {
            const hasEvent = calendarEvents[d];
            const isToday = d === today;
            return (
              <button
                key={d}
                className={`relative text-xs rounded-md h-7 w-full transition-colors
                  ${isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground hover:bg-muted"}
                `}
                title={hasEvent ? hasEvent.join(", ") : undefined}
              >
                {d}
                {hasEvent && !isToday && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function GmdDashboardCard() {
  const navigate = useNavigate();
  const avgGmd = calcHerdAverageGmd();
  const previousGmd = 0.62;
  const diff = avgGmd - previousGmd;
  const pctChange = previousGmd > 0 ? ((diff / previousGmd) * 100).toFixed(1) : "0";

  return (
    <div
      className="relative overflow-hidden rounded-2xl h-full min-h-[110px] cursor-pointer
        bg-[#0e1208] border border-[#2a3a10]/60
        shadow-md hover:shadow-lg hover:scale-[1.015] transition-all duration-200"
      onClick={() => navigate("/rebanho/relatorios/gmd")}
    >
      {/* Faixa inferior dourada */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />

      {/* Fundo com grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.8) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Ícone background decorativo */}
      <Activity className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-amber-400/10" />

      {/* Conteúdo */}
      <div className="absolute inset-0 flex flex-col justify-center pl-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/60 mb-0.5">
          GMD Médio do Rebanho
        </p>
        <p
          className="font-display font-black text-[2.2rem] leading-none text-amber-400"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
        >
          {avgGmd.toFixed(3)}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-amber-300/50">kg / dia</span>
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
              ${diff >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
          >
            {diff >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {diff >= 0 ? "+" : ""}{pctChange}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Consolidated Dashboard Data ────────────────────────────
const consolidatedFarms = [
  { id: "faz-1", name: "Fazenda Boa Vista", receita: 63000, despesa: 37000, resultado: 26000, animais: 520, gmd: 0.68, area: 320, status: "normal" as const },
  { id: "faz-2", name: "Fazenda São José", receita: 41000, despesa: 28000, resultado: 13000, animais: 210, gmd: 0.72, area: 180, status: "normal" as const },
  { id: "faz-3", name: "Sítio Esperança", receita: 18000, despesa: 12000, resultado: 6000, animais: 62, gmd: 0.45, area: 45, status: "alerta" as const },
];

const consolidatedBarData = consolidatedFarms.map((f) => ({
  name: f.name.replace("Fazenda ", "F. ").replace("Sítio ", "S. "),
  receita: f.receita,
  despesa: f.despesa,
  resultado: f.resultado,
}));

const herdCompositionByFarm = consolidatedFarms.map((f) => ({
  name: f.name.replace("Fazenda ", "").replace("Sítio ", ""),
  value: f.animais,
}));

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(217, 91%, 60%)",
  "hsl(142, 50%, 45%)",
  "hsl(38, 92%, 50%)",
];

const consolidatedAlerts = [
  { fazenda: "Fazenda Boa Vista", icon: Wallet, text: "Conta de energia vence em 3 dias", severity: "warning" as const },
  { fazenda: "Fazenda Boa Vista", icon: Syringe, text: "12 animais com vacina de brucelose em atraso", severity: "destructive" as const },
  { fazenda: "Fazenda São José", icon: Package, text: "Estoque baixo: Sal Mineral (15 kg)", severity: "warning" as const },
  { fazenda: "Fazenda São José", icon: Wrench, text: "Manutenção pendente: Trator NH TL75", severity: "warning" as const },
  { fazenda: "Sítio Esperança", icon: Syringe, text: "Vermifugação do lote #22 atrasada 5 dias", severity: "destructive" as const },
  { fazenda: "Sítio Esperança", icon: AlertTriangle, text: "GMD médio abaixo da meta (0.45 kg/dia)", severity: "warning" as const },
  { fazenda: "Fazenda Boa Vista", icon: Target, text: "Despesas operacionais a 92% do limite mensal", severity: "warning" as const },
];

function ConsolidatedDashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("mes");

  const totals = consolidatedFarms.reduce(
    (acc, f) => ({
      receita: acc.receita + f.receita,
      despesa: acc.despesa + f.despesa,
      resultado: acc.resultado + f.resultado,
      animais: acc.animais + f.animais,
      area: acc.area + f.area,
    }),
    { receita: 0, despesa: 0, resultado: 0, animais: 0, area: 0 },
  );

  const saldoConsolidado = 187450 + 98200 + 34500;

  const summaryCards = [
    { title: "Saldo Consolidado", value: saldoConsolidado, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { title: "Receita Total do Mês", value: totals.receita, icon: ArrowDownCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Despesa Total do Mês", value: totals.despesa, icon: ArrowUpCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Resultado Líquido", value: totals.resultado, icon: totals.resultado >= 0 ? TrendingUp : TrendingDown, color: totals.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive", bg: totals.resultado >= 0 ? "bg-emerald-500/10" : "bg-destructive/10" },
    { title: "Total de Animais", value: totals.animais, icon: Beef, color: "text-primary", bg: "bg-primary/10", isCurrency: false },
    { title: "Área Total", value: totals.area, icon: Map, color: "text-primary", bg: "bg-primary/10", isCurrency: false, suffix: " ha" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Visão Consolidada — Todas as Fazendas
          </h2>
          <p className="text-sm text-muted-foreground">{consolidatedFarms.length} fazendas ativas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exportar Relatório</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.title} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{c.title}</span>
                <div className={`${c.bg} ${c.color} rounded-lg p-2`}><c.icon className="h-4 w-4" /></div>
              </div>
              <p className={`text-2xl font-bold font-display ${c.color}`}>
                {c.isCurrency === false
                  ? `${c.value.toLocaleString("pt-BR")}${c.suffix || ""}`
                  : `R$ ${c.value.toLocaleString("pt-BR")}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Comparison Table */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Comparativo por Fazenda</h3>
        <Card className="border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fazenda</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Despesa</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                  <TableHead className="text-right">Animais</TableHead>
                  <TableHead className="text-right">GMD Médio</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidatedFarms.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { /* navigate to that farm */ }}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">R$ {f.receita.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">R$ {f.despesa.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${f.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      R$ {f.resultado.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-mono">{f.animais}</TableCell>
                    <TableCell className="text-right font-mono">{f.gmd.toFixed(2)} kg/d</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "alerta" ? "destructive" : "default"}>
                        {f.status === "alerta" ? "⚠️ Alerta" : "✅ Normal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">R$ {totals.receita.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">R$ {totals.despesa.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className={`text-right font-mono ${totals.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    R$ {totals.resultado.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-mono">{totals.animais}</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Resultado Financeiro por Fazenda</h3>
          <Card className="border-border">
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={consolidatedBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="hsl(142, 50%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resultado" name="Resultado" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Composição do Rebanho por Fazenda</h3>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={herdCompositionByFarm} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {herdCompositionByFarm.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`${value} cabeças`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      </div>

      <Separator />

      {/* Consolidated Alerts */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Alertas Consolidados</h3>
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {consolidatedAlerts.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`rounded-lg p-2 ${a.severity === "destructive" ? "bg-destructive/10" : "bg-yellow-500/10"}`}>
                    <a.icon className={`h-4 w-4 ${a.severity === "destructive" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.fazenda}</p>
                  </div>
                  <Badge variant={a.severity === "destructive" ? "destructive" : "secondary"} className="shrink-0">
                    {a.severity === "destructive" ? "Urgente" : "Atenção"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────

export default function Dashboard() {
  const { isEmpresarial } = useProfile();
  const { activeFazenda } = useFazenda();
  const [view, setView] = useState<"fazenda" | "consolidado">("fazenda");

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* View Toggle */}
        {isEmpresarial && (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {view === "consolidado" ? "Painel Consolidado" : `Dashboard — ${activeFazenda?.name || "Fazenda"}`}
            </h1>
            <Tabs value={view} onValueChange={(v) => setView(v as "fazenda" | "consolidado")}>
              <TabsList>
                <TabsTrigger value="fazenda">Fazenda Atual</TabsTrigger>
                <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {view === "consolidado" && isEmpresarial ? (
          <ConsolidatedDashboard />
        ) : (
          <>
            {/* Section 1 — Financial Summary */}
            <section className="space-y-4">
              <SectionHeader title="Resumo Financeiro" link="/financeiro/fluxo-de-caixa" />
              <FinancialCards />
              <CashFlowChart />
            </section>

            <Separator />

            {/* Section 2 — Herd (Business only) */}
            {isEmpresarial && (
              <>
                <section className="space-y-4">
                  <SectionHeader title="Rebanho" link="/rebanho/animais" />
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
                    <div className="lg:col-span-3">
                      <HerdGrid />
                    </div>
                    <div className="flex flex-col gap-3 h-full">
                      <GmdDashboardCard />
                    </div>
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* Section 3 & 4 side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 3 — Recent Activities */}
              <section className="space-y-4">
                <SectionHeader title="Atividades Recentes" link="/atividades" />
                <RecentActivities />
              </section>

              <div className="space-y-6">
                {/* Section 4 — Alerts */}
                <section className="space-y-4">
                  <SectionHeader title="Alertas & Lembretes" link="/calendario" linkLabel="Ver todos" />
                  <AlertsList />
                </section>

                {/* Section 5 — Mini Calendar */}
                <section className="space-y-4">
                  <SectionHeader title="Calendário" link="/calendario" />
                  <MiniCalendar />
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
