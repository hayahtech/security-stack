import React, { useState, useMemo } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ArrowUpCircle, ArrowDownCircle, AlertTriangle, CalendarDays, Clock,
  Check, Edit, Trash2, Layers, MoreHorizontal, Power, PowerOff,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Payable } from "@/data/types";
import { mockPayables, mockInstallmentPlans, mockRecurringRules } from "@/data/pagar-receber-mock";
import { categories, people, paymentInstruments } from "@/data/financeiro-mock";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const TODAY = "2026-03-08";

function getStatusInfo(p: Payable) {
  if (p.status === "pago") return { label: "Pago", variant: "default" as const, color: "text-primary" };
  if (p.status === "vencido" || p.due_date < TODAY) return { label: "Vencido", variant: "destructive" as const, color: "text-destructive" };
  if (p.due_date === TODAY) return { label: "Hoje", variant: "secondary" as const, color: "text-amber-600 dark:text-amber-400" };
  return { label: "Pendente", variant: "secondary" as const, color: "text-blue-600 dark:text-blue-400" };
}

function daysUntil(date: string) {
  return differenceInDays(parseISO(date), parseISO(TODAY));
}

// ── Pay Confirmation Modal ────────────────────────────────
function PayModal({ payable, open, onOpenChange, onConfirm }: {
  payable: Payable | null; open: boolean; onOpenChange: (v: boolean) => void;
  onConfirm: (id: string, date: string, instrumentId: string) => void;
}) {
  const [paidDate, setPaidDate] = useState<Date | undefined>(new Date());
  const [instrumentId, setInstrumentId] = useState("pi-1");

  if (!payable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Confirmar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm font-medium text-foreground">{payable.description}</p>
            <p className="text-lg font-bold font-display text-primary mt-1">{fmt(payable.amount)}</p>
          </div>
          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !paidDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {paidDate ? format(paidDate, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={paidDate} onSelect={setPaidDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Conta Debitada</Label>
            <Select value={instrumentId} onValueChange={setInstrumentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentInstruments.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1 gap-1" onClick={() => {
              onConfirm(payable.id, paidDate ? format(paidDate, "yyyy-MM-dd") : TODAY, instrumentId);
              onOpenChange(false);
            }}>
              <Check className="h-4 w-4" /> Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab Content ───────────────────────────────────────────
function TabContent({ tabType }: { tabType: "pagar" | "receber" }) {
  const [payables, setPayables] = useState<Payable[]>(mockPayables);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [payModal, setPayModal] = useState<Payable | null>(null);

  const items = useMemo(() => {
    let list = payables.filter((p) => p.type === tabType);
    if (statusFilter !== "all") {
      if (statusFilter === "vencido") list = list.filter((p) => p.status === "vencido" || (p.status === "pendente" && p.due_date < TODAY));
      else list = list.filter((p) => p.status === statusFilter);
    }
    if (categoryFilter !== "all") list = list.filter((p) => p.category_id === categoryFilter);
    if (personFilter !== "all") list = list.filter((p) => p.person_id === personFilter);
    return list.sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [payables, tabType, statusFilter, categoryFilter, personFilter]);

  const allOfType = payables.filter((p) => p.type === tabType);
  const pending = allOfType.filter((p) => p.status === "pendente");
  const overdue = allOfType.filter((p) => (p.status === "vencido" || (p.status === "pendente" && p.due_date < TODAY)));
  const dueSoon = pending.filter((p) => { const d = daysUntil(p.due_date); return d >= 0 && d <= 7; });
  const totalMonth = allOfType.filter((p) => p.due_date.startsWith("2026-03")).reduce((s, p) => s + p.amount, 0);

  const isPagar = tabType === "pagar";
  const summaryCards = [
    { label: isPagar ? "Total Pendente" : "Total a Receber", value: pending.reduce((s, p) => s + p.amount, 0), icon: isPagar ? ArrowUpCircle : ArrowDownCircle, color: isPagar ? "text-destructive" : "text-primary", bg: isPagar ? "bg-destructive/10" : "bg-primary/10" },
    { label: "Vencido", value: overdue.reduce((s, p) => s + p.amount, 0), icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Vence em 7 dias", value: dueSoon.reduce((s, p) => s + p.amount, 0), icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { label: "Total do Mês", value: totalMonth, icon: CalendarDays, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  ];

  const handlePay = (id: string, date: string, instrumentId: string) => {
    setPayables((prev) => prev.map((p) => p.id === id ? { ...p, status: "pago" as const, paid_date: date, paid_instrument_id: instrumentId } : p));
    toast({ title: isPagar ? "Pagamento confirmado" : "Recebimento confirmado" });
  };

  const handleDelete = (id: string) => {
    setPayables((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Lançamento excluído" });
  };

  const getPersonName = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={personFilter} onValueChange={setPersonFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pessoa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas pessoas</SelectItem>
            {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <div className={`${c.bg} ${c.color} rounded-lg p-2`}><c.icon className="h-4 w-4" /></div>
              </div>
              <p className={`text-xl font-bold font-display ${c.color}`}>{fmt(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>{isPagar ? "Favorecido" : "Pagador"}</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => {
                  const si = getStatusInfo(p);
                  const days = daysUntil(p.due_date);
                  return (
                    <TableRow key={p.id} className="group">
                      <TableCell className="whitespace-nowrap text-sm">
                        <div>
                          <span>{format(parseISO(p.due_date), "dd/MM/yyyy")}</span>
                          {p.status !== "pago" && days <= 7 && days >= 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">{days === 0 ? "Hoje" : `em ${days} dia${days > 1 ? "s" : ""}`}</p>
                          )}
                          {p.status !== "pago" && days < 0 && (
                            <p className="text-[10px] text-destructive">{Math.abs(days)} dia{Math.abs(days) > 1 ? "s" : ""} atrás</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{p.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getPersonName(p.person_id)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getCategoryName(p.category_id)}</TableCell>
                      <TableCell className={`text-right font-medium whitespace-nowrap ${isPagar ? "text-destructive" : "text-primary"}`}>
                        {fmt(p.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.installment_label ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={si.variant}
                          className={cn("text-xs", {
                            "bg-primary/10 text-primary border-0": si.label === "Pago",
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0": si.label === "Hoje",
                            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0": si.label === "Pendente",
                          })}
                        >
                          {si.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.status !== "pago" && (
                              <DropdownMenuItem className="gap-2" onClick={() => setPayModal(p)}>
                                <Check className="h-3.5 w-3.5" /> Marcar como pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2"><Edit className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Layers className="h-3.5 w-3.5" /> Parcelar</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum lançamento encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PayModal payable={payModal} open={!!payModal} onOpenChange={(v) => !v && setPayModal(null)} onConfirm={handlePay} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function PagarReceber() {
  const [recurringRules, setRecurringRules] = useState(mockRecurringRules);

  const toggleRecurring = (id: string) => {
    setRecurringRules((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const frequencyLabel: Record<string, string> = {
    semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral", anual: "Anual",
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">A Pagar & A Receber</h1>

        <Tabs defaultValue="pagar" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="pagar" className="gap-1"><ArrowUpCircle className="h-4 w-4" /> A Pagar</TabsTrigger>
            <TabsTrigger value="receber" className="gap-1"><ArrowDownCircle className="h-4 w-4" /> A Receber</TabsTrigger>
          </TabsList>

          <TabsContent value="pagar"><TabContent tabType="pagar" /></TabsContent>
          <TabsContent value="receber"><TabContent tabType="receber" /></TabsContent>
        </Tabs>

        <Separator />

        {/* Installment Plans */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Parcelamentos Ativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockInstallmentPlans.map((ip) => {
              const progress = (ip.paid_count / ip.num_installments) * 100;
              const isPagar = ip.type === "pagar";
              return (
                <Card key={ip.id} className="border-border">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ip.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {isPagar ? "A pagar" : "A receber"} · Próxima: {format(parseISO(ip.next_due), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge variant={isPagar ? "destructive" : "default"} className="text-xs shrink-0">
                        {isPagar ? "Pagar" : "Receber"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total: {fmt(ip.total)}</span>
                      <span className="font-medium text-foreground">{ip.paid_count}/{ip.num_installments} parcelas</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% concluído</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Recurring Rules */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> Lançamentos Recorrentes
          </h2>
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recurringRules.map((r) => (
                  <div key={r.id} className={cn("flex items-center gap-4 px-4 py-3", !r.active && "opacity-50")}>
                    <Switch checked={r.active} onCheckedChange={() => toggleRecurring(r.id)} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{r.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {frequencyLabel[r.frequency]} · Próximo: {format(parseISO(r.next_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Badge variant={r.type === "pagar" ? "destructive" : "default"} className="text-xs shrink-0">
                      {r.type === "pagar" ? "Pagar" : "Receber"}
                    </Badge>
                    <span className={`text-sm font-bold whitespace-nowrap ${r.type === "pagar" ? "text-destructive" : "text-primary"}`}>
                      {fmt(r.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
