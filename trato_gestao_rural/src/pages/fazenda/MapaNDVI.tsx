import { useState, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Leaf, Upload, AlertTriangle, TrendingUp, Activity,
  Info, Eye, EyeOff, Download, Layers, CalendarDays,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { talhoesMapa } from "@/data/operacoes-campo-mock";
import {
  ndviStatsMock, NDVI_FAIXAS, ndviPolygonColor, getNdviFaixa,
  classificarSaude, SAUDE_META,
  ndviPixelToColor,
  type NdviEstatisticas,
} from "@/lib/ndvi-utils";

// ── GeoRasterLayer via hook do Leaflet ───────────────────────────────────────
// Usa useMap() para acessar a instância nativa e adicionar a camada dinamicamente
interface GeoRasterLayerProps {
  georaster: unknown;
  opacity: number;
}

function GeoRasterLayerComponent({ georaster, opacity }: GeoRasterLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!georaster) return;

    let layer: ReturnType<typeof setTimeout> | null = null;

    import("georaster-layer-for-leaflet").then((mod) => {
      const GeoRasterLayer = mod.default;
      const rasterLayer = new GeoRasterLayer({
        georaster,
        opacity,
        pixelValuesToColorFn: ndviPixelToColor,
        resolution: 256,
      });
      rasterLayer.addTo(map);
      map.fitBounds(rasterLayer.getBounds());

      return () => {
        map.removeLayer(rasterLayer);
      };
    });

    return () => {
      if (layer) clearTimeout(layer);
    };
  }, [georaster, map, opacity]);

  return null;
}

