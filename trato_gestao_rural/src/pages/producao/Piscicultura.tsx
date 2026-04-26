import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Fish, Plus, Waves, Droplets, Thermometer, Scale, ShoppingCart,
  Pill, FlaskConical, BarChart3, TrendingUp, AlertTriangle, Calendar,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar,
} from "recharts";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Types ──────────────────────────────────────────────────
interface Tank { id: string; name: string; type: string; volume: number; area: number; farm: string; active: boolean; }
interface FishLot { id: string; tankId: string; species: string; stockingDate: string; quantity: number; avgWeightInitial: number; supplier: string; cost: number; currentAvgWeight: number; }
interface Feeding { id: string; date: string; tankId: string; feedKg: number; feedType: string; cost: number; }
interface Sampling { id: string; date: string; tankId: string; sampleCount: number; avgWeight: number; estimatedTotal: number; }
interface WaterQuality { id: string; date: string; tankId: string; ph: number; oxygen: number; temperature: number; ammonia: number; turbidity: string; }
interface Treatment { id: string; date: string; tankId: string; product: string; dose: string; reason: string; }
interface Harvest { id: string; date: string; tankId: string; quantityKg: number; pricePerKg: number; buyer: string; totalRevenue: number; }

// ── Mock Data ──────────────────────────────────────────────
const mockTanks: Tank[] = [
  { id: "t1", name: "Tanque 1 — Frente", type: "Escavado", volume: 2500, area: 500, farm: "Fazenda São José", active: true },
  { id: "t2", name: "Tanque 2 — Fundo", type: "Escavado", volume: 3000, area: 600, farm: "Fazenda São José", active: true },
  { id: "t3", name: "Viveiro A", type: "Viveiro", volume: 800, area: 200, farm: "Fazenda Boa Vista", active: true },
  { id: "t4", name: "Rede 1", type: "Rede", volume: 150, area: 50, farm: "Fazenda São José", active: false },
];

const mockLots: FishLot[] = [
  { id: "l1", tankId: "t1", species: "Tilápia", stockingDate: "2025-10-15", quantity: 5000, avgWeightInitial: 5, supplier: "Alevinagem São Paulo", cost: 3500, currentAvgWeight: 450 },
  { id: "l2", tankId: "t2", species: "Tambaqui", stockingDate: "2025-11-01", quantity: 3000, avgWeightInitial: 8, supplier: "Peixes do Norte", cost: 4200, currentAvgWeight: 380 },
  { id: "l3", tankId: "t3", species: "Carpa", stockingDate: "2026-01-10", quantity: 2000, avgWeightInitial: 3, supplier: "Alevinagem São Paulo", cost: 1800, currentAvgWeight: 220 },
];

const mockFeedings: Feeding[] = Array.from({ length: 20 }, (_, i) => ({
  id: `f${i}`, date: new Date(2026, 0, 1 + i * 4).toISOString().slice(0, 10),
  tankId: ["t1", "t2", "t3"][i % 3], feedKg: 15 + Math.random() * 20, feedType: "Ração 32% PB",
  cost: 45 + Math.random() * 30,
}));

const mockSamplings: Sampling[] = [
  { id: "s1", date: "2026-01-15", tankId: "t1", sampleCount: 30, avgWeight: 280, estimatedTotal: 1400 },
  { id: "s2", date: "2026-02-01", tankId: "t1", sampleCount: 30, avgWeight: 350, estimatedTotal: 1750 },
  { id: "s3", date: "2026-02-15", tankId: "t1", sampleCount: 30, avgWeight: 400, estimatedTotal: 2000 },
  { id: "s4", date: "2026-03-01", tankId: "t1", sampleCount: 30, avgWeight: 450, estimatedTotal: 2250 },
  { id: "s5", date: "2026-01-20", tankId: "t2", sampleCount: 25, avgWeight: 200, estimatedTotal: 600 },
  { id: "s6", date: "2026-02-10", tankId: "t2", sampleCount: 25, avgWeight: 300, estimatedTotal: 900 },
  { id: "s7", date: "2026-03-01", tankId: "t2", sampleCount: 25, avgWeight: 380, estimatedTotal: 1140 },
];

