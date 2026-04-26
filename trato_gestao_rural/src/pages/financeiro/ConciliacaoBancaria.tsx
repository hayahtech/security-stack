import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  CalendarIcon, Upload, CheckCircle2, AlertTriangle, XCircle, Info,
  Link2, Plus, Eye, EyeOff, ArrowRight, ChevronRight, FileText, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/* ─── Types ─── */
type ReconciliationStatus = "conciliado" | "divergencia" | "apenas_banco" | "apenas_sistema";

interface BankEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface SystemEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface ReconciliationRow {
  id: string;
  status: ReconciliationStatus;
  bank?: BankEntry;
  system?: SystemEntry;
  justification?: string;
}

interface PastReconciliation {
  id: string;
  account: string;
  period: string;
  date: string;
  matched: number;
  divergences: number;
  bankOnly: number;
  systemOnly: number;
}

/* ─── Mock Data ─── */
const mockAccounts = [
  { id: "acc-1", name: "Banco do Brasil — Conta Corrente" },
  { id: "acc-2", name: "Sicoob — Conta Poupança" },
  { id: "acc-3", name: "Nubank — Conta PJ" },
];

const mockBankEntries: BankEntry[] = [
  { id: "bk-1", date: "2026-02-03", description: "TED Recebida — Venda Gado", amount: 45000 },
  { id: "bk-2", date: "2026-02-05", description: "Débito — Ração Animal", amount: -3200 },
  { id: "bk-3", date: "2026-02-08", description: "Débito — Combustível", amount: -850 },
  { id: "bk-4", date: "2026-02-10", description: "TED Recebida — Leite", amount: 12500 },
  { id: "bk-5", date: "2026-02-12", description: "Débito — Veterinário", amount: -1800 },
  { id: "bk-6", date: "2026-02-15", description: "Débito — Manutenção Cerca", amount: -2100 },
  { id: "bk-7", date: "2026-02-20", description: "TED Recebida — Arrendamento", amount: 8000 },
  { id: "bk-8", date: "2026-02-25", description: "Débito — Salários", amount: -15000 },
];

const mockSystemEntries: SystemEntry[] = [
  { id: "sys-1", date: "2026-02-03", description: "Venda de Gado — Lote 12", amount: 45000, category: "Receita" },
  { id: "sys-2", date: "2026-02-05", description: "Compra de Ração", amount: -3200, category: "Insumos" },
  { id: "sys-3", date: "2026-02-08", description: "Combustível Trator", amount: -900, category: "Operacional" },
  { id: "sys-4", date: "2026-02-10", description: "Venda de Leite — Fevereiro", amount: 12500, category: "Receita" },
  { id: "sys-5", date: "2026-02-14", description: "Consulta Veterinária", amount: -1800, category: "Saúde Animal" },
  { id: "sys-6", date: "2026-02-18", description: "Compra de Arame Farpado", amount: -950, category: "Manutenção" },
  { id: "sys-7", date: "2026-02-22", description: "Pagamento Funcionários", amount: -15000, category: "Folha" },
];

const mockPastReconciliations: PastReconciliation[] = [
  { id: "rec-1", account: "Banco do Brasil — Conta Corrente", period: "Janeiro 2026", date: "2026-02-05", matched: 18, divergences: 2, bankOnly: 1, systemOnly: 0 },
  { id: "rec-2", account: "Banco do Brasil — Conta Corrente", period: "Dezembro 2025", date: "2026-01-08", matched: 22, divergences: 0, bankOnly: 0, systemOnly: 1 },
  { id: "rec-3", account: "Sicoob — Conta Poupança", period: "Janeiro 2026", date: "2026-02-03", matched: 5, divergences: 1, bankOnly: 0, systemOnly: 0 },
];

