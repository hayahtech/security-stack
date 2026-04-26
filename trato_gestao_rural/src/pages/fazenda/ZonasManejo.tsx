import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Map,
  Upload,
  Download,
  Plus,
  Droplets,
  Sprout,
  TrendingDown,
  Leaf,
  FileInput,
  FileDown,
  Zap,
  Info,
  ScanLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { talhoesMapa } from "@/data/operacoes-campo-mock";
import {
  prescricoesMock,
  STATUS_LABELS,
  FONTE_LABELS,
  type PrescricaoMapa,
} from "@/data/zonas-manejo-mock";
import {
  importKML,
  importShapefile,
  importGeoJSON,
  exportTalhoesAsKML,
  exportPrescriptionMapAsKML,
  exportAsGeoJSON,
  gerarZonasAutomaticas,
  calcularEconomiaVRA,
  type ImportedTalhao,
} from "@/lib/geo-io";

const STATUS_COLORS = {
  rascunho: "bg-gray-500",
  aprovada: "bg-blue-500",
  executada: "bg-green-600",
} as const;

// ── Mapa de Prescrição ───────────────────────────────────────────────────────
function MapaPrescricao({ prescricao }: { prescricao: PrescricaoMapa | null }) {
  const talhao = prescricao ? talhoesMapa.find((t) => t.id === prescricao.talhaoId) : null;

  const center: [number, number] = talhao
    ? [
        talhao.coords.reduce((s, c) => s + c[0], 0) / talhao.coords.length,
        talhao.coords.reduce((s, c) => s + c[1], 0) / talhao.coords.length,
      ]
    : [-19.745, -47.934];

  return (
    <div className="w-full h-[420px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        key={prescricao?.id || "none"}
        center={center}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; Esri &mdash; World Imagery'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {/* Contorno do talhão */}
        {talhao && (
          <Polygon
            positions={talhao.coords}
            pathOptions={{ color: "#ffffff", weight: 2, fill: false, dashArray: "4,4" }}
          >
            <Tooltip sticky>{talhao.nome} — {talhao.areaHa} ha</Tooltip>
          </Polygon>
        )}
        {/* Zonas de dose variável */}
        {prescricao?.zonas.map((zona) => (
          <Polygon
            key={zona.id}
            positions={zona.coords}
            pathOptions={{
              color: zona.cor,
              weight: 2,
              fillColor: zona.cor,
              fillOpacity: 0.5,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs">
                <div className="font-bold">{zona.nome}</div>
                <div>Dose: {zona.dose} {zona.unidade}</div>
                {zona.ndvi !== undefined && <div>NDVI: {zona.ndvi.toFixed(2)}</div>}
              </div>
            </Tooltip>
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
}

// ── Dialog de Importação ─────────────────────────────────────────────────────
function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [imported, setImported] = useState<ImportedTalhao[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const name = file.name.toLowerCase();
      let result: ImportedTalhao[] = [];
      if (name.endsWith(".kml")) {
        result = await importKML(file);
      } else if (name.endsWith(".zip")) {
        result = await importShapefile(file);
      } else if (name.endsWith(".geojson") || name.endsWith(".json")) {
        result = await importGeoJSON(file);
      } else {
        toast({
          title: "Formato não suportado",
          description: "Use KML, Shapefile (.zip) ou GeoJSON",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setImported(result);
      toast({
        title: "Import concluído",
        description: `${result.length} talhão(ões) lidos do arquivo`,
      });
    } catch (err) {
      toast({
        title: "Erro ao importar",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileInput className="h-5 w-5" />
            Importar Talhões
          </DialogTitle>
          <DialogDescription>
            Aceita KML (DJI SmartFarm / Google Earth), Shapefile (.zip) ou GeoJSON
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Clique para selecionar arquivo</p>
            <p className="text-xs text-muted-foreground mt-1">
              .kml, .zip (shapefile), .geojson
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".kml,.zip,.geojson,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {loading && <p className="text-sm text-muted-foreground">Processando...</p>}

          {imported.length > 0 && (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              <p className="text-sm font-semibold">Talhões detectados:</p>
              {imported.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded border border-border bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.areaHa} ha • {t.coords.length} vértices
                    </p>
                  </div>
                  <Badge variant="outline">OK</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={imported.length === 0}
            onClick={() => {
              toast({
                title: "Talhões salvos",
                description: `${imported.length} talhão(ões) adicionados à fazenda`,
              });
              setImported([]);
              onOpenChange(false);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar {imported.length > 0 ? `(${imported.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog de Nova Prescrição ────────────────────────────────────────────────
function NovaPrescricaoDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (p: PrescricaoMapa) => void;
}) {
  const [talhaoId, setTalhaoId] = useState("");
  const [tipo, setTipo] = useState<PrescricaoMapa["tipo"]>("adubacao");
  const [produto, setProduto] = useState("Ureia Perlada 46%");
  const [doseBase, setDoseBase] = useState(150);
  const [unidade, setUnidade] = useState("kg/ha");
  const [custoUnit, setCustoUnit] = useState(2.4);
  const { toast } = useToast();

  const handleCreate = () => {
    const talhao = talhoesMapa.find((t) => t.id === talhaoId);
    if (!talhao) {
      toast({ title: "Selecione um talhão", variant: "destructive" });
      return;
    }

    const zonas = gerarZonasAutomaticas(talhao.id, talhao.coords, doseBase, unidade);
    const economia = calcularEconomiaVRA(talhao.areaHa, doseBase, zonas, custoUnit);

    const prescricao: PrescricaoMapa = {
      id: `presc-${Date.now()}`,
      nome: `${tipo === "adubacao" ? "Adubação VRA" : "Pulverização Localizada"} — ${talhao.nome}`,
      talhaoId: talhao.id,
      talhaoNome: talhao.nome,
      areaHa: talhao.areaHa,
      dataGeracao: new Date().toISOString().split("T")[0],
      tipo,
      produto,
      doseBase,
      unidade,
      custoUnit,
      zonas,
      status: "rascunho",
      ndviMedio: 0.55,
      fonteDados: "manual",
      economiaEstimada: economia.economia,
    };

    onCreate(prescricao);
    toast({
      title: "Prescrição criada",
      description: `3 zonas geradas • Economia estimada: R$ ${economia.economia.toLocaleString("pt-BR")} (${economia.economiaPct}%)`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Nova Prescrição VRA
          </DialogTitle>
          <DialogDescription>
            Gera automaticamente 3 zonas de dose variável dentro do talhão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Talhão</Label>
            <Select value={talhaoId} onValueChange={setTalhaoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {talhoesMapa.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} — {t.areaHa} ha
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as PrescricaoMapa["tipo"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adubacao">Adubação</SelectItem>
                  <SelectItem value="pulverizacao">Pulverização</SelectItem>
                  <SelectItem value="dessecacao">Dessecação</SelectItem>
                  <SelectItem value="calcario">Calcário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Produto</Label>
              <Input value={produto} onChange={(e) => setProduto(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Dose Base</Label>
              <Input
                type="number"
                value={doseBase}
                onChange={(e) => setDoseBase(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg/ha">kg/ha</SelectItem>
                  <SelectItem value="L/ha">L/ha</SelectItem>
                  <SelectItem value="mL/ha">mL/ha</SelectItem>
                  <SelectItem value="t/ha">t/ha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>R$ / un.</Label>
              <Input
                type="number"
                step="0.1"
                value={custoUnit}
                onChange={(e) => setCustoUnit(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-3 rounded bg-blue-500/10 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Serão geradas 3 zonas: <strong>Alta</strong> (+30% dose), <strong>Média</strong> (padrão) e <strong>Baixa</strong> (-30% dose), com base em NDVI simulado.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate}>
            <Zap className="h-4 w-4 mr-2" />
            Gerar Zonas VRA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sheet de Detalhe ─────────────────────────────────────────────────────────
function PrescricaoDetailSheet({
  prescricao,
  onClose,
}: {
  prescricao: PrescricaoMapa | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  if (!prescricao) return null;

  const totalDose = prescricao.zonas.reduce(
    (s, z) => s + z.dose * (z.coords.length > 0 ? 1 : 0),
    0,
  );
  const economia = prescricao.economiaEstimada || 0;

  return (
    <Sheet open={!!prescricao} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {prescricao.nome}
          </SheetTitle>
          <SheetDescription>
            {prescricao.talhaoNome} • {prescricao.areaHa} ha • {prescricao.produto}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <MapaPrescricao prescricao={prescricao} />

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Dose base</p>
                <p className="text-lg font-bold">{prescricao.doseBase}</p>
                <p className="text-[10px] text-muted-foreground">{prescricao.unidade}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Zonas</p>
                <p className="text-lg font-bold">{prescricao.zonas.length}</p>
                <p className="text-[10px] text-muted-foreground">NDVI médio {prescricao.ndviMedio?.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Economia</p>
                <p className="text-lg font-bold text-emerald-600">
                  R$ {economia.toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] text-muted-foreground">vs. dose única</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Zonas de Manejo ({prescricao.zonas.length})
            </h3>
            <div className="space-y-2">
              {prescricao.zonas.map((z) => (
                <div
                  key={z.id}
                  className="p-3 rounded border border-border flex items-start gap-3"
                  style={{ borderLeftColor: z.cor, borderLeftWidth: 4 }}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{ background: z.cor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{z.nome}</p>
                    {z.observacao && (
                      <p className="text-xs text-muted-foreground mt-0.5">{z.observacao}</p>
                    )}
                    <div className="flex gap-3 mt-1.5 text-xs">
                      <span>
                        <strong>{z.dose}</strong> {z.unidade}
                      </span>
                      {z.ndvi !== undefined && (
                        <span className="text-muted-foreground">NDVI {z.ndvi.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                exportPrescriptionMapAsKML(prescricao.zonas, prescricao.id);
                toast({ title: "KML exportado", description: "Pronto para DJI SmartFarm" });
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar KML (DJI)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast({ title: "PDF em breve", description: "Relatório completo com mapa + tabelas" });
              }}
            >
              PDF
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function ZonasManejo() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [prescricoes, setPrescricoes] = useState<PrescricaoMapa[]>(prescricoesMock);
  const [selected, setSelected] = useState<PrescricaoMapa | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [importOpen, setImportOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);

  const filtered = useMemo(() => {
    if (statusFilter === "todas") return prescricoes;
    return prescricoes.filter((p) => p.status === statusFilter);
  }, [prescricoes, statusFilter]);

  const kpis = useMemo(() => {
    const total = prescricoes.length;
    const areaVRA = prescricoes.reduce((s, p) => s + p.areaHa, 0);
    const economiaTotal = prescricoes.reduce((s, p) => s + (p.economiaEstimada || 0), 0);
    const executadas = prescricoes.filter((p) => p.status === "executada").length;
    return { total, areaVRA, economiaTotal, executadas };
  }, [prescricoes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Zonas de Manejo & Prescrição VRA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aplicação localizada com dose variável por zona • Import/Export KML, Shapefile, GeoJSON
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              exportTalhoesAsKML(talhoesMapa, "talhoes-fazenda");
              toast({ title: "KML exportado", description: "Todos os talhões da fazenda" });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Talhões
          </Button>
          <Button onClick={() => setNovaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Prescrição
          </Button>
          <Button variant="outline" onClick={() => navigate("/fazenda/ndvi")}>
            <ScanLine className="h-4 w-4 mr-2" />
            NDVI
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Prescrições</p>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Área em VRA</p>
              <Sprout className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1">
              {kpis.areaVRA} <span className="text-xs font-normal text-muted-foreground">ha</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Economia estimada</p>
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              R$ {kpis.economiaTotal.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Executadas</p>
              <Leaf className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold mt-1">{kpis.executadas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros + Lista */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="rascunho">Rascunho</TabsTrigger>
          <TabsTrigger value="aprovada">Aprovadas</TabsTrigger>
          <TabsTrigger value="executada">Executadas</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma prescrição encontrada.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((p) => (
                <Card
                  key={p.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelected(p)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm leading-tight">{p.nome}</CardTitle>
                      <Badge className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Talhão</span>
                      <span className="font-medium">{p.talhaoNome} • {p.areaHa} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produto</span>
                      <span className="font-medium">{p.produto}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zonas</span>
                      <span className="font-medium">{p.zonas.length} zonas • dose base {p.doseBase} {p.unidade}</span>
                    </div>
                    {p.fonteDados && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fonte</span>
                        <span className="font-medium">{FONTE_LABELS[p.fonteDados]}</span>
                      </div>
                    )}
                    {p.economiaEstimada && (
                      <div className="flex justify-between pt-1.5 border-t border-border mt-2">
                        <span className="text-muted-foreground">Economia</span>
                        <span className="font-semibold text-emerald-600">
                          R$ {p.economiaEstimada.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Export GeoJSON rápido */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Exportar todos os dados em GeoJSON</p>
            <p className="text-xs text-muted-foreground">
              Formato universal compatível com QGIS, ArcGIS e outros sistemas GIS
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              exportAsGeoJSON(talhoesMapa, "talhoes-fazenda");
              toast({ title: "GeoJSON exportado" });
            }}
          >
            <FileDown className="h-4 w-4 mr-2" />
            GeoJSON
          </Button>
        </CardContent>
      </Card>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <NovaPrescricaoDialog
        open={novaOpen}
        onOpenChange={setNovaOpen}
        onCreate={(p) => setPrescricoes((prev) => [p, ...prev])}
      />
      <PrescricaoDetailSheet prescricao={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
