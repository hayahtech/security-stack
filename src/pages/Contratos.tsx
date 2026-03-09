import { useState, useMemo } from "react";
import { FileText, AlertTriangle, AlertCircle, CheckCircle2, Calendar, TrendingUp, Calculator, Building2, Users, Search, X, ChevronRight, Clock, FileCheck, DollarSign, Percent, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { clientContracts, supplierContracts, calculateClientContractsKPIs, calculateSupplierContractsKPIs, type Contract, type ContractStatus } from "@/mock/contractsData";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const statusConfig: Record<ContractStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ativo: { label: "Ativo", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  vence_em_breve: { label: "Vence em breve", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle },
  em_andamento: { label: "Em andamento", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: Clock },
  encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground border-muted", icon: FileCheck },
  negociacao: { label: "Em negociação", className: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: Users },
};

function AdjustmentCalculator() {
  const [currentValue, setCurrentValue] = useState("28400");
  const [index, setIndex] = useState("IPCA");
  const [percent, setPercent] = useState("4.83");

  const newValue = parseFloat(currentValue.replace(/\./g, "").replace(",", ".")) || 0;
  const percentNum = parseFloat(percent.replace(",", ".")) || 0;
  const adjustedValue = newValue * (1 + percentNum / 100);
  const monthlyImpact = adjustedValue - newValue;
  const annualImpact = monthlyImpact * 12;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Calculadora de Impacto de Reajuste
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Valor Atual</Label>
            <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Índice</Label>
            <Select value={index} onValueChange={setIndex}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="IGP-M">IGP-M</SelectItem>
                <SelectItem value="INCC">INCC</SelectItem>
                <SelectItem value="ANS">ANS</SelectItem>
                <SelectItem value="fixo">Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Percentual (%)</Label>
            <Input value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Novo Valor</Label>
            <div className="h-9 px-3 py-2 rounded-md bg-primary/10 border border-primary/30 text-sm font-semibold text-primary">
              {formatCurrency(adjustedValue)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-xs">
          <span className="text-muted-foreground">Impacto mensal: <strong className="text-foreground">{formatCurrency(monthlyImpact)}</strong></span>
          <span className="text-muted-foreground">Impacto anual: <strong className="text-foreground">{formatCurrency(annualImpact)}</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractDetailModal({ contract, onClose }: { contract: Contract | null; onClose: () => void }) {
  if (!contract) return null;

  return (
    <Dialog open={!!contract} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            {contract.company}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusConfig[contract.status].className}>
              {statusConfig[contract.status].label}
            </Badge>
            <span className="text-sm text-muted-foreground">CNPJ: {contract.cnpj}</span>
          </div>

          {/* General data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Objeto do Contrato</Label>
                <p className="text-sm font-medium">{contract.object}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor</Label>
                <p className="text-lg font-bold text-primary">
                  {contract.type === "projeto" 
                    ? `${formatCurrency(contract.totalValue || 0)} (total)` 
                    : `${formatCurrency(contract.monthlyValue)}/mês`
                  }
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <p className="text-sm">{contract.paymentMethod}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Vigência</Label>
                <p className="text-sm">{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reajuste</Label>
                <p className="text-sm">
                  {contract.adjustmentIndex !== "nenhum" 
                    ? `${contract.adjustmentIndex}${contract.adjustmentPercent ? ` (${contract.adjustmentPercent}%)` : ""}`
                    : "Sem reajuste"
                  }
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Multa por Rescisão</Label>
                <p className="text-sm">{contract.cancellationFee} meses de aviso</p>
              </div>
              {contract.sla && (
                <div>
                  <Label className="text-xs text-muted-foreground">SLA</Label>
                  <p className="text-sm">{contract.sla}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress for projects */}
          {contract.type === "projeto" && contract.currentStep && contract.totalSteps && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Progresso do Projeto</Label>
              <Progress value={(contract.currentStep / contract.totalSteps) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">Etapa {contract.currentStep} de {contract.totalSteps}</p>
            </div>
          )}

          {/* Payment history */}
          {contract.payments.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Histórico de Pagamentos</Label>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{formatDate(p.date)}</TableCell>
                        <TableCell className="text-sm font-data">{formatCurrency(p.value)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            p.status === "pago" ? "bg-emerald-500/20 text-emerald-400" :
                            p.status === "pendente" ? "bg-amber-500/20 text-amber-400" :
                            "bg-destructive/20 text-destructive"
                          }>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Documents */}
          {contract.documents.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Documentos</Label>
              <div className="flex flex-wrap gap-2">
                {contract.documents.map((doc, i) => (
                  <Badge key={i} variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                    <FileText className="w-3 h-3" /> {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Timeline</Label>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted">📝 Criação</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted">✍️ Assinatura</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary font-semibold">▶️ Início {formatDate(contract.startDate)}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted">🏁 Término {formatDate(contract.endDate)}</span>
            </div>
          </div>

          {/* Alerts config */}
          {contract.alerts.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Alertas Configurados</Label>
              <div className="flex gap-2">
                {contract.alerts.map((a, i) => (
                  <Badge key={i} variant="outline" className={a.enabled ? "bg-primary/10" : "opacity-50"}>
                    {a.days}d antes
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContractsTable({ contracts, onSelect }: { contracts: Contract[]; onSelect: (c: Contract) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm) return contracts;
    return contracts.filter(c => 
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.object.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contracts, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por empresa ou objeto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor Mensal</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Reajuste</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próxima Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(contract => (
              <TableRow
                key={contract.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onSelect(contract)}
              >
                <TableCell className="font-medium">{contract.company}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">{contract.type}</Badge>
                </TableCell>
                <TableCell className="text-right font-data">
                  {contract.type === "projeto" 
                    ? formatCurrency(contract.totalValue || 0)
                    : formatCurrency(contract.monthlyValue)
                  }
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(contract.startDate)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(contract.endDate)}</TableCell>
                <TableCell className="text-sm">{contract.adjustmentIndex}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${statusConfig[contract.status].className}`}>
                    {statusConfig[contract.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm max-w-[150px] truncate">
                  {contract.nextAction || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground text-right">{filtered.length} contratos</p>
    </div>
  );
}

export default function Contratos() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState("clientes");

  const clientKPIs = useMemo(() => calculateClientContractsKPIs(), []);
  const supplierKPIs = useMemo(() => calculateSupplierContractsKPIs(), []);

  const urgentAlerts = clientContracts.filter(c => c.status === "vence_em_breve" && (c.daysToExpire || 999) <= 30);
  const warningAlerts = clientContracts.filter(c => c.status === "vence_em_breve" && (c.daysToExpire || 999) > 30);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Gestão de Contratos</h1>
        <p className="text-sm text-muted-foreground font-data mt-1">
          Controle de obrigações jurídicas vinculadas ao fluxo financeiro
        </p>
      </div>

      {/* Alerts */}
      {(urgentAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="space-y-2">
          {urgentAlerts.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <span className="text-sm">
                🔴 <strong>{c.company}</strong> — contrato {formatCurrency(c.monthlyValue)}/mês vence em <strong>{c.daysToExpire} dias</strong>. Contato necessário.
              </span>
              <Button size="sm" variant="outline" className="ml-auto">Contatar</Button>
            </div>
          ))}
          {warningAlerts.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-sm">
                🟡 <strong>{clientKPIs.expiring90dCount}</strong> contratos vencem nos próximos 90 dias — {formatCurrency(clientKPIs.expiring90dValue)} em receita recorrente em risco
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm">
              🟢 Reajuste IPCA de Jan/2025 aplicado automaticamente em 12 contratos (+4,83%)
            </span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="w-4 h-4" /> Contratos de Clientes
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="gap-2">
            <Building2 className="w-4 h-4" /> Contratos de Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-6 mt-6">
          {/* Client KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "MRR Contratado", value: formatCurrency(clientKPIs.mrr), icon: DollarSign, color: "text-primary" },
              { label: "ARR Contratado", value: formatCurrency(clientKPIs.arr), icon: TrendingUp, color: "text-emerald-400" },
              { label: "Backlog Total", value: formatCurrency(clientKPIs.backlog), icon: FileText, color: "text-cyan-400" },
              { label: "Vencendo em 90d", value: `${clientKPIs.expiring90dCount} (${formatCurrency(clientKPIs.expiring90dValue)})`, icon: AlertTriangle, color: "text-amber-400" },
              { label: "Taxa de Renovação", value: `${clientKPIs.renewalRate}%`, icon: Percent, color: "text-violet-400" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className={`text-lg font-bold font-data ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <ContractsTable contracts={clientContracts} onSelect={setSelectedContract} />
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-6 mt-6">
          {/* Supplier KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Comprometimento Mensal", value: formatCurrency(supplierKPIs.monthlyCommitment), icon: DollarSign, color: "text-destructive" },
              { label: "Comprometimento Anual", value: formatCurrency(supplierKPIs.annualCommitment), icon: Calendar, color: "text-amber-400" },
              { label: "Total de Contratos", value: supplierKPIs.totalContracts, icon: FileText, color: "text-muted-foreground" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className={`text-lg font-bold font-data ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Supplier alert */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span className="text-sm">
              ⚠️ Reajuste do plano de saúde (ANS) previsto para Mai/25 — estimativa +12,5% = +{formatCurrency(11150)}/mês
            </span>
          </div>

          <ContractsTable contracts={supplierContracts} onSelect={setSelectedContract} />
        </TabsContent>
      </Tabs>

      {/* Adjustment Calculator */}
      <AdjustmentCalculator />

      {/* Detail modal */}
      <ContractDetailModal contract={selectedContract} onClose={() => setSelectedContract(null)} />
    </div>
  );
}
