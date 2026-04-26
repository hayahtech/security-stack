import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Weight, Search, Upload, Check, ChevronRight, AlertTriangle, Plus,
  Calendar, User, Filter, BarChart3, TrendingUp, TrendingDown,
  FileText, Download, Edit2, Trash2, Star, ArrowLeft, Radio, Play, Square,
  Settings2, Maximize2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { mockAnimals, paddocks, calcAnimalCategory, categoryLabel, categoryColor } from "@/data/rebanho-mock";
import { mockWeighings, type Weighing } from "@/data/animal-detail-mock";
import { classifyGmd, gmdClassLabels, gmdClassColors, type GmdClassification } from "@/data/gmd-utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import {
  subscribeDeviceEvents, startSimulation, stopSimulation,
  mockReaders, mockScales,
  type DeviceEvent,
} from "@/data/devices-mock";
import ModoBrete from "@/components/ModoBrete";
import { useDevices } from "@/contexts/DeviceContext";

/* ─── helpers ─── */
const ARROBA_KG_DEFAULT = 15;

function lastWeighing(animalId: string) {
  return mockWeighings
    .filter((w) => w.animal_id === animalId)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function calcGmdBetween(w1: Weighing, w2: Weighing) {
  const days = Math.round(
    (new Date(w2.date).getTime() - new Date(w1.date).getTime()) / 86400000,
  );
  if (days <= 0) return null;
  return { gmd: Number(((w2.weight_kg - w1.weight_kg) / days).toFixed(3)), days };
}

const workers = ["João", "Carlos", "Maria", "Pedro", "Ana"];
const weighMethods = [
  { value: "balança_eletronica", label: "Balança eletrônica" },
  { value: "balança_mecanica", label: "Balança mecânica" },
  { value: "fita", label: "Fita de pesagem" },
  { value: "visual", label: "Visual (estimativa)" },
  { value: "outro", label: "Outro" },
];
const activities = ["Aração", "Gradagem", "Plantio", "Pulverização", "Colheita", "Transporte", "Roçagem"];

/* ═══════════════════════════════════════════════════════════════ */
export default function Pesagens() {
  const [showBrete, setShowBrete] = useState(false);
  const { readers } = useDevices();
  const hasDevices = readers.some((r) => r.active);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Weight className="h-6 w-6 text-primary" /> Pesagens
        </h1>
        {hasDevices && (
          <Button onClick={() => setShowBrete(true)} className="gap-2">
            <Maximize2 className="h-4 w-4" /> Modo Brete
          </Button>
        )}
      </div>

      <Tabs defaultValue="nova" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="nova" className="gap-1 text-xs sm:text-sm"><Plus className="h-3.5 w-3.5 hidden sm:inline" /> Nova</TabsTrigger>
          <TabsTrigger value="automatizado" className="gap-1 text-xs sm:text-sm"><Radio className="h-3.5 w-3.5 hidden sm:inline" /> Automatizado</TabsTrigger>
          <TabsTrigger value="lote" className="gap-1 text-xs sm:text-sm"><Weight className="h-3.5 w-3.5 hidden sm:inline" /> Lote</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1 text-xs sm:text-sm"><FileText className="h-3.5 w-3.5 hidden sm:inline" /> Histórico</TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1 text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5 hidden sm:inline" /> Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="nova"><NovaPesagem /></TabsContent>
        <TabsContent value="automatizado"><PesagemAutomatizada /></TabsContent>
        <TabsContent value="lote"><PesagemLoteTab /></TabsContent>
        <TabsContent value="historico"><HistoricoTab /></TabsContent>
        <TabsContent value="relatorios"><RelatoriosTab /></TabsContent>
      </Tabs>

      {showBrete && <ModoBrete onClose={() => setShowBrete(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA AUTOMATIZADO — PESAGEM COM LEITOR RFID + BALANÇA
   ═══════════════════════════════════════════════════════════════ */
interface AutoWeighRecord {
  earTag: string;
  animalName: string;
  weight: number;
  previousWeight: number | null;
  gmd: number | null;
  timestamp: Date;
  confirmed: boolean;
}

function PesagemAutomatizada() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [records, setRecords] = useState<AutoWeighRecord[]>([]);
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [waitingWeight, setWaitingWeight] = useState(false);
  const [weighedBy, setWeighedBy] = useState("");
  const [paddock, setPaddock] = useState("");

  const activeReaders = mockReaders.filter(r => r.active);
  const activeScales = mockScales.filter(s => s.active);

  useEffect(() => {
    const unsub = subscribeDeviceEvents((event: DeviceEvent) => {
      if (!running) return;

      if (event.type === "rfid_read") {
        const tag = event.value;
        const animal = mockAnimals.find(a => a.ear_tag === tag);
        setCurrentTag(tag);
        setCurrentWeight(null);
        setWaitingWeight(true);
        if (animal) {
          toast({ title: `🏷️ ${tag} — ${animal.name}`, description: "Aguardando peso estabilizar..." });
        } else {
          toast({ title: `🏷️ ${tag}`, description: "Animal não cadastrado — aguardando peso..." });
        }
      }

      if (event.type === "weight_stable" && currentTag) {
        const weight = parseFloat(event.value);
        setCurrentWeight(weight);
        setWaitingWeight(false);

        const animal = mockAnimals.find(a => a.ear_tag === currentTag);
        const prev = animal ? lastWeighing(animal.id) : null;
        const gmdVal = prev && animal ? (() => {
          const days = Math.round((Date.now() - new Date(prev.date).getTime()) / 86400000);
          return days > 0 ? +((weight - prev.weight_kg) / days).toFixed(3) : null;
        })() : null;

        const record: AutoWeighRecord = {
          earTag: currentTag,
          animalName: animal?.name || "Desconhecido",
          weight,
          previousWeight: prev?.weight_kg || null,
          gmd: gmdVal,
          timestamp: new Date(),
          confirmed: true,
        };

        setRecords(prev => [record, ...prev]);
        toast({ title: `⚖️ ${weight} kg registrado`, description: `${currentTag} — ${animal?.name || ""}` });
        setCurrentTag(null);
        setCurrentWeight(null);
      }
    });

    return unsub;
  }, [running, currentTag]);

  const handleStart = () => {
    if (activeReaders.length === 0 || activeScales.length === 0) {
      toast({ title: "Configure dispositivos primeiro", description: "Vá em Configurações > Leitores & Balança", variant: "destructive" });
      return;
    }
    startSimulation();
    setRunning(true);
    toast({ title: "▶ Modo automatizado iniciado", description: "Passe os animais pelo brete..." });
  };

  const handleStop = () => {
    stopSimulation();
    setRunning(false);
    toast({ title: "⏹ Modo automatizado parado" });
  };

  const totalAnimals = records.length;
  const avgWeight = totalAnimals > 0 ? +(records.reduce((s, r) => s + r.weight, 0) / totalAnimals).toFixed(1) : 0;
  const avgGmd = (() => {
    const withGmd = records.filter(r => r.gmd !== null);
    return withGmd.length > 0 ? +(withGmd.reduce((s, r) => s + (r.gmd || 0), 0) / withGmd.length).toFixed(3) : null;
  })();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" /> Pesagem Automatizada
              </h3>
              <p className="text-xs text-muted-foreground">
                {activeReaders.length} leitor(es) e {activeScales.length} balança(s) configurados.
                {activeReaders.length === 0 && (
                  <Button variant="link" size="sm" className="h-auto p-0 ml-1 text-xs" onClick={() => navigate("/configuracoes/leitores-balanca")}>
                    Configurar dispositivos →
                  </Button>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1 min-w-[120px]">
                <Label className="text-xs">Responsável</Label>
                <Select value={weighedBy} onValueChange={setWeighedBy}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{workers.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[120px]">
                <Label className="text-xs">Pasto/Lote</Label>
                <Select value={paddock} onValueChange={setPaddock}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{paddocks.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {!running ? (
                <Button onClick={handleStart} className="gap-2 mt-5">
                  <Play className="h-4 w-4" /> Iniciar
                </Button>
              ) : (
                <Button onClick={handleStop} variant="destructive" className="gap-2 mt-5">
                  <Square className="h-4 w-4" /> Parar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live status */}
      {running && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                </span>
                <span className="text-sm font-medium">Aguardando leitura RFID...</span>
              </div>
              {currentTag && (
                <div className="text-right">
                  <p className="font-mono font-bold text-primary">{currentTag}</p>
                  {waitingWeight ? (
                    <p className="text-xs text-muted-foreground animate-pulse">Estabilizando peso...</p>
                  ) : currentWeight ? (
                    <p className="text-lg font-bold">{currentWeight} kg</p>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{totalAnimals}</p>
              <p className="text-xs text-muted-foreground">Animais pesados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{avgWeight} kg</p>
              <p className="text-xs text-muted-foreground">Peso médio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{avgGmd !== null ? `${avgGmd} kg/dia` : "—"}</p>
              <p className="text-xs text-muted-foreground">GMD médio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Records table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesagens Registradas ({records.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Brinco</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right">Peso Anterior</TableHead>
                <TableHead className="text-right">GMD</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {running ? "Aguardando primeira leitura..." : "Inicie o modo automatizado para registrar pesagens"}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{r.timestamp.toLocaleTimeString("pt-BR")}</TableCell>
                    <TableCell className="font-mono font-semibold text-primary">{r.earTag}</TableCell>
                    <TableCell>{r.animalName}</TableCell>
                    <TableCell className="text-right font-bold">{r.weight}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.previousWeight || "—"}</TableCell>
                    <TableCell className="text-right">
                      {r.gmd !== null ? (
                        <span className={r.gmd >= 0 ? "text-emerald-600" : "text-red-600"}>{r.gmd} kg/d</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <Check className="h-3 w-3 mr-0.5" /> OK
                      </Badge>
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

function NovaPesagem() {
  const activeAnimals = useMemo(() => mockAnimals.filter((a) => a.current_status === "ativo"), []);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [weightKg, setWeightKg] = useState("");
  const [arrobaKg, setArrobaKg] = useState(ARROBA_KG_DEFAULT);
  const [method, setMethod] = useState("balança_eletronica");
  const [scale, setScale] = useState("");
  const [weighedBy, setWeighedBy] = useState("");
  const [paddock, setPaddock] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ weightKg: number; arroba: number; variation: number | null; days: number | null; gmd: number | null } | null>(null);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return activeAnimals.filter((a) =>
      a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [search, activeAnimals]);

  const selected = useMemo(() => activeAnimals.find((a) => a.id === selectedId), [selectedId, activeAnimals]);
  const lastW = useMemo(() => selected ? lastWeighing(selected.id) : null, [selected]);
  const weightArroba = weightKg ? (parseFloat(weightKg) / arrobaKg).toFixed(2) : "";

  const handleSave = () => {
    if (!selected || !weightKg) { toast({ title: "Preencha animal e peso", variant: "destructive" }); return; }
    const wkg = parseFloat(weightKg);
    let variation: number | null = null;
    let days: number | null = null;
    let gmd: number | null = null;
    if (lastW) {
      variation = wkg - lastW.weight_kg;
      days = Math.round((new Date(date).getTime() - new Date(lastW.date).getTime()) / 86400000);
      if (days > 0) gmd = Number((variation / days).toFixed(3));
    }
    setResult({ weightKg: wkg, arroba: wkg / arrobaKg, variation, days, gmd });
    toast({ title: "Pesagem salva!", description: `${selected.ear_tag} — ${wkg} kg` });
  };

  const handleNext = () => {
    setSelectedId("");
    setSearch("");
    setWeightKg("");
    setScale("");
    setPaddock("");
    setNotes("");
    setIsOfficial(false);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {result ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Check className="h-5 w-5" /> Pesagem Registrada</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Animal</p><p className="font-semibold">{selected?.ear_tag} — {selected?.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Peso</p><p className="font-semibold font-mono">{result.weightKg} kg ({result.arroba.toFixed(1)} @)</p></div>
              <div><p className="text-xs text-muted-foreground">Variação</p>
                {result.variation !== null ? (
                  <p className={`font-semibold font-mono ${result.variation > 0 ? "text-emerald-600" : result.variation < 0 ? "text-red-600" : ""}`}>
                    {result.variation > 0 ? "+" : ""}{result.variation.toFixed(1)} kg em {result.days} dias
                  </p>
                ) : <p className="text-muted-foreground">Primeira pesagem</p>}
              </div>
              <div><p className="text-xs text-muted-foreground">GMD</p>
                {result.gmd !== null ? (
                  <p className="font-semibold font-mono">{result.gmd} kg/dia</p>
                ) : <p className="text-muted-foreground">—</p>}
              </div>
            </div>
            <Button onClick={handleNext} className="gap-2"><Plus className="h-4 w-4" /> Pesar próximo animal</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-lg">Nova Pesagem Individual</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Animal search */}
            <div className="space-y-2">
              <Label>Animal (busca por brinco ou nome)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }}
                  placeholder="Digite o brinco ou nome..."
                  className="pl-9"
                />
              </div>
              {search && !selectedId && filtered.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-auto bg-popover">
                  {filtered.map((a) => (
                    <button key={a.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between"
                      onClick={() => { setSelectedId(a.id); setSearch(a.ear_tag + " — " + a.name); setPaddock(a.paddock); }}>
                      <span className="font-mono font-semibold text-primary">{a.ear_tag}</span>
                      <span>{a.name}</span>
                      <span className="text-muted-foreground">{a.breed}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected animal card */}
            {selected && (
              <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">
                  {selected.name[0]}
                </div>
                <div className="flex-1 text-sm space-y-0.5">
                  <p className="font-semibold">{selected.ear_tag} — {selected.name}</p>
                  <p className="text-muted-foreground">{selected.breed} • {selected.paddock}</p>
                  {lastW && <p className="text-muted-foreground">Última pesagem: {lastW.weight_kg} kg em {lastW.date}</p>}
                </div>
                <Badge variant="outline" className={categoryColor[calcAnimalCategory(selected)]}>
                  {categoryLabel[calcAnimalCategory(selected)]}
                </Badge>
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Hora</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Peso (kg)</Label>
                <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="0" className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label>Peso em arrobas (@)</Label>
                <Input readOnly value={weightArroba} className="font-mono bg-muted" />
              </div>
              <div className="space-y-1">
                <Label>Peso da arroba (kg)</Label>
                <Input type="number" value={arrobaKg} onChange={(e) => setArrobaKg(Number(e.target.value) || 15)} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label>Método</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {weighMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Balança</Label>
                <Input value={scale} onChange={(e) => setScale(e.target.value)} placeholder="ID ou nome da balança" />
              </div>
              <div className="space-y-1">
                <Label>Pesado por</Label>
                <Select value={weighedBy} onValueChange={setWeighedBy}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Pasto / Paddock</Label>
                <Select value={paddock} onValueChange={setPaddock}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isOfficial} onCheckedChange={setIsOfficial} />
              <Label className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" /> Pesagem oficial
              </Label>
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas opcionais..." />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!selectedId || !weightKg} className="gap-2">
                <Check className="h-4 w-4" /> Salvar Pesagem
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 2 — PESAGEM EM LOTE
   ═══════════════════════════════════════════════════════════════ */
type LoteRow = {
  animal_id: string; ear_tag: string; name: string; breed: string; category: string;
  last_weight: number; last_date: string; new_weight: string; variation: number | null; gmd: number | null;
};

function PesagemLoteTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paddock, setPaddock] = useState("");
  const [method, setMethod] = useState("balança_eletronica");
  const [weighedBy, setWeighedBy] = useState("");
  const [scale, setScale] = useState("");
  const [rows, setRows] = useState<LoteRow[]>([]);

  const animalsInPaddock = useMemo(
    () => mockAnimals.filter((a) => a.paddock === paddock && a.current_status === "ativo"),
    [paddock],
  );

  const initRows = () => {
    setRows(animalsInPaddock.map((a) => {
      const lw = lastWeighing(a.id);
      return {
        animal_id: a.id, ear_tag: a.ear_tag, name: a.name, breed: a.breed,
        category: categoryLabel[calcAnimalCategory(a)],
        last_weight: lw?.weight_kg ?? a.current_weight,
        last_date: lw?.date ?? "—",
        new_weight: "", variation: null, gmd: null,
      };
    }));
  };

  const goStep2 = () => {
    if (!paddock) { toast({ title: "Selecione um pasto", variant: "destructive" }); return; }
    if (!weighedBy) { toast({ title: "Informe o pesador", variant: "destructive" }); return; }
    initRows(); setStep(2);
  };

  const updateWeight = (idx: number, val: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const num = parseFloat(val);
      const variation = !isNaN(num) && num > 0 ? num - r.last_weight : null;
      const days = r.last_date !== "—" ? Math.round((new Date(date).getTime() - new Date(r.last_date).getTime()) / 86400000) : null;
      const gmd = variation !== null && days && days > 0 ? Number((variation / days).toFixed(3)) : null;
      return { ...r, new_weight: val, variation, gmd };
    }));
  };

  const filledRows = rows.filter((r) => r.new_weight && !isNaN(parseFloat(r.new_weight)));

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(1);
      setRows((prev) => {
        const updated = [...prev];
        lines.forEach((line) => {
          const [earTag, weightStr] = line.split(/[,;\t]/).map((s) => s.trim());
          const idx = updated.findIndex((r) => r.ear_tag.toLowerCase() === earTag?.toLowerCase());
          if (idx >= 0 && weightStr) {
            const num = parseFloat(weightStr);
            if (!isNaN(num)) {
              const variation = num - updated[idx].last_weight;
              const days = updated[idx].last_date !== "—" ? Math.round((new Date(date).getTime() - new Date(updated[idx].last_date).getTime()) / 86400000) : null;
              const gmd = days && days > 0 ? Number((variation / days).toFixed(3)) : null;
              updated[idx] = { ...updated[idx], new_weight: weightStr, variation, gmd };
            }
          }
        });
        return updated;
      });
      toast({ title: "CSV importado", description: `${lines.length} linhas processadas` });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const avgWeight = filledRows.length ? (filledRows.reduce((s, r) => s + parseFloat(r.new_weight), 0) / filledRows.length).toFixed(1) : "0";
  const avgGmd = filledRows.filter((r) => r.gmd !== null).length
    ? (filledRows.filter((r) => r.gmd !== null).reduce((s, r) => s + (r.gmd ?? 0), 0) / filledRows.filter((r) => r.gmd !== null).length).toFixed(3)
    : "—";

  const handleConfirm = () => {
    toast({ title: "Pesagens salvas!", description: `${filledRows.length} pesagens registradas com sucesso.` });
    setStep(1); setRows([]); setPaddock(""); setWeighedBy("");
  };

  return (
    <div className="space-y-4">
      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <Badge variant={step >= s ? "default" : "outline"} className={step >= s ? "bg-primary text-primary-foreground" : ""}>{s}</Badge>
            <span className={step >= s ? "font-medium text-foreground" : "text-muted-foreground"}>
              {s === 1 ? "Configuração" : s === 2 ? "Pesagem" : "Revisão"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Configuração do Lote</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Pasto / Paddock</Label>
                <Select value={paddock} onValueChange={setPaddock}>
                  <SelectTrigger><SelectValue placeholder="Selecionar pasto" /></SelectTrigger>
                  <SelectContent>
                    {paddocks.map((p) => {
                      const c = mockAnimals.filter((a) => a.paddock === p && a.current_status === "ativo").length;
                      return <SelectItem key={p} value={p}>{p} ({c} animais)</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Método</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {weighMethods.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Balança</Label>
                <Input value={scale} onChange={(e) => setScale(e.target.value)} placeholder="ID da balança" />
              </div>
              <div className="space-y-1">
                <Label>Pesado por</Label>
                <Select value={weighedBy} onValueChange={setWeighedBy}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {paddock && <p className="text-sm text-muted-foreground">{animalsInPaddock.length} animais ativos no pasto selecionado</p>}
            <div className="flex justify-end">
              <Button onClick={goStep2} disabled={!paddock}>Próximo <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Pasto: <strong className="text-foreground">{paddock}</strong> • {rows.length} animais • {filledRows.length} pesados
            </p>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1">
                <Upload className="h-3.5 w-3.5" /> Importar CSV
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brinco</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Raça</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Último Peso</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right w-32">Peso Atual (kg)</TableHead>
                    <TableHead className="text-right">@ calc.</TableHead>
                    <TableHead className="text-right">GMD</TableHead>
                    <TableHead className="text-center w-10">OK</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => {
                    const filled = r.new_weight && !isNaN(parseFloat(r.new_weight));
                    const lowGmd = r.gmd !== null && r.gmd < 0.3;
                    return (
                      <TableRow key={r.animal_id} className={filled ? (lowGmd ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20") : ""}>
                        <TableCell className="font-mono font-semibold text-primary">{r.ear_tag}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.breed}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{r.last_weight} kg</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{r.last_date}</TableCell>
                        <TableCell className="text-right">
                          <Input type="number" value={r.new_weight} onChange={(e) => updateWeight(i, e.target.value)}
                            className="w-28 text-right font-mono ml-auto" placeholder="0" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {filled ? (parseFloat(r.new_weight) / ARROBA_KG_DEFAULT).toFixed(1) : ""}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {r.gmd !== null && (
                            <span className={r.gmd < 0.3 ? "text-amber-600" : r.gmd >= 0.7 ? "text-emerald-600" : ""}>{r.gmd} kg/d</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{filled && <Check className="h-4 w-4 text-emerald-600 mx-auto" />}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground text-center">{filledRows.length} de {rows.length} animais pesados</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => setStep(3)} disabled={filledRows.length === 0}>
              Revisar ({filledRows.length}) <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Revisão — Pesagem em Lote</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{date}</p></div>
                <div><p className="text-xs text-muted-foreground">Pasto</p><p className="font-medium">{paddock}</p></div>
                <div><p className="text-xs text-muted-foreground">Peso médio</p><p className="font-mono font-medium">{avgWeight} kg</p></div>
                <div><p className="text-xs text-muted-foreground">GMD médio</p><p className="font-mono font-medium">{avgGmd} kg/d</p></div>
              </div>
              <Separator />
              <p className="text-sm font-semibold">{filledRows.length} pesagens a registrar</p>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                      <TableHead className="text-right">Peso Anterior</TableHead>
                      <TableHead className="text-right">Novo Peso</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                      <TableHead className="text-right">GMD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filledRows.map((r) => (
                      <TableRow key={r.animal_id}>
                        <TableCell className="font-mono text-primary">{r.ear_tag}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="text-right font-mono">{r.last_weight} kg</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{r.new_weight} kg</TableCell>
                        <TableCell className="text-right font-mono">
                          {r.variation !== null && (
                            <span className={r.variation > 0 ? "text-emerald-600" : r.variation < 0 ? "text-red-600" : ""}>
                              {r.variation > 0 ? "+" : ""}{r.variation.toFixed(1)} kg
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{r.gmd !== null ? `${r.gmd} kg/d` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button onClick={handleConfirm} className="gap-2"><Check className="h-4 w-4" /> Confirmar {filledRows.length} Pesagens</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 3 — HISTÓRICO
   ═══════════════════════════════════════════════════════════════ */
function HistoricoTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [paddockFilter, setPaddockFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const enriched = useMemo(() => {
    const sorted = [...mockWeighings].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.map((w) => {
      const animal = mockAnimals.find((a) => a.id === w.animal_id);
      const allW = mockWeighings.filter((x) => x.animal_id === w.animal_id).sort((a, b) => a.date.localeCompare(b.date));
      const idx = allW.findIndex((x) => x.id === w.id);
      let gmd: number | null = null;
      if (idx > 0) {
        const prev = allW[idx - 1];
        const days = Math.round((new Date(w.date).getTime() - new Date(prev.date).getTime()) / 86400000);
        if (days > 0) gmd = Number(((w.weight_kg - prev.weight_kg) / days).toFixed(3));
      }
      return { ...w, animal, category: animal ? categoryLabel[calcAnimalCategory(animal)] : "", gmd };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((w) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!w.animal?.ear_tag.toLowerCase().includes(q) && !w.animal?.name.toLowerCase().includes(q)) return false;
      }
      if (paddockFilter !== "all" && w.paddock !== paddockFilter) return false;
      if (methodFilter !== "all" && w.method !== methodFilter) return false;
      if (periodFrom && w.date < periodFrom) return false;
      if (periodTo && w.date > periodTo) return false;
      return true;
    });
  }, [enriched, searchTerm, paddockFilter, methodFilter, officialOnly, periodFrom, periodTo]);

  const totalPesagens = filtered.length;
  const avgWeight = filtered.length ? (filtered.reduce((s, w) => s + w.weight_kg, 0) / filtered.length).toFixed(1) : "0";
  const heaviest = filtered.length ? filtered.reduce((max, w) => w.weight_kg > max.weight_kg ? w : max, filtered[0]) : null;
  const lightest = filtered.length ? filtered.reduce((min, w) => w.weight_kg < min.weight_kg ? w : min, filtered[0]) : null;
  const bestGmd = filtered.filter((w) => w.gmd !== null).length
    ? filtered.filter((w) => w.gmd !== null).reduce((max, w) => (w.gmd ?? 0) > (max.gmd ?? 0) ? w : max, filtered.filter((w) => w.gmd !== null)[0]) : null;
  const worstGmd = filtered.filter((w) => w.gmd !== null).length
    ? filtered.filter((w) => w.gmd !== null).reduce((min, w) => (w.gmd ?? 0) < (min.gmd ?? 0) ? w : min, filtered.filter((w) => w.gmd !== null)[0]) : null;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold text-primary">{totalPesagens}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Peso Médio</p>
          <p className="text-xl font-bold font-mono">{avgWeight} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Mais Pesado</p>
          <p className="text-sm font-bold">{heaviest?.animal?.ear_tag ?? "—"}</p>
          <p className="text-xs font-mono">{heaviest?.weight_kg ?? 0} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Mais Leve</p>
          <p className="text-sm font-bold">{lightest?.animal?.ear_tag ?? "—"}</p>
          <p className="text-xs font-mono">{lightest?.weight_kg ?? 0} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Maior GMD</p>
          <p className="text-sm font-bold">{bestGmd?.animal?.ear_tag ?? "—"}</p>
          <p className="text-xs font-mono text-emerald-600">{bestGmd?.gmd ?? "—"} kg/d</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Menor GMD</p>
          <p className="text-sm font-bold">{worstGmd?.animal?.ear_tag ?? "—"}</p>
          <p className="text-xs font-mono text-red-600">{worstGmd?.gmd ?? "—"} kg/d</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Buscar animal</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Brinco ou nome" className="pl-7 w-44 h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pasto</Label>
          <Select value={paddockFilter} onValueChange={setPaddockFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Método</Label>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="balança">Balança</SelectItem>
              <SelectItem value="fita">Fita</SelectItem>
              <SelectItem value="visual">Visual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="w-36 h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="w-36 h-9 text-sm" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Brinco</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Peso kg</TableHead>
                <TableHead className="text-right">Peso @</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Pesado por</TableHead>
                <TableHead>Pasto</TableHead>
                <TableHead className="text-right">GMD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="text-sm">{w.date}</TableCell>
                  <TableCell className="font-mono font-semibold text-primary">{w.animal?.ear_tag}</TableCell>
                  <TableCell>{w.animal?.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{w.category}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{w.weight_kg}</TableCell>
                  <TableCell className="text-right font-mono">{w.weight_arroba.toFixed(1)}</TableCell>
                  <TableCell className="capitalize text-xs">{w.method}</TableCell>
                  <TableCell className="text-xs">{w.weighed_by}</TableCell>
                  <TableCell className="text-xs">{w.paddock}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {w.gmd !== null ? (
                      <span className={w.gmd >= 0.7 ? "text-emerald-600" : w.gmd < 0.3 ? "text-red-600" : "text-amber-600"}>
                        {w.gmd} kg/d
                      </span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhuma pesagem encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 4 — RELATÓRIOS
   ═══════════════════════════════════════════════════════════════ */
function RelatoriosTab() {
  const [subTab, setSubTab] = useState<"evolucao" | "gmd" | "venda">("evolucao");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "evolucao", label: "Evolução de Peso", icon: TrendingUp },
          { key: "gmd", label: "GMD por Lote", icon: BarChart3 },
          { key: "venda", label: "Peso para Venda", icon: FileText },
        ] as const).map((t) => (
          <Button key={t.key} variant={subTab === t.key ? "default" : "outline"} size="sm" onClick={() => setSubTab(t.key)} className="gap-1.5">
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </Button>
        ))}
      </div>

      {subTab === "evolucao" && <EvolucaoPeso />}
      {subTab === "gmd" && <GmdLote />}
      {subTab === "venda" && <PesoVenda />}
    </div>
  );
}

/* ── Evolução de Peso ── */
function EvolucaoPeso() {
  const activeAnimals = useMemo(() => mockAnimals.filter((a) => a.current_status === "ativo"), []);
  const [selectedAnimal, setSelectedAnimal] = useState(activeAnimals[0]?.id ?? "");

  const chartData = useMemo(() => {
    return mockWeighings
      .filter((w) => w.animal_id === selectedAnimal)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => ({ date: w.date, peso: w.weight_kg, arroba: w.weight_arroba }));
  }, [selectedAnimal]);

  const tableData = useMemo(() => {
    const ws = mockWeighings.filter((w) => w.animal_id === selectedAnimal).sort((a, b) => a.date.localeCompare(b.date));
    return ws.map((w, i) => {
      let variation: number | null = null;
      let gmd: number | null = null;
      if (i > 0) {
        variation = w.weight_kg - ws[i - 1].weight_kg;
        const days = Math.round((new Date(w.date).getTime() - new Date(ws[i - 1].date).getTime()) / 86400000);
        if (days > 0) gmd = Number((variation / days).toFixed(3));
      }
      return { ...w, variation, gmd };
    });
  }, [selectedAnimal]);

  return (
    <div className="space-y-4">
      <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Selecionar animal" /></SelectTrigger>
        <SelectContent>
          {activeAnimals.map((a) => <SelectItem key={a.id} value={a.id}>{a.ear_tag} — {a.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {chartData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Peso (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">GMD</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.date}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{w.weight_kg} kg</TableCell>
                  <TableCell className="text-right font-mono">
                    {w.variation !== null ? (
                      <span className={w.variation > 0 ? "text-emerald-600" : "text-red-600"}>
                        {w.variation > 0 ? "+" : ""}{w.variation.toFixed(1)} kg
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">{w.gmd !== null ? `${w.gmd} kg/d` : "—"}</TableCell>
                  <TableCell className="capitalize">{w.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── GMD por Lote ── */
function GmdLote() {
  const [paddockFilter, setPaddockFilter] = useState("all");

  const results = useMemo(() => {
    const animals = paddockFilter === "all" ? mockAnimals.filter((a) => a.current_status === "ativo")
      : mockAnimals.filter((a) => a.paddock === paddockFilter && a.current_status === "ativo");

    return animals.map((a) => {
      const ws = mockWeighings.filter((w) => w.animal_id === a.id).sort((x, y) => x.date.localeCompare(y.date));
      if (ws.length < 2) return null;
      const first = ws[0];
      const last = ws[ws.length - 1];
      const days = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000);
      if (days <= 0) return null;
      const gmd = Number(((last.weight_kg - first.weight_kg) / days).toFixed(3));
      return {
        ear_tag: a.ear_tag, name: a.name,
        weightInitial: first.weight_kg, weightFinal: last.weight_kg,
        days, gmd, classification: classifyGmd(gmd),
      };
    }).filter(Boolean) as { ear_tag: string; name: string; weightInitial: number; weightFinal: number; days: number; gmd: number; classification: GmdClassification }[];
  }, [paddockFilter]);

  const avgGmd = results.length ? (results.reduce((s, r) => s + r.gmd, 0) / results.length).toFixed(3) : "0";

  const histogramData = useMemo(() => {
    const buckets = [
      { range: "< 0.3", min: -Infinity, max: 0.3, count: 0 },
      { range: "0.3-0.5", min: 0.3, max: 0.5, count: 0 },
      { range: "0.5-0.7", min: 0.5, max: 0.7, count: 0 },
      { range: "0.7-1.0", min: 0.7, max: 1.0, count: 0 },
      { range: "> 1.0", min: 1.0, max: Infinity, count: 0 },
    ];
    results.forEach((r) => {
      const b = buckets.find((b) => r.gmd >= b.min && r.gmd < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [results]);

  const barColors = ["#ef4444", "#f59e0b", "#eab308", "#3b82f6", "#10b981"];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Pasto</Label>
          <Select value={paddockFilter} onValueChange={setPaddockFilter}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Card className="px-4 py-2 border-primary/30 bg-primary/5">
          <p className="text-xs text-muted-foreground">GMD Médio do Lote</p>
          <p className="text-2xl font-bold font-mono text-primary">{avgGmd} <span className="text-sm font-normal">kg/dia</span></p>
        </Card>
      </div>

      {/* Histogram */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição de GMD</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="range" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip />
              <Bar dataKey="count" name="Animais">
                {histogramData.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                <TableHead className="text-right">Peso Inicial</TableHead>
                <TableHead className="text-right">Peso Final</TableHead>
                <TableHead className="text-right">Dias</TableHead>
                <TableHead className="text-right">GMD</TableHead>
                <TableHead>Classificação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.ear_tag}>
                  <TableCell className="font-mono text-primary font-semibold">{r.ear_tag}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right font-mono">{r.weightInitial} kg</TableCell>
                  <TableCell className="text-right font-mono">{r.weightFinal} kg</TableCell>
                  <TableCell className="text-right">{r.days}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{r.gmd}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={gmdClassColors[r.classification]}>
                      {gmdClassLabels[r.classification]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem dados suficientes</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Peso para Venda ── */
function PesoVenda() {
  const [minArroba, setMinArroba] = useState(16);
  const [precoArroba, setPrecoArroba] = useState(320);

  const eligible = useMemo(() => {
    return mockAnimals
      .filter((a) => a.current_status === "ativo")
      .map((a) => {
        const arroba = a.current_weight / 15;
        return { ...a, arroba, category: categoryLabel[calcAnimalCategory(a)] };
      })
      .filter((a) => a.arroba >= minArroba)
      .sort((a, b) => b.arroba - a.arroba);
  }, [minArroba]);

  const totalArroba = eligible.reduce((s, a) => s + a.arroba, 0);
  const totalReceita = totalArroba * precoArroba;
  const avgWeight = eligible.length ? (eligible.reduce((s, a) => s + a.current_weight, 0) / eligible.length).toFixed(0) : "0";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Mínimo de arrobas (@)</Label>
          <Input type="number" value={minArroba} onChange={(e) => setMinArroba(Number(e.target.value))} className="w-28 h-9 font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Preço da @ (R$)</Label>
          <Input type="number" value={precoArroba} onChange={(e) => setPrecoArroba(Number(e.target.value))} className="w-28 h-9 font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Animais elegíveis</p>
          <p className="text-2xl font-bold text-primary">{eligible.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Peso Médio</p>
          <p className="text-xl font-bold font-mono">{avgWeight} kg</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Arrobas</p>
          <p className="text-xl font-bold font-mono">{totalArroba.toFixed(1)} @</p>
        </CardContent></Card>
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Estimativa Receita</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead><TableHead>Nome</TableHead><TableHead>Raça</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right">Arrobas (@)</TableHead>
                <TableHead className="text-right">Valor Est. (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligible.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-primary font-semibold">{a.ear_tag}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell className="text-muted-foreground">{a.breed}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.category}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{a.current_weight}</TableCell>
                  <TableCell className="text-right font-mono">{a.arroba.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    R$ {(a.arroba * precoArroba).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              {eligible.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum animal acima de {minArroba} @</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
