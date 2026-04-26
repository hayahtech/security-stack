import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  TrendingUp, TrendingDown, Minus, Plus, DollarSign, Calendar,
  BarChart3, Calculator, Info, CloudRain, Thermometer, Droplets, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, ComposedChart,
} from "recharts";

// ── Types & Constants ──────────────────────────────────────
type AnimalType = "Boi Gordo" | "Vaca Gorda";
const arrobaTypes: AnimalType[] = ["Boi Gordo", "Vaca Gorda"];
type BezerroCategory = "Bezerro Desmamado" | "Garrote" | "Novilha";
const bezerroCategories: BezerroCategory[] = ["Bezerro Desmamado", "Garrote", "Novilha"];
const pracas = ["Campo Grande/MS", "Uberaba/MG", "São Paulo/SP", "Goiânia/GO", "Cuiabá/MT", "Ribeirão Preto/SP"];
const fontes = ["CEPEA", "Corretor", "Leilão", "Scot Consultoria", "Outro"];
const faixasPeso = ["120-180 kg", "180-240 kg", "240-300 kg", "300-360 kg"];

interface Quotation {
  id: string;
  date: string;
  type: string;
  region: string;
  pricePerArroba: number;
  source: string;
  notes?: string;
  isSale?: boolean;
  pricePerHead?: number;
  weightRange?: string;
}

interface ClimateRecord {
  id: string;
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  humidity: number;
  observations?: string;
  isExtreme?: boolean;
  extremeImpact?: string;
}

