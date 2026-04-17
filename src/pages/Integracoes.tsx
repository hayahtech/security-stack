import { useState } from "react";
import {
  Plug,
  RefreshCw,
  Unplug,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  ToggleLeft,
  ToggleRight,
  Play,
  Code2,
  Copy,
  RotateCcw,
  ExternalLink,
  ArrowRight,
  Wifi,
  WifiOff,
  Clock,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  connectedBanks,
  availableBanks,
  reconciliationStats,
  integrations,
  triggers as initialTriggers,
  triggerLogs,
  apiEndpoints,
  apiLogs,
  apiUsage,
} from "@/mock/integrationsData";
import { cn } from "@/lib/utils";

export default function Integracoes() {
  const [triggersList, setTriggersList] = useState(initialTriggers);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const toggleTrigger = (id: number) => {
    setTriggersList((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText("sk-finance-a8f3-b2c1-xxxx");
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Integrações & Automações</h1>
          <p className="text-muted-foreground font-data">Open Finance, APIs e webhooks</p>
        </div>
      </div>

      <Tabs defaultValue="banks" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="banks" className="font-data"><Wifi className="h-4 w-4 mr-1.5" />Contas Bancárias</TabsTrigger>
          <TabsTrigger value="integrations" className="font-data"><Plug className="h-4 w-4 mr-1.5" />Integrações</TabsTrigger>
          <TabsTrigger value="automations" className="font-data"><Zap className="h-4 w-4 mr-1.5" />Automações</TabsTrigger>
          <TabsTrigger value="api" className="font-data"><Code2 className="h-4 w-4 mr-1.5" />API Explorer</TabsTrigger>
        </TabsList>

        {/* ═══ CONTAS BANCÁRIAS ═══ */}
        <TabsContent value="banks" className="space-y-6">
          {/* Reconciliation stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-success/30 bg-success/5 p-5">
              <p className="text-sm text-muted-foreground">Conciliadas Automaticamente</p>
              <p className="text-2xl font-display font-bold text-success">{reconciliationStats.autoReconciled}</p>
              <p className="text-xs text-muted-foreground">transações este mês</p>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
              <p className="text-sm text-muted-foreground">Exceções Pendentes</p>
              <p className="text-2xl font-display font-bold text-yellow-500">{reconciliationStats.pendingExceptions}</p>
              <p className="text-xs text-primary cursor-pointer hover:underline">→ Revisar agora</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Taxa de Automação</p>
              <p className="text-2xl font-display font-bold">{reconciliationStats.autoRate}%</p>
              <Progress value={reconciliationStats.autoRate} className="h-1.5 mt-2" />
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Total Transações</p>
              <p className="text-2xl font-display font-bold">{reconciliationStats.monthlyTransactions}</p>
              <p className="text-xs text-muted-foreground">no mês</p>
            </div>
          </div>

          {/* Connected banks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedBanks.map((bank) => (
              <div key={bank.id} className={cn(
                "rounded-xl border bg-card p-5",
                bank.status === "connected" && "border-success/30",
                bank.status === "unstable" && "border-yellow-500/30",
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: `${bank.color}20`, color: bank.color }}>
                      {bank.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-semibold">{bank.name}</h4>
                        {bank.status === "connected" && <span className="w-2 h-2 rounded-full bg-success" />}
                        {bank.status === "unstable" && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{bank.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{bank.syncMethod}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  <span className="font-data">AG: {bank.agency} | CC: {bank.account}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Última sync: {bank.lastSync}
                  </div>
                  <div className="flex items-center gap-2">
                    {bank.status === "unstable" ? (
                      <Button size="sm" variant="outline" className="text-yellow-500 border-yellow-500/50">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reconectar
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost"><RefreshCw className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive"><Unplug className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add new bank */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-5 flex flex-col items-center justify-center gap-3 min-h-[180px] cursor-pointer hover:border-primary/50 transition-colors">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold text-sm">Adicionar novo banco</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {availableBanks.map((b) => (
                  <Badge key={b.id} variant="outline" className="text-[10px]">{b.logo} {b.name}</Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ INTEGRAÇÕES ═══ */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-success flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Conectadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.filter((i) => i.connected).map((integ) => (
                <div key={integ.id} className="rounded-xl border border-success/20 bg-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integ.icon}</span>
                      <div>
                        <h4 className="font-display font-semibold">{integ.name}</h4>
                        <p className="text-xs text-muted-foreground">{integ.category}</p>
                      </div>
                    </div>
                    <Badge className="bg-success/20 text-success text-[10px]">Conectado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{integ.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Último evento: {integ.lastEvent}</span>
                    <span className="font-data">{integ.dataVolume}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="ghost"><Settings className="h-3.5 w-3.5 mr-1" /> Configurar</Button>
                    <Button size="sm" variant="ghost"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-muted-foreground flex items-center gap-2">
              <Plug className="h-5 w-5" /> Disponíveis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.filter((i) => !i.connected).map((integ) => (
                <div key={integ.id} className="rounded-xl border border-border bg-card p-5 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{integ.icon}</span>
                    <div>
                      <h4 className="font-display font-semibold">{integ.name}</h4>
                      <p className="text-xs text-muted-foreground">{integ.category}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{integ.description}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Conectar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══ AUTOMAÇÕES ═══ */}
        <TabsContent value="automations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg">Gatilhos Ativos</h3>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Gatilho</Button>
          </div>

          <div className="space-y-4">
            {triggersList.map((trigger) => (
              <div key={trigger.id} className={cn(
                "rounded-xl border bg-card p-5 transition-opacity",
                !trigger.active && "opacity-50",
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTrigger(trigger.id)}>
                      {trigger.active ? <ToggleRight className="h-6 w-6 text-success" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                    </button>
                    <div>
                      <h4 className="font-display font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {trigger.name}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-data">
                      {trigger.timesTriggered}x este mês
                    </Badge>
                    <Button size="sm" variant="ghost"><Play className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">SE:</span>
                    <span className="font-data">{trigger.condition}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mt-0.5">ENTÃO:</span>
                    <div className="space-y-1">
                      {trigger.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          <span className="text-xs">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {trigger.lastTriggered && (
                  <p className="text-xs text-muted-foreground">Último disparo: {trigger.lastTriggered}</p>
                )}
                {trigger.timesTriggered === 0 && trigger.active && (
                  <p className="text-xs text-success">✅ Nunca disparado — monitorando</p>
                )}
              </div>
            ))}
          </div>

          {/* Trigger logs */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Log de Disparos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Timestamp</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Gatilho</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Dado</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Ação</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {triggerLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2 font-data text-xs">{log.timestamp}</td>
                      <td className="px-3 py-2 text-xs font-medium">{log.triggerName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{log.data}</td>
                      <td className="px-3 py-2 text-xs">{log.actionExecuted}</td>
                      <td className="px-3 py-2">
                        {log.status === "success" ? (
                          <Badge className="bg-success/20 text-success text-[10px]">OK</Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive text-[10px]">Falha</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ═══ API EXPLORER ═══ */}
        <TabsContent value="api" className="space-y-6">
          {/* API Key */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">Sua API Key</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={copyApiKey}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {apiKeyCopied ? "Copiado!" : "Copiar"}
                </Button>
                <Button size="sm" variant="ghost"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Regenerar</Button>
              </div>
            </div>
            <code className="text-sm font-data bg-muted/50 rounded-lg px-4 py-2 block">
              sk-finance-a8f3-b2c1-****-****-xxxx
            </code>
            <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
              <span>Rate limit: <span className="font-data">{apiUsage.rateLimit.perMinute}/min</span></span>
              <span>Diário: <span className="font-data">{apiUsage.rateLimit.perDay.toLocaleString()}/dia</span></span>
              <span>Uso atual: <span className="font-data text-success">{apiUsage.usagePercent}%</span></span>
            </div>
            <Progress value={apiUsage.usagePercent} className="h-1.5 mt-2" />
          </div>

          {/* Endpoints */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Endpoints Disponíveis
            </h3>
            <div className="space-y-2">
              {apiEndpoints.map((ep, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/20 px-4 py-3 text-sm">
                  <Badge className={cn(
                    "text-[10px] font-mono w-14 justify-center",
                    ep.method === "GET" && "bg-success/20 text-success",
                    ep.method === "POST" && "bg-primary/20 text-primary",
                  )}>
                    {ep.method}
                  </Badge>
                  <code className="font-data text-xs flex-1">{ep.path}</code>
                  <span className="text-xs text-muted-foreground">{ep.description}</span>
                  {ep.auth && <Badge variant="outline" className="text-[9px]">🔒 Auth</Badge>}
                </div>
              ))}
            </div>
          </div>

          {/* API Logs */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Chamadas Recentes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Hora</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Método</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Endpoint</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Latência</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-3 py-2 font-data text-xs">{log.timestamp}</td>
                      <td className="px-3 py-2">
                        <Badge className={cn(
                          "text-[10px] font-mono",
                          log.method === "GET" && "bg-success/20 text-success",
                          log.method === "POST" && "bg-primary/20 text-primary",
                        )}>{log.method}</Badge>
                      </td>
                      <td className="px-3 py-2 font-data text-xs">{log.path}</td>
                      <td className="px-3 py-2">
                        <span className={cn(
                          "font-data text-xs font-semibold",
                          log.status >= 200 && log.status < 300 && "text-success",
                          log.status >= 400 && log.status < 500 && "text-yellow-500",
                          log.status >= 500 && "text-destructive",
                        )}>{log.status}</span>
                      </td>
                      <td className="px-3 py-2 font-data text-xs text-muted-foreground">{log.latency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
