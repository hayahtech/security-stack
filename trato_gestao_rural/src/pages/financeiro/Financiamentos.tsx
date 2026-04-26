
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Landmark, Plus, Tractor, Home, Car, Sprout, Building2, Calculator,
  ChevronLeft, ChevronRight, Download, TrendingDown, TrendingUp,
  DollarSign, CalendarDays, Filter, X,
} from "lucide-react";
import {
  mockFinanciamentos, Financiamento, FinanciamentoTipo, FinanciamentoStatus,
  tipoLabels, tipoColors, statusLabels, statusColors, bancos,
  tiposEmpresarial, tiposPessoal, gerarTabela, Parcela,
  SistemaAmortizacao, IndiceCorrecao, TipoGarantia, ProgramaGov,
} from "@/data/financiamentos-mock";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

function getIcon(tipo: FinanciamentoTipo) {
  if (["maquina_equipamento", "credito_rural"].includes(tipo)) return Tractor;
  if (["imovel_residencial", "imovel_rural"].includes(tipo)) return Home;
  if (["veiculo", "veiculo_comercial"].includes(tipo)) return Car;
  if (tipo === "capital_giro" || tipo === "leasing") return Building2;
  if (["consorcio", "consorcio_empresarial"].includes(tipo)) return Landmark;
  return Sprout;
}

