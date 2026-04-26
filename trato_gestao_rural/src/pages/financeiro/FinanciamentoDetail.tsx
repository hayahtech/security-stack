import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ChevronLeft, ChevronRight, Edit, CreditCard, MoreHorizontal, Landmark,
  Tractor, Home, Car, Sprout, Building2, Download, Upload, FileText,
  TrendingDown, Eye, Trash2, Calendar, ArrowDownCircle, RefreshCw,
  CheckCircle2, Clock, AlertCircle, CircleDot,
} from "lucide-react";
import {
  mockFinanciamentos, Financiamento, FinanciamentoTipo, Parcela,
  tipoLabels, tipoColors, statusLabels, statusColors, calcTaxaMensal,
  gerarTabelaSAC, gerarTabelaPRICE,
} from "@/data/financiamentos-mock";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

function getIcon(tipo: FinanciamentoTipo) {
  if (["maquina_equipamento", "credito_rural"].includes(tipo)) return Tractor;
  if (["imovel_residencial", "imovel_rural"].includes(tipo)) return Home;
  if (["veiculo", "veiculo_comercial"].includes(tipo)) return Car;
  if (tipo === "capital_giro" || tipo === "leasing") return Building2;
  if (["consorcio", "consorcio_empresarial"].includes(tipo)) return Landmark;
  return Sprout;
}

const garantiaLabels: Record<string, string> = {
  alienacao: "Alienação Fiduciária", hipoteca: "Hipoteca",
  penhor_rural: "Penhor Rural", aval: "Aval", sem_garantia: "Sem Garantia",
};
const indiceLabels: Record<string, string> = {
  sem: "Sem correção", tjlp: "TJLP", tlp: "TLP", selic: "SELIC",
  ipca: "IPCA", incc: "INCC", tr: "TR", pre_fixado: "Pré-fixado",
};

