import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Landmark, CreditCard, PiggyBank, Wallet, Plus, MoreHorizontal,
  Building2, Eye, Power, PowerOff, ChevronRight, Clock, ArrowLeftRight, Wifi,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  paymentInstruments as initialInstruments, cardStatements, mockTransactions,
  people, brazilianBanks,
} from "@/data/financeiro-mock";
import { PaymentInstrument, CardStatement } from "@/data/types";
import { toast } from "@/hooks/use-toast";
import { ConnectBankModal } from "@/components/financeiro/ConnectBankModal";
import { ConnectedBank } from "@/data/open-finance-mock";
import { useNavigate } from "react-router-dom";

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  conta_corrente: { icon: Landmark, label: "Conta Corrente", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  poupanca: { icon: PiggyBank, label: "Poupança", color: "text-primary", bg: "bg-primary/10" },
  cartao_credito: { icon: CreditCard, label: "Cartão de Crédito", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
  caixa: { icon: Wallet, label: "Carteira / Caixa", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  outro: { icon: Building2, label: "Outro", color: "text-muted-foreground", bg: "bg-muted" },
};

function InstrumentCard({ inst, onViewStatements }: { inst: PaymentInstrument; onViewStatements: (id: string) => void }) {
  const cfg = typeConfig[inst.type] || typeConfig.outro;
  const Icon = cfg.icon;
  const lastTxns = mockTransactions.filter((t) => t.instrument_id === inst.id).slice(0, 3);
  const isCard = inst.type === "cartao_credito";
  const available = isCard && inst.credit_limit ? inst.credit_limit + inst.balance : 0;

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`${cfg.bg} rounded-xl p-3`}>
              <Icon className={`h-5 w-5 ${cfg.color}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{inst.name}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}{inst.bank ? ` — ${inst.bank}` : ""}</p>
            </div>
          </div>
          <Badge variant={inst.active ? "default" : "secondary"} className="text-[10px]">
            {inst.active ? "Ativa" : "Inativa"}
          </Badge>
        </div>

        {/* Balance / Limit */}
        {isCard ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fatura atual</span>
              <span className="font-bold text-destructive">{fmt(Math.abs(inst.balance))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limite total</span>
              <span className="font-medium text-foreground">{fmt(inst.credit_limit!)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponível</span>
              <span className="font-medium text-primary">{fmt(available)}</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${Math.min(100, (Math.abs(inst.balance) / inst.credit_limit!) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fecha dia {inst.closing_day}</span>
              <span>Vence dia {inst.due_day}</span>
            </div>
            {inst.last4 && <p className="text-xs text-muted-foreground">**** **** **** {inst.last4}</p>}
            <Button variant="outline" size="sm" className="w-full gap-1 mt-1" onClick={() => onViewStatements(inst.id)}>
              <Eye className="h-3.5 w-3.5" /> Ver Faturas
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p className={`text-2xl font-bold font-display ${inst.balance >= 0 ? "text-primary" : "text-destructive"}`}>
              {inst.balance < 0 ? "- " : ""}{fmt(inst.balance)}
            </p>
          </div>
        )}

        {/* Last transactions (non-card) */}
        {!isCard && lastTxns.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Últimas transações</p>
              {lastTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground truncate">{txn.description}</span>
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${txn.type === "receita" ? "text-primary" : "text-destructive"}`}>
                    {txn.type === "receita" ? "+" : "-"}{fmt(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AddInstrumentDialog({ onAdd }: { onAdd: (inst: PaymentInstrument) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PaymentInstrument["type"]>("conta_corrente");
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [last4, setLast4] = useState("");
  const [holderId, setHolderId] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [balance, setBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [active, setActive] = useState(true);
  const isCard = type === "cartao_credito";

  const reset = () => {
    setType("conta_corrente"); setName(""); setBank(""); setLast4("");
    setHolderId(""); setClosingDay(""); setDueDay(""); setBalance("");
    setCreditLimit(""); setActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inst: PaymentInstrument = {
      id: `pi-new-${Date.now()}`,
      name,
      type,
      bank: bank || undefined,
      last4: isCard ? last4 : undefined,
      holder_person_id: holderId || undefined,
      closing_day: isCard ? parseInt(closingDay) || undefined : undefined,
      due_day: isCard ? parseInt(dueDay) || undefined : undefined,
      balance: parseFloat(balance) || 0,
      credit_limit: isCard ? parseFloat(creditLimit) || undefined : undefined,
      active,
    };
    onAdd(inst);
    reset();
    setOpen(false);
    toast({ title: "Conta adicionada", description: name });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Adicionar Conta</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Nova Conta / Cartão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as PaymentInstrument["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="caixa">Carteira / Caixa</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome / Label</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Conta Corrente Bradesco" required />
          </div>

          <div className="space-y-2">
            <Label>Banco</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {brazilianBanks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isCard && (
            <>
              <div className="space-y-2">
                <Label>Últimos 4 dígitos</Label>
                <Input maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} placeholder="0000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Dia de Fechamento</Label>
                  <Input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Dia de Vencimento</Label>
                  <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limite de Crédito (R$)</Label>
                <Input type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="0,00" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Titular</Label>
            <Select value={holderId} onValueChange={setHolderId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isCard ? "Fatura atual (R$)" : "Saldo Inicial (R$)"}</Label>
            <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0,00" />
          </div>

          <div className="flex items-center justify-between">
            <Label>Ativa</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatementsDrawer({
  open, onOpenChange, instrumentId,
}: { open: boolean; onOpenChange: (v: boolean) => void; instrumentId: string | null }) {
  const instrument = initialInstruments.find((i) => i.id === instrumentId);
  const statements = cardStatements.filter((s) => s.instrument_id === instrumentId);
  const [selectedStatement, setSelectedStatement] = useState<CardStatement | null>(null);
  const statementTxns = mockTransactions.filter(
    (t) => t.instrument_id === instrumentId && selectedStatement &&
      t.txn_date >= selectedStatement.closing_date.replace(/20$/, "01") // rough month filter
  ).slice(0, 8);

  const statusBadge = (s: CardStatement["status"]) => {
    if (s === "paga") return <Badge className="text-xs bg-primary/10 text-primary border-0">Paga</Badge>;
    if (s === "fechada") return <Badge variant="secondary" className="text-xs">Fechada</Badge>;
    return <Badge variant="destructive" className="text-xs">Aberta</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedStatement(null); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">{instrument?.name ?? "Faturas"}</SheetTitle>
        </SheetHeader>

        {!selectedStatement ? (
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedStatement(s)}>
                    <TableCell className="font-medium text-sm">{s.month}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(s.closing_date), "dd/MM")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(s.due_date), "dd/MM")}</TableCell>
                    <TableCell className="text-right font-medium text-sm text-destructive">{fmt(s.total)}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedStatement(null)} className="gap-1 text-muted-foreground">
              ← Voltar
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Fatura {selectedStatement.month}</p>
                <p className="text-xs text-muted-foreground">
                  Fechamento: {format(new Date(selectedStatement.closing_date), "dd/MM/yyyy")} · Vencimento: {format(new Date(selectedStatement.due_date), "dd/MM/yyyy")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-destructive">{fmt(selectedStatement.total)}</p>
                {statusBadge(selectedStatement.status)}
              </div>
            </div>
            <Separator />
            <div className="space-y-1">
              {mockTransactions.filter((t) => t.instrument_id === instrumentId).slice(0, 6).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{format(new Date(txn.txn_date), "dd/MM/yyyy")} · {txn.merchant}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-destructive whitespace-nowrap ml-3">
                    {fmt(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function ContasCartoes() {
  const [instruments, setInstruments] = useState<PaymentInstrument[]>(initialInstruments);
  const [statementsOpen, setStatementsOpen] = useState(false);
  const [statementsInstrumentId, setStatementsInstrumentId] = useState<string | null>(null);
  const [connectBankOpen, setConnectBankOpen] = useState(false);
  const navigate = useNavigate();

  const consolidatedBalance = useMemo(
    () => instruments.filter((i) => i.active && i.type !== "cartao_credito").reduce((s, i) => s + i.balance, 0),
    [instruments],
  );

  const handleAdd = (inst: PaymentInstrument) => setInstruments((prev) => [...prev, inst]);

  const handleBankConnected = (bank: ConnectedBank) => {
    if (bank.linkedInstrumentId) return;
    // Auto-create instrument for the new bank
    const newInst: PaymentInstrument = {
      id: `pi-of-${Date.now()}`,
      name: `${bank.connectorName} — ${bank.accountType}`,
      type: "conta_corrente",
      bank: bank.connectorName,
      balance: bank.balanceFromPluggy,
      active: true,
    };
    setInstruments((prev) => [...prev, newInst]);
  };

  const openStatements = (id: string) => {
    setStatementsInstrumentId(id);
    setStatementsOpen(true);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Contas & Cartões</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setConnectBankOpen(true)}>
              <Wifi className="h-4 w-4" /> Conectar banco automaticamente
            </Button>
            <AddInstrumentDialog onAdd={handleAdd} />
          </div>
        </div>

        {/* Consolidated Balance */}
        <Card className="border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-primary/10 rounded-xl p-4">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Consolidado (excl. cartões de crédito)</p>
              <p className="text-3xl font-bold font-display text-primary">{fmt(consolidatedBalance)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Instrument Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {instruments.map((inst) => (
            <InstrumentCard key={inst.id} inst={inst} onViewStatements={openStatements} />
          ))}
        </div>
      </div>

      {/* Statements Drawer */}
      <StatementsDrawer
        open={statementsOpen}
        onOpenChange={setStatementsOpen}
        instrumentId={statementsInstrumentId}
      />
      <ConnectBankModal
        open={connectBankOpen}
        onOpenChange={setConnectBankOpen}
        onBankConnected={handleBankConnected}
      />
    </div>
  );
}