// ── Legenda NDVI ─────────────────────────────────────────────────────────────
function LegendaNDVI() {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        NDVI
      </p>
      <div className="space-y-1">
        {[...NDVI_FAIXAS].reverse().map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded-sm shrink-0"
              style={{ background: f.cor }}
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {f.label}
            </span>
            <span className="text-[10px] text-muted-foreground/60 ml-auto pl-2">
              {f.min.toFixed(2)}–{f.max.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mapa NDVI ────────────────────────────────────────────────────────────────
interface MapaNDVIProps {
  stats: NdviEstatisticas[];
  selectedId: string | null;
  showNDVI: boolean;
  georaster: unknown;
  opacity: number;
  onSelect: (id: string) => void;
}

function MapaLeaflet({ stats, selectedId, showNDVI, georaster, opacity, onSelect }: MapaNDVIProps) {
  const center: [number, number] = [-19.745, -47.934];

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border">
      <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; Esri — World Imagery"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Camada GeoTIFF NDVI quando importada */}
        {georaster && showNDVI && (
          <GeoRasterLayerComponent georaster={georaster} opacity={opacity} />
        )}

        {/* Polígonos coloridos por NDVI (modo simulado ou overlay) */}
        {talhoesMapa.map((t) => {
          const stat = stats.find((s) => s.talhaoId === t.id);
          const ndviMedio = stat?.ndviMedio ?? 0.5;
          const pathOptions = showNDVI && stat
            ? ndviPolygonColor(ndviMedio)
            : { color: "#ffffff", weight: 1.5, fillColor: "#ffffff", fillOpacity: 0.08 };
          const isSelected = t.id === selectedId;

          return (
            <Polygon
              key={t.id}
              positions={t.coords}
              pathOptions={{
                ...pathOptions,
                weight: isSelected ? 3 : pathOptions.weight,
                color: isSelected ? "#f59e0b" : pathOptions.color,
              }}
              eventHandlers={{ click: () => onSelect(t.id) }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <div className="font-bold">{t.nome}</div>
                  <div>{t.areaHa} ha</div>
                  {stat && (
                    <>
                      <div>NDVI médio: {stat.ndviMedio.toFixed(2)}</div>
                      <div>{getNdviFaixa(stat.ndviMedio).label}</div>
                    </>
                  )}
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>

      {showNDVI && <LegendaNDVI />}
    </div>
  );
}

// ── Sheet de detalhe de talhão ───────────────────────────────────────────────
function TalhaoNdviSheet({
  stat,
  onClose,
}: {
  stat: NdviEstatisticas | null;
  onClose: () => void;
}) {
  if (!stat) return null;
  const saude = classificarSaude(stat.ndviMedio);
  const meta = SAUDE_META[saude];

  return (
    <Sheet open={!!stat} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            {stat.talhaoNome}
          </SheetTitle>
          <SheetDescription>
            {stat.areaHa} ha •{" "}
            {stat.fonte === "drone" ? "NDVI via Drone" : stat.fonte === "satelite" ? "NDVI via Satélite" : "Dados simulados"}{" "}
            • {stat.dataCaptura}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Badge saúde */}
          <div className={`p-3 rounded border ${meta.bg} flex items-center gap-2`}>
            <Activity className={`h-4 w-4 ${meta.cor}`} />
            <span className={`font-semibold text-sm ${meta.cor}`}>
              {meta.label} — NDVI médio {stat.ndviMedio.toFixed(2)}
            </span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Mínimo</p>
                <p className="text-base font-bold">{stat.ndviMin.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Médio</p>
                <p className="text-base font-bold">{stat.ndviMedio.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Máximo</p>
                <p className="text-base font-bold">{stat.ndviMax.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por faixa */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Distribuição por vigor</h3>
            <div className="space-y-2">
              {stat.distribuicao.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: d.cor }}
                      />
                      <span className="text-xs">{d.label}</span>
                    </div>
                    <span className="text-xs font-medium">{d.percentArea}%</span>
                  </div>
                  <Progress
                    value={d.percentArea}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recomendação */}
          <Card className="bg-blue-500/10 border-blue-400/30">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {getNdviFaixa(stat.ndviMedio).interpretacao}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {getNdviFaixa(stat.ndviMedio).recomendacao}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Área por faixa */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Área estimada por faixa</h3>
            <div className="space-y-1">
              {stat.distribuicao.map((d) => {
                const areaFaixa = ((d.percentArea / 100) * stat.areaHa).toFixed(1);
                return (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span
                      className="font-medium"
                      style={{ color: d.cor }}
                    >
                      {d.label}
                    </span>
                    <span className="text-muted-foreground">{areaFaixa} ha</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function MapaNDVI() {
  const { toast } = useToast();
  const [showNDVI, setShowNDVI] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [georaster, setGeoraster] = useState<unknown>(null);
  const [opacity, setOpacity] = useState(0.75);
  const [activeTab, setActiveTab] = useState("mapa");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedStat = useMemo(
    () => ndviStatsMock.find((s) => s.talhaoId === selectedId) ?? null,
    [selectedId],
  );

  const kpis = useMemo(() => {
    const total = ndviStatsMock.length;
    const criticos = ndviStatsMock.filter((s) => classificarSaude(s.ndviMedio) === "critico").length;
    const atencao = ndviStatsMock.filter((s) => classificarSaude(s.ndviMedio) === "atencao").length;
    const areaTotal = ndviStatsMock.reduce((s, t) => s + t.areaHa, 0);
    const ndviGeral =
      ndviStatsMock.reduce((s, t) => s + t.ndviMedio * t.areaHa, 0) / (areaTotal || 1);
    return { total, criticos, atencao, areaTotal, ndviGeral };
  }, []);

  const handleImportGeoTIFF = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".tif") && !file.name.toLowerCase().endsWith(".tiff")) {
      toast({
        title: "Formato inválido",
        description: "Selecione um arquivo GeoTIFF (.tif ou .tiff)",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Processando GeoTIFF...", description: file.name });

    try {
      const buffer = await file.arrayBuffer();
      const parseGeoraster = (await import("georaster")).default;
      const parsed = await parseGeoraster(buffer);
      setGeoraster(parsed);
      toast({
        title: "GeoTIFF carregado",
        description: `NDVI sobreposto ao mapa — ${file.name}`,
      });
    } catch (err) {
      toast({
        title: "Erro ao carregar GeoTIFF",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  // Sorted por NDVI médio (piores primeiro para priorização)
  const talhoesSorted = useMemo(
    () => [...ndviStatsMock].sort((a, b) => a.ndviMedio - b.ndviMedio),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-500" />
            Mapa NDVI — Vigor das Pastagens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Índice de vegetação por talhão • Import GeoTIFF de drone ou satélite
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowNDVI((v) => !v)}
          >
            {showNDVI ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showNDVI ? "Ocultar" : "Mostrar"} NDVI
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import GeoTIFF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".tif,.tiff"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportGeoTIFF(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">NDVI Geral</p>
            <p className="text-2xl font-bold mt-1" style={{ color: getNdviFaixa(kpis.ndviGeral).cor }}>
              {kpis.ndviGeral.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{getNdviFaixa(kpis.ndviGeral).label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Área Monitorada</p>
            <p className="text-2xl font-bold mt-1">{kpis.areaTotal}</p>
            <p className="text-xs text-muted-foreground">hectares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Talhões</p>
            <p className="text-2xl font-bold mt-1">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">monitorados</p>
          </CardContent>
        </Card>
        <Card className={kpis.atencao > 0 ? "border-orange-400/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Atenção</p>
              {kpis.atencao > 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            </div>
            <p className="text-2xl font-bold mt-1 text-orange-600">{kpis.atencao}</p>
            <p className="text-xs text-muted-foreground">talhões</p>
          </CardContent>
        </Card>
        <Card className={kpis.criticos > 0 ? "border-red-400/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Críticos</p>
              {kpis.criticos > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{kpis.criticos}</p>
            <p className="text-xs text-muted-foreground">talhões</p>
          </CardContent>
        </Card>
      </div>

      {/* GeoTIFF badge */}
      {georaster && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-sm">
          <Layers className="h-4 w-4 text-green-600" />
          <span className="text-green-700 dark:text-green-300 font-medium">
            GeoTIFF carregado — camada NDVI ativa sobre o mapa
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 text-xs"
            onClick={() => setGeoraster(null)}
          >
            Remover
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="talhoes">Ranking de Talhões</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="mt-4">
          <MapaLeaflet
            stats={ndviStatsMock}
            selectedId={selectedId}
            showNDVI={showNDVI}
            georaster={georaster}
            opacity={opacity}
            onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
          />

          {/* Opacidade slider */}
          {georaster && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-muted-foreground">Opacidade GeoTIFF</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1 h-1 accent-primary"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {Math.round(opacity * 100)}%
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-3">
            Clique em um talhão para ver estatísticas detalhadas • Dados: {ndviStatsMock[0]?.dataCaptura}
          </p>
        </TabsContent>

        <TabsContent value="talhoes" className="mt-4">
          <div className="space-y-2">
            {talhoesSorted.map((stat) => {
              const saude = classificarSaude(stat.ndviMedio);
              const meta = SAUDE_META[saude];
              const faixa = getNdviFaixa(stat.ndviMedio);
              return (
                <Card
                  key={stat.talhaoId}
                  className={`cursor-pointer hover:border-primary transition-colors ${meta.bg}`}
                  onClick={() => {
                    setSelectedId(stat.talhaoId);
                    setActiveTab("mapa");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* NDVI badge */}
                      <div
                        className="w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0"
                        style={{ background: faixa.cor }}
                      >
                        <span className="text-white text-lg font-black leading-none">
                          {stat.ndviMedio.toFixed(2)}
                        </span>
                        <span className="text-white/80 text-[9px] font-bold uppercase tracking-wider">
                          NDVI
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm">{stat.talhaoNome}</p>
                          <Badge className={meta.bg + " border " + meta.cor + " text-xs"}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stat.areaHa} ha •{" "}
                          {stat.fonte === "drone" ? "Drone" : stat.fonte === "satelite" ? "Satélite" : "Simulado"} •{" "}
                          {stat.dataCaptura}
                        </p>
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {faixa.recomendacao}
                        </p>

                        {/* Mini barra de distribuição */}
                        <div className="flex h-2 rounded-full overflow-hidden mt-2 gap-0.5">
                          {stat.distribuicao.map((d) => (
                            <div
                              key={d.label}
                              style={{
                                width: `${d.percentArea}%`,
                                background: d.cor,
                              }}
                              title={`${d.label}: ${d.percentArea}%`}
                            />
                          ))}
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info sobre dados */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Como importar NDVI real:</strong> Processe seu voo de drone no DJI SmartFarm ou no Pix4DFields, exporte o mapa NDVI como GeoTIFF (.tif) e use o botão "Import GeoTIFF" acima.
              </p>
              <p>
                Formatos suportados: GeoTIFF single-band (NDVI −1 a 1), RGB pseudo-color, Sentinel-2 banda B08/B04.
                Projeção: WGS84 (EPSG:4326) ou UTM (reprojetado automaticamente via georaster).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <TalhaoNdviSheet
        stat={selectedStat}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
