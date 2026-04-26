import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Sprout, Plus, Leaf, BarChart3, TrendingUp, AlertTriangle, Calendar,
  ShoppingCart, Trash2, Apple, Package,
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
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Types ──────────────────────────────────────────────────
interface CultivationArea { id: string; name: string; mainCulture: string; area: number; areaUnit: string; system: string; farm: string; }
interface CultivationCycle { id: string; areaId: string; culture: string; variety: string; plantingDate: string; expectedHarvest: string; totalCost: number; status: "ativo" | "colhido" | "perdido"; }
interface HarvestRecord { id: string; date: string; areaId: string; culture: string; quantityKg: number; quality: string; destination: string; buyer?: string; pricePerKg?: number; revenue?: number; }
interface LossRecord { id: string; date: string; culture: string; quantityKg: number; reason: string; notes?: string; }

// ── Mock Data ──────────────────────────────────────────────
const cultures = ["Alface", "Tomate", "Mandioca", "Batata", "Melancia", "Manga", "Banana", "Milho", "Feijão", "Abóbora"];
const systems = ["Convencional", "Orgânico", "Hidropônico"];
const qualities = ["Primeira", "Segunda", "Refugo"];
const destinations = ["Venda", "Consumo próprio", "Doação", "Perda"];
const lossReasons = ["Praga", "Doença", "Clima", "Excesso de produção", "Outro"];

const mockAreas: CultivationArea[] = [
  { id: "a1", name: "Horta Principal", mainCulture: "Alface", area: 2, areaUnit: "ha", system: "Orgânico", farm: "Fazenda São José" },
  { id: "a2", name: "Pomar Norte", mainCulture: "Manga", area: 5, areaUnit: "ha", system: "Convencional", farm: "Fazenda São José" },
  { id: "a3", name: "Roça de Mandioca", mainCulture: "Mandioca", area: 3, areaUnit: "ha", system: "Convencional", farm: "Fazenda Boa Vista" },
  { id: "a4", name: "Estufa Tomate", mainCulture: "Tomate", area: 800, areaUnit: "m²", system: "Hidropônico", farm: "Fazenda São José" },
];

const mockCycles: CultivationCycle[] = [
  { id: "c1", areaId: "a1", culture: "Alface", variety: "Crespa", plantingDate: "2026-01-15", expectedHarvest: "2026-03-15", totalCost: 1200, status: "ativo" },
  { id: "c2", areaId: "a2", culture: "Manga", variety: "Tommy Atkins", plantingDate: "2025-08-01", expectedHarvest: "2026-01-15", totalCost: 8500, status: "colhido" },
  { id: "c3", areaId: "a3", culture: "Mandioca", variety: "IAC 576-70", plantingDate: "2025-09-01", expectedHarvest: "2026-06-01", totalCost: 3200, status: "ativo" },
  { id: "c4", areaId: "a4", culture: "Tomate", variety: "Italiano", plantingDate: "2026-02-01", expectedHarvest: "2026-04-15", totalCost: 4800, status: "ativo" },
];

const mockHarvests: HarvestRecord[] = [
  { id: "hr1", date: "2026-01-20", areaId: "a2", culture: "Manga", quantityKg: 3500, quality: "Primeira", destination: "Venda", buyer: "CEASA SP", pricePerKg: 4.5, revenue: 15750 },
  { id: "hr2", date: "2026-02-10", areaId: "a1", culture: "Alface", quantityKg: 200, quality: "Primeira", destination: "Venda", buyer: "Mercado Local", pricePerKg: 8, revenue: 1600 },
  { id: "hr3", date: "2026-02-25", areaId: "a1", culture: "Alface", quantityKg: 150, quality: "Segunda", destination: "Consumo próprio" },
  { id: "hr4", date: "2026-03-01", areaId: "a4", culture: "Tomate", quantityKg: 800, quality: "Primeira", destination: "Venda", buyer: "Restaurante Bom Sabor", pricePerKg: 6, revenue: 4800 },
];

