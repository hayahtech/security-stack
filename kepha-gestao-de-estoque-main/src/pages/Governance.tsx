import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { NewTriggerModal } from '@/components/governance/NewTriggerModal';
import { NewApprovalRuleModal } from '@/components/governance/NewApprovalRuleModal';
import { NewBudgetModal } from '@/components/governance/NewBudgetModal';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, Eye, LogIn, Settings, FileText,
  Paperclip, MessageSquare, ChevronRight, Shield, Zap, Download, Search,
  Filter, ArrowUpDown, Edit, CircleDot, Bell
} from 'lucide-react';
import {
  approvalRules, approvalRequests, auditTrail, budgetLines, webhookTriggers,
  type ApprovalRequest, type AuditEntry, type BudgetLine
} from '@/data/governanceData';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const hoursElapsed = (d: Date) => Math.floor((Date.now() - d.getTime()) / 3600000);

const actionIcons: Record<AuditEntry['action'], React.ReactNode> = {
  CRIOU: <FileText className="h-4 w-4 text-blue-400" />,
  EDITOU: <Edit className="h-4 w-4 text-yellow-400" />,
  EXCLUIU: <XCircle className="h-4 w-4 text-red-400" />,
  APROVOU: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  REPROVOU: <XCircle className="h-4 w-4 text-red-400" />,
  VISUALIZOU: <Eye className="h-4 w-4 text-muted-foreground" />,
  LOGIN: <LogIn className="h-4 w-4 text-blue-400" />,
  CONFIGUROU: <Settings className="h-4 w-4 text-purple-400" />,
};

const actionLabels: Record<AuditEntry['action'], string> = {
  CRIOU: '📝 Criou', EDITOU: '✏️ Editou', EXCLUIU: '🗑️ Excluiu',
  APROVOU: '✅ Aprovou', REPROVOU: '❌ Reprovou', VISUALIZOU: '👁️ Visualizou',
  LOGIN: '🔐 Login', CONFIGUROU: '⚙️ Configurou',
};