// ── Tab: Resumo ──
function TabResumo({ fin }: { fin: Financiamento }) {
  const parcelasPagas = fin.parcelas.filter(p => p.status === "pago");
  const totalJurosPagos = parcelasPagas.reduce((s, p) => s + p.juros, 0);
  const totalAmortPago = parcelasPagas.reduce((s, p) => s + p.amortizacao, 0);
  const proximaParcela = fin.parcelas.find(p => p.status === "pendente" || p.status === "futuro");
  const ultimaParcela = fin.parcelas[fin.parcelas.length - 1];
  const pctQuitado = fin.valorFinanciado > 0
    ? ((fin.valorFinanciado - fin.saldoDevedor) / fin.valorFinanciado) * 100 : 0;

  // Chart data
  const currentParcelaIdx = parcelasPagas.length;
  const chartData = fin.parcelas.map((p, i) => ({
    parcela: p.numero,
    saldoDevedor: p.saldoDevedor,
    amortizado: fin.valorFinanciado - p.saldoDevedor,
    isCurrent: i === currentParcelaIdx,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Contract data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Dados do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Instituição", fin.instituicao],
              ["Contrato nº", fin.numeroContrato],
              ["Data contratação", fmtDate(fin.dataContratacao)],
              ["Valor original", fmt(fin.valorFinanciado)],
              ["Entrada", fmt(fin.valorEntrada)],
              ["Taxa de juros", `${fmtNum(fin.taxaJuros)}% ${fin.taxaTipo === "mensal" ? "a.m." : "a.a."}`],
              ["Índice de correção", indiceLabels[fin.indiceCorrecao]],
              ["Sistema", fin.sistemaAmortizacao.toUpperCase()],
              ["Prazo total", `${fin.prazoMeses} meses`],
              ["Garantia", garantiaLabels[fin.tipoGarantia]],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            {fin.programaGov && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Programa</span>
                <span className="font-medium">{fin.programaGov.toUpperCase()}</span>
              </div>
            )}
            {fin.possuiSeguro && (
              <>
                <Separator />
                <p className="font-medium text-muted-foreground">Seguro Vinculado</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seguradora</span>
                  <span className="font-medium">{fin.seguradora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor/parcela</span>
                  <span className="font-medium">{fmt(fin.seguroValorParcela || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próx. vencimento</span>
                  <span className="font-medium">{fin.seguroVencimento ? fmtDate(fin.seguroVencimento) : "—"}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Current situation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Situação Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Saldo devedor atual", fmt(fin.saldoDevedor)],
              ["Parcelas pagas", `${parcelasPagas.length} / ${fin.parcelas.length}`],
              ["Total já pago", fmt(fin.totalPago)],
              ["Amortização paga", fmt(totalAmortPago)],
              ["Juros pagos", fmt(totalJurosPagos)],
              ["Próxima parcela", proximaParcela ? `${fmtDate(proximaParcela.vencimento)} — ${fmt(proximaParcela.total)}` : "—"],
              ["Previsão de quitação", ultimaParcela ? fmtDate(ultimaParcela.vencimento) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            {fin.possuiRebate && (
              <>
                <Separator />
                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-medium text-primary">🎯 Rebate disponível</p>
                  <p className="text-xs text-muted-foreground mt-1">{fin.rebatePercentual}% — {fin.rebateCondicao}</p>
                </div>
              </>
            )}
            {fin.possuiCarencia && (
              <>
                <Separator />
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="font-medium">🕐 Período de carência</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmtDate(fin.carenciaInicio!)} a {fmtDate(fin.carenciaFim!)} — {
                      fin.carenciaTipo === "juros" ? "Paga só juros" :
                      fin.carenciaTipo === "juros_correcao" ? "Juros + Correção" : "Não paga nada"
                    }
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolution chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Evolução do Financiamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="parcela" tick={{ fontSize: 10 }} label={{ value: "Parcela", position: "insideBottom", offset: -5, fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <RechartsTooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="amortizado" stackId="1" fill="hsl(149, 62%, 26%)" fillOpacity={0.3} stroke="hsl(149, 62%, 26%)" name="Amortizado" />
                <Area type="monotone" dataKey="saldoDevedor" stackId="1" fill="hsl(213, 78%, 37%)" fillOpacity={0.2} stroke="hsl(213, 78%, 37%)" name="Saldo Devedor" />
                {currentParcelaIdx > 0 && currentParcelaIdx < chartData.length && (
                  <ReferenceDot
                    x={chartData[currentParcelaIdx]?.parcela}
                    y={chartData[currentParcelaIdx]?.saldoDevedor + chartData[currentParcelaIdx]?.amortizado}
                    r={6} fill="hsl(37, 100%, 50%)" stroke="hsl(37, 100%, 50%)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {currentParcelaIdx > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-1">
              🟠 Você está aqui — Parcela {currentParcelaIdx} de {fin.parcelas.length}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Parcelas ──
function TabParcelas({ fin }: { fin: Financiamento }) {
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [payModal, setPayModal] = useState<Parcela | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payValue, setPayValue] = useState(0);
  const [payMora, setPayMora] = useState(0);
  const [payMulta, setPayMulta] = useState(0);
  const [payDesconto, setPayDesconto] = useState(0);
  const [payInstrument, setPayInstrument] = useState("pi-1");
  const [payObs, setPayObs] = useState("");

  const perPage = 12;
  const displayed = showAll ? fin.parcelas : fin.parcelas.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(fin.parcelas.length / perPage);

  const openPay = (p: Parcela) => {
    setPayModal(p);
    setPayValue(p.total);
    setPayMora(0); setPayMulta(0); setPayDesconto(0);
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayObs("");
  };

  const statusBadge = (s: Parcela["status"]) => {
    const map = {
      pago: { cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", label: "Pago", icon: CheckCircle2 },
      vencido: { cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Vencido", icon: AlertCircle },
      pendente: { cls: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", label: "Hoje", icon: Clock },
      futuro: { cls: "bg-muted text-muted-foreground", label: "Futura", icon: CircleDot },
    };
    const m = map[s];
    return (
      <Badge variant="outline" className={m.cls + " border-0 gap-1 text-xs"}>
        <m.icon className="h-3 w-3" /> {m.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {fin.parcelas.filter(p => p.status === "pago").length} de {fin.parcelas.length} parcelas pagas
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Paginar" : "Ver todas"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> Excel</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Nº</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Saldo Ant.</TableHead>
                  <TableHead className="text-right">Amortização</TableHead>
                  <TableHead className="text-right">Juros</TableHead>
                  <TableHead className="text-right">Correção</TableHead>
                  <TableHead className="text-right">Seguro</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((p, i) => {
                  const saldoAnterior = p.numero === 1 ? fin.valorFinanciado : fin.parcelas[p.numero - 2]?.saldoDevedor ?? 0;
                  return (
                    <TableRow key={p.numero} className={
                      p.status === "pendente" ? "bg-primary/5" :
                      p.status === "vencido" ? "bg-destructive/5" : ""
                    }>
                      <TableCell className="font-medium">{p.numero}</TableCell>
                      <TableCell>{fmtDate(p.vencimento)}</TableCell>
                      <TableCell className="text-right">{fmt(saldoAnterior)}</TableCell>
                      <TableCell className="text-right">{fmt(p.amortizacao)}</TableCell>
                      <TableCell className="text-right">{fmt(p.juros)}</TableCell>
                      <TableCell className="text-right">{fmt(p.correcao)}</TableCell>
                      <TableCell className="text-right">{fmt(p.seguro)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(p.total)}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell>
                        {p.status !== "pago" ? (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openPay(p)}>
                            <CreditCard className="h-3 w-3" /> Pagar
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" /> Ver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          {!showAll && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment modal */}
      <Dialog open={!!payModal} onOpenChange={() => setPayModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento — Parcela {payModal?.numero}</DialogTitle>
          </DialogHeader>
          {payModal && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Vencimento</span><span>{fmtDate(payModal.vencimento)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor da parcela</span><span className="font-medium">{fmt(payModal.total)}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data do pagamento</Label>
                  <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor pago</Label>
                  <Input type="number" step="0.01" value={payValue} onChange={e => setPayValue(+e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Juros de mora</Label>
                  <Input type="number" step="0.01" value={payMora} onChange={e => setPayMora(+e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Multa</Label>
                  <Input type="number" step="0.01" value={payMulta} onChange={e => setPayMulta(+e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Desconto/Rebate</Label>
                  <Input type="number" step="0.01" value={payDesconto} onChange={e => setPayDesconto(+e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Conta debitada</Label>
                  <Select value={payInstrument} onValueChange={setPayInstrument}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pi-1">Conta Corrente BB</SelectItem>
                      <SelectItem value="pi-2">Conta Corrente Caixa</SelectItem>
                      <SelectItem value="pi-3">Caixa da Fazenda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Comprovante (opcional)</Label>
                <Input type="file" accept=".pdf,.jpg,.png" />
              </div>
              <div className="space-y-1.5">
                <Label>Observação</Label>
                <Textarea value={payObs} onChange={e => setPayObs(e.target.value)} rows={2} />
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                <p className="font-medium">Total a registrar: {fmt(payValue + payMora + payMulta - payDesconto)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPayModal(null)}>Cancelar</Button>
                <Button onClick={() => setPayModal(null)} className="gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Confirmar Pagamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab: Amortização Antecipada ──
function TabAmortizacao({ fin }: { fin: Financiamento }) {
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [modalidade, setModalidade] = useState<"reduzir_valor" | "reduzir_prazo">("reduzir_prazo");
  const [conta, setConta] = useState("pi-1");
  const [simulado, setSimulado] = useState(false);

  const parcelasRestantes = fin.parcelas.filter(p => p.status !== "pago").length;
  const proximaParcela = fin.parcelas.find(p => p.status === "pendente" || p.status === "futuro");
  const taxaMensal = calcTaxaMensal(fin.taxaJuros, fin.taxaTipo);

  const novoSaldo = Math.max(0, fin.saldoDevedor - valor);
  const novasParcelas = useMemo(() => {
    if (!simulado || valor <= 0 || !proximaParcela) return [];
    if (modalidade === "reduzir_prazo") {
      return gerarTabelaSAC(novoSaldo, taxaMensal, Math.max(1, Math.ceil(novoSaldo / (proximaParcela.amortizacao || 1))), proximaParcela.vencimento, fin.seguroValorParcela || 0);
    } else {
      return gerarTabelaSAC(novoSaldo, taxaMensal, parcelasRestantes, proximaParcela.vencimento, fin.seguroValorParcela || 0);
    }
  }, [simulado, valor, modalidade, novoSaldo, taxaMensal, parcelasRestantes, proximaParcela]);

  const economiaJuros = useMemo(() => {
    const jurosOriginais = fin.parcelas.filter(p => p.status !== "pago").reduce((s, p) => s + p.juros, 0);
    const jurosNovos = novasParcelas.reduce((s, p) => s + p.juros, 0);
    return jurosOriginais - jurosNovos;
  }, [fin.parcelas, novasParcelas]);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-primary" /> Amortização Antecipada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Saldo devedor atual</span><span className="font-semibold">{fmt(fin.saldoDevedor)}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Parcelas restantes</span><span>{parcelasRestantes}</span></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor a amortizar</Label>
              <Input type="number" value={valor || ""} onChange={e => { setValor(+e.target.value); setSimulado(false); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Data do pagamento</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Modalidade</Label>
              <Select value={modalidade} onValueChange={v => { setModalidade(v as "reduzir_valor" | "reduzir_prazo"); setSimulado(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reduzir_prazo">Reduzir prazo (mantém valor)</SelectItem>
                  <SelectItem value="reduzir_valor">Reduzir valor (mantém prazo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta debitada</Label>
              <Select value={conta} onValueChange={setConta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pi-1">Conta Corrente BB</SelectItem>
                  <SelectItem value="pi-2">Conta Corrente Caixa</SelectItem>
                  <SelectItem value="pi-3">Caixa da Fazenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setSimulado(true)} disabled={valor <= 0} className="gap-1">
            <TrendingDown className="h-4 w-4" /> Simular Impacto
          </Button>
        </CardContent>
      </Card>

      {simulado && valor > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resultado da Simulação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "Saldo devedor", antes: fmt(fin.saldoDevedor), depois: fmt(novoSaldo) },
                { l: "Parcelas restantes", antes: String(parcelasRestantes), depois: String(novasParcelas.length) },
                { l: "Nova parcela", antes: fmt(proximaParcela?.total || 0), depois: fmt(novasParcelas[0]?.total || 0) },
                { l: "Economia em juros", antes: "", depois: fmt(economiaJuros) },
              ].map(item => (
                <div key={item.l} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{item.l}</p>
                  {item.antes ? (
                    <p className="text-sm"><span className="line-through text-muted-foreground">{item.antes}</span> → <span className="font-semibold text-primary">{item.depois}</span></p>
                  ) : (
                    <p className="text-sm font-semibold text-primary">{item.depois}</p>
                  )}
                </div>
              ))}
            </div>
            {novasParcelas.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Nova data de quitação: <strong>{fmtDate(novasParcelas[novasParcelas.length - 1].vencimento)}</strong>
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSimulado(false)}>Cancelar</Button>
              <Button className="gap-1"><CheckCircle2 className="h-4 w-4" /> Confirmar Amortização</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Renegociação ──
function TabRenegociacao({ fin }: { fin: Financiamento }) {
  const [showForm, setShowForm] = useState(false);
  const mockHistory = [
    {
      data: "2025-09-15", motivo: "Redução de taxa",
      anterior: `Taxa ${fmtNum(fin.taxaJuros + 0.3)}% → ${fmtNum(fin.taxaJuros)}%`,
      responsavel: "Gerente Banco",
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Renegociações
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          {showForm ? "Cancelar" : <><RefreshCw className="h-3 w-3" /> Nova Renegociação</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data da renegociação</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1.5">
                <Label>Motivo</Label>
                <Select defaultValue="reducao_taxa">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reducao_taxa">Redução de taxa</SelectItem>
                    <SelectItem value="extensao_prazo">Extensão de prazo</SelectItem>
                    <SelectItem value="carencia_adicional">Carência adicional</SelectItem>
                    <SelectItem value="portabilidade">Portabilidade de crédito</SelectItem>
                    <SelectItem value="refinanciamento">Refinanciamento</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Novo saldo devedor</Label>
                <Input type="number" defaultValue={fin.saldoDevedor} />
              </div>
              <div className="space-y-1.5">
                <Label>Nova taxa de juros (%)</Label>
                <Input type="number" step="0.01" defaultValue={fin.taxaJuros} />
              </div>
              <div className="space-y-1.5">
                <Label>Novo prazo (meses restantes)</Label>
                <Input type="number" defaultValue={fin.parcelas.filter(p => p.status !== "pago").length} />
              </div>
              <div className="space-y-1.5">
                <Label>Novo sistema de amortização</Label>
                <Select defaultValue={fin.sistemaAmortizacao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sac">SAC</SelectItem>
                    <SelectItem value="price">PRICE</SelectItem>
                    <SelectItem value="americano">Americano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Novas condições especiais</Label>
              <Textarea rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={() => setShowForm(false)} className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Salvar Renegociação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Histórico de Renegociações</CardTitle>
        </CardHeader>
        <CardContent>
          {mockHistory.length > 0 ? (
            <div className="space-y-4">
              {mockHistory.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {i < mockHistory.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">{h.motivo}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(h.data)} • {h.responsavel}</p>
                    <p className="text-xs mt-1">{h.anterior}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma renegociação registrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Documentos ──
function TabDocumentos() {
  const mockDocs = [
    { nome: "Contrato_Financiamento.pdf", tipo: "Contrato", data: "2024-12-20", tamanho: "2.4 MB" },
    { nome: "Apolice_Seguro_2025.pdf", tipo: "Apólice de Seguro", data: "2025-01-15", tamanho: "890 KB" },
    { nome: "Comprovante_Parcela_01.pdf", tipo: "Comprovante", data: "2025-01-15", tamanho: "156 KB" },
    { nome: "Comprovante_Parcela_02.pdf", tipo: "Comprovante", data: "2025-02-15", tamanho: "162 KB" },
    { nome: "Comprovante_Parcela_03.pdf", tipo: "Comprovante", data: "2025-03-15", tamanho: "148 KB" },
  ];

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documentos Vinculados
        </h3>
        <Button size="sm" className="gap-1"><Upload className="h-3 w-3" /> Adicionar Documento</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDocs.map((doc, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.nome}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{doc.tipo}</Badge>
                  </TableCell>
                  <TableCell>{fmtDate(doc.data)}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.tamanho}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──
export default function FinanciamentoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fin = mockFinanciamentos.find(f => f.id === id);

  if (!fin) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Financiamento não encontrado.</p>
        <Button variant="link" onClick={() => navigate("/financeiro/financiamentos")}>Voltar</Button>
      </div>
    );
  }

  const Icon = getIcon(fin.tipo);
  const pctQuitado = fin.valorFinanciado > 0
    ? Math.round(((fin.valorFinanciado - fin.saldoDevedor) / fin.valorFinanciado) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/financeiro/financiamentos")} className="gap-1 -ml-2">
        <ChevronLeft className="h-4 w-4" /> Financiamentos
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{fin.nome}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={tipoColors[fin.tipo] + " border-0 text-xs"}>{tipoLabels[fin.tipo]}</Badge>
              <Badge variant="outline" className={statusColors[fin.status] + " border-0 text-xs"}>{statusLabels[fin.status]}</Badge>
              <span className="text-xs text-muted-foreground">{fin.instituicao}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1"><Edit className="h-3.5 w-3.5" /> Editar</Button>
          <Button size="sm" className="gap-1"><CreditCard className="h-3.5 w-3.5" /> Registrar Pagamento</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2"><ArrowDownCircle className="h-4 w-4" /> Amortização Antecipada</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><RefreshCw className="h-4 w-4" /> Renegociar</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><CheckCircle2 className="h-4 w-4" /> Quitar</DropdownMenuItem>
              <DropdownMenuItem className="gap-2"><Calendar className="h-4 w-4" /> Arquivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={pctQuitado} className="h-3 flex-1" />
        <span className="text-sm font-semibold whitespace-nowrap">{pctQuitado}% quitado</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumo">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          <TabsTrigger value="amortizacao">Amortização Antecipada</TabsTrigger>
          <TabsTrigger value="renegociacao">Renegociação</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo"><TabResumo fin={fin} /></TabsContent>
        <TabsContent value="parcelas"><TabParcelas fin={fin} /></TabsContent>
        <TabsContent value="amortizacao"><TabAmortizacao fin={fin} /></TabsContent>
        <TabsContent value="renegociacao"><TabRenegociacao fin={fin} /></TabsContent>
        <TabsContent value="documentos"><TabDocumentos /></TabsContent>
      </Tabs>
    </div>
  );
}
