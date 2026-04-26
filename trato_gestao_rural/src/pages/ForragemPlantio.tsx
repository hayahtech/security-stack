import { useState } from "react";
import { format } from "date-fns";
import {
  Leaf, Plus, Calendar, ArrowRightLeft, Sprout, Bug, Droplets,
  CheckCircle2, Clock, AlertTriangle, Ruler, TrendingUp,
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
  mockGrazingCycles, mockPlantingRecords, getPastureForageStatuses, getRotationCalendar,
  grassTypes, plantingOperations,
  type GrazingCycle, type PlantingRecord, type PlantingOperation, type PastureForageStatus,
} from "@/data/forragem-mock";

const pastureOptions = [
  { id: "pas-1", name: "Pasto Norte" },
  { id: "pas-2", name: "Pasto Sul" },
  { id: "pas-3", name: "Pasto Leste" },
  { id: "pas-4", name: "Pasto Grande" },
  { id: "pas-5", name: "Piquete Maternidade" },
];

const statusConfig = {
  em_uso: { label: "Em uso", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertTriangle },
  descansando: { label: "Descansando", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Clock },
  pronto: { label: "Pronto", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
};

const operationIcons: Record<PlantingOperation, React.ElementType> = {
  "Plantio": Sprout, "Reforma": ArrowRightLeft, "Adubação": Droplets,
  "Calagem": Droplets, "Controle de pragas": Bug,
};

function DatePicker({ value, onChange, label }: { value?: Date; onChange: (d?: Date) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <Calendar className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : "Selecionar data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────
function ForageDashboard({ statuses }: { statuses: PastureForageStatus[] }) {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["em_uso", "descansando", "pronto"] as const).map((s) => {
          const count = statuses.filter((p) => p.status === s).length;
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <Card key={s} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${cfg.bg}`}><Icon className={`h-5 w-5 ${cfg.color}`} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pasture map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((p) => {
          const cfg = statusConfig[p.status];
          const Icon = cfg.icon;
          return (
            <Card key={p.pastureId} className={`border-2 ${cfg.border}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{p.pastureName}</h3>
                  <Badge variant="outline" className={`gap-1 ${cfg.color} ${cfg.bg} border-transparent`}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.grassType}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Descanso</p>
                    <p className="text-sm font-bold text-foreground">{p.status === "em_uso" ? "—" : `${p.restDays}d`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ideal</p>
                    <p className="text-sm font-bold text-foreground">{p.idealDays}d</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Altura est.</p>
                    <p className="text-sm font-bold text-foreground">{p.estimatedHeight} cm</p>
                  </div>
                </div>
                {p.status !== "em_uso" && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso do descanso</span>
                      <span>{Math.min(100, Math.round((p.restDays / p.idealDays) * 100))}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.remainingDays <= 0 ? "bg-emerald-500" : p.remainingDays <= 7 ? "bg-yellow-500" : "bg-muted-foreground/30"
                        }`}
                        style={{ width: `${Math.min(100, (p.restDays / p.idealDays) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {p.nextEntryDate && p.status !== "em_uso" && (
                  <p className="text-xs text-muted-foreground">
                    Próx. entrada: {new Date(p.nextEntryDate).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Resumo de Pastos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pasto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Dias descanso</TableHead>
                <TableHead className="text-right">Altura est.</TableHead>
                <TableHead>Próx. entrada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((p) => {
                const cfg = statusConfig[p.status];
                return (
                  <TableRow key={p.pastureId}>
                    <TableCell className="font-medium">{p.pastureName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${cfg.color} ${cfg.bg} border-transparent`}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{p.status === "em_uso" ? "—" : p.restDays}</TableCell>
                    <TableCell className="text-right font-mono">{p.estimatedHeight} cm</TableCell>
                    <TableCell>{p.nextEntryDate ? new Date(p.nextEntryDate).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Grazing Cycles Tab ─────────────────────────────────────
function GrazingCyclesTab() {
  const [cycles, setCycles] = useState<GrazingCycle[]>(mockGrazingCycles);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    pastureId: "", grassType: "Braquiária", entryDate: undefined as Date | undefined,
    exitDate: undefined as Date | undefined, entryHeight: "", exitHeight: "",
    stockingRate: "", notes: "",
  });

  const handleSave = () => {
    if (!form.pastureId || !form.entryDate) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const pasture = pastureOptions.find((p) => p.id === form.pastureId);
    const newCycle: GrazingCycle = {
      id: `gc${Date.now()}`, pastureId: form.pastureId, pastureName: pasture?.name || "",
      grassType: form.grassType, entryDate: form.entryDate.toISOString().slice(0, 10),
      exitDate: form.exitDate ? form.exitDate.toISOString().slice(0, 10) : undefined,
      entryHeight: Number(form.entryHeight) || 0, exitHeight: form.exitHeight ? Number(form.exitHeight) : undefined,
      stockingRate: Number(form.stockingRate) || 0, notes: form.notes || undefined,
    };
    setCycles((prev) => [newCycle, ...prev]);
    setForm({ pastureId: "", grassType: "Braquiária", entryDate: undefined, exitDate: undefined, entryHeight: "", exitHeight: "", stockingRate: "", notes: "" });
    setOpen(false);
    toast({ title: "Ciclo registrado!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Ciclo</Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pasto</TableHead>
                <TableHead>Capim</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead className="text-right">Alt. entrada</TableHead>
                <TableHead className="text-right">Alt. saída</TableHead>
                <TableHead className="text-right">Lotação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.sort((a, b) => b.entryDate.localeCompare(a.entryDate)).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.pastureName}</TableCell>
                  <TableCell>{c.grassType}</TableCell>
                  <TableCell>{new Date(c.entryDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{c.exitDate ? new Date(c.exitDate).toLocaleDateString("pt-BR") : <Badge variant="outline" className="text-destructive bg-destructive/10 border-transparent">Em uso</Badge>}</TableCell>
                  <TableCell className="text-right font-mono">{c.entryHeight} cm</TableCell>
                  <TableCell className="text-right font-mono">{c.exitHeight ? `${c.exitHeight} cm` : "—"}</TableCell>
                  <TableCell className="text-right font-mono">{c.stockingRate} UA/ha</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Ciclo de Pastejo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Pasto *</Label>
                <Select value={form.pastureId} onValueChange={(v) => setForm({ ...form, pastureId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{pastureOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipo de capim</Label>
                <Select value={form.grassType} onValueChange={(v) => setForm({ ...form, grassType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{grassTypes.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Data de entrada *" value={form.entryDate} onChange={(d) => setForm({ ...form, entryDate: d })} />
              <DatePicker label="Data de saída" value={form.exitDate} onChange={(d) => setForm({ ...form, exitDate: d })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Altura entrada (cm)</Label><Input type="number" value={form.entryHeight} onChange={(e) => setForm({ ...form, entryHeight: e.target.value })} /></div>
              <div className="space-y-1"><Label>Altura saída (cm)</Label><Input type="number" value={form.exitHeight} onChange={(e) => setForm({ ...form, exitHeight: e.target.value })} /></div>
              <div className="space-y-1"><Label>Lotação (UA/ha)</Label><Input type="number" step="0.1" value={form.stockingRate} onChange={(e) => setForm({ ...form, stockingRate: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Planting Tab ───────────────────────────────────────────
function PlantingTab() {
  const [records, setRecords] = useState<PlantingRecord[]>(mockPlantingRecords);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    pastureId: "", operation: "Adubação" as PlantingOperation, date: undefined as Date | undefined,
    inputs: "", cost: "", treatedArea: "", responsible: "", notes: "",
  });

  const handleSave = () => {
    if (!form.pastureId || !form.date) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    const pasture = pastureOptions.find((p) => p.id === form.pastureId);
    const newRecord: PlantingRecord = {
      id: `pr${Date.now()}`, pastureId: form.pastureId, pastureName: pasture?.name || "",
      operation: form.operation, date: form.date.toISOString().slice(0, 10),
      inputs: form.inputs ? form.inputs.split(",").map((s) => s.trim()) : [],
      cost: Number(form.cost) || 0, treatedArea: Number(form.treatedArea) || 0,
      responsible: form.responsible, notes: form.notes || undefined,
    };
    setRecords((prev) => [newRecord, ...prev]);
    setForm({ pastureId: "", operation: "Adubação", date: undefined, inputs: "", cost: "", treatedArea: "", responsible: "", notes: "" });
    setOpen(false);
    toast({ title: "Operação registrada!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Operação</Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pasto</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Insumos</TableHead>
                <TableHead className="text-right">Área (ha)</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.sort((a, b) => b.date.localeCompare(a.date)).map((r) => {
                const OpIcon = operationIcons[r.operation];
                return (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{r.pastureName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1"><OpIcon className="h-3 w-3" /> {r.operation}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-wrap gap-1">{r.inputs.map((inp, i) => <Badge key={i} variant="outline" className="text-xs">{inp}</Badge>)}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.treatedArea}</TableCell>
                    <TableCell className="text-right font-mono">R$ {r.cost.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{r.responsible}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Operação de Plantio/Reforma</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Pasto *</Label>
                <Select value={form.pastureId} onValueChange={(v) => setForm({ ...form, pastureId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>{pastureOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Operação *</Label>
                <Select value={form.operation} onValueChange={(v) => setForm({ ...form, operation: v as PlantingOperation })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{plantingOperations.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DatePicker label="Data *" value={form.date} onChange={(d) => setForm({ ...form, date: d })} />
            <div className="space-y-1"><Label>Insumos (separados por vírgula)</Label><Input value={form.inputs} onChange={(e) => setForm({ ...form, inputs: e.target.value })} placeholder="Ureia 200kg, Super fosfato 150kg" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Custo (R$)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div className="space-y-1"><Label>Área tratada (ha)</Label><Input type="number" step="0.1" value={form.treatedArea} onChange={(e) => setForm({ ...form, treatedArea: e.target.value })} /></div>
              <div className="space-y-1"><Label>Responsável</Label><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Rotation Calendar Tab ──────────────────────────────────
function RotationCalendarTab() {
  const weeks = getRotationCalendar();
  const calStatusConfig = {
    in_use: { label: "Em uso", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
    scheduled: { label: "Programado", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
    available: { label: "Disponível", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Planejamento de rotação para as próximas 8 semanas baseado no histórico de pastejo e tempos de descanso ideais.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {weeks.map((w, i) => {
          const cfg = calStatusConfig[w.status];
          return (
            <Card key={i} className={`border-2 ${cfg.border}`}>
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" /> Semana {i + 1}
                </p>
                <p className="text-sm font-bold text-foreground">{w.weekLabel}</p>
                {w.pastureName ? (
                  <Badge variant="outline" className={`${cfg.color} ${cfg.bg} border-transparent`}>
                    {w.pastureName}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Sem alocação</Badge>
                )}
                <p className={`text-xs ${cfg.color}`}>{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ForragemPlantio() {
  const statuses = getPastureForageStatuses();

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" /> Forragem & Plantio
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de pastejo, rotação e operações de plantio</p>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="ciclos">Ciclos de Pastejo</TabsTrigger>
            <TabsTrigger value="plantio">Plantio & Reforma</TabsTrigger>
            <TabsTrigger value="rotacao">Calendário de Rotação</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <ForageDashboard statuses={statuses} />
          </TabsContent>
          <TabsContent value="ciclos" className="mt-4">
            <GrazingCyclesTab />
          </TabsContent>
          <TabsContent value="plantio" className="mt-4">
            <PlantingTab />
          </TabsContent>
          <TabsContent value="rotacao" className="mt-4">
            <RotationCalendarTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
