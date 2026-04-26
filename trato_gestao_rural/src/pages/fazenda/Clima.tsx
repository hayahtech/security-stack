import { useState, useEffect, useMemo } from "react";
import {
  Cloud, Droplets, Wind, Thermometer, Sun, Sunrise, Sunset,
  AlertTriangle, Plus, Trash2, CalendarDays, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  LineChart, Line, BarChart, Bar, ComposedChart, Area,
  XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { toast } from "sonner";
import { useFazenda } from "@/contexts/FazendaContext";
import {
  fetchWeather, fetchHistorical, getWeatherInfo,
  calculateTHI, getTHIStatus, calcGDA, calcET0, generateAlerts,
  DEFAULT_FARM_LOCATIONS,
  type WeatherData, type HistoricalMonthly, type ClimateAlert,
} from "@/lib/weather-service";

interface ManualEvent {
  id: string;
  date: string;
  type: string;
  description: string;
}

export default function Clima() {
  const { fazendas, activeFazenda, setActiveFazendaId } = useFazenda();
  const [data, setData] = useState<WeatherData | null>(null);
  const [historical, setHistorical] = useState<HistoricalMonthly[]>([]);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [manualEvents, setManualEvents] = useState<ManualEvent[]>([
    { id: "me1", date: "2025-07-15", type: "Geada", description: "Geada forte — perda parcial de pastagem no pasto 3" },
    { id: "me2", date: "2025-11-20", type: "Granizo", description: "Granizo leve na área de lavoura — sem danos significativos" },
  ]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: new Date().toISOString().slice(0, 10), type: "Geada", description: "" });

  const loc = DEFAULT_FARM_LOCATIONS.find((l) => l.farmId === activeFazenda?.id) || DEFAULT_FARM_LOCATIONS[0];

  useEffect(() => {
    setLoading(true);
    fetchWeather(loc.lat, loc.lon)
      .then(setData)
      .catch(() => toast.error("Erro ao carregar previsão"))
      .finally(() => setLoading(false));
  }, [loc.lat, loc.lon]);

  useEffect(() => {
    setHistLoading(true);
    fetchHistorical(loc.lat, loc.lon)
      .then(setHistorical)
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [loc.lat, loc.lon]);

  const alerts = useMemo(() => data ? generateAlerts(data) : [], [data]);

  const hourly48 = useMemo(() => {
    if (!data) return [];
    return data.hourly.slice(0, 48).map((h) => ({
      time: new Date(h.time).toLocaleString("pt-BR", { day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      temp: h.temperature,
      precip: h.precipitation,
      humidity: h.humidity,
    }));
  }, [data]);

  const agroIndices = useMemo(() => {
    if (!data) return { gdaTotal: 0, et0Avg: 0, thi: 0 };
    const today = data.daily[0];
    const humidity = data.hourly[0]?.humidity || 60;
    const thi = calculateTHI(today.tempMax, humidity);
    const gdaTotal = data.daily.slice(0, 7).reduce((s, d) => s + calcGDA(d.tempMax, d.tempMin), 0);
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const et0Avg = data.daily.slice(0, 7).reduce((s, d) => s + calcET0(d.tempMax, d.tempMin, loc.lat, dayOfYear), 0) / 7;
    return { gdaTotal: Math.round(gdaTotal * 10) / 10, et0Avg: Math.round(et0Avg * 100) / 100, thi };
  }, [data, loc.lat]);

  function addManualEvent() {
    if (!newEvent.description.trim()) { toast.error("Descreva o evento"); return; }
    setManualEvents([{ id: `me${Date.now()}`, ...newEvent }, ...manualEvents]);
    setShowAddEvent(false);
    setNewEvent({ date: new Date().toISOString().slice(0, 10), type: "Geada", description: "" });
    toast.success("Evento climático registrado");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Clima</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Cloud className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">Não foi possível carregar os dados climáticos</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  const currentInfo = getWeatherInfo(data.current.weathercode);
  const thiStatus = getTHIStatus(agroIndices.thi);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" /> Clima
          </h1>
          <p className="text-sm text-muted-foreground">Previsão do tempo e índices agrometeorológicos</p>
        </div>
        <Select value={activeFazenda?.id || ""} onValueChange={setActiveFazendaId}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Selecionar fazenda" /></SelectTrigger>
          <SelectContent>
            {fazendas.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="forecast">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="forecast" className="gap-1"><Sun className="h-3.5 w-3.5" />Previsão 16 dias</TabsTrigger>
          <TabsTrigger value="hourly" className="gap-1"><CalendarDays className="h-3.5 w-3.5" />Próximas 48h</TabsTrigger>
          <TabsTrigger value="agro" className="gap-1"><Thermometer className="h-3.5 w-3.5" />Índices Agro</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />Alertas</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Histórico</TabsTrigger>
        </TabsList>

        {/* ═══ FORECAST 16 DAYS ═══ */}
        <TabsContent value="forecast" className="mt-4 space-y-4">
          {/* Current weather card */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{currentInfo.icon}</span>
                  <div>
                    <p className="text-4xl font-bold text-foreground">{Math.round(data.current.temperature)}°C</p>
                    <p className="text-sm text-muted-foreground">{currentInfo.label}</p>
                    <p className="text-xs text-muted-foreground">{loc.farmName} — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <Droplets className="h-5 w-5 mx-auto text-blue-500" />
                    <p className="text-lg font-bold">{data.hourly[0]?.humidity || "—"}%</p>
                    <p className="text-[10px] text-muted-foreground">Umidade</p>
                  </div>
                  <div className="text-center">
                    <Wind className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-lg font-bold">{Math.round(data.current.windspeed)}</p>
                    <p className="text-[10px] text-muted-foreground">km/h</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="h-5 w-5 mx-auto text-blue-600" />
                    <p className="text-lg font-bold">{(data.daily[0]?.precipitationSum || 0).toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">mm hoje</p>
                  </div>
                  <div className="text-center">
                    <Badge className={`${thiStatus.color} text-xs`}>{thiStatus.icon} THI {agroIndices.thi.toFixed(0)}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{thiStatus.label}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 16-day grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {data.daily.map((d) => {
              const dayInfo = getWeatherInfo(d.weathercode);
              const dayName = new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" });
              const dayDate = new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              return (
                <Card key={d.date} className="text-center">
                  <CardContent className="p-2 space-y-1">
                    <p className="text-xs font-medium capitalize">{dayName}</p>
                    <p className="text-[10px] text-muted-foreground">{dayDate}</p>
                    <span className="text-2xl block">{dayInfo.icon}</span>
                    <p className="text-sm font-bold">{Math.round(d.tempMax)}°</p>
                    <p className="text-xs text-muted-foreground">{Math.round(d.tempMin)}°</p>
                    {d.precipitationSum > 0 && (
                      <p className="text-[10px] text-blue-600 flex items-center justify-center gap-0.5">
                        <Droplets className="h-2.5 w-2.5" /> {d.precipitationSum.toFixed(1)}mm
                      </p>
                    )}
                    {d.precipitationProbMax > 0 && (
                      <p className="text-[10px] text-muted-foreground">{d.precipitationProbMax}%</p>
                    )}
                    <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Wind className="h-2 w-2" /> {Math.round(d.windspeedMax)}
                    </p>
                    <div className="text-[9px] text-muted-foreground space-y-0">
                      <p className="flex items-center justify-center gap-0.5"><Sunrise className="h-2 w-2" /> {d.sunrise.slice(11, 16)}</p>
                      <p className="flex items-center justify-center gap-0.5"><Sunset className="h-2 w-2" /> {d.sunset.slice(11, 16)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ HOURLY 48H ═══ */}
        <TabsContent value="hourly" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Temperatura e Precipitação — Próximas 48h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hourly48}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} interval={5} />
                    <YAxis yAxisId="temp" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="temp" type="monotone" dataKey="temp" name="Temperatura °C" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                    <Bar yAxisId="precip" dataKey="precip" name="Chuva mm" fill="hsl(210, 80%, 60%)" opacity={0.6} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ AGRO INDICES ═══ */}
        <TabsContent value="agro" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center space-y-2">
                <Thermometer className="h-8 w-8 mx-auto text-amber-500" />
                <p className="text-3xl font-bold text-foreground">{agroIndices.gdaTotal}</p>
                <p className="text-sm font-medium">Graus-dia acumulados (7d)</p>
                <p className="text-xs text-muted-foreground">Base 10°C — desenvolvimento de pastagem</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center space-y-2">
                <Droplets className="h-8 w-8 mx-auto text-blue-500" />
                <p className="text-3xl font-bold text-foreground">{agroIndices.et0Avg} mm/dia</p>
                <p className="text-sm font-medium">Evapotranspiração estimada</p>
                <p className="text-xs text-muted-foreground">Útil para irrigação e consumo hídrico</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center space-y-2">
                <Sun className="h-8 w-8 mx-auto text-primary" />
                <p className="text-3xl font-bold text-foreground">{agroIndices.thi.toFixed(0)}</p>
                <Badge className={`${thiStatus.color} text-xs`}>{thiStatus.icon} {thiStatus.label}</Badge>
                <p className="text-sm font-medium">Índice de Conforto Térmico (THI)</p>
                <p className="text-xs text-muted-foreground">&lt;72 Conforto | 72-79 Atenção | &gt;79 Estresse</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily GDA table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Graus-dia por dia (próximos 7 dias)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Máx °C</TableHead>
                    <TableHead>Mín °C</TableHead>
                    <TableHead>GDA</TableHead>
                    <TableHead>THI estimado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.daily.slice(0, 7).map((d) => {
                    const gda = calcGDA(d.tempMax, d.tempMin);
                    const dThi = calculateTHI(d.tempMax, data.hourly[0]?.humidity || 60);
                    const dThiS = getTHIStatus(dThi);
                    return (
                      <TableRow key={d.date}>
                        <TableCell className="text-sm">{new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</TableCell>
                        <TableCell className="text-sm">{d.tempMax.toFixed(1)}°</TableCell>
                        <TableCell className="text-sm">{d.tempMin.toFixed(1)}°</TableCell>
                        <TableCell className="text-sm font-medium">{gda.toFixed(1)}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${dThiS.color}`}>{dThiS.icon} {dThi.toFixed(0)}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ALERTS ═══ */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Sun className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <p className="text-lg font-medium">Sem alertas climáticos</p>
                <p className="text-sm text-muted-foreground">Condições favoráveis previstas para os próximos dias</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((a, i) => {
              const severityColor: Record<string, string> = {
                urgente: "border-destructive/40 bg-destructive/5",
                atencao: "border-amber-500/40 bg-amber-500/5",
                informativo: "border-blue-500/40 bg-blue-500/5",
                sucesso: "border-emerald-500/40 bg-emerald-500/5",
              };
              return (
                <Card key={i} className={`border ${severityColor[a.severity]}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{a.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{a.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ═══ HISTORY ═══ */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {/* Monthly precipitation chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chuva Acumulada Mensal — Últimos 12 meses</CardTitle>
            </CardHeader>
            <CardContent>
              {histLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historical}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="precipitation" name="Chuva (mm)" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Eventos Climáticos Registrados</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowAddEvent(true)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Registrar</Button>
              </div>
              <CardDescription>Registros manuais de eventos climáticos extremos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualEvents.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum evento registrado</TableCell></TableRow>
                  ) : manualEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{new Date(e.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{e.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.description}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setManualEvents(manualEvents.filter((x) => x.id !== e.id))}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual event dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Evento Climático</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Geada", "Granizo", "Seca severa", "Vendaval", "Enchente", "Incêndio", "Outro"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Descreva o evento e seus impactos..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEvent(false)}>Cancelar</Button>
            <Button onClick={addManualEvent}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
