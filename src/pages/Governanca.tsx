import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  Users,
  Receipt,
  TrendingUp,
  Zap,
  Ban,
  LogIn,
  FileOutput,
  Server,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  approvalRules,
  pendingApprovals,
  auditLog,
  activityHeatmap,
  reimbursementRequests,
  reimbursementSummary,
  type ApprovalRule,
  type AuditEntry,
  type ReimbursementRequest,
} from "@/mock/governanceData";
import { formatCurrency } from "@/mock/financialData";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, React.ReactNode> = {
  edit: <Edit3 className="h-3.5 w-3.5" />,
  approve: <CheckCircle2 className="h-3.5 w-3.5" />,
  system: <Server className="h-3.5 w-3.5" />,
  reject: <XCircle className="h-3.5 w-3.5" />,
  create: <FileText className="h-3.5 w-3.5" />,
  delete_attempt: <Ban className="h-3.5 w-3.5" />,
  login: <LogIn className="h-3.5 w-3.5" />,
  export: <FileOutput className="h-3.5 w-3.5" />,
};

const actionColors: Record<string, string> = {
  edit: "text-yellow-500",
  approve: "text-success",
  system: "text-muted-foreground",
  reject: "text-destructive",
  create: "text-primary",
  delete_attempt: "text-destructive",
  login: "text-muted-foreground",
  export: "text-secondary",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  submitted: { label: "Submetido", color: "bg-muted text-muted-foreground" },
  review: { label: "Em Análise", color: "bg-yellow-500/20 text-yellow-500" },
  approved: { label: "Aprovado", color: "bg-success/20 text-success" },
  paid: { label: "Pago", color: "bg-primary/20 text-primary" },
  rejected: { label: "Rejeitado", color: "bg-destructive/20 text-destructive" },
};

