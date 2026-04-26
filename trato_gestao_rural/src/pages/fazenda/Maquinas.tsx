import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tractor, Truck, Bike, Milk, Droplets, Wrench, HelpCircle,
  Plus, Search, CheckCircle2, AlertTriangle, XCircle, Settings,
  User, Clock, FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  mockAssets, assetTypes, mockUsageRecords, mockWorkers, turnoLabel, activityLabel,
  getMaintenanceAlertLevel, getHoursSinceLastMaintenance, getTotalMaintenanceCost,
  type Asset, type AssetType, type AssetStatus, type UsageRecord,
} from "@/data/maquinas-mock";

const typeIcons: Record<AssetType, React.ElementType> = {
  Trator: Tractor, Caminhão: Truck, Moto: Bike, Ordenhadeira: Milk,
  Bomba: Droplets, Implemento: Wrench, Outro: HelpCircle,
};

const statusConfig: Record<AssetStatus, { icon: React.ElementType; color: string; bg: string }> = {
  Operacional: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  "Em manutenção": { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10" },
  Inativo: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function Maquinas() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ativos");

  // Report filters
  const [reportWorker, setReportWorker] = useState("all");
  const [reportMachine, setReportMachine] = useState("all");
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  const [form, setForm] = useState({
    name: "", assetType: "Trator" as AssetType, plate: "", year: "",
    hourmeter: "", acquisitionCost: "", notes: "",
    maintenanceIntervalHours: "",
  });

  const filtered = assets.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.plate || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || a.assetType === filterType;
    return matchSearch && matchType;
  });

  const handleSave = () => {
    const newAsset: Asset = {
      id: `a${Date.now()}`, name: form.name, assetType: form.assetType,
      plate: form.plate || undefined, year: form.year ? Number(form.year) : undefined,
      hourmeter: Number(form.hourmeter) || 0, acquisitionCost: Number(form.acquisitionCost) || 0,
      notes: form.notes || undefined, status: "Operacional",
      maintenanceIntervalHours: form.maintenanceIntervalHours ? Number(form.maintenanceIntervalHours) : undefined,
    };
    setAssets((prev) => [...prev, newAsset]);
    setForm({ name: "", assetType: "Trator", plate: "", year: "", hourmeter: "", acquisitionCost: "", notes: "", maintenanceIntervalHours: "" });
    setOpen(false);
    toast.success("Ativo cadastrado");
  };

  // Usage by worker report
  const workerUsage = useMemo(() => {
    let list = [...mockUsageRecords];
    if (reportWorker !== "all") list = list.filter(u => u.workerId === reportWorker);
    if (reportFrom) list = list.filter(u => u.date >= reportFrom);
    if (reportTo) list = list.filter(u => u.date <= reportTo);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [reportWorker, reportFrom, reportTo]);

  const workerHoursByMachine = useMemo(() => {
    const map: Record<string, number> = {};
    workerUsage.forEach(u => {
      const name = mockAssets.find(a => a.id === u.assetId)?.name || u.assetId;
      map[name] = (map[name] || 0) + u.hours;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [workerUsage]);

  const workerTotalHours = workerUsage.reduce((s, u) => s + u.hours, 0);

  // Usage by machine report
  const machineUsage = useMemo(() => {
    let list = [...mockUsageRecords];
    if (reportMachine !== "all") list = list.filter(u => u.assetId === reportMachine);
    if (reportFrom) list = list.filter(u => u.date >= reportFrom);
    if (reportTo) list = list.filter(u => u.date <= reportTo);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [reportMachine, reportFrom, reportTo]);

  const machineTotalHours = machineUsage.reduce((s, u) => s + u.hours, 0);
  const machineTotalFuel = machineUsage.reduce((s, u) => s + (u.fuelLiters || 0), 0);

  // Monthly hours for machine
  const monthlyHours = useMemo(() => {
    const map: Record<string, number> = {};
    machineUsage.forEach(u => {
      const month = u.date.slice(0, 7);
      map[month] = (map[month] || 0) + u.hours;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [machineUsage]);

  const maxMonthHours = Math.max(...monthlyHours.map(m => m[1]), 1);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Máquinas & Manutenção</h1>
            <p className="text-sm text-muted-foreground">Gerencie os ativos e manutenções da fazenda</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Ativo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Ativo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Trator John Deere 5075E" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo *</Label>
                    <Select value={form.assetType} onValueChange={(v) => setForm({ ...form, assetType: v as AssetType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{assetTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC-1234" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Ano</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2022" /></div>
                  <div><Label>Horímetro/Hodômetro</Label><Input type="number" value={form.hourmeter} onChange={(e) => setForm({ ...form, hourmeter: e.target.value })} placeholder="0" /></div>
                  <div><Label>Custo aquisição</Label><Input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} placeholder="0" /></div>
                </div>
                <div><Label>Intervalo de manutenção (horas/km)</Label><Input type="number" value={form.maintenanceIntervalHours} onChange={(e) => setForm({ ...form, maintenanceIntervalHours: e.target.value })} placeholder="Ex: 250 (troca de óleo a cada 250h)" /></div>
                <div><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações..." /></div>
                <Button className="w-full" onClick={handleSave} disabled={!form.name}>Salvar Ativo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="ativos">Ativos</TabsTrigger>
            <TabsTrigger value="uso_trabalhador">Uso por Trabalhador</TabsTrigger>
            <TabsTrigger value="uso_maquina">Uso por Máquina</TabsTrigger>
          </TabsList>

          {/* ── Ativos Tab ── */}
          <TabsContent value="ativos" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar por nome ou placa..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {assetTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((asset) => {
                const Icon = typeIcons[asset.assetType];
                const sc = statusConfig[asset.status];
                const StatusIcon = sc.icon;
                const alert = getMaintenanceAlertLevel(asset);
                return (
                  <Card key={asset.id} className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/fazenda/maquinas/${asset.id}`)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.assetType}{asset.plate ? ` • ${asset.plate}` : ""}</p>
                          </div>
                        </div>
                        {alert === "critical" && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                        {alert === "warning" && <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{asset.year ? `Ano ${asset.year}` : "—"}</span>
                        <span>{asset.hourmeter.toLocaleString("pt-BR")} {asset.assetType === "Caminhão" || asset.assetType === "Moto" ? "km" : "h"}</span>
                      </div>
                      {asset.maintenanceIntervalHours && (
                        <Progress value={Math.min((getHoursSinceLastMaintenance(asset) / asset.maintenanceIntervalHours) * 100, 100)} className="h-1.5" />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">R$ {asset.acquisitionCost.toLocaleString("pt-BR")}</span>
                        <Badge variant="outline" className={`gap-1 ${sc.color} ${sc.bg} border-transparent`}>
                          <StatusIcon className="h-3 w-3" /> {asset.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum ativo encontrado.</p>
              </div>
            )}
          </TabsContent>

          {/* ── Uso por Trabalhador Tab ── */}
          <TabsContent value="uso_trabalhador" className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Select value={reportWorker} onValueChange={setReportWorker}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Trabalhadores</SelectItem>
                  {mockWorkers.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="w-40" />
              <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="w-40" />
              <Button variant="outline" onClick={() => toast.success("PDF exportado (simulado)")} className="gap-2">
                <FileText className="h-4 w-4" /> Exportar PDF
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total de Horas</p>
                <p className="text-xl font-bold text-foreground">{workerTotalHours}h</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-xl font-bold text-foreground">{workerUsage.length}</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Máquinas Usadas</p>
                <p className="text-xl font-bold text-foreground">{workerHoursByMachine.length}</p>
              </CardContent></Card>
            </div>

            {/* Hours by machine */}
            {workerHoursByMachine.length > 0 && (
              <Card className="border-border"><CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-3">Horas por Máquina</p>
                <div className="space-y-2">
                  {workerHoursByMachine.map(([name, hours]) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-48 truncate">{name}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${(hours / workerTotalHours) * 100}%` }} />
                      </div>
                      <span className="text-sm font-mono font-bold w-12 text-right">{hours}h</span>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}

            {/* Table */}
            <Card className="border-border"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Trabalhador</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Área</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {workerUsage.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
                  ) : workerUsage.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm font-medium">{mockAssets.find(a => a.id === u.assetId)?.name || u.assetId}</TableCell>
                      <TableCell className="text-sm">{new Date(u.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{u.workerName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{u.hours}h</TableCell>
                      <TableCell className="text-sm">{u.activity === "outros" ? u.activityOther || "Outros" : activityLabel[u.activity]}</TableCell>
                      <TableCell className="text-sm">{u.paddock || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          {/* ── Uso por Máquina Tab ── */}
          <TabsContent value="uso_maquina" className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Select value={reportMachine} onValueChange={setReportMachine}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Máquinas</SelectItem>
                  {mockAssets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="w-40" />
              <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="w-40" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                <p className="text-xl font-bold text-foreground">{machineTotalHours}h</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Combustível</p>
                <p className="text-xl font-bold text-foreground">{machineTotalFuel}L</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Registros</p>
                <p className="text-xl font-bold text-foreground">{machineUsage.length}</p>
              </CardContent></Card>
              <Card className="border-border"><CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Custo/Hora</p>
                <p className="text-xl font-bold text-foreground">
                  {machineTotalHours > 0 && reportMachine !== "all"
                    ? `R$ ${(getTotalMaintenanceCost(reportMachine) / machineTotalHours).toFixed(0)}`
                    : "—"
                  }
                </p>
              </CardContent></Card>
            </div>

            {/* Monthly hours chart */}
            {monthlyHours.length > 0 && (
              <Card className="border-border"><CardContent className="p-4">
                <p className="text-sm font-medium text-foreground mb-3">Horas de Uso por Mês</p>
                <div className="flex items-end gap-2 h-32">
                  {monthlyHours.map(([month, hours]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-mono font-bold text-foreground">{hours}h</span>
                      <div className="w-full bg-primary rounded-t" style={{ height: `${(hours / maxMonthHours) * 100}%`, minHeight: 4 }} />
                      <span className="text-[10px] text-muted-foreground">{month.slice(5)}/{month.slice(2, 4)}</span>
                    </div>
                  ))}
                </div>
              </CardContent></Card>
            )}

            {/* Table */}
            <Card className="border-border"><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Trabalhador</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead>Horímetro</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="text-right">Comb.</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {machineUsage.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
                  ) : machineUsage.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm">{new Date(u.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm font-medium">{u.workerName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{u.hours}h</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.hourmeterStart && u.hourmeterEnd ? `${u.hourmeterStart} → ${u.hourmeterEnd}` :
                         u.odometerStart && u.odometerEnd ? `${u.odometerStart} → ${u.odometerEnd}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{u.activity === "outros" ? u.activityOther || "Outros" : activityLabel[u.activity]}</TableCell>
                      <TableCell className="text-right text-sm">{u.fuelLiters ? `${u.fuelLiters}L` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
