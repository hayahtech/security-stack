import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Lightbulb, Calculator, PieChart as PieIcon, ArrowDown, ArrowUp, BarChart3 } from "lucide-react";
import { Treemap, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Mock spending data ───
interface SpendingCategory {
  name: string;
  group: "necessidades" | "desejos" | "poupanca";
  icon: string;
  months: Record<string, number>; // "2026-03": 1500
}

const spendingData: SpendingCategory[] = [
  { name: "Moradia", group: "necessidades", icon: "🏠", months: { "2025-10": 2500, "2025-11": 2500, "2025-12": 2500, "2026-01": 2500, "2026-02": 2500, "2026-03": 2500 } },
  { name: "Mercado", group: "necessidades", icon: "🛒", months: { "2025-10": 1200, "2025-11": 1350, "2025-12": 1680, "2026-01": 1100, "2026-02": 1250, "2026-03": 1180 } },
  { name: "Restaurante", group: "desejos", icon: "🍽️", months: { "2025-10": 650, "2025-11": 720, "2025-12": 1100, "2026-01": 580, "2026-02": 640, "2026-03": 920 } },
  { name: "Delivery", group: "desejos", icon: "🛵", months: { "2025-10": 380, "2025-11": 420, "2025-12": 510, "2026-01": 350, "2026-02": 400, "2026-03": 470 } },
  { name: "Combustível", group: "necessidades", icon: "⛽", months: { "2025-10": 680, "2025-11": 720, "2025-12": 580, "2026-01": 650, "2026-02": 600, "2026-03": 540 } },
  { name: "Uber/99", group: "necessidades", icon: "🚗", months: { "2025-10": 180, "2025-11": 200, "2025-12": 310, "2026-01": 150, "2026-02": 190, "2026-03": 220 } },
  { name: "Manutenção Veículo", group: "necessidades", icon: "🔧", months: { "2025-10": 0, "2025-11": 450, "2025-12": 0, "2026-01": 0, "2026-02": 0, "2026-03": 320 } },
  { name: "Saúde", group: "necessidades", icon: "💊", months: { "2025-10": 280, "2025-11": 150, "2025-12": 200, "2026-01": 350, "2026-02": 180, "2026-03": 420 } },
  { name: "Contas (água/luz/tel)", group: "necessidades", icon: "📱", months: { "2025-10": 680, "2025-11": 700, "2025-12": 720, "2026-01": 710, "2026-02": 690, "2026-03": 720 } },
  { name: "Streaming", group: "desejos", icon: "📺", months: { "2025-10": 189, "2025-11": 189, "2025-12": 189, "2026-01": 189, "2026-02": 189, "2026-03": 189 } },
  { name: "Spotify/Música", group: "desejos", icon: "🎵", months: { "2025-10": 34, "2025-11": 34, "2025-12": 34, "2026-01": 34, "2026-02": 34, "2026-03": 34 } },
  { name: "iCloud/Armazenamento", group: "desejos", icon: "☁️", months: { "2025-10": 15, "2025-11": 15, "2025-12": 15, "2026-01": 15, "2026-02": 15, "2026-03": 15 } },
  { name: "Academia", group: "necessidades", icon: "💪", months: { "2025-10": 150, "2025-11": 150, "2025-12": 150, "2026-01": 150, "2026-02": 150, "2026-03": 150 } },
  { name: "Roupas", group: "desejos", icon: "👕", months: { "2025-10": 0, "2025-11": 350, "2025-12": 580, "2026-01": 120, "2026-02": 200, "2026-03": 0 } },
  { name: "Lazer", group: "desejos", icon: "🎬", months: { "2025-10": 350, "2025-11": 280, "2025-12": 650, "2026-01": 200, "2026-02": 300, "2026-03": 380 } },
  { name: "Educação", group: "necessidades", icon: "📚", months: { "2025-10": 400, "2025-11": 400, "2025-12": 400, "2026-01": 400, "2026-02": 400, "2026-03": 400 } },
  { name: "Investimentos", group: "poupanca", icon: "📈", months: { "2025-10": 2300, "2025-11": 2300, "2025-12": 2300, "2026-01": 2300, "2026-02": 2300, "2026-03": 2300 } },
  { name: "Metas", group: "poupanca", icon: "🎯", months: { "2025-10": 1500, "2025-11": 1500, "2025-12": 1500, "2026-01": 1500, "2026-02": 1500, "2026-03": 1500 } },
];

const allMonths = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
const monthLabels: Record<string, string> = { "2025-10": "Out/25", "2025-11": "Nov/25", "2025-12": "Dez/25", "2026-01": "Jan/26", "2026-02": "Fev/26", "2026-03": "Mar/26" };

const groupColors: Record<string, string> = { necessidades: "149 62% 26%", desejos: "213 78% 37%", poupanca: "37 100% 50%" };
const catColors = ["149 62% 30%", "213 78% 40%", "37 100% 50%", "270 60% 50%", "330 70% 50%", "180 60% 35%", "0 72% 50%", "45 90% 50%", "200 70% 40%", "160 50% 40%", "280 50% 60%", "20 80% 50%", "100 50% 40%", "240 60% 50%", "350 60% 50%", "60 70% 40%", "120 40% 35%", "300 50% 45%"];

const subscriptions = [
  { name: "Netflix", value: 55.90 }, { name: "Disney+", value: 33.90 }, { name: "HBO Max", value: 34.90 },
  { name: "Amazon Prime", value: 19.90 }, { name: "Spotify Family", value: 34.99 },
  { name: "iCloud 200GB", value: 14.90 }, { name: "Strava", value: 44.99 }, { name: "Academia SmartFit", value: 149.90 },
];

export default function AnaliseGastos() {
  const { isEmpresarial } = useProfile();
  const [period, setPeriod] = useState("2026-03");
  const [compareWith, setCompareWith] = useState("2026-02");
  const [savingsCategory, setSavingsCategory] = useState("Delivery");
  const [savingsAmount, setSavingsAmount] = useState([200]);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Análise de Gastos</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal.</p>
      </div>
    );
  }

  const getMonthTotal = (month: string) => spendingData.reduce((s, c) => s + (c.months[month] || 0), 0);
  const currentTotal = getMonthTotal(period);
  const avgTotal = allMonths.reduce((s, m) => s + getMonthTotal(m), 0) / allMonths.length;
  const dailyAvg = currentTotal / 30;

  // Treemap data
  const treemapData = spendingData
    .filter(c => (c.months[period] || 0) > 0 && c.group !== "poupanca")
    .map((c, i) => ({ name: `${c.icon} ${c.name}`, size: c.months[period] || 0, fill: `hsl(${catColors[i % catColors.length]})` }))
    .sort((a, b) => b.size - a.size);

  // Trend data
  const trendData = allMonths.map(m => {
    const total = spendingData.filter(c => c.group !== "poupanca").reduce((s, c) => s + (c.months[m] || 0), 0);
    const avg = allMonths.reduce((s, mm) => s + spendingData.filter(c => c.group !== "poupanca").reduce((ss, c) => ss + (c.months[mm] || 0), 0), 0) / allMonths.length;
    return { month: monthLabels[m], total, media: Math.round(avg), aboveAvg: total > avg };
  });

  // Food breakdown
  const foodData = [
    { name: "Mercado", value: spendingData.find(c => c.name === "Mercado")?.months[period] || 0 },
    { name: "Restaurante", value: spendingData.find(c => c.name === "Restaurante")?.months[period] || 0 },
    { name: "Delivery", value: spendingData.find(c => c.name === "Delivery")?.months[period] || 0 },
  ];
  const deliveryMeals = Math.round((foodData[2].value || 0) / 35);

  // Transport
  const transportData = [
    { name: "Combustível", value: spendingData.find(c => c.name === "Combustível")?.months[period] || 0 },
    { name: "Uber/99", value: spendingData.find(c => c.name === "Uber/99")?.months[period] || 0 },
    { name: "Manutenção", value: spendingData.find(c => c.name === "Manutenção Veículo")?.months[period] || 0 },
  ];

  // Comparison
  const comparisonData = spendingData.filter(c => c.group !== "poupanca").map(c => {
    const a = c.months[period] || 0;
    const b = c.months[compareWith] || 0;
    const diff = a - b;
    const diffPct = b > 0 ? ((a - b) / b) * 100 : a > 0 ? 100 : 0;
    return { ...c, current: a, previous: b, diff, diffPct };
  }).filter(c => c.current > 0 || c.previous > 0).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // Insights
  const insights: { text: string; type: "up" | "down" | "neutral" }[] = [];
  const biggestIncrease = comparisonData.filter(c => c.diff > 0).sort((a, b) => b.diffPct - a.diffPct)[0];
  const biggestSaving = comparisonData.filter(c => c.diff < 0).sort((a, b) => a.diff - b.diff)[0];
  if (biggestIncrease && biggestIncrease.diffPct > 10) insights.push({ text: `Você gastou ${biggestIncrease.diffPct.toFixed(0)}% a mais em ${biggestIncrease.name} do que no mês anterior (+${fmt(biggestIncrease.diff)})`, type: "up" });
  if (biggestSaving) insights.push({ text: `Sua maior economia foi em ${biggestSaving.name}: ${fmt(biggestSaving.diff)}`, type: "down" });
  const maxGrowthCat = comparisonData.filter(c => c.diff > 0).sort((a, b) => b.diff - a.diff)[0];
  if (maxGrowthCat) insights.push({ text: `Categoria que mais cresceu: ${maxGrowthCat.name} (+${fmt(maxGrowthCat.diff)})`, type: "up" });
  insights.push({ text: `Você está gastando ${fmt(dailyAvg)}/dia em média este mês`, type: "neutral" });

  // Subscriptions
  const totalSubs = subscriptions.reduce((s, sub) => s + sub.value, 0);

  // Savings simulator
  const savingsMonthly = savingsAmount[0];
  const savingsYearly = savingsMonthly * 12;
  const savings5yr = (() => { let b = 0; const r = Math.pow(1.10, 1/12) - 1; for (let i = 0; i < 60; i++) b = b * (1 + r) + savingsMonthly; return b; })();

  // Delivery avg last 3
  const deliveryAvg3 = (["2026-01", "2026-02", "2026-03"].reduce((s, m) => s + (spendingData.find(c => c.name === "Delivery")?.months[m] || 0), 0)) / 3;

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, size } = props;
    if (width < 40 || height < 30) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={props.fill} rx={4} stroke="hsl(var(--background))" strokeWidth={2} />
        {width > 60 && height > 40 && (
          <>
            <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="white" fontSize={width > 100 ? 12 : 10} fontWeight="600">{name}</text>
            <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={10}>{fmt(size)}</text>
          </>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise de Gastos</h1>
          <p className="text-muted-foreground">Entenda para onde vai seu dinheiro</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{allMonths.map(m => <SelectItem key={m} value={m}>{monthLabels[m]}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Gasto total no mês</p>
          <p className="text-2xl font-bold text-foreground">{fmt(currentTotal)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Média diária</p>
          <p className="text-2xl font-bold text-foreground">{fmt(dailyAvg)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Média mensal (6m)</p>
          <p className="text-2xl font-bold text-muted-foreground">{fmt(avgTotal)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">vs Média</p>
          <p className={cn("text-2xl font-bold", currentTotal > avgTotal ? "text-destructive" : "text-primary")}>
            {currentTotal > avgTotal ? "+" : ""}{fmt(currentTotal - avgTotal)}
          </p>
        </CardContent></Card>
      </div>

      {/* Treemap + Trend */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Mapa de Gastos</CardTitle><CardDescription>Blocos proporcionais ao valor gasto</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <Treemap data={treemapData} dataKey="size" aspectRatio={4/3} content={<CustomTreemapContent />} />
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Tendência de Gastos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={({ cx, cy, payload }: any) => (
                  <circle cx={cx} cy={cy} r={5} fill={payload.aboveAvg ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stroke="hsl(var(--background))" strokeWidth={2} />
                )} name="Total" />
                <Line type="monotone" dataKey="media" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Média" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Habits */}
      <h2 className="text-lg font-semibold text-foreground">Seus Hábitos de Consumo</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Food */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🍽️ Alimentação</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart><Pie data={foodData} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={25} label={false}>
                <Cell fill="hsl(149 62% 26%)" /><Cell fill="hsl(213 78% 37%)" /><Cell fill="hsl(37 100% 50%)" />
              </Pie><Tooltip formatter={(v: number) => fmt(v)} /></PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 text-xs">
              {foodData.map((f, i) => (
                <div key={f.name} className="flex justify-between"><span className="text-muted-foreground">{f.name}</span><span className="font-medium text-foreground">{fmt(f.value)}</span></div>
              ))}
              <p className="text-muted-foreground pt-1">~{deliveryMeals} refeições por delivery</p>
            </div>
          </CardContent>
        </Card>

        {/* Transport */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🚗 Transporte</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transportData.map(t => (
                <div key={t.name} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{t.name}</span>
                  <span className="text-sm font-medium text-foreground">{fmt(t.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between"><span className="text-xs font-medium text-foreground">Total</span><span className="text-sm font-bold text-foreground">{fmt(transportData.reduce((s, t) => s + t.value, 0))}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">📺 Assinaturas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-foreground mb-2">{fmt(totalSubs)}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {subscriptions.map(sub => (
                <div key={sub.name} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{sub.name}</span>
                  <span className="text-foreground">{fmt(sub.value)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{subscriptions.length} assinaturas ativas</p>
          </CardContent>
        </Card>

        {/* Leisure */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">🎬 Lazer</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-foreground">{fmt(spendingData.find(c => c.name === "Lazer")?.months[period] || 0)}</p>
            <p className="text-xs text-muted-foreground mb-2">Entretenimento e cultura</p>
            {(() => {
              const current = spendingData.find(c => c.name === "Lazer")?.months[period] || 0;
              const avg = allMonths.reduce((s, m) => s + (spendingData.find(c => c.name === "Lazer")?.months[m] || 0), 0) / allMonths.length;
              const pct = avg > 0 ? ((current - avg) / avg) * 100 : 0;
              return <Badge variant={pct > 0 ? "destructive" : "default"} className="text-xs">{pct > 0 ? "+" : ""}{pct.toFixed(0)}% vs média</Badge>;
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Comparison */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div><CardTitle className="text-base">Comparativo Mensal</CardTitle><CardDescription>{monthLabels[period]} vs {monthLabels[compareWith]}</CardDescription></div>
          <Select value={compareWith} onValueChange={setCompareWith}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{allMonths.filter(m => m !== period).map(m => <SelectItem key={m} value={m}>{monthLabels[m]}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Categoria</TableHead><TableHead className="text-right">{monthLabels[period]}</TableHead>
              <TableHead className="text-right">{monthLabels[compareWith]}</TableHead><TableHead className="text-right">Diferença</TableHead><TableHead className="text-right">%</TableHead><TableHead className="w-8"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {comparisonData.map(c => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.icon} {c.name}</TableCell>
                  <TableCell className="text-right">{fmt(c.current)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(c.previous)}</TableCell>
                  <TableCell className={cn("text-right font-medium", c.diff > 0 ? "text-destructive" : c.diff < 0 ? "text-primary" : "text-muted-foreground")}>{c.diff > 0 ? "+" : ""}{fmt(c.diff)}</TableCell>
                  <TableCell className={cn("text-right text-sm", c.diff > 0 ? "text-destructive" : c.diff < 0 ? "text-primary" : "text-muted-foreground")}>{c.diffPct > 0 ? "+" : ""}{c.diffPct.toFixed(0)}%</TableCell>
                  <TableCell>{c.diff > 0 ? <ArrowUp className="h-4 w-4 text-destructive" /> : c.diff < 0 ? <ArrowDown className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-muted-foreground" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-3">
        {insights.map((ins, idx) => (
          <Card key={idx} className={cn(ins.type === "up" ? "border-destructive/20" : ins.type === "down" ? "border-primary/20" : "border-muted")}>
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              {ins.type === "up" ? <TrendingUp className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" /> :
               ins.type === "down" ? <TrendingDown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /> :
               <Lightbulb className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />}
              <p className="text-sm text-foreground">{ins.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Economy Opportunities */}
      <Card>
        <CardHeader><CardTitle className="text-base">💡 Oportunidades de Economia</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-foreground">Suas assinaturas somam <span className="font-semibold">{fmt(totalSubs)}/mês</span>. Cancelando 2 que você usa menos, economizaria ~<span className="font-semibold text-primary">{fmt(totalSubs * 0.25)}/mês = {fmt(totalSubs * 0.25 * 12)}/ano</span></p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-foreground">Você gasta em média <span className="font-semibold">{fmt(deliveryAvg3)}/mês</span> em delivery (~{Math.round(deliveryAvg3 / 35)} refeições). Reduzindo para 2x por semana, economizaria ~<span className="font-semibold text-primary">{fmt(deliveryAvg3 * 0.4)}/mês</span></p>
          </div>
          {(() => {
            const lazerCurrent = spendingData.find(c => c.name === "Lazer")?.months[period] || 0;
            const lazerAvg = allMonths.reduce((s, m) => s + (spendingData.find(c => c.name === "Lazer")?.months[m] || 0), 0) / allMonths.length;
            if (lazerCurrent > lazerAvg * 1.3) return (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground">Seus gastos com lazer estão <span className="font-semibold text-destructive">{(((lazerCurrent - lazerAvg) / lazerAvg) * 100).toFixed(0)}% acima</span> da média dos últimos 6 meses</p>
              </div>
            );
            return null;
          })()}
        </CardContent>
      </Card>

      {/* Savings Simulator */}
      <Card>
        <CardHeader><CardTitle className="text-base">🧮 Simulador de Economia</CardTitle><CardDescription>"Se eu economizar R$ X por mês em {savingsCategory}..."</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={savingsCategory} onValueChange={setSavingsCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{spendingData.filter(c => c.group !== "poupanca" && (c.months[period] || 0) > 0).map(c => <SelectItem key={c.name} value={c.name}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between"><Label>Economia mensal</Label><span className="text-sm font-medium text-foreground">{fmt(savingsMonthly)}</span></div>
              <Slider min={50} max={Math.max(spendingData.find(c => c.name === savingsCategory)?.months[period] || 500, 500)} step={50} value={savingsAmount} onValueChange={setSavingsAmount} className="mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-muted/50"><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Em 12 meses</p>
              <p className="text-lg font-bold text-primary">{fmt(savingsYearly)}</p>
            </CardContent></Card>
            <Card className="bg-muted/50"><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Investido a 10% a.a. em 5 anos</p>
              <p className="text-lg font-bold text-primary">{fmt(savings5yr)}</p>
            </CardContent></Card>
            <Card className="bg-muted/50"><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Rendimento sobre a economia</p>
              <p className="text-lg font-bold text-primary">{fmt(savings5yr - savingsMonthly * 60)}</p>
            </CardContent></Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
