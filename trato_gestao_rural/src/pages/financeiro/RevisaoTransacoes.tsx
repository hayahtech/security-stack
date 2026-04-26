import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, HelpCircle, ArrowLeftRight, Filter,
  ChevronDown, CheckCheck, Eye, Search, ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { mockImportedTransactions, ImportedTransaction, mockConnectedBanks } from "@/data/open-finance-mock";
import { categories } from "@/data/financeiro-mock";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

type StatusFilter = "all" | "pending_review" | "auto_categorized" | "confirmed" | "ignored";

export default function RevisaoTransacoes() {
  const [transactions, setTransactions] = useState<ImportedTransaction[]>(mockImportedTransactions);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || t.originalDescription.toLowerCase().includes(q));
    }
    return list;
  }, [transactions, statusFilter, search]);

  const pendingCount = transactions.filter((t) => t.status === "pending_review").length;
  const autoCount = transactions.filter((t) => t.status === "auto_categorized").length;
  const confirmedCount = transactions.filter((t) => t.status === "confirmed").length;

  const handleConfirm = (id: string, categoryId?: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "confirmed" as const, confirmedCategoryId: categoryId || t.suggestedCategoryId }
          : t
      )
    );
    toast({ title: "Transação confirmada" });
  };

  const handleIgnore = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "ignored" as const } : t))
    );
    toast({ title: "Transação ignorada" });
  };

  const handleChangeCategory = (id: string, categoryId: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, suggestedCategoryId: categoryId, status: "confirmed" as const, confirmedCategoryId: categoryId }
          : t
      )
    );
    toast({ title: "Categoria atualizada e confirmada" });
  };

  const handleConfirmAllSuggested = () => {
    const count = transactions.filter((t) => t.status === "auto_categorized" && t.suggestedCategoryId).length;
    setTransactions((prev) =>
      prev.map((t) =>
        t.status === "auto_categorized" && t.suggestedCategoryId
          ? { ...t, status: "confirmed" as const, confirmedCategoryId: t.suggestedCategoryId }
          : t
      )
    );
    toast({ title: `${count} transações confirmadas em lote` });
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return null;
    return categories.find((c) => c.id === id)?.name ?? id;
  };

  const getBankName = (bankId: string) => {
    return mockConnectedBanks.find((b) => b.id === bankId)?.connectorName ?? bankId;
  };

  const statusBadge = (status: ImportedTransaction["status"]) => {
    switch (status) {
      case "pending_review":
        return <Badge variant="secondary" className="gap-1 text-xs"><HelpCircle className="h-3 w-3" /> Aguardando revisão</Badge>;
      case "auto_categorized":
        return <Badge className="gap-1 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20"><CheckCircle2 className="h-3 w-3" /> Auto-categorizado</Badge>;
      case "confirmed":
        return <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3" /> Confirmado</Badge>;
      case "ignored":
        return <Badge variant="outline" className="gap-1 text-xs"><XCircle className="h-3 w-3" /> Ignorado</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Revisão de Transações Importadas</h1>
            <p className="text-sm text-muted-foreground mt-1">Categorize e confirme as transações importadas via Open Finance</p>
          </div>
          {autoCount > 0 && (
            <Button size="sm" className="gap-1" onClick={handleConfirmAllSuggested}>
              <CheckCheck className="h-4 w-4" /> Confirmar todas sugeridas ({autoCount})
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-amber-500/10 text-amber-600 rounded-lg p-2"><HelpCircle className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Aguardando revisão</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 text-blue-500 rounded-lg p-2"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{autoCount}</p>
                <p className="text-xs text-muted-foreground">Auto-categorizados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 text-primary rounded-lg p-2"><CheckCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conciliation Alert */}
        {transactions.some((t) => t.matchedPayableId) && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <ArrowLeftRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Conciliação automática disponível</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Foram encontradas {transactions.filter((t) => t.matchedPayableId).length} transações que parecem corresponder a contas a pagar pendentes.
                  Confirme abaixo para conciliar automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[200px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending_review">Aguardando revisão</SelectItem>
              <SelectItem value="auto_categorized">Auto-categorizados</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="ignored">Ignorados</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Categoria Sugerida</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((txn) => (
                    <TableRow key={txn.id} className="group">
                      <TableCell className="text-sm whitespace-nowrap">{format(new Date(txn.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{txn.description}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">{txn.originalDescription}</p>
                          {txn.matchedPayableId && (
                            <Badge variant="outline" className="mt-1 gap-1 text-xs text-primary border-primary/30">
                              <ArrowLeftRight className="h-3 w-3" /> Conciliação sugerida
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getBankName(txn.connectedBankId)}</TableCell>
                      <TableCell className={`text-right font-medium whitespace-nowrap ${txn.type === "credit" ? "text-primary" : "text-destructive"}`}>
                        <span className="flex items-center justify-end gap-1">
                          {txn.type === "credit" ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                          {txn.type === "credit" ? "+" : "-"} {fmt(txn.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {txn.status === "confirmed" || txn.status === "ignored" ? (
                          <span className="text-sm">{getCategoryName(txn.confirmedCategoryId || txn.suggestedCategoryId) || "—"}</span>
                        ) : (
                          <Select
                            value={txn.suggestedCategoryId || "none"}
                            onValueChange={(v) => v !== "none" && handleChangeCategory(txn.id, v)}
                          >
                            <SelectTrigger className="h-8 text-xs w-[160px]">
                              <SelectValue placeholder="Sem categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Sem categoria</SelectItem>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(txn.status)}</TableCell>
                      <TableCell>
                        {(txn.status === "pending_review" || txn.status === "auto_categorized") && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary hover:text-primary"
                              title="Confirmar"
                              onClick={() => handleConfirm(txn.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Ignorar"
                              onClick={() => handleIgnore(txn.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">{filtered.length} transações</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
