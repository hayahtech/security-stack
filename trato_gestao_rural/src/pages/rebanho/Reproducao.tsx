import React, { useState, useMemo } from "react";
import {
  Baby, Search, Plus, Check, Heart, Calendar as CalIcon, BarChart3,
  AlertTriangle, Trash2, ChevronRight, Filter, Clock, Beef,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { mockAnimals, paddocks, calcAnimalCategory, categoryLabel, categoryColor } from "@/data/rebanho-mock";
import { mockReproEvents, type ReproductiveEvent } from "@/data/animal-detail-mock";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ─── constants ─── */
const GESTATION_DAYS = 283;
const workers = ["João", "Carlos", "Maria", "Pedro", "Ana", "Dr. Silva"];

const eventTypes = [
  { value: "cio", label: "Cio" },
  { value: "cobertura", label: "Cobertura Natural" },
  { value: "ia", label: "Inseminação Artificial (IA)" },
  { value: "iatf", label: "IATF" },
  { value: "diagnostico_prenhez", label: "Diagnóstico de Prenhez" },
  { value: "aborto", label: "Aborto" },
  { value: "parto", label: "Parto" },
  { value: "desmame", label: "Desmame" },
  { value: "descarte_reprodutivo", label: "Descarte Reprodutivo" },
];

const eventTypeColors: Record<string, string> = {
  cio: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  cobertura: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  ia: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  iatf: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  diagnostico_prenhez: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  aborto: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  parto: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  desmame: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  descarte_reprodutivo: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

const eventTypeIcons: Record<string, string> = {
  cio: "💗", cobertura: "🐂", ia: "💉", iatf: "💉",
  diagnostico_prenhez: "🔍", aborto: "⚠️", parto: "👶",
  desmame: "🍼", descarte_reprodutivo: "🚫",
};

/* ─── Semen stock mock ─── */
interface SemenStock {
  id: string; sire_name: string; sire_ear_tag: string; breed: string;
  origin: "nacional" | "importado"; batch: string; motility: number;
  total_doses: number; used_doses: number; storage_location: string;
  supplier: string; price_per_dose: number;
}

const initialSemenStock: SemenStock[] = [
  { id: "sem-1", sire_name: "Nelore Elite 2090", sire_ear_tag: "EXT-2090", breed: "Nelore", origin: "nacional", batch: "LOT-2024-A", motility: 85, total_doses: 50, used_doses: 12, storage_location: "Botijão 1 - Rack A3", supplier: "ABS Genética", price_per_dose: 45 },
  { id: "sem-2", sire_name: "Angus Black Star", sire_ear_tag: "EXT-BS01", breed: "Angus", origin: "importado", batch: "US-2024-112", motility: 90, total_doses: 30, used_doses: 5, storage_location: "Botijão 1 - Rack B1", supplier: "CRV Lagoa", price_per_dose: 120 },
  { id: "sem-3", sire_name: "Gir Leiteiro Top", sire_ear_tag: "EXT-GLT", breed: "Gir", origin: "nacional", batch: "LOT-2023-G", motility: 78, total_doses: 20, used_doses: 8, storage_location: "Botijão 2 - Rack A1", supplier: "Alta Genetics", price_per_dose: 65 },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function Reproducao() {
  const [semenStock, setSemenStock] = useState<SemenStock[]>(initialSemenStock);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Baby className="h-6 w-6 text-primary" /> Reprodução
      </h1>
      <Tabs defaultValue="registrar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="registrar" className="text-xs sm:text-sm gap-1"><Heart className="h-3.5 w-3.5 hidden sm:inline" /> Registrar</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs sm:text-sm gap-1"><Clock className="h-3.5 w-3.5 hidden sm:inline" /> Histórico</TabsTrigger>
          <TabsTrigger value="prenhez" className="text-xs sm:text-sm gap-1"><Baby className="h-3.5 w-3.5 hidden sm:inline" /> Prenhez</TabsTrigger>
          <TabsTrigger value="touros" className="text-xs sm:text-sm gap-1"><Beef className="h-3.5 w-3.5 hidden sm:inline" /> Touros</TabsTrigger>
          <TabsTrigger value="relatorios" className="text-xs sm:text-sm gap-1"><BarChart3 className="h-3.5 w-3.5 hidden sm:inline" /> Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="registrar"><RegistrarEvento /></TabsContent>
        <TabsContent value="historico"><HistoricoReprodutivo /></TabsContent>
        <TabsContent value="prenhez"><PainelPrenhez /></TabsContent>
        <TabsContent value="touros"><TourosESemen semenStock={semenStock} setSemenStock={setSemenStock} /></TabsContent>
        <TabsContent value="relatorios"><RelatoriosReprodutivos /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 1 — REGISTRAR EVENTO
   ═══════════════════════════════════════════════════════════════ */
function RegistrarEvento() {
  const reproAnimals = useMemo(() => mockAnimals.filter((a) => a.current_status === "ativo" && (a.sex === "F" || a.is_breeder)), []);
  const bulls = useMemo(() => mockAnimals.filter((a) => a.sex === "M" && a.is_breeder && a.current_status === "ativo"), []);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [eventType, setEventType] = useState("cobertura");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sireId, setSireId] = useState("");
  const [sireExternal, setSireExternal] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [notes, setNotes] = useState("");
  // Type-specific fields
  const [cioIntensity, setCioIntensity] = useState("medio");
  const [coverageCount, setCoverageCount] = useState("1");
  const [semenBatch, setSemenBatch] = useState("");
  const [semenBreed, setSemenBreed] = useState("");
  const [semenOrigin, setSemenOrigin] = useState("nacional");
  const [protocol, setProtocol] = useState("");
  const [protocolStart, setProtocolStart] = useState("");
  const [diagMethod, setDiagMethod] = useState("ultrassom");
  const [diagResult, setDiagResult] = useState("positivo");
  const [gestationMonths, setGestationMonths] = useState("");
  const [abortMonths, setAbortMonths] = useState("");
  const [abortCause, setAbortCause] = useState("indeterminada");
  const [abortAnalysis, setAbortAnalysis] = useState(false);
  const [partoType, setPartoType] = useState("normal");
  const [partoResult, setPartoResult] = useState("vivo");
  const [calfSex, setCalfSex] = useState("M");
  const [calfWeight, setCalfWeight] = useState("");
  const [calfEarTag, setCalfEarTag] = useState("");
  const [cowCondition, setCowCondition] = useState("boa");
  const [placentaRetention, setPlacentaRetention] = useState(false);
  const [weanWeight, setWeanWeight] = useState("");
  const [weanPaddock, setWeanPaddock] = useState("");
  const [discardReason, setDiscardReason] = useState("idade");
  const [discardDest, setDiscardDest] = useState("engorda");
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return reproAnimals.filter((a) => a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, reproAnimals]);

  const selected = useMemo(() => reproAnimals.find((a) => a.id === selectedId), [selectedId, reproAnimals]);
  const lastEvent = useMemo(() => {
    if (!selected) return null;
    return mockReproEvents.filter((e) => e.animal_id === selected.id).sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  }, [selected]);

  // Predicted birth date for positive pregnancy diagnosis
  const predictedBirth = useMemo(() => {
    if (eventType !== "diagnostico_prenhez" || diagResult !== "positivo") return null;
    // Find last coverage/ia/iatf for this animal
    if (!selected) return null;
    const coverages = mockReproEvents.filter((e) => e.animal_id === selected.id && ["cobertura", "iatf"].includes(e.event_type)).sort((a, b) => b.date.localeCompare(a.date));
    if (coverages.length === 0) return null;
    const coverDate = new Date(coverages[0].date);
    coverDate.setDate(coverDate.getDate() + GESTATION_DAYS);
    return coverDate.toISOString().slice(0, 10);
  }, [eventType, diagResult, selected]);

  const handleSave = () => {
    if (!selected) { toast({ title: "Selecione um animal", variant: "destructive" }); return; }
    setSaved(true);
    const evLabel = eventTypes.find((e) => e.value === eventType)?.label ?? eventType;
    toast({ title: "Evento registrado!", description: `${selected.ear_tag} — ${evLabel}` });
  };

  const handleNext = () => {
    setSelectedId(""); setSearch(""); setSaved(false); setNotes("");
    setSireId(""); setSireExternal("");
  };

  if (saved && selected) {
    const evLabel = eventTypes.find((e) => e.value === eventType)?.label ?? eventType;
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-3">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Check className="h-5 w-5" /> Evento Registrado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Animal</p><p className="font-semibold">{selected.ear_tag} — {selected.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Evento</p><p className="font-semibold">{evLabel}</p></div>
            <div><p className="text-xs text-muted-foreground">Data</p><p className="font-semibold">{date}</p></div>
            {predictedBirth && <div><p className="text-xs text-muted-foreground">Parto previsto</p><p className="font-semibold text-emerald-600">{predictedBirth}</p></div>}
          </div>
          {eventType === "parto" && partoResult === "vivo" && calfEarTag && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">🐄 Bezerro {calfEarTag} registrado — {calfSex === "M" ? "Macho" : "Fêmea"} — {calfWeight} kg</p>
            </div>
          )}
          <Button onClick={handleNext} className="gap-2"><Plus className="h-4 w-4" /> Registrar próximo evento</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Registrar Evento Reprodutivo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Animal search */}
          <div className="space-y-2">
            <Label>Animal (brinco ou nome)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }} placeholder="Buscar..." className="pl-9" />
            </div>
            {search && !selectedId && filtered.length > 0 && (
              <div className="border rounded-md divide-y max-h-48 overflow-auto bg-popover">
                {filtered.map((a) => (
                  <button key={a.id} className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between gap-2"
                    onClick={() => { setSelectedId(a.id); setSearch(a.ear_tag + " — " + a.name); }}>
                    <span className="font-mono font-semibold text-primary">{a.ear_tag}</span>
                    <span>{a.name}</span>
                    <Badge variant="outline" className="text-[10px]">{a.sex === "F" ? "♀" : "♂"} {a.breed}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">{selected.name[0]}</div>
              <div className="flex-1 text-sm space-y-0.5">
                <p className="font-semibold">{selected.ear_tag} — {selected.name} ({selected.sex === "F" ? "♀" : "♂"})</p>
                <p className="text-muted-foreground">{selected.breed} • {selected.paddock}</p>
                {lastEvent && <p className="text-muted-foreground">Último evento: {lastEvent.event_type} — {lastEvent.date}</p>}
              </div>
              <Badge variant="outline" className={categoryColor[calcAnimalCategory(selected)]}>{categoryLabel[calcAnimalCategory(selected)]}</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Tipo de evento</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{eventTypes.map((e) => <SelectItem key={e.value} value={e.value}>{eventTypeIcons[e.value]} {e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Select value={performedBy} onValueChange={setPerformedBy}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* CIO */}
          {eventType === "cio" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Detalhes do Cio</h4>
              <div className="space-y-1">
                <Label>Intensidade</Label>
                <Select value={cioIntensity} onValueChange={setCioIntensity}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fraco">Fraco</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="forte">Forte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* COBERTURA */}
          {eventType === "cobertura" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Cobertura Natural</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Touro cadastrado</Label>
                  <Select value={sireId} onValueChange={setSireId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar touro" /></SelectTrigger>
                    <SelectContent>{bulls.map((b) => <SelectItem key={b.id} value={b.id}>{b.ear_tag} — {b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Brinco externo (se não cadastrado)</Label><Input value={sireExternal} onChange={(e) => setSireExternal(e.target.value)} placeholder="Ex: EXT-001" /></div>
                <div className="space-y-1"><Label>Nº de coberturas</Label><Input type="number" value={coverageCount} onChange={(e) => setCoverageCount(e.target.value)} className="w-24" /></div>
              </div>
            </div>
          )}

          {/* IA / IATF */}
          {(eventType === "ia" || eventType === "iatf") && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{eventType === "ia" ? "Inseminação Artificial" : "IATF"}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Touro / Reprodutor</Label>
                  <Select value={sireId} onValueChange={setSireId}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{bulls.map((b) => <SelectItem key={b.id} value={b.id}>{b.ear_tag} — {b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Brinco externo / Sêmen</Label><Input value={sireExternal} onChange={(e) => setSireExternal(e.target.value)} /></div>
                <div className="space-y-1"><Label>Partida do sêmen</Label><Input value={semenBatch} onChange={(e) => setSemenBatch(e.target.value)} /></div>
                <div className="space-y-1"><Label>Raça do sêmen</Label><Input value={semenBreed} onChange={(e) => setSemenBreed(e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Origem</Label>
                  <Select value={semenOrigin} onValueChange={setSemenOrigin}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="nacional">Nacional</SelectItem><SelectItem value="importado">Importado</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Protocolo</Label><Input value={protocol} onChange={(e) => setProtocol(e.target.value)} placeholder="Ex: J-Synch, OvSynch" /></div>
                {eventType === "iatf" && (
                  <div className="space-y-1"><Label>Início do protocolo</Label><Input type="date" value={protocolStart} onChange={(e) => setProtocolStart(e.target.value)} /></div>
                )}
              </div>
            </div>
          )}

          {/* DIAGNÓSTICO DE PRENHEZ */}
          {eventType === "diagnostico_prenhez" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Diagnóstico de Prenhez</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Método</Label>
                  <Select value={diagMethod} onValueChange={setDiagMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="palpacao">Palpação</SelectItem>
                      <SelectItem value="ultrassom">Ultrassom</SelectItem>
                      <SelectItem value="visual">Visual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Resultado</Label>
                  <Select value={diagResult} onValueChange={setDiagResult}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positivo">✅ Prenha</SelectItem>
                      <SelectItem value="negativo">❌ Vazia</SelectItem>
                      <SelectItem value="inconclusivo">❓ Inconclusivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Meses de gestação est.</Label><Input type="number" value={gestationMonths} onChange={(e) => setGestationMonths(e.target.value)} className="w-24" /></div>
              </div>
              {predictedBirth && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm">
                  <p className="text-emerald-800 dark:text-emerald-300">📅 Parto previsto para: <strong>{predictedBirth}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* ABORTO */}
          {eventType === "aborto" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Aborto</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Meses de gestação</Label><Input type="number" value={abortMonths} onChange={(e) => setAbortMonths(e.target.value)} className="w-24" /></div>
                <div className="space-y-1">
                  <Label>Causa provável</Label>
                  <Select value={abortCause} onValueChange={setAbortCause}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Brucelose", "Tricomoníase", "Campylobacteriose", "Nutricional", "Trauma", "Indeterminada", "Outro"].map((c) => (
                        <SelectItem key={c.toLowerCase()} value={c.toLowerCase()}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={abortAnalysis} onCheckedChange={setAbortAnalysis} />
                <Label>Material enviado para análise</Label>
              </div>
            </div>
          )}

          {/* PARTO */}
          {eventType === "parto" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Parto</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Tipo de parto</Label>
                  <Select value={partoType} onValueChange={setPartoType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="distocico">Distócico</SelectItem>
                      <SelectItem value="cesariana">Cesariana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Resultado</Label>
                  <Select value={partoResult} onValueChange={setPartoResult}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivo">Vivo</SelectItem>
                      <SelectItem value="natimorto">Natimorto</SelectItem>
                      <SelectItem value="gemelar">Gemelar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Condição pós-parto</Label>
                  <Select value={cowCondition} onValueChange={setCowCondition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="otima">Ótima</SelectItem>
                      <SelectItem value="boa">Boa</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="ruim">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={placentaRetention} onCheckedChange={setPlacentaRetention} />
                <Label>Retenção de placenta</Label>
              </div>
              {partoResult === "vivo" && (
                <>
                  <Separator />
                  <h4 className="font-semibold text-sm">Dados do Bezerro</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>Sexo</Label>
                      <Select value={calfSex} onValueChange={setCalfSex}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="M">Macho</SelectItem><SelectItem value="F">Fêmea</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Peso ao nascer (kg)</Label><Input type="number" value={calfWeight} onChange={(e) => setCalfWeight(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Brinco do bezerro</Label><Input value={calfEarTag} onChange={(e) => setCalfEarTag(e.target.value)} placeholder="Ex: BR011" /></div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* DESMAME */}
          {eventType === "desmame" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Desmame</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Peso ao desmame (kg)</Label><Input type="number" value={weanWeight} onChange={(e) => setWeanWeight(e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Pasto de destino</Label>
                  <Select value={weanPaddock} onValueChange={setWeanPaddock}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* DESCARTE */}
          {eventType === "descarte_reprodutivo" && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Descarte Reprodutivo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Motivo</Label>
                  <Select value={discardReason} onValueChange={setDiscardReason}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idade">Idade</SelectItem>
                      <SelectItem value="problemas_reprodutivos">Problemas reprodutivos crônicos</SelectItem>
                      <SelectItem value="baixa_producao">Baixa produção</SelectItem>
                      <SelectItem value="agressividade">Agressividade</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Destino</Label>
                  <Select value={discardDest} onValueChange={setDiscardDest}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engorda">Engorda</SelectItem>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="abate">Abate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas adicionais..." /></div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!selectedId} className="gap-2"><Check className="h-4 w-4" /> Salvar Evento</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 2 — HISTÓRICO REPRODUTIVO
   ═══════════════════════════════════════════════════════════════ */
function HistoricoReprodutivo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [timelineAnimalId, setTimelineAnimalId] = useState<string | null>(null);

  const enriched = useMemo(() => {
    return [...mockReproEvents].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
      const animal = mockAnimals.find((a2) => a2.id === e.animal_id);
      return { ...e, animal };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((e) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!e.animal?.ear_tag.toLowerCase().includes(q) && !e.animal?.name.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (periodFrom && e.date < periodFrom) return false;
      if (periodTo && e.date > periodTo) return false;
      return true;
    });
  }, [enriched, searchTerm, typeFilter, periodFrom, periodTo]);

  const timelineEvents = useMemo(() => {
    if (!timelineAnimalId) return [];
    return mockReproEvents.filter((e) => e.animal_id === timelineAnimalId).sort((a, b) => a.date.localeCompare(b.date));
  }, [timelineAnimalId]);

  const timelineAnimal = timelineAnimalId ? mockAnimals.find((a) => a.id === timelineAnimalId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Buscar animal</Label>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Brinco ou nome" className="w-40 h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {eventTypes.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
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
                <TableHead>Evento</TableHead><TableHead>Touro/Técnico</TableHead>
                <TableHead>Resultado</TableHead><TableHead>Obs.</TableHead><TableHead className="w-20">Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{e.date}</TableCell>
                  <TableCell className="font-mono font-semibold text-primary">{e.animal?.ear_tag}</TableCell>
                  <TableCell>{e.animal?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${eventTypeColors[e.event_type] ?? ""}`}>
                      {eventTypeIcons[e.event_type] ?? ""} {e.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.partner_ear_tag || "—"}</TableCell>
                  <TableCell className="text-sm">{e.result || e.details?.slice(0, 30) || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{e.notes || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setTimelineAnimalId(e.animal_id)} className="text-xs h-7">
                      <Clock className="h-3 w-3 mr-1" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum evento encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline modal */}
      <Dialog open={!!timelineAnimalId} onOpenChange={(open) => !open && setTimelineAnimalId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Timeline Reprodutiva — {timelineAnimal?.ear_tag} {timelineAnimal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-0 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            {timelineEvents.map((e, i) => (
              <div key={e.id} className="relative pl-10 pb-4">
                <div className={`absolute left-2.5 top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-[10px] ${eventTypeColors[e.event_type] ?? "bg-muted"}`}>
                  {eventTypeIcons[e.event_type]}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{e.date}</p>
                    <Badge variant="outline" className={`text-[10px] ${eventTypeColors[e.event_type] ?? ""}`}>{e.event_type}</Badge>
                  </div>
                  <p className="text-sm">{e.details}</p>
                  {e.partner_ear_tag && <p className="text-xs text-muted-foreground">Touro: {e.partner_ear_tag}</p>}
                  {e.result && <p className="text-xs font-medium">Resultado: {e.result}</p>}
                  {e.notes && <p className="text-xs text-muted-foreground italic">{e.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 3 — PAINEL DE PRENHEZ
   ═══════════════════════════════════════════════════════════════ */
function PainelPrenhez() {
  const pregnantData = useMemo(() => {
    // Find animals with positive pregnancy diagnostics and no subsequent birth
    const results: { animal: typeof mockAnimals[0]; coverageDate: string; sire: string; gestationMonths: number; predictedBirth: string; daysUntilBirth: number }[] = [];

    const females = mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && a.species === "bovino");
    females.forEach((animal) => {
      const events = mockReproEvents.filter((e) => e.animal_id === animal.id).sort((a, b) => a.date.localeCompare(b.date));
      // Find last positive diagnosis
      const lastDiag = [...events].reverse().find((e) => e.event_type === "diagnostico_prenhez" && e.result === "positivo");
      if (!lastDiag) return;
      // Check no birth after diagnosis
      const birthAfter = events.find((e) => e.event_type === "parto" && e.date > lastDiag.date);
      if (birthAfter) return;
      // Find coverage before diagnosis
      const coverage = [...events].reverse().find((e) => ["cobertura", "iatf"].includes(e.event_type) && e.date <= lastDiag.date);
      const coverageDate = coverage?.date ?? lastDiag.date;
      const predicted = new Date(new Date(coverageDate).getTime() + GESTATION_DAYS * 86400000);
      const daysUntil = Math.round((predicted.getTime() - Date.now()) / 86400000);
      const gestMonths = Math.round((Date.now() - new Date(coverageDate).getTime()) / (30 * 86400000));
      results.push({
        animal, coverageDate, sire: coverage?.partner_ear_tag ?? "—",
        gestationMonths: gestMonths, predictedBirth: predicted.toISOString().slice(0, 10),
        daysUntilBirth: daysUntil,
      });
    });
    return results.sort((a, b) => a.daysUntilBirth - b.daysUntilBirth);
  }, []);

  const totalFemalesRepro = mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && a.species === "bovino").length;
  const pregnancyRate = totalFemalesRepro > 0 ? ((pregnantData.length / totalFemalesRepro) * 100).toFixed(1) : "0";
  const next30 = pregnantData.filter((p) => p.daysUntilBirth <= 30 && p.daysUntilBirth >= 0).length;
  const next60 = pregnantData.filter((p) => p.daysUntilBirth <= 60 && p.daysUntilBirth >= 0).length;

  // Births this year
  const birthsThisYear = mockReproEvents.filter((e) => e.event_type === "parto" && e.date.startsWith(new Date().getFullYear().toString())).length;

  // Weekly forecast
  const weeklyForecast = useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    const now = new Date();
    for (let w = 0; w < 13; w++) {
      const start = new Date(now.getTime() + w * 7 * 86400000);
      const end = new Date(start.getTime() + 7 * 86400000);
      const count = pregnantData.filter((p) => {
        const d = new Date(p.predictedBirth);
        return d >= start && d < end;
      }).length;
      if (count > 0) weeks.push({ label: `Sem. ${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`, count });
    }
    return weeks;
  }, [pregnantData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Vacas Prenhas</p>
          <p className="text-2xl font-bold text-primary">{pregnantData.length}</p>
        </CardContent></Card>
        <Card className={next30 > 0 ? "border-amber-300" : ""}><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Partos em 30 dias</p>
          <p className={`text-2xl font-bold ${next30 > 0 ? "text-amber-600" : ""}`}>{next30}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Partos em 60 dias</p>
          <p className="text-2xl font-bold">{next60}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Taxa de Prenhez</p>
          <p className="text-2xl font-bold font-mono">{pregnancyRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Nascimentos {new Date().getFullYear()}</p>
          <p className="text-2xl font-bold text-emerald-600">{birthsThisYear}</p>
        </CardContent></Card>
      </div>

      {/* Weekly forecast */}
      {weeklyForecast.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Previsão de Partos — Próximas 13 Semanas</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weeklyForecast.map((w, i) => (
                <Badge key={i} variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                  {w.label}: {w.count} parto{w.count > 1 ? "s" : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pregnant cows table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Vacas Prenhas</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                <TableHead>Cobertura</TableHead><TableHead>Touro</TableHead>
                <TableHead className="text-right">Meses Gest.</TableHead>
                <TableHead>Parto Previsto</TableHead>
                <TableHead className="text-right">Dias p/ Parto</TableHead>
                <TableHead>Pasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pregnantData.map((p) => (
                <TableRow key={p.animal.id}>
                  <TableCell className="font-mono font-semibold text-primary">{p.animal.ear_tag}</TableCell>
                  <TableCell>{p.animal.name}</TableCell>
                  <TableCell className="text-sm">{p.coverageDate}</TableCell>
                  <TableCell className="text-sm">{p.sire}</TableCell>
                  <TableCell className="text-right font-mono">{p.gestationMonths}</TableCell>
                  <TableCell className="text-sm font-semibold">{p.predictedBirth}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={
                      p.daysUntilBirth <= 7 ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300" :
                      p.daysUntilBirth <= 30 ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300" :
                      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300"
                    }>
                      {p.daysUntilBirth} dias
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.animal.paddock}</TableCell>
                </TableRow>
              ))}
              {pregnantData.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma vaca prenha registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 4 — TOUROS & SÊMEN
   ═══════════════════════════════════════════════════════════════ */
function TourosESemen({ semenStock, setSemenStock }: {
  semenStock: SemenStock[];
  setSemenStock: React.Dispatch<React.SetStateAction<SemenStock[]>>;
}) {
  const [showAddSemen, setShowAddSemen] = useState(false);
  const [fSireName, setFSireName] = useState("");
  const [fSireTag, setFSireTag] = useState("");
  const [fBreed, setFBreed] = useState("");
  const [fOrigin, setFOrigin] = useState<"nacional" | "importado">("nacional");
  const [fBatch, setFBatch] = useState("");
  const [fMotility, setFMotility] = useState(80);
  const [fTotalDoses, setFTotalDoses] = useState(0);
  const [fStorage, setFStorage] = useState("");
  const [fSupplier, setFSupplier] = useState("");
  const [fPrice, setFPrice] = useState(0);

  const bulls = useMemo(() => {
    return mockAnimals.filter((a) => a.sex === "M" && a.is_breeder && a.current_status === "ativo").map((bull) => {
      const coverages = mockReproEvents.filter((e) => e.partner_id === bull.id || (e.partner_ear_tag === bull.ear_tag)).length;
      // Count offspring
      const offspring = mockAnimals.filter((a) => a.sire_id === bull.id).length;
      // Approximate pregnancy rate
      const pregnancies = mockReproEvents.filter((e) =>
        e.event_type === "diagnostico_prenhez" && e.result === "positivo" &&
        mockReproEvents.some((c) => c.animal_id === e.animal_id && (c.partner_id === bull.id || c.partner_ear_tag === bull.ear_tag) && c.date <= e.date)
      ).length;
      const pregRate = coverages > 0 ? ((pregnancies / coverages) * 100).toFixed(0) : "—";
      return { ...bull, coverages, offspring, pregRate, category: categoryLabel[calcAnimalCategory(bull)] };
    });
  }, []);

  const handleAddSemen = () => {
    if (!fSireName || fTotalDoses <= 0) { toast({ title: "Preencha nome e doses", variant: "destructive" }); return; }
    setSemenStock((prev) => [...prev, {
      id: `sem-${Date.now()}`, sire_name: fSireName, sire_ear_tag: fSireTag, breed: fBreed,
      origin: fOrigin, batch: fBatch, motility: fMotility, total_doses: fTotalDoses,
      used_doses: 0, storage_location: fStorage, supplier: fSupplier, price_per_dose: fPrice,
    }]);
    setShowAddSemen(false);
    setFSireName(""); setFSireTag(""); setFBreed(""); setFBatch(""); setFTotalDoses(0); setFStorage(""); setFSupplier(""); setFPrice(0);
    toast({ title: "Partida de sêmen cadastrada!" });
  };

  return (
    <div className="space-y-6">
      {/* Bulls */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Touros Reprodutores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bulls.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-primary">{b.name[0]}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{b.ear_tag} — {b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.breed} • {b.paddock}</p>
                  </div>
                  <Badge variant="outline" className={categoryColor[calcAnimalCategory(b)]}>{b.category}</Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Coberturas</p>
                    <p className="font-bold text-primary">{b.coverages}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Filhos</p>
                    <p className="font-bold">{b.offspring}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taxa Prenhez</p>
                    <p className="font-bold text-emerald-600">{b.pregRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {bulls.length === 0 && <p className="text-muted-foreground text-sm col-span-full">Nenhum touro reprodutor cadastrado</p>}
        </div>
      </div>

      {/* Semen Stock */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Estoque de Sêmen</h3>
          <Button size="sm" onClick={() => setShowAddSemen(true)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Nova Partida</Button>
        </div>
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reprodutor</TableHead><TableHead>Raça</TableHead><TableHead>Origem</TableHead>
                  <TableHead>Partida</TableHead><TableHead className="text-right">Motil. %</TableHead>
                  <TableHead className="text-right">Doses Disp.</TableHead><TableHead className="text-right">Usadas</TableHead>
                  <TableHead>Local</TableHead><TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">R$/dose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semenStock.map((s) => {
                  const avail = s.total_doses - s.used_doses;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold">{s.sire_name}</TableCell>
                      <TableCell>{s.breed}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.origin === "importado" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300" : ""}>
                          {s.origin === "importado" ? "🌎 Importado" : "🇧🇷 Nacional"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.batch}</TableCell>
                      <TableCell className="text-right font-mono">{s.motility}%</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-semibold ${avail <= 5 ? "text-red-600" : "text-emerald-600"}`}>{avail}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{s.used_doses}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.storage_location}</TableCell>
                      <TableCell className="text-xs">{s.supplier}</TableCell>
                      <TableCell className="text-right font-mono">R$ {s.price_per_dose.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add semen dialog */}
      <Dialog open={showAddSemen} onOpenChange={setShowAddSemen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Partida de Sêmen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Reprodutor</Label><Input value={fSireName} onChange={(e) => setFSireName(e.target.value)} /></div>
              <div className="space-y-1"><Label>Brinco/ID</Label><Input value={fSireTag} onChange={(e) => setFSireTag(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Raça</Label><Input value={fBreed} onChange={(e) => setFBreed(e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Origem</Label>
                <Select value={fOrigin} onValueChange={(v) => setFOrigin(v as "nacional" | "importado")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="nacional">Nacional</SelectItem><SelectItem value="importado">Importado</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Partida</Label><Input value={fBatch} onChange={(e) => setFBatch(e.target.value)} /></div>
              <div className="space-y-1"><Label>Motilidade %</Label><Input type="number" value={fMotility} onChange={(e) => setFMotility(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Total doses</Label><Input type="number" value={fTotalDoses} onChange={(e) => setFTotalDoses(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1"><Label>Local de armazenamento</Label><Input value={fStorage} onChange={(e) => setFStorage(e.target.value)} placeholder="Botijão 1 - Rack A3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Fornecedor</Label><Input value={fSupplier} onChange={(e) => setFSupplier(e.target.value)} /></div>
              <div className="space-y-1"><Label>Valor/dose (R$)</Label><Input type="number" value={fPrice} onChange={(e) => setFPrice(Number(e.target.value))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSemen(false)}>Cancelar</Button>
            <Button onClick={handleAddSemen}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 5 — RELATÓRIOS REPRODUTIVOS
   ═══════════════════════════════════════════════════════════════ */
function RelatoriosReprodutivos() {
  const bulls = useMemo(() => mockAnimals.filter((a) => a.sex === "M" && a.is_breeder), []);

  // Pregnancy rate by bull
  const pregByBull = useMemo(() => {
    return bulls.map((bull) => {
      const coverages = mockReproEvents.filter((e) =>
        ["cobertura", "iatf"].includes(e.event_type) && (e.partner_id === bull.id || e.partner_ear_tag === bull.ear_tag)
      ).length;
      const positives = mockReproEvents.filter((e) =>
        e.event_type === "diagnostico_prenhez" && e.result === "positivo" &&
        mockReproEvents.some((c) => c.animal_id === e.animal_id && (c.partner_id === bull.id || c.partner_ear_tag === bull.ear_tag))
      ).length;
      const rate = coverages > 0 ? (positives / coverages * 100) : 0;
      return { name: `${bull.ear_tag}\n${bull.name}`, coverages, positives, rate: Number(rate.toFixed(1)) };
    }).filter((b) => b.coverages > 0);
  }, [bulls]);

  // IEP (inter-parto interval) by cow
  const iepData = useMemo(() => {
    const females = mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo");
    const results: { ear_tag: string; name: string; births: number; avgIep: number }[] = [];
    females.forEach((f) => {
      const births = mockReproEvents.filter((e) => e.animal_id === f.id && e.event_type === "parto").sort((a, b) => a.date.localeCompare(b.date));
      if (births.length < 2) return;
      const intervals: number[] = [];
      for (let i = 1; i < births.length; i++) {
        const days = Math.round((new Date(births[i].date).getTime() - new Date(births[i - 1].date).getTime()) / 86400000);
        intervals.push(days);
      }
      const avg = intervals.reduce((s, d) => s + d, 0) / intervals.length;
      results.push({ ear_tag: f.ear_tag, name: f.name, births: births.length, avgIep: Math.round(avg) });
    });
    return results;
  }, []);

  // Births by year
  const birthsByYear = useMemo(() => {
    const map: Record<string, number> = {};
    mockReproEvents.filter((e) => e.event_type === "parto").forEach((e) => {
      const year = e.date.slice(0, 4);
      map[year] = (map[year] || 0) + 1;
    });
    return Object.entries(map).sort().map(([year, count]) => ({ year, count }));
  }, []);

  // Summary stats
  const totalBirths = mockReproEvents.filter((e) => e.event_type === "parto").length;
  const totalFemales = mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo" && a.species === "bovino").length;
  const positiveDiags = mockReproEvents.filter((e) => e.event_type === "diagnostico_prenhez" && e.result === "positivo").length;
  const totalDiags = mockReproEvents.filter((e) => e.event_type === "diagnostico_prenhez").length;
  const avgPregRate = totalDiags > 0 ? (positiveDiags / totalDiags * 100).toFixed(1) : "—";
  const avgIep = iepData.length > 0 ? Math.round(iepData.reduce((s, d) => s + d.avgIep, 0) / iepData.length) : "—";

  const barColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Partos</p>
          <p className="text-2xl font-bold text-primary">{totalBirths}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Taxa Prenhez Geral</p>
          <p className="text-2xl font-bold font-mono">{avgPregRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">IEP Médio</p>
          <p className="text-2xl font-bold font-mono">{avgIep} <span className="text-sm font-normal">dias</span></p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Fêmeas Ativas</p>
          <p className="text-2xl font-bold">{totalFemales}</p>
        </CardContent></Card>
      </div>

      {/* Pregnancy rate by bull */}
      {pregByBull.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Taxa de Prenhez por Touro</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pregByBull}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" unit="%" />
                <Tooltip />
                <Bar dataKey="rate" name="Taxa Prenhez %" fill="hsl(var(--primary))">
                  {pregByBull.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Births by year */}
      {birthsByYear.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Natalidade por Ano</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={birthsByYear}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" name="Nascimentos" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* IEP Table */}
      {iepData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Intervalo Entre Partos (IEP)</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                  <TableHead className="text-right">Nº Partos</TableHead>
                  <TableHead className="text-right">IEP Médio (dias)</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iepData.map((d) => (
                  <TableRow key={d.ear_tag}>
                    <TableCell className="font-mono text-primary font-semibold">{d.ear_tag}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell className="text-right font-mono">{d.births}</TableCell>
                    <TableCell className="text-right font-mono">{d.avgIep}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        d.avgIep <= 365 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300" :
                        d.avgIep <= 450 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300"
                      }>
                        {d.avgIep <= 365 ? "Excelente" : d.avgIep <= 450 ? "Regular" : "Longo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
