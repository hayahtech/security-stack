import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  FileBarChart, Download, DollarSign, CalendarDays, AlertTriangle, TrendingDown,
} from "lucide-react";
import {
  mockFinanciamentos, Financiamento, tipoLabels, statusLabels, statusColors,
} from "@/data/financiamentos-mock";
import { mockCreditoRuralFinanciamentos } from "@/data/credito-rural-mock";
import { mockConsorcios, mockLeasings } from "@/data/patrimonio-mock";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

function getAllFinanciamentos(): Financiamento[] {
  return [...mockFinanciamentos, ...mockCreditoRuralFinanciamentos];
}

export default function PosicaoFinanciamentos() {
  const allFin = useMemo(() => getAllFinanciamentos(), []);
  const [filterPerfil, setFilterPerfil] = useState<string>("todos");

  const filtered = useMemo(() => {
    if (filterPerfil === "todos") return allFin;
    return allFin.filter(f => f.perfil === filterPerfil);
  }, [allFin, filterPerfil]);

  const ativos = filtered.filter(f => f.status !== "quitado");
  const saldoTotal = ativos.reduce((s, f) => s + f.saldoDevedor, 0);
  const comprMensal = ativos.reduce((s, f) => {
    const hoje = new Date();
    const parcMes = f.parcelas.find(
      p => p.status === "pendente" &&
        new Date(p.vencimento).getMonth() === hoje.getMonth() &&
        new Date(p.vencimento).getFullYear() === hoje.getFullYear()
    );
    return s + (parcMes?.total || 0);
  }, 0);

  // Add leasing and consórcio mensal
  const leasingMensal = mockLeasings.filter(l => l.status === "ativo").reduce((s, l) => s + l.contraprestacaoMensal, 0);
  const consorcioMensal = mockConsorcios.filter(c => c.status !== "encerrado").reduce((s, c) => s + c.parcelaAtual, 0);
  const totalComprMensal = comprMensal + leasingMensal + consorcioMensal;

  const receitaMedia = 85000; // mock
  const pctComprometido = receitaMedia > 0 ? (totalComprMensal / receitaMedia * 100) : 0;
  const comprColor = pctComprometido <= 30 ? "text-emerald-600" : pctComprometido <= 50 ? "text-amber-600" : "text-red-600";

  // Gantt-like data
  const ganttData = useMemo(() => {
    return ativos.map(f => {
      const inicio = new Date(f.dataPrimeiraParcela);
      const fim = new Date(f.parcelas[f.parcelas.length - 1]?.vencimento || f.dataPrimeiraParcela);
      const hoje = new Date();
      const totalDias = (fim.getTime() - inicio.getTime()) / 86400000;
      const diasPassados = Math.max(0, (hoje.getTime() - inicio.getTime()) / 86400000);
      const pct = totalDias > 0 ? Math.min(100, (diasPassados / totalDias) * 100) : 0;
      return {
        nome: f.nome.length > 30 ? f.nome.substring(0, 30) + "..." : f.nome,
        inicio: fmtDate(f.dataPrimeiraParcela),
        fim: fmtDate(f.parcelas[f.parcelas.length - 1]?.vencimento || ""),
        pct: Math.round(pct),
        saldo: f.saldoDevedor,
      };
    }).sort((a, b) => a.pct - b.pct);
  }, [ativos]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" /> Posição de Financiamentos
          </h1>
          <p className="text-sm text-muted-foreground">Relatório consolidado de todos os financiamentos, consórcios e leasings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> PDF</Button>
          <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> Excel</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <Select value={filterPerfil} onValueChange={setFilterPerfil}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            <SelectItem value="pessoal">Pessoal</SelectItem>
            <SelectItem value="empresarial">Empresarial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo Devedor Total</p>
            <p className="text-2xl font-bold">{fmt(saldoTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Comprometimento Mensal</p>
            <p className="text-2xl font-bold">{fmt(totalComprMensal)}</p>
            <p className="text-xs text-muted-foreground">Financ. {fmt(comprMensal)} + Leasing {fmt(leasingMensal)} + Consórcio {fmt(consorcioMensal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">% Renda Comprometida</p>
            <p className={`text-2xl font-bold ${comprColor}`}>{pctComprometido.toFixed(1)}%</p>
            <div className="flex items-center gap-1 mt-1">
              {pctComprometido <= 30 ? (
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0 text-xs">Saudável</Badge>
              ) : pctComprometido <= 50 ? (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0 text-xs">Atenção</Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-0 text-xs">Risco</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Financiamentos Ativos</p>
            <p className="text-2xl font-bold">{ativos.length}</p>
            <p className="text-xs text-muted-foreground">+ {mockLeasings.filter(l => l.status === "ativo").length} leasing + {mockConsorcios.filter(c => c.status !== "encerrado").length} consórcio</p>
          </CardContent>
        </Card>
      </div>

      {/* Consolidated table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Financiamentos Ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead className="text-right">Valor Original</TableHead>
                  <TableHead className="text-right">Saldo Devedor</TableHead>
                  <TableHead>Pagas/Total</TableHead>
                  <TableHead>Próx. Venc.</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(f => {
                  const pagas = f.parcelas.filter(p => p.status === "pago").length;
                  const prox = f.parcelas.find(p => p.status === "pendente" || p.status === "futuro");
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">{f.nome}</TableCell>
                      <TableCell className="text-xs">{f.instituicao}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{tipoLabels[f.tipo]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{f.numeroContrato}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(f.valorFinanciado)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(f.saldoDevedor)}</TableCell>
                      <TableCell className="text-xs">{pagas}/{f.parcelas.length}</TableCell>
                      <TableCell className="text-xs">{prox ? fmtDate(prox.vencimento) : "—"}</TableCell>
                      <TableCell className="text-xs">{f.taxaJuros}% {f.taxaTipo === "mensal" ? "a.m." : "a.a."}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[f.status] + " border-0 text-xs"}>
                          {statusLabels[f.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Gantt projection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Projeção de Quitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ganttData.map((g, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[200px]">{g.nome}</span>
                  <span className="text-muted-foreground">{g.inicio} → {g.fim}</span>
                </div>
                <div className="relative h-6 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/70 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(g.pct, 5)}%` }}
                  >
                    <span className="text-[10px] text-primary-foreground font-medium">{g.pct}%</span>
                  </div>
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <span className="text-[10px] text-muted-foreground">{fmt(g.saldo)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
