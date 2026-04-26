import React, { useState, useMemo, useRef } from "react";
import {
  Milk, Search, Plus, Check, Upload, BarChart3, Clock, Users,
  AlertTriangle, TrendingDown, TrendingUp, CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";
import { mockAnimals, paddocks, calcAnimalCategory, categoryLabel } from "@/data/rebanho-mock";
import { mockMilkYields, mockTreatments, type MilkYield } from "@/data/animal-detail-mock";

/* ─── Extended mock data ─── */
function generateExtendedMilk(): MilkYield[] {
  const base = [...mockMilkYields];
  const cows = ["an-1", "an-10"];
  let id = 100;
  for (let d = 6; d <= 30; d++) {
    const day = String(d).padStart(2, "0");
    const date = `2025-03-${day}`;
    for (const cow of cows) {
      const amBase = cow === "an-1" ? 12.5 : 17.5;
      const pmBase = cow === "an-1" ? 8.0 : 14.5;
      base.push({ id: `mx-${id++}`, animal_id: cow, date, shift: "manhã", liters: +(amBase + (Math.random() - 0.5) * 3).toFixed(1), notes: "" });
      base.push({ id: `mx-${id++}`, animal_id: cow, date, shift: "tarde", liters: +(pmBase + (Math.random() - 0.5) * 2).toFixed(1), notes: "" });
    }
  }
  return base;
}

const allMilk = generateExtendedMilk();
const workers = ["João", "Carlos", "Maria", "Pedro", "Ana"];
const TODAY = "2025-03-08";

/* ─── helpers ─── */
function isInWithdrawal(animalId: string): { inWithdrawal: boolean; until: string | null } {
  const treatments = mockTreatments.filter((t) => t.animal_id === animalId && t.withdrawal_days > 0);
  for (const t of treatments) {
    const end = new Date(new Date(t.date).getTime() + t.withdrawal_days * 86400000);
    if (end > new Date()) return { inWithdrawal: true, until: end.toISOString().slice(0, 10) };
  }
  return { inWithdrawal: false, until: null };
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Leite() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Milk className="h-6 w-6 text-primary" /> Produção de Leite
      </h1>
      <Tabs defaultValue="registrar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="registrar" className="text-xs sm:text-sm gap-1"><Plus className="h-3.5 w-3.5 hidden sm:inline" /> Ordenha</TabsTrigger>
          <TabsTrigger value="grupo" className="text-xs sm:text-sm gap-1"><Users className="h-3.5 w-3.5 hidden sm:inline" /> Grupo</TabsTrigger>
          <TabsTrigger value="diaria" className="text-xs sm:text-sm gap-1"><CalendarDays className="h-3.5 w-3.5 hidden sm:inline" /> Diária</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs sm:text-sm gap-1"><Clock className="h-3.5 w-3.5 hidden sm:inline" /> Histórico</TabsTrigger>
          <TabsTrigger value="relatorios" className="text-xs sm:text-sm gap-1"><BarChart3 className="h-3.5 w-3.5 hidden sm:inline" /> Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="registrar"><RegistrarOrdenha /></TabsContent>
        <TabsContent value="grupo"><OrdenhaGrupo /></TabsContent>
        <TabsContent value="diaria"><ProducaoDiaria /></TabsContent>
        <TabsContent value="historico"><HistoricoOrdenhas /></TabsContent>
        <TabsContent value="relatorios"><RelatoriosLeite /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 1 — REGISTRAR ORDENHA
   ═══════════════════════════════════════════════════════════════ */
function RegistrarOrdenha() {
  const lactatingCows = useMemo(() => mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && allMilk.some((m) => m.animal_id === a.id)), []);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [shift, setShift] = useState("manhã");
  const [liters, setLiters] = useState("");
  const [quality, setQuality] = useState("normal");
  const [milkedBy, setMilkedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return lactatingCows.filter((a) => a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, lactatingCows]);

  const selected = useMemo(() => lactatingCows.find((a) => a.id === selectedId), [selectedId, lactatingCows]);
  const withdrawal = useMemo(() => selected ? isInWithdrawal(selected.id) : { inWithdrawal: false, until: null }, [selected]);

  const avg7d = useMemo(() => {
    if (!selected) return 0;
    const recent = allMilk.filter((m) => m.animal_id === selected.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
    return recent.length > 0 ? +(recent.reduce((s, m) => s + m.liters, 0) / (recent.length / 2)).toFixed(1) : 0;
  }, [selected]);

  const daysLactation = useMemo(() => {
    if (!selected) return 0;
    const first = allMilk.filter((m) => m.animal_id === selected.id).sort((a, b) => a.date.localeCompare(b.date))[0];
    return first ? Math.floor((new Date(TODAY).getTime() - new Date(first.date).getTime()) / 86400000) : 0;
  }, [selected]);

  const handleSave = () => {
    if (!selected || !liters) { toast({ title: "Preencha animal e litros", variant: "destructive" }); return; }
    setSaved(true);
    toast({ title: "Ordenha registrada!", description: `${selected.ear_tag}: ${liters}L no turno da ${shift}` });
  };

  const handleNext = () => { setSelectedId(""); setSearch(""); setLiters(""); setNotes(""); setQuality("normal"); setSaved(false); };

  if (saved && selected) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-3">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Check className="h-5 w-5" /> Ordenha Registrada</h3>
          <p className="text-sm">Brinco <strong>{selected.ear_tag}</strong>: <strong>{liters}L</strong> no turno da <strong>{shift}</strong></p>
          {quality === "descartado" && <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300">Leite descartado (carência)</Badge>}
          <Button onClick={handleNext} className="gap-2"><Plus className="h-4 w-4" /> Registrar próxima vaca</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Registrar Ordenha Individual</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Brinco / CPF da vaca</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }} placeholder="Buscar por brinco ou nome..." className="pl-9" />
          </div>
          {search && !selectedId && filtered.length > 0 && (
            <div className="border rounded-md divide-y max-h-48 overflow-auto bg-popover">
              {filtered.map((a) => (
                <button key={a.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between"
                  onClick={() => { setSelectedId(a.id); setSearch(a.ear_tag + " — " + a.name); }}>
                  <span className="font-mono font-semibold text-primary">{a.ear_tag}</span>
                  <span>{a.name}</span>
                  <span className="text-muted-foreground">{a.breed}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">{selected.name[0]}</div>
              <div className="flex-1 text-sm space-y-0.5">
                <p className="font-semibold">{selected.ear_tag} — {selected.name}</p>
                <p className="text-muted-foreground">{selected.breed} • {selected.paddock}</p>
                <p className="text-muted-foreground">{daysLactation} dias em lactação • Média 7d: {avg7d} L/dia</p>
              </div>
            </div>
            {withdrawal.inWithdrawal && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300">⚠️ Vaca em carência até <strong>{withdrawal.until}</strong> — leite não deve entrar no tanque</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1"><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Turno</Label>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manhã">☀️ Manhã</SelectItem>
                <SelectItem value="tarde">🌤️ Tarde</SelectItem>
                <SelectItem value="noite">🌙 Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Litros</Label><Input type="number" step="0.1" value={liters} onChange={(e) => setLiters(e.target.value)} placeholder="0.0" className="font-mono" /></div>
          <div className="space-y-1">
            <Label>Qualidade</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">✅ Normal</SelectItem>
                <SelectItem value="mastite">⚠️ Mastite suspeita</SelectItem>
                <SelectItem value="descartado">🚫 Descartado (carência)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ordenhado por</Label>
            <Select value={milkedBy} onValueChange={setMilkedBy}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!selectedId || !liters} className="gap-2"><Check className="h-4 w-4" /> Salvar Ordenha</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 2 — ORDENHA EM GRUPO
   ═══════════════════════════════════════════════════════════════ */
function OrdenhaGrupo() {
  const [date, setDate] = useState(TODAY);
  const [shift, setShift] = useState("manhã");
  const [paddock, setPaddock] = useState("");
  const [milkedBy, setMilkedBy] = useState("");
  const [cowCount, setCowCount] = useState("");
  const [totalLiters, setTotalLiters] = useState("");
  const [distributeByVaca, setDistributeByVaca] = useState(false);
  const [destination, setDestination] = useState("tanque");
  const [tankNumber, setTankNumber] = useState("");
  const [tankTemp, setTankTemp] = useState("");
  const [individualLiters, setIndividualLiters] = useState<Record<string, string>>({});

  const cowsInPaddock = useMemo(() => {
    if (!paddock) return [];
    return mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && a.paddock === paddock && allMilk.some((m) => m.animal_id === a.id));
  }, [paddock]);

  const handleSave = () => {
    if (!totalLiters) { toast({ title: "Informe o total de litros", variant: "destructive" }); return; }
    toast({ title: "Ordenha em grupo registrada!", description: `${totalLiters}L — ${cowCount || cowsInPaddock.length} vacas` });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Ordenha em Grupo</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Turno</Label>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manhã">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Pasto / Grupo</Label>
            <Select value={paddock} onValueChange={setPaddock}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ordenhador</Label>
            <Select value={milkedBy} onValueChange={setMilkedBy}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Nº de vacas ordenhadas</Label><Input type="number" value={cowCount} onChange={(e) => setCowCount(e.target.value)} placeholder={String(cowsInPaddock.length)} /></div>
          <div className="space-y-1"><Label>Total litros do grupo</Label><Input type="number" step="0.1" value={totalLiters} onChange={(e) => setTotalLiters(e.target.value)} className="font-mono" /></div>
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Switch checked={distributeByVaca} onCheckedChange={setDistributeByVaca} />
          <Label>Distribuir produção por vaca</Label>
        </div>

        {distributeByVaca && cowsInPaddock.length > 0 && (
          <Card className="bg-muted/20">
            <CardContent className="p-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brinco</TableHead><TableHead>Nome</TableHead><TableHead className="text-right w-28">Litros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cowsInPaddock.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-primary font-semibold">{c.ear_tag}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right">
                        <Input type="number" step="0.1" value={individualLiters[c.id] ?? ""} onChange={(e) => setIndividualLiters((prev) => ({ ...prev, [c.id]: e.target.value }))} className="w-24 h-8 text-sm font-mono ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Separator />
        <h4 className="font-semibold text-sm">Destino do Leite</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Destino</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tanque">🥛 Tanque de resfriamento</SelectItem>
                <SelectItem value="consumo">🏠 Consumo próprio</SelectItem>
                <SelectItem value="bezerros">🐄 Bezerros (aleitamento)</SelectItem>
                <SelectItem value="descartado">🚫 Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {destination === "tanque" && (
            <>
              <div className="space-y-1"><Label>Nº do tanque</Label><Input value={tankNumber} onChange={(e) => setTankNumber(e.target.value)} placeholder="Tanque 1" /></div>
              <div className="space-y-1"><Label>Temperatura (°C)</Label><Input type="number" step="0.1" value={tankTemp} onChange={(e) => setTankTemp(e.target.value)} placeholder="4.0" /></div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!totalLiters} className="gap-2"><Check className="h-4 w-4" /> Registrar Grupo</Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 3 — PRODUÇÃO DIÁRIA
   ═══════════════════════════════════════════════════════════════ */
function ProducaoDiaria() {
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const lactatingCows = useMemo(() => mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && allMilk.some((m) => m.animal_id === a.id)), []);

  const dayYields = useMemo(() => allMilk.filter((m) => m.date === selectedDate), [selectedDate]);
  const totalManha = dayYields.filter((m) => m.shift === "manhã").reduce((s, m) => s + m.liters, 0);
  const totalTarde = dayYields.filter((m) => m.shift === "tarde").reduce((s, m) => s + m.liters, 0);
  const totalGeral = dayYields.reduce((s, m) => s + m.liters, 0);
  const cowsMilked = new Set(dayYields.map((m) => m.animal_id)).size;
  const avgPerCow = cowsMilked > 0 ? totalGeral / cowsMilked : 0;

  // Previous day comparison
  const prevDate = new Date(new Date(selectedDate).getTime() - 86400000).toISOString().slice(0, 10);
  const prevTotal = allMilk.filter((m) => m.date === prevDate).reduce((s, m) => s + m.liters, 0);
  const diff = totalGeral - prevTotal;

  // Per-cow table
  const cowData = useMemo(() => {
    return lactatingCows.map((cow) => {
      const yields = dayYields.filter((m) => m.animal_id === cow.id);
      const manha = yields.filter((m) => m.shift === "manhã").reduce((s, m) => s + m.liters, 0);
      const tarde = yields.filter((m) => m.shift === "tarde").reduce((s, m) => s + m.liters, 0);
      const total = manha + tarde;
      const milked = yields.length > 0;
      // Average of last 7 days
      const recent = allMilk.filter((m) => m.animal_id === cow.id && m.date <= selectedDate).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
      const recentDays = new Set(recent.map((m) => m.date)).size;
      const recentAvg = recentDays > 0 ? recent.reduce((s, m) => s + m.liters, 0) / recentDays : 0;
      const drop = milked && recentAvg > 0 && total < recentAvg * 0.7;
      const firstMilk = allMilk.filter((m) => m.animal_id === cow.id).sort((a, b) => a.date.localeCompare(b.date))[0];
      const daysLact = firstMilk ? Math.floor((new Date(selectedDate).getTime() - new Date(firstMilk.date).getTime()) / 86400000) : 0;
      return { id: cow.id, ear_tag: cow.ear_tag, name: cow.name, manha, tarde, total, milked, drop, daysLact, notes: yields.map((y) => y.notes).filter(Boolean).join("; ") };
    }).sort((a, b) => b.total - a.total);
  }, [lactatingCows, dayYields, selectedDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label>Data:</Label>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-44" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">☀️ Manhã</p>
          <p className="text-xl font-bold font-mono">{totalManha.toFixed(1)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">🌤️ Tarde</p>
          <p className="text-xl font-bold font-mono">{totalTarde.toFixed(1)} L</p>
        </CardContent></Card>
        <Card className="border-primary/30"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Geral</p>
          <p className="text-2xl font-bold text-primary font-mono">{totalGeral.toFixed(1)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Vacas Ordenhadas</p>
          <p className="text-xl font-bold">{cowsMilked}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Média/Vaca</p>
          <p className="text-xl font-bold font-mono">{avgPerCow.toFixed(1)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">vs Dia Anterior</p>
          <p className={`text-xl font-bold font-mono flex items-center justify-center gap-1 ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : ""}`}>
            {diff > 0 ? <TrendingUp className="h-4 w-4" /> : diff < 0 ? <TrendingDown className="h-4 w-4" /> : null}
            {diff > 0 ? "+" : ""}{diff.toFixed(1)} L
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                <TableHead className="text-right">Manhã (L)</TableHead>
                <TableHead className="text-right">Tarde (L)</TableHead>
                <TableHead className="text-right">Total (L)</TableHead>
                <TableHead className="text-right">Dias Lact.</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cowData.map((c) => (
                <TableRow key={c.id} className={
                  !c.milked ? "opacity-40" :
                  c.drop ? "bg-red-50 dark:bg-red-950/10" :
                  c.total > avgPerCow ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""
                }>
                  <TableCell className="font-mono font-semibold text-primary">{c.ear_tag}</TableCell>
                  <TableCell>
                    {c.name}
                    {c.drop && <Badge variant="outline" className="ml-2 text-[10px] bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300">⬇️ Queda</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{c.manha > 0 ? c.manha.toFixed(1) : "—"}</TableCell>
                  <TableCell className="text-right font-mono">{c.tarde > 0 ? c.tarde.toFixed(1) : "—"}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{c.milked ? c.total.toFixed(1) : "—"}</TableCell>
                  <TableCell className="text-right text-sm">{c.daysLact}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 4 — HISTÓRICO DE ORDENHAS
   ═══════════════════════════════════════════════════════════════ */
function HistoricoOrdenhas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const enriched = useMemo(() => {
    return [...allMilk].sort((a, b) => b.date.localeCompare(a.date)).map((m) => {
      const animal = mockAnimals.find((a2) => a2.id === m.animal_id);
      return { ...m, animal };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((m) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!m.animal?.ear_tag.toLowerCase().includes(q) && !m.animal?.name.toLowerCase().includes(q)) return false;
      }
      if (shiftFilter !== "all" && m.shift !== shiftFilter) return false;
      if (periodFrom && m.date < periodFrom) return false;
      if (periodTo && m.date > periodTo) return false;
      return true;
    });
  }, [enriched, searchTerm, shiftFilter, periodFrom, periodTo]);

  const totalPeriod = filtered.reduce((s, m) => s + m.liters, 0);
  const daysCount = new Set(filtered.map((m) => m.date)).size;
  const dailyAvg = daysCount > 0 ? totalPeriod / daysCount : 0;

  // Best/worst day
  const dayTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((m) => { map[m.date] = (map[m.date] || 0) + m.liters; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const bestDay = dayTotals[0];
  const worstDay = dayTotals[dayTotals.length - 1];

  // Best/worst cow
  const cowTotals = useMemo(() => {
    const map: Record<string, { total: number; tag: string; name: string }> = {};
    filtered.forEach((m) => {
      if (!m.animal) return;
      if (!map[m.animal.id]) map[m.animal.id] = { total: 0, tag: m.animal.ear_tag, name: m.animal.name };
      map[m.animal.id].total += m.liters;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Período</p>
          <p className="text-xl font-bold text-primary font-mono">{totalPeriod.toFixed(0)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Média Diária</p>
          <p className="text-xl font-bold font-mono">{dailyAvg.toFixed(1)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Melhor Dia</p>
          <p className="text-sm font-bold">{bestDay?.[0]?.slice(5) ?? "—"}</p>
          <p className="text-xs font-mono">{bestDay?.[1]?.toFixed(1) ?? 0} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Pior Dia</p>
          <p className="text-sm font-bold">{worstDay?.[0]?.slice(5) ?? "—"}</p>
          <p className="text-xs font-mono">{worstDay?.[1]?.toFixed(1) ?? 0} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Mais Produtiva</p>
          <p className="text-sm font-bold">{cowTotals[0]?.tag ?? "—"}</p>
          <p className="text-xs font-mono text-emerald-600">{cowTotals[0]?.total.toFixed(0) ?? 0} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Menos Produtiva</p>
          <p className="text-sm font-bold">{cowTotals[cowTotals.length - 1]?.tag ?? "—"}</p>
          <p className="text-xs font-mono">{cowTotals[cowTotals.length - 1]?.total.toFixed(0) ?? 0} L</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Buscar</Label>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Brinco ou nome" className="w-40 h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Turno</Label>
          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-28 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="manhã">Manhã</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="w-36 h-9 text-sm" /></div>
        <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="w-36 h-9 text-sm" /></div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                <TableHead>Turno</TableHead><TableHead className="text-right">Litros</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{m.date}</TableCell>
                  <TableCell className="font-mono font-semibold text-primary">{m.animal?.ear_tag}</TableCell>
                  <TableCell>{m.animal?.name}</TableCell>
                  <TableCell className="capitalize text-sm">{m.shift}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{m.liters.toFixed(1)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.notes || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 100 && <p className="text-xs text-muted-foreground text-center py-2">Exibindo primeiros 100 de {filtered.length} registros</p>}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 5 — RELATÓRIOS
   ═══════════════════════════════════════════════════════════════ */
function RelatoriosLeite() {
  const [subTab, setSubTab] = useState<"mensal" | "vaca" | "curva" | "descartado" | "receita">("mensal");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "mensal", label: "Produção Mensal" },
          { key: "vaca", label: "Por Vaca" },
          { key: "curva", label: "Curva de Lactação" },
          { key: "descartado", label: "Leite Descartado" },
          { key: "receita", label: "Receita" },
        ] as const).map((t) => (
          <Button key={t.key} variant={subTab === t.key ? "default" : "outline"} size="sm" onClick={() => setSubTab(t.key)}>{t.label}</Button>
        ))}
      </div>

      {subTab === "mensal" && <RelMensal />}
      {subTab === "vaca" && <RelPorVaca />}
      {subTab === "curva" && <RelCurvaLactacao />}
      {subTab === "descartado" && <RelDescartado />}
      {subTab === "receita" && <RelReceita />}
    </div>
  );
}

function RelMensal() {
  const currentMonth = "2025-03";
  const monthYields = allMilk.filter((m) => m.date.startsWith(currentMonth));
  const monthTotal = monthYields.reduce((s, m) => s + m.liters, 0);
  const daysCount = new Set(monthYields.map((m) => m.date)).size;

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    monthYields.forEach((m) => { map.set(m.date, (map.get(m.date) || 0) + m.liters); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, liters]) => ({ date: date.slice(8), liters: +liters.toFixed(1) }));
  }, [monthYields]);

  const monthlyComp = [
    { month: "Out", liters: 1850 }, { month: "Nov", liters: 1920 }, { month: "Dez", liters: 2050 },
    { month: "Jan", liters: 1980 }, { month: "Fev", liters: 1890 }, { month: "Mar", liters: +monthTotal.toFixed(0) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Mensal</p>
          <p className="text-2xl font-bold text-primary font-mono">{monthTotal.toFixed(0)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Média Diária</p>
          <p className="text-2xl font-bold font-mono">{(daysCount > 0 ? monthTotal / daysCount : 0).toFixed(1)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Dias c/ Registro</p>
          <p className="text-2xl font-bold">{daysCount}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Produção Diária — Março/2025</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <RTooltip />
              <Bar dataKey="liters" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Litros" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Comparativo Mensal</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyComp}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <RTooltip />
              <Bar dataKey="liters" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Litros" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function RelPorVaca() {
  const lactatingCows = useMemo(() => mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && allMilk.some((m) => m.animal_id === a.id)), []);

  const data = useMemo(() => {
    return lactatingCows.map((cow) => {
      const yields = allMilk.filter((m) => m.animal_id === cow.id);
      const total = yields.reduce((s, m) => s + m.liters, 0);
      const days = new Set(yields.map((m) => m.date)).size;
      const avg = days > 0 ? total / days : 0;
      const firstMilk = yields.sort((a, b) => a.date.localeCompare(b.date))[0];
      const daysLact = firstMilk ? Math.floor((new Date(TODAY).getTime() - new Date(firstMilk.date).getTime()) / 86400000) : 0;
      return { ear_tag: cow.ear_tag, name: cow.name, total: +total.toFixed(1), avg: +avg.toFixed(1), daysLact };
    }).sort((a, b) => b.total - a.total);
  }, [lactatingCows]);

  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
              <TableHead className="text-right">Total (L)</TableHead>
              <TableHead className="text-right">Média/dia (L)</TableHead>
              <TableHead className="text-right">Dias Lact.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.ear_tag}>
                <TableCell className="font-mono text-primary font-semibold">{d.ear_tag}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{d.total}</TableCell>
                <TableCell className="text-right font-mono">{d.avg}</TableCell>
                <TableCell className="text-right">{d.daysLact}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RelCurvaLactacao() {
  const lactatingCows = useMemo(() => mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && allMilk.some((m) => m.animal_id === a.id)), []);
  const [selectedCow, setSelectedCow] = useState(lactatingCows[0]?.id ?? "");

  const chartData = useMemo(() => {
    const yields = allMilk.filter((m) => m.animal_id === selectedCow).sort((a, b) => a.date.localeCompare(b.date));
    const byDay: Record<string, number> = {};
    yields.forEach((m) => { byDay[m.date] = (byDay[m.date] || 0) + m.liters; });
    return Object.entries(byDay).map(([date, liters]) => ({ date: date.slice(5), liters: +liters.toFixed(1) }));
  }, [selectedCow]);

  return (
    <div className="space-y-4">
      <Select value={selectedCow} onValueChange={setSelectedCow}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Selecionar vaca" /></SelectTrigger>
        <SelectContent>
          {lactatingCows.map((c) => <SelectItem key={c.id} value={c.id}>{c.ear_tag} — {c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Curva de Lactação</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <RTooltip />
              <Line type="monotone" dataKey="liters" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Litros/dia" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function RelDescartado() {
  const precoLitro = 2.80;
  // Mock discarded data
  const discardedData = [
    { date: "2025-03-02", ear_tag: "BR001", name: "Estrela", liters: 20.5, reason: "Carência — Oxitetraciclina" },
    { date: "2025-03-03", ear_tag: "BR001", name: "Estrela", liters: 21.2, reason: "Carência — Oxitetraciclina" },
    { date: "2025-03-10", ear_tag: "BR010", name: "Boneca", liters: 12.0, reason: "Mastite suspeita" },
  ];
  const totalDiscarded = discardedData.reduce((s, d) => s + d.liters, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Descartado</p>
          <p className="text-2xl font-bold text-red-600 font-mono">{totalDiscarded.toFixed(1)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Impacto Financeiro</p>
          <p className="text-2xl font-bold text-red-600 font-mono">R$ {(totalDiscarded * precoLitro).toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Ocorrências</p>
          <p className="text-2xl font-bold">{discardedData.length}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                <TableHead className="text-right">Litros</TableHead><TableHead>Motivo</TableHead>
                <TableHead className="text-right">Perda (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discardedData.map((d, i) => (
                <TableRow key={i}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell className="font-mono text-primary font-semibold">{d.ear_tag}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell className="text-right font-mono">{d.liters.toFixed(1)}</TableCell>
                  <TableCell className="text-sm">{d.reason}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">R$ {(d.liters * precoLitro).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RelReceita() {
  const precoLitro = 2.80;
  const monthYields = allMilk.filter((m) => m.date.startsWith("2025-03"));
  const monthTotal = monthYields.reduce((s, m) => s + m.liters, 0);

  const monthlyRevenue = [
    { month: "Out", litros: 1850, receita: 1850 * 2.60 },
    { month: "Nov", litros: 1920, receita: 1920 * 2.65 },
    { month: "Dez", litros: 2050, receita: 2050 * 2.70 },
    { month: "Jan", litros: 1980, receita: 1980 * 2.75 },
    { month: "Fev", litros: 1890, receita: 1890 * 2.78 },
    { month: "Mar", litros: +monthTotal.toFixed(0), receita: +(monthTotal * precoLitro).toFixed(0) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Produção Março</p>
          <p className="text-2xl font-bold font-mono">{monthTotal.toFixed(0)} L</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Preço Médio/Litro</p>
          <p className="text-2xl font-bold font-mono">R$ {precoLitro.toFixed(2)}</p>
        </CardContent></Card>
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Receita Estimada</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">R$ {(monthTotal * precoLitro).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Mensal</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <RTooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
