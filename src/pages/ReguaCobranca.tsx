import { useState, useMemo } from "react";
import { 
  Zap, Mail, MessageSquare, Phone, AlertCircle, CheckCircle2, Clock, 
  Send, HandCoins, Pause, XCircle, ChevronRight, Plus, Play, Settings2,
  BarChart3, TrendingUp, DollarSign, Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  collectionStages, debtors, messageTemplates, collectionAnalytics,
  type CollectionStage, type Debtor, type CollectionEvent 
} from "@/mock/collectionData";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  aguardando: { label: "Aguardando", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  respondeu: { label: "Respondeu", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  negociacao: { label: "Em negociação", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: HandCoins },
  urgente: { label: "Urgente 🔴", className: "bg-destructive/20 text-destructive border-destructive/30", icon: AlertCircle },
  pausado: { label: "Pausado", className: "bg-muted text-muted-foreground border-muted", icon: Pause },
  quitado: { label: "Quitado", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  perda: { label: "Perda", className: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle },
};

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageSquare,
  sms: MessageSquare,
  phone: Phone,
  internal: Zap,
};

function RulerTimeline({ stages, onSelectStage }: { stages: CollectionStage[]; onSelectStage: (s: CollectionStage) => void }) {
  return (
    <div className="relative py-8 px-4">
      {/* Line */}
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2" />
      
      <div className="flex items-center justify-between relative">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex flex-col items-center z-10">
            <button
              onClick={() => onSelectStage(stage)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                stage.day < 0 
                  ? "bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50" 
                  : stage.day === 0 
                    ? "bg-primary/20 text-primary border-2 border-primary/50"
                    : stage.day <= 7 
                      ? "bg-amber-500/20 text-amber-400 border-2 border-amber-500/50"
                      : stage.day <= 30
                        ? "bg-orange-500/20 text-orange-400 border-2 border-orange-500/50"
                        : "bg-destructive/20 text-destructive border-2 border-destructive/50"
              }`}
            >
              {stage.label}
            </button>
            <p className="text-[10px] text-muted-foreground mt-2 text-center max-w-[100px] leading-tight">
              {stage.description}
            </p>
            <div className="flex gap-1 mt-1">
              {stage.channels.map(ch => {
                const Icon = channelIcons[ch] || Mail;
                return <Icon key={ch} className="w-3 h-3 text-muted-foreground" />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageConfigPanel({ stage, onClose }: { stage: CollectionStage | null; onClose: () => void }) {
  if (!stage) return null;
  return (
    <Dialog open={!!stage} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Configuração: {stage.label} — {stage.description}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Canais de comunicação</Label>
            <div className="flex gap-4 mt-2">
              {(["email", "whatsapp", "sms", "phone"] as const).map(ch => (
                <label key={ch} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox checked={stage.channels.includes(ch)} />
                  {ch}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Template da mensagem</Label>
            <Textarea value={stage.template} readOnly className="mt-1 text-sm" rows={4} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tom</Label>
            <p className="text-sm mt-1">{stage.tone}</p>
          </div>
          {stage.autoFee && (
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-sm font-semibold">Acréscimo automático</p>
              <p className="text-xs text-muted-foreground">Multa: {stage.autoFee.penalty}% + Juros: {stage.autoFee.interest}%/mês</p>
            </div>
          )}
          {stage.escalateTo && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm">Escalar para: <strong>{stage.escalateTo}</strong></p>
            </div>
          )}
          {stage.createTask && (
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <p className="text-sm">Criar tarefa: <strong>{stage.createTask}</strong></p>
            </div>
          )}
          {stage.actions && stage.actions.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ações automáticas</Label>
              {stage.actions.map((a, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <Checkbox checked /> {a}
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            <Button onClick={() => { toast.success("Configuração salva"); onClose(); }}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DebtorHistory({ debtor, onClose }: { debtor: Debtor | null; onClose: () => void }) {
  if (!debtor) return null;
  return (
    <Dialog open={!!debtor} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{debtor.company} — Histórico de Cobrança</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Valor</Label>
              <p className="text-lg font-bold text-primary">{formatCurrency(debtor.value)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Atraso</Label>
              <p className="text-lg font-bold text-destructive">{debtor.daysOverdue} dias</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contato</Label>
              <p className="text-sm">{debtor.contactName}</p>
              <p className="text-xs text-muted-foreground">{debtor.contactEmail}</p>
            </div>
          </div>
          {debtor.promisedPayment && (
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <p className="text-sm">💰 Promessa de pagamento: <strong>{formatCurrency(debtor.promisedPayment.value)}</strong> em {debtor.promisedPayment.date}</p>
            </div>
          )}
          {/* Timeline */}
          <div className="space-y-3">
            {debtor.history.slice().reverse().map(event => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  event.status === "replied" ? "bg-emerald-500/20" :
                  event.status === "opened" ? "bg-cyan-500/20" :
                  event.status === "failed" ? "bg-destructive/20" :
                  "bg-muted"
                }`}>
                  {(() => {
                    const Icon = channelIcons[event.type] || Zap;
                    return <Icon className="w-4 h-4" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{event.description}</p>
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                  </div>
                  {event.stage && <Badge variant="outline" className="text-[10px] mt-1">{event.stage}</Badge>}
                  {event.openedAt && <p className="text-xs text-muted-foreground mt-1">📬 Aberto em {event.openedAt}</p>}
                  <Badge variant="outline" className={`text-[10px] mt-1 ${
                    event.status === "replied" ? "bg-emerald-500/20 text-emerald-400" :
                    event.status === "opened" ? "bg-cyan-500/20 text-cyan-400" :
                    event.status === "failed" ? "bg-destructive/20 text-destructive" :
                    ""
                  }`}>{event.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Mensagem enviada")}>
              <Send className="w-3 h-3" /> Enviar mensagem agora
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Contato registrado")}>
              <Phone className="w-3 h-3" /> Registrar contato
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Promessa registrada")}>
              <HandCoins className="w-3 h-3" /> Registrar promessa
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Simulador de acordo")}>
              <DollarSign className="w-3 h-3" /> Oferecer acordo
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Cobrança pausada")}>
              <Pause className="w-3 h-3" /> Pausar cobrança
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Baixa registrada")}>
              <CheckCircle2 className="w-3 h-3" /> Dar baixa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(messageTemplates[0]);
  const [previewValues] = useState<Record<string, string>>({
    Nome: "João Silva",
    Valor: "R$ 28.400,00",
    Vencimento: "01/03/2025",
    DiasAtraso: "8",
    LinkBoleto: "https://pag.to/abc123",
    LinkPIX: "https://pix.to/xyz789",
    NomeEmpresa: "TechBR Ltda",
    Telefone: "(11) 3000-1234",
  });

  const renderPreview = (body: string) => {
    let text = body;
    Object.entries(previewValues).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\[${key}\\]`, "g"), val);
    });
    return text;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {messageTemplates.map(t => (
          <Badge
            key={t.id}
            variant={selectedTemplate.id === t.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedTemplate(t)}
          >
            {t.name}
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Template (editável)</Label>
          {selectedTemplate.subject && (
            <Input value={selectedTemplate.subject} readOnly className="text-sm" />
          )}
          <Textarea value={selectedTemplate.body} readOnly rows={8} className="text-sm font-mono" />
          <div className="flex flex-wrap gap-1">
            {selectedTemplate.variables.map(v => (
              <Badge key={v} variant="outline" className="text-[10px]">[{v}]</Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preview</Label>
          <div className="p-4 bg-muted/30 rounded-lg border border-border min-h-[200px]">
            {selectedTemplate.subject && (
              <p className="font-semibold text-sm mb-2">Assunto: {renderPreview(selectedTemplate.subject)}</p>
            )}
            <p className="text-sm whitespace-pre-wrap">{renderPreview(selectedTemplate.body)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReguaCobranca() {
  const [selectedStage, setSelectedStage] = useState<CollectionStage | null>(null);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [rulerActive, setRulerActive] = useState(true);

  const analytics = collectionAnalytics;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Régua de Cobrança</h1>
          <p className="text-sm text-muted-foreground font-data mt-1">
            Automação de cobrança por etapas — {debtors.length} devedores ativos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={rulerActive} onCheckedChange={setRulerActive} />
            <Label className="text-sm">{rulerActive ? "Régua ativa" : "Régua pausada"}</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Teste iniciado com cliente fictício")}>
            Testar régua
          </Button>
        </div>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valor Recuperado (mês)", value: formatCurrency(analytics.recoveredThisMonth), icon: DollarSign, color: "text-emerald-400" },
          { label: "Tempo Médio Recuperação", value: `${analytics.avgRecoveryDays} dias`, icon: Timer, color: "text-primary" },
          { label: "Custo Inadimplência", value: formatCurrency(analytics.unrecoveredCost), icon: TrendingUp, color: "text-destructive" },
          { label: "Ações Pendentes", value: analytics.totalPendingActions, icon: Zap, color: "text-amber-400" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-xl font-bold font-data ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="ruler">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="ruler">Régua</TabsTrigger>
          <TabsTrigger value="queue">Fila de Cobrança</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* RULER TAB */}
        <TabsContent value="ruler" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Régua Padrão Ativa
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="w-3 h-3" /> Adicionar etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RulerTimeline stages={collectionStages} onSelectStage={setSelectedStage} />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Clique em cada etapa para configurar canais, templates e ações automáticas
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUEUE TAB */}
        <TabsContent value="queue" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Atraso</TableHead>
                      <TableHead>Etapa Atual</TableHead>
                      <TableHead>Próxima Ação</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtors.map(d => (
                      <TableRow 
                        key={d.id} 
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setSelectedDebtor(d)}
                      >
                        <TableCell className="font-medium">{d.company}</TableCell>
                        <TableCell className="text-right font-data">{formatCurrency(d.value)}</TableCell>
                        <TableCell className="text-right font-data text-destructive">{d.daysOverdue}d</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {collectionStages.find(s => s.id === d.currentStage)?.label || d.currentStage}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{d.nextAction}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.nextActionDate || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusConfig[d.status]?.className || ""}`}>
                            {statusConfig[d.status]?.label || d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Templates de Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateEditor />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Taxa de Recuperação por Etapa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recoveryByStage.map(item => (
                  <div key={item.stage} className="flex items-center gap-4">
                    <span className="w-12 text-sm font-semibold text-muted-foreground">{item.stage}</span>
                    <div className="flex-1 bg-muted/30 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${item.rate}%` }}
                      >
                        <span className="text-xs font-bold text-primary-foreground">{item.rate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-muted-foreground">Valor recuperado este mês</p>
                  <p className="text-2xl font-bold font-data text-emerald-400">{formatCurrency(analytics.recoveredThisMonth)}</p>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-muted-foreground">Custo da inadimplência não recuperada</p>
                  <p className="text-2xl font-bold font-data text-destructive">{formatCurrency(analytics.unrecoveredCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StageConfigPanel stage={selectedStage} onClose={() => setSelectedStage(null)} />
      <DebtorHistory debtor={selectedDebtor} onClose={() => setSelectedDebtor(null)} />
    </div>
  );
}
