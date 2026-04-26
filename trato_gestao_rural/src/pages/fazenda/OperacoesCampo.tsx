import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, MapPin, Wind, Thermometer, Droplets, FileText, Download,
  Activity, AlertTriangle, CheckCircle2, Clock, XCircle, Plane,
  Tractor, ChevronRight, Search, Filter, Eye, Layers, Radio,
  FlaskConical, Leaf, CalendarDays, BarChart2, Info,
} from "lucide-react";
import { MapContainer, TileLayer, Polygon, Tooltip as LeafletTooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  operacoesMock, talhoesMapa, TIPO_LABELS, EQUIPAMENTO_LABELS,
  CLASSE_TOXICO_COLOR, getTalhaoOperacaoStatus, calcEficiencia, calcCustoHa,
  type OperacaoCampo, type TipoOperacao, type StatusOperacao, type TipoEquipamento,
} from "@/data/operacoes-campo-mock";
import { exportTalhoesAsKML } from "@/lib/geo-io";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<StatusOperacao, { label: string; color: string; icon: React.ElementType }> = {
  planejada:    { label: "Planejada",    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-400/30",   icon: CalendarDays },
  em_execucao:  { label: "Em execução",  color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-400/30",       icon: Activity },
  concluida:    { label: "Concluída",    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/30", icon: CheckCircle2 },
  cancelada:    { label: "Cancelada",    color: "bg-muted text-muted-foreground border-border",                          icon: XCircle },
};

const TIPO_ICON: Record<TipoOperacao, React.ElementType> = {
  pulverizacao: FlaskConical,
  adubacao:     Leaf,
  dessecacao:   Layers,
  calcario:     BarChart2,
  plantio:      Leaf,
  outro:        FileText,
};

const EQUIP_ICON: Record<TipoEquipamento, React.ElementType> = {
  drone:  Plane,
  trator: Tractor,
  aviao:  Plane,
  costal: Activity,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function diasParaCarencia(vence?: string): number | null {
  if (!vence) return null;
  const diff = Math.ceil((new Date(vence).getTime() - Date.now()) / 86400000);
  return diff;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusOperacao }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function TipoIcon({ tipo, className = "h-4 w-4" }: { tipo: TipoOperacao; className?: string }) {
  const Icon = TIPO_ICON[tipo];
  return <Icon className={className} />;
}

// ── Mapa de talhões com overlay de status de aplicação ───────────────────────

function MapaOperacoes({
  operacoes,
  selectedTalhao,
  onSelectTalhao,
}: {
  operacoes: OperacaoCampo[];
  selectedTalhao: string | null;
  onSelectTalhao: (id: string) => void;
}) {
  const CENTER: [number, number] = [-19.745, -47.934];

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={CENTER}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />

        {talhoesMapa.map((talhao) => {
          const { color, fill, label, op } = getTalhaoOperacaoStatus(talhao.id, operacoes);
          const isSelected = selectedTalhao === talhao.id;

          return (
            <Polygon
              key={talhao.id}
              positions={talhao.coords}
              pathOptions={{
                color: isSelected ? "#F0C040" : color,
                fillColor: fill,
                weight: isSelected ? 3 : 2,
                fillOpacity: 1,
                opacity: 1,
              }}
              eventHandlers={{ click: () => onSelectTalhao(talhao.id) }}
            >
              <LeafletTooltip permanent direction="center" className="leaflet-tooltip-clean">
                <div className="text-center text-[11px] font-semibold leading-tight">
                  <div>{talhao.nome}</div>
                  <div className="text-[10px] font-normal opacity-80">{talhao.areaHa} ha</div>
                  <div className="text-[10px] font-normal opacity-70">{label}</div>
                  {op && (
                    <div className="text-[10px] font-normal opacity-70">
                      {TIPO_LABELS[op.tipo]}
                    </div>
                  )}
                </div>
              </LeafletTooltip>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Legenda */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg p-2.5 border border-border text-[11px] space-y-1.5 shadow-md">
        <p className="font-semibold text-foreground mb-1">Status do Talhão</p>
        {[
          { color: "#22c55e", label: "Liberado" },
          { color: "#f59e0b", label: "Em carência" },
          { color: "#ef4444", label: "Em execução" },
          { color: "#3b82f6", label: "Planejado" },
          { color: "#6b7280", label: "Sem registro" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card de operação na lista ────────────────────────────────────────────────

function OperacaoCard({
  op,
  selected,
  onClick,
}: {
  op: OperacaoCampo;
  selected: boolean;
  onClick: () => void;
}) {
  const TipoIconEl = TIPO_ICON[op.tipo];
  const diasCarencia = diasParaCarencia(op.carenciaVence);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md
        ${selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
    >
      <div className="flex items-start gap-2.5">
        {/* Ícone tipo */}
        <div className="mt-0.5 rounded-md bg-muted p-1.5 shrink-0">
          <TipoIconEl className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{TIPO_LABELS[op.tipo]}</p>
            <StatusBadge status={op.status} />
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3 inline mr-0.5" />
            {op.talhaoNome} · {op.areaHa} ha
          </p>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              {formatDate(op.dataInicio)}
            </span>
            {op.produtos.slice(0, 1).map((p, i) => (
              <span key={i} className="text-[11px] text-foreground/70 truncate max-w-[160px]">
                {p.nome}
              </span>
            ))}
            {op.produtos.length > 1 && (
              <span className="text-[11px] text-muted-foreground">+{op.produtos.length - 1}</span>
            )}
          </div>

          {/* Carência ativa */}
          {op.status === "concluida" && diasCarencia !== null && diasCarencia > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              Carência: {diasCarencia} dia{diasCarencia !== 1 ? "s" : ""} restante{diasCarencia !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground">
            R$ {op.custoTotal.toLocaleString("pt-BR")}
          </p>
          {op.areaCobertaHa && (
            <p className="text-[11px] text-muted-foreground">
              {calcCustoHa(op)} R$/ha
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Drawer de detalhes da operação ───────────────────────────────────────────

function OperacaoDetailSheet({
  op,
  open,
  onClose,
}: {
  op: OperacaoCampo | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!op) return null;

  const TipoIconEl = TIPO_ICON[op.tipo];
  const EquipIconEl = EQUIP_ICON[op.equipamento.tipo];
  const eficiencia = calcEficiencia(op);
  const diasCarencia = diasParaCarencia(op.carenciaVence);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <TipoIconEl className="h-4 w-4 text-primary" />
            </div>
            {TIPO_LABELS[op.tipo]}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={op.status} />
            <span className="text-muted-foreground text-xs">
              {op.talhaoNome} · {op.areaHa} ha
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Datas + Cobertura */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Execução</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Início</p>
                <p className="text-sm font-medium">{formatDateTime(op.dataInicio)}</p>
              </div>
              {op.dataFim && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Término</p>
                  <p className="text-sm font-medium">{formatDateTime(op.dataFim)}</p>
                </div>
              )}
            </div>

            {op.areaCobertaHa !== undefined && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cobertura real</span>
                  <span className="font-bold text-foreground">{eficiencia}%</span>
                </div>
                <Progress value={eficiencia} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {op.areaCobertaHa} ha cobertos de {op.areaPlanejaHa} ha planejados
                </p>
              </div>
            )}
          </section>

          <Separator />

          {/* Produtos */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Produtos Aplicados</h3>
            <div className="space-y-2">
              {op.produtos.map((p, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.principioAtivo}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CLASSE_TOXICO_COLOR[p.classeToxico]}`}>
                      Classe {p.classeToxico}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Dose</p>
                      <p className="font-medium">{p.dose} {p.unidade}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vol. total</p>
                      <p className="font-medium">{p.volumeTotal.toLocaleString("pt-BR")} {p.unidade.includes("kg") || p.unidade.includes("t") ? "kg" : "mL"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Custo</p>
                      <p className="font-medium">R$ {p.custo.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Registro MAPA: {p.registroMapa}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Equipamento + Operador */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Equipamento & Operador</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                <EquipIconEl className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{op.equipamento.modelo}</p>
                  <p className="text-xs text-muted-foreground">{EQUIPAMENTO_LABELS[op.equipamento.tipo]}</p>
                  {op.equipamento.registro && (
                    <p className="text-[11px] text-muted-foreground">{op.equipamento.registro}</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-sm font-medium">{op.operador.nome}</p>
                <p className="text-xs text-muted-foreground">{op.operador.documento}</p>
                {op.operador.art && (
                  <p className="text-[11px] text-muted-foreground">ART: {op.operador.art}</p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Clima */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Condições Climáticas</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <Wind className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                <p className="text-sm font-bold">{op.clima.vento}</p>
                <p className="text-[10px] text-muted-foreground">km/h</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <Thermometer className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                <p className="text-sm font-bold">{op.clima.temperatura}°C</p>
                <p className="text-[10px] text-muted-foreground">Temperatura</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                <Droplets className="h-4 w-4 mx-auto text-sky-500 mb-1" />
                <p className="text-sm font-bold">{op.clima.umidade}%</p>
                <p className="text-[10px] text-muted-foreground">Umidade</p>
              </div>
            </div>
            {op.clima.chuvaUltimas24h && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-500/10 p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Chuva nas últimas 24h — verificar deriva e eficácia
              </div>
            )}
          </section>

          {/* Carência */}
          {op.carenciaVence && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Carência
                </h3>
                <div className={`rounded-lg p-3 ${
                  diasCarencia !== null && diasCarencia > 0
                    ? "bg-amber-500/10 border border-amber-400/30"
                    : "bg-emerald-500/10 border border-emerald-400/30"
                }`}>
                  <p className="text-sm font-semibold">
                    {diasCarencia !== null && diasCarencia > 0
                      ? `⚠️ ${diasCarencia} dia${diasCarencia !== 1 ? "s" : ""} restante${diasCarencia !== 1 ? "s" : ""}`
                      : "✅ Carência encerrada — talhão liberado"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vence em: {formatDate(op.carenciaVence)} · {op.carenciaDias} dias totais
                  </p>
                </div>
              </section>
            </>
          )}

          {/* Observações */}
          {op.observacoes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Observações</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{op.observacoes}</p>
              </section>
            </>
          )}

          {/* Custo total */}
          <Separator />
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Custo total da operação</p>
              {op.areaCobertaHa && (
                <p className="text-[11px] text-muted-foreground">R$ {calcCustoHa(op)}/ha</p>
              )}
            </div>
            <p className="text-xl font-bold font-display text-foreground">
              R$ {op.custoTotal.toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pb-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                const talhao = talhoesMapa.find((t) => t.id === selected?.talhaoId);
                if (talhao) {
                  exportTalhoesAsKML([talhao], `talhao-${talhao.id}`);
                  toast({ title: "KML exportado", description: "Pronto para importar no DJI SmartFarm" });
                }
              }}
            >
              <Download className="h-4 w-4" />
              Exportar KML
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate("/fazenda/telemetria")}>
              <Layers className="h-4 w-4" />
              Import Telemetria
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Formulário de nova operação ──────────────────────────────────────────────

const TIPOS_OPCAO: { value: TipoOperacao; label: string }[] = [
  { value: "pulverizacao", label: "Pulverização (defensivo)" },
  { value: "adubacao", label: "Adubação / Fertilização" },
  { value: "dessecacao", label: "Dessecação" },
  { value: "calcario", label: "Calcário / Corretivo" },
  { value: "plantio", label: "Plantio" },
  { value: "outro", label: "Outro" },
];

const EQUIP_OPCAO: { value: TipoEquipamento; label: string }[] = [
  { value: "drone", label: "Drone Agrícola" },
  { value: "trator", label: "Trator + Implemento" },
  { value: "aviao", label: "Aviação Agrícola" },
  { value: "costal", label: "Pulverizador Costal / Manual" },
];

function NovaOperacaoDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<TipoOperacao>("pulverizacao");
  const [talhao, setTalhao] = useState("");
  const [equipTipo, setEquipTipo] = useState<TipoEquipamento>("drone");
  const [equipModelo, setEquipModelo] = useState("");
  const [operadorNome, setOperadorNome] = useState("");
  const [produto, setProduto] = useState("");
  const [principioAtivo, setPrincipioAtivo] = useState("");
  const [dose, setDose] = useState("");
  const [unidade, setUnidade] = useState("L/ha");
  const [areaHa, setAreaHa] = useState("");
  const [vento, setVento] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [carenciaDias, setCarenciaDias] = useState("0");
  const [observacoes, setObservacoes] = useState("");

  function handleSave() {
    if (!talhao || !produto || !areaHa) {
      toast({ title: "Campos obrigatórios", description: "Preencha o talhão, produto e área.", variant: "destructive" });
      return;
    }
    toast({
      title: "Operação registrada",
      description: `${TIPO_LABELS[tipo]} em ${talhoesMapa.find((t) => t.id === talhao)?.nome ?? talhao} registrada com sucesso.`,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Operação de Campo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Tipo + Talhão */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de operação *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoOperacao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_OPCAO.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Talhão *</Label>
              <Select value={talhao} onValueChange={setTalhao}>
                <SelectTrigger><SelectValue placeholder="Selecionar talhão" /></SelectTrigger>
                <SelectContent>
                  {talhoesMapa.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome} ({t.areaHa} ha)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Produto */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              Produto / Insumo
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome comercial *</Label>
                <Input value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Ex: Roundup Transorb R" />
              </div>
              <div className="space-y-1.5">
                <Label>Princípio ativo</Label>
                <Input value={principioAtivo} onChange={(e) => setPrincipioAtivo(e.target.value)} placeholder="Ex: Glifosato" />
              </div>
              <div className="space-y-1.5">
                <Label>Dose</Label>
                <Input type="number" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="3.0" />
              </div>
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["L/ha", "mL/ha", "kg/ha", "g/ha", "t/ha"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Área a cobrir (ha) *</Label>
                <Input type="number" value={areaHa} onChange={(e) => setAreaHa(e.target.value)} placeholder="25" />
              </div>
              <div className="space-y-1.5">
                <Label>Dias de carência</Label>
                <Input type="number" value={carenciaDias} onChange={(e) => setCarenciaDias(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Equipamento */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              Equipamento & Operador
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de equipamento</Label>
                <Select value={equipTipo} onValueChange={(v) => setEquipTipo(v as TipoEquipamento)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EQUIP_OPCAO.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Modelo</Label>
                <Input value={equipModelo} onChange={(e) => setEquipModelo(e.target.value)} placeholder="Ex: DJI Agras T40" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Nome do operador</Label>
                <Input value={operadorNome} onChange={(e) => setOperadorNome(e.target.value)} placeholder="Nome completo" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Clima */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wind className="h-4 w-4 text-primary" />
              Condições Climáticas
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Wind className="h-3 w-3" /> Vento (km/h)
                </Label>
                <Input type="number" value={vento} onChange={(e) => setVento(e.target.value)} placeholder="8" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Thermometer className="h-3 w-3" /> Temperatura (°C)
                </Label>
                <Input type="number" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} placeholder="24" />
              </div>
            </div>
            {Number(vento) > 15 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 rounded-lg bg-amber-500/10 p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Vento acima de 15 km/h — risco de deriva. Considere reagendar.
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Condições da cultura, zonas de aplicação localizada, não conformidades..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Registrar Operação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function OperacoesCampo() {
  const navigate = useNavigate();
  const [operacoes] = useState<OperacaoCampo[]>(operacoesMock);
  const [selectedOp, setSelectedOp] = useState<OperacaoCampo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [novaOpOpen, setNovaOpOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [selectedTalhao, setSelectedTalhao] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("mapa");

  // ── KPIs ──
  const kpis = useMemo(() => {
    const concluidas = operacoes.filter((o) => o.status === "concluida");
    const emCarencia = operacoes.filter((o) => {
      if (o.status !== "concluida" || !o.carenciaVence) return false;
      return new Date(o.carenciaVence) > new Date();
    });
    const areaCoberta = concluidas.reduce((s, o) => s + (o.areaCobertaHa ?? o.areaPlanejaHa), 0);
    const custoTotal = operacoes.reduce((s, o) => s + o.custoTotal, 0);
    const emExecucao = operacoes.filter((o) => o.status === "em_execucao");

    return { concluidas: concluidas.length, emCarencia: emCarencia.length, areaCoberta, custoTotal, emExecucao: emExecucao.length };
  }, [operacoes]);

  // ── Filtros ──
  const filtered = useMemo(() => {
    let list = operacoes;
    if (filterTipo !== "todos") list = list.filter((o) => o.tipo === filterTipo);
    if (filterStatus !== "todos") list = list.filter((o) => o.status === filterStatus);
    if (selectedTalhao) list = list.filter((o) => o.talhaoId === selectedTalhao);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.talhaoNome.toLowerCase().includes(q) ||
          TIPO_LABELS[o.tipo].toLowerCase().includes(q) ||
          o.produtos.some((p) => p.nome.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  }, [operacoes, filterTipo, filterStatus, selectedTalhao, search]);

  function handleSelectOp(op: OperacaoCampo) {
    setSelectedOp(op);
    setSheetOpen(true);
    setSelectedTalhao(op.talhaoId);
  }

  function handleSelectTalhao(talhaoId: string) {
    if (selectedTalhao === talhaoId) {
      setSelectedTalhao(null);
    } else {
      setSelectedTalhao(talhaoId);
      // abre o último op desse talhão
      const op = operacoes
        .filter((o) => o.talhaoId === talhaoId)
        .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())[0];
      if (op) {
        setSelectedOp(op);
        setSheetOpen(true);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            Operações de Campo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pulverização · Adubação · Dessecação · Calcário · Controle de carência
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/fazenda/telemetria")}
          >
            <Radio className="h-4 w-4" />
            Telemetria
          </Button>
          <Button className="gap-2" onClick={() => setNovaOpOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Operação
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Área coberta (mês)",
            value: `${kpis.areaCoberta.toLocaleString("pt-BR")} ha`,
            icon: MapPin,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Operações concluídas",
            value: kpis.concluidas,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Talhões em carência",
            value: kpis.emCarencia,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Custo total",
            value: `R$ ${kpis.custoTotal.toLocaleString("pt-BR")}`,
            icon: BarChart2,
            color: "text-foreground",
            bg: "bg-muted",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <div className={`rounded-lg p-1.5 ${kpi.bg}`}>
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold font-display ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Em execução — alerta ── */}
      {kpis.emExecucao > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-400/30 p-3">
          <Activity className="h-4 w-4 text-red-500 shrink-0 animate-pulse" />
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            {kpis.emExecucao} operação{kpis.emExecucao > 1 ? "ões" : ""} em andamento agora
          </p>
        </div>
      )}

      {/* ── Layout principal — Mapa + Lista ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: "560px" }}>
        {/* Mapa */}
        <div className="lg:col-span-3 h-[400px] lg:h-auto">
          <MapaOperacoes
            operacoes={operacoes}
            selectedTalhao={selectedTalhao}
            onSelectTalhao={handleSelectTalhao}
          />
        </div>

        {/* Lista de operações */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS_OPCAO.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status tabs */}
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="h-8 text-xs w-full">
              <TabsTrigger value="todos" className="flex-1 text-xs">Todas</TabsTrigger>
              <TabsTrigger value="em_execucao" className="flex-1 text-xs">Ativas</TabsTrigger>
              <TabsTrigger value="concluida" className="flex-1 text-xs">Concluídas</TabsTrigger>
              <TabsTrigger value="planejada" className="flex-1 text-xs">Planejadas</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Talhão selecionado */}
          {selectedTalhao && (
            <div className="flex items-center justify-between text-xs rounded-lg bg-primary/5 border border-primary/20 px-2.5 py-1.5">
              <span className="text-primary font-medium">
                Filtrando: {talhoesMapa.find((t) => t.id === selectedTalhao)?.nome}
              </span>
              <button onClick={() => setSelectedTalhao(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          )}

          {/* Cards de operações */}
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "440px" }}>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Plane className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhuma operação encontrada
              </div>
            ) : (
              filtered.map((op) => (
                <OperacaoCard
                  key={op.id}
                  op={op}
                  selected={selectedOp?.id === op.id}
                  onClick={() => handleSelectOp(op)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Info footer ── */}
      <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Clique em um talhão no mapa para ver as operações registradas.{" "}
          <span className="text-foreground/60">
            Import de telemetria KML/CSV (DJI SmartFarm) e overlay NDVI em desenvolvimento.
          </span>
        </p>
      </div>

      {/* ── Sheets & Dialogs ── */}
      <OperacaoDetailSheet op={selectedOp} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <NovaOperacaoDialog open={novaOpOpen} onClose={() => setNovaOpOpen(false)} />
    </div>
  );
}
