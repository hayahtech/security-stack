import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Sprout, Plus, AlertTriangle, CalendarDays, TrendingUp, DollarSign,
  Download, Landmark, ChevronRight, Percent, Leaf, FileText, Clock,
  CheckCircle2, AlertCircle, Filter, X,
} from "lucide-react";
import {
  mockFinanciamentos, Financiamento, tipoLabels, statusLabels, statusColors,
} from "@/data/financiamentos-mock";
import {
  mockCreditoRuralExtras, mockCreditoRuralFinanciamentos, CreditoRuralExtra,
  ProgramaRural, FinalidadeRural,
  programaLabels, programaColors, finalidadeLabels,
} from "@/data/credito-rural-mock";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

// All credit rural financiamentos (from both sources)
function getAllCreditoRural(): (Financiamento & { extra?: CreditoRuralExtra })[] {
  const fromMain = mockFinanciamentos.filter(f => f.tipo === "credito_rural");
  const all = [...fromMain, ...mockCreditoRuralFinanciamentos];
  return all.map(f => ({
    ...f,
    extra: mockCreditoRuralExtras.find(e => e.financiamentoId === f.id),
  }));
}

// ── Summary Cards ──
function CreditoRuralSummary({ items }: { items: (Financiamento & { extra?: CreditoRuralExtra })[] }) {
  const ativos = items.filter(f => f.status !== "quitado");
  const totalContratado = ativos.reduce((s, f) => s + f.valorFinanciado, 0);
  const totalDisponivel = ativos.reduce((s, f) => s + Math.max(0, f.valorFinanciado - f.saldoDevedor), 0);

  const hoje = new Date();
  const em90dias = new Date();
  em90dias.setDate(em90dias.getDate() + 90);
  const vencendo90 = ativos.filter(f => {
    const venc = f.extra?.dataVencimentoFinal || f.parcelas[f.parcelas.length - 1]?.vencimento;
    if (!venc) return false;
    const dv = new Date(venc);
    return dv >= hoje && dv <= em90dias;
  }).reduce((s, f) => s + f.saldoDevedor, 0);

  const rebatesDisp = items.reduce((s, f) => {
    if (f.extra?.rebateStatus === "disponivel") return s + (f.extra.rebateValor || 0);
    return s;
  }, 0);

  const cards = [
    { title: "Crédito Rural Contratado", value: fmt(totalContratado), icon: Landmark, desc: "Total no ano" },
    { title: "Já Amortizado", value: fmt(totalDisponivel), icon: TrendingUp, desc: "Principal pago" },
    { title: "Vencendo em 90 dias", value: fmt(vencendo90), icon: CalendarDays, desc: "Valor total" },
    { title: "Rebates Disponíveis", value: fmt(rebatesDisp), icon: Percent, desc: "Se pagar em dia" },
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

// ── Alerts ──
function CreditoRuralAlerts({ items }: { items: (Financiamento & { extra?: CreditoRuralExtra })[] }) {
  const alerts: { type: "warning" | "info" | "success"; msg: string }[] = [];
  const hoje = new Date();

  items.forEach(f => {
    const extra = f.extra;
    if (!extra) return;

    // Rebate alert
    if (extra.rebateStatus === "disponivel" && extra.rebateValor > 0) {
      const vencParcela = f.parcelas.find(p => p.status === "pendente" || p.status === "futuro");
      if (vencParcela) {
        const dias = Math.ceil((new Date(vencParcela.vencimento).getTime() - hoje.getTime()) / 86400000);
        if (dias <= 30 && dias > 0) {
          alerts.push({
            type: "warning",
            msg: `Operação ${programaLabels[extra.programa]} "${f.nome}" vence em ${dias} dias — pague em dia para garantir rebate de ${fmt(extra.rebateValor)}`,
          });
        }
      }
    }

    // Carência ending
    if (f.possuiCarencia && extra.dataFimCarencia) {
      const fimCar = new Date(extra.dataFimCarencia);
      const diasCar = Math.ceil((fimCar.getTime() - hoje.getTime()) / 86400000);
      if (diasCar > 0 && diasCar <= 60) {
        alerts.push({
          type: "info",
          msg: `Período de carência de "${f.nome}" encerra em ${diasCar} dias — primeira parcela de amortização vence logo após.`,
        });
      }
    }

    // Equalização
    if (extra.possuiEqualizacao && extra.equalizacao) {
      const econMensal = (f.saldoDevedor * (extra.equalizacao / 100)) / 12;
      alerts.push({
        type: "success",
        msg: `Equalização de juros "${f.nome}": economia estimada de ${fmt(econMensal)}/mês (${extra.equalizacao}% subsidiado)`,
      });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
          a.type === "warning" ? "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          : a.type === "success" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
        }`}>
          {a.type === "warning" ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
           : a.type === "success" ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
           : <Clock className="h-4 w-4 mt-0.5 shrink-0" />}
          <span>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Calendar mini ──
function VencimentosCalendario({ items }: { items: (Financiamento & { extra?: CreditoRuralExtra })[] }) {
  const meses = useMemo(() => {
    const hoje = new Date();
    const result: { mes: string; items: { nome: string; dia: number; programa: ProgramaRural; valor: number }[] }[] = [];
    for (let m = 0; m < 6; m++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + m, 1);
      const mesLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      const monthItems: typeof result[0]["items"] = [];

      items.forEach(f => {
        f.parcelas.forEach(p => {
          const pd = new Date(p.vencimento);
          if (pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && p.status !== "pago") {
            monthItems.push({
              nome: f.nome,
              dia: pd.getDate(),
              programa: (f.extra?.programa || "outro") as ProgramaRural,
              valor: p.total,
            });
          }
        });
      });

      result.push({ mes: mesLabel, items: monthItems });
    }
    return result;
  }, [items]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Calendário de Vencimentos — Próximos 6 meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {meses.map(m => (
            <div key={m.mes} className="border rounded-lg p-2">
              <p className="text-xs font-semibold text-center capitalize mb-2">{m.mes}</p>
              {m.items.length > 0 ? m.items.map((item, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={programaColors[item.programa] + " border-0 text-[10px] px-1"}>
                      {programaLabels[item.programa]}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{item.nome}</p>
                  <p className="text-xs font-medium">Dia {item.dia} • {fmt(item.valor)}</p>
                </div>
              )) : (
                <p className="text-[10px] text-muted-foreground text-center py-2">Sem vencimentos</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Operations table ──
function TabelaOperacoes({ items }: { items: (Financiamento & { extra?: CreditoRuralExtra })[] }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Operações de Crédito Rural</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programa</TableHead>
                <TableHead>Finalidade</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Cultura/Atividade</TableHead>
                <TableHead>Carência até</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Rebate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(f => (
                <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/financeiro/financiamentos/${f.id}`)}>
                  <TableCell>
                    <Badge variant="outline" className={(f.extra ? programaColors[f.extra.programa] : "bg-muted text-muted-foreground") + " border-0 text-xs"}>
                      {f.extra ? programaLabels[f.extra.programa] : (f.programaGov || "—")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.extra ? finalidadeLabels[f.extra.finalidade] : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{fmt(f.valorFinanciado)}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {f.extra?.culturaAtividade || f.nome}
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.extra?.dataFimCarencia ? fmtDate(f.extra.dataFimCarencia) : f.carenciaFim ? fmtDate(f.carenciaFim) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.extra?.dataVencimentoFinal ? fmtDate(f.extra.dataVencimentoFinal) : fmtDate(f.parcelas[f.parcelas.length - 1]?.vencimento || "")}
                  </TableCell>
                  <TableCell className="text-xs">
                    {f.extra?.taxaContratual || f.taxaJuros}% a.a.
                    {f.extra?.possuiEqualizacao && (
                      <span className="text-primary ml-1">(eq.)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(f.extra?.rebatePercentual || f.rebatePercentual) ? (
                      <Badge variant="outline" className={
                        f.extra?.rebateStatus === "aplicado" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0 text-xs"
                        : f.extra?.rebateStatus === "perdido" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0 text-xs"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0 text-xs"
                      }>
                        {f.extra?.rebatePercentual || f.rebatePercentual}%
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[f.status] + " border-0 text-xs"}>
                      {statusLabels[f.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ── Relatório LCPRD ──
function RelatorioLCPRD({ items }: { items: (Financiamento & { extra?: CreditoRuralExtra })[] }) {
  const ano = new Date().getFullYear();
  const ativos = items.filter(f => f.status !== "quitado");

  const totalContratadoAno = items.filter(f => new Date(f.dataContratacao).getFullYear() === ano)
    .reduce((s, f) => s + f.valorFinanciado, 0);

  const pagamentos = items.flatMap(f =>
    f.parcelas.filter(p => p.status === "pago").map(p => ({
      nome: f.nome,
      programa: f.extra?.programa || "outro" as ProgramaRural,
      ...p,
    }))
  );

  const totalPago = pagamentos.reduce((s, p) => s + p.total, 0);
  const totalJurosPagos = pagamentos.reduce((s, p) => s + p.juros, 0);
  const totalAmortPago = pagamentos.reduce((s, p) => s + p.amortizacao, 0);

  const rebatesRecebidos = items.filter(f => f.extra?.rebateStatus === "aplicado")
    .reduce((s, f) => s + (f.extra?.rebateValor || 0), 0);

  const saldoDevedor31dez = ativos.reduce((s, f) => s + f.saldoDevedor, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Relatório de Crédito Rural — Exercício {ano}
        </h3>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-3 w-3" /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Contratado no exercício", v: fmt(totalContratadoAno) },
          { l: "Total pago", v: fmt(totalPago) },
          { l: "Juros pagos", v: fmt(totalJurosPagos) },
          { l: "Saldo devedor em 31/12", v: fmt(saldoDevedor31dez) },
        ].map(c => (
          <Card key={c.l}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{c.l}</p>
              <p className="font-semibold">{c.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operações contratadas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Operações Contratadas no Exercício</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programa</TableHead>
                <TableHead>Finalidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Data Contratação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.filter(f => new Date(f.dataContratacao).getFullYear() === ano).map(f => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Badge variant="outline" className={(f.extra ? programaColors[f.extra.programa] : "bg-muted") + " border-0 text-xs"}>
                      {f.extra ? programaLabels[f.extra.programa] : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{f.extra ? finalidadeLabels[f.extra.finalidade] : "—"}</TableCell>
                  <TableCell className="text-xs">{f.extra?.culturaAtividade || f.nome}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(f.valorFinanciado)}</TableCell>
                  <TableCell className="text-xs">{fmtDate(f.dataContratacao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagamentos realizados */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pagamentos Realizados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operação</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Amortização</TableHead>
                <TableHead className="text-right">Juros</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{p.nome}</TableCell>
                  <TableCell>{p.numero}</TableCell>
                  <TableCell className="text-xs">{fmtDate(p.vencimento)}</TableCell>
                  <TableCell className="text-right">{fmt(p.amortizacao)}</TableCell>
                  <TableCell className="text-right">{fmt(p.juros)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(p.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{fmt(totalAmortPago)}</TableCell>
                <TableCell className="text-right">{fmt(totalJurosPagos)}</TableCell>
                <TableCell className="text-right">{fmt(totalPago)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rebates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rebates (Receita a Declarar)</CardTitle>
        </CardHeader>
        <CardContent>
          {rebatesRecebidos > 0 ? (
            <p className="text-sm">Total de rebates recebidos: <strong>{fmt(rebatesRecebidos)}</strong></p>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum rebate aplicado no exercício.</p>
          )}
          <div className="mt-2 space-y-1">
            {items.filter(f => f.extra?.rebateStatus === "disponivel" && f.extra.rebateValor > 0).map(f => (
              <div key={f.id} className="flex justify-between text-sm p-2 rounded bg-amber-50 dark:bg-amber-950">
                <span>{f.nome}</span>
                <span className="font-medium">{fmt(f.extra!.rebateValor)} (disponível)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saldos devedores */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Saldos Devedores em 31/12/{ano}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operação</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Saldo Devedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ativos.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="text-xs">{f.nome}</TableCell>
                  <TableCell className="text-xs">{f.instituicao}</TableCell>
                  <TableCell className="text-xs">{f.numeroContrato}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(f.saldoDevedor)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{fmt(saldoDevedor31dez)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── New CR Form ──
function NovoCreditoRuralForm({ onClose }: { onClose: () => void }) {
  const [programa, setPrograma] = useState<ProgramaRural>("pronaf");
  const [finalidade, setFinalidade] = useState<FinalidadeRural>("custeio_pecuario");
  const [cultura, setCultura] = useState("");
  const [area, setArea] = useState(0);
  const [dataLib, setDataLib] = useState("");
  const [dataIniCar, setDataIniCar] = useState("");
  const [dataFimCar, setDataFimCar] = useState("");
  const [dataVenc, setDataVenc] = useState("");
  const [temRebate, setTemRebate] = useState(true);
  const [rebatePct, setRebatePct] = useState(5);
  const [rebateCond, setRebateCond] = useState("Pagamento até o vencimento");
  const [taxaContratual, setTaxaContratual] = useState(5);
  const [temEqualizacao, setTemEqualizacao] = useState(false);
  const [taxaCheia, setTaxaCheia] = useState(9);
  const [equalizacao, setEqualizacao] = useState(4);
  const [valor, setValor] = useState(0);
  const [instituicao, setInstituicao] = useState("");
  const [contrato, setContrato] = useState("");
  const [notas, setNotas] = useState("");

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-6 pr-4">
        {/* Programa e Finalidade */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" /> Programa e Finalidade
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Programa</Label>
              <Select value={programa} onValueChange={v => setPrograma(v as ProgramaRural)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(programaLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Finalidade</Label>
              <Select value={finalidade} onValueChange={v => setFinalidade(v as FinalidadeRural)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(finalidadeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Cultura/Atividade financiada</Label>
              <Input value={cultura} onChange={e => setCultura(e.target.value)}
                placeholder="Ex: Soja safra 25/26, Aquisição de 50 matrizes Nelore" />
            </div>
            {(finalidade === "custeio_agricola") && (
              <div className="space-y-1.5">
                <Label>Área financiada (ha)</Label>
                <Input type="number" value={area || ""} onChange={e => setArea(+e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Valor financiado</Label>
              <Input type="number" value={valor || ""} onChange={e => setValor(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Instituição Financeira</Label>
              <Select value={instituicao} onValueChange={setInstituicao}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["Banco do Brasil", "Sicoob", "Sicredi", "BNB", "BNDES", "Caixa", "Outro"].map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nº do contrato</Label>
              <Input value={contrato} onChange={e => setContrato(e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Datas */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Calendário Agrícola
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de liberação</Label>
              <Input type="date" value={dataLib} onChange={e => setDataLib(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Início da carência</Label>
              <Input type="date" value={dataIniCar} onChange={e => setDataIniCar(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim da carência</Label>
              <Input type="date" value={dataFimCar} onChange={e => setDataFimCar(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento final</Label>
              <Input type="date" value={dataVenc} onChange={e => setDataVenc(e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Rebate */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" /> Rebate de Adimplência
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <Switch checked={temRebate} onCheckedChange={setTemRebate} />
            <Label>Possui rebate?</Label>
          </div>
          {temRebate && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Percentual (%)</Label>
                <Input type="number" value={rebatePct} onChange={e => setRebatePct(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Condição</Label>
                <Select value={rebateCond} onValueChange={setRebateCond}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pagamento até o vencimento">Pagamento até o vencimento</SelectItem>
                    <SelectItem value="Pagamento até 5 dias antes">Pagamento até 5 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {valor > 0 && (
                <div className="sm:col-span-2 p-2 rounded-lg bg-primary/5 text-sm">
                  Valor do rebate calculado: <strong>{fmt(valor * rebatePct / 100)}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Taxas */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Taxas e Correção
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Taxa contratual (% a.a.)</Label>
              <Input type="number" step="0.01" value={taxaContratual} onChange={e => setTaxaContratual(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Índice de correção</Label>
              <Select defaultValue="sem">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem">Sem correção</SelectItem>
                  <SelectItem value="tjlp">TJLP</SelectItem>
                  <SelectItem value="tlp">TLP</SelectItem>
                  <SelectItem value="selic">SELIC</SelectItem>
                  <SelectItem value="ipca">IPCA</SelectItem>
                  <SelectItem value="pre_fixado">Pré-fixado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 mb-2">
            <Switch checked={temEqualizacao} onCheckedChange={setTemEqualizacao} />
            <Label>Equalização de juros (subvenção)</Label>
          </div>
          {temEqualizacao && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Taxa cheia (%)</Label>
                <Input type="number" step="0.01" value={taxaCheia} onChange={e => setTaxaCheia(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Equalização (%)</Label>
                <Input type="number" step="0.01" value={equalizacao} onChange={e => setEqualizacao(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Taxa efetiva (%)</Label>
                <Input type="number" disabled value={taxaCheia - equalizacao} />
              </div>
              <div className="col-span-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-sm">
                Taxa cheia: {taxaCheia}% a.a. | Equalização: {equalizacao}% | <strong>Taxa paga: {taxaCheia - equalizacao}% a.a.</strong>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onClose} className="gap-1">
            <Sprout className="h-4 w-4" /> Salvar Crédito Rural
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Main Page ──
export default function CreditoRural() {
  const items = useMemo(() => getAllCreditoRural(), []);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);
  const [filterPrograma, setFilterPrograma] = useState<string>("todos");

  const filtered = useMemo(() => {
    if (filterPrograma === "todos") return items;
    return items.filter(f => f.extra?.programa === filterPrograma);
  }, [items, filterPrograma]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" /> Crédito Rural
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de financiamentos rurais com rebates, equalização e relatórios para LCPRD</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Operação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5" /> Nova Operação de Crédito Rural
              </DialogTitle>
            </DialogHeader>
            <NovoCreditoRuralForm onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="operacoes">Operações</TabsTrigger>
          <TabsTrigger value="relatorio" className="gap-1">
            <FileText className="h-3.5 w-3.5" /> Relatório LCPRD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <CreditoRuralSummary items={items} />
          <CreditoRuralAlerts items={items} />
          <VencimentosCalendario items={items} />
          <TabelaOperacoes items={filtered} />
        </TabsContent>

        <TabsContent value="operacoes" className="space-y-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterPrograma} onValueChange={setFilterPrograma}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Programa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os programas</SelectItem>
                    {Object.entries(programaLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterPrograma !== "todos" && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setFilterPrograma("todos")}>
                    <X className="h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <TabelaOperacoes items={filtered} />
        </TabsContent>

        <TabsContent value="relatorio">
          <RelatorioLCPRD items={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
