import React, { useState, useMemo } from "react";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import {
  TrendingUp, AlertTriangle, Eye, EyeOff, Calendar, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

/* ─── Types ─── */
type EventType = "entrada" | "saida";
type EventOrigin = "recorrente" | "parcela" | "manual";

interface CashEvent {
  id: string;
  date: string;
  type: EventType;
  description: string;
  amount: number;
  origin: EventOrigin;
  parcelaInfo?: string; // e.g. "3/6"
  ignored: boolean;
}

interface Account {
  id: string;
  name: string;
}

/* ─── Mock Data ─── */
const mockAccounts: Account[] = [
  { id: "acc-1", name: "Banco do Brasil — CC" },
  { id: "acc-2", name: "Sicoob — Poupança" },
  { id: "acc-3", name: "Nubank — PJ" },
];

const INITIAL_BALANCE = 42500;

function generateMockEvents(): CashEvent[] {
  const today = new Date();
  const events: CashEvent[] = [
    // Entradas
    { id: "ev-1", date: format(addDays(today, 3), "yyyy-MM-dd"), type: "entrada", description: "Venda de Leite — Laticínios Bom Gosto", amount: 12500, origin: "recorrente", ignored: false },
    { id: "ev-2", date: format(addDays(today, 10), "yyyy-MM-dd"), type: "entrada", description: "Arrendamento — Fazenda Norte", amount: 8000, origin: "recorrente", ignored: false },
    { id: "ev-3", date: format(addDays(today, 18), "yyyy-MM-dd"), type: "entrada", description: "Venda de Gado — Lote 15", amount: 65000, origin: "manual", ignored: false },
    { id: "ev-4", date: format(addDays(today, 35), "yyyy-MM-dd"), type: "entrada", description: "Venda de Leite — Laticínios Bom Gosto", amount: 12500, origin: "recorrente", ignored: false },
    { id: "ev-5", date: format(addDays(today, 50), "yyyy-MM-dd"), type: "entrada", description: "Recebimento Parcela Venda Touro", amount: 15000, origin: "parcela", parcelaInfo: "3/6", ignored: false },
    { id: "ev-6", date: format(addDays(today, 65), "yyyy-MM-dd"), type: "entrada", description: "Arrendamento — Fazenda Norte", amount: 8000, origin: "recorrente", ignored: false },
    { id: "ev-7", date: format(addDays(today, 80), "yyyy-MM-dd"), type: "entrada", description: "Venda de Leite — Laticínios Bom Gosto", amount: 12500, origin: "recorrente", ignored: false },
    { id: "ev-8", date: format(addDays(today, 120), "yyyy-MM-dd"), type: "entrada", description: "Recebimento Parcela Venda Touro", amount: 15000, origin: "parcela", parcelaInfo: "4/6", ignored: false },

    // Saídas
    { id: "ev-10", date: format(addDays(today, 2), "yyyy-MM-dd"), type: "saida", description: "Folha de Pagamento", amount: 15000, origin: "recorrente", ignored: false },
    { id: "ev-11", date: format(addDays(today, 5), "yyyy-MM-dd"), type: "saida", description: "Compra de Ração — Agropec", amount: 8500, origin: "manual", ignored: false },
    { id: "ev-12", date: format(addDays(today, 8), "yyyy-MM-dd"), type: "saida", description: "Parcela Trator John Deere", amount: 12000, origin: "parcela", parcelaInfo: "8/36", ignored: false },
    { id: "ev-13", date: format(addDays(today, 12), "yyyy-MM-dd"), type: "saida", description: "Energia Elétrica", amount: 3200, origin: "recorrente", ignored: false },
    { id: "ev-14", date: format(addDays(today, 15), "yyyy-MM-dd"), type: "saida", description: "Medicamentos Veterinários", amount: 4500, origin: "manual", ignored: false },
    { id: "ev-15", date: format(addDays(today, 22), "yyyy-MM-dd"), type: "saida", description: "Combustível", amount: 3800, origin: "recorrente", ignored: false },
    { id: "ev-16", date: format(addDays(today, 30), "yyyy-MM-dd"), type: "saida", description: "Folha de Pagamento", amount: 15000, origin: "recorrente", ignored: false },
    { id: "ev-17", date: format(addDays(today, 38), "yyyy-MM-dd"), type: "saida", description: "Parcela Trator John Deere", amount: 12000, origin: "parcela", parcelaInfo: "9/36", ignored: false },
    { id: "ev-18", date: format(addDays(today, 42), "yyyy-MM-dd"), type: "saida", description: "Compra de Arame e Mourões", amount: 6500, origin: "manual", ignored: false },
    { id: "ev-19", date: format(addDays(today, 55), "yyyy-MM-dd"), type: "saida", description: "Impostos — FUNRURAL", amount: 9800, origin: "manual", ignored: false },
    { id: "ev-20", date: format(addDays(today, 60), "yyyy-MM-dd"), type: "saida", description: "Folha de Pagamento", amount: 15000, origin: "recorrente", ignored: false },
    { id: "ev-21", date: format(addDays(today, 68), "yyyy-MM-dd"), type: "saida", description: "Parcela Trator John Deere", amount: 12000, origin: "parcela", parcelaInfo: "10/36", ignored: false },
    { id: "ev-22", date: format(addDays(today, 75), "yyyy-MM-dd"), type: "saida", description: "Compra de Ração", amount: 8500, origin: "manual", ignored: false },
    { id: "ev-23", date: format(addDays(today, 90), "yyyy-MM-dd"), type: "saida", description: "Folha de Pagamento", amount: 15000, origin: "recorrente", ignored: false },
    { id: "ev-24", date: format(addDays(today, 100), "yyyy-MM-dd"), type: "saida", description: "Parcela Trator John Deere", amount: 12000, origin: "parcela", parcelaInfo: "11/36", ignored: false },
    { id: "ev-25", date: format(addDays(today, 110), "yyyy-MM-dd"), type: "saida", description: "Seguro Rural", amount: 5600, origin: "manual", ignored: false },
  ];
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

const fmt$ = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return v.toFixed(0);
};

/* ─── Component ─── */
export default function ProjecaoCaixa() {
  const [horizon, setHorizon] = useState("90");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(["acc-1"]);
  const [includeRecorrencias, setIncludeRecorrencias] = useState(true);
  const [includeParcelas, setIncludeParcelas] = useState(true);
  const [includeManual, setIncludeManual] = useState(true);
  const [events, setEvents] = useState<CashEvent[]>(generateMockEvents);

  const horizonDays = Number(horizon);
  const today = new Date();

  /* ─ Filtered events ─ */
  const filteredEvents = useMemo(() => {
    const limit = addDays(today, horizonDays);
    return events.filter((ev) => {
      if (ev.ignored) return false;
      const d = new Date(ev.date);
      if (d > limit) return false;
      if (!includeRecorrencias && ev.origin === "recorrente") return false;
      if (!includeParcelas && ev.origin === "parcela") return false;
      if (!includeManual && ev.origin === "manual") return false;
      return true;
    });
  }, [events, horizonDays, includeRecorrencias, includeParcelas, includeManual]);

  /* ─ Chart data (daily projected balance) ─ */
  const chartData = useMemo(() => {
    const points: { date: string; label: string; saldo: number; events: string[] }[] = [];
    let balance = INITIAL_BALANCE;

    // Group events by date
    const byDate: Record<string, CashEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!byDate[ev.date]) byDate[ev.date] = [];
      byDate[ev.date].push(ev);
    });

    for (let i = 0; i <= horizonDays; i++) {
      const d = addDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      const dayEvents = byDate[key] || [];

      dayEvents.forEach((ev) => {
        balance += ev.type === "entrada" ? ev.amount : -ev.amount;
      });

      points.push({
        date: key,
        label: format(d, "dd/MM"),
        saldo: balance,
        events: dayEvents.map((e) => `${e.type === "entrada" ? "+" : "-"}${fmt$(e.amount)} ${e.description}`),
      });
    }
    return points;
  }, [filteredEvents, horizonDays]);

  /* ─ Table data with projected balance ─ */
  const tableData = useMemo(() => {
    let balance = INITIAL_BALANCE;
    return filteredEvents.map((ev) => {
      balance += ev.type === "entrada" ? ev.amount : -ev.amount;
      return { ...ev, projectedBalance: balance };
    });
  }, [filteredEvents]);

  /* ─ Negative alert ─ */
  const negativeAlert = useMemo(() => {
    const point = chartData.find((p) => p.saldo < 0);
    if (!point) return null;

    // Find suggestions
    const negDate = new Date(point.date);
    const nearbyIncome = filteredEvents
      .filter((e) => e.type === "entrada" && new Date(e.date) > negDate)
      .slice(0, 1);
    const nearbyExpense = filteredEvents
      .filter((e) => e.type === "saida" && new Date(e.date) <= negDate)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 1);

    return {
      date: point.date,
      balance: point.saldo,
      advanceIncome: nearbyIncome[0] || null,
      postponeExpense: nearbyExpense[0] || null,
    };
  }, [chartData, filteredEvents]);

  /* ─ Toggle ignore ─ */
  const toggleIgnore = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ignored: !e.ignored } : e)),
    );
    toast({ title: "Evento atualizado na projeção" });
  };

  /* ─ Account toggle ─ */
  const toggleAccount = (accId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accId) ? prev.filter((a) => a !== accId) : [...prev, accId],
    );
  };

  /* ─ Custom tooltip ─ */
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }> }) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border bg-card p-3 shadow-md text-sm max-w-[300px]">
        <p className="font-semibold mb-1">{format(new Date(data.date), "dd/MM/yyyy (EEEE)", { })}</p>
        <p className={cn("font-mono font-bold", data.saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          Saldo: {fmt$(data.saldo)}
        </p>
        {data.events.length > 0 && (
          <div className="mt-2 space-y-0.5 border-t pt-2">
            {data.events.map((e: string, i: number) => (
              <p key={i} className={cn("text-xs", e.startsWith("+") ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                {e}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  };

  const minBalance = Math.min(...chartData.map((p) => p.saldo));
  const maxBalance = Math.max(...chartData.map((p) => p.saldo));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Projeção de Caixa
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize o saldo futuro e antecipe decisões financeiras
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Saldo atual:</span>
          <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">{fmt$(INITIAL_BALANCE)}</span>
        </div>
      </div>

      {/* Config */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="space-y-1 min-w-[140px]">
              <Label htmlFor="horizon">Horizonte</Label>
              <Select value={horizon} onValueChange={setHorizon}>
                <SelectTrigger id="horizon"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="180">180 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Contas</Label>
              <div className="flex flex-wrap gap-2">
                {mockAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs border transition-colors",
                      selectedAccounts.includes(acc.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent",
                    )}
                    aria-label={`Selecionar ${acc.name}`}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rec" checked={includeRecorrencias}
                  onCheckedChange={(c) => setIncludeRecorrencias(c === true)}
                />
                <Label htmlFor="rec" className="text-xs cursor-pointer">Recorrências</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="parc" checked={includeParcelas}
                  onCheckedChange={(c) => setIncludeParcelas(c === true)}
                />
                <Label htmlFor="parc" className="text-xs cursor-pointer">Parcelas</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="man" checked={includeManual}
                  onCheckedChange={(c) => setIncludeManual(c === true)}
                />
                <Label htmlFor="man" className="text-xs cursor-pointer">Manuais</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Negative Balance Alert */}
      {negativeAlert && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div>
                  <p className="font-bold text-destructive">
                    ⚠️ Saldo negativo projetado para {format(new Date(negativeAlert.date), "dd/MM/yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O saldo chegará a <span className="font-mono font-bold text-destructive">{fmt$(negativeAlert.balance)}</span> nesta data.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 text-sm">
                  {negativeAlert.advanceIncome && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-emerald-700 dark:text-emerald-400">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Considere adiantar: <strong>{negativeAlert.advanceIncome.description}</strong> ({fmt$(negativeAlert.advanceIncome.amount)})</span>
                    </div>
                  )}
                  {negativeAlert.postponeExpense && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-700 dark:text-amber-400">
                      <ArrowDownRight className="h-4 w-4" />
                      <span>Considere postergar: <strong>{negativeAlert.postponeExpense.description}</strong> ({fmt$(negativeAlert.postponeExpense.amount)})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Saldo Projetado — Próximos {horizon} dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  interval={Math.max(Math.floor(horizonDays / 12), 1)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => fmtShort(v)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  domain={[Math.min(minBalance * 1.1, 0), maxBalance * 1.1]}
                />
                <RTooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={1.5} />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gradPositive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eventos Futuros</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo Projetado</TableHead>
                <TableHead className="text-center w-[80px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum evento no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((ev) => (
                  <TableRow key={ev.id} className={cn(ev.projectedBalance < 0 && "bg-destructive/5")}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(ev.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          ev.type === "entrada"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
                        )}
                      >
                        {ev.type === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{ev.description}</span>
                        {ev.origin === "recorrente" && (
                          <Badge variant="secondary" className="text-[10px]">Recorrente</Badge>
                        )}
                        {ev.origin === "parcela" && ev.parcelaInfo && (
                          <Badge variant="secondary" className="text-[10px]">Parcela {ev.parcelaInfo}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-medium",
                      ev.type === "entrada"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive",
                    )}>
                      {ev.type === "entrada" ? "+" : "-"}{fmt$(ev.amount)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-medium",
                      ev.projectedBalance >= 0
                        ? "text-foreground"
                        : "text-destructive font-bold",
                    )}>
                      {fmt$(ev.projectedBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => toggleIgnore(ev.id)}
                              aria-label="Ignorar da projeção"
                              className="h-7 w-7 p-0"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ignorar da projeção</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