/* ─── Helpers ─── */
function autoReconcile(bank: BankEntry[], system: SystemEntry[]): ReconciliationRow[] {
  const rows: ReconciliationRow[] = [];
  const usedSystem = new Set<string>();
  const usedBank = new Set<string>();

  // Exact matches first
  bank.forEach((b) => {
    const match = system.find(
      (s) => !usedSystem.has(s.id) && s.amount === b.amount && s.date === b.date,
    );
    if (match) {
      usedSystem.add(match.id);
      usedBank.add(b.id);
      rows.push({ id: `r-${b.id}`, status: "conciliado", bank: b, system: match });
    }
  });

  // Close matches (same amount, different date or vice versa)
  bank.forEach((b) => {
    if (usedBank.has(b.id)) return;
    const match = system.find(
      (s) => !usedSystem.has(s.id) && (s.amount === b.amount || s.date === b.date),
    );
    if (match) {
      usedSystem.add(match.id);
      usedBank.add(b.id);
      rows.push({ id: `r-${b.id}`, status: "divergencia", bank: b, system: match });
    }
  });

  // Bank only
  bank.forEach((b) => {
    if (!usedBank.has(b.id)) {
      rows.push({ id: `r-${b.id}`, status: "apenas_banco", bank: b });
    }
  });

  // System only
  system.forEach((s) => {
    if (!usedSystem.has(s.id)) {
      rows.push({ id: `r-${s.id}`, status: "apenas_sistema", system: s });
    }
  });

  return rows;
}

