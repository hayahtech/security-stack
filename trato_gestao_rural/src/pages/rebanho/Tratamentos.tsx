import React, { useState, useMemo, useEffect } from "react";
import {
  Stethoscope, Search, Plus, Check, Syringe, Pill, Calendar as CalendarIcon,
  Package, AlertTriangle, Trash2, ChevronRight, Users, Filter, X, Scan,
  Radio, Play, Square, Maximize2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { mockAnimals, paddocks, calcAnimalCategory, categoryLabel, categoryColor, type AnimalCategory } from "@/data/rebanho-mock";
import { BarcodeScanner, ScanButton } from "@/components/BarcodeScanner";
import {
  subscribeDeviceEvents, startSimulation, stopSimulation, simulateSingleRead,
  mockReaders, type DeviceEvent,
} from "@/data/devices-mock";
import { mockTreatments, type TreatmentEvent } from "@/data/animal-detail-mock";
import ModoBreteTratamento from "@/components/ModoBreteTratamento";
import { useDevices } from "@/contexts/DeviceContext";

/* ─── Mock medication catalog ─── */
export interface Medication {
  id: string;
  name: string;
  type: MedType;
  active_ingredient: string;
  concentration: string;
  default_unit: string;
  withdrawal_days_meat: number;
  withdrawal_days_milk: number;
  manufacturer: string;
  mapa_registro: string;
  active: boolean;
  notes: string;
}

type MedType = "vacina" | "vermifugo" | "antibiotico" | "anti-inflamatorio" | "vitamina" | "hormonio" | "carrapaticida" | "ectoparasita" | "outro";

const medTypeLabels: Record<MedType, string> = {
  vacina: "Vacina", vermifugo: "Vermífugo", antibiotico: "Antibiótico",
  "anti-inflamatorio": "Anti-inflamatório", vitamina: "Vitamina/Suplemento",
  hormonio: "Hormônio", carrapaticida: "Carrapaticida", ectoparasita: "Ectoparasita", outro: "Outro",
};

const medTypeColors: Record<MedType, string> = {
  vacina: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  vermifugo: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  antibiotico: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "anti-inflamatorio": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  vitamina: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  hormonio: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  carrapaticida: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ectoparasita: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  outro: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

const treatmentTypes = [
  "Vacinação", "Vermifugação", "Antibiótico", "Anti-inflamatório",
  "Vitamina/Suplemento", "Cicatrizante", "Carrapaticida", "Berne", "Ectoparasita", "Outro",
];

const applicationRoutes = [
  { value: "IM", label: "Intramuscular (IM)" },
  { value: "SC", label: "Subcutânea (SC)" },
  { value: "IV", label: "Intravenosa (IV)" },
  { value: "Oral", label: "Oral" },
  { value: "Topica", label: "Tópica" },
  { value: "Pour-on", label: "Pour-on" },
  { value: "Nasal", label: "Nasal" },
  { value: "Outro", label: "Outro" },
];

const symptomsList = ["Febre", "Apatia", "Perda de apetite", "Diarreia", "Tosse", "Rengo", "Inchaço", "Ferida", "Outro"];
const workers = ["João", "Carlos", "Maria", "Pedro", "Ana", "Dr. Silva"];

const initialMedications: Medication[] = [
  { id: "med-1", name: "Aftosa Ourovac", type: "vacina", active_ingredient: "Vírus inativado aftosa", concentration: "5ml/dose", default_unit: "ml", withdrawal_days_meat: 0, withdrawal_days_milk: 0, manufacturer: "Ourofino", mapa_registro: "9.438", active: true, notes: "Campanha obrigatória" },
  { id: "med-2", name: "Brucelose B19", type: "vacina", active_ingredient: "Brucella abortus cepa B19", concentration: "2ml/dose", default_unit: "ml", withdrawal_days_meat: 0, withdrawal_days_milk: 0, manufacturer: "Vallée", mapa_registro: "7.221", active: true, notes: "Apenas fêmeas 3-8 meses" },
  { id: "med-3", name: "Ivermectina 1%", type: "vermifugo", active_ingredient: "Ivermectina", concentration: "10mg/ml", default_unit: "ml", withdrawal_days_meat: 28, withdrawal_days_milk: 28, manufacturer: "Merial", mapa_registro: "6.104", active: true, notes: "" },
  { id: "med-4", name: "Oxitetraciclina LA", type: "antibiotico", active_ingredient: "Oxitetraciclina", concentration: "200mg/ml", default_unit: "ml", withdrawal_days_meat: 30, withdrawal_days_milk: 7, manufacturer: "Zoetis", mapa_registro: "5.889", active: true, notes: "" },
  { id: "med-5", name: "Dectomax", type: "vermifugo", active_ingredient: "Doramectina", concentration: "10mg/ml", default_unit: "ml", withdrawal_days_meat: 35, withdrawal_days_milk: 0, manufacturer: "Zoetis", mapa_registro: "8.112", active: true, notes: "" },
  { id: "med-6", name: "Raiva Bovina", type: "vacina", active_ingredient: "Vírus rábico inativado", concentration: "2ml/dose", default_unit: "ml", withdrawal_days_meat: 0, withdrawal_days_milk: 0, manufacturer: "Biovet", mapa_registro: "4.567", active: true, notes: "Anual, áreas endêmicas" },
  { id: "med-7", name: "Flunixin Meglumine", type: "anti-inflamatorio", active_ingredient: "Flunixin", concentration: "50mg/ml", default_unit: "ml", withdrawal_days_meat: 4, withdrawal_days_milk: 2, manufacturer: "MSD", mapa_registro: "6.330", active: true, notes: "" },
  { id: "med-8", name: "ADE Injetável", type: "vitamina", active_ingredient: "Vitaminas A, D, E", concentration: "500.000 UI/ml", default_unit: "ml", withdrawal_days_meat: 0, withdrawal_days_milk: 0, manufacturer: "Ourofino", mapa_registro: "7.890", active: true, notes: "" },
];

/* ─── Vaccine calendar protocols ─── */
interface VaccineProtocol {
  id: string;
  name: string;
  medication_id: string;
  frequency: "anual" | "semestral" | "trimestral" | "personalizada";
  months: number[];
  target_category: string;
  notes: string;
}

const initialProtocols: VaccineProtocol[] = [
  { id: "vp-1", name: "Febre Aftosa (Mai)", medication_id: "med-1", frequency: "semestral", months: [5, 11], target_category: "Todos bovinos", notes: "Campanha obrigatória MAPA" },
  { id: "vp-2", name: "Brucelose B19", medication_id: "med-2", frequency: "anual", months: [3], target_category: "Fêmeas 3-8 meses", notes: "Dose única" },
  { id: "vp-3", name: "Raiva Bovina", medication_id: "med-6", frequency: "anual", months: [7], target_category: "Todos bovinos > 3 meses", notes: "Área endêmica" },
  { id: "vp-4", name: "Vermifugação 1ª dose", medication_id: "med-3", frequency: "semestral", months: [4, 10], target_category: "Todos", notes: "" },
];

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/* ═══════════════════════════════════════════════════════════════ */
export default function Tratamentos() {
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [protocols, setProtocols] = useState<VaccineProtocol[]>(initialProtocols);
  const [showBrete, setShowBrete] = useState(false);
  const { readers } = useDevices();
  const hasDevices = readers.some((r) => r.active);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" /> Tratamentos
        </h1>
        {hasDevices && (
          <Button onClick={() => setShowBrete(true)} className="gap-2">
            <Maximize2 className="h-4 w-4" /> Modo Brete
          </Button>
        )}
      </div>

      <Tabs defaultValue="novo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="novo" className="text-xs sm:text-sm gap-1"><Syringe className="h-3.5 w-3.5 hidden sm:inline" /> Novo</TabsTrigger>
          <TabsTrigger value="automatizado" className="text-xs sm:text-sm gap-1"><Radio className="h-3.5 w-3.5 hidden sm:inline" /> Auto</TabsTrigger>
          <TabsTrigger value="lote" className="text-xs sm:text-sm gap-1"><Users className="h-3.5 w-3.5 hidden sm:inline" /> Lote</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs sm:text-sm gap-1"><Stethoscope className="h-3.5 w-3.5 hidden sm:inline" /> Histórico</TabsTrigger>
          <TabsTrigger value="calendario" className="text-xs sm:text-sm gap-1"><CalendarIcon className="h-3.5 w-3.5 hidden sm:inline" /> Calendário</TabsTrigger>
          <TabsTrigger value="medicamentos" className="text-xs sm:text-sm gap-1"><Pill className="h-3.5 w-3.5 hidden sm:inline" /> Medicamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="novo"><NovoTratamento medications={medications} /></TabsContent>
        <TabsContent value="automatizado"><TratamentoAutomatizado medications={medications} /></TabsContent>
        <TabsContent value="lote"><TratamentoLote medications={medications} /></TabsContent>
        <TabsContent value="historico"><HistoricoSanitario medications={medications} /></TabsContent>
        <TabsContent value="calendario"><CalendarioVacinal protocols={protocols} setProtocols={setProtocols} medications={medications} /></TabsContent>
        <TabsContent value="medicamentos"><MedicamentosTab medications={medications} setMedications={setMedications} /></TabsContent>
      </Tabs>

      {showBrete && (
        <ModoBreteTratamento medications={medications} onClose={() => setShowBrete(false)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA AUTOMATIZADO — TRATAMENTO COM LEITOR RFID
   ═══════════════════════════════════════════════════════════════ */
interface AutoTreatRecord {
  earTag: string;
  animalName: string;
  medications: string[];
  timestamp: Date;
}

function TratamentoAutomatizado({ medications }: { medications: Medication[] }) {
  const [running, setRunning] = useState(false);
  const [records, setRecords] = useState<AutoTreatRecord[]>([]);
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [treatType, setTreatType] = useState("Vacinação");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [performedBy, setPerformedBy] = useState("");

  const activeReaders = mockReaders.filter(r => r.active);

  useEffect(() => {
    const unsub = subscribeDeviceEvents((event: DeviceEvent) => {
      if (!running) return;
      if (event.type !== "rfid_read") return;

      const tag = event.value;
      const animal = mockAnimals.find(a => a.ear_tag === tag);
      setCurrentTag(tag);

      if (selectedMeds.length === 0) {
        toast({ title: `🏷️ ${tag}`, description: "Selecione os medicamentos antes de iniciar", variant: "destructive" });
        return;
      }

      const medNames = selectedMeds.map(id => medications.find(m => m.id === id)?.name || "").filter(Boolean);

      const record: AutoTreatRecord = {
        earTag: tag,
        animalName: animal?.name || "Desconhecido",
        medications: medNames,
        timestamp: new Date(),
      };

      setRecords(prev => [record, ...prev]);
      toast({ title: `💉 Tratamento aplicado`, description: `${tag} — ${animal?.name || ""}: ${medNames.join(", ")}` });

      setTimeout(() => setCurrentTag(null), 2000);
    });

    return unsub;
  }, [running, selectedMeds, medications]);

  const handleStart = () => {
    if (activeReaders.length === 0) {
      toast({ title: "Configure um leitor RFID primeiro", variant: "destructive" });
      return;
    }
    if (selectedMeds.length === 0) {
      toast({ title: "Selecione pelo menos um medicamento", variant: "destructive" });
      return;
    }
    startSimulation();
    setRunning(true);
  };

  const handleStop = () => {
    stopSimulation();
    setRunning(false);
  };

  const toggleMed = (id: string) => {
    setSelectedMeds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" /> Tratamento Automatizado por RFID
            </h3>
            {!running ? (
              <Button onClick={handleStart} className="gap-2"><Play className="h-4 w-4" /> Iniciar</Button>
            ) : (
              <Button onClick={handleStop} variant="destructive" className="gap-2"><Square className="h-4 w-4" /> Parar</Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de tratamento</Label>
              <Select value={treatType} onValueChange={setTreatType}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Vacinação", "Vermifugação", "Antibiótico", "Vitamina/Suplemento", "Carrapaticida"].map(t =>
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aplicado por</Label>
              <Select value={performedBy} onValueChange={setPerformedBy}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["João", "Carlos", "Maria", "Dr. Silva", "Pedro", "Ana"].map(w =>
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Medicamentos a aplicar (clique para selecionar)</Label>
            <div className="flex flex-wrap gap-2">
              {medications.filter(m => m.active).map(m => (
                <Badge
                  key={m.id}
                  variant={selectedMeds.includes(m.id) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleMed(m.id)}
                >
                  {selectedMeds.includes(m.id) && <Check className="h-3 w-3 mr-1" />}
                  {m.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live indicator */}
      {running && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-sm font-medium">Aguardando leitura RFID — passe o animal pelo leitor...</span>
            </div>
            {currentTag && <span className="font-mono font-bold text-primary text-lg">{currentTag}</span>}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {records.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tratamentos Aplicados ({records.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Brinco</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Medicamentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{r.timestamp.toLocaleTimeString("pt-BR")}</TableCell>
                    <TableCell className="font-mono font-semibold text-primary">{r.earTag}</TableCell>
                    <TableCell>{r.animalName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.medications.map((m, j) => <Badge key={j} variant="secondary" className="text-[10px]">{m}</Badge>)}
                      </div>
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


interface MedItem {
  medication_id: string;
  dose_value: string;
  dose_unit: string;
  route: string;
  withdrawal_days: number;
  notes: string;
  debit_stock: boolean;
}

function NovoTratamento({ medications }: { medications: Medication[] }) {
  const activeAnimals = useMemo(() => mockAnimals.filter((a) => a.current_status === "ativo"), []);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [treatType, setTreatType] = useState("Vacinação");
  const [paddock, setPaddock] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [medItems, setMedItems] = useState<MedItem[]>([
    { medication_id: "", dose_value: "", dose_unit: "ml", route: "IM", withdrawal_days: 0, notes: "", debit_stock: false },
  ]);
  const [saved, setSaved] = useState(false);
  const [medScanIdx, setMedScanIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return activeAnimals.filter((a) => a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, activeAnimals]);

  const selected = useMemo(() => activeAnimals.find((a) => a.id === selectedId), [selectedId, activeAnimals]);

  const lastTreatment = useMemo(() => {
    if (!selected) return null;
    const ts = mockTreatments.filter((t) => t.animal_id === selected.id).sort((a, b) => b.date.localeCompare(a.date));
    return ts[0] ?? null;
  }, [selected]);

  const addMedItem = () => setMedItems((prev) => [...prev, { medication_id: "", dose_value: "", dose_unit: "ml", route: "IM", withdrawal_days: 0, notes: "", debit_stock: false }]);
  const removeMedItem = (idx: number) => setMedItems((prev) => prev.filter((_, i) => i !== idx));
  const updateMedItem = (idx: number, field: keyof MedItem, val: string | number | boolean) => {
    setMedItems((prev) => prev.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [field]: val };
      if (field === "medication_id") {
        const med = medications.find((x) => x.id === val);
        if (med) {
          updated.withdrawal_days = med.withdrawal_days_meat;
          updated.dose_unit = med.default_unit;
        }
      }
      return updated;
    }));
  };

  const toggleSymptom = (s: string) => setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const maxWithdrawal = Math.max(0, ...medItems.map((m) => m.withdrawal_days));
  const releaseDate = maxWithdrawal > 0 ? new Date(new Date(date).getTime() + maxWithdrawal * 86400000).toISOString().slice(0, 10) : null;

  const handleSave = () => {
    if (!selected) { toast({ title: "Selecione um animal", variant: "destructive" }); return; }
    if (!medItems.some((m) => m.medication_id)) { toast({ title: "Adicione pelo menos um medicamento", variant: "destructive" }); return; }
    setSaved(true);
    toast({ title: "Tratamento registrado!", description: `${selected.ear_tag} — ${treatType}` });
  };

  const handleNext = () => {
    setSelectedId(""); setSearch(""); setSaved(false);
    setMedItems([{ medication_id: "", dose_value: "", dose_unit: "ml", route: "IM", withdrawal_days: 0, notes: "", debit_stock: false }]);
    setDiagnosis(""); setTemperature(""); setSymptoms([]); setGeneralNotes("");
  };

  if (saved && selected) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-3">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2"><Check className="h-5 w-5" /> Tratamento Registrado</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Animal</p><p className="font-semibold">{selected.ear_tag} — {selected.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-semibold">{treatType}</p></div>
            <div><p className="text-xs text-muted-foreground">Medicamentos</p><p className="font-semibold">{medItems.filter((m) => m.medication_id).map((m) => medications.find((x) => x.id === m.medication_id)?.name).join(", ")}</p></div>
            {releaseDate && <div><p className="text-xs text-muted-foreground">Carência até</p><p className="font-semibold text-amber-600">{releaseDate} ({maxWithdrawal} dias)</p></div>}
          </div>
          <Button onClick={handleNext} className="gap-2"><Plus className="h-4 w-4" /> Tratar próximo animal</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Novo Tratamento Individual</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Animal search */}
          <div className="space-y-2">
            <Label>Animal (busca por brinco ou nome)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }} placeholder="Digite o brinco ou nome..." className="pl-9" />
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

          {selected && (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">{selected.name[0]}</div>
              <div className="flex-1 text-sm space-y-0.5">
                <p className="font-semibold">{selected.ear_tag} — {selected.name}</p>
                <p className="text-muted-foreground">{selected.breed} • {selected.paddock} • {selected.current_weight} kg</p>
                {lastTreatment && <p className="text-muted-foreground">Último: {lastTreatment.type} — {lastTreatment.medication} em {lastTreatment.date}</p>}
              </div>
              <Badge variant="outline" className={categoryColor[calcAnimalCategory(selected)]}>{categoryLabel[calcAnimalCategory(selected)]}</Badge>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tipo de tratamento</Label>
              <Select value={treatType} onValueChange={setTreatType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{treatmentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pasto</Label>
              <Select value={paddock} onValueChange={setPaddock}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Aplicado por</Label>
              <Select value={performedBy} onValueChange={setPerformedBy}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Medicamentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Medicamentos Utilizados</Label>
              <Button variant="outline" size="sm" onClick={addMedItem} className="gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar</Button>
            </div>
            {medItems.map((item, idx) => (
              <Card key={idx} className="bg-muted/20">
                <CardContent className="p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-muted-foreground">Medicamento {idx + 1}</p>
                    {medItems.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeMedItem(idx)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Medicamento</Label>
                      <div className="flex gap-1">
                        <Select value={item.medication_id} onValueChange={(v) => updateMedItem(idx, "medication_id", v)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                          <SelectContent>
                            {medications.filter((m) => m.active).map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name} ({m.active_ingredient})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ScanButton onClick={() => setMedScanIdx(idx)} className="h-9 w-9" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dose</Label>
                      <div className="flex gap-1">
                        <Input type="number" value={item.dose_value} onChange={(e) => updateMedItem(idx, "dose_value", e.target.value)} className="h-9 text-sm w-20" placeholder="0" />
                        <Select value={item.dose_unit} onValueChange={(v) => updateMedItem(idx, "dose_unit", v)}>
                          <SelectTrigger className="h-9 text-sm w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="mg">mg</SelectItem>
                            <SelectItem value="comprimido">comprimido</SelectItem>
                            <SelectItem value="dose">dose</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Via de aplicação</Label>
                      <Select value={item.route} onValueChange={(v) => updateMedItem(idx, "route", v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{applicationRoutes.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Carência (dias)</Label>
                      <Input type="number" value={item.withdrawal_days} onChange={(e) => updateMedItem(idx, "withdrawal_days", Number(e.target.value))} className="h-9 text-sm" />
                      {item.withdrawal_days > 0 && (
                        <p className="text-[10px] text-amber-600">Liberação: {new Date(new Date(date).getTime() + item.withdrawal_days * 86400000).toLocaleDateString("pt-BR")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={item.debit_stock} onCheckedChange={(v) => updateMedItem(idx, "debit_stock", v)} />
                    <Label className="text-xs">Baixar do estoque</Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Diagnóstico / Motivo</Label>
              <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="Motivo do tratamento..." />
            </div>
            <div className="space-y-1">
              <Label>Temperatura (°C)</Label>
              <Input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="38.5" step="0.1" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Sintomas observados</Label>
            <div className="flex flex-wrap gap-2">
              {symptomsList.map((s) => (
                <Badge key={s} variant={symptoms.includes(s) ? "default" : "outline"}
                  className={`cursor-pointer ${symptoms.includes(s) ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => toggleSymptom(s)}>{s}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Observações gerais</Label>
            <Textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={2} placeholder="Notas adicionais..." />
          </div>

          {releaseDate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-300">Animal ficará em carência até <strong>{releaseDate}</strong> ({maxWithdrawal} dias)</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!selectedId} className="gap-2"><Check className="h-4 w-4" /> Salvar Tratamento</Button>
          </div>
        </CardContent>
      </Card>

      <BarcodeScanner
        open={medScanIdx !== null}
        onOpenChange={(v) => { if (!v) setMedScanIdx(null); }}
        onScan={(code) => {
          const med = medications.find(m => m.name === code || m.mapa_registro === code || m.id === code);
          if (med) {
            updateMedItem(medScanIdx!, "medication_id", med.id);
            toast({ title: `Medicamento: ${med.name}` });
          } else {
            toast({ title: "Medicamento não cadastrado", description: code, variant: "destructive" });
          }
          setMedScanIdx(null);
        }}
        title="Escanear Medicamento"
        description="Aponte para o código de barras da embalagem"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 2 — TRATAMENTO EM LOTE
   ═══════════════════════════════════════════════════════════════ */
function TratamentoLote({ medications }: { medications: Medication[] }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [treatType, setTreatType] = useState("Vacinação");
  const [paddock, setPaddock] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [medId, setMedId] = useState("");
  const [doseValue, setDoseValue] = useState("");
  const [doseUnit, setDoseUnit] = useState("ml");
  const [route, setRoute] = useState("IM");
  const [selectedAnimals, setSelectedAnimals] = useState<Set<string>>(new Set());
  const [searchAdd, setSearchAdd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const animalsInPaddock = useMemo(
    () => mockAnimals.filter((a) => a.current_status === "ativo" && (paddock ? a.paddock === paddock : true)),
    [paddock],
  );

  const categories = useMemo(() => {
    const cats = new Set<AnimalCategory>();
    animalsInPaddock.forEach((a) => cats.add(calcAnimalCategory(a)));
    return Array.from(cats);
  }, [animalsInPaddock]);

  const displayedAnimals = useMemo(() => {
    let list = animalsInPaddock;
    if (categoryFilter !== "all") list = list.filter((a) => calcAnimalCategory(a) === categoryFilter);
    if (searchAdd) {
      const q = searchAdd.toLowerCase();
      list = list.filter((a) => a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    return list;
  }, [animalsInPaddock, categoryFilter, searchAdd]);

  const selectedMed = medications.find((m) => m.id === medId);
  const withdrawalDays = selectedMed?.withdrawal_days_meat ?? 0;

  const toggleAnimal = (id: string) => setSelectedAnimals((prev) => {
    const next = new Set(prev);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    return next;
  });
  const selectAll = () => setSelectedAnimals(new Set(displayedAnimals.map((a) => a.id)));
  const deselectAll = () => setSelectedAnimals(new Set());

  const goStep2 = () => {
    if (!treatType) { toast({ title: "Selecione tipo de tratamento", variant: "destructive" }); return; }
    if (!medId) { toast({ title: "Selecione um medicamento", variant: "destructive" }); return; }
    setStep(2);
  };

  const handleConfirm = () => {
    toast({ title: "Tratamento em lote aplicado!", description: `${selectedAnimals.size} animais tratados` });
    setStep(1); setSelectedAnimals(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <Badge variant={step >= s ? "default" : "outline"} className={step >= s ? "bg-primary text-primary-foreground" : ""}>{s}</Badge>
            <span className={step >= s ? "font-medium text-foreground" : "text-muted-foreground"}>
              {s === 1 ? "Configuração" : s === 2 ? "Seleção" : "Confirmação"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Configuração do Tratamento em Lote</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={treatType} onValueChange={setTreatType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{treatmentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Pasto</Label>
                <Select value={paddock} onValueChange={setPaddock}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os pastos</SelectItem>
                    {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Aplicado por</Label>
                <Select value={performedBy} onValueChange={setPerformedBy}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{workers.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Medicamento</Label>
                <Select value={medId} onValueChange={(v) => { setMedId(v); const m = medications.find((x) => x.id === v); if (m) setDoseUnit(m.default_unit); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {medications.filter((m) => m.active).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Dose por animal</Label>
                <div className="flex gap-1">
                  <Input type="number" value={doseValue} onChange={(e) => setDoseValue(e.target.value)} className="w-20" placeholder="0" />
                  <Select value={doseUnit} onValueChange={setDoseUnit}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem><SelectItem value="mg">mg</SelectItem>
                      <SelectItem value="comprimido">comp.</SelectItem><SelectItem value="dose">dose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Via de aplicação</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{applicationRoutes.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {withdrawalDays > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-800 dark:text-amber-300">Carência: {withdrawalDays} dias (abate) / {selectedMed?.withdrawal_days_milk ?? 0} dias (leite)</span>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={goStep2} disabled={!medId}>Selecionar Animais <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <Input value={searchAdd} onChange={(e) => setSearchAdd(e.target.value)} placeholder="Brinco ou nome" className="w-40 h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>Selecionar todos</Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>Limpar</Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead><TableHead className="text-right">Peso</TableHead>
                    <TableHead>Última aplicação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedAnimals.map((a) => {
                    const checked = selectedAnimals.has(a.id);
                    const lastT = mockTreatments.filter((t) => t.animal_id === a.id).sort((x, y) => y.date.localeCompare(x.date))[0];
                    const cat = calcAnimalCategory(a);
                    return (
                      <TableRow key={a.id} className={checked ? "bg-primary/5" : ""}>
                        <TableCell><Checkbox checked={checked} onCheckedChange={() => toggleAnimal(a.id)} /></TableCell>
                        <TableCell className="font-mono font-semibold text-primary">{a.ear_tag}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-xs ${categoryColor[cat]}`}>{categoryLabel[cat]}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{a.current_weight} kg</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lastT ? `${lastT.medication} — ${lastT.date}` : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground text-center">{selectedAnimals.size} de {displayedAnimals.length} animais selecionados</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => setStep(3)} disabled={selectedAnimals.size === 0}>Revisar ({selectedAnimals.size}) <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Confirmação — Tratamento em Lote</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{date}</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-medium">{treatType}</p></div>
                <div><p className="text-xs text-muted-foreground">Medicamento</p><p className="font-medium">{selectedMed?.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Animais</p><p className="font-medium text-primary">{selectedAnimals.size}</p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Dose por animal</p><p className="font-mono">{doseValue} {doseUnit}</p></div>
                <div><p className="text-xs text-muted-foreground">Total necessário</p><p className="font-mono font-semibold">{(parseFloat(doseValue || "0") * selectedAnimals.size).toFixed(1)} {doseUnit}</p></div>
                {withdrawalDays > 0 && <div><p className="text-xs text-muted-foreground">Carência</p><p className="font-semibold text-amber-600">{withdrawalDays} dias</p></div>}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button onClick={handleConfirm} className="gap-2"><Check className="h-4 w-4" /> Aplicar em {selectedAnimals.size} animais</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 3 — HISTÓRICO SANITÁRIO
   ═══════════════════════════════════════════════════════════════ */
function HistoricoSanitario({ medications }: { medications: Medication[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paddockFilter, setPaddockFilter] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const enriched = useMemo(() => {
    return [...mockTreatments].sort((a, b) => b.date.localeCompare(a.date)).map((t) => {
      const animal = mockAnimals.find((a) => a.id === t.animal_id);
      const withdrawalEnd = t.withdrawal_days > 0 ? new Date(new Date(t.date).getTime() + t.withdrawal_days * 86400000).toISOString().slice(0, 10) : null;
      const inWithdrawal = withdrawalEnd ? new Date(withdrawalEnd) > new Date() : false;
      return { ...t, animal, withdrawalEnd, inWithdrawal };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((t) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!t.animal?.ear_tag.toLowerCase().includes(q) && !t.animal?.name.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (paddockFilter !== "all" && t.animal?.paddock !== paddockFilter) return false;
      if (periodFrom && t.date < periodFrom) return false;
      if (periodTo && t.date > periodTo) return false;
      return true;
    });
  }, [enriched, searchTerm, typeFilter, paddockFilter, periodFrom, periodTo]);

  const animalsInWithdrawal = enriched.filter((t) => t.inWithdrawal);
  const uniqueWithdrawalAnimals = new Set(animalsInWithdrawal.map((t) => t.animal_id));
  const mostUsedMed = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((t) => { counts[t.medication] = (counts[t.medication] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? null;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total tratamentos</p>
          <p className="text-xl font-bold text-primary">{filtered.length}</p>
        </CardContent></Card>
        <Card className={uniqueWithdrawalAnimals.size > 0 ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Animais em carência</p>
            <p className={`text-xl font-bold ${uniqueWithdrawalAnimals.size > 0 ? "text-amber-600" : ""}`}>{uniqueWithdrawalAnimals.size}</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Mais utilizado</p>
          <p className="text-sm font-bold">{mostUsedMed?.[0] ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{mostUsedMed?.[1] ?? 0}x</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Tipos no período</p>
          <p className="text-xl font-bold">{new Set(filtered.map((t) => t.type)).size}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Buscar animal</Label>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Brinco ou nome" className="w-40 h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="vacina">Vacina</SelectItem>
              <SelectItem value="vermifugo">Vermífugo</SelectItem>
              <SelectItem value="antibiotico">Antibiótico</SelectItem>
              <SelectItem value="anti-inflamatorio">Anti-inflamatório</SelectItem>
            </SelectContent>
          </Select>
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
          <Label className="text-xs">De</Label>
          <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="w-36 h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="w-36 h-9 text-sm" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Brinco</TableHead><TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead><TableHead>Medicamento</TableHead><TableHead>Dose</TableHead>
                <TableHead>Via</TableHead><TableHead>Carência até</TableHead><TableHead>Aplicado por</TableHead>
                <TableHead>Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className={t.inWithdrawal ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                  <TableCell className="text-sm">{t.date}</TableCell>
                  <TableCell className="font-mono font-semibold text-primary">{t.animal?.ear_tag}</TableCell>
                  <TableCell>{t.animal?.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{t.type}</Badge></TableCell>
                  <TableCell className="text-sm">{t.medication}</TableCell>
                  <TableCell className="font-mono text-xs">{t.dose}</TableCell>
                  <TableCell className="text-xs">{t.route}</TableCell>
                  <TableCell className="text-xs">
                    {t.withdrawalEnd ? (
                      <span className={t.inWithdrawal ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
                        {t.withdrawalEnd} {t.inWithdrawal && "⏰"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{t.applied_by}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{t.notes || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum tratamento encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 4 — CALENDÁRIO VACINAL
   ═══════════════════════════════════════════════════════════════ */
function CalendarioVacinal({ protocols, setProtocols, medications }: {
  protocols: VaccineProtocol[];
  setProtocols: React.Dispatch<React.SetStateAction<VaccineProtocol[]>>;
  medications: Medication[];
}) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMedId, setNewMedId] = useState("");
  const [newFreq, setNewFreq] = useState<VaccineProtocol["frequency"]>("anual");
  const [newMonths, setNewMonths] = useState<number[]>([]);
  const [newTarget, setNewTarget] = useState("Todos bovinos");
  const [newNotes, setNewNotes] = useState("");

  const currentMonth = new Date().getMonth() + 1;

  const protocolsByMonth = useMemo(() => {
    const map: Record<number, VaccineProtocol[]> = {};
    for (let m = 1; m <= 12; m++) map[m] = [];
    protocols.forEach((p) => p.months.forEach((m) => { if (map[m]) map[m].push(p); }));
    return map;
  }, [protocols]);

  const toggleNewMonth = (m: number) => setNewMonths((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const handleAddProtocol = () => {
    if (!newName || newMonths.length === 0) { toast({ title: "Preencha nome e meses", variant: "destructive" }); return; }
    const p: VaccineProtocol = {
      id: `vp-${Date.now()}`, name: newName, medication_id: newMedId, frequency: newFreq,
      months: newMonths, target_category: newTarget, notes: newNotes,
    };
    setProtocols((prev) => [...prev, p]);
    setShowAdd(false);
    setNewName(""); setNewMedId(""); setNewMonths([]); setNewTarget("Todos bovinos"); setNewNotes("");
    toast({ title: "Protocolo adicionado!" });
  };

  const removeProtocol = (id: string) => setProtocols((prev) => prev.filter((p) => p.id !== id));

  // Calculate upcoming alerts
  const upcomingAlerts = useMemo(() => {
    const alerts: { protocol: VaccineProtocol; daysUntil: number }[] = [];
    const now = new Date();
    protocols.forEach((p) => {
      p.months.forEach((m) => {
        const target = new Date(now.getFullYear(), m - 1, 1);
        if (target < now) target.setFullYear(target.getFullYear() + 1);
        const daysUntil = Math.round((target.getTime() - now.getTime()) / 86400000);
        if (daysUntil <= 30) alerts.push({ protocol: p, daysUntil });
      });
    });
    return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [protocols]);

  const bovineCount = mockAnimals.filter((a) => a.species === "bovino" && a.current_status === "ativo").length;

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {upcomingAlerts.length > 0 && (
        <div className="space-y-2">
          {upcomingAlerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>{a.protocol.name}</strong> vence em {a.daysUntil} dias — ~{bovineCount} animais precisam ser vacinados
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Calendário Vacinal Anual</h3>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Novo Protocolo</Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const protos = protocolsByMonth[m];
          const isCurrent = m === currentMonth;
          return (
            <Card key={m}
              className={`cursor-pointer transition-all hover:shadow-md ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""} ${selectedMonth === m ? "bg-primary/5" : ""}`}
              onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}>
              <CardContent className="p-3">
                <p className={`text-sm font-semibold mb-1 ${isCurrent ? "text-primary" : ""}`}>{monthNames[m - 1]}</p>
                {protos.length > 0 ? (
                  <div className="space-y-1">
                    {protos.map((p) => (
                      <Badge key={p.id} variant="outline" className="text-[10px] block truncate bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-300">{p.name}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Sem vacinas</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected month detail */}
      {selectedMonth && (
        <Card>
          <CardHeader><CardTitle className="text-base">Vacinas programadas — {monthNames[selectedMonth - 1]}</CardTitle></CardHeader>
          <CardContent>
            {protocolsByMonth[selectedMonth].length > 0 ? (
              <div className="space-y-3">
                {protocolsByMonth[selectedMonth].map((p) => {
                  const med = medications.find((m) => m.id === p.medication_id);
                  return (
                    <div key={p.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="space-y-0.5">
                        <p className="font-semibold">{p.name}</p>
                        {med && <p className="text-xs text-muted-foreground">{med.name} — {med.active_ingredient}</p>}
                        <p className="text-xs text-muted-foreground">Alvo: {p.target_category} • Frequência: {p.frequency}</p>
                        {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeProtocol(p.id)} className="text-destructive h-7 w-7 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma vacina programada para este mês.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Protocols list */}
      <Card>
        <CardHeader><CardTitle className="text-base">Protocolos cadastrados</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Frequência</TableHead>
                <TableHead>Meses</TableHead><TableHead>Alvo</TableHead><TableHead>Obs.</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {protocols.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell className="capitalize text-sm">{p.frequency}</TableCell>
                  <TableCell>{p.months.map((m) => monthNames[m - 1]).join(", ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.target_category}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => removeProtocol(p.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add protocol dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Protocolo Vacinal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome da vacina/protocolo</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Febre Aftosa" /></div>
            <div className="space-y-1">
              <Label>Medicamento vinculado</Label>
              <Select value={newMedId} onValueChange={setNewMedId}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{medications.filter((m) => m.active).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Frequência</Label>
              <Select value={newFreq} onValueChange={(v) => setNewFreq(v as VaccineProtocol["frequency"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="personalizada">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Meses de aplicação</Label>
              <div className="flex flex-wrap gap-1.5">
                {monthNames.map((m, i) => (
                  <Badge key={i} variant={newMonths.includes(i + 1) ? "default" : "outline"}
                    className={`cursor-pointer ${newMonths.includes(i + 1) ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => toggleNewMonth(i + 1)}>{m}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label>Categoria alvo</Label><Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="Ex: Todos bovinos" /></div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAddProtocol}>Salvar Protocolo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ABA 5 — MEDICAMENTOS
   ═══════════════════════════════════════════════════════════════ */
function MedicamentosTab({ medications, setMedications }: {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<MedType>("vacina");
  const [fIngredient, setFIngredient] = useState("");
  const [fConcentration, setFConcentration] = useState("");
  const [fUnit, setFUnit] = useState("ml");
  const [fWithdrawalMeat, setFWithdrawalMeat] = useState(0);
  const [fWithdrawalMilk, setFWithdrawalMilk] = useState(0);
  const [fManufacturer, setFManufacturer] = useState("");
  const [fMapa, setFMapa] = useState("");
  const [fActive, setFActive] = useState(true);
  const [fNotes, setFNotes] = useState("");

  const filtered = useMemo(() => {
    return medications.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.active_ingredient.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      return true;
    });
  }, [medications, search, typeFilter]);

  const clearForm = () => {
    setFName(""); setFType("vacina"); setFIngredient(""); setFConcentration("");
    setFUnit("ml"); setFWithdrawalMeat(0); setFWithdrawalMilk(0);
    setFManufacturer(""); setFMapa(""); setFActive(true); setFNotes("");
  };

  const openEdit = (m: Medication) => {
    setEditId(m.id); setFName(m.name); setFType(m.type); setFIngredient(m.active_ingredient);
    setFConcentration(m.concentration); setFUnit(m.default_unit);
    setFWithdrawalMeat(m.withdrawal_days_meat); setFWithdrawalMilk(m.withdrawal_days_milk);
    setFManufacturer(m.manufacturer); setFMapa(m.mapa_registro); setFActive(m.active); setFNotes(m.notes);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!fName) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    const med: Medication = {
      id: editId || `med-${Date.now()}`, name: fName, type: fType, active_ingredient: fIngredient,
      concentration: fConcentration, default_unit: fUnit, withdrawal_days_meat: fWithdrawalMeat,
      withdrawal_days_milk: fWithdrawalMilk, manufacturer: fManufacturer, mapa_registro: fMapa,
      active: fActive, notes: fNotes,
    };
    if (editId) {
      setMedications((prev) => prev.map((m) => m.id === editId ? med : m));
    } else {
      setMedications((prev) => [...prev, med]);
    }
    setShowAdd(false); setEditId(null); clearForm();
    toast({ title: editId ? "Medicamento atualizado!" : "Medicamento cadastrado!" });
  };

  const removeMed = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Medicamento removido" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Buscar</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou princípio ativo" className="w-52 h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(Object.keys(medTypeLabels) as MedType[]).map((t) => <SelectItem key={t} value={t}>{medTypeLabels[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button size="sm" onClick={() => { clearForm(); setEditId(null); setShowAdd(true); }} className="gap-1"><Plus className="h-3.5 w-3.5" /> Novo Medicamento</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Princípio Ativo</TableHead>
                <TableHead>Concentração</TableHead><TableHead className="text-right">Carência Abate</TableHead>
                <TableHead className="text-right">Carência Leite</TableHead><TableHead>Fabricante</TableHead>
                <TableHead>Status</TableHead><TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} className={!m.active ? "opacity-50" : ""}>
                  <TableCell className="font-semibold">{m.name}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-xs ${medTypeColors[m.type]}`}>{medTypeLabels[m.type]}</Badge></TableCell>
                  <TableCell className="text-sm">{m.active_ingredient}</TableCell>
                  <TableCell className="text-sm font-mono">{m.concentration}</TableCell>
                  <TableCell className="text-right font-mono">{m.withdrawal_days_meat}d</TableCell>
                  <TableCell className="text-right font-mono">{m.withdrawal_days_milk}d</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.manufacturer}</TableCell>
                  <TableCell>
                    <Badge variant={m.active ? "default" : "secondary"} className={`text-xs ${m.active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : ""}`}>
                      {m.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="h-7 w-7 p-0"><Stethoscope className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeMed(m.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum medicamento encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Medicamento" : "Novo Medicamento"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={fName} onChange={(e) => setFName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={fType} onValueChange={(v) => setFType(v as MedType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(medTypeLabels) as MedType[]).map((t) => <SelectItem key={t} value={t}>{medTypeLabels[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Unidade padrão</Label>
                <Select value={fUnit} onValueChange={setFUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem><SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="comprimido">comprimido</SelectItem><SelectItem value="dose">dose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Princípio ativo</Label><Input value={fIngredient} onChange={(e) => setFIngredient(e.target.value)} /></div>
            <div className="space-y-1"><Label>Concentração</Label><Input value={fConcentration} onChange={(e) => setFConcentration(e.target.value)} placeholder="Ex: 50mg/ml" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Carência abate (dias)</Label><Input type="number" value={fWithdrawalMeat} onChange={(e) => setFWithdrawalMeat(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Carência leite (dias)</Label><Input type="number" value={fWithdrawalMilk} onChange={(e) => setFWithdrawalMilk(Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Fabricante</Label><Input value={fManufacturer} onChange={(e) => setFManufacturer(e.target.value)} /></div>
              <div className="space-y-1"><Label>Registro MAPA</Label><Input value={fMapa} onChange={(e) => setFMapa(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={fActive} onCheckedChange={setFActive} />
              <Label>Medicamento ativo</Label>
            </div>
            <div className="space-y-1"><Label>Observações / Contraindicações</Label><Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editId ? "Salvar Alterações" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
