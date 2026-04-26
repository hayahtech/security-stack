import { useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Radio, Upload, FileDown, Play, BarChart2, Route,
  Wind, Thermometer, Battery, Droplets, AlertTriangle,
  Clock, MapPin, Zap, Activity, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { operacoesMock } from "@/data/operacoes-campo-mock";
import {
  importarTelemetria, gerarTelemetriaMock, amostrarPontos, formatarDuracao,
  type TelemetriaImportada, type PontoTelemetria,
} from "@/lib/telemetria-dji";
import { gerarRelatorioPDF, gerarRelatorioSintetico } from "@/lib/relatorio-pdf";

// ── Cor do ponto por velocidade ──────────────────────────────────────────────
function corVelocidade(vel: number): string {
  if (vel < 3) return "#6b7280"; // parado
  if (vel < 5) return "#3b82f6"; // lento
  if (vel < 7) return "#22c55e"; // normal
  if (vel < 9) return "#f59e0b"; // rápido
  return "#ef4444";              // muito rápido
}

function corSpray(p: PontoTelemetria): string {
  if (p.sprayAtivo === undefined) return "#6b7280";
  return p.sprayAtivo ? "#22c55e" : "#ef4444";
}

// ── Mapa de Trajetória ───────────────────────────────────────────────────────
function MapaTrajetoria({
  pontos,
  modo,
}: {
  pontos: PontoTelemetria[];
  modo: "velocidade" | "spray" | "altitude";
}) {
  const amostrados = useMemo(() => amostrarPontos(pontos, 1200), [pontos]);

  const center: [number, number] = useMemo(() => {
    if (amostrados.length === 0) return [-19.745, -47.934];
    const latMed = amostrados.reduce((s, p) => s + p.lat, 0) / amostrados.length;
    const lngMed = amostrados.reduce((s, p) => s + p.lng, 0) / amostrados.length;
    return [latMed, lngMed];
  }, [amostrados]);

  const altMin = useMemo(() => Math.min(...amostrados.map((p) => p.altitude)), [amostrados]);
  const altMax = useMemo(() => Math.max(...amostrados.map((p) => p.altitude)), [amostrados]);

  const trajetoria: [number, number][] = amostrados.map((p) => [p.lat, p.lng]);

  return (
    <div className="w-full h-[480px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; Esri — World Imagery"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Linha de trajetória */}
        <Polyline
          positions={trajetoria}
          pathOptions={{ color: "#ffffff30", weight: 1, dashArray: "3,3" }}
        />

        {/* Pontos coloridos */}
        {amostrados.map((p, i) => {
          let cor = "#6b7280";
          if (modo === "velocidade") cor = corVelocidade(p.velocidade);
          if (modo === "spray") cor = corSpray(p);
          if (modo === "altitude") {
            const norm = altMax > altMin ? (p.altitude - altMin) / (altMax - altMin) : 0.5;
            const r = Math.round(255 * (1 - norm));
            const g = Math.round(200 * norm);
            cor = `rgb(${r},${g},80)`;
          }

          return (
            <CircleMarker
              key={i}
              center={[p.lat, p.lng]}
              radius={2.5}
              pathOptions={{ color: "transparent", fillColor: cor, fillOpacity: 0.85 }}
            >
              <Tooltip>
                <div className="text-xs">
                  <div>{p.timestamp.toLocaleTimeString("pt-BR")}</div>
                  <div>Vel: {p.velocidade.toFixed(1)} m/s</div>
                  <div>Alt: {p.altitude.toFixed(1)} m</div>
                  {p.bateria != null && <div>Bat: {p.bateria}%</div>}
                  {p.sprayAtivo != null && <div>Spray: {p.sprayAtivo ? "✅" : "❌"}</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Ponto inicial e final */}
        {amostrados.length > 0 && (
          <>
            <CircleMarker
              center={[amostrados[0].lat, amostrados[0].lng]}
              radius={6}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1 }}
            >
              <Tooltip permanent>🛫 Início</Tooltip>
            </CircleMarker>
            <CircleMarker
              center={[amostrados[amostrados.length - 1].lat, amostrados[amostrados.length - 1].lng]}
              radius={6}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1 }}
            >
              <Tooltip permanent>🛬 Fim</Tooltip>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

// ── Legenda do mapa ──────────────────────────────────────────────────────────
function LegendaMapa({ modo }: { modo: "velocidade" | "spray" | "altitude" }) {
  if (modo === "velocidade") {
    return (
      <div className="flex flex-wrap gap-3 text-xs mt-2">
        {[
          { cor: "#6b7280", label: "< 3 m/s (parado)" },
          { cor: "#3b82f6", label: "3-5 m/s" },
          { cor: "#22c55e", label: "5-7 m/s (normal)" },
          { cor: "#f59e0b", label: "7-9 m/s" },
          { cor: "#ef4444", label: "> 9 m/s" },
        ].map((i) => (
          <div key={i.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: i.cor }} />
            <span className="text-muted-foreground">{i.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (modo === "spray") {
    return (
      <div className="flex gap-4 text-xs mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Spray ativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Sem spray (trânsito)</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs mt-2">
      <span className="text-muted-foreground">Baixo</span>
      <div className="h-2 w-32 rounded" style={{ background: "linear-gradient(to right, rgb(255,0,80), rgb(80,200,80))" }} />
      <span className="text-muted-foreground">Alto</span>
      <span className="text-muted-foreground ml-2">(altitude AGL)</span>
    </div>
  );
}

// ── Gráfico de velocidade (sparkline SVG) ────────────────────────────────────
function SparklineVelocidade({ pontos }: { pontos: PontoTelemetria[] }) {
  const amostrados = useMemo(() => amostrarPontos(pontos, 200), [pontos]);
  if (amostrados.length < 2) return null;

  const vels = amostrados.map((p) => p.velocidade);
  const min = Math.min(...vels);
  const max = Math.max(...vels);
  const W = 400;
  const H = 60;

  const pts = amostrados.map((p, i) => {
    const x = (i / (amostrados.length - 1)) * W;
    const y = H - ((p.velocidade - min) / (max - min || 1)) * H;
    return `${x},${y}`;
  });

  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-1 flex justify-between">
        <span>Velocidade ao longo do voo</span>
        <span>min {min.toFixed(1)} / max {max.toFixed(1)} m/s</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12 rounded border border-border">
        <defs>
          <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${pts.join(" ")} ${W},${H}`}
          fill="url(#velGrad)"
        />
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function TelemetriaPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [telemetria, setTelemetria] = useState<TelemetriaImportada | null>(null);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<"velocidade" | "spray" | "altitude">("velocidade");
  const [opSelecionadaId, setOpSelecionadaId] = useState<string>("op-003");

  const opSelecionada = useMemo(
    () => operacoesMock.find((o) => o.id === opSelecionadaId) ?? operacoesMock[0],
    [opSelecionadaId],
  );

  const handleImport = async (file: File) => {
    setLoading(true);
    try {
      const result = await importarTelemetria(file);
      setTelemetria(result);
      toast({
        title: "Telemetria importada",
        description: `${result.stats.totalPontos.toLocaleString("pt-BR")} pontos • ${result.formatoDetectado}`,
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

  const carregarMock = () => {
    const mock = gerarTelemetriaMock();
    setTelemetria(mock);
    toast({
      title: "Telemetria de demonstração carregada",
      description: `${mock.stats.totalPontos} pontos • Pasto Grande (DJI Agras T40)`,
    });
  };

  const stats = telemetria?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            Telemetria de Voo & Relatório de Conformidade
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import CSV/JSON do DJI SmartFarm • Mapa de cobertura • Laudo PDF (Lei 7.802/89)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={carregarMock}
          >
            <Play className="h-4 w-4 mr-2" />
            Demo (Pasto Grande)
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? "Importando..." : "Import CSV/JSON"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.json,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Seleção de operação + PDF */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Operação para o Laudo PDF
              </p>
              <Select value={opSelecionadaId} onValueChange={setOpSelecionadaId}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operacoesMock.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.id} — {o.talhaoNome} ({o.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!opSelecionada) return;
                  gerarRelatorioPDF(opSelecionada, telemetria?.stats);
                  toast({ title: "PDF gerado", description: `laudo-${opSelecionada.id}.pdf` });
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Laudo Individual PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  gerarRelatorioSintetico(operacoesMock);
                  toast({ title: "Relatório sintético gerado", description: "Todas as operações" });
                }}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Relatório Geral
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado vazio */}
      {!telemetria && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Route className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Nenhuma telemetria carregada</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Importe um arquivo CSV/JSON exportado pelo DJI SmartFarm, ou use a demonstração
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={carregarMock} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Carregar Demo
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Arquivo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Formatos: CSV (.csv, .txt) • JSON (.json) — colunas lat/lng detectadas automaticamente
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dados carregados */}
      {telemetria && stats && (
        <>
          {/* Badge de arquivo */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
            <Radio className="h-4 w-4 text-primary" />
            <span className="font-medium">{telemetria.nomeArquivo}</span>
            <span className="text-muted-foreground">— {telemetria.formatoDetectado}</span>
            <span className="text-muted-foreground ml-auto">
              {telemetria.dataVoo.toLocaleDateString("pt-BR")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setTelemetria(null)}
            >
              Remover
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase text-muted-foreground">Duração</p>
                </div>
                <p className="text-base font-bold">{formatarDuracao(stats.duracaoSegundos)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Route className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase text-muted-foreground">Distância</p>
                </div>
                <p className="text-base font-bold">{stats.distanciaKm} km</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase text-muted-foreground">Área Coberta</p>
                </div>
                <p className="text-base font-bold">{stats.areaCobertaHa} ha</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase text-muted-foreground">Vel. Média</p>
                </div>
                <p className="text-base font-bold">{stats.velocidadeMedia} m/s</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase text-muted-foreground">Alt. Média</p>
                </div>
                <p className="text-base font-bold">{stats.altitudeMedia} m</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase text-muted-foreground">Bateria</p>
                </div>
                <p className="text-base font-bold">
                  {stats.consumoBateria != null ? `−${stats.consumoBateria}%` : "—"}
                </p>
                {stats.batInicio != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {stats.batInicio}% → {stats.batFim}%
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spray coverage */}
          {stats.pontosSpray > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Cobertura de Spray</span>
                  </div>
                  <Badge variant="outline">{stats.percentCobertura}% do voo</Badge>
                </div>
                <Progress value={stats.percentCobertura} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pontosSpray.toLocaleString("pt-BR")} de {stats.totalPontos.toLocaleString("pt-BR")} pontos com pulverizador ativo
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="mapa">
            <div className="flex items-center gap-3 flex-wrap">
              <TabsList>
                <TabsTrigger value="mapa">Mapa de Trajetória</TabsTrigger>
                <TabsTrigger value="analise">Análise</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 ml-auto">
                <p className="text-xs text-muted-foreground">Colorir por:</p>
                <Select value={modo} onValueChange={(v) => setModo(v as typeof modo)}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="velocidade">Velocidade</SelectItem>
                    <SelectItem value="spray">Spray ativo</SelectItem>
                    <SelectItem value="altitude">Altitude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="mapa" className="mt-3">
              <MapaTrajetoria pontos={telemetria.pontos} modo={modo} />
              <LegendaMapa modo={modo} />
            </TabsContent>

            <TabsContent value="analise" className="mt-3 space-y-4">
              <SparklineVelocidade pontos={telemetria.pontos} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Velocidade */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Velocidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Média</span><strong>{stats.velocidadeMedia} m/s</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Máxima</span><strong>{stats.velocidadeMax} m/s</strong></div>
                  </CardContent>
                </Card>

                {/* Altitude */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Altitude AGL
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Média</span><strong>{stats.altitudeMedia} m</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Mínima</span><strong>{stats.altitudeMin} m</strong></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Máxima</span><strong>{stats.altitudeMax} m</strong></div>
                  </CardContent>
                </Card>
              </div>

              {/* Info formatos */}
              <Card className="bg-blue-500/10 border-blue-400/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 text-xs">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-blue-700 dark:text-blue-300 space-y-1">
                      <p className="font-semibold">Exportando telemetria do DJI SmartFarm:</p>
                      <p>No app SmartFarm Web → Missões → selecione o voo → Exportar → escolha <strong>CSV (Flight Log)</strong> ou <strong>JSON</strong>. As colunas de lat/lng/altitude/spray são detectadas automaticamente.</p>
                      <p>Para o DJI Agras T40/T50: app DJI Agras → Histórico de Missões → Exportar Registro.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