const statusConfig: Record<ReconciliationStatus, { label: string; color: string; icon: React.ElementType }> = {
  conciliado: { label: "Conciliado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2 },
  divergencia: { label: "Divergência", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", icon: AlertTriangle },
  apenas_banco: { label: "Apenas no Banco", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", icon: XCircle },
  apenas_sistema: { label: "Apenas no Sistema", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: Info },
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ─── Component ─── */
export default function ConciliacaoBancaria() {
  const [step, setStep] = useState(1);

  // Step 1
  const [account, setAccount] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [fileName, setFileName] = useState("");

  // Step 2
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [justifyOpen, setJustifyOpen] = useState(false);
  const [justifyRowId, setJustifyRowId] = useState("");
  const [justification, setJustification] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createRow, setCreateRow] = useState<ReconciliationRow | null>(null);

  // Step 3
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  /* Step 1 actions */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "ofx") {
        toast({ title: "Formato inválido", description: "Apenas arquivos CSV ou OFX são aceitos.", variant: "destructive" });
        return;
      }
      setFileName(f.name);
      toast({ title: "Arquivo carregado", description: f.name });
    }
  };

  const startReconciliation = () => {
    if (!account) {
      toast({ title: "Selecione uma conta", variant: "destructive" });
      return;
    }
    if (!fileName) {
      toast({ title: "Carregue um extrato", variant: "destructive" });
      return;
    }
    const result = autoReconcile(mockBankEntries, mockSystemEntries);
    setRows(result);
    setStep(2);
    toast({ title: "Conciliação iniciada", description: `${result.length} lançamentos para analisar.` });
  };

  /* Step 2 actions */
  const manualMatch = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, status: "conciliado" as ReconciliationStatus } : r)),
    );
    toast({ title: "Lançamento conciliado manualmente" });
  };

  const openJustify = (rowId: string) => {
    setJustifyRowId(rowId);
    setJustification("");
    setJustifyOpen(true);
  };

  const saveJustification = () => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === justifyRowId ? { ...r, justification, status: "conciliado" as ReconciliationStatus } : r,
      ),
    );
    setJustifyOpen(false);
    toast({ title: "Divergência ignorada com justificativa" });
  };

  const openCreateFromBank = (row: ReconciliationRow) => {
    setCreateRow(row);
    setCreateOpen(true);
  };

  const confirmCreate = () => {
    if (createRow) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === createRow.id ? { ...r, status: "conciliado" as ReconciliationStatus } : r,
        ),
      );
    }
    setCreateOpen(false);
    toast({ title: "Lançamento criado no sistema e conciliado" });
  };

  /* Step 3 summary */
  const summary = useMemo(() => {
    const matched = rows.filter((r) => r.status === "conciliado").length;
    const divergences = rows.filter((r) => r.status === "divergencia").length;
    const bankOnly = rows.filter((r) => r.status === "apenas_banco").length;
    const systemOnly = rows.filter((r) => r.status === "apenas_sistema").length;

    const bankTotal = mockBankEntries.reduce((s, e) => s + e.amount, 0);
    const systemTotal = mockSystemEntries.reduce((s, e) => s + e.amount, 0);

    return { matched, divergences, bankOnly, systemOnly, bankTotal, systemTotal };
  }, [rows]);

  const finalize = () => {
    setFinalizeOpen(false);
    toast({ title: "Conciliação finalizada!", description: `Registrada em ${format(new Date(), "dd/MM/yyyy HH:mm")}` });
    setStep(1);
    setAccount("");
    setFileName("");
    setStartDate(undefined);
    setEndDate(undefined);
    setRows([]);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            Conciliação Bancária
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare o extrato do banco com os lançamentos do sistema
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <button
                onClick={() => s < step && setStep(s)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors font-medium",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step > s
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs border border-current">
                  {s}
                </span>
                {s === 1 && "Extrato"}
                {s === 2 && "Comparação"}
                {s === 3 && "Resumo"}
              </button>
              {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══════════════ STEP 1 ═══════════════ */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Selecionar Extrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="account-select">Conta Bancária</Label>
                <Select value={account} onValueChange={setAccount}>
                  <SelectTrigger id="account-select">
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="file-upload">Upload do Extrato (CSV ou OFX)</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="file-upload"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors",
                      "border-border hover:border-primary/50 hover:bg-primary/5",
                      fileName && "border-primary bg-primary/5",
                    )}
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {fileName || "Clique para carregar ou arraste o arquivo"}
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.ofx"
                      className="hidden"
                      onChange={handleFileChange}
                      aria-label="Upload do extrato bancário"
                    />
                  </label>
                </div>
              </div>

              <Button onClick={startReconciliation} className="w-full gap-2" size="lg">
                <ArrowRight className="h-4 w-4" />
                Iniciar Conciliação
              </Button>
            </CardContent>
          </Card>

          {/* Past Reconciliations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Histórico de Conciliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockPastReconciliations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhuma conciliação anterior.</p>
              ) : (
                <div className="space-y-3">
                  {mockPastReconciliations.map((r) => (
                    <div key={r.id} className="rounded-xl border p-3 space-y-2 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{r.account}</p>
                        <span className="text-xs text-muted-foreground">{format(new Date(r.date), "dd/MM/yyyy")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.period}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
                          ✅ {r.matched}
                        </Badge>
                        {r.divergences > 0 && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs">
                            ⚠️ {r.divergences}
                          </Badge>
                        )}
                        {r.bankOnly > 0 && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs">
                            ❌ {r.bankOnly}
                          </Badge>
                        )}
                        {r.systemOnly > 0 && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
                            🔵 {r.systemOnly}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════ STEP 2 ═══════════════ */}
      {step === 2 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rows.length} lançamentos • {rows.filter((r) => r.status === "conciliado").length} conciliados
            </p>
            <Button onClick={() => setStep(3)} className="gap-2">
              Ir para Resumo <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Data (Banco)</TableHead>
                    <TableHead>Descrição (Banco)</TableHead>
                    <TableHead className="text-right">Valor (Banco)</TableHead>
                    <TableHead className="border-l border-border">Data (Sistema)</TableHead>
                    <TableHead>Descrição (Sistema)</TableHead>
                    <TableHead className="text-right">Valor (Sistema)</TableHead>
                    <TableHead className="w-[160px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const cfg = statusConfig[row.status];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={row.id} className="group">
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", cfg.color)}>
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </Badge>
                        </TableCell>

                        {/* Bank side */}
                        <TableCell className="font-mono text-xs">
                          {row.bank ? format(new Date(row.bank.date), "dd/MM") : "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {row.bank?.description || "—"}
                        </TableCell>
                        <TableCell className={cn("text-right font-mono text-sm", row.bank && row.bank.amount < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                          {row.bank ? fmt(row.bank.amount) : "—"}
                        </TableCell>

                        {/* System side */}
                        <TableCell className="font-mono text-xs border-l border-border">
                          {row.system ? format(new Date(row.system.date), "dd/MM") : "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {row.system?.description || "—"}
                        </TableCell>
                        <TableCell className={cn("text-right font-mono text-sm", row.system && row.system.amount < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                          {row.system ? fmt(row.system.amount) : "—"}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {row.status === "divergencia" && (
                              <>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => manualMatch(row.id)}
                                  aria-label="Vincular manualmente"
                                  className="h-7 px-2 text-xs gap-1"
                                >
                                  <Link2 className="h-3 w-3" /> Vincular
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => openJustify(row.id)}
                                  aria-label="Ignorar divergência"
                                  className="h-7 px-2 text-xs gap-1"
                                >
                                  <EyeOff className="h-3 w-3" /> Ignorar
                                </Button>
                              </>
                            )}
                            {row.status === "apenas_banco" && (
                              <>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => openCreateFromBank(row)}
                                  aria-label="Criar lançamento no sistema"
                                  className="h-7 px-2 text-xs gap-1"
                                >
                                  <Plus className="h-3 w-3" /> Criar
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => openJustify(row.id)}
                                  aria-label="Ignorar"
                                  className="h-7 px-2 text-xs gap-1"
                                >
                                  <EyeOff className="h-3 w-3" /> Ignorar
                                </Button>
                              </>
                            )}
                            {row.status === "apenas_sistema" && (
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => openJustify(row.id)}
                                aria-label="Ignorar"
                                className="h-7 px-2 text-xs gap-1"
                              >
                                <EyeOff className="h-3 w-3" /> Ignorar
                              </Button>
                            )}
                            {row.status === "conciliado" && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> OK
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════ STEP 3 ═══════════════ */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Conciliados", value: summary.matched, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "Divergências", value: summary.divergences, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
              { label: "Apenas no Banco", value: summary.bankOnly, icon: XCircle, color: "text-destructive", bg: "bg-red-50 dark:bg-red-900/20" },
              { label: "Apenas no Sistema", value: summary.systemOnly, icon: Info, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
            ].map((card) => (
              <Card key={card.label} className={card.bg}>
                <CardContent className="p-4 flex items-center gap-3">
                  <card.icon className={cn("h-8 w-8", card.color)} />
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparação de Saldos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Saldo Extrato Bancário</p>
                  <p className={cn("text-2xl font-bold font-mono", summary.bankTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                    {fmt(summary.bankTotal)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Saldo no Sistema</p>
                  <p className={cn("text-2xl font-bold font-mono", summary.systemTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                    {fmt(summary.systemTotal)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Diferença</p>
                  <p className={cn(
                    "text-2xl font-bold font-mono",
                    summary.bankTotal - summary.systemTotal === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive",
                  )}>
                    {fmt(summary.bankTotal - summary.systemTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              Voltar à Comparação
            </Button>
            <Button onClick={() => setFinalizeOpen(true)} className="gap-2" size="lg">
              <CheckCircle2 className="h-4 w-4" />
              Finalizar Conciliação
            </Button>
          </div>
        </div>
      )}

      {/* ─── Dialogs ─── */}

      {/* Justify divergence */}
      <Dialog open={justifyOpen} onOpenChange={setJustifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ignorar com Justificativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="justification">Motivo</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique por que esta divergência será ignorada..."
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustifyOpen(false)}>Cancelar</Button>
            <Button onClick={saveJustification} disabled={!justification.trim()}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from bank */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Lançamento no Sistema</AlertDialogTitle>
            <AlertDialogDescription>
              {createRow?.bank && (
                <>
                  Será criado um lançamento com base no extrato:
                  <br />
                  <strong>{createRow.bank.description}</strong> — {fmt(createRow.bank.amount)} em {format(new Date(createRow.bank.date), "dd/MM/yyyy")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreate}>Criar e Conciliar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize */}
      <AlertDialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Conciliação</AlertDialogTitle>
            <AlertDialogDescription>
              Ao finalizar, a data de conciliação será registrada no sistema.
              {summary.divergences > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Ainda existem {summary.divergences} divergência(s) não resolvida(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={finalize}>Confirmar e Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