export default function Governanca() {
  const [rules, setRules] = useState(approvalRules);
  const [approvals, setApprovals] = useState(pendingApprovals);
  const [auditFilter, setAuditFilter] = useState("all");
  const [auditUserFilter, setAuditUserFilter] = useState("all");
  const [reimbursements, setReimbursements] = useState(reimbursementRequests);
  const [reimbFilter, setReimbFilter] = useState("all");

  const toggleRule = (id: number) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const handleApproval = (id: number, action: "approve" | "reject") => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReimbAction = (id: number, status: ReimbursementRequest["status"]) => {
    setReimbursements((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const filteredAudit = auditLog.filter((entry) => {
    if (auditFilter !== "all" && entry.actionType !== auditFilter) return false;
    if (auditUserFilter !== "all" && entry.user !== auditUserFilter) return false;
    return true;
  });

  const suspiciousCount = auditLog.filter((e) => e.suspicious).length;
  const deleteAttempts = auditLog.filter((e) => e.actionType === "delete_attempt").length;
  const uniqueUsers = [...new Set(auditLog.map((e) => e.user))];

  const filteredReimb = reimbursements.filter((r) => reimbFilter === "all" || r.status === reimbFilter);

  // Heatmap data for bar chart (flattened)
  const heatmapBars = activityHeatmap.map((row) => ({
    day: row.day,
    total: Object.entries(row).filter(([k]) => k.startsWith("h")).reduce((s, [, v]) => s + (v as number), 0),
  }));

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Governança & Controle</h1>
          <p className="text-muted-foreground font-data">Compliance, alçadas e trilha de auditoria</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {deleteAttempts} tentativas de exclusão bloqueadas
          </Badge>
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            {approvals.length} aprovações pendentes
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="approvals" className="font-data">
            <Shield className="h-4 w-4 mr-1.5" />
            Alçadas
          </TabsTrigger>
          <TabsTrigger value="audit" className="font-data">
            <Eye className="h-4 w-4 mr-1.5" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="reimbursement" className="font-data">
            <Receipt className="h-4 w-4 mr-1.5" />
            Reembolsos
          </TabsTrigger>
        </TabsList>

        {/* ═══ ALÇADAS DE APROVAÇÃO ═══ */}
        <TabsContent value="approvals" className="space-y-6">
          {/* Regras */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg">Regras de Alçada</h3>
            {rules.map((rule) => (
              <div key={rule.id} className={cn("rounded-xl border bg-card p-5 transition-opacity", !rule.active && "opacity-50")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleRule(rule.id)} className="text-foreground">
                      {rule.active ? <ToggleRight className="h-6 w-6 text-success" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                    </button>
                    <h4 className="font-display font-semibold">{rule.name}</h4>
                  </div>
                  <Button variant="ghost" size="sm"><Edit3 className="h-4 w-4 mr-1" /> Editar</Button>
                </div>
                <div className="grid gap-2">
                  {rule.tiers.map((tier, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground font-data">
                        {tier.max === null
                          ? `Acima de ${formatCurrency(tier.min)}`
                          : tier.min === 0
                          ? `Até ${formatCurrency(tier.max)}`
                          : `${formatCurrency(tier.min)} – ${formatCurrency(tier.max)}`}
                      </span>
                      <span className="font-medium">{tier.approver}</span>
                      <span className="text-xs text-muted-foreground">
                        {tier.hoursLimit > 0 ? `${tier.hoursLimit}h` : "Auto"} → Escala: {tier.escalation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fila de Aprovações */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              Fila de Aprovações
              <Badge className="bg-destructive/20 text-destructive">{approvals.length}</Badge>
            </h3>
            {approvals.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma aprovação pendente!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.map((item) => (
                  <div key={item.id} className={cn(
                    "rounded-xl border bg-card p-5",
                    item.urgency === "high" && "border-destructive/40",
                    item.urgency === "medium" && "border-yellow-500/40",
                  )}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{item.description}</span>
                          {item.urgency === "high" && <Badge variant="destructive" className="text-xs">Urgente</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span><Users className="inline h-3.5 w-3.5 mr-1" />{item.requester}</span>
                          <span className="font-data font-semibold text-foreground">{formatCurrency(item.value)}</span>
                          <span><Clock className="inline h-3.5 w-3.5 mr-1" />há {item.hoursAgo}h</span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApproval(item.id, "approve")}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApproval(item.id, "reject")}>
                          <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ TRILHA DE AUDITORIA ═══ */}
        <TabsContent value="audit" className="space-y-6">
          {/* Alert banner */}
          {suspiciousCount > 0 && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-destructive">⚠️ {deleteAttempts} tentativas de exclusão de registros bloqueadas</span>
                <span className="text-muted-foreground"> e {suspiciousCount - deleteAttempts} ações suspeitas nos últimos 7 dias</span>
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={auditFilter} onValueChange={setAuditFilter}>
              <SelectTrigger className="w-44 h-9"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue placeholder="Tipo de ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="edit">Edições</SelectItem>
                <SelectItem value="approve">Aprovações</SelectItem>
                <SelectItem value="reject">Rejeições</SelectItem>
                <SelectItem value="create">Criações</SelectItem>
                <SelectItem value="delete_attempt">Tentativas exclusão</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="export">Exportações</SelectItem>
              </SelectContent>
            </Select>
            <Select value={auditUserFilter} onValueChange={setAuditUserFilter}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Usuário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueUsers.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Exportar PDF
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{filteredAudit.length} registros</span>
          </div>

          {/* Audit table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Timestamp</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuário</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ação</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Entidade</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Anterior</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Novo</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.map((entry) => (
                    <tr key={entry.id} className={cn(
                      "border-b border-border/50 transition-colors hover:bg-muted/20",
                      entry.suspicious && "bg-destructive/5"
                    )}>
                      <td className="px-4 py-3 font-data text-xs whitespace-nowrap">{entry.timestamp}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{entry.user}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5", actionColors[entry.actionType])}>
                          {actionIcons[entry.actionType]}
                          {entry.action}
                        </span>
                        {entry.suspicious && <AlertTriangle className="inline h-3.5 w-3.5 text-destructive ml-1.5" />}
                      </td>
                      <td className="px-4 py-3 font-data text-xs">{entry.entity}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{entry.oldValue}</td>
                      <td className="px-4 py-3 text-xs font-data">{entry.newValue}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-data">{entry.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity heatmap (simplified as bar chart) */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Atividade por Dia da Semana</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapBars} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                  />
                  <Bar dataKey="total" name="Ações" radius={[4, 4, 0, 0]}>
                    {heatmapBars.map((entry, i) => (
                      <Cell key={i} fill={entry.total > 100 ? "hsl(152, 100%, 50%)" : entry.total > 50 ? "hsl(187, 100%, 50%)" : "hsl(215, 20%, 45%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap grid */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Mapa de Calor — Ações por Hora</h4>
              <div className="overflow-x-auto">
                <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(12, 1fr)` }}>
                  <div />
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="text-[10px] text-center text-muted-foreground font-data">{i + 8}h</div>
                  ))}
                  {activityHeatmap.map((row) => (
                    <>
                      <div key={row.day} className="text-xs font-medium text-muted-foreground flex items-center">{row.day}</div>
                      {Array.from({ length: 12 }, (_, i) => {
                        const key = `h${i + 8}` as keyof typeof row;
                        const val = row[key] as number;
                        const intensity = Math.min(val / 23, 1);
                        return (
                          <div
                            key={`${row.day}-${i}`}
                            className="rounded-sm h-6 flex items-center justify-center text-[9px] font-data"
                            style={{
                              backgroundColor: val === 0 ? "hsl(222, 30%, 15%)" : `hsla(152, 100%, 50%, ${0.1 + intensity * 0.6})`,
                              color: intensity > 0.5 ? "hsl(222, 35%, 13%)" : "hsl(215, 20%, 55%)",
                            }}
                          >
                            {val > 0 ? val : ""}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ REEMBOLSOS ═══ */}
        <TabsContent value="reimbursement" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
              <p className="text-sm text-muted-foreground">Pendente de Aprovação</p>
              <p className="text-2xl font-display font-bold text-yellow-500">{formatCurrency(reimbursementSummary.totalPending)}</p>
              <p className="text-xs text-muted-foreground">{reimbursementSummary.openRequests} solicitações abertas</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Total no Mês</p>
              <p className="text-2xl font-display font-bold">{formatCurrency(reimbursementSummary.monthlyTotal)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
              <p className="text-2xl font-display font-bold">{reimbursementSummary.avgProcessingDays} dias</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Por Categoria (top)</p>
              <p className="text-2xl font-display font-bold">{reimbursementSummary.byCategory[0].category}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(reimbursementSummary.byCategory[0].total)}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={reimbFilter} onValueChange={setReimbFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="submitted">Submetido</SelectItem>
                <SelectItem value="review">Em Análise</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reimbursement list */}
          <div className="space-y-3">
            {filteredReimb.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{item.description}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusConfig[item.status].color)}>
                        {statusConfig[item.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{item.collaborator}</span>
                      <span className="font-data font-semibold text-foreground text-sm">{formatCurrency(item.value)}</span>
                      <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      <span>{item.submittedDate}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 italic">"{item.justification}"</p>
                    {item.reviewerComment && (
                      <p className="text-xs text-destructive mt-1">💬 {item.reviewerComment}</p>
                    )}
                  </div>
                  {(item.status === "submitted" || item.status === "review") && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleReimbAction(item.id, "approved")}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReimbAction(item.id, "rejected")}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* By collaborator breakdown */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Reembolsos por Colaborador</h3>
            <div className="space-y-3">
              {reimbursementSummary.byCollaborator.map((c) => (
                <div key={c.name} className="flex items-center gap-4">
                  <span className="text-sm w-36 truncate">{c.name}</span>
                  <div className="flex-1">
                    <Progress value={(c.total / reimbursementSummary.byCollaborator[0].total) * 100} className="h-2" />
                  </div>
                  <span className="text-sm font-data w-24 text-right">{formatCurrency(c.total)}</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{c.count} itens</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
