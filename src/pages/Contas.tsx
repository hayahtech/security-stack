import { useState } from "react";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  receivables,
  receivableKpis,
  payables,
  payableKpis,
  financialAgenda,
  type AccountStatus,
  type Receivable,
  type Payable,
} from "@/mock/accountsData";
import { formatCurrency } from "@/mock/financialData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: AccountStatus }) {
  const map: Record<AccountStatus, { label: string; cls: string }> = {
    on_time: { label: "Em dia", cls: "bg-success/20 text-success border-success/30" },
    due_today: { label: "Vence hoje", cls: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
    overdue_1_30: { label: "Vencido 1-30d", cls: "bg-orange-500/20 text-orange-500 border-orange-500/30" },
    overdue_31_60: { label: "Vencido 31-60d", cls: "bg-destructive/20 text-destructive border-destructive/30" },
    overdue_60_plus: { label: "Vencido +60d", cls: "bg-secondary/20 text-secondary border-secondary/30" },
  };
  const { label, cls } = map[status];
  return <Badge className={cls}>{label}</Badge>;
}

function PayableStatusBadge({ status }: { status: Payable["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Pago", cls: "bg-success/20 text-success border-success/30" },
    pending: { label: "Pendente", cls: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
    overdue: { label: "Em atraso", cls: "bg-destructive/20 text-destructive border-destructive/30" },
  };
  const { label, cls } = map[status];
  return <Badge className={cls}>{label}</Badge>;
}

export default function Contas() {
  const [recPage, setRecPage] = useState(0);
  const [payPage, setPayPage] = useState(0);

  const recTotalPages = Math.ceil(receivables.length / PAGE_SIZE);
  const payTotalPages = Math.ceil(payables.length / PAGE_SIZE);

  const pagedReceivables = receivables.slice(recPage * PAGE_SIZE, (recPage + 1) * PAGE_SIZE);
  const pagedPayables = payables.slice(payPage * PAGE_SIZE, (payPage + 1) * PAGE_SIZE);

  const handleAction = (action: string, name: string) => {
    toast.success(`${action}: ${name}`, { description: "Ação registrada com sucesso." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Contas a Pagar / Receber
        </h1>
        <p className="text-muted-foreground font-data">
          Gestão de vencimentos e obrigações financeiras
        </p>
      </div>

      <Tabs defaultValue="receivables">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="receivables" className="gap-2 data-[state=active]:bg-card">
            <ArrowUpRight className="h-4 w-4 text-success" />
            A Receber
          </TabsTrigger>
          <TabsTrigger value="payables" className="gap-2 data-[state=active]:bg-card">
            <ArrowDownLeft className="h-4 w-4 text-destructive" />
            A Pagar
          </TabsTrigger>
          <TabsTrigger value="agenda" className="gap-2 data-[state=active]:bg-card">
            <Calendar className="h-4 w-4 text-primary" />
            Agenda
          </TabsTrigger>
        </TabsList>

        {/* ═══ CONTAS A RECEBER ═══ */}
        <TabsContent value="receivables" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiMini icon={DollarSign} label="Total a Receber" value={formatCurrency(receivableKpis.totalReceivable)} variant="primary" />
            <KpiMini icon={Clock} label="Vence em 30 dias" value={formatCurrency(receivableKpis.dueIn30Days)} variant="warning" />
            <KpiMini icon={AlertTriangle} label="Vencido" value={formatCurrency(receivableKpis.overdue)} variant="danger" />
            <KpiMini icon={TrendingUp} label="Inadimplência" value={`${receivableKpis.delinquencyRate}%`} variant="danger" />
            <KpiMini icon={Clock} label="PMR" value={`${receivableKpis.avgDaysToReceive} dias`} variant="default" />
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-display">Cliente</TableHead>
                    <TableHead className="font-display">NF</TableHead>
                    <TableHead className="font-display text-right">Valor</TableHead>
                    <TableHead className="font-display">Emissão</TableHead>
                    <TableHead className="font-display">Vencimento</TableHead>
                    <TableHead className="font-display text-center">Dias</TableHead>
                    <TableHead className="font-display text-center">Status</TableHead>
                    <TableHead className="font-display text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedReceivables.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="font-data font-medium">{r.client}</TableCell>
                      <TableCell className="font-data text-muted-foreground">{r.nf}</TableCell>
                      <TableCell className="font-data text-right tabular-nums">{formatCurrency(r.value)}</TableCell>
                      <TableCell className="font-data text-muted-foreground">{new Date(r.issueDate).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-data">{new Date(r.dueDate).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-data text-center tabular-nums">
                        {r.daysOverdue > 0 ? <span className="text-destructive">{r.daysOverdue}</span> : "—"}
                      </TableCell>
                      <TableCell className="text-center"><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-card border-border">
                            <DropdownMenuItem onClick={() => handleAction("Cobrança enviada", r.client)}>
                              <Send className="h-4 w-4 mr-2" />Enviar Cobrança
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("Baixa manual", r.client)}>
                              Dar Baixa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction("Renegociação", r.client)}>
                              Renegociar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={recPage} totalPages={recTotalPages} onPageChange={setRecPage} />
          </div>
        </TabsContent>

        {/* ═══ CONTAS A PAGAR ═══ */}
        <TabsContent value="payables" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiMini icon={DollarSign} label="Total a Pagar" value={formatCurrency(payableKpis.totalPayable)} variant="primary" />
            <KpiMini icon={Clock} label="Vence em 7 dias" value={formatCurrency(payableKpis.dueIn7Days)} variant="warning" />
            <KpiMini icon={AlertTriangle} label="Em Atraso" value={formatCurrency(payableKpis.overdue)} variant="danger" />
            <KpiMini icon={Clock} label="PMP" value={`${payableKpis.avgDaysToPay} dias`} variant="default" />
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-display">Fornecedor</TableHead>
                    <TableHead className="font-display">Descrição</TableHead>
                    <TableHead className="font-display text-right">Valor</TableHead>
                    <TableHead className="font-display">Vencimento</TableHead>
                    <TableHead className="font-display">Categoria</TableHead>
                    <TableHead className="font-display text-center">Status</TableHead>
                    <TableHead className="font-display text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPayables.map((p) => (
                    <TableRow key={p.id} className={cn("hover:bg-muted/20", p.status === "overdue" && "bg-destructive/5")}>
                      <TableCell className="font-data font-medium">{p.supplier}</TableCell>
                      <TableCell className="font-data text-muted-foreground">{p.description}</TableCell>
                      <TableCell className="font-data text-right tabular-nums">{formatCurrency(p.value)}</TableCell>
                      <TableCell className="font-data">{new Date(p.dueDate).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-data">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center"><PayableStatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleAction("Pagamento agendado", p.supplier)}>
                          Pagar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={payPage} totalPages={payTotalPages} onPageChange={setPayPage} />
          </div>
        </TabsContent>

        {/* ═══ AGENDA FINANCEIRA ═══ */}
        <TabsContent value="agenda" className="space-y-6 mt-6">
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">Agenda Financeira — Próximos 7 Dias</h2>
            <div className="space-y-4">
              {financialAgenda.map((day) => {
                const totalReceive = day.items.filter((x) => x.type === "receive").reduce((a, b) => a + b.value, 0);
                const totalPay = day.items.filter((x) => x.type === "pay").reduce((a, b) => a + b.value, 0);
                return (
                  <div key={day.date} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display font-semibold capitalize">{day.label}</span>
                      <div className="flex gap-4 text-sm font-data">
                        {totalReceive > 0 && <span className="text-success">+{formatCurrency(totalReceive)}</span>}
                        {totalPay > 0 && <span className="text-destructive">-{formatCurrency(totalPay)}</span>}
                      </div>
                    </div>
                    {day.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum vencimento</p>
                    ) : (
                      <div className="space-y-2">
                        {day.items.map((item, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex justify-between items-center px-3 py-2 rounded-lg text-sm",
                              item.type === "receive" ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {item.type === "receive" ? (
                                <ArrowUpRight className="h-4 w-4 text-success" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-destructive" />
                              )}
                              <span className="font-data">{item.description}</span>
                            </div>
                            <span
                              className={cn(
                                "font-data font-medium tabular-nums",
                                item.type === "receive" ? "text-success" : "text-destructive"
                              )}
                            >
                              {item.type === "receive" ? "+" : "-"}{formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══ Small components ═══

function KpiMini({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: "default" | "primary" | "warning" | "danger";
}) {
  const colors = {
    default: "border-border bg-card",
    primary: "border-primary/30 bg-primary/10",
    warning: "border-yellow-500/30 bg-yellow-500/10",
    danger: "border-destructive/30 bg-destructive/10",
  };
  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-yellow-500",
    danger: "text-destructive",
  };
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-3", colors[variant])}>
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColors[variant])} />
      <div>
        <p className="text-xs text-muted-foreground font-data">{label}</p>
        <p className="text-lg font-display font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-sm text-muted-foreground font-data">
        Página {page + 1} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