// ── Summary Cards ──
function SummaryCards({ financiamentos }: { financiamentos: Financiamento[] }) {
  const ativos = financiamentos.filter(f => f.status !== "quitado");
  const totalFinanciado = ativos.reduce((s, f) => s + f.saldoDevedor, 0);
  const parcelasMes = ativos.reduce((s, f) => {
    const hoje = new Date();
    const parcMes = f.parcelas.find(
      p => p.status === "pendente" &&
        new Date(p.vencimento).getMonth() === hoje.getMonth() &&
        new Date(p.vencimento).getFullYear() === hoje.getFullYear()
    );
    return s + (parcMes?.total || 0);
  }, 0);
  const totalPago = financiamentos.reduce((s, f) => s + f.totalPago, 0);

  const cards = [
    { title: "Total Financiado", value: fmt(totalFinanciado), icon: Landmark, desc: "Saldo devedor ativo" },
    { title: "Parcelas do Mês", value: fmt(parcelasMes), icon: CalendarDays, desc: "Vencendo este mês" },
    { title: "Total Já Pago", value: fmt(totalPago), icon: TrendingDown, desc: "Amortizações realizadas" },
    { title: "Financiamentos Ativos", value: String(ativos.length), icon: TrendingUp, desc: `de ${financiamentos.length} total` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              </div>
              <c.icon className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Financing Card ──
function FinanciamentoCard({ fin, onSelect }: { fin: Financiamento; onSelect: () => void }) {
  const Icon = getIcon(fin.tipo);
  const pctQuitado = fin.valorFinanciado > 0
    ? Math.round(((fin.valorFinanciado - fin.saldoDevedor) / fin.valorFinanciado) * 100)
    : 0;
  const proximaParcela = fin.parcelas.find(p => p.status === "pendente" || p.status === "futuro");

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{fin.nome}</h3>
              <Badge variant="outline" className={tipoColors[fin.tipo] + " text-xs border-0"}>
                {tipoLabels[fin.tipo]}
              </Badge>
              <Badge variant="outline" className={statusColors[fin.status] + " text-xs border-0"}>
                {statusLabels[fin.status]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{fin.instituicao} • Contrato: {fin.numeroContrato}</p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Valor original</p>
                <p className="font-medium">{fmt(fin.valorFinanciado)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saldo devedor</p>
                <p className="font-medium">{fmt(fin.saldoDevedor)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Próxima parcela</p>
                <p className="font-medium">
                  {proximaParcela ? `${fmtDate(proximaParcela.vencimento)} • ${fmt(proximaParcela.total)}` : "—"}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Progress value={pctQuitado} className="h-2 flex-1" />
              <span className="text-xs font-medium text-muted-foreground">{pctQuitado}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Detail View ──
function FinanciamentoDetail({ fin, onBack }: { fin: Financiamento; onBack: () => void }) {
  const [page, setPage] = useState(0);
  const perPage = 12;
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? fin.parcelas : fin.parcelas.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(fin.parcelas.length / perPage);
  const Icon = getIcon(fin.tipo);
  const pctQuitado = fin.valorFinanciado > 0
    ? Math.round(((fin.valorFinanciado - fin.saldoDevedor) / fin.valorFinanciado) * 100) : 0;

  const totalJuros = fin.parcelas.reduce((s, p) => s + p.juros, 0);
  const totalGeral = fin.parcelas.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{fin.nome}</h2>
          <p className="text-sm text-muted-foreground">{fin.instituicao} • {fin.numeroContrato}</p>
        </div>
        <Badge className={statusColors[fin.status] + " border-0 ml-auto"}>{statusLabels[fin.status]}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Valor Financiado", v: fmt(fin.valorFinanciado) },
          { l: "Saldo Devedor", v: fmt(fin.saldoDevedor) },
          { l: "Total de Juros", v: fmt(totalJuros) },
          { l: "Total a Pagar", v: fmt(totalGeral) },
          { l: "Entrada", v: fmt(fin.valorEntrada) },
          { l: "Prazo", v: `${fin.prazoMeses} meses` },
          { l: "Taxa", v: `${fmtNum(fin.taxaJuros)}% ${fin.taxaTipo === "mensal" ? "a.m." : "a.a."}` },
          { l: "Sistema", v: fin.sistemaAmortizacao.toUpperCase() },
        ].map(item => (
          <Card key={item.l}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{item.l}</p>
              <p className="font-semibold text-sm">{item.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Progress value={pctQuitado} className="h-3 flex-1" />
        <span className="text-sm font-medium">{pctQuitado}% quitado</span>
      </div>

      {(fin.possuiCarencia || fin.possuiRebate || fin.possuiSeguro || fin.programaGov) && (
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            {fin.possuiCarencia && (
              <p>🕐 <strong>Carência:</strong> {fmtDate(fin.carenciaInicio!)} a {fmtDate(fin.carenciaFim!)} — {fin.carenciaTipo === "juros" ? "Paga só juros" : fin.carenciaTipo === "juros_correcao" ? "Juros + Correção" : "Não paga nada"}</p>
            )}
            {fin.possuiRebate && (
              <p>🎯 <strong>Rebate:</strong> {fin.rebatePercentual}% — {fin.rebateCondicao}</p>
            )}
            {fin.possuiSeguro && (
              <p>🛡️ <strong>Seguro:</strong> {fmt(fin.seguroValorParcela!)} /parcela — {fin.seguradora}</p>
            )}
            {fin.programaGov && (
              <p>🏛️ <strong>Programa:</strong> {fin.programaGov.toUpperCase()} {fin.protocolo && `• ${fin.protocolo}`}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tabela de Amortização</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Paginar" : "Ver todas"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3 w-3" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Saldo Dev.</TableHead>
                  <TableHead className="text-right">Amortização</TableHead>
                  <TableHead className="text-right">Juros</TableHead>
                  <TableHead className="text-right">Seguro</TableHead>
                  <TableHead className="text-right">Parcela</TableHead>
                  <TableHead className="text-right">Acumulado</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map(p => (
                  <TableRow
                    key={p.numero}
                    className={p.status === "pendente" ? "bg-primary/5 font-medium" : p.status === "vencido" ? "bg-destructive/5" : ""}
                  >
                    <TableCell>{p.numero}</TableCell>
                    <TableCell>{fmtDate(p.vencimento)}</TableCell>
                    <TableCell className="text-right">{fmt(p.saldoDevedor)}</TableCell>
                    <TableCell className="text-right">{fmt(p.amortizacao)}</TableCell>
                    <TableCell className="text-right">{fmt(p.juros)}</TableCell>
                    <TableCell className="text-right">{fmt(p.seguro)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(p.total)}</TableCell>
                    <TableCell className="text-right">{fmt(p.acumulado)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        p.status === "pago" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0"
                        : p.status === "pendente" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0"
                        : p.status === "vencido" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0"
                        : "border-0"
                      }>
                        {p.status === "pago" ? "Pago" : p.status === "pendente" ? "Pendente" : p.status === "vencido" ? "Vencido" : "Futuro"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          {!showAll && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Simulator ──
function Simulador() {
  const [valor, setValor] = useState(100000);
  const [taxa, setTaxa] = useState(1);
  const [taxaTipo, setTaxaTipo] = useState<"mensal" | "anual">("mensal");
  const [prazo, setPrazo] = useState(48);
  const [sistema, setSistema] = useState<SistemaAmortizacao>("sac");
  const [carencia, setCarencia] = useState(0);
  const [calculado, setCalculado] = useState(false);
  const [parcelasSAC, setParcelasSAC] = useState<Parcela[]>([]);
  const [parcelasPRICE, setParcelasPRICE] = useState<Parcela[]>([]);
  const [simPage, setSimPage] = useState(0);
  const [showAllSim, setShowAllSim] = useState(false);

  const calcular = () => {
    const data = new Date().toISOString().split("T")[0];
    setParcelasSAC(gerarTabela(valor, taxa, taxaTipo, prazo, "sac", data, 0, carencia));
    setParcelasPRICE(gerarTabela(valor, taxa, taxaTipo, prazo, "price", data, 0, carencia));
    setCalculado(true);
    setSimPage(0);
  };

  const parcelas = sistema === "sac" ? parcelasSAC : parcelasPRICE;
  const perPage = 12;
  const displayed = showAllSim ? parcelas : parcelas.slice(simPage * perPage, (simPage + 1) * perPage);
  const totalPages = Math.ceil(parcelas.length / perPage);

  const totalJurosSAC = parcelasSAC.reduce((s, p) => s + p.juros, 0);
  const totalJurosPRICE = parcelasPRICE.reduce((s, p) => s + p.juros, 0);
  const totalSAC = parcelasSAC.reduce((s, p) => s + p.total, 0);
  const totalPRICE = parcelasPRICE.reduce((s, p) => s + p.total, 0);

  const chartData = useMemo(() => {
    if (!calculado) return [];
    return parcelasSAC.map((s, i) => ({
      parcela: s.numero,
      "SAC - Saldo": s.saldoDevedor,
      "PRICE - Saldo": parcelasPRICE[i]?.saldoDevedor || 0,
      "SAC - Parcela": s.total,
      "PRICE - Parcela": parcelasPRICE[i]?.total || 0,
    }));
  }, [calculado, parcelasSAC, parcelasPRICE]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Simulador de Amortização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Valor Financiado</Label>
              <Input type="number" value={valor} onChange={e => setValor(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Taxa de Juros</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" value={taxa} onChange={e => setTaxa(+e.target.value)} className="flex-1" />
                <Select value={taxaTipo} onValueChange={v => setTaxaTipo(v as "mensal" | "anual")}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">% a.m.</SelectItem>
                    <SelectItem value="anual">% a.a.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Prazo (meses)</Label>
              <Input type="number" value={prazo} onChange={e => setPrazo(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sistema de Amortização</Label>
              <Select value={sistema} onValueChange={v => setSistema(v as SistemaAmortizacao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sac">SAC</SelectItem>
                  <SelectItem value="price">PRICE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Carência (meses)</Label>
              <Input type="number" value={carencia} onChange={e => setCarencia(+e.target.value)} />
            </div>
          </div>
          <Button onClick={calcular} className="gap-2">
            <Calculator className="h-4 w-4" /> Calcular
          </Button>
        </CardContent>
      </Card>

      {calculado && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "1ª Parcela", v: fmt(parcelas[0]?.total || 0) },
              { l: "Última Parcela", v: fmt(parcelas[parcelas.length - 1]?.total || 0) },
              { l: "Total de Juros", v: fmt(sistema === "sac" ? totalJurosSAC : totalJurosPRICE) },
              { l: "Total Pago", v: fmt(sistema === "sac" ? totalSAC : totalPRICE) },
            ].map(c => (
              <Card key={c.l}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{c.l}</p>
                  <p className="font-semibold">{c.v}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Comparativo SAC vs PRICE — Saldo Devedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="parcela" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="SAC - Saldo" stroke="hsl(149, 62%, 26%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="PRICE - Saldo" stroke="hsl(37, 100%, 50%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tabela de Amortização — {sistema.toUpperCase()}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAllSim(!showAllSim)}>
                    {showAllSim ? "Paginar" : "Ver todas"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3 w-3" /> Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Nº</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Saldo Dev.</TableHead>
                      <TableHead className="text-right">Amortização</TableHead>
                      <TableHead className="text-right">Juros</TableHead>
                      <TableHead className="text-right">Parcela</TableHead>
                      <TableHead className="text-right">Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map(p => (
                      <TableRow key={p.numero}>
                        <TableCell>{p.numero}</TableCell>
                        <TableCell>{fmtDate(p.vencimento)}</TableCell>
                        <TableCell className="text-right">{fmt(p.saldoDevedor)}</TableCell>
                        <TableCell className="text-right">{fmt(p.amortizacao)}</TableCell>
                        <TableCell className="text-right">{fmt(p.juros)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(p.total)}</TableCell>
                        <TableCell className="text-right">{fmt(p.acumulado)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {!showAllSim && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-3 border-t">
                  <Button variant="outline" size="sm" disabled={simPage === 0} onClick={() => setSimPage(simPage - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Página {simPage + 1} de {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={simPage >= totalPages - 1} onClick={() => setSimPage(simPage + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── New Financing Form ──
function NovoFinanciamentoForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [perfil, setPerfil] = useState<"pessoal" | "empresarial">("empresarial");
  const [tipo, setTipo] = useState<FinanciamentoTipo>("credito_rural");
  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [contrato, setContrato] = useState("");
  const [valorFin, setValorFin] = useState(0);
  const [entrada, setEntrada] = useState(0);
  const [dataContrato, setDataContrato] = useState("");
  const [dataPrimeira, setDataPrimeira] = useState("");
  const [prazo, setPrazo] = useState(48);
  const [taxa, setTaxa] = useState(1);
  const [taxaTipo, setTaxaTipo] = useState<"mensal" | "anual">("mensal");
  const [indice, setIndice] = useState<IndiceCorrecao>("sem");
  const [sistema, setSistema] = useState<SistemaAmortizacao>("sac");
  const [temCarencia, setTemCarencia] = useState(false);
  const [carInicio, setCarInicio] = useState("");
  const [carFim, setCarFim] = useState("");
  const [carTipo, setCarTipo] = useState("juros");
  const [temRebate, setTemRebate] = useState(false);
  const [rebatePct, setRebatePct] = useState(5);
  const [rebateCond, setRebateCond] = useState("");
  const [temSeguro, setTemSeguro] = useState(false);
  const [seguroVal, setSeguroVal] = useState(0);
  const [seguradora, setSeguradora] = useState("");
  const [garantia, setGarantia] = useState<TipoGarantia>("sem_garantia");
  const [garantiaDesc, setGarantiaDesc] = useState("");
  const [notas, setNotas] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [programaGov, setProgramaGov] = useState<ProgramaGov>("");

  const tiposDisponiveis = perfil === "empresarial" ? tiposEmpresarial : tiposPessoal;

  const preview = useMemo(() => {
    if (!valorFin || !taxa || !prazo || !dataPrimeira) return [];
    return gerarTabela(valorFin, taxa, taxaTipo, prazo, sistema, dataPrimeira, temSeguro ? seguroVal : 0, 0);
  }, [valorFin, taxa, taxaTipo, prazo, sistema, dataPrimeira, temSeguro, seguroVal]);

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Step indicators */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Identificação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome/Descrição</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Trator John Deere 5075E" />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={perfil} onValueChange={v => { setPerfil(v as "pessoal" | "empresarial"); setTipo(v === "empresarial" ? "credito_rural" : "imovel_residencial"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Financiamento</Label>
              <Select value={tipo} onValueChange={v => setTipo(v as FinanciamentoTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiposDisponiveis.map(t => (
                    <SelectItem key={t} value={t}>{tipoLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Instituição Financeira</Label>
              <Select value={instituicao} onValueChange={setInstituicao}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {bancos.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Número do Contrato</Label>
              <Input value={contrato} onChange={e => setContrato(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Valores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor Total Financiado</Label>
              <Input type="number" value={valorFin || ""} onChange={e => setValorFin(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor de Entrada</Label>
              <Input type="number" value={entrada || ""} onChange={e => setEntrada(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Contratação</Label>
              <Input type="date" value={dataContrato} onChange={e => setDataContrato(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data da 1ª Parcela</Label>
              <Input type="date" value={dataPrimeira} onChange={e => setDataPrimeira(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo (meses)</Label>
              <Input type="number" value={prazo} onChange={e => setPrazo(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Taxa de Juros</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" value={taxa} onChange={e => setTaxa(+e.target.value)} className="flex-1" />
                <Select value={taxaTipo} onValueChange={v => setTaxaTipo(v as "mensal" | "anual")}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">% a.m.</SelectItem>
                    <SelectItem value="anual">% a.a.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Índice de Correção</Label>
              <Select value={indice} onValueChange={v => setIndice(v as IndiceCorrecao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["sem", "tjlp", "tlp", "selic", "ipca", "incc", "tr", "pre_fixado"] as IndiceCorrecao[]).map(i => (
                    <SelectItem key={i} value={i}>{i === "sem" ? "Sem correção" : i === "pre_fixado" ? "Pré-fixado" : i.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sistema de Amortização</Label>
              <Select value={sistema} onValueChange={v => setSistema(v as SistemaAmortizacao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sac">SAC (Parcelas Decrescentes)</SelectItem>
                  <SelectItem value="price">PRICE (Parcelas Iguais)</SelectItem>
                  <SelectItem value="americano">Americano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Carência</h3>
          <div className="flex items-center gap-2">
            <Switch checked={temCarencia} onCheckedChange={setTemCarencia} />
            <Label>Possui período de carência?</Label>
          </div>
          {temCarencia && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Início da Carência</Label>
                <Input type="date" value={carInicio} onChange={e => setCarInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fim da Carência</Label>
                <Input type="date" value={carFim} onChange={e => setCarFim(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Durante a carência</Label>
                <Select value={carTipo} onValueChange={setCarTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nada">Não paga nada</SelectItem>
                    <SelectItem value="juros">Paga só juros</SelectItem>
                    <SelectItem value="juros_correcao">Juros + Correção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Separator />
          <h3 className="font-semibold">Condições Especiais</h3>

          <div className="flex items-center gap-2">
            <Switch checked={temRebate} onCheckedChange={setTemRebate} />
            <Label>Possui rebate/bônus de adimplência?</Label>
          </div>
          {temRebate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Percentual do Rebate (%)</Label>
                <Input type="number" value={rebatePct} onChange={e => setRebatePct(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Condição</Label>
                <Input value={rebateCond} onChange={e => setRebateCond(e.target.value)} placeholder="Ex: 5% de desconto se pagar em dia" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={temSeguro} onCheckedChange={setTemSeguro} />
            <Label>Possui seguro obrigatório vinculado?</Label>
          </div>
          {temSeguro && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor do Seguro por Parcela</Label>
                <Input type="number" value={seguroVal || ""} onChange={e => setSeguroVal(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Seguradora</Label>
                <Input value={seguradora} onChange={e => setSeguradora(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Garantia</Label>
              <Select value={garantia} onValueChange={v => setGarantia(v as TipoGarantia)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alienacao">Alienação Fiduciária</SelectItem>
                  <SelectItem value="hipoteca">Hipoteca</SelectItem>
                  <SelectItem value="penhor_rural">Penhor Rural</SelectItem>
                  <SelectItem value="aval">Aval</SelectItem>
                  <SelectItem value="sem_garantia">Sem Garantia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição da Garantia</Label>
              <Input value={garantiaDesc} onChange={e => setGarantiaDesc(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Observações</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Programa Governamental</Label>
              <Select value={programaGov} onValueChange={v => setProgramaGov(v as ProgramaGov)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  <SelectItem value="pronaf">Pronaf</SelectItem>
                  <SelectItem value="pronamp">Pronamp</SelectItem>
                  <SelectItem value="fco">FCO</SelectItem>
                  <SelectItem value="abc">ABC</SelectItem>
                  <SelectItem value="moderfrota">Moderfrota</SelectItem>
                  <SelectItem value="bndes">BNDES</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nº Processo/Protocolo</Label>
              <Input value={protocolo} onChange={e => setProtocolo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas Gerais</Label>
            <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Preview da Tabela de Amortização</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">1ª Parcela</p><p className="font-semibold">{fmt(preview[0]?.total || 0)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Última Parcela</p><p className="font-semibold">{fmt(preview[preview.length - 1]?.total || 0)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Juros</p><p className="font-semibold">{fmt(preview.reduce((s, p) => s + p.juros, 0))}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Pago</p><p className="font-semibold">{fmt(preview.reduce((s, p) => s + p.total, 0))}</p></CardContent></Card>
          </div>
          {preview.length > 0 && (
            <ScrollArea className="w-full max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Amortização</TableHead>
                    <TableHead className="text-right">Juros</TableHead>
                    <TableHead className="text-right">Parcela</TableHead>
                    <TableHead className="text-right">Saldo Dev.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 12).map(p => (
                    <TableRow key={p.numero}>
                      <TableCell>{p.numero}</TableCell>
                      <TableCell>{fmtDate(p.vencimento)}</TableCell>
                      <TableCell className="text-right">{fmt(p.amortizacao)}</TableCell>
                      <TableCell className="text-right">{fmt(p.juros)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(p.total)}</TableCell>
                      <TableCell className="text-right">{fmt(p.saldoDevedor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          <p className="text-xs text-muted-foreground">
            Ao confirmar, {preview.length} parcelas serão geradas automaticamente em Contas a Pagar.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t">
        <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep(step + 1)}>Próximo</Button>
        ) : (
          <Button onClick={onClose} className="gap-1">
            <DollarSign className="h-4 w-4" /> Salvar Financiamento
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function Financiamentos() {
  const [financiamentos] = useState(mockFinanciamentos);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("painel");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterPerfil, setFilterPerfil] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterInstituicao, setFilterInstituicao] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);

  const selected = financiamentos.find(f => f.id === selectedId);

  const filtered = useMemo(() => {
    return financiamentos.filter(f => {
      if (filterTipo !== "todos" && f.tipo !== filterTipo) return false;
      if (filterPerfil !== "todos" && f.perfil !== filterPerfil) return false;
      if (filterStatus !== "todos" && f.status !== filterStatus) return false;
      if (filterInstituicao !== "todos" && f.instituicao !== filterInstituicao) return false;
      return true;
    });
  }, [financiamentos, filterTipo, filterPerfil, filterStatus, filterInstituicao]);

  const instituicoes = [...new Set(financiamentos.map(f => f.instituicao))];

  if (selected) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <FinanciamentoDetail fin={selected} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" /> Financiamentos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie seus financiamentos pessoais e empresariais</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Financiamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Financiamento</DialogTitle>
            </DialogHeader>
            <NovoFinanciamentoForm onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="simulador" className="gap-1">
            <Calculator className="h-3.5 w-3.5" /> Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="painel" className="space-y-4">
          <SummaryCards financiamentos={financiamentos} />

          {/* Filters */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {[...tiposEmpresarial, ...tiposPessoal].map(t => (
                      <SelectItem key={t} value={t}>{tipoLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPerfil} onValueChange={setFilterPerfil}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Perfil" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="quitado">Quitado</SelectItem>
                    <SelectItem value="carencia">Em Carência</SelectItem>
                    <SelectItem value="inadimplente">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterInstituicao} onValueChange={setFilterInstituicao}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Instituição" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {instituicoes.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(filterTipo !== "todos" || filterPerfil !== "todos" || filterStatus !== "todos" || filterInstituicao !== "todos") && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setFilterTipo("todos"); setFilterPerfil("todos"); setFilterStatus("todos"); setFilterInstituicao("todos"); }}>
                    <X className="h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(fin => (
              <FinanciamentoCard key={fin.id} fin={fin} onSelect={() => setSelectedId(fin.id)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum financiamento encontrado com os filtros aplicados.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simulador">
          <Simulador />
        </TabsContent>
      </Tabs>
    </div>
  );
}
