import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Wrench, Plus, Calendar, Clock, DollarSign,
  CheckCircle2, AlertTriangle, XCircle, User, Fuel, MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  mockAssets, mockMaintenanceRecords, maintenanceTypes, getMaintenanceForAsset,
  mockUsageRecords, mockWorkers, turnoLabel, activityLabel, getUsageForAsset,
  getMaintenanceAlertLevel, getHoursSinceLastMaintenance,
  type MaintenanceRecord, type MaintenanceType, type AssetStatus,
  type UsageRecord, type UsageTurno, type UsageActivity,
} from "@/data/maquinas-mock";
import { paddocks } from "@/data/rebanho-mock";

const statusBadge: Record<AssetStatus, { color: string; bg: string; icon: React.ElementType }> = {
  Operacional: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  "Em manutenção": { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", icon: AlertTriangle },
  Inativo: { color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
};

export default function MaquinaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = mockAssets.find((a) => a.id === id);
  const [records, setRecords] = useState<MaintenanceRecord[]>(mockMaintenanceRecords);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>(mockUsageRecords);
  const [openMaint, setOpenMaint] = useState(false);
  const [openUsage, setOpenUsage] = useState(false);

  // Usage filters
  const [usageFilterWorker, setUsageFilterWorker] = useState("all");
  const [usageFilterFrom, setUsageFilterFrom] = useState("");
  const [usageFilterTo, setUsageFilterTo] = useState("");

  const [maintForm, setMaintForm] = useState({
    type: "Preventiva" as MaintenanceType, dateIn: "", dateOut: "", description: "",
    partsReplaced: "", serviceProvider: "", totalCost: "", hourmeterAt: "",
    nextMaintenanceDate: "", nextMaintenanceHourmeter: "",
  });

  const [usageForm, setUsageForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    workerId: "", turno: "manha" as UsageTurno, hours: "",
    hourmeterStart: "", hourmeterEnd: "", odometerStart: "", odometerEnd: "",
    activity: "aracao" as UsageActivity, activityOther: "",
    paddock: "", fuelLiters: "", observations: "",
  });

  const isVehicle = asset?.assetType === "Caminhão" || asset?.assetType === "Moto";
  const allHistory = useMemo(() => asset ? records.filter((r) => r.assetId === asset.id).sort((a, b) => b.dateIn.localeCompare(a.dateIn)) : [], [records, asset]);
  const totalCost = allHistory.reduce((s, r) => s + r.totalCost, 0);

  // Usage for this asset
  const assetUsage = useMemo(() => {
    if (!asset) return [];
    let list = usageRecords.filter(u => u.assetId === asset.id);
    if (usageFilterWorker !== "all") list = list.filter(u => u.workerId === usageFilterWorker);
    if (usageFilterFrom) list = list.filter(u => u.date >= usageFilterFrom);
    if (usageFilterTo) list = list.filter(u => u.date <= usageFilterTo);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [usageRecords, asset, usageFilterWorker, usageFilterFrom, usageFilterTo]);

  const totalUsageHours = assetUsage.reduce((s, u) => s + u.hours, 0);
  const totalFuel = assetUsage.reduce((s, u) => s + (u.fuelLiters || 0), 0);

  // Hours by worker
  const hoursByWorker = useMemo(() => {
    const map: Record<string, { name: string; hours: number }> = {};
    assetUsage.forEach(u => {
      if (!map[u.workerId]) map[u.workerId] = { name: u.workerName, hours: 0 };
      map[u.workerId].hours += u.hours;
    });
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [assetUsage]);

  // Maintenance alert
  const alertLevel = asset ? getMaintenanceAlertLevel(asset) : null;
  const hoursSinceMaint = asset ? getHoursSinceLastMaintenance(asset) : 0;
  const maintPct = asset?.maintenanceIntervalHours ? Math.min((hoursSinceMaint / asset.maintenanceIntervalHours) * 100, 100) : 0;

  if (!asset) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Ativo não encontrado.</p>
          <Button variant="ghost" className="mt-2" onClick={() => navigate("/fazenda/maquinas")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const sc = statusBadge[asset.status];
  const StatusIcon = sc.icon;


  const handleSaveMaint = () => {
    const newRecord: MaintenanceRecord = {
      id: `m${Date.now()}`, assetId: asset.id, type: maintForm.type,
      dateIn: maintForm.dateIn, dateOut: maintForm.dateOut || undefined,
      description: maintForm.description,
      partsReplaced: maintForm.partsReplaced ? maintForm.partsReplaced.split(",").map((s) => s.trim()) : [],
      serviceProvider: maintForm.serviceProvider || undefined,
      totalCost: Number(maintForm.totalCost) || 0,
      hourmeterAt: Number(maintForm.hourmeterAt) || asset.hourmeter,
      nextMaintenanceDate: maintForm.nextMaintenanceDate || undefined,
      nextMaintenanceHourmeter: maintForm.nextMaintenanceHourmeter ? Number(maintForm.nextMaintenanceHourmeter) : undefined,
    };
    setRecords((prev) => [...prev, newRecord]);
    setMaintForm({ type: "Preventiva", dateIn: "", dateOut: "", description: "", partsReplaced: "", serviceProvider: "", totalCost: "", hourmeterAt: "", nextMaintenanceDate: "", nextMaintenanceHourmeter: "" });
    setOpenMaint(false);
    toast.success("Manutenção registrada");
  };

  const handleSaveUsage = () => {
    if (!usageForm.workerId || !usageForm.hours) { toast.error("Trabalhador e horas são obrigatórios"); return; }
    const worker = mockWorkers.find(w => w.id === usageForm.workerId);
    const newUsage: UsageRecord = {
      id: `u${Date.now()}`, assetId: asset.id, date: usageForm.date,
      workerId: usageForm.workerId, workerName: worker?.name || "",
      turno: usageForm.turno, hours: Number(usageForm.hours),
      hourmeterStart: usageForm.hourmeterStart ? Number(usageForm.hourmeterStart) : undefined,
      hourmeterEnd: usageForm.hourmeterEnd ? Number(usageForm.hourmeterEnd) : undefined,
      odometerStart: usageForm.odometerStart ? Number(usageForm.odometerStart) : undefined,
      odometerEnd: usageForm.odometerEnd ? Number(usageForm.odometerEnd) : undefined,
      activity: usageForm.activity,
      activityOther: usageForm.activity === "outros" ? usageForm.activityOther : undefined,
      paddock: usageForm.paddock || undefined,
      fuelLiters: usageForm.fuelLiters ? Number(usageForm.fuelLiters) : undefined,
      observations: usageForm.observations || undefined,
    };
    setUsageRecords(prev => [...prev, newUsage]);
    setUsageForm({ date: new Date().toISOString().slice(0, 10), workerId: "", turno: "manha", hours: "", hourmeterStart: "", hourmeterEnd: "", odometerStart: "", odometerEnd: "", activity: "aracao", activityOther: "", paddock: "", fuelLiters: "", observations: "" });
    setOpenUsage(false);
    toast.success("Uso registrado com sucesso");
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fazenda/maquinas")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-foreground">{asset.name}</h1>
            <p className="text-sm text-muted-foreground">{asset.assetType}{asset.plate ? ` • ${asset.plate}` : ""}{asset.year ? ` • ${asset.year}` : ""}</p>
          </div>
          <Badge variant="outline" className={`gap-1 ${sc.color} ${sc.bg} border-transparent text-sm px-3 py-1`}>
            <StatusIcon className="h-3.5 w-3.5" /> {asset.status}
          </Badge>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Clock className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{isVehicle ? "Hodômetro" : "Horímetro"}</p>
                <p className="text-lg font-bold text-foreground">{asset.hourmeter.toLocaleString("pt-BR")}{isVehicle ? " km" : " h"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><DollarSign className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Custo de Aquisição</p>
                <p className="text-lg font-bold text-foreground">R$ {asset.acquisitionCost.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2"><Wrench className="h-4 w-4 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Custo Total Manutenção</p>
                <p className="text-lg font-bold text-foreground">R$ {totalCost.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance interval alert */}
        {asset.maintenanceIntervalHours && (
          <Card className={`border-border ${alertLevel === "critical" ? "border-red-500/50" : alertLevel === "warning" ? "border-amber-500/50" : ""}`}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Intervalo de Manutenção: a cada {asset.maintenanceIntervalHours}{isVehicle ? " km" : " h"}
                </p>
                <Badge variant="outline" className={
                  alertLevel === "critical" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30" :
                  alertLevel === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" :
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                }>
                  {alertLevel === "critical" ? "⚠️ Manutenção vencida" : alertLevel === "warning" ? "⏰ Próximo da manutenção" : "✅ OK"}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={maintPct} className="flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {hoursSinceMaint}{isVehicle ? " km" : " h"} / {asset.maintenanceIntervalHours}{isVehicle ? " km" : " h"}
                </span>
              </div>
              {alertLevel === "critical" && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Intervalo de manutenção ultrapassado! Agende imediatamente.
                </p>
              )}
              {alertLevel === "warning" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Atingiu 80% do intervalo. Planeje a próxima manutenção.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {asset.notes && (
          <Card className="border-border"><CardContent className="p-4"><p className="text-sm text-muted-foreground">{asset.notes}</p></CardContent></Card>
        )}

        <Separator />

        {/* Tabs: Manutenções + Registro de Uso */}
        <Tabs defaultValue="manutencoes">
          <TabsList>
            <TabsTrigger value="manutencoes">Manutenções</TabsTrigger>
            <TabsTrigger value="uso">Registro de Uso</TabsTrigger>
          </TabsList>

          {/* ── Manutenções Tab ── */}
          <TabsContent value="manutencoes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-foreground">Histórico de Manutenções</h2>
              <Dialog open={openMaint} onOpenChange={setOpenMaint}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Manutenção</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Tipo *</Label>
                      <Select value={maintForm.type} onValueChange={(v) => setMaintForm({ ...maintForm, type: v as MaintenanceType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{maintenanceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Data entrada *</Label><Input type="date" value={maintForm.dateIn} onChange={(e) => setMaintForm({ ...maintForm, dateIn: e.target.value })} /></div>
                      <div><Label>Data saída</Label><Input type="date" value={maintForm.dateOut} onChange={(e) => setMaintForm({ ...maintForm, dateOut: e.target.value })} /></div>
                    </div>
                    <div><Label>Descrição *</Label><Textarea value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} placeholder="Descreva o serviço..." /></div>
                    <div><Label>Peças trocadas (separadas por vírgula)</Label><Input value={maintForm.partsReplaced} onChange={(e) => setMaintForm({ ...maintForm, partsReplaced: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Prestador de serviço</Label><Input value={maintForm.serviceProvider} onChange={(e) => setMaintForm({ ...maintForm, serviceProvider: e.target.value })} /></div>
                      <div><Label>Custo total (R$)</Label><Input type="number" value={maintForm.totalCost} onChange={(e) => setMaintForm({ ...maintForm, totalCost: e.target.value })} /></div>
                    </div>
                    <div><Label>{isVehicle ? "Hodômetro" : "Horímetro"} no momento</Label><Input type="number" value={maintForm.hourmeterAt} onChange={(e) => setMaintForm({ ...maintForm, hourmeterAt: e.target.value })} placeholder={String(asset.hourmeter)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Próx. manutenção (data)</Label><Input type="date" value={maintForm.nextMaintenanceDate} onChange={(e) => setMaintForm({ ...maintForm, nextMaintenanceDate: e.target.value })} /></div>
                      <div><Label>Próx. manutenção ({isVehicle ? "km" : "horímetro"})</Label><Input type="number" value={maintForm.nextMaintenanceHourmeter} onChange={(e) => setMaintForm({ ...maintForm, nextMaintenanceHourmeter: e.target.value })} /></div>
                    </div>
                    <Button className="w-full" onClick={handleSaveMaint} disabled={!maintForm.dateIn || !maintForm.description}>Salvar Manutenção</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Timeline */}
            <div className="relative space-y-0">
              {allHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma manutenção registrada.</p>
              ) : (
                <div className="relative border-l-2 border-border ml-4 space-y-6">
                  {allHistory.map((rec) => {
                    const typeBadgeColor = rec.type === "Corretiva" ? "destructive" : rec.type === "Preventiva" ? "default" : "secondary";
                    return (
                      <div key={rec.id} className="relative pl-8">
                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                        <Card className="border-border">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={typeBadgeColor}>{rec.type}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(rec.dateIn).toLocaleDateString("pt-BR")}
                                  {rec.dateOut && ` → ${new Date(rec.dateOut).toLocaleDateString("pt-BR")}`}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-foreground">R$ {rec.totalCost.toLocaleString("pt-BR")}</span>
                            </div>
                            <p className="text-sm text-foreground">{rec.description}</p>
                            {rec.partsReplaced.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {rec.partsReplaced.map((p, j) => <Badge key={j} variant="outline" className="text-xs">{p}</Badge>)}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              {rec.serviceProvider && <span>Prestador: {rec.serviceProvider}</span>}
                              <span>{isVehicle ? "Hodômetro" : "Horímetro"}: {rec.hourmeterAt.toLocaleString("pt-BR")}</span>
                              {rec.nextMaintenanceDate && <span>Próx.: {new Date(rec.nextMaintenanceDate).toLocaleDateString("pt-BR")}</span>}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Registro de Uso Tab ── */}
          <TabsContent value="uso" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-display font-semibold text-foreground">Histórico de Uso</h2>
              <Dialog open={openUsage} onOpenChange={setOpenUsage}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Registrar Uso</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Uso de Máquina</DialogTitle>
                    <DialogDescription>{asset.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Data *</Label><Input type="date" value={usageForm.date} onChange={(e) => setUsageForm({ ...usageForm, date: e.target.value })} /></div>
                    <div><Label>Trabalhador *</Label>
                      <Select value={usageForm.workerId} onValueChange={(v) => setUsageForm({ ...usageForm, workerId: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o trabalhador" /></SelectTrigger>
                        <SelectContent>{mockWorkers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Turno</Label>
                        <Select value={usageForm.turno} onValueChange={(v) => setUsageForm({ ...usageForm, turno: v as UsageTurno })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(turnoLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Horas Utilizadas *</Label><Input type="number" min={0} step={0.5} value={usageForm.hours} onChange={(e) => setUsageForm({ ...usageForm, hours: e.target.value })} /></div>
                    </div>
                    {!isVehicle && (
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Horímetro Inicial</Label><Input type="number" value={usageForm.hourmeterStart} onChange={(e) => setUsageForm({ ...usageForm, hourmeterStart: e.target.value })} /></div>
                        <div><Label>Horímetro Final</Label><Input type="number" value={usageForm.hourmeterEnd} onChange={(e) => setUsageForm({ ...usageForm, hourmeterEnd: e.target.value })} /></div>
                      </div>
                    )}
                    {isVehicle && (
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Hodômetro Inicial (km)</Label><Input type="number" value={usageForm.odometerStart} onChange={(e) => setUsageForm({ ...usageForm, odometerStart: e.target.value })} /></div>
                        <div><Label>Hodômetro Final (km)</Label><Input type="number" value={usageForm.odometerEnd} onChange={(e) => setUsageForm({ ...usageForm, odometerEnd: e.target.value })} /></div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Atividade</Label>
                        <Select value={usageForm.activity} onValueChange={(v) => setUsageForm({ ...usageForm, activity: v as UsageActivity })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(activityLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Pasto / Área</Label>
                        <Select value={usageForm.paddock} onValueChange={(v) => setUsageForm({ ...usageForm, paddock: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{paddocks.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    {usageForm.activity === "outros" && (
                      <div><Label>Especifique a atividade</Label><Input value={usageForm.activityOther} onChange={(e) => setUsageForm({ ...usageForm, activityOther: e.target.value })} /></div>
                    )}
                    <div><Label>Combustível abastecido (litros)</Label><Input type="number" min={0} step={0.1} value={usageForm.fuelLiters} onChange={(e) => setUsageForm({ ...usageForm, fuelLiters: e.target.value })} placeholder="Opcional" /></div>
                    <div><Label>Ocorrências / Observações</Label><Textarea value={usageForm.observations} onChange={(e) => setUsageForm({ ...usageForm, observations: e.target.value })} placeholder="Observações..." rows={2} /></div>
                    <Button className="w-full" onClick={handleSaveUsage} disabled={!usageForm.workerId || !usageForm.hours}>Registrar Uso</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Usage filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={usageFilterWorker} onValueChange={setUsageFilterWorker}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Trabalhadores</SelectItem>
                  {mockWorkers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={usageFilterFrom} onChange={(e) => setUsageFilterFrom(e.target.value)} className="w-40" placeholder="De" />
              <Input type="date" value={usageFilterTo} onChange={(e) => setUsageFilterTo(e.target.value)} className="w-40" placeholder="Até" />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total de Horas</p>
                  <p className="text-xl font-bold text-foreground">{totalUsageHours}h</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Combustível</p>
                  <p className="text-xl font-bold text-foreground">{totalFuel}L</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Registros</p>
                  <p className="text-xl font-bold text-foreground">{assetUsage.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Custo/Hora Manut.</p>
                  <p className="text-xl font-bold text-foreground">
                    {totalUsageHours > 0 ? `R$ ${(totalCost / totalUsageHours).toFixed(0)}` : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Hours by worker breakdown */}
            {hoursByWorker.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Horas por Trabalhador</p>
                  <div className="space-y-2">
                    {hoursByWorker.map(w => {
                      const pct = totalUsageHours > 0 ? (w.hours / totalUsageHours) * 100 : 0;
                      return (
                        <div key={w.name} className="flex items-center gap-3">
                          <span className="text-sm text-foreground w-32 truncate">{w.name}</span>
                          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-mono font-bold text-foreground w-12 text-right">{w.hours}h</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage table */}
            <Card className="border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Trabalhador</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead>{isVehicle ? "Hodômetro" : "Horímetro"}</TableHead>
                      <TableHead>Atividade</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead className="text-right">Comb.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetUsage.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum registro de uso</TableCell></TableRow>
                    ) : assetUsage.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm">{new Date(u.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-sm font-medium flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" />{u.workerName}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{turnoLabel[u.turno]}</Badge></TableCell>
                        <TableCell className="text-right font-mono font-bold">{u.hours}h</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {isVehicle
                            ? (u.odometerStart && u.odometerEnd ? `${u.odometerStart.toLocaleString("pt-BR")} → ${u.odometerEnd.toLocaleString("pt-BR")}` : "—")
                            : (u.hourmeterStart && u.hourmeterEnd ? `${u.hourmeterStart.toLocaleString("pt-BR")} → ${u.hourmeterEnd.toLocaleString("pt-BR")}` : "—")
                          }
                        </TableCell>
                        <TableCell className="text-sm">{u.activity === "outros" ? u.activityOther || "Outros" : activityLabel[u.activity]}</TableCell>
                        <TableCell className="text-sm">{u.paddock || "—"}</TableCell>
                        <TableCell className="text-right text-sm">{u.fuelLiters ? `${u.fuelLiters}L` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
