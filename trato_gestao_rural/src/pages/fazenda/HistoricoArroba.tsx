import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, Download, Info, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { ESTADOS, PRACA_INDICADOR_NACIONAL } from "@/data/brasil-locais";
import {
  getSerieHistorica, agruparPorAno, calcularVariacaoAnual,
  calcularMediaHistorica, getUltimasCotacoes, filtrarPorPeriodo,
} from "@/lib/arroba-service";
import { CEPEA_INDICADOR_NACIONAL } from "@/data/cepea-indicador";

const PERIODOS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "20", label: "20 anos" },
  { value: "30", label: "30 anos (desde 1994)" },
];

const REGIOES = ["Todos", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function VarBadge({ v }: { v: number | null }) {
  if (v === null) return <span className="text-xs text-muted-foreground">—</span>;
  const up = v > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-muted-foreground"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : v < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {v > 0 ? "+" : ""}{v}%
    </span>
  );
}

export default function HistoricoArroba() {
  const [uf, setUf] = useState("BR");
  const [pracaId, setPracaId] = useState("nacional-cepea");
  const [periodoAnos, setPeriodoAnos] = useState("20");
  const [regiaoFiltro, setRegiaoFiltro] = useState("Todos");
  const [tab, setTab] = useState("grafico");

  const estadosFiltrados = useMemo(
    () => regiaoFiltro === "Todos" ? ESTADOS : ESTADOS.filter((e) => e.regiao === regiaoFiltro),
    [regiaoFiltro]
  );

  const estadoSel = uf === "BR" ? null : ESTADOS.find((e) => e.uf === uf);
  const pracaSel = uf === "BR"
    ? PRACA_INDICADOR_NACIONAL
    : estadoSel?.pracas.find((p) => p.id === pracaId) ?? estadoSel?.pracas[0];

  const serie = useMemo(() => {
    if (!pracaSel) return null;
    // Usa dados reais CEPEA para o indicador nacional
    if (pracaSel.id === "nacional-cepea") {
      return { pracaId: "nacional-cepea", pracaNome: pracaSel.nome, uf: "BR", cotacoes: CEPEA_INDICADOR_NACIONAL };
    }
    return getSerieHistorica(pracaSel.id, pracaSel.nome, pracaSel.uf);
  }, [pracaSel]);

  const anoAtual = new Date().getFullYear();
  const anoInicio = anoAtual - Number(periodoAnos);

  const cotacoesFiltradas = useMemo(
    () => serie ? filtrarPorPeriodo(serie.cotacoes, anoInicio, anoAtual) : [],
    [serie, anoInicio, anoAtual]
  );

  const anuais = useMemo(() => calcularVariacaoAnual(agruparPorAno(cotacoesFiltradas)), [cotacoesFiltradas]);
  const mediaHistorica = useMemo(() => calcularMediaHistorica(cotacoesFiltradas), [cotacoesFiltradas]);
  const ultimas12 = useMemo(() => serie ? getUltimasCotacoes(serie.cotacoes, 12) : [], [serie]);

  const melhorAno = [...anuais].sort((a, b) => b.media - a.media)[0];
  const piorAno = [...anuais].sort((a, b) => a.media - b.media)[0];
  const ultimaMedia = ultimas12[ultimas12.length - 1]?.media ?? 0;
  const varVsMH = mediaHistorica ? Math.round(((ultimaMedia - mediaHistorica) / mediaHistorica) * 1000) / 10 : 0;

  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const dadosMensais = ultimas12.map((c) => ({
    label: `${mesesNomes[c.mes - 1]}/${String(c.ano).slice(2)}`,
    media: c.media, minima: c.minima, maxima: c.maxima,
  }));

  function exportarCSV() {
    const rows = [["Ano", "Mês", "Média (R$/arroba)", "Mínima", "Máxima", "Fonte"]];
    cotacoesFiltradas.forEach((c) => {
      rows.push([String(c.ano), String(c.mes), String(c.media), String(c.minima), String(c.maxima), c.fonte]);
    });
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arroba_${pracaSel?.id}_${periodoAnos}anos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Histórico da Arroba do Boi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Série histórica por praça — Fonte de referência: CEPEA/ESALQ-USP
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarCSV} className="gap-1.5 self-start">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[130px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Região</label>
          <Select value={regiaoFiltro} onValueChange={(v) => { setRegiaoFiltro(v); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REGIOES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Estado</label>
          <Select value={uf} onValueChange={(v) => {
            setUf(v);
            const estado = ESTADOS.find((e) => e.uf === v);
            if (estado?.pracas[0]) setPracaId(estado.pracas[0].id);
          }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {estadosFiltrados.map((e) => (
                <SelectItem key={e.uf} value={e.uf}>{e.uf} — {e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[200px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Praça</label>
          <Select value={pracaId} onValueChange={setPracaId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {estadoSel?.pracas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} {p.cepea && <span className="text-emerald-600 ml-1">✓ CEPEA</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[140px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Período</label>
          <Select value={periodoAnos} onValueChange={setPeriodoAnos}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Cotação atual", value: fmt(ultimaMedia),
            sub: <VarBadge v={varVsMH} />, desc: "vs média histórica",
          },
          {
            label: "Média histórica", value: fmt(mediaHistorica),
            sub: <span className="text-xs text-muted-foreground">{periodoAnos} anos</span>, desc: "",
          },
          {
            label: "Melhor ano", value: melhorAno ? String(melhorAno.ano) : "—",
            sub: melhorAno ? <span className="text-xs text-emerald-600">{fmt(melhorAno.media)}</span> : null, desc: "",
          },
          {
            label: "Pior ano", value: piorAno ? String(piorAno.ano) : "—",
            sub: piorAno ? <span className="text-xs text-red-500">{fmt(piorAno.media)}</span> : null, desc: "",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
              <div className="mt-1">{kpi.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pracaSel?.cepea && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Praça monitorada oficialmente pelo CEPEA/ESALQ-USP. Dados reais disponíveis em cepea.org.br para importação.
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-8">
          <TabsTrigger value="grafico" className="text-xs">Série Anual</TabsTrigger>
          <TabsTrigger value="mensal" className="text-xs">Últimos 12 meses</TabsTrigger>
          <TabsTrigger value="tabela" className="text-xs">Tabela</TabsTrigger>
        </TabsList>

        {/* Série anual */}
        <TabsContent value="grafico">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Média anual da arroba — {pracaSel?.nome} ({anoInicio}–{anoAtual})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={anuais} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="ano" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), ""]}
                    labelFormatter={(l) => `Ano: ${l}`}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <ReferenceLine y={mediaHistorica} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4"
                    label={{ value: "Média", position: "right", fontSize: 9 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="media" name="Média/arroba (R$)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="maxima" name="Máxima" stroke="#22c55e" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                  <Line type="monotone" dataKey="minima" name="Mínima" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Últimos 12 meses */}
        <TabsContent value="mensal">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cotações mensais — últimos 12 meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dadosMensais} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="media" name="Média (R$/arroba)" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabela */}
        <TabsContent value="tabela">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Histórico anual — {pracaSel?.nome}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Ano</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Média (R$/arr.)</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Mínima</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Máxima</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Var. anual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...anuais].reverse().map((a) => (
                      <tr key={a.ano} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 font-mono font-medium">{a.ano}</td>
                        <td className="px-4 py-2 text-right font-mono">{fmt(a.media)}</td>
                        <td className="px-4 py-2 text-right font-mono text-red-500">{fmt(a.minima)}</td>
                        <td className="px-4 py-2 text-right font-mono text-emerald-600">{fmt(a.maxima)}</td>
                        <td className="px-4 py-2 text-right"><VarBadge v={a.variacao} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nota CEPEA */}
      <div className="text-[10px] text-muted-foreground border border-border rounded-lg p-3 space-y-1">
        <p className="font-medium">Sobre os dados</p>
        <p>Estrutura baseada nas praças regionais CEPEA/ESALQ-USP. Dados históricos reais disponíveis para download em <strong>cepea.org.br</strong> (Excel, desde 1994). Para importar dados oficiais, use a função de importação CEPEA no menu de configurações.</p>
        <p>Praças marcadas com <span className="text-emerald-600 font-medium">✓ CEPEA</span> são monitoradas oficialmente pelo indicador regional CEPEA.</p>
      </div>
    </div>
  );
}
