import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Beef, Search, LayoutList, LayoutGrid, Plus, Filter, X, ChevronDown,
  TrendingUp, TrendingDown, Settings2, Home, ShoppingCart, ArrowLeftRight, Gift, Link2,
  QrCode, Printer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  mockAnimals, speciesLabels, statusLabels, statusColors, paddocks, breeds, age,
  originBadge, originLabel, calcAnimalCategory, categoryLabel, categoryColor,
  type Especie, type AnimalStatus, type Sexo, type AnimalCategory, type OriginType,
} from "@/data/rebanho-mock";
import {
  calcAnimalGmd, breedGmdBenchmark, type GmdResult,
} from "@/data/gmd-utils";
import { isAnimalInWithdrawal } from "@/data/withdrawal-utils";
import { getAnimalDevelopment } from "@/data/growth-curves";
import { mockReproEvents, mockWeighings, mockTreatments } from "@/data/animal-detail-mock";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { printBatchLabels } from "@/components/AnimalQrCode";
import { toast } from "sonner";

// ── Reproductive helpers ──
type PregnancyStatus = "prenha" | "vazia" | "protocolo" | "aguardando" | "na";

interface PregnancyInfo {
  status: PregnancyStatus;
  gestationMonths?: number;
  sireTag?: string;
  coverageDate?: string;
  predictedBirth?: string;
}

function getPregnancyInfo(animal: { id: string; sex: Sexo; birth_date: string; species: string }): PregnancyInfo {
  const now = new Date();
  const ageMonths = (now.getFullYear() - new Date(animal.birth_date).getFullYear()) * 12 + (now.getMonth() - new Date(animal.birth_date).getMonth());
  if (animal.sex === "M" || ageMonths < 12 || animal.species !== "bovino") return { status: "na" };

  const events = mockReproEvents.filter(e => e.animal_id === animal.id).sort((a, b) => b.date.localeCompare(a.date));
  if (events.length === 0) return { status: "vazia" };

  // Find last coverage/IA/IATF
  const lastCoverage = events.find(e => ["cobertura", "iatf"].includes(e.event_type) || e.event_type === "diagnostico_prenhez");
  const lastDiag = events.find(e => e.event_type === "diagnostico_prenhez");
  const lastParto = events.find(e => e.event_type === "parto");
  const lastAborto = events.find(e => e.event_type === "aborto");

  // Check if last parto/aborto is more recent than last coverage => vazia
  const lastCoverageEvent = events.find(e => ["cobertura", "iatf"].includes(e.event_type));
  if (!lastCoverageEvent) return { status: "vazia" };

  if (lastParto && lastParto.date > lastCoverageEvent.date) return { status: "vazia" };
  if (lastAborto && lastAborto.date > lastCoverageEvent.date) return { status: "vazia" };

  // Check diagnosis
  if (lastDiag && lastDiag.date >= lastCoverageEvent.date) {
    if (lastDiag.result === "positivo") {
      const covDate = new Date(lastCoverageEvent.date);
      const gestDays = Math.round((now.getTime() - covDate.getTime()) / 86400000);
      const gestMonths = Math.round(gestDays / 30);
      const predicted = new Date(covDate.getTime() + 283 * 86400000);
      return {
        status: "prenha",
        gestationMonths: gestMonths,
        sireTag: lastCoverageEvent.partner_ear_tag || "—",
        coverageDate: lastCoverageEvent.date,
        predictedBirth: predicted.toISOString().slice(0, 10),
      };
    }
    if (lastDiag.result === "negativo") return { status: "vazia" };
  }

  // IATF in progress (has IATF but no diagnosis yet)
  if (lastCoverageEvent.event_type === "iatf") return { status: "protocolo" };

  // Coverage without diagnosis
  return { status: "aguardando" };
}

function getLastPartoDate(animalId: string): string | null {
  const partos = mockReproEvents.filter(e => e.animal_id === animalId && e.event_type === "parto");
  if (partos.length === 0) return null;
  return partos.sort((a, b) => b.date.localeCompare(a.date))[0].date;
}

