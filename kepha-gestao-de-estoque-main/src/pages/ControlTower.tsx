import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Maximize2, Minimize2, Settings, RefreshCw,
  TrendingUp, TrendingDown, Minus,
  Package, AlertTriangle, Truck, Thermometer,
  Users, Activity, BarChart3, Eye, EyeOff,
  Bell, BellOff, ChevronRight, Clock,
} from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer, Treemap, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend,
  Cell,
} from 'recharts';
import type { Category } from '@/types';

// ==================== TYPES ====================

interface PanelConfig {
  pulse: boolean;
  heatmap: boolean;
  timeline: boolean;
  alerts: boolean;
  docks: boolean;
  topMovements: boolean;
  temperatures: boolean;
  operators: boolean;
}

// ==================== HELPERS ====================

const categoryColors: Record<Category, string> = {
  'Eletrônicos': '#0ea5e9',
  'Vestuário': '#a855f7',
  'Casa': '#f59e0b',
  'Alimentos': '#22c55e',
  'Industrial': '#ef4444',
};

function trendArrow(val: number) {
  if (val > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (val < 0) return <TrendingDown className="h-3 w-3 text-destructive" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function tempStatus(current: number, min: number, max: number) {
  if (current < min || current > max) return 'critical';
  if (current < min + 1 || current > max - 1) return 'warning';
  return 'ok';
}

// ==================== COMPONENT ====================

export default function ControlTower() {
  const {
    skus, movements, alerts, docks, cdAreas, serviceOrders,
    users, purchaseOrders, acknowledgeAlert,
  } = useAppStore();

  const [tvMode, setTvMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [panels, setPanels] = useState<PanelConfig>({
    pulse: true, heatmap: true, timeline: true, alerts: true,
    docks: true, topMovements: true, temperatures: true, operators: true,
  });

  // Live temperature simulation
  const [liveTemps, setLiveTemps] = useState<Record<string, number>>({});
  useEffect(() => {
    const initial: Record<string, number> = {};
    cdAreas.forEach(a => {
      if (a.temperature != null) initial[a.id] = a.temperature;
    });
    setLiveTemps(initial);

    const iv = setInterval(() => {
      setLiveTemps(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k] = parseFloat((next[k] + (Math.random() - 0.5) * 0.6).toFixed(1));
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [cdAreas]);

  // Seconds-ago ticker
  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsAgo(differenceInSeconds(new Date(), lastUpdate));
    }, 1000);
    return () => clearInterval(iv);
  }, [lastUpdate]);

  // Auto refresh
  useEffect(() => {
    const ms = parseInt(refreshInterval) * 1000;
    const iv = setInterval(() => setLastUpdate(new Date()), ms);
    return () => clearInterval(iv);
  }, [refreshInterval]);

  // Toggle panel
  const togglePanel = useCallback((key: keyof PanelConfig) => {
    setPanels(p => ({ ...p, [key]: !p[key] }));
  }, []);

  // ===== COMPUTED DATA =====
  const todayMovements = useMemo(() =>
    movements.filter(m => {
      const d = new Date(m.timestamp);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }), [movements]);

  const receivingsToday = useMemo(() =>
    movements.filter(m => m.type === 'ENTRADA' && new Date(m.timestamp).toDateString() === new Date().toDateString()).length || 8
  , [movements]);

  const skusMovedToday = useMemo(() =>
    new Set(todayMovements.map(m => m.skuId)).size || 1243
  , [todayMovements]);

  const openOS = useMemo(() =>
    serviceOrders.filter(s => s.status === 'ABERTA' || s.status === 'EM_ANDAMENTO').length
  , [serviceOrders]);

  const critAlerts = useMemo(() =>
    alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length
  , [alerts]);

  const occupiedDocks = useMemo(() =>
    docks.filter(d => d.status !== 'LIVRE').length
  , [docks]);

  const coldChamber = useMemo(() =>
    cdAreas.find(a => a.type === 'CAMARA_FRIA'), [cdAreas]);

  const activeOperators = useMemo(() =>
    users.filter(u => u.status === 'active').length
  , [users]);

  // Efficiency mock
  const efficiency = 94;
  const prevEfficiency = 91;

  // Pulse metrics
  const pulseMetrics = useMemo(() => [
    { label: 'Recebimentos Hoje', value: receivingsToday, prev: 6, icon: Truck },
    { label: 'SKUs Movimentados', value: skusMovedToday, prev: 1180, icon: Package },
    { label: 'OSs em Aberto', value: openOS, prev: 18, icon: Activity },
    { label: 'Alertas Críticos', value: critAlerts, prev: 5, icon: AlertTriangle },
    { label: 'Docas Ocupadas', value: `${occupiedDocks}/${docks.length}`, prev: null, icon: Truck },
    { label: 'Temp Câmara Fria', value: `${liveTemps[coldChamber?.id || ''] ?? '-18.2'}°C`, prev: null, icon: Thermometer },
    { label: 'Operadores Ativos', value: activeOperators, prev: 10, icon: Users },
    { label: 'Eficiência do Dia', value: `${efficiency}%`, prev: prevEfficiency, icon: BarChart3 },
  ], [receivingsToday, skusMovedToday, openOS, critAlerts, occupiedDocks, docks, liveTemps, coldChamber, activeOperators, efficiency, prevEfficiency]);

  // Heatmap / Treemap data
  const treemapData = useMemo(() => {
    const cats: Record<string, { value: number; turnover: number }> = {};
    skus.forEach(s => {
      if (!cats[s.category]) cats[s.category] = { value: 0, turnover: 0 };
      cats[s.category].value += s.stock * s.cost;
      cats[s.category].turnover += s.salesVolume;
    });
    return Object.entries(cats).map(([name, d]) => ({
      name,
      size: Math.round(d.value),
      turnover: d.turnover,
      color: categoryColors[name as Category] || '#666',
    }));
  }, [skus]);

  // Timeline data (24h)
  const timelineData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}h`,
      entradas: Math.floor(Math.random() * 40) + 5,
      saidas: Math.floor(Math.random() * 35) + 3,
      ajustes: Math.floor(Math.random() * 10),
      media: Math.floor(Math.random() * 20) + 15,
    }));
    return hours;
  }, []);

  // Critical alerts list
  const criticalAlerts = useMemo(() =>
    alerts
      .filter(a => !a.acknowledged)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  , [alerts]);

  // Top SKUs moved
  const topSkusMoved = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; sparkline: number[] }> = {};
    skus.slice(0, 10).forEach(s => {
      counts[s.id] = {
        name: s.name,
        qty: s.salesVolume,
        sparkline: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 10),
      };
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [skus]);

  // Temperature gauges
  const tempGauges = useMemo(() => {
    const chambers = [
      { id: 'camara-fria', name: 'Câmara Fria Carnes', targetMin: -20, targetMax: -16, areaType: 'CAMARA_FRIA' as const },
      { id: 'camara-resf', name: 'Câmara Resfriados', targetMin: 2, targetMax: 8, areaType: 'CAMARA_RESFRIADA' as const },
      { id: 'area-flv', name: 'Câmara FLV', targetMin: 10, targetMax: 15, areaType: 'AREA_FLV' as const },
      { id: 'area-seca', name: 'Área Seco', targetMin: 18, targetMax: 28, areaType: 'AREA_SECA' as const },
    ];

    return chambers.map(c => {
      const area = cdAreas.find(a => a.type === c.areaType);
      const current = area ? (liveTemps[area.id] ?? area.temperature ?? 20) : 20;
      const status = tempStatus(current, c.targetMin, c.targetMax);
      return { ...c, current, status };
    });
  }, [cdAreas, liveTemps]);

  // Operator performance
  const operatorPerf = useMemo(() => {
    const ops = ['Carlos Silva', 'Ana Costa', 'Roberto Almeida', 'Juliana Santos', 'Pedro Lima', 'Maria Oliveira'];
    return ops.map(name => ({
      name,
      completed: Math.floor(Math.random() * 12) + 3,
      inProgress: Math.floor(Math.random() * 3),
      avgTime: `${Math.floor(Math.random() * 20) + 10}min`,
      efficiency: Math.floor(Math.random() * 30) + 70,
    }));
  }, []);

  // ===== FULLSCREEN =====
  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.();
    setTvMode(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.();
    setTvMode(false);
  }, []);

  // ===== RENDER =====
  return (
    <div className={cn(
      'min-h-screen bg-background transition-all duration-300',
      tvMode && 'fixed inset-0 z-50 overflow-auto'
    )}>
      {/* NAV BAR */}
      {!tvMode && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-semibold tracking-wide uppercase text-foreground">
              Torre de Controle — CD São Paulo
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              Atualizado há {secondsAgo}s
            </span>
            <Button variant="ghost" size="sm" onClick={() => setLastUpdate(new Date())}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={enterFullscreen} className="gap-1.5 text-xs">
              <Maximize2 className="h-3.5 w-3.5" /> Modo TV
            </Button>
          </div>
        </div>
      )}

      {/* TV MODE TOP BAR */}
      {tvMode && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-card/80 backdrop-blur border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground">Torre de Controle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {format(new Date(), 'HH:mm:ss')} · Atualizado há {secondsAgo}s
            </span>
            <Button variant="ghost" size="sm" onClick={exitFullscreen}>
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 space-y-3">
        {/* PAINEL 1 — PULSO */}
        {panels.pulse && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {pulseMetrics.map((m, i) => {
              const Icon = m.icon;
              const diff = m.prev != null && typeof m.value === 'number' ? m.value - m.prev : null;
              return (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {diff !== null && trendArrow(diff)}
                    </div>
                    <p className="text-lg font-mono font-bold text-foreground">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ROW 2: Heatmap + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* PAINEL 2 — HEATMAP */}
          {panels.heatmap && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mapa de Calor de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={220}>
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="hsl(var(--border))"
                    content={<CustomTreemapContent />}
                  />
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* PAINEL 3 — TIMELINE */}
          {panels.timeline && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Movimentações por Hora — Hoje
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <RechartsTooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="entradas" stroke="#22c55e" strokeWidth={2} dot={false} name="Entradas" />
                    <Line type="monotone" dataKey="saidas" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Saídas" />
                    <Line type="monotone" dataKey="ajustes" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Ajustes" />
                    <Line type="monotone" dataKey="media" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Média Histórica" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ROW 3: Alerts + Docks + Top SKUs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* PAINEL 4 — ALERTAS */}
          {panels.alerts && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  Alertas Críticos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 max-h-[280px] overflow-auto space-y-1.5">
                {criticalAlerts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum alerta pendente</p>
                )}
                {criticalAlerts.map((a, i) => (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded border transition-all',
                      a.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                      a.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
                      'border-border bg-card',
                      i === 0 && 'animate-pulse'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 h-2 w-2 rounded-full shrink-0',
                      a.severity === 'critical' ? 'bg-destructive' :
                      a.severity === 'warning' ? 'bg-amber-500' : 'bg-primary'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(a.createdAt), 'HH:mm', { locale: ptBR })}
                        {a.skuName && ` · ${a.skuName}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] shrink-0"
                      onClick={() => acknowledgeAlert(a.id)}
                    >
                      OK
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* PAINEL 5 — DOCAS */}
          {panels.docks && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" />
                  Status das Docas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-4 gap-2">
                  {docks.map(d => {
                    const statusColor = d.status === 'LIVRE' ? 'border-emerald-500/40 bg-emerald-500/10'
                      : d.status === 'OCUPADA' ? 'border-primary/40 bg-primary/10'
                      : d.status === 'AGUARDANDO_CONFERENCIA' ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-destructive/40 bg-destructive/10';

                    const statusLabel = d.status === 'LIVRE' ? 'Livre'
                      : d.status === 'OCUPADA' ? 'Ocupada'
                      : d.status === 'AGUARDANDO_CONFERENCIA' ? 'Conferência'
                      : 'Bloqueada';

                    return (
                      <Tooltip key={d.id}>
                        <TooltipTrigger asChild>
                          <div className={cn('rounded border p-2 text-center cursor-default', statusColor)}>
                            <p className="text-sm font-mono font-bold text-foreground">{d.number}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{statusLabel}</p>
                            {d.supplierName && (
                              <p className="text-[9px] text-muted-foreground truncate mt-0.5">{d.supplierName}</p>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p>Doca {d.number} — {statusLabel}</p>
                          {d.poNumber && <p>PO: {d.poNumber}</p>}
                          {d.supplierName && <p>Fornecedor: {d.supplierName}</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PAINEL 6 — TOP MOVIMENTAÇÕES */}
          {panels.topMovements && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Top 10 Movimentações do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 max-h-[280px] overflow-auto">
                <div className="space-y-1">
                  {topSkusMoved.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 transition-colors">
                      <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{s.name}</p>
                      </div>
                      {/* Mini sparkline */}
                      <div className="flex items-end gap-px h-4">
                        {s.sparkline.map((v, j) => (
                          <div
                            key={j}
                            className="w-1 bg-primary/60 rounded-sm"
                            style={{ height: `${(v / 60) * 100}%` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono font-semibold text-foreground w-10 text-right">{s.qty}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ROW 4: Temperatures + Operators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* PAINEL 7 — TEMPERATURAS */}
          {panels.temperatures && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Thermometer className="h-3.5 w-3.5" />
                  Temperatura das Câmaras
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tempGauges.map(g => (
                    <GaugeCard key={g.id} {...g} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PAINEL 8 — OPERADORES */}
          {panels.operators && (
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Performance dos Operadores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-[10px] h-7">Operador</TableHead>
                      <TableHead className="text-[10px] h-7 text-center">Concl.</TableHead>
                      <TableHead className="text-[10px] h-7 text-center">Andamento</TableHead>
                      <TableHead className="text-[10px] h-7 text-center">T. Médio</TableHead>
                      <TableHead className="text-[10px] h-7 w-32">Eficiência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operatorPerf.map((op, i) => {
                      const effColor = op.efficiency >= 90 ? 'text-emerald-500'
                        : op.efficiency >= 70 ? 'text-amber-500' : 'text-destructive';
                      const barColor = op.efficiency >= 90 ? 'bg-emerald-500'
                        : op.efficiency >= 70 ? 'bg-amber-500' : 'bg-destructive';
                      return (
                        <TableRow key={i} className="border-border">
                          <TableCell className="text-xs py-1.5">{op.name}</TableCell>
                          <TableCell className="text-xs text-center font-mono py-1.5">{op.completed}</TableCell>
                          <TableCell className="text-xs text-center font-mono py-1.5">{op.inProgress}</TableCell>
                          <TableCell className="text-xs text-center font-mono py-1.5">{op.avgTime}</TableCell>
                          <TableCell className="py-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${op.efficiency}%` }} />
                              </div>
                              <span className={cn('text-[10px] font-mono font-semibold w-7', effColor)}>{op.efficiency}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* FOOTER */}
      {!tvMode && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Última atualização: há {secondsAgo} segundos
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setLastUpdate(new Date())}>
            <RefreshCw className="h-3 w-3" /> Atualizar agora
          </Button>
        </div>
      )}

      {/* FLOATING SETTINGS BUTTON (TV mode) */}
      {tvMode && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 gap-1.5 text-xs opacity-30 hover:opacity-100 transition-opacity"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" /> Configurar
        </Button>
      )}

      {/* SETTINGS DIALOG */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Configurar Torre de Controle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Painéis Visíveis</Label>
              <div className="space-y-2">
                {([
                  ['pulse', 'Pulso da Operação'],
                  ['heatmap', 'Mapa de Calor de Estoque'],
                  ['timeline', 'Linha do Tempo'],
                  ['alerts', 'Alertas Críticos'],
                  ['docks', 'Status das Docas'],
                  ['topMovements', 'Top Movimentações'],
                  ['temperatures', 'Temperaturas'],
                  ['operators', 'Performance Operadores'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs">{label}</Label>
                    <Switch
                      checked={panels[key]}
                      onCheckedChange={() => togglePanel(key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Intervalo de Atualização</Label>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 segundos</SelectItem>
                  <SelectItem value="60">1 minuto</SelectItem>
                  <SelectItem value="300">5 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => { setTvMode(!tvMode); setSettingsOpen(false); }}
              >
                {tvMode ? <><Minimize2 className="h-3.5 w-3.5 mr-1" /> Sair Modo TV</> : <><Maximize2 className="h-3.5 w-3.5 mr-1" /> Modo TV</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== CUSTOM TREEMAP CONTENT ====================

function CustomTreemapContent(props: any) {
  const { x, y, width, height, name, size, color } = props;
  if (width < 40 || height < 30) return null;

  const formatted = size != null && !isNaN(size)
    ? size >= 1_000_000
      ? `R$ ${(size / 1_000_000).toFixed(1)}M`
      : `R$ ${(size / 1_000).toFixed(0)}K`
    : 'R$ 0';

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.85} stroke={color} strokeWidth={1.5} rx={2} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#FFFFFF" fontSize={11} fontWeight={400} stroke="none">
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={9} fontWeight={400} stroke="none">
        {formatted}
      </text>
    </g>
  );
}

// ==================== GAUGE CARD ====================

function GaugeCard({ name, current, targetMin, targetMax, status }: {
  name: string;
  current: number;
  targetMin: number;
  targetMax: number;
  status: string;
}) {
  const range = targetMax - targetMin;
  const mid = (targetMax + targetMin) / 2;
  const deviation = Math.abs(current - mid);
  const maxDev = range * 1.5;
  const angle = Math.min(deviation / maxDev, 1) * 90;
  const isLeft = current < mid;

  const borderColor = status === 'critical' ? 'border-destructive/60'
    : status === 'warning' ? 'border-amber-500/60'
    : 'border-emerald-500/40';

  const textColor = status === 'critical' ? 'text-destructive'
    : status === 'warning' ? 'text-amber-500'
    : 'text-emerald-500';

  const bgGlow = status === 'critical' ? 'bg-destructive/5'
    : status === 'warning' ? 'bg-amber-500/5'
    : 'bg-emerald-500/5';

  return (
    <div className={cn('rounded-lg border p-3 text-center', borderColor, bgGlow)}>
      {/* Simple gauge visualization */}
      <div className="relative w-16 h-8 mx-auto mb-2 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-16 w-16 mx-auto rounded-full border-4 border-secondary" />
        <div
          className={cn('absolute bottom-0 left-1/2 w-0.5 h-7 origin-bottom transition-transform duration-1000', textColor === 'text-emerald-500' ? 'bg-emerald-500' : textColor === 'text-amber-500' ? 'bg-amber-500' : 'bg-destructive')}
          style={{ transform: `rotate(${isLeft ? -angle : angle}deg)` }}
        />
        <div className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full', textColor === 'text-emerald-500' ? 'bg-emerald-500' : textColor === 'text-amber-500' ? 'bg-amber-500' : 'bg-destructive')} />
      </div>
      <p className={cn('text-xl font-mono font-bold', textColor)}>{current}°C</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{name}</p>
      <p className="text-[9px] text-muted-foreground">Meta: {targetMin}°C a {targetMax}°C</p>
      {status === 'critical' && (
        <Badge className="mt-1 bg-destructive/20 text-destructive border-destructive/30 text-[9px] px-1.5 py-0 animate-pulse">
          FORA DA FAIXA
        </Badge>
      )}
    </div>
  );
}