const mockLosses: LossRecord[] = [
  { id: "ls1", date: "2026-02-05", culture: "Alface", quantityKg: 50, reason: "Praga", notes: "Pulgão na estufa 2" },
  { id: "ls2", date: "2026-01-28", culture: "Tomate", quantityKg: 120, reason: "Clima", notes: "Granizo danificou parte da produção" },
];

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
function AgriDashboard({ cycles, harvests, losses }: { cycles: CultivationCycle[]; harvests: HarvestRecord[]; losses: LossRecord[] }) {
  const activeCycles = cycles.filter((c) => c.status === "ativo");
  const totalHarvestKg = harvests.reduce((s, h) => s + h.quantityKg, 0);
  const totalRevenue = harvests.reduce((s, h) => s + (h.revenue || 0), 0);
  const totalLossKg = losses.reduce((s, l) => s + l.quantityKg, 0);

  // Days to harvest
  const today = new Date();
  const daysToHarvest = activeCycles.map((c) => {
    const expected = new Date(c.expectedHarvest);
    const days = Math.max(0, Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    return { ...c, daysLeft: days };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  // Production by culture (bar chart)
  const prodByCulture = useMemo(() => {
    const map = new Map<string, number>();
    harvests.forEach((h) => map.set(h.culture, (map.get(h.culture) || 0) + h.quantityKg));
    return Array.from(map.entries()).map(([culture, kg]) => ({ culture, kg })).sort((a, b) => b.kg - a.kg);
  }, [harvests]);

  // Revenue by culture
  const revByCulture = useMemo(() => {
    const map = new Map<string, number>();
    harvests.filter((h) => h.revenue).forEach((h) => map.set(h.culture, (map.get(h.culture) || 0) + (h.revenue || 0)));
    return Array.from(map.entries()).map(([culture, revenue]) => ({ culture, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [harvests]);

  const colors = ["hsl(142, 50%, 45%)", "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 84%, 60%)"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <Sprout className="h-5 w-5 text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Culturas Ativas</p>
          <p className="text-2xl font-bold text-foreground">{activeCycles.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Package className="h-5 w-5 text-amber-500 mb-1" />
          <p className="text-xs text-muted-foreground">Produção Total</p>
          <p className="text-2xl font-bold text-foreground">{totalHarvestKg.toLocaleString("pt-BR")} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <TrendingUp className="h-5 w-5 text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Receita Gerada</p>
          <p className="text-2xl font-bold text-primary">{fmt(totalRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <AlertTriangle className="h-5 w-5 text-destructive mb-1" />
          <p className="text-xs text-muted-foreground">Perdas</p>
          <p className="text-2xl font-bold text-destructive">{totalLossKg.toLocaleString("pt-BR")} kg</p>
        </CardContent></Card>
      </div>

      {/* Upcoming harvests */}
      {daysToHarvest.length > 0 && (
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Culturas Ativas — Dias para Colheita</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {daysToHarvest.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.culture} — {c.variety}</p>
                  <p className="text-xs text-muted-foreground">Plantio: {new Date(c.plantingDate).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge variant={c.daysLeft <= 7 ? "destructive" : c.daysLeft <= 30 ? "secondary" : "default"}>
                  {c.daysLeft === 0 ? "Hoje!" : `${c.daysLeft} dias`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Production by culture chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Produção por Cultura (kg)</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={prodByCulture}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="culture" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="kg" fill="hsl(142, 50%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receita por Cultura (R$)</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revByCulture}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="culture" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v / 1000}k`} />
                <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [fmt(v), "Receita"]} />
                <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── ÁREAS ────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function AreasTab({ areas, setAreas }: { areas: CultivationArea[]; setAreas: React.Dispatch<React.SetStateAction<CultivationArea[]>> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mainCulture: "", area: "", areaUnit: "ha", system: "Convencional", farm: "" });

  const handleSave = () => {
    if (!form.name || !form.area) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setAreas((prev) => [...prev, { id: `a${Date.now()}`, name: form.name, mainCulture: form.mainCulture, area: Number(form.area), areaUnit: form.areaUnit, system: form.system, farm: form.farm }]);
    setForm({ name: "", mainCulture: "", area: "", areaUnit: "ha", system: "Convencional", farm: "" });
    setOpen(false);
    toast({ title: "Área cadastrada!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Nova Área</Button></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Nome</TableHead><TableHead>Cultura</TableHead><TableHead>Área</TableHead><TableHead>Sistema</TableHead><TableHead>Fazenda</TableHead>
        </TableRow></TableHeader>
        <TableBody>{areas.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell><Badge variant="secondary">{a.mainCulture}</Badge></TableCell>
            <TableCell>{a.area} {a.areaUnit}</TableCell>
            <TableCell><Badge variant="outline">{a.system}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{a.farm}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Área de Cultivo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Nome da Área *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Horta 1" className="min-h-[44px]" /></div>
            <div className="space-y-1"><Label>Cultura Principal</Label>
              <Select value={form.mainCulture} onValueChange={(v) => setForm({ ...form, mainCulture: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{cultures.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1"><Label>Área *</Label><Input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="min-h-[44px]" /></div>
              <div className="space-y-1"><Label>Unidade</Label>
                <Select value={form.areaUnit} onValueChange={(v) => setForm({ ...form, areaUnit: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ha">ha</SelectItem><SelectItem value="m²">m²</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Sistema</Label>
                <Select value={form.system} onValueChange={(v) => setForm({ ...form, system: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{systems.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
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
// ── CICLOS ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function CiclosTab({ cycles, setCycles, areas }: { cycles: CultivationCycle[]; setCycles: React.Dispatch<React.SetStateAction<CultivationCycle[]>>; areas: CultivationArea[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ areaId: "", culture: "", variety: "", plantingDate: undefined as Date | undefined, expectedHarvest: undefined as Date | undefined, totalCost: "" });

  const handleSave = () => {
    if (!form.areaId || !form.culture || !form.plantingDate) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setCycles((prev) => [...prev, { id: `c${Date.now()}`, areaId: form.areaId, culture: form.culture, variety: form.variety, plantingDate: form.plantingDate!.toISOString().slice(0, 10), expectedHarvest: form.expectedHarvest?.toISOString().slice(0, 10) || "", totalCost: Number(form.totalCost) || 0, status: "ativo" }]);
    setForm({ areaId: "", culture: "", variety: "", plantingDate: undefined, expectedHarvest: undefined, totalCost: "" });
    setOpen(false);
    toast({ title: "Ciclo de cultivo cadastrado!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Novo Ciclo</Button></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Área</TableHead><TableHead>Cultura</TableHead><TableHead>Variedade</TableHead><TableHead>Plantio</TableHead><TableHead>Colheita Prevista</TableHead><TableHead className="text-right">Custo</TableHead><TableHead>Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>{cycles.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{areas.find((a) => a.id === c.areaId)?.name || c.areaId}</TableCell>
            <TableCell><Badge variant="secondary">{c.culture}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{c.variety || "—"}</TableCell>
            <TableCell>{new Date(c.plantingDate).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell>{c.expectedHarvest ? new Date(c.expectedHarvest).toLocaleDateString("pt-BR") : "—"}</TableCell>
            <TableCell className="text-right font-mono">{fmt(c.totalCost)}</TableCell>
            <TableCell><Badge variant={c.status === "ativo" ? "default" : c.status === "colhido" ? "secondary" : "destructive"}>{c.status}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Ciclo de Cultivo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Área *</Label>
              <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Cultura *</Label>
                <Select value={form.culture} onValueChange={(v) => setForm({ ...form, culture: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{cultures.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Variedade</Label><Input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} className="min-h-[44px]" placeholder="Ex: Crespa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DatePicker label="Data de Plantio *" value={form.plantingDate} onChange={(d) => setForm({ ...form, plantingDate: d })} />
              <DatePicker label="Colheita Prevista" value={form.expectedHarvest} onChange={(d) => setForm({ ...form, expectedHarvest: d })} />
            </div>
            <div className="space-y-1"><Label>Custo Total (R$)</Label><Input type="number" step="0.01" value={form.totalCost} onChange={(e) => setForm({ ...form, totalCost: e.target.value })} className="min-h-[44px]" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── COLHEITA ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function ColheitaTab({ areas, harvests, setHarvests }: { areas: CultivationArea[]; harvests: HarvestRecord[]; setHarvests: React.Dispatch<React.SetStateAction<HarvestRecord[]>> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: undefined as Date | undefined, areaId: "", culture: "", quantityKg: "", quality: "Primeira", destination: "Venda", buyer: "", pricePerKg: "" });

  const handleSave = () => {
    if (!form.date || !form.areaId || !form.quantityKg) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const qty = Number(form.quantityKg);
    const price = Number(form.pricePerKg) || 0;
    setHarvests((prev) => [...prev, { id: `hr${Date.now()}`, date: form.date!.toISOString().slice(0, 10), areaId: form.areaId, culture: form.culture, quantityKg: qty, quality: form.quality, destination: form.destination, buyer: form.destination === "Venda" ? form.buyer : undefined, pricePerKg: form.destination === "Venda" ? price : undefined, revenue: form.destination === "Venda" ? qty * price : undefined }]);
    setForm({ date: undefined, areaId: "", culture: "", quantityKg: "", quality: "Primeira", destination: "Venda", buyer: "", pricePerKg: "" });
    setOpen(false);
    toast({ title: "Colheita registrada!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Nova Colheita</Button></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Data</TableHead><TableHead>Área</TableHead><TableHead>Cultura</TableHead><TableHead>Kg</TableHead><TableHead>Qualidade</TableHead><TableHead>Destino</TableHead><TableHead>Comprador</TableHead><TableHead className="text-right">Receita</TableHead>
        </TableRow></TableHeader>
        <TableBody>{harvests.slice().reverse().map((h) => (
          <TableRow key={h.id}>
            <TableCell>{new Date(h.date).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell>{areas.find((a) => a.id === h.areaId)?.name || h.areaId}</TableCell>
            <TableCell><Badge variant="secondary">{h.culture}</Badge></TableCell>
            <TableCell className="font-bold">{h.quantityKg.toLocaleString("pt-BR")}</TableCell>
            <TableCell><Badge variant={h.quality === "Primeira" ? "default" : "secondary"}>{h.quality}</Badge></TableCell>
            <TableCell className="text-sm">{h.destination}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{h.buyer || "—"}</TableCell>
            <TableCell className="text-right font-mono font-bold text-primary">{h.revenue ? fmt(h.revenue) : "—"}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Colheita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Área *</Label>
                <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Cultura</Label>
                <Select value={form.culture} onValueChange={(v) => setForm({ ...form, culture: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{cultures.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Quantidade (kg) *</Label><Input type="number" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })} className="min-h-[44px]" /></div>
              <div className="space-y-1"><Label>Qualidade</Label>
                <Select value={form.quality} onValueChange={(v) => setForm({ ...form, quality: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{qualities.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Destino</Label>
                <Select value={form.destination} onValueChange={(v) => setForm({ ...form, destination: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{destinations.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {form.destination === "Venda" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Comprador</Label><Input value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} className="min-h-[44px]" /></div>
                <div className="space-y-1"><Label>Preço/kg (R$)</Label><Input type="number" step="0.01" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })} className="min-h-[44px]" /></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} className="min-h-[44px]">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── PERDAS ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
function PerdasTab({ losses, setLosses }: { losses: LossRecord[]; setLosses: React.Dispatch<React.SetStateAction<LossRecord[]>> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: undefined as Date | undefined, culture: "", quantityKg: "", reason: "Praga", notes: "" });

  const handleSave = () => {
    if (!form.date || !form.culture || !form.quantityKg) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setLosses((prev) => [...prev, { id: `ls${Date.now()}`, date: form.date!.toISOString().slice(0, 10), culture: form.culture, quantityKg: Number(form.quantityKg), reason: form.reason, notes: form.notes || undefined }]);
    setForm({ date: undefined, culture: "", quantityKg: "", reason: "Praga", notes: "" });
    setOpen(false);
    toast({ title: "Perda registrada" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setOpen(true)} variant="destructive" className="gap-2 min-h-[44px]"><Plus className="h-4 w-4" /> Registrar Perda</Button></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow>
          <TableHead>Data</TableHead><TableHead>Cultura</TableHead><TableHead>Kg Perdido</TableHead><TableHead>Motivo</TableHead><TableHead>Observações</TableHead>
        </TableRow></TableHeader>
        <TableBody>{losses.slice().reverse().map((l) => (
          <TableRow key={l.id}>
            <TableCell>{new Date(l.date).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell><Badge variant="secondary">{l.culture}</Badge></TableCell>
            <TableCell className="font-bold text-destructive">{l.quantityKg.toLocaleString("pt-BR")} kg</TableCell>
            <TableCell><Badge variant="destructive">{l.reason}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{l.notes || "—"}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Perda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Cultura *</Label>
                <Select value={form.culture} onValueChange={(v) => setForm({ ...form, culture: v })}><SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{cultures.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Quantidade (kg) *</Label><Input type="number" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })} className="min-h-[44px]" /></div>
            </div>
            <div className="space-y-1"><Label>Motivo</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>{lossReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes da perda..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} variant="destructive" className="min-h-[44px]">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ── MAIN PAGE ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════
export default function Agricultura() {
  const [areas, setAreas] = useState<CultivationArea[]>(mockAreas);
  const [cycles, setCycles] = useState<CultivationCycle[]>(mockCycles);
  const [harvests, setHarvests] = useState<HarvestRecord[]>(mockHarvests);
  const [losses, setLosses] = useState<LossRecord[]>(mockLosses);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Apple className="h-6 w-6 text-primary" /> Agricultura
          </h1>
          <p className="text-sm text-muted-foreground">Frutas, legumes, tubérculos — áreas, ciclos, colheitas e perdas</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="min-h-[44px]">Dashboard</TabsTrigger>
            <TabsTrigger value="areas" className="min-h-[44px]">Áreas</TabsTrigger>
            <TabsTrigger value="ciclos" className="min-h-[44px]">Ciclos</TabsTrigger>
            <TabsTrigger value="colheita" className="min-h-[44px]">Colheita</TabsTrigger>
            <TabsTrigger value="perdas" className="min-h-[44px]">Perdas</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><AgriDashboard cycles={cycles} harvests={harvests} losses={losses} /></TabsContent>
          <TabsContent value="areas"><AreasTab areas={areas} setAreas={setAreas} /></TabsContent>
          <TabsContent value="ciclos"><CiclosTab cycles={cycles} setCycles={setCycles} areas={areas} /></TabsContent>
          <TabsContent value="colheita"><ColheitaTab areas={areas} harvests={harvests} setHarvests={setHarvests} /></TabsContent>
          <TabsContent value="perdas"><PerdasTab losses={losses} setLosses={setLosses} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