function getLastWeighingDate(animalId: string): string | null {
  const ws = mockWeighings.filter(w => w.animal_id === animalId);
  if (ws.length === 0) return null;
  return ws.sort((a, b) => b.date.localeCompare(a.date))[0].date;
}

function getLastVaccineDate(animalId: string): string | null {
  const vs = mockTreatments.filter(t => t.animal_id === animalId && t.type === "vacina");
  if (vs.length === 0) return null;
  return vs.sort((a, b) => b.date.localeCompare(a.date))[0].date;
}

function daysSince(dateStr: string): number {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysUntil(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

const originIcons: Record<string, React.ElementType> = {
  nascido: Home, comprado: ShoppingCart, trocado: ArrowLeftRight, doado: Gift,
};

export default function Animais() {
  const navigate = useNavigate();
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fSpecies, setFSpecies] = useState<string>("todas");
  const [fSex, setFSex] = useState<string>("todos");
  const [fStatus, setFStatus] = useState<string>("todos");
  const [fBreed, setFBreed] = useState<string>("todas");
  const [fPaddock, setFPaddock] = useState<string>("todos");
  const [fAgeRange, setFAgeRange] = useState<string>("todos");
  const [fCategory, setFCategory] = useState<string>("todas");
  const [showGmd, setShowGmd] = useState(true);
  const [showOrigin, setShowOrigin] = useState(false);
  const [showCategory, setShowCategory] = useState(true);
  const [showParentage, setShowParentage] = useState(false);
  const [sortByGmd, setSortByGmd] = useState(false);
  const [showPrenhez, setShowPrenhez] = useState(false);
  const [showLastParto, setShowLastParto] = useState(false);
  const [showPrevParto, setShowPrevParto] = useState(false);
  const [showLastPesagem, setShowLastPesagem] = useState(false);
  const [showLastVacina, setShowLastVacina] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pre-calc GMD & categories
  const gmdMap = useMemo(() => {
    const map = new Map<string, GmdResult | null>();
    mockAnimals.forEach((a) => map.set(a.id, calcAnimalGmd(a.id)));
    return map;
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, AnimalCategory>();
    mockAnimals.forEach(a => map.set(a.id, calcAnimalCategory(a)));
    return map;
  }, []);

  // Unique categories in current herd
  const existingCategories = useMemo(() => {
    const set = new Set<AnimalCategory>();
    mockAnimals.forEach(a => set.add(calcAnimalCategory(a)));
    return Array.from(set).sort();
  }, []);

  const activeFilterCount = [fSpecies, fSex, fStatus, fBreed, fPaddock, fAgeRange, fCategory]
    .filter((v) => v !== "todas" && v !== "todos").length;

  const filtered = useMemo(() => {
    let list = [...mockAnimals];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.ear_tag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q),
      );
    }
    if (fSpecies !== "todas") list = list.filter((a) => a.species === fSpecies);
    if (fSex !== "todos") list = list.filter((a) => a.sex === fSex);
    if (fStatus !== "todos") list = list.filter((a) => a.current_status === fStatus);
    if (fBreed !== "todas") list = list.filter((a) => a.breed === fBreed);
    if (fPaddock !== "todos") list = list.filter((a) => a.paddock === fPaddock);
    if (fCategory !== "todas") list = list.filter((a) => categoryMap.get(a.id) === fCategory);
    if (fAgeRange !== "todos") {
      const now = new Date();
      list = list.filter((a) => {
        const months =
          (now.getFullYear() - new Date(a.birth_date).getFullYear()) * 12 +
          (now.getMonth() - new Date(a.birth_date).getMonth());
        if (fAgeRange === "0-12") return months <= 12;
        if (fAgeRange === "12-24") return months > 12 && months <= 24;
        if (fAgeRange === "24-48") return months > 24 && months <= 48;
        return months > 48;
      });
    }
    if (sortByGmd) {
      list.sort((a, b) => {
        const ga = gmdMap.get(a.id)?.gmd ?? -1;
        const gb = gmdMap.get(b.id)?.gmd ?? -1;
        return gb - ga;
      });
    }
    return list;
  }, [search, fSpecies, fSex, fStatus, fBreed, fPaddock, fAgeRange, fCategory, sortByGmd, gmdMap, categoryMap]);

  const clearFilters = () => {
    setFSpecies("todas"); setFSex("todos"); setFStatus("todos");
    setFBreed("todas"); setFPaddock("todos"); setFAgeRange("todos"); setFCategory("todas");
  };

  const allBreeds = useMemo(() => {
    const set = new Set<string>();
    mockAnimals.forEach((a) => set.add(a.breed));
    return Array.from(set).sort();
  }, []);

  // Helper to render parent eartag (link if exists in system)
  const renderParentTag = (parentId: string | null, parentEarTag: string) => {
    if (!parentEarTag && !parentId) return <span className="text-muted-foreground">—</span>;
    if (parentId) {
      const parent = mockAnimals.find(a => a.id === parentId);
      if (parent) {
        return (
          <span
            className="text-primary font-mono text-sm cursor-pointer hover:underline flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); navigate(`/rebanho/animais/${parent.id}`); }}
          >
            <Link2 className="h-3 w-3" /> {parent.ear_tag}
          </span>
        );
      }
    }
    return <span className="font-mono text-sm text-muted-foreground">{parentEarTag || "—"}</span>;
  };

  const colCount = 8 + (showGmd ? 1 : 0) + (showOrigin ? 1 : 0) + (showCategory ? 1 : 0) + (showParentage ? 2 : 0) + (showPrenhez ? 1 : 0) + (showLastParto ? 1 : 0) + (showPrevParto ? 1 : 0) + (showLastPesagem ? 1 : 0) + (showLastVacina ? 1 : 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Beef className="h-6 w-6 text-primary" />
            Animais
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} animal{filtered.length !== 1 ? "is" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const animals = mockAnimals.filter(a => selectedIds.has(a.id));
                printBatchLabels(animals);
                toast.success(`Gerando ${animals.length} etiquetas`);
              }}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> Etiquetas ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => navigate("/rebanho/adicionar")} className="gap-2">
            <Plus className="h-4 w-4" /> Cadastrar Animal
          </Button>
        </div>
      </div>

      {/* Search + View Toggle + Filters Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por eartag, nome ou raça..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className={view === "table" ? "bg-accent" : ""} onClick={() => setView("table")}>
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className={view === "grid" ? "bg-accent" : ""} onClick={() => setView("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setFiltersOpen(!filtersOpen)} className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1 min-w-[140px]">
                  <label className="text-xs text-muted-foreground">Espécie</label>
                  <Select value={fSpecies} onValueChange={setFSpecies}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {(Object.keys(speciesLabels) as Especie[]).map((k) => (
                        <SelectItem key={k} value={k}>{speciesLabels[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[110px]">
                  <label className="text-xs text-muted-foreground">Sexo</label>
                  <Select value={fSex} onValueChange={setFSex}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="M">Macho</SelectItem>
                      <SelectItem value="F">Fêmea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[120px]">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={fStatus} onValueChange={setFStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {(Object.keys(statusLabels) as AnimalStatus[]).map((k) => (
                        <SelectItem key={k} value={k}>{statusLabels[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[130px]">
                  <label className="text-xs text-muted-foreground">Raça</label>
                  <Select value={fBreed} onValueChange={setFBreed}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {allBreeds.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[150px]">
                  <label className="text-xs text-muted-foreground">Pasto/Paddock</label>
                  <Select value={fPaddock} onValueChange={setFPaddock}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[130px]">
                  <label className="text-xs text-muted-foreground">Faixa Etária</label>
                  <Select value={fAgeRange} onValueChange={setFAgeRange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="0-12">0–12 meses</SelectItem>
                      <SelectItem value="12-24">1–2 anos</SelectItem>
                      <SelectItem value="24-48">2–4 anos</SelectItem>
                      <SelectItem value="48+">4+ anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 min-w-[160px]">
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <Select value={fCategory} onValueChange={setFCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {existingCategories.map(c => (
                        <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 gap-1 text-xs">
                  <X className="h-3 w-3" /> Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Column toggles */}
      {view === "table" && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="show-cat" checked={showCategory} onCheckedChange={(c) => setShowCategory(c === true)} />
            <Label htmlFor="show-cat" className="text-xs cursor-pointer">Categoria</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-origin" checked={showOrigin} onCheckedChange={(c) => setShowOrigin(c === true)} />
            <Label htmlFor="show-origin" className="text-xs cursor-pointer">Origem</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-parentage" checked={showParentage} onCheckedChange={(c) => setShowParentage(c === true)} />
            <Label htmlFor="show-parentage" className="text-xs cursor-pointer">Pai / Mãe</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-gmd" checked={showGmd} onCheckedChange={(c) => setShowGmd(c === true)} />
            <Label htmlFor="show-gmd" className="text-xs cursor-pointer">GMD</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-prenhez" checked={showPrenhez} onCheckedChange={(c) => setShowPrenhez(c === true)} />
            <Label htmlFor="show-prenhez" className="text-xs cursor-pointer">Prenhez</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-last-parto" checked={showLastParto} onCheckedChange={(c) => setShowLastParto(c === true)} />
            <Label htmlFor="show-last-parto" className="text-xs cursor-pointer">Últ. Parto</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-prev-parto" checked={showPrevParto} onCheckedChange={(c) => setShowPrevParto(c === true)} />
            <Label htmlFor="show-prev-parto" className="text-xs cursor-pointer">Prev. Parto</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-last-pesagem" checked={showLastPesagem} onCheckedChange={(c) => setShowLastPesagem(c === true)} />
            <Label htmlFor="show-last-pesagem" className="text-xs cursor-pointer">Últ. Pesagem</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="show-last-vacina" checked={showLastVacina} onCheckedChange={(c) => setShowLastVacina(c === true)} />
            <Label htmlFor="show-last-vacina" className="text-xs cursor-pointer">Últ. Vacina</Label>
          </div>
          {showGmd && (
            <Button variant="ghost" size="sm" onClick={() => setSortByGmd(!sortByGmd)} className={cn("gap-1 text-xs", sortByGmd && "text-primary")}>
              <Settings2 className="h-3 w-3" />
              {sortByGmd ? "Ordenando por GMD" : "Ordenar por GMD"}
            </Button>
          )}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(new Set(filtered.map(a => a.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead>Eartag</TableHead>
                  <TableHead>Nome</TableHead>
                  {showOrigin && <TableHead>Origem</TableHead>}
                  {showCategory && <TableHead>Categoria</TableHead>}
                  <TableHead>Raça</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>DN / DC</TableHead>
                  {showParentage && <TableHead>Pai</TableHead>}
                  {showParentage && <TableHead>Mãe</TableHead>}
                  <TableHead className="text-right">Peso (kg)</TableHead>
                  {showGmd && (
                    <TableHead className="text-right cursor-pointer" onClick={() => setSortByGmd(!sortByGmd)}>
                      GMD {sortByGmd && "↓"}
                    </TableHead>
                  )}
                  <TableHead>Pasto</TableHead>
                  {showPrenhez && <TableHead>Prenhez</TableHead>}
                  {showLastParto && <TableHead>Últ. Parto</TableHead>}
                  {showPrevParto && <TableHead>Prev. Parto</TableHead>}
                  {showLastPesagem && <TableHead>Últ. Pesagem</TableHead>}
                  {showLastVacina && <TableHead>Últ. Vacina</TableHead>}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="text-center py-12 text-muted-foreground">
                      Nenhum animal encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => {
                    const cat = categoryMap.get(a.id) || "outro_animal";
                    const ob = originBadge[a.origin_type];
                    const OriginIcon = originIcons[a.origin_type] || Home;
                    return (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => navigate(`/rebanho/animais/${a.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(a.id)}
                            onCheckedChange={(checked) => {
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                if (checked) next.add(a.id); else next.delete(a.id);
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary">
                          {a.ear_tag}
                          {a.eid && <span className="ml-1" title={`EID: ${a.eid}`}>📡</span>}
                        </TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        {showOrigin && (
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 text-[10px] ${ob.color}`}>
                              <OriginIcon className="h-3 w-3" /> {originLabel[a.origin_type].split(" ")[0]}
                            </Badge>
                          </TableCell>
                        )}
                        {showCategory && (
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${categoryColor[cat]}`}>
                              {categoryLabel[cat]}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>{a.breed}</TableCell>
                        <TableCell>{a.sex === "M" ? "Macho" : "Fêmea"}</TableCell>
                        <TableCell>{age(a.birth_date)}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help text-sm">
                                  {a.origin_type === "comprado" && a.purchase_date
                                    ? format(new Date(a.purchase_date), "dd/MM/yyyy")
                                    : format(new Date(a.birth_date), "dd/MM/yyyy")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {(a.origin_type === "comprado" || a.origin_type === "trocado") && a.purchase_date
                                  ? `DC — Data de Compra: ${format(new Date(a.purchase_date), "dd/MM/yyyy")}`
                                  : `DN — Data de Nascimento: ${format(new Date(a.birth_date), "dd/MM/yyyy")}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {showParentage && <TableCell>{renderParentTag(a.sire_id, a.sire_ear_tag)}</TableCell>}
                        {showParentage && <TableCell>{renderParentTag(a.dam_id, a.dam_ear_tag)}</TableCell>}
                        <TableCell className="text-right font-mono">{a.current_weight}</TableCell>
                        {showGmd && (() => {
                          const g = gmdMap.get(a.id);
                          if (!g) return <TableCell className="text-right text-xs text-muted-foreground">—</TableCell>;
                          const benchmark = breedGmdBenchmark[a.breed];
                          const above = benchmark ? g.gmd >= benchmark : null;
                          return (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-mono text-sm font-medium">{g.gmd.toFixed(3)}</span>
                                {above != null && (
                                  above
                                    ? <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    : <TrendingDown className="h-3 w-3 text-destructive" />
                                )}
                              </div>
                            </TableCell>
                          );
                        })()}
                        <TableCell>{a.paddock || "—"}</TableCell>
                        {showPrenhez && (() => {
                          const info = getPregnancyInfo(a);
                          if (info.status === "na") return <TableCell className="text-muted-foreground">—</TableCell>;
                          const badges: Record<string, { emoji: string; label: string; cls: string }> = {
                            prenha: { emoji: "🟢", label: "Prenha", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300" },
                            vazia: { emoji: "⚪", label: "Vazia", cls: "bg-muted text-muted-foreground border-border" },
                            protocolo: { emoji: "🔵", label: "Em protocolo", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300" },
                            aguardando: { emoji: "⚠️", label: "Aguardando diag.", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300" },
                          };
                          const b = badges[info.status];
                          return (
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className={`text-[10px] cursor-help ${b.cls}`}>
                                      {b.emoji} {b.label}
                                    </Badge>
                                  </TooltipTrigger>
                                  {info.status === "prenha" && (
                                    <TooltipContent>
                                      <p className="text-xs">{info.gestationMonths} meses de gestação</p>
                                      <p className="text-xs">Touro: {info.sireTag}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        })()}
                        {showLastParto && (() => {
                          const d = getLastPartoDate(a.id);
                          if (!d) return <TableCell className="text-muted-foreground">—</TableCell>;
                          const ds = daysSince(d);
                          const isLong = ds > 18 * 30; // >18 months
                          return (
                            <TableCell className={isLong ? "text-destructive font-medium" : ""}>
                              {format(new Date(d), "dd/MM/yyyy")}
                              {isLong && <span className="text-[10px] ml-1">⚠️</span>}
                            </TableCell>
                          );
                        })()}
                        {showPrevParto && (() => {
                          const info = getPregnancyInfo(a);
                          if (info.status !== "prenha" || !info.predictedBirth) return <TableCell className="text-muted-foreground">—</TableCell>;
                          const du = daysUntil(info.predictedBirth);
                          let badgeCls = "bg-muted text-muted-foreground border-border";
                          if (du <= 7) badgeCls = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300";
                          else if (du <= 30) badgeCls = "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300";
                          else if (du <= 60) badgeCls = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300";
                          return (
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${badgeCls}`}>
                                {format(new Date(info.predictedBirth), "dd/MM/yyyy")} ({du}d)
                              </Badge>
                            </TableCell>
                          );
                        })()}
                        {showLastPesagem && (() => {
                          const d = getLastWeighingDate(a.id);
                          if (!d) return <TableCell className="text-muted-foreground">—</TableCell>;
                          const ds = daysSince(d);
                          return (
                            <TableCell className={ds > 60 ? "text-destructive font-medium" : ""}>
                              {format(new Date(d), "dd/MM/yyyy")}
                              {ds > 60 && <span className="text-[10px] ml-1">⚠️</span>}
                            </TableCell>
                          );
                        })()}
                        {showLastVacina && (() => {
                          const d = getLastVaccineDate(a.id);
                          if (!d) return <TableCell className="text-muted-foreground">—</TableCell>;
                          const ds = daysSince(d);
                          return (
                            <TableCell className={ds > 365 ? "text-destructive font-medium" : ""}>
                              {format(new Date(d), "dd/MM/yyyy")}
                              {ds > 365 && <span className="text-[10px] ml-1">⚠️</span>}
                            </TableCell>
                          );
                        })()}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={statusColors[a.current_status]}>
                              {statusLabels[a.current_status]}
                            </Badge>
                            {(() => {
                              const ws = isAnimalInWithdrawal(a.id);
                              if (!ws) return null;
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-[10px] cursor-help">
                                        ⚠️ Carência
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="font-medium">{ws.medication}</p>
                                      <p className="text-xs">Aplicado: {ws.applicationDate}</p>
                                      <p className="text-xs">Liberação: {ws.releaseDate}</p>
                                      <p className="text-xs font-semibold">{ws.remainingDays} dias restantes</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum animal encontrado
            </p>
          ) : (
            filtered.map((a) => {
              const cat = categoryMap.get(a.id) || "outro_animal";
              return (
                <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/rebanho/animais/${a.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Beef className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-primary text-lg leading-tight">{a.ear_tag}</p>
                          <p className="text-sm font-medium text-foreground">{a.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[a.current_status]}>
                        {statusLabels[a.current_status]}
                      </Badge>
                    </div>
                    {/* Category badge */}
                    <div className="mb-2">
                      <Badge variant="outline" className={`text-[10px] ${categoryColor[cat]}`}>
                        {categoryLabel[cat]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Raça</span>
                      <span className="text-right font-medium">{a.breed}</span>
                      <span className="text-muted-foreground">Sexo</span>
                      <span className="text-right">{a.sex === "M" ? "Macho" : "Fêmea"}</span>
                      <span className="text-muted-foreground">Idade</span>
                      <span className="text-right">{age(a.birth_date)}</span>
                      <span className="text-muted-foreground">Peso</span>
                      <span className="text-right font-mono">{a.current_weight} kg</span>
                      {a.paddock && (
                        <>
                          <span className="text-muted-foreground">Pasto</span>
                          <span className="text-right">{a.paddock}</span>
                        </>
                      )}
                    </div>
                    {(() => {
                      const dev = getAnimalDevelopment(a.id);
                      if (!dev) return null;
                      const color = dev.pct >= 95 ? "text-emerald-600 dark:text-emerald-400" : dev.pct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
                      const bgColor = dev.pct >= 95 ? "bg-emerald-500" : dev.pct >= 80 ? "bg-amber-500" : "bg-red-500";
                      return (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Desenvolvimento</span>
                            <span className={`font-bold font-mono ${color}`}>{dev.pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bgColor} transition-all`} style={{ width: `${Math.min(dev.pct, 120) / 1.2}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
