import { useState, useEffect, useMemo } from "react";
import { CloudRain, Download, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine, Cell,
} from "recharts";
import { ESTADOS } from "@/data/brasil-locais";
import {
  fetchPluvioDecadas, classificarAno, PluvioDecadas,
} from "@/lib/weather-service";

const PERIODOS = [
  { value: "10", label: "10 anos" },
  { value: "20", label: "20 anos" },
  { value: "30", label: "30 anos" },
];

const REGIOES = ["Todos", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

function fmtMm(v: number) {
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mm`;
}

export default function HistoricoPluviometrico() {
  const [uf, setUf] = useState("PA");
  const [localId, setLocalId] = useState("pa-re");
  const [periodoAnos, setPeriodoAnos] = useState("30");
  const [regiaoFiltro, setRegiaoFiltro] = useState("Todos");
  const [tab, setTab] = useState("anual");

  const [dados, setDados] = useState<PluvioDecadas | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const estadosFiltrados = useMemo(
    () => regiaoFiltro === "Todos" ? ESTADOS : ESTADOS.filter((e) => e.regiao === regiaoFiltro),
    [regiaoFiltro]
  );

  const estadoSel = ESTADOS.find((e) => e.uf === uf);
  const localSel = estadoSel?.pracas.find((p) => p.id === localId) ?? estadoSel?.pracas[0];

  useEffect(() => {
    if (!localSel) return;
    setLoading(true);
    setErro(null);
    fetchPluvioDecadas(
      localSel.lat, localSel.lon,
      localSel.nome, localSel.uf,
      Number(periodoAnos)
    )
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [localSel, periodoAnos]);

  const anosVisiveis = useMemo(() => {
    if (!dados) return [];
    const anoFim = new Date().getFullYear() - 1;
    const anoInicio = anoFim - Number(periodoAnos) + 1;
    return dados.anos.filter((a) => a.ano >= anoInicio && a.ano <= anoFim);
  }, [dados, periodoAnos]);

  const dadosGrafico = useMemo(() => anosVisiveis.map((a) => ({
    ano: a.ano,
    chuva: a.totalMm,
    media5a: a.mediaMovel5a,
    anomalia: a.anomalia,
  })), [anosVisiveis]);

  // Meses do último ano com dados
  const ultimoAno = anosVisiveis[anosVisiveis.length - 1];
  const dadosMensais = useMemo(() => {
    if (!ultimoAno) return [];
    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return (ultimoAno.meses ?? []).map((m) => ({
      label: meses[m.mes - 1],
      chuva: m.totalMm,
    }));
  }, [ultimoAno]);

  const totalPeriodo = anosVisiveis.reduce((s, a) => s + a.totalMm, 0);
  const mediaAnual = dados?.mediaHistorica ?? 0;
  const anoMaisChuvoso = [...anosVisiveis].sort((a, b) => b.totalMm - a.totalMm)[0];
  const anoMaiseco = [...anosVisiveis].sort((a, b) => a.totalMm - b.totalMm)[0];
  const anoAtual = ultimoAno;
  const classAtual = anoAtual ? classificarAno(anoAtual.anomalia) : null;

  function exportarCSV() {
    const rows = [["Ano", "Total (mm)", "Média Móvel 5a (mm)", "Anomalia (%)"]];
    anosVisiveis.forEach((a) => {
      rows.push([String(a.ano), String(a.totalMm), String(a.mediaMovel5a ?? ""), String(a.anomalia ?? "")]);
    });
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pluvio_${localSel?.id}_${periodoAnos}anos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Histórico Pluviométrico</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Série histórica de chuvas por município — Fonte: Open-Meteo Archive (dados desde 1940)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarCSV} disabled={!dados} className="gap-1.5 self-start">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[130px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Região</label>
          <Select value={regiaoFiltro} onValueChange={(v) => setRegiaoFiltro(v)}>
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
            if (estado?.pracas[0]) setLocalId(estado.pracas[0].id);
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
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Localidade</label>
          <Select value={localId} onValueChange={setLocalId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {estadoSel?.pracas.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
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

      {/* Loading / Erro */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Carregando dados históricos via Open-Meteo Archive…</span>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Erro ao buscar dados: {erro}. Verifique sua conexão.
        </div>
      )}

      {!loading && !erro && dados && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: `Média anual (${periodoAnos}a)`,
                value: fmtMm(mediaAnual),
                sub: null,
              },
              {
                label: `Ano mais chuvoso`,
                value: anoMaisChuvoso ? String(anoMaisChuvoso.ano) : "—",
                sub: anoMaisChuvoso
                  ? <span className="text-xs text-blue-600 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />{fmtMm(anoMaisChuvoso.totalMm)}</span>
                  : null,
              },
              {
                label: `Ano mais seco`,
                value: anoMaiseco ? String(anoMaiseco.ano) : "—",
                sub: anoMaiseco
                  ? <span className="text-xs text-amber-600 flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{fmtMm(anoMaiseco.totalMm)}</span>
                  : null,
              },
              {
                label: `Ano mais recente`,
                value: anoAtual ? String(anoAtual.ano) : "—",
                sub: classAtual && anoAtual
                  ? <span className={`text-xs font-medium ${classAtual.color}`}>{fmtMm(anoAtual.totalMm)} — {classAtual.label}</span>
                  : null,
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

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-8">
              <TabsTrigger value="anual" className="text-xs">Série Anual</TabsTrigger>
              <TabsTrigger value="anomalia" className="text-xs">Anomalias</TabsTrigger>
              <TabsTrigger value="mensal" className="text-xs">Meses ({ultimoAno?.ano})</TabsTrigger>
              <TabsTrigger value="tabela" className="text-xs">Tabela</TabsTrigger>
            </TabsList>

            {/* Série anual */}
            <TabsContent value="anual">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CloudRain className="h-4 w-4" />
                    Precipitação anual — {localSel?.nome} ({anosVisiveis[0]?.ano}–{anosVisiveis[anosVisiveis.length - 1]?.ano})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dadosGrafico} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="ano" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}mm`} />
                      <Tooltip
                        formatter={(v: number, name: string) => [fmtMm(v), name]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <ReferenceLine y={mediaAnual} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4"
                        label={{ value: "Média", position: "right", fontSize: 9 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="chuva" name="Precipitação (mm)" radius={[3, 3, 0, 0]}>
                        {dadosGrafico.map((entry) => {
                          const cls = classificarAno(entry.anomalia ?? null);
                          const colorMap: Record<string, string> = {
                            "Muito chuvoso": "#1d4ed8",
                            "Chuvoso": "#0ea5e9",
                            "Normal": "#22c55e",
                            "Seco": "#f59e0b",
                            "Muito seco": "#ef4444",
                          };
                          return <Cell key={entry.ano} fill={colorMap[cls.label] ?? "#6b7280"} />;
                        })}
                      </Bar>
                      <Line type="monotone" dataKey="media5a" name="Média móvel 5a" stroke="#8b5cf6"
                        strokeWidth={2} dot={false} connectNulls />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      { label: "Muito chuvoso", color: "bg-blue-600" },
                      { label: "Chuvoso", color: "bg-sky-400" },
                      { label: "Normal", color: "bg-green-500" },
                      { label: "Seco", color: "bg-amber-400" },
                      { label: "Muito seco", color: "bg-red-500" },
                    ].map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className={`w-2.5 h-2.5 rounded-sm ${c.color}`} />
                        {c.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Anomalias */}
            <TabsContent value="anomalia">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Anomalia pluviométrica (% vs média histórica)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosGrafico} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="ano" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(v: number) => [`${v}%`, "Anomalia"]}
                        contentStyle={{ fontSize: 11 }}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1.5} />
                      <Bar dataKey="anomalia" name="Anomalia (%)" radius={[3, 3, 0, 0]}>
                        {dadosGrafico.map((entry) => (
                          <Cell key={entry.ano} fill={(entry.anomalia ?? 0) >= 0 ? "#3b82f6" : "#f59e0b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Barras azuis = anos acima da média. Barras âmbar = anos abaixo da média. Referência: média dos {periodoAnos} anos selecionados ({fmtMm(mediaAnual)}/ano).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mensal */}
            <TabsContent value="mensal">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribuição mensal de chuvas — {ultimoAno?.ano}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dadosMensais} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}mm`} />
                      <Tooltip formatter={(v: number) => [fmtMm(v), "Chuva"]} contentStyle={{ fontSize: 11 }} />
                      <Bar dataKey="chuva" name="Chuva (mm)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tabela */}
            <TabsContent value="tabela">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Dados históricos — {localSel?.nome}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Ano</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total (mm)</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Média móvel 5a</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Anomalia</th>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Classificação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...anosVisiveis].reverse().map((a) => {
                          const cls = classificarAno(a.anomalia);
                          return (
                            <tr key={a.ano} className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-2 font-mono font-medium">{a.ano}</td>
                              <td className="px-4 py-2 text-right font-mono">{fmtMm(a.totalMm)}</td>
                              <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                                {a.mediaMovel5a ? fmtMm(a.mediaMovel5a) : "—"}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {a.anomalia !== null
                                  ? <span className={a.anomalia >= 0 ? "text-blue-600" : "text-amber-600"}>
                                      {a.anomalia > 0 ? "+" : ""}{a.anomalia}%
                                    </span>
                                  : "—"}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cls.bg} ${cls.color}`}>
                                  {cls.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-[10px] text-muted-foreground border border-border rounded-lg p-3">
            Dados fornecidos por <strong>Open-Meteo Historical Weather API</strong> (archive-api.open-meteo.com) — gratuito, sem necessidade de chave de API.
            Cobertura global com resolução de ~10km. Dados disponíveis desde 1940. Atualizados diariamente com defasagem de ~5 dias.
          </div>
        </>
      )}
    </div>
  );
}