// ── Mock Data ──────────────────────────────────────────────
function generateMockQuotations(): Quotation[] {
  const data: Quotation[] = [];
  const basePrice: Record<string, number> = { "Boi Gordo": 245, "Vaca Gorda": 210 };
  let id = 1;
  for (let m = 0; m < 12; m++) {
    const month = new Date(2025, 3 + m, 1);
    for (const type of arrobaTypes) {
      const base = basePrice[type];
      for (const day of [5, 15, 25]) {
        const d = new Date(month);
        d.setDate(Math.min(day, 28));
        const variation = (Math.random() - 0.45) * 20;
        const trendUp = m * 1.2;
        data.push({
          id: `qa${id++}`, date: d.toISOString().slice(0, 10), type, region: pracas[Math.floor(Math.random() * pracas.length)],
          pricePerArroba: Math.round((base + variation + trendUp) * 100) / 100,
          source: fontes[Math.floor(Math.random() * fontes.length)], isSale: Math.random() > 0.88,
        });
      }
    }
  }
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

function generateBezerroQuotations(): Quotation[] {
  const data: Quotation[] = [];
  const basePrice: Record<string, number> = { "Bezerro Desmamado": 2200, "Garrote": 2800, "Novilha": 2400 };
  let id = 1;
  for (let m = 0; m < 12; m++) {
    const month = new Date(2025, 3 + m, 1);
    for (const cat of bezerroCategories) {
      const base = basePrice[cat];
      for (const day of [10, 25]) {
        const d = new Date(month);
        d.setDate(Math.min(day, 28));
        const variation = (Math.random() - 0.4) * 300;
        const trendUp = m * 30;
        const priceHead = Math.round(base + variation + trendUp);
        data.push({
          id: `qb${id++}`, date: d.toISOString().slice(0, 10), type: cat, region: pracas[Math.floor(Math.random() * pracas.length)],
          pricePerArroba: Math.round((priceHead / 10) * 100) / 100, pricePerHead: priceHead,
          source: fontes[Math.floor(Math.random() * fontes.length)],
          weightRange: faixasPeso[Math.floor(Math.random() * faixasPeso.length)],
        });
      }
    }
  }
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

function generateClimateData(): ClimateRecord[] {
  const data: ClimateRecord[] = [];
  let id = 1;
  for (let m = 0; m < 12; m++) {
    const month = new Date(2025, 3 + m, 1);
    const daysInMonth = new Date(2025, 4 + m, 0).getDate();
    // Weekly records
    for (let w = 0; w < 4; w++) {
      const d = new Date(month);
      d.setDate(Math.min(1 + w * 7, daysInMonth));
      const isWet = m >= 6 && m <= 9;
      const precip = isWet ? Math.round(Math.random() * 60 + 10) : Math.round(Math.random() * 20);
      const isExtreme = Math.random() > 0.92;
      data.push({
        id: `cl${id++}`, date: d.toISOString().slice(0, 10),
        tempMin: Math.round(12 + Math.random() * 10 + (isWet ? 5 : 0)),
        tempMax: Math.round(28 + Math.random() * 10 - (isWet ? 2 : 0)),
        precipitation: precip, humidity: Math.round(40 + Math.random() * 40),
        observations: isExtreme ? "Evento climático registrado" : undefined,
        isExtreme, extremeImpact: isExtreme ? "Impacto moderado nas pastagens" : undefined,
      });
    }
  }
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

const mockArrobaQuotations = generateMockQuotations();
const mockBezerroQuotations = generateBezerroQuotations();
const mockClimateData = generateClimateData();

// ── Helpers ────────────────────────────────────────────────
function calcMovingAvg(data: { date: string; price: number }[], windowDays: number) {
  return data.map((d, i) => {
    const cutoff = new Date(d.date);
    cutoff.setDate(cutoff.getDate() - windowDays);
    const windowData = data.filter((x, j) => j <= i && new Date(x.date) >= cutoff);
    const avg = windowData.reduce((s, x) => s + x.price, 0) / (windowData.length || 1);
    return { ...d, avg: Math.round(avg * 100) / 100 };
  });
}

function avg(quotations: Quotation[], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = quotations.filter((q) => new Date(q.date) >= cutoff);
  return filtered.length > 0 ? filtered.reduce((s, q) => s + q.pricePerArroba, 0) / filtered.length : 0;
}

function trend(quotations: Quotation[]) {
  if (quotations.length < 6) return "estável";
  const last3 = quotations.slice(-3).reduce((s, q) => s + q.pricePerArroba, 0) / 3;
  const prev3 = quotations.slice(-6, -3).reduce((s, q) => s + q.pricePerArroba, 0) / 3;
  const diff = last3 - prev3;
  if (diff > 3) return "alta";
  if (diff < -3) return "baixa";
  return "estável";
}

const lineColors: Record<string, string> = {
  "Boi Gordo": "hsl(142, 50%, 45%)", "Vaca Gorda": "hsl(217, 91%, 60%)",
  "Bezerro Desmamado": "hsl(38, 92%, 50%)", "Garrote": "hsl(280, 60%, 55%)", "Novilha": "hsl(0, 84%, 60%)",
};

function DatePicker({ value, onChange, label }: { value?: Date; onChange: (d?: Date) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal min-h-[44px]", !value && "text-muted-foreground")}>
            <Calendar className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : "Selecionar"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Indicators Card Row ────────────────────────────────────
function IndicatorCards({ quotations, typeLabel }: { quotations: Quotation[]; typeLabel: string }) {
  const sorted = useMemo(() => [...quotations].sort((a, b) => a.date.localeCompare(b.date)), [quotations]);
  const currentPrice = sorted.length > 0 ? sorted[sorted.length - 1].pricePerArroba : 0;
  const peakPrice = sorted.reduce((max, q) => Math.max(max, q.pricePerArroba), 0);
  const minPrice = sorted.reduce((min, q) => Math.min(min, q.pricePerArroba), Infinity);
  const avg30 = avg(sorted, 30);
  const t = trend(sorted);
  const TrendIcon = t === "alta" ? TrendingUp : t === "baixa" ? TrendingDown : Minus;
  const trendColor = t === "alta" ? "text-emerald-600 dark:text-emerald-400" : t === "baixa" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card><CardContent className="p-4">
        <p className="text-xs text-muted-foreground">Preço Atual ({typeLabel})</p>
        <p className="text-2xl font-bold text-foreground">R$ {currentPrice.toFixed(2)}</p>
        <div className={`flex items-center gap-1 text-sm mt-1 ${trendColor}`}><TrendIcon className="h-3.5 w-3.5" /><span className="capitalize">{t}</span></div>
      </CardContent></Card>
      <Card><CardContent className="p-4">
        <p className="text-xs text-muted-foreground">Média 30d</p>
        <p className="text-xl font-bold text-foreground">R$ {avg30.toFixed(2)}</p>
        <p className={`text-xs ${currentPrice >= avg30 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{currentPrice >= avg30 ? "Acima" : "Abaixo"} da média</p>
      </CardContent></Card>
      <Card><CardContent className="p-4">
        <p className="text-xs text-muted-foreground">Máxima (ano)</p>
        <p className="text-xl font-bold text-foreground">R$ {peakPrice.toFixed(2)}</p>
      </CardContent></Card>
      <Card><CardContent className="p-4">
        <p className="text-xs text-muted-foreground">Mínima (ano)</p>
        <p className="text-xl font-bold text-foreground">R$ {minPrice === Infinity ? "0.00" : minPrice.toFixed(2)}</p>
      </CardContent></Card>
    </div>
  );
}

// ── Price Chart (reusable) ─────────────────────────────────
function PriceChart({ quotations, visibleTypes, avgWindow = 30 }: { quotations: Quotation[]; visibleTypes: Set<string>; avgWindow?: number }) {
  const dateMap = new Map<string, Record<string, number>>();
  quotations.forEach((q) => {
    if (!visibleTypes.has(q.type)) return;
    if (!dateMap.has(q.date)) dateMap.set(q.date, { date: q.date as unknown as number });
    const entry = dateMap.get(q.date)!;
    entry[q.type] = q.pricePerArroba;
    if (q.isSale) entry[`${q.type}_sale`] = q.pricePerArroba;
  });
  const chartData = Array.from(dateMap.values()).sort((a: any, b: any) => (a.date as string).localeCompare(b.date as string));

  // Moving average for first visible type
  const firstType = Array.from(visibleTypes)[0];
  if (firstType) {
    const typeData = quotations.filter((q) => q.type === firstType).map((q) => ({ date: q.date, price: q.pricePerArroba }));
    const withAvg = calcMovingAvg(typeData, avgWindow);
    withAvg.forEach((d) => {
      const entry = chartData.find((c: any) => c.date === d.date);
      if (entry) (entry as any)[`Média ${avgWindow}d`] = d.avg;
    });
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => { const d = new Date(v); return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`; }} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
          formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name]} />
        <Legend />
        {Array.from(visibleTypes).map((type) => (
          <Line key={type} type="monotone" dataKey={type} stroke={lineColors[type] || "hsl(var(--primary))"} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        ))}
        <Line type="monotone" dataKey={`Média ${avgWindow}d`} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Sale Calculator ────────────────────────────────────────
function SaleCalculator({ currentPrice, peakPrice, label = "por @" }: { currentPrice: number; peakPrice: number; label?: string }) {
  const [animals, setAnimals] = useState("");
  const [avgWeight, setAvgWeight] = useState("");
  const numAnimals = Number(animals) || 0;
  const weight = Number(avgWeight) || 0;
  const totalArrobas = (numAnimals * weight) / 15;
  const estimatedRevenue = totalArrobas * currentPrice;
  const peakRevenue = totalArrobas * peakPrice;
  const diff = peakRevenue - estimatedRevenue;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Calculadora de Venda</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1"><Label>Nº de animais</Label><Input type="number" value={animals} onChange={(e) => setAnimals(e.target.value)} placeholder="Ex: 30" className="min-h-[44px]" /></div>
        <div className="space-y-1"><Label>Peso médio (kg)</Label><Input type="number" value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)} placeholder="Ex: 520" className="min-h-[44px]" /></div>
        <div className="space-y-1"><Label>Preço atual {label}</Label><p className="text-lg font-bold text-foreground">R$ {currentPrice.toFixed(2)}</p></div>
        <Separator />
        {numAnimals > 0 && weight > 0 && (
          <div className="space-y-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Receita estimada</p>
              <p className="text-xl font-bold text-primary">R$ {estimatedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">{totalArrobas.toFixed(1)} @ × R$ {currentPrice.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">No pico (R$ {peakPrice.toFixed(2)}/@)</p>
              <p className="text-lg font-bold text-foreground">R$ {peakRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p className={`text-xs font-medium ${diff > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                {diff > 0 ? "−" : "+"} R$ {Math.abs(diff).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════
// ── TAB 1: ARROBA ────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function TabArroba() {
  const [quotations, setQuotations] = useState<Quotation[]>(mockArrobaQuotations);
  const [open, setOpen] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(arrobaTypes));
  const [avgWindow, setAvgWindow] = useState(30);
  const [form, setForm] = useState({ type: "Boi Gordo" as AnimalType, date: undefined as Date | undefined, region: "", pricePerArroba: "", source: "CEPEA", notes: "" });

  const toggleType = (t: string) => setVisibleTypes((prev) => { const next = new Set(prev); if (next.has(t)) next.delete(t); else next.add(t); return next; });
  const boiQ = useMemo(() => quotations.filter((q) => q.type === "Boi Gordo").sort((a, b) => a.date.localeCompare(b.date)), [quotations]);
  const currentPrice = boiQ.length > 0 ? boiQ[boiQ.length - 1].pricePerArroba : 0;
  const peakPrice = boiQ.reduce((max, q) => Math.max(max, q.pricePerArroba), 0);

  const handleSave = () => {
    if (!form.date || !form.pricePerArroba) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const newQ: Quotation = { id: `qa${Date.now()}`, date: form.date.toISOString().slice(0, 10), type: form.type, region: form.region, pricePerArroba: Number(form.pricePerArroba), source: form.source, notes: form.notes || undefined };
    setQuotations((prev) => [...prev, newQ].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ type: "Boi Gordo", date: undefined, region: "", pricePerArroba: "", source: "CEPEA", notes: "" });
    setOpen(false);
    toast({ title: "Cotação registrada!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Nova Cotação</Button></div>
      <IndicatorCards quotations={boiQ} typeLabel="Boi" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {arrobaTypes.map((type) => (
              <Button key={type} variant={visibleTypes.has(type) ? "default" : "outline"} size="sm" className="min-h-[44px]" onClick={() => toggleType(type)}>
                <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: lineColors[type] }} />{type}
              </Button>
            ))}
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Select value={String(avgWindow)} onValueChange={(v) => setAvgWindow(Number(v))}>
              <SelectTrigger className="w-[130px] min-h-[44px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="30">Média 30d</SelectItem><SelectItem value="90">Média 90d</SelectItem></SelectContent>
            </Select>
          </div>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Histórico de Cotações</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><PriceChart quotations={quotations} visibleTypes={visibleTypes} avgWindow={avgWindow} /></CardContent>
          </Card>
        </div>
        <SaleCalculator currentPrice={currentPrice} peakPrice={peakPrice} />
      </div>

      <Separator />
      <QuotationsTable quotations={quotations} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Cotação — Arroba</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AnimalType })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{arrobaTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Praça/Região</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{pracas.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Preço por @ (R$) *</Label>
                <Input type="number" step="0.01" value={form.pricePerArroba} onChange={(e) => setForm({ ...form, pricePerArroba: e.target.value })} className="min-h-[44px]" placeholder="Ex: 255.00" /></div>
            </div>
            <div className="space-y-1"><Label>Fonte</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>{fontes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TAB 2: BEZERROS ──────────────────────────────────────
// ══════════════════════════════════════════════════════════
function TabBezerros() {
  const [quotations, setQuotations] = useState<Quotation[]>(mockBezerroQuotations);
  const [arrobaQuotations] = useState<Quotation[]>(mockArrobaQuotations);
  const [open, setOpen] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(bezerroCategories));
  const [showArrobaOverlay, setShowArrobaOverlay] = useState(true);
  const [form, setForm] = useState({ type: "Bezerro Desmamado" as BezerroCategory, date: undefined as Date | undefined, region: "", pricePerHead: "", pricePerArroba: "", source: "CEPEA", notes: "", weightRange: "180-240 kg" });

  const toggleType = (t: string) => setVisibleTypes((prev) => { const next = new Set(prev); if (next.has(t)) next.delete(t); else next.add(t); return next; });
  const sorted = useMemo(() => [...quotations].sort((a, b) => a.date.localeCompare(b.date)), [quotations]);
  const currentPrice = sorted.length > 0 ? sorted[sorted.length - 1].pricePerHead || sorted[sorted.length - 1].pricePerArroba : 0;

  // Comparative chart data: bezerro price per head vs boi gordo arroba
  const compChartData = useMemo(() => {
    const dateMap = new Map<string, any>();
    quotations.forEach((q) => {
      if (!visibleTypes.has(q.type)) return;
      if (!dateMap.has(q.date)) dateMap.set(q.date, { date: q.date });
      dateMap.get(q.date)![q.type] = q.pricePerHead || q.pricePerArroba;
    });
    if (showArrobaOverlay) {
      arrobaQuotations.filter((q) => q.type === "Boi Gordo").forEach((q) => {
        if (!dateMap.has(q.date)) dateMap.set(q.date, { date: q.date });
        dateMap.get(q.date)!["Boi Gordo (@)"] = q.pricePerArroba;
      });
    }
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [quotations, arrobaQuotations, visibleTypes, showArrobaOverlay]);

  const handleSave = () => {
    if (!form.date || (!form.pricePerHead && !form.pricePerArroba)) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const priceHead = Number(form.pricePerHead) || 0;
    const priceArroba = Number(form.pricePerArroba) || (priceHead / 10);
    const newQ: Quotation = { id: `qb${Date.now()}`, date: form.date.toISOString().slice(0, 10), type: form.type, region: form.region, pricePerArroba: priceArroba, pricePerHead: priceHead || undefined, source: form.source, notes: form.notes || undefined, weightRange: form.weightRange };
    setQuotations((prev) => [...prev, newQ].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ type: "Bezerro Desmamado", date: undefined, region: "", pricePerHead: "", pricePerArroba: "", source: "CEPEA", notes: "", weightRange: "180-240 kg" });
    setOpen(false);
    toast({ title: "Cotação de bezerro registrada!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Nova Cotação</Button></div>
      <IndicatorCards quotations={sorted} typeLabel="Bezerro" />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          {bezerroCategories.map((cat) => (
            <Button key={cat} variant={visibleTypes.has(cat) ? "default" : "outline"} size="sm" className="min-h-[44px]" onClick={() => toggleType(cat)}>
              <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: lineColors[cat] }} />{cat}
            </Button>
          ))}
          <Separator orientation="vertical" className="h-6 mx-2" />
          <div className="flex items-center gap-2">
            <Switch checked={showArrobaOverlay} onCheckedChange={setShowArrobaOverlay} />
            <Label className="text-sm">Comparar c/ Boi Gordo (@)</Label>
          </div>
        </div>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bezerro (R$/cabeça) vs Arroba do Boi</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={compChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => { const d = new Date(v); return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`; }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                {showArrobaOverlay && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />}
                <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")} />
                <Legend />
                {Array.from(visibleTypes).map((cat) => (
                  <Line key={cat} yAxisId="left" type="monotone" dataKey={cat} stroke={lineColors[cat] || "hsl(var(--primary))"} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
                {showArrobaOverlay && <Line yAxisId="right" type="monotone" dataKey="Boi Gordo (@)" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls />}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Separator />
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Cotações de Bezerros</h3>
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Categoria</TableHead><TableHead>Faixa Peso</TableHead>
            <TableHead className="text-right">R$/cabeça</TableHead><TableHead className="text-right">R$/@</TableHead>
            <TableHead>Praça</TableHead><TableHead>Fonte</TableHead>
          </TableRow></TableHeader>
          <TableBody>{sorted.slice().reverse().slice(0, 30).map((q) => (
            <TableRow key={q.id}>
              <TableCell>{new Date(q.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell><Badge variant="secondary">{q.type}</Badge></TableCell>
              <TableCell className="text-sm">{q.weightRange || "—"}</TableCell>
              <TableCell className="text-right font-mono font-bold">{q.pricePerHead ? `R$ ${q.pricePerHead.toLocaleString("pt-BR")}` : "—"}</TableCell>
              <TableCell className="text-right font-mono">R$ {q.pricePerArroba.toFixed(2)}</TableCell>
              <TableCell className="text-sm">{q.region}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{q.source}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div></CardContent></Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Cotação — Bezerro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Categoria *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as BezerroCategory })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{bezerroCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Faixa de Peso</Label>
                <Select value={form.weightRange} onValueChange={(v) => setForm({ ...form, weightRange: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{faixasPeso.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Praça/Região</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{pracas.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Preço por cabeça (R$)</Label>
                <Input type="number" value={form.pricePerHead} onChange={(e) => setForm({ ...form, pricePerHead: e.target.value })} className="min-h-[44px]" placeholder="Ex: 2500" /></div>
              <div className="space-y-1"><Label>Preço por @ (R$)</Label>
                <Input type="number" step="0.01" value={form.pricePerArroba} onChange={(e) => setForm({ ...form, pricePerArroba: e.target.value })} className="min-h-[44px]" placeholder="Ex: 280.00" /></div>
            </div>
            <div className="space-y-1"><Label>Fonte</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>{fontes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TAB 3: CLIMA ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function TabClima() {
  const [records, setRecords] = useState<ClimateRecord[]>(mockClimateData);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: undefined as Date | undefined, tempMin: "", tempMax: "", precipitation: "", humidity: "", observations: "", isExtreme: false, extremeImpact: "" });

  // Monthly rain accumulation
  const monthlyRain = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const key = r.date.slice(0, 7);
      map.set(key, (map.get(key) || 0) + r.precipitation);
    });
    return Array.from(map.entries()).map(([month, total]) => ({
      month, label: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      total: Math.round(total),
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [records]);

  // Temperature chart data
  const tempData = useMemo(() => records.map((r) => ({
    date: r.date, label: new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    min: r.tempMin, max: r.tempMax,
  })), [records]);

  // Rain accumulators
  const now = new Date();
  const rainAccum = useMemo(() => {
    const acc = (days: number) => {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      return records.filter((r) => new Date(r.date) >= cutoff).reduce((s, r) => s + r.precipitation, 0);
    };
    const currentMonth = records.filter((r) => r.date.startsWith(format(now, "yyyy-MM"))).reduce((s, r) => s + r.precipitation, 0);
    return { currentMonth: Math.round(currentMonth), last3: Math.round(acc(90)), last12: Math.round(acc(365)) };
  }, [records]);

  const extremeEvents = useMemo(() => records.filter((r) => r.isExtreme), [records]);

  const handleSave = () => {
    if (!form.date || !form.tempMin || !form.tempMax) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const newR: ClimateRecord = {
      id: `cl${Date.now()}`, date: form.date.toISOString().slice(0, 10),
      tempMin: Number(form.tempMin), tempMax: Number(form.tempMax),
      precipitation: Number(form.precipitation) || 0, humidity: Number(form.humidity) || 0,
      observations: form.observations || undefined, isExtreme: form.isExtreme,
      extremeImpact: form.isExtreme ? form.extremeImpact || undefined : undefined,
    };
    setRecords((prev) => [...prev, newR].sort((a, b) => a.date.localeCompare(b.date)));
    setForm({ date: undefined, tempMin: "", tempMax: "", precipitation: "", humidity: "", observations: "", isExtreme: false, extremeImpact: "" });
    setOpen(false);
    toast({ title: "Registro climático salvo!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Novo Registro</Button></div>

      {/* Rain accumulators */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
          <p className="text-xs text-muted-foreground">Mês atual</p>
          <p className="text-2xl font-bold text-foreground">{rainAccum.currentMonth} mm</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
          <p className="text-xs text-muted-foreground">Últimos 3 meses</p>
          <p className="text-2xl font-bold text-foreground">{rainAccum.last3} mm</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Droplets className="h-5 w-5 mx-auto text-blue-500 mb-1" />
          <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          <p className="text-2xl font-bold text-foreground">{rainAccum.last12} mm</p>
        </CardContent></Card>
      </div>

      {/* Monthly rain bar chart */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CloudRain className="h-4 w-4 text-blue-500" /> Chuva Acumulada Mensal (mm)</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRain}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}mm`} />
              <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} mm`, "Precipitação"]} />
              <Bar dataKey="total" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Temperature line chart */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Thermometer className="h-4 w-4 text-destructive" /> Temperatura Mín/Máx (°C)</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tempData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}°`} />
              <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [`${v}°C`, name === "min" ? "Mínima" : "Máxima"]} />
              <Legend formatter={(v) => v === "min" ? "Mínima" : "Máxima"} />
              <Line type="monotone" dataKey="min" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="max" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Extreme events */}
      {extremeEvents.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Eventos Climáticos Extremos</h3>
          <div className="space-y-2">
            {extremeEvents.map((e) => (
              <Card key={e.id} className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{new Date(e.date).toLocaleDateString("pt-BR")} — {e.observations || "Evento extremo"}</p>
                    {e.extremeImpact && <p className="text-sm text-muted-foreground mt-1">{e.extremeImpact}</p>}
                    <p className="text-xs text-muted-foreground mt-1">🌡 {e.tempMin}°–{e.tempMax}°C | 🌧 {e.precipitation}mm | 💧 {e.humidity}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />
      {/* Records table */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Registros Climáticos</h3>
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Mín °C</TableHead><TableHead>Máx °C</TableHead>
            <TableHead>Chuva (mm)</TableHead><TableHead>Umid. %</TableHead><TableHead>Obs.</TableHead>
          </TableRow></TableHeader>
          <TableBody>{records.slice().reverse().slice(0, 30).map((r) => (
            <TableRow key={r.id} className={r.isExtreme ? "bg-amber-500/5" : ""}>
              <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{r.tempMin}°</TableCell><TableCell>{r.tempMax}°</TableCell>
              <TableCell className="font-mono">{r.precipitation}</TableCell>
              <TableCell>{r.humidity}%</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.observations || "—"}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div></CardContent></Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Registro Climático</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Temp. Mín (°C) *</Label><Input type="number" value={form.tempMin} onChange={(e) => setForm({ ...form, tempMin: e.target.value })} className="min-h-[44px]" placeholder="Ex: 15" /></div>
              <div className="space-y-1"><Label>Temp. Máx (°C) *</Label><Input type="number" value={form.tempMax} onChange={(e) => setForm({ ...form, tempMax: e.target.value })} className="min-h-[44px]" placeholder="Ex: 32" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Precipitação (mm)</Label><Input type="number" value={form.precipitation} onChange={(e) => setForm({ ...form, precipitation: e.target.value })} className="min-h-[44px]" placeholder="Ex: 25" /></div>
              <div className="space-y-1"><Label>Umidade (%)</Label><Input type="number" value={form.humidity} onChange={(e) => setForm({ ...form, humidity: e.target.value })} className="min-h-[44px]" placeholder="Ex: 65" /></div>
            </div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="Ex: Geada forte pela manhã..." /></div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Switch checked={form.isExtreme} onCheckedChange={(v) => setForm({ ...form, isExtreme: v })} />
              <div>
                <Label className="text-sm font-medium">Evento extremo</Label>
                <p className="text-xs text-muted-foreground">Geada, granizo, seca severa, etc.</p>
              </div>
            </div>
            {form.isExtreme && (
              <div className="space-y-1"><Label>Impacto na fazenda</Label><Textarea value={form.extremeImpact} onChange={(e) => setForm({ ...form, extremeImpact: e.target.value })} placeholder="Ex: Perdeu 30% do pasto do lote 2..." /></div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Shared Quotations Table ────────────────────────────────
function QuotationsTable({ quotations }: { quotations: Quotation[] }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display font-semibold text-foreground">Cotações Registradas</h3>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Praça</TableHead>
          <TableHead className="text-right">Preço/@</TableHead><TableHead>Fonte</TableHead><TableHead>Venda?</TableHead>
        </TableRow></TableHeader>
        <TableBody>{quotations.slice().reverse().slice(0, 30).map((q) => (
          <TableRow key={q.id}>
            <TableCell>{new Date(q.date).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell><Badge variant="secondary">{q.type}</Badge></TableCell>
            <TableCell className="text-sm">{q.region}</TableCell>
            <TableCell className="text-right font-mono font-bold">R$ {q.pricePerArroba.toFixed(2)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{q.source}</TableCell>
            <TableCell>{q.isSale ? <Badge className="bg-primary/10 text-primary border-transparent">Sim</Badge> : "—"}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
export default function Mercado() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Mercado & Clima
          </h1>
          <p className="text-sm text-muted-foreground">Cotações de arroba e bezerros, dados climáticos e análises</p>
        </div>

        <Tabs defaultValue="arroba" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="arroba" className="min-h-[44px] gap-2"><DollarSign className="h-4 w-4" /> Preço da Arroba</TabsTrigger>
            <TabsTrigger value="bezerros" className="min-h-[44px] gap-2"><BarChart3 className="h-4 w-4" /> Bezerros</TabsTrigger>
            <TabsTrigger value="clima" className="min-h-[44px] gap-2"><CloudRain className="h-4 w-4" /> Clima</TabsTrigger>
          </TabsList>

          <TabsContent value="arroba"><TabArroba /></TabsContent>
          <TabsContent value="bezerros"><TabBezerros /></TabsContent>
          <TabsContent value="clima"><TabClima /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
