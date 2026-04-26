import React, { useState, useMemo } from "react";
import {
  Leaf, Plus, Edit, ChevronDown, ChevronRight, MapPin, Shield, X, Check, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { mockAnimals } from "@/data/rebanho-mock";

// ── Types & Mock Data ─────────────────────────────────────
interface Paddock {
  id: string;
  name: string;
  pasture_id: string;
  area_ha: number;
  capacity_ua: number;
  notes: string;
}

interface Pasture {
  id: string;
  name: string;
  type: string;
  lot_function: string;
  is_quarantine: boolean;
  area_ha: number;
  notes: string;
}

const grassTypes = ["Braquiária", "Coast Cross", "Tifton 85", "Mombaça", "Tanzânia", "Marandu", "Humidícola", "Cynodon", "Outro"];
const lotFunctions = ["Engorda", "Cria", "Recria", "Reprodução", "Quarentena", "Misto"];

const mockPastures: Pasture[] = [
  { id: "pas-1", name: "Pasto Norte", type: "Braquiária", lot_function: "Engorda", is_quarantine: false, area_ha: 25, notes: "Pasto principal de engorda" },
  { id: "pas-2", name: "Pasto Sul", type: "Mombaça", lot_function: "Reprodução", is_quarantine: false, area_ha: 30, notes: "" },
  { id: "pas-3", name: "Pasto Leste", type: "Tifton 85", lot_function: "Cria", is_quarantine: false, area_ha: 18, notes: "Próximo ao curral" },
  { id: "pas-4", name: "Pasto Grande", type: "Tanzânia", lot_function: "Recria", is_quarantine: false, area_ha: 45, notes: "" },
  { id: "pas-5", name: "Piquete Maternidade", type: "Coast Cross", lot_function: "Cria", is_quarantine: false, area_ha: 5, notes: "Área para vacas parindo" },
  { id: "pas-6", name: "Curral 1", type: "Outro", lot_function: "Misto", is_quarantine: false, area_ha: 0.5, notes: "Curral de manejo" },
  { id: "pas-7", name: "Curral 2", type: "Outro", lot_function: "Quarentena", is_quarantine: true, area_ha: 0.3, notes: "Quarentena para novos animais" },
  { id: "pas-8", name: "Confinamento", type: "Outro", lot_function: "Engorda", is_quarantine: false, area_ha: 2, notes: "Confinamento intensivo" },
];

const mockPaddocks: Paddock[] = [
  { id: "pk-1", name: "Norte A", pasture_id: "pas-1", area_ha: 8, capacity_ua: 12, notes: "" },
  { id: "pk-2", name: "Norte B", pasture_id: "pas-1", area_ha: 8, capacity_ua: 12, notes: "" },
  { id: "pk-3", name: "Norte C", pasture_id: "pas-1", area_ha: 9, capacity_ua: 14, notes: "Próximo à aguada" },
  { id: "pk-4", name: "Sul A", pasture_id: "pas-2", area_ha: 15, capacity_ua: 20, notes: "" },
  { id: "pk-5", name: "Sul B", pasture_id: "pas-2", area_ha: 15, capacity_ua: 20, notes: "" },
  { id: "pk-6", name: "Leste Único", pasture_id: "pas-3", area_ha: 18, capacity_ua: 25, notes: "" },
  { id: "pk-7", name: "Grande A", pasture_id: "pas-4", area_ha: 15, capacity_ua: 20, notes: "" },
  { id: "pk-8", name: "Grande B", pasture_id: "pas-4", area_ha: 15, capacity_ua: 20, notes: "" },
  { id: "pk-9", name: "Grande C", pasture_id: "pas-4", area_ha: 15, capacity_ua: 20, notes: "" },
  { id: "pk-10", name: "Maternidade", pasture_id: "pas-5", area_ha: 5, capacity_ua: 8, notes: "" },
  { id: "pk-11", name: "Curral Principal", pasture_id: "pas-6", area_ha: 0.5, capacity_ua: 30, notes: "" },
  { id: "pk-12", name: "Quarentena", pasture_id: "pas-7", area_ha: 0.3, capacity_ua: 10, notes: "" },
  { id: "pk-13", name: "Confin. 1", pasture_id: "pas-8", area_ha: 1, capacity_ua: 50, notes: "" },
  { id: "pk-14", name: "Confin. 2", pasture_id: "pas-8", area_ha: 1, capacity_ua: 50, notes: "" },
];

// Map animal paddock names to pasture IDs
const paddockToPasture: Record<string, string> = {
  "Pasto Norte": "pas-1",
  "Pasto Sul": "pas-2",
  "Pasto Leste": "pas-3",
  "Pasto Grande": "pas-4",
  "Piquete Maternidade": "pas-5",
  "Curral 1": "pas-6",
  "Curral 2": "pas-7",
  "Confinamento": "pas-8",
};

function getAnimalsInPasture(pastureId: string) {
  return mockAnimals.filter(
    (a) => a.current_status === "ativo" && paddockToPasture[a.paddock] === pastureId,
  );
}

function occupationColor(ratio: number) {
  if (ratio === 0) return "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700";
  if (ratio < 0.5) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800";
  if (ratio < 0.8) return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800";
  return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
}

function occupationLabel(ratio: number) {
  if (ratio === 0) return "Vazio";
  if (ratio < 0.5) return "Baixa";
  if (ratio < 0.8) return "Parcial";
  return "Cheio";
}

export default function Pastos() {
  const [tab, setTab] = useState("pastos");
  const [showPastureForm, setShowPastureForm] = useState(false);
  const [showPaddockForm, setShowPaddockForm] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState<string | null>(null);
  const [expandedPastures, setExpandedPastures] = useState<Set<string>>(new Set());
  const [paddockDetail, setPaddockDetail] = useState<Paddock | null>(null);

  // Pasture form
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("Braquiária");
  const [fFunction, setFFunction] = useState("Engorda");
  const [fQuarantine, setFQuarantine] = useState(false);
  const [fNotes, setFNotes] = useState("");

  // Paddock form
  const [pkName, setPkName] = useState("");
  const [pkArea, setPkArea] = useState("");
  const [pkPasture, setPkPasture] = useState("");
  const [pkNotes, setPkNotes] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedPastures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const savePasture = () => {
    if (!fName.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    toast({ title: "Pasto cadastrado!", description: fName });
    setShowPastureForm(false);
    setFName(""); setFNotes("");
  };

  const savePaddock = () => {
    if (!pkName.trim() || !pkPasture) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    toast({ title: "Paddock cadastrado!", description: pkName });
    setShowPaddockForm(false);
    setPkName(""); setPkArea(""); setPkNotes("");
  };

  // Animals in selected paddock for detail
  const paddockAnimals = useMemo(() => {
    if (!paddockDetail) return [];
    const pasture = mockPastures.find((p) => p.id === paddockDetail.pasture_id);
    if (!pasture) return [];
    return getAnimalsInPasture(pasture.id);
  }, [paddockDetail]);

  // Map view pasture
  const mapPasture = selectedPasture ? mockPastures.find((p) => p.id === selectedPasture) : null;
  const mapPaddocks = selectedPasture ? mockPaddocks.filter((pk) => pk.pasture_id === selectedPasture) : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            Pastos & Paddocks
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockPastures.length} pastos • {mockPaddocks.length} paddocks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPaddockForm(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Novo Paddock
          </Button>
          <Button size="sm" onClick={() => setShowPastureForm(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Novo Pasto
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pastos">Pastos</TabsTrigger>
          <TabsTrigger value="mapa">Mapa de Ocupação</TabsTrigger>
        </TabsList>

        {/* ── PASTOS LIST ── */}
        <TabsContent value="pastos" className="space-y-4 mt-4">
          {mockPastures.map((pasture) => {
            const animals = getAnimalsInPasture(pasture.id);
            const paddocks = mockPaddocks.filter((pk) => pk.pasture_id === pasture.id);
            const totalCapacity = paddocks.reduce((s, pk) => s + pk.capacity_ua, 0);
            const lotacao = pasture.area_ha > 0 ? (animals.length / pasture.area_ha).toFixed(2) : "—";
            const isExpanded = expandedPastures.has(pasture.id);

            return (
              <Card key={pasture.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-semibold text-foreground">{pasture.name}</h3>
                        <Badge variant="outline">{pasture.type}</Badge>
                        <Badge variant="secondary">{pasture.lot_function}</Badge>
                        {pasture.is_quarantine && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <Shield className="h-3 w-3 mr-1" /> Quarentena
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{pasture.area_ha} ha</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">{animals.length} animais</span>
                        <span>•</span>
                        <span>Lotação: {lotacao} UA/ha</span>
                        <span>•</span>
                        <span>{paddocks.length} paddock{paddocks.length !== 1 ? "s" : ""}</span>
                      </div>
                      {pasture.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{pasture.notes}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(pasture.id)} className="gap-1 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Paddocks
                    </Button>
                  </div>

                  {/* Paddocks collapsible */}
                  {isExpanded && paddocks.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-right">Área (ha)</TableHead>
                            <TableHead className="text-right">Capacidade (UA)</TableHead>
                            <TableHead className="text-right">Animais</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paddocks.map((pk) => {
                            // Distribute animals proportionally across paddocks for display
                            const pkShare = Math.round(animals.length * (pk.capacity_ua / (totalCapacity || 1)));
                            return (
                              <TableRow key={pk.id}>
                                <TableCell className="font-medium">{pk.name}</TableCell>
                                <TableCell className="text-right font-mono">{pk.area_ha}</TableCell>
                                <TableCell className="text-right font-mono">{pk.capacity_ua}</TableCell>
                                <TableCell className="text-right font-mono">{pkShare}</TableCell>
                                <TableCell className="text-muted-foreground">{pk.notes || "—"}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {isExpanded && paddocks.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground border-t pt-3">Nenhum paddock cadastrado</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── MAPA DE OCUPAÇÃO ── */}
        <TabsContent value="mapa" className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label>Selecionar Pasto</Label>
            <Select value={selectedPasture || ""} onValueChange={setSelectedPasture}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Escolha um pasto" /></SelectTrigger>
              <SelectContent>
                {mockPastures.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" /> Vazio</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Parcial</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-200 border border-red-400" /> Cheio</div>
          </div>

          {mapPasture && mapPaddocks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {mapPaddocks.map((pk) => {
                const animals = getAnimalsInPasture(mapPasture.id);
                const totalCap = mapPaddocks.reduce((s, p) => s + p.capacity_ua, 0);
                const pkAnimals = Math.round(animals.length * (pk.capacity_ua / (totalCap || 1)));
                const ratio = pk.capacity_ua > 0 ? pkAnimals / pk.capacity_ua : 0;

                return (
                  <Card
                    key={pk.id}
                    className={`cursor-pointer border-2 transition-colors hover:shadow-md ${occupationColor(ratio)}`}
                    onClick={() => setPaddockDetail(pk)}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-foreground">{pk.name}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{pkAnimals}</p>
                      <p className="text-xs text-muted-foreground">de {pk.capacity_ua} UA</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {pk.area_ha} ha • {occupationLabel(ratio)}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : selectedPasture && mapPaddocks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum paddock neste pasto</p>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">Selecione um pasto para ver o mapa de ocupação</p>
          )}
        </TabsContent>
      </Tabs>

      {/* ── PASTURE FORM ── */}
      <Dialog open={showPastureForm} onOpenChange={setShowPastureForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pasto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Ex: Pasto Oeste" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tipo de Capim</Label>
                <Select value={fType} onValueChange={setFType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {grassTypes.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Função</Label>
                <Select value={fFunction} onValueChange={setFFunction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lotFunctions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={fQuarantine} onCheckedChange={setFQuarantine} id="quarantine" />
              <Label htmlFor="quarantine">É quarentena?</Label>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Observações..." className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPastureForm(false)}>Cancelar</Button>
            <Button onClick={savePasture} className="gap-1"><Check className="h-4 w-4" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PADDOCK FORM ── */}
      <Dialog open={showPaddockForm} onOpenChange={setShowPaddockForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Paddock</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={pkName} onChange={(e) => setPkName(e.target.value)} placeholder="Ex: Norte D" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Área (ha)</Label>
                <Input type="number" step="0.1" value={pkArea} onChange={(e) => setPkArea(e.target.value)} placeholder="0.0" />
              </div>
              <div className="space-y-1">
                <Label>Pasto *</Label>
                <Select value={pkPasture} onValueChange={setPkPasture}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {mockPastures.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={pkNotes} onChange={(e) => setPkNotes(e.target.value)} placeholder="Observações..." className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaddockForm(false)}>Cancelar</Button>
            <Button onClick={savePaddock} className="gap-1"><Check className="h-4 w-4" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PADDOCK DETAIL DIALOG ── */}
      <Dialog open={!!paddockDetail} onOpenChange={() => setPaddockDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{paddockDetail?.name} — Animais</DialogTitle>
          </DialogHeader>
          {paddockDetail && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Área</p><p className="font-medium">{paddockDetail.area_ha} ha</p></div>
                <div><p className="text-xs text-muted-foreground">Capacidade</p><p className="font-medium">{paddockDetail.capacity_ua} UA</p></div>
                <div><p className="text-xs text-muted-foreground">Animais</p><p className="font-medium">{paddockAnimals.length}</p></div>
              </div>
              <Separator />
              {paddockAnimals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum animal neste paddock</p>
              ) : (
                <div className="max-h-52 overflow-auto space-y-2">
                  {paddockAnimals.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{a.ear_tag}</span>
                        <span>{a.name}</span>
                      </div>
                      <span className="text-muted-foreground">{a.current_weight} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
