import { useState } from "react";
import {
  GitCompare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wand2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  reconciliationData,
  reconciliationSummary,
  ReconciliationItem,
} from "@/mock/cashFlowData";
import { formatCurrency } from "@/mock/financialData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ConciliacaoBancaria() {
  const [data, setData] = useState<ReconciliationItem[]>(reconciliationData);
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = data.filter((item) => {
    if (bankFilter !== "all" && item.bank !== bankFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  const summary = {
    reconciled: filteredData.filter((d) => d.status === "reconciled").length,
    pending: filteredData.filter((d) => d.status === "pending").length,
    divergent: filteredData.filter((d) => d.status === "divergent").length,
    totalDifference: filteredData.reduce((acc, item) => {
      if (item.status === "divergent") {
        return acc + Math.abs(item.bankValue - item.accountingValue);
      }
      return acc;
    }, 0),
  };

  const handleAutoReconcile = () => {
    const newData = data.map((item) => {
      if (item.status === "pending" && item.bankValue === item.accountingValue) {
        return { ...item, status: "reconciled" as const };
      }
      if (item.status === "pending" && item.accountingValue === 0) {
        // Simula criação de lançamento contábil
        return { ...item, accountingValue: item.bankValue, status: "reconciled" as const };
      }
      return item;
    });
    setData(newData);
    toast.success("Conciliação automática realizada!", {
      description: `${newData.filter((d) => d.status === "reconciled").length - summary.reconciled} itens conciliados.`,
    });
  };

  const getStatusBadge = (status: ReconciliationItem["status"]) => {
    switch (status) {
      case "reconciled":
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Conciliado
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "divergent":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            Divergente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Conciliação Bancária
          </h1>
          <p className="text-muted-foreground font-data">
            Comparativo entre extrato bancário e registros contábeis
          </p>
        </div>

        <Button
          onClick={handleAutoReconcile}
          className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          <Wand2 className="h-4 w-4" />
          Conciliar Automaticamente
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-success/30 bg-success/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Conciliados</span>
          </div>
          <p className="text-3xl font-display font-bold text-success">
            {summary.reconciled}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Pendentes</span>
          </div>
          <p className="text-3xl font-display font-bold text-yellow-500">
            {summary.pending}
          </p>
        </div>

        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Divergentes</span>
          </div>
          <p className="text-3xl font-display font-bold text-destructive">
            {summary.divergent}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Diferença Apurada</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {formatCurrency(summary.totalDifference)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/20 border border-border">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Banco:</span>
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[150px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Itaú">Itaú</SelectItem>
              <SelectItem value="BB">Banco do Brasil</SelectItem>
              <SelectItem value="Caixa">Caixa</SelectItem>
              <SelectItem value="CDB">CDB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="reconciled">Conciliado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="divergent">Divergente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-display">Data</TableHead>
                <TableHead className="font-display">Descrição</TableHead>
                <TableHead className="font-display">Banco</TableHead>
                <TableHead className="font-display text-right">
                  <div className="flex flex-col items-end">
                    <span>Extrato Bancário</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Valor no banco
                    </span>
                  </div>
                </TableHead>
                <TableHead className="font-display text-right">
                  <div className="flex flex-col items-end">
                    <span>Registro Contábil</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      Valor na contabilidade
                    </span>
                  </div>
                </TableHead>
                <TableHead className="font-display text-right">Diferença</TableHead>
                <TableHead className="font-display text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const difference = item.bankValue - item.accountingValue;
                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "hover:bg-muted/20 transition-colors",
                      item.status === "divergent" && "bg-destructive/5",
                      item.status === "pending" && "bg-yellow-500/5"
                    )}
                  >
                    <TableCell className="font-data text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-data">{item.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-data">
                        {item.bank}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-data tabular-nums",
                        item.bankValue >= 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {item.bankValue >= 0
                        ? formatCurrency(item.bankValue)
                        : `(${formatCurrency(Math.abs(item.bankValue))})`}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-data tabular-nums",
                        item.accountingValue === 0
                          ? "text-muted-foreground italic"
                          : item.accountingValue >= 0
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {item.accountingValue === 0
                        ? "—"
                        : item.accountingValue >= 0
                        ? formatCurrency(item.accountingValue)
                        : `(${formatCurrency(Math.abs(item.accountingValue))})`}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-data tabular-nums font-medium",
                        difference === 0
                          ? "text-muted-foreground"
                          : "text-destructive"
                      )}
                    >
                      {difference === 0
                        ? "—"
                        : formatCurrency(Math.abs(difference))}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-data p-4 rounded-lg bg-muted/20 border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span>Conciliado: Valores idênticos em ambas as fontes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Pendente: Lançamento sem correspondência contábil</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span>Divergente: Valores diferentes entre as fontes</span>
        </div>
      </div>
    </div>
  );
}
