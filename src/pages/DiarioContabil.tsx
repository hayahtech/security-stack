import { useState, useMemo } from "react";
import { Plus, Search, X, Check, AlertTriangle, RotateCcw, Filter, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { journalEntriesData, type JournalEntry, type JournalEntryLine, type JournalEntryStatus } from "@/mock/journalEntriesData";
import { flattenAccounts, chartOfAccountsData } from "@/mock/chartOfAccountsData";

const statusConfig: Record<JournalEntryStatus, { label: string; className: string }> = {
  confirmado: { label: "Confirmado", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rascunho: { label: "Rascunho", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  estornado: { label: "Estornado", className: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

interface EntryFormLine {
  accountCode: string;
  accountName: string;
  amount: string;
}

function NewEntryForm({ onClose }: { onClose: () => void }) {
  const flatAccounts = useMemo(() => flattenAccounts(chartOfAccountsData).filter((a) => a.active && a.level >= 3), []);
  const [date, setDate] = useState("2025-03-05");
  const [description, setDescription] = useState("");
  const [document, setDocument] = useState("");
  const [debitLines, setDebitLines] = useState<EntryFormLine[]>([{ accountCode: "", accountName: "", amount: "" }]);
  const [creditLines, setCreditLines] = useState<EntryFormLine[]>([{ accountCode: "", accountName: "", amount: "" }]);

  const totalDebits = debitLines.reduce((s, l) => s + (parseFloat(l.amount.replace(/\./g, "").replace(",", ".")) || 0), 0);
  const totalCredits = creditLines.reduce((s, l) => s + (parseFloat(l.amount.replace(/\./g, "").replace(",", ".")) || 0), 0);
  const diff = totalDebits - totalCredits;
  const isBalanced = Math.abs(diff) < 0.01 && totalDebits > 0;

  const addLine = (type: "debit" | "credit") => {
    const newLine = { accountCode: "", accountName: "", amount: "" };
    if (type === "debit") setDebitLines([...debitLines, newLine]);
    else setCreditLines([...creditLines, newLine]);
  };

  const updateLine = (type: "debit" | "credit", index: number, field: keyof EntryFormLine, value: string) => {
    const setter = type === "debit" ? setDebitLines : setCreditLines;
    const lines = type === "debit" ? [...debitLines] : [...creditLines];
    lines[index] = { ...lines[index], [field]: value };
    if (field === "accountCode") {
      const acc = flatAccounts.find((a) => a.id === value);
      if (acc) lines[index].accountName = acc.name;
    }
    setter(lines);
  };

  const removeLine = (type: "debit" | "credit", index: number) => {
    if (type === "debit" && debitLines.length > 1) setDebitLines(debitLines.filter((_, i) => i !== index));
    else if (type === "credit" && creditLines.length > 1) setCreditLines(creditLines.filter((_, i) => i !== index));
  };

  const handleSave = (status: "rascunho" | "confirmado") => {
    if (status === "confirmado" && !isBalanced) {
      toast.error("Lançamento desequilibrado — não é possível confirmar");
      return;
    }
    toast.success(status === "confirmado" ? "Lançamento confirmado com sucesso!" : "Rascunho salvo com sucesso!");
    onClose();
  };

  const renderLines = (type: "debit" | "credit", lines: EntryFormLine[]) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{type === "debit" ? "DÉBITOS" : "CRÉDITOS"}</Label>
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={line.accountCode} onValueChange={(v) => updateLine(type, i, "accountCode", v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Buscar conta..." />
            </SelectTrigger>
            <SelectContent>
              {flatAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  <span className="font-mono text-xs mr-2">{acc.code}</span> {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="R$ 0,00"
            value={line.amount}
            onChange={(e) => updateLine(type, i, "amount", e.target.value)}
            className="w-36 font-data text-right"
          />
          {lines.length > 1 && (
            <button onClick={() => removeLine(type, i)} className="p-1 rounded hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => addLine(type)} className="gap-1 text-xs">
        <Plus className="w-3 h-3" /> Adicionar linha de {type === "debit" ? "débito" : "crédito"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Documento</Label>
          <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="NF 4821" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Histórico</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do lançamento" />
      </div>

      {renderLines("debit", debitLines)}
      {renderLines("credit", creditLines)}

      {/* Totals */}
      <div className={`rounded-lg p-4 space-y-1 ${isBalanced ? "bg-emerald-500/10 border border-emerald-500/30" : totalDebits > 0 || totalCredits > 0 ? "bg-destructive/10 border border-destructive/30" : "bg-muted/50 border border-border"}`}>
        <div className="flex justify-between text-sm font-data">
          <span>Total Débitos:</span>
          <span className="font-semibold">{formatCurrency(totalDebits)}</span>
        </div>
        <div className="flex justify-between text-sm font-data">
          <span>Total Créditos:</span>
          <span className="font-semibold">{formatCurrency(totalCredits)}</span>
        </div>
        <div className="flex justify-between text-sm font-data pt-1 border-t border-border">
          <span>Diferença:</span>
          <span className={`font-semibold ${isBalanced ? "text-emerald-400" : diff !== 0 ? "text-destructive" : ""}`}>
            {formatCurrency(Math.abs(diff))} — {isBalanced ? "Lançamento EQUILIBRADO ✅" : diff !== 0 ? `Lançamento DESEQUILIBRADO ❌` : ""}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleSave("rascunho")}>Salvar rascunho</Button>
        <Button onClick={() => handleSave("confirmado")} disabled={!isBalanced} className="gap-1">
          <Check className="w-4 h-4" /> Confirmar lançamento
        </Button>
      </div>
    </div>
  );
}

export default function DiarioContabil() {
  const [entries] = useState<JournalEntry[]>(journalEntriesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch = !searchTerm ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.lines.some((l) => l.accountName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "todos" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [entries, searchTerm, statusFilter]);

  const totalValue = entries.reduce((s, e) => s + e.lines.filter((l) => l.type === "debito").reduce((a, l) => a + l.amount, 0), 0);
  const confirmedCount = entries.filter((e) => e.status === "confirmado").length;
  const draftCount = entries.filter((e) => e.status === "rascunho").length;
  const reversedCount = entries.filter((e) => e.status === "estornado").length;

  const handleReverse = (entry: JournalEntry) => {
    toast.success(`Estorno do lançamento ${entry.id} criado com sucesso`);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Diário Contábil</h1>
          <p className="text-sm text-muted-foreground font-data mt-1">
            Lançamentos por partidas dobradas — {entries.length} registros
          </p>
        </div>
        <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Lançamento Contábil</DialogTitle>
            </DialogHeader>
            <NewEntryForm onClose={() => setNewEntryOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valor Total Movimentado", value: formatCurrency(totalValue), color: "text-primary" },
          { label: "Confirmados", value: confirmedCount, color: "text-emerald-400" },
          { label: "Rascunhos", value: draftCount, color: "text-amber-400" },
          { label: "Estornados", value: reversedCount, color: "text-rose-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className={`text-xl font-bold font-data ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por histórico, documento ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="confirmado">Confirmados</SelectItem>
                <SelectItem value="rascunho">Rascunhos</SelectItem>
                <SelectItem value="estornado">Estornados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-24">Data</TableHead>
                  <TableHead className="w-28">Lote</TableHead>
                  <TableHead className="w-28">Documento</TableHead>
                  <TableHead>Histórico</TableHead>
                  <TableHead>Conta Débito</TableHead>
                  <TableHead>Conta Crédito</TableHead>
                  <TableHead className="text-right w-32">Valor</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => {
                  const debitLines = entry.lines.filter((l) => l.type === "debito");
                  const creditLines = entry.lines.filter((l) => l.type === "credito");
                  const totalDebit = debitLines.reduce((s, l) => s + l.amount, 0);

                  return (
                    <TableRow key={entry.id} className={`hover:bg-muted/30 ${entry.status === "estornado" ? "opacity-60" : ""}`}>
                      <TableCell className="font-data text-xs">{formatDate(entry.date)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{entry.lot}</TableCell>
                      <TableCell className="font-data text-xs">{entry.document}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {entry.description}
                        {entry.reversalOf && (
                          <span className="text-xs text-muted-foreground ml-1">(ref: {entry.reversalOf})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {debitLines.map((l, i) => (
                          <div key={i} className="font-mono">
                            <span className="text-muted-foreground">{l.accountCode}</span>{" "}
                            <span className="truncate">{l.accountName}</span>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs">
                        {creditLines.map((l, i) => (
                          <div key={i} className="font-mono">
                            <span className="text-muted-foreground">{l.accountCode}</span>{" "}
                            <span className="truncate">{l.accountName}</span>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right font-data font-semibold text-sm">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusConfig[entry.status].className}`}>
                          {statusConfig[entry.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.status === "confirmado" && (
                          <Button variant="ghost" size="sm" onClick={() => handleReverse(entry)} className="h-7 w-7 p-0" title="Estornar">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-right font-data">
            Exibindo {filtered.length} de {entries.length} lançamentos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