const mockWaterQuality: WaterQuality[] = Array.from({ length: 12 }, (_, i) => ({
  id: `wq${i}`, date: new Date(2026, 0, 1 + i * 7).toISOString().slice(0, 10),
  tankId: ["t1", "t2", "t3"][i % 3], ph: 6.5 + Math.random() * 1.5,
  oxygen: 4 + Math.random() * 4, temperature: 24 + Math.random() * 6,
  ammonia: Math.random() * 0.5, turbidity: ["Limpa", "Levemente turva", "Turva"][Math.floor(Math.random() * 3)],
}));

const mockHarvests: Harvest[] = [
  { id: "h1", date: "2026-02-20", tankId: "t1", quantityKg: 800, pricePerKg: 18, buyer: "Peixaria Central", totalRevenue: 14400 },
];

// ── Helper DatePicker ──────────────────────────────────────
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

// ══════════════════════════════════════════════════════════
// ── DASHBOARD ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function PiscDashboard({ tanks, lots, samplings, feedings, harvests }: {
  tanks: Tank[]; lots: FishLot[]; samplings: Sampling[]; feedings: Feeding[]; harvests: Harvest[];
}) {
  const activeTanks = tanks.filter((t) => t.active).length;
  const totalFish = lots.reduce((s, l) => s + l.quantity, 0);
  const biomass = lots.reduce((s, l) => s + (l.quantity * l.currentAvgWeight) / 1000, 0);
  const totalFeedCost = feedings.reduce((s, f) => s + f.cost, 0);
  const totalAlevinCost = lots.reduce((s, l) => s + l.cost, 0);
  const totalHarvestKg = harvests.reduce((s, h) => s + h.quantityKg, 0);
  const costPerKg = totalHarvestKg > 0 ? (totalFeedCost + totalAlevinCost) / totalHarvestKg : 0;

  // Weight evolution chart
  const weightChart = useMemo(() => {
    const byTank = new Map<string, { date: string; weight: number }[]>();
    samplings.forEach((s) => {
      if (!byTank.has(s.tankId)) byTank.set(s.tankId, []);
      byTank.get(s.tankId)!.push({ date: s.date, weight: s.avgWeight });
    });
    const dates = [...new Set(samplings.map((s) => s.date))].sort();
    return dates.map((d) => {
      const entry: Record<string, string | number> = { date: d };
      byTank.forEach((data, tankId) => {
        const found = data.find((x) => x.date === d);
        if (found) entry[tanks.find((t) => t.id === tankId)?.name || tankId] = found.weight;
      });
      return entry;
    });
  }, [samplings, tanks]);

  const tankNames = [...new Set(samplings.map((s) => tanks.find((t) => t.id === s.tankId)?.name || s.tankId))];
  const colors = ["hsl(142, 50%, 45%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <Waves className="h-5 w-5 text-blue-500 mb-1" />
          <p className="text-xs text-muted-foreground">Tanques Ativos</p>
          <p className="text-2xl font-bold text-foreground">{activeTanks}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Fish className="h-5 w-5 text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Total de Peixes</p>
          <p className="text-2xl font-bold text-foreground">{totalFish.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Scale className="h-5 w-5 text-amber-500 mb-1" />
          <p className="text-xs text-muted-foreground">Biomassa Total</p>
          <p className="text-2xl font-bold text-foreground">{biomass.toFixed(0)} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <TrendingUp className="h-5 w-5 text-destructive mb-1" />
          <p className="text-xs text-muted-foreground">Custo/kg Produzido</p>
          <p className="text-2xl font-bold text-foreground">{costPerKg > 0 ? fmt(costPerKg) : "—"}</p>
        </CardContent></Card>
      </div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Evolução de Peso por Lote (g)</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}g`} />
              <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend />
              {tankNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── TANQUES ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function TanquesTab({ tanks, setTanks }: { tanks: Tank[]; setTanks: React.Dispatch<React.SetStateAction<Tank[]>> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Escavado", volume: "", area: "", farm: "" });

  const handleSave = () => {
    if (!form.name || !form.volume) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setTanks((prev) => [...prev, { id: `t${Date.now()}`, name: form.name, type: form.type, volume: Number(form.volume), area: Number(form.area) || 0, farm: form.farm, active: true }]);
    setForm({ name: "", type: "Escavado", volume: "", area: "", farm: "" });
    setOpen(false);
    toast({ title: "Tanque cadastrado!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Novo Tanque</Button></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Volume (m³)</TableHead><TableHead>Área (m²)</TableHead><TableHead>Fazenda</TableHead><TableHead>Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>{tanks.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-medium">{t.name}</TableCell>
            <TableCell><Badge variant="secondary">{t.type}</Badge></TableCell>
            <TableCell>{t.volume.toLocaleString("pt-BR")}</TableCell>
            <TableCell>{t.area.toLocaleString("pt-BR")}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{t.farm}</TableCell>
            <TableCell><Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Ativo" : "Inativo"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Tanque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Tanque 1" className="min-h-[44px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Escavado">Escavado</SelectItem><SelectItem value="Rede">Rede</SelectItem><SelectItem value="Viveiro">Viveiro</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Volume (m³) *</Label><Input type="number" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} className="min-h-[44px]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Área (m²)</Label><Input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="min-h-[44px]" /></div>
              <div className="space-y-1"><Label>Fazenda</Label><Input value={form.farm} onChange={(e) => setForm({ ...form, farm: e.target.value })} className="min-h-[44px]" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── LOTES ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function LotesTab({ lots, setLots, tanks }: { lots: FishLot[]; setLots: React.Dispatch<React.SetStateAction<FishLot[]>>; tanks: Tank[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tankId: "", species: "Tilápia", stockingDate: undefined as Date | undefined, quantity: "", avgWeightInitial: "", supplier: "", cost: "" });
  const species = ["Tilápia", "Tambaqui", "Carpa", "Pintado", "Outro"];

  const handleSave = () => {
    if (!form.tankId || !form.quantity || !form.stockingDate) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setLots((prev) => [...prev, { id: `l${Date.now()}`, tankId: form.tankId, species: form.species, stockingDate: form.stockingDate!.toISOString().slice(0, 10), quantity: Number(form.quantity), avgWeightInitial: Number(form.avgWeightInitial) || 0, supplier: form.supplier, cost: Number(form.cost) || 0, currentAvgWeight: Number(form.avgWeightInitial) || 0 }]);
    setForm({ tankId: "", species: "Tilápia", stockingDate: undefined, quantity: "", avgWeightInitial: "", supplier: "", cost: "" });
    setOpen(false);
    toast({ title: "Lote cadastrado!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Novo Lote</Button></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Tanque</TableHead><TableHead>Espécie</TableHead><TableHead>Povoamento</TableHead><TableHead>Qtd</TableHead><TableHead>Peso Inicial</TableHead><TableHead>Peso Atual</TableHead><TableHead>Fornecedor</TableHead><TableHead className="text-right">Custo</TableHead>
        </TableRow></TableHeader>
        <TableBody>{lots.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="font-medium">{tanks.find((t) => t.id === l.tankId)?.name || l.tankId}</TableCell>
            <TableCell><Badge variant="secondary">{l.species}</Badge></TableCell>
            <TableCell>{new Date(l.stockingDate).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell>{l.quantity.toLocaleString("pt-BR")}</TableCell>
            <TableCell>{l.avgWeightInitial}g</TableCell>
            <TableCell className="font-bold">{l.currentAvgWeight}g</TableCell>
            <TableCell className="text-sm text-muted-foreground">{l.supplier}</TableCell>
            <TableCell className="text-right font-mono">{fmt(l.cost)}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Lote de Peixes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tanque *</Label>
                <Select value={form.tankId} onValueChange={(v) => setForm({ ...form, tankId: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{tanks.filter((t) => t.active).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Espécie</Label>
                <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{species.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <DatePicker label="Data de Povoamento *" value={form.stockingDate} onChange={(d) => setForm({ ...form, stockingDate: d })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Quantidade de Alevinos *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="min-h-[44px]" /></div>
              <div className="space-y-1"><Label>Peso Médio Inicial (g)</Label><Input type="number" value={form.avgWeightInitial} onChange={(e) => setForm({ ...form, avgWeightInitial: e.target.value })} className="min-h-[44px]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Fornecedor</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="min-h-[44px]" /></div>
              <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="min-h-[44px]" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MANEJO ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function ManejoTab({ tanks, feedings, samplings, waterQuality, treatments }: {
  tanks: Tank[]; feedings: Feeding[]; samplings: Sampling[]; waterQuality: WaterQuality[]; treatments: Treatment[];
}) {
  const tankName = (id: string) => tanks.find((t) => t.id === id)?.name || id;

  return (
    <div className="space-y-6">
      {/* Feedings */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Alimentação</h3>
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Tanque</TableHead><TableHead>Ração (kg)</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Custo</TableHead>
          </TableRow></TableHeader>
          <TableBody>{feedings.slice().reverse().slice(0, 15).map((f) => (
            <TableRow key={f.id}>
              <TableCell>{new Date(f.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{tankName(f.tankId)}</TableCell>
              <TableCell>{f.feedKg.toFixed(1)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{f.feedType}</TableCell>
              <TableCell className="text-right font-mono">{fmt(f.cost)}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div></CardContent></Card>
      </section>

      {/* Samplings */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Scale className="h-4 w-4 text-amber-500" /> Pesagens Amostrais</h3>
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Tanque</TableHead><TableHead>Amostra</TableHead><TableHead>Peso Médio</TableHead><TableHead>Total Estimado (kg)</TableHead>
          </TableRow></TableHeader>
          <TableBody>{samplings.slice().reverse().map((s) => (
            <TableRow key={s.id}>
              <TableCell>{new Date(s.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{tankName(s.tankId)}</TableCell>
              <TableCell>{s.sampleCount} peixes</TableCell>
              <TableCell className="font-bold">{s.avgWeight}g</TableCell>
              <TableCell>{s.estimatedTotal.toLocaleString("pt-BR")} kg</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div></CardContent></Card>
      </section>

      {/* Water Quality */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /> Qualidade da Água</h3>
        <Card><CardContent className="p-0"><div className="overflow-x-auto">
          <Table><TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead>Tanque</TableHead><TableHead>pH</TableHead><TableHead>O₂ (mg/L)</TableHead><TableHead>Temp °C</TableHead><TableHead>Amônia</TableHead><TableHead>Turbidez</TableHead>
          </TableRow></TableHeader>
          <TableBody>{waterQuality.slice().reverse().slice(0, 10).map((w) => (
            <TableRow key={w.id}>
              <TableCell>{new Date(w.date).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell>{tankName(w.tankId)}</TableCell>
              <TableCell>{w.ph.toFixed(1)}</TableCell>
              <TableCell className={w.oxygen < 4 ? "text-destructive font-bold" : ""}>{w.oxygen.toFixed(1)}</TableCell>
              <TableCell>{w.temperature.toFixed(1)}°</TableCell>
              <TableCell className={w.ammonia > 0.3 ? "text-destructive font-bold" : ""}>{w.ammonia.toFixed(2)}</TableCell>
              <TableCell><Badge variant="secondary">{w.turbidity}</Badge></TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </div></CardContent></Card>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── COLHEITA / VENDA ─────────────────────────────────────
// ══════════════════════════════════════════════════════════
function ColheitaTab({ tanks, harvests, setHarvests }: { tanks: Tank[]; harvests: Harvest[]; setHarvests: React.Dispatch<React.SetStateAction<Harvest[]>> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: undefined as Date | undefined, tankId: "", quantityKg: "", pricePerKg: "", buyer: "" });
  const totalRevenue = harvests.reduce((s, h) => s + h.totalRevenue, 0);

  const handleSave = () => {
    if (!form.date || !form.tankId || !form.quantityKg || !form.pricePerKg) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const qty = Number(form.quantityKg);
    const price = Number(form.pricePerKg);
    setHarvests((prev) => [...prev, { id: `h${Date.now()}`, date: form.date!.toISOString().slice(0, 10), tankId: form.tankId, quantityKg: qty, pricePerKg: price, buyer: form.buyer, totalRevenue: qty * price }]);
    setForm({ date: undefined, tankId: "", quantityKg: "", pricePerKg: "", buyer: "" });
    setOpen(false);
    toast({ title: "Colheita registrada!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Receita total de vendas</p>
          <p className="text-2xl font-bold text-primary">{fmt(totalRevenue)}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Nova Colheita</Button>
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Data</TableHead><TableHead>Tanque</TableHead><TableHead>Kg</TableHead><TableHead>R$/kg</TableHead><TableHead>Comprador</TableHead><TableHead className="text-right">Receita</TableHead>
        </TableRow></TableHeader>
        <TableBody>{harvests.map((h) => (
          <TableRow key={h.id}>
            <TableCell>{new Date(h.date).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell>{tanks.find((t) => t.id === h.tankId)?.name || h.tankId}</TableCell>
            <TableCell className="font-bold">{h.quantityKg.toLocaleString("pt-BR")}</TableCell>
            <TableCell>{fmt(h.pricePerKg)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{h.buyer}</TableCell>
            <TableCell className="text-right font-mono font-bold text-primary">{fmt(h.totalRevenue)}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Colheita / Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            <div className="space-y-1"><Label>Tanque *</Label>
              <Select value={form.tankId} onValueChange={(v) => setForm({ ...form, tankId: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{tanks.filter((t) => t.active).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Quantidade (kg) *</Label><Input type="number" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })} className="min-h-[44px]" /></div>
              <div className="space-y-1"><Label>Preço/kg (R$) *</Label><Input type="number" step="0.01" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} className="min-h-[44px]" /></div>
            </div>
            <div className="space-y-1"><Label>Comprador</Label><Input value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} className="min-h-[44px]" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
export default function Piscicultura() {
  const [tanks, setTanks] = useState<Tank[]>(mockTanks);
  const [lots, setLots] = useState<FishLot[]>(mockLots);
  const [harvests, setHarvests] = useState<Harvest[]>(mockHarvests);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Fish className="h-6 w-6 text-primary" /> Piscicultura
          </h1>
          <p className="text-sm text-muted-foreground">Tanques, lotes, manejo e colheita de peixes</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="min-h-[44px]">Dashboard</TabsTrigger>
            <TabsTrigger value="tanques" className="min-h-[44px]">Tanques</TabsTrigger>
            <TabsTrigger value="lotes" className="min-h-[44px]">Lotes</TabsTrigger>
            <TabsTrigger value="manejo" className="min-h-[44px]">Manejo</TabsTrigger>
            <TabsTrigger value="colheita" className="min-h-[44px]">Colheita</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><PiscDashboard tanks={tanks} lots={lots} samplings={mockSamplings} feedings={mockFeedings} harvests={harvests} /></TabsContent>
          <TabsContent value="tanques"><TanquesTab tanks={tanks} setTanks={setTanks} /></TabsContent>
          <TabsContent value="lotes"><LotesTab lots={lots} setLots={setLots} tanks={tanks} /></TabsContent>
          <TabsContent value="manejo"><ManejoTab tanks={tanks} feedings={mockFeedings} samplings={mockSamplings} waterQuality={mockWaterQuality} treatments={[]} /></TabsContent>
          <TabsContent value="colheita"><ColheitaTab tanks={tanks} harvests={harvests} setHarvests={setHarvests} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
