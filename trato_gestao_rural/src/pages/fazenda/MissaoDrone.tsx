import { useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, Tooltip, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plane, Play, Download, Settings2, Clock, Route,
  Droplets, Battery, Layers, ChevronRight, Info,
  RotateCcw, Zap, AlertTriangle, CheckCircle2, Wind,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { talhoesMapa } from "@/data/operacoes-campo-mock";
import {
  gerarPlanoMissao, exportarMissaoKML, exportarMissaoWPL,
  formatarTempo, CONFIG_PADRAO, DRONES_PRESET,
  type ConfiguracaoMissao, type PlanoMissao,
} from "@/lib/mission-planner";

// ── Mapa da Missão ────────────────────────────────────────────────────────────
function MapaMissao({
  talhaoId,
  plano,
}: {
  talhaoId: string;
  plano: PlanoMissao | null;
}) {
  const talhao = talhoesMapa.find((t) => t.id === talhaoId);
  const center: [number, number] = talhao
    ? [
        talhao.coords.reduce((s, c) => s + c[0], 0) / talhao.coords.length,
        talhao.coords.reduce((s, c) => s + c[1], 0) / talhao.coords.length,
      ]
    : [-19.745, -47.934];

  return (
    <div className="w-full h-[480px] rounded-lg overflow-hidden border border-border">
      <MapContainer center={center} zoom={16} key={talhaoId} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; Esri — World Imagery"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {/* Contorno do talhão */}
        {talhao && (
          <Polygon
            positions={talhao.coords}
            pathOptions={{ color: "#f59e0b", weight: 2.5, fillColor: "#f59e0b", fillOpacity: 0.1 }}
          >
            <Tooltip sticky>{talhao.nome} — {talhao.areaHa} ha</Tooltip>
          </Polygon>
        )}

        {/* Linhas de voo */}
        {plano?.linhasVoo.map((linha, i) => (
          <Polyline
            key={i}
            positions={linha}
            pathOptions={{
              color: i % 2 === 0 ? "#22c55e" : "#3b82f6",
              weight: 2,
              opacity: 0.85,
            }}
          >
            <Tooltip sticky>Linha {i + 1}</Tooltip>
          </Polyline>
        ))}

        {/* Waypoints de spray */}
        {plano?.waypoints
          .filter((w) => w.acao === "spray_on" || w.acao === "spray_off")
          .map((w, i) => (
            <CircleMarker
              key={i}
              center={[w.lat, w.lng]}
              radius={4}
              pathOptions={{
                color: w.acao === "spray_on" ? "#22c55e" : "#ef4444",
                fillColor: w.acao === "spray_on" ? "#22c55e" : "#ef4444",
                fillOpacity: 1,
              }}
            >
              <Tooltip>{w.acao === "spray_on" ? "🟢 Spray ON" : "🔴 Spray OFF"}</Tooltip>
            </CircleMarker>
          ))}

        {/* Decolagem e pouso */}
        {plano?.waypoints
          .filter((w) => w.acao === "decolagem" || w.acao === "pouso")
          .map((w, i) => (
            <CircleMarker
              key={`base-${i}`}
              center={[w.lat, w.lng]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                fillColor: w.acao === "decolagem" ? "#22c55e" : "#ef4444",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip permanent>{w.acao === "decolagem" ? "🛫" : "🛬"}</Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}

// ── Painel de configuração ────────────────────────────────────────────────────
interface PainelConfigProps {
  config: ConfiguracaoMissao;
  onChange: (c: ConfiguracaoMissao) => void;
}

function PainelConfig({ config, onChange }: PainelConfigProps) {
  const set = <K extends keyof ConfiguracaoMissao>(k: K, v: ConfiguracaoMissao[K]) =>
    onChange({ ...config, [k]: v });

  return (
    <div className="space-y-5">
      {/* Preset de drone */}
      <div>
        <Label className="text-xs font-semibold uppercase text-muted-foreground">
          Preset de Drone
        </Label>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {Object.entries(DRONES_PRESET).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onChange({ ...config, ...(preset as Partial<ConfiguracaoMissao>) })}
            >
              {preset.nome}
            </Button>
          ))}
        </div>
      </div>

      {/* Parâmetros de voo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Velocidade de pulverização (m/s)</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={2} max={12} step={0.5}
              value={[config.velocidadeVoo]}
              onValueChange={([v]) => set("velocidadeVoo", v)}
              className="flex-1"
            />
            <span className="text-sm font-bold w-8 text-right">{config.velocidadeVoo}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Altitude AGL (m)</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={1} max={15} step={0.5}
              value={[config.altitudeAGL]}
              onValueChange={([v]) => set("altitudeAGL", v)}
              className="flex-1"
            />
            <span className="text-sm font-bold w-8 text-right">{config.altitudeAGL}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Largura de faixa (m)</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={3} max={15} step={0.5}
              value={[config.larguraFaixa]}
              onValueChange={([v]) => set("larguraFaixa", v)}
              className="flex-1"
            />
            <span className="text-sm font-bold w-8 text-right">{config.larguraFaixa}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sobreposição lateral (%)</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={0} max={50} step={5}
              value={[config.sobreposicao]}
              onValueChange={([v]) => set("sobreposicao", v)}
              className="flex-1"
            />
            <span className="text-sm font-bold w-8 text-right">{config.sobreposicao}%</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Ângulo de entrada (°)</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={0} max={179} step={5}
              value={[config.anguloEntrada]}
              onValueChange={([v]) => set("anguloEntrada", v)}
              className="flex-1"
            />
            <span className="text-sm font-bold w-12 text-right">{config.anguloEntrada}°</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Margem de segurança (m)</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={1} max={10} step={0.5}
              value={[config.margemSeguranca]}
              onValueChange={([v]) => set("margemSeguranca", v)}
              className="flex-1"
            />
            <span className="text-sm font-bold w-8 text-right">{config.margemSeguranca}</span>
          </div>
        </div>
      </div>

      {/* Parâmetros de produto */}
      <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Vazão da bomba (L/min)</Label>
          <Input
            type="number" step="0.1" min={0.5} max={30}
            value={config.vazaoBomba}
            onChange={(e) => set("vazaoBomba", Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Capacidade da bateria (mAh)</Label>
          <Input
            type="number" step={1000} min={5000} max={50000}
            value={config.capacidadeBat}
            onChange={(e) => set("capacidadeBat", Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ── Cards de estatísticas ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  destaque,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  destaque?: boolean;
}) {
  return (
    <Card className={destaque ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
        </div>
        <p className="text-base font-bold leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MissaoDrone() {
  const { toast } = useToast();
  const [talhaoId, setTalhaoId] = useState<string>("pp-4");
  const [config, setConfig] = useState<ConfiguracaoMissao>({ ...CONFIG_PADRAO });
  const [plano, setPlano] = useState<PlanoMissao | null>(null);
  const [gerando, setGerando] = useState(false);

  const talhaoSelecionado = useMemo(
    () => talhoesMapa.find((t) => t.id === talhaoId) ?? talhoesMapa[0],
    [talhaoId],
  );

  const gerarMissao = useCallback(() => {
    if (!talhaoSelecionado) return;
    setGerando(true);

    // setTimeout para não bloquear a UI durante o cálculo
    setTimeout(() => {
      try {
        const resultado = gerarPlanoMissao(
          talhaoSelecionado.id,
          talhaoSelecionado.nome,
          talhaoSelecionado.coords,
          config,
        );
        setPlano(resultado);
        toast({
          title: "Missão calculada",
          description: `${resultado.estatisticas.totalLinhas} linhas • ${formatarTempo(resultado.estatisticas.tempoTotalMin)} • ${resultado.estatisticas.produtoNecessarioL} L`,
        });
      } catch (err) {
        toast({
          title: "Erro ao calcular missão",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setGerando(false);
      }
    }, 50);
  }, [talhaoSelecionado, config, toast]);

  const stats = plano?.estatisticas;

  // Alertas de configuração
  const alertas = useMemo(() => {
    const lista: string[] = [];
    if (config.velocidadeVoo > 10) lista.push("Velocidade muito alta pode reduzir qualidade de cobertura");
    if (config.altitudeAGL > 5) lista.push("Altitude acima de 5m aumenta deriva por vento");
    if (config.sobreposicao < 5) lista.push("Sobreposição < 5% pode gerar falhas na cobertura");
    if (config.larguraFaixa > 12) lista.push("Faixa > 12m exige bicos de alta pressão");
    return lista;
  }, [config]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            Planejador de Missão de Voo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grade boustrophedon automática • Estimativa de tempo/bateria/produto • Export KML para DJI SmartFarm
          </p>
        </div>
        {plano && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                exportarMissaoKML(plano);
                toast({ title: "KML exportado", description: "Pronto para importar no DJI SmartFarm" });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              KML (DJI)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                exportarMissaoWPL(plano);
                toast({ title: "Waypoints exportados", description: "Formato .waypoints (MAVLink)" });
              }}
            >
              <Route className="h-4 w-4 mr-2" />
              .WPL
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda — Config */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Configuração da Missão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de talhão */}
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Talhão alvo
                </Label>
                <Select value={talhaoId} onValueChange={(v) => { setTalhaoId(v); setPlano(null); }}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
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

              <PainelConfig config={config} onChange={setConfig} />

              {/* Alertas */}
              {alertas.length > 0 && (
                <div className="space-y-1.5">
                  {alertas.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-400/30 rounded p-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {a}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={gerarMissao}
                  disabled={gerando}
                >
                  {gerando ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Calcular Missão
                    </>
                  )}
                </Button>
                {plano && (
                  <Button
                    variant="outline"
                    onClick={() => setPlano(null)}
                    title="Limpar"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita — Mapa + Stats */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="mapa">
            <TabsList>
              <TabsTrigger value="mapa">Mapa de Voo</TabsTrigger>
              <TabsTrigger value="detalhes" disabled={!plano}>Detalhes</TabsTrigger>
            </TabsList>

            <TabsContent value="mapa" className="mt-3">
              <MapaMissao talhaoId={talhaoId} plano={plano} />

              {/* Legenda */}
              <div className="flex flex-wrap gap-4 text-xs mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-1 bg-green-500 rounded" />
                  <span className="text-muted-foreground">Linha par (ida)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-1 bg-blue-500 rounded" />
                  <span className="text-muted-foreground">Linha ímpar (volta)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Spray ON</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Spray OFF</span>
                </div>
              </div>

              {!plano && (
                <div className="mt-3 p-3 rounded bg-muted/50 border border-border text-xs text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 shrink-0" />
                  Configure os parâmetros e clique em <strong>Calcular Missão</strong> para ver as linhas de voo.
                </div>
              )}
            </TabsContent>

            <TabsContent value="detalhes" className="mt-3">
              {plano && stats && (
                <div className="space-y-4">
                  {/* Grade de KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard
                      icon={Layers}
                      label="Linhas de voo"
                      value={String(stats.totalLinhas)}
                      sub={`Faixa efetiva: ${(config.larguraFaixa * (1 - config.sobreposicao / 100)).toFixed(1)} m`}
                    />
                    <StatCard
                      icon={Clock}
                      label="Tempo total"
                      value={formatarTempo(stats.tempoTotalMin)}
                      sub={`Spray: ${formatarTempo(stats.tempoVooMin)} | Trânsito: ${formatarTempo(stats.tempoTransitoMin)}`}
                      destaque
                    />
                    <StatCard
                      icon={Route}
                      label="Distância total"
                      value={`${stats.distanciaTotalKm} km`}
                      sub={`Spray: ${(stats.distanciaVooM / 1000).toFixed(1)} km | Trânsito: ${(stats.distanciaTransitoM / 1000).toFixed(1)} km`}
                    />
                    <StatCard
                      icon={Droplets}
                      label="Produto necessário"
                      value={`${stats.produtoNecessarioL} L`}
                      sub={`Vazão: ${config.vazaoBomba} L/min`}
                      destaque
                    />
                    <StatCard
                      icon={Battery}
                      label="Baterias"
                      value={`${stats.bateriaVoos}×`}
                      sub={`${Math.round(stats.bateriaConsumida / 1000)} Ah consumidos`}
                    />
                    <StatCard
                      icon={CheckCircle2}
                      label="Área coberta"
                      value={`${stats.areaCobertaHa} ha`}
                      sub={`Eficiência: ${stats.eficienciaPercent}%`}
                    />
                  </div>

                  {/* Checklist pré-voo */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Checklist pré-voo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { ok: config.altitudeAGL <= 5, label: `Altitude ${config.altitudeAGL}m AGL (limite recomendado: 5m)` },
                          { ok: config.velocidadeVoo <= 8, label: `Velocidade ${config.velocidadeVoo}m/s (recomendado ≤ 8m/s)` },
                          { ok: config.sobreposicao >= 10, label: `Sobreposição ${config.sobreposicao}% (mínimo: 10%)` },
                          { ok: config.margemSeguranca >= 3, label: `Margem de segurança ${config.margemSeguranca}m (mínimo: 3m)` },
                          { ok: stats.bateriaVoos <= 3, label: `${stats.bateriaVoos} bateria(s) necessária(s) (ideal: ≤ 3)` },
                          { ok: true, label: "Verificar clima: vento < 15 km/h, sem chuva" },
                          { ok: true, label: "Confirmar carência dos produtos aplicados" },
                          { ok: true, label: "Notificar ANAC se voo noturno ou > 400ft AGL" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 ${item.ok ? "bg-green-500" : "bg-amber-500"}`} />
                            <span className={item.ok ? "text-foreground" : "text-amber-700 dark:text-amber-400"}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuração usada */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Parâmetros da missão
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                        {[
                          ["Velocidade spray", `${config.velocidadeVoo} m/s`],
                          ["Altitude AGL", `${config.altitudeAGL} m`],
                          ["Largura de faixa", `${config.larguraFaixa} m`],
                          ["Sobreposição", `${config.sobreposicao}%`],
                          ["Ângulo de entrada", `${config.anguloEntrada}°`],
                          ["Margem de segurança", `${config.margemSeguranca} m`],
                          ["Vazão da bomba", `${config.vazaoBomba} L/min`],
                          ["Capacidade bat.", `${(config.capacidadeBat / 1000).toFixed(0)} Ah`],
                          ["Talhão", `${plano.talhaoNome}`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        exportarMissaoKML(plano);
                        toast({ title: "KML exportado", description: "Importar no DJI SmartFarm → Missões → Importar KML" });
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar KML (DJI SmartFarm)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        exportarMissaoWPL(plano);
                        toast({ title: "Waypoints exportados" });
                      }}
                    >
                      <Route className="h-4 w-4 mr-2" />
                      .WPL
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Info DJI */}
      <Card className="bg-blue-500/10 border-blue-400/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-xs">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Como usar no DJI SmartFarm:</p>
              <p>
                1. Exporte o KML acima → 2. Abra o DJI SmartFarm Web ou app → 3. Missões → Importar → selecione o arquivo KML →
                4. Ajuste altitude e velocidade no app se necessário → 5. Sincronize com o drone → 6. Inicie a missão.
              </p>
              <p>
                O arquivo <strong>.WPL</strong> é compatível com Mission Planner (ArduPilot), QGroundControl e outros GCS open-source.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