export default function Governance() {
  const [tab, setTab] = useState('approvals');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditPage, setAuditPage] = useState(0);
  const [webhookTestId, setWebhookTestId] = useState<string | null>(null);
  const [newTriggerOpen, setNewTriggerOpen] = useState(false);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newBudgetOpen, setNewBudgetOpen] = useState(false);

  const pendingApprovals = approvalRequests.filter(a => a.status === 'PENDENTE');
  const completedApprovals = approvalRequests.filter(a => a.status !== 'PENDENTE');

  const filteredAudit = useMemo(() => {
    let data = auditTrail;
    if (auditActionFilter !== 'all') data = data.filter(e => e.action === auditActionFilter);
    if (auditSearch) data = data.filter(e =>
      e.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      e.entity.toLowerCase().includes(auditSearch.toLowerCase()) ||
      e.recordId.toLowerCase().includes(auditSearch.toLowerCase())
    );
    return data;
  }, [auditActionFilter, auditSearch]);

  const pagedAudit = filteredAudit.slice(auditPage * 20, (auditPage + 1) * 20);
  const totalAuditPages = Math.ceil(filteredAudit.length / 20);

  const handleApprove = (id: string) => {
    toast.success(`Aprovação ${id} confirmada com sucesso`);
  };
  const handleReject = (id: string) => {
    toast.error(`Aprovação ${id} reprovada`);
  };
  const handleTestWebhook = (id: string) => {
    setWebhookTestId(id);
    setTimeout(() => {
      setWebhookTestId(null);
      toast.success('Webhook disparado com sucesso! Status: 200 OK');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Governança & Aprovações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controles internos, alçadas, audit trail e rastreabilidade total
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary gap-1 px-3 py-1">
          <Bell className="h-3.5 w-3.5" />
          {pendingApprovals.length} aprovações pendentes
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          <TabsTrigger value="rules">Alçadas</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="budget">Orçamento</TabsTrigger>
          <TabsTrigger value="webhooks">Gatilhos</TabsTrigger>
        </TabsList>

        {/* ===== TAB: APPROVALS ===== */}
        <TabsContent value="approvals" className="space-y-6 mt-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Aguardando Sua Aprovação</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pendingApprovals.map(ap => {
                const elapsed = hoursElapsed(ap.createdAt);
                const late = elapsed > 24;
                return (
                  <Card key={ap.id} className={`relative overflow-hidden transition-all hover:shadow-md ${late ? 'border-destructive/50' : 'border-border'}`}>
                    {late && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-destructive animate-pulse" />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Clock className="h-3 w-3" /> AGUARDANDO
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">{ap.number}</span>
                      </div>
                      {late && (
                        <Badge variant="destructive" className="w-fit text-xs mt-1">⚠ ATRASADO — {elapsed}h</Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solicitante</span>
                        <span className="font-medium">{ap.requester} <span className="text-muted-foreground">({ap.requesterRole})</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo</span>
                        <span>{ap.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fornecedor</span>
                        <span className="truncate max-w-[180px]">{ap.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-bold text-foreground">{fmt(ap.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Centro de Custo</span>
                        <span className="text-xs">{ap.costCenter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Categoria</span>
                        <span>{ap.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solicitado</span>
                        <span>há {elapsed}h</span>
                      </div>

                      <Separator className="my-2" />

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => toast.info('Visualizando NF...')}>
                          <Paperclip className="h-3 w-3" /> Ver Anexo
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSelectedApproval(ap)}>
                          <Eye className="h-3 w-3" /> Ver Fluxo
                        </Button>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1 gap-1" onClick={() => handleApprove(ap.number)}>
                          <CheckCircle2 className="h-4 w-4" /> Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => handleReject(ap.number)}>
                          <XCircle className="h-4 w-4" /> Reprovar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Completed Approvals */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Aprovações Concluídas</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedApprovals.map(ap => (
                      <TableRow key={ap.id}>
                        <TableCell className="font-mono text-xs">{ap.number}</TableCell>
                        <TableCell>{ap.requester}</TableCell>
                        <TableCell>{ap.type}</TableCell>
                        <TableCell>{ap.supplier}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(ap.value)}</TableCell>
                        <TableCell className="text-sm">{fmtDate(ap.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={ap.status === 'APROVADO' ? 'default' : 'destructive'} className="text-xs">
                            {ap.status === 'APROVADO' ? '✅' : '❌'} {ap.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== TAB: RULES ===== */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Regras de Aprovação</h2>
            <Button size="sm" onClick={() => setNewRuleOpen(true)}>+ Nova Regra</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regra</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Aprovador</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Escalação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rule.conditions.map(c => `${c.type} ${c.operator} ${c.value}`).join(', ')}
                      </TableCell>
                      <TableCell>
                        <div>{rule.approver}</div>
                        <div className="text-xs text-muted-foreground">{rule.approverRole}</div>
                      </TableCell>
                      <TableCell>{rule.deadline === 0 ? 'Imediato' : `${rule.deadline}h`}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rule.escalation === 'ESCALAR_SUPERIOR' ? '⬆ Escalar' :
                           rule.escalation === 'APROVAR_AUTO' ? '✅ Auto-aprovar' : '❌ Auto-reprovar'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? 'default' : 'secondary'} className="text-xs">
                          {rule.active ? '● Ativa' : '○ Inativa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: AUDIT ===== */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Log de Auditoria Completo
              <Badge variant="outline" className="text-xs font-normal">IMUTÁVEL</Badge>
            </h2>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success('Relatório exportado com hash SHA256: a3f8c2…')}>
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, entidade ou ID..."
                className="pl-9"
                value={auditSearch}
                onChange={e => { setAuditSearch(e.target.value); setAuditPage(0); }}
              />
            </div>
            <Select value={auditActionFilter} onValueChange={v => { setAuditActionFilter(v); setAuditPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {Object.entries(actionLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Timestamp</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="w-[120px]">IP</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID Registro</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAudit.map(entry => (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="text-xs font-mono">{fmtDateTime(entry.timestamp)}</TableCell>
                      <TableCell className="text-sm">{entry.user}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{entry.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {actionIcons[entry.action]}
                          <span className="text-sm">{actionLabels[entry.action]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{entry.entity}</TableCell>
                      <TableCell className="text-xs font-mono">{entry.recordId}</TableCell>
                      <TableCell>
                        {entry.action === 'EDITOU' ? (
                          <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={() => setDiffEntry(entry)}>
                            <Eye className="h-3 w-3" /> Ver Diff
                          </Button>
                        ) : entry.details ? (
                          <span className="text-xs text-muted-foreground">{entry.details}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredAudit.length} registros encontrados</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={auditPage === 0} onClick={() => setAuditPage(p => p - 1)}>Anterior</Button>
              <span className="flex items-center px-2">Página {auditPage + 1} de {totalAuditPages}</span>
              <Button variant="outline" size="sm" disabled={auditPage >= totalAuditPages - 1} onClick={() => setAuditPage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        </TabsContent>

        {/* ===== TAB: BUDGET ===== */}
        <TabsContent value="budget" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Controle Orçamentário — Orçado vs Realizado</h2>
            <Button variant="outline" size="sm" onClick={() => setNewBudgetOpen(true)}>Definir Orçamento</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Orçado</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Comprometido</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead className="w-[180px]">% Utilizado</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetLines.map(bl => {
                    const overBudget = bl.percentUsed > 100;
                    const warning = bl.percentUsed > 95;
                    const caution = bl.percentUsed > 80;
                    return (
                      <TableRow key={bl.id} className={overBudget ? 'bg-destructive/5' : ''}>
                        <TableCell className="text-sm font-medium">{bl.costCenter}</TableCell>
                        <TableCell>{bl.category}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(bl.budgeted)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(bl.actual)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(bl.committed)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold ${bl.available < 0 ? 'text-destructive' : ''}`}>
                          {fmt(bl.available)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(bl.percentUsed, 100)}
                              className={`h-2 flex-1 ${overBudget ? '[&>div]:bg-destructive' : warning ? '[&>div]:bg-destructive' : caution ? '[&>div]:bg-yellow-500' : '[&>div]:bg-emerald-500'}`}
                            />
                            <span className={`text-xs font-mono w-12 text-right ${overBudget ? 'text-destructive font-bold' : ''}`}>
                              {bl.percentUsed.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {overBudget ? (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" /> ACIMA
                            </Badge>
                          ) : warning ? (
                            <Badge variant="secondary" className="text-xs border-destructive/30 text-destructive">CRÍTICO</Badge>
                          ) : caution ? (
                            <Badge variant="secondary" className="text-xs border-yellow-500/30 text-yellow-600">ATENÇÃO</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs border-emerald-500/30 text-emerald-600">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: WEBHOOKS ===== */}
        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gatilhos Automáticos</h2>
            <Button size="sm" onClick={() => setNewTriggerOpen(true)}>+ Novo Gatilho</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {webhookTriggers.map(wh => (
              <Card key={wh.id} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-base">{wh.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Condição:</span>
                    <p className="font-medium">{wh.condition}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ação:</span>
                    <p className="font-medium">{wh.action}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={wh.active ? 'default' : 'secondary'} className="text-xs">
                      {wh.active ? '● Ativo' : '○ Inativo'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{wh.triggerCount} disparos</span>
                  </div>
                  {wh.lastTriggered && (
                    <p className="text-xs text-muted-foreground">Último: {fmtDateTime(wh.lastTriggered)}</p>
                  )}
                  <Button
                    variant="outline" size="sm" className="w-full gap-1"
                    disabled={webhookTestId === wh.id}
                    onClick={() => handleTestWebhook(wh.id)}
                  >
                    {webhookTestId === wh.id ? (
                      <><CircleDot className="h-4 w-4 animate-spin" /> Disparando...</>
                    ) : (
                      <><Zap className="h-4 w-4" /> Testar Webhook</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOG: APPROVAL FLOW ===== */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Fluxo de Aprovação — {selectedApproval?.number}
            </DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Solicitante</div>
                <div className="font-medium">{selectedApproval.requester}</div>
                <div className="text-muted-foreground">Valor</div>
                <div className="font-bold">{fmt(selectedApproval.value)}</div>
                <div className="text-muted-foreground">Fornecedor</div>
                <div>{selectedApproval.supplier}</div>
              </div>
              <Separator />
              <div className="space-y-0">
                {selectedApproval.timeline.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                        step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        step.status === 'current' ? 'bg-primary/20 text-primary animate-pulse' :
                        step.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                         step.status === 'current' ? <Clock className="h-4 w-4" /> :
                         step.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
                         <CircleDot className="h-4 w-4" />}
                      </div>
                      {i < selectedApproval.timeline.length - 1 && (
                        <div className={`w-0.5 h-10 ${
                          step.status === 'completed' ? 'bg-emerald-500/30' :
                          step.status === 'rejected' ? 'bg-destructive/30' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-sm">{step.step}</p>
                      <p className="text-xs text-muted-foreground">{step.responsible}</p>
                      {step.timestamp && <p className="text-xs text-muted-foreground">{fmtDateTime(step.timestamp)}</p>}
                      {step.comment && (
                        <p className="text-xs mt-1 bg-muted/50 rounded px-2 py-1 italic">"{step.comment}"</p>
                      )}
                      {step.duration && <p className="text-xs text-muted-foreground">Duração: {step.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApproval(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG: DIFF ===== */}
      <Dialog open={!!diffEntry} onOpenChange={() => setDiffEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Diff Visual — Alteração</DialogTitle>
          </DialogHeader>
          {diffEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ANTES</p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm font-mono">
                    {diffEntry.oldValue || '—'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">DEPOIS</p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-sm font-mono">
                    {diffEntry.newValue || '—'}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground">
                Alterado por <span className="font-medium text-foreground">{diffEntry.user}</span> em{' '}
                <span className="font-medium text-foreground">{fmtDateTime(diffEntry.timestamp)}</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                IP: {diffEntry.ip} | Entidade: {diffEntry.entity} | ID: {diffEntry.recordId}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffEntry(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NewTriggerModal open={newTriggerOpen} onOpenChange={setNewTriggerOpen} />
      <NewApprovalRuleModal open={newRuleOpen} onOpenChange={setNewRuleOpen} />
      <NewBudgetModal open={newBudgetOpen} onOpenChange={setNewBudgetOpen} />
    </div>
  );
}
