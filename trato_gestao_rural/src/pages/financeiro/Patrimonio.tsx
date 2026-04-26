import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building, Plus, Shield, TrendingUp, DollarSign, Home, Car, Tractor,
  Upload, Filter, X, Eye, Edit, Landmark,
} from "lucide-react";
import {
  mockBens, BemPatrimonial, BemTipo, BemSituacao,
  bemTipoLabels, bemTipoColors, situacaoLabels, getAllFinanciamentos,
} from "@/data/patrimonio-mock";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

const PIE_COLORS = ["hsl(149, 62%, 26%)", "hsl(213, 78%, 37%)", "hsl(37, 100%, 50%)", "hsl(280, 60%, 50%)", "hsl(0, 72%, 50%)", "hsl(180, 60%, 40%)", "hsl(330, 60%, 50%)"];

function getIcon(tipo: BemTipo) {
  if (tipo === "imovel_rural" || tipo === "imovel_urbano") return Home;
  if (tipo === "veiculo") return Car;
  if (tipo === "maquina") return Tractor;
  if (tipo === "investimento") return TrendingUp;
  return Building;
}

// ── Summary ──
function PatrimonioSummary({ bens }: { bens: BemPatrimonial[] }) {
  const financiamentos = getAllFinanciamentos();
  const bruto = bens.reduce((s, b) => s + b.valorMercado, 0);
  const saldoFinanciado = bens.filter(b => b.financiamentoId).reduce((s, b) => {
    const fin = financiamentos.find(f => f.id === b.financiamentoId);
    return s + (fin?.saldoDevedor || 0);
  }, 0);
  const liquido = bruto - saldoFinanciado;
  const quitados = bens.filter(b => b.situacao === "quitado").length;
  const financiados = bens.filter(b => b.situacao === "financiado").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { title: "Patrimônio Bruto", value: fmt(bruto), icon: Building, desc: "Valor de mercado total" },
        { title: "Total Financiado", value: fmt(saldoFinanciado), icon: Landmark, desc: "Saldo devedor" },
        { title: "Patrimônio Líquido", value: fmt(liquido), icon: TrendingUp, desc: "Bruto - Financiado" },
        { title: "Bens", value: `${quitados} quitados / ${financiados} financiados`, icon: Shield, desc: `${bens.length} total` },
      ].map(c => (
        <Card key={c.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="text-xl font-bold">{c.value}</p>
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

// ── Composition chart ──
function ComposicaoChart({ bens }: { bens: BemPatrimonial[] }) {
  const data = useMemo(() => {
    const byType: Record<string, number> = {};
    bens.forEach(b => {
      const label = bemTipoLabels[b.tipo];
      byType[label] = (byType[label] || 0) + b.valorMercado;
    });
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [bens]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Composição Patrimonial</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <RechartsTooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Evolution chart ──
function EvolucaoChart({ bens }: { bens: BemPatrimonial[] }) {
  const financiamentos = getAllFinanciamentos();
  const data = useMemo(() => {
    const months: { mes: string; bruto: number; liquido: number }[] = [];
    const hoje = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const bruto = bens.reduce((s, b) => s + b.valorMercado, 0);
      const saldoFin = bens.filter(b => b.financiamentoId).reduce((s, b) => {
        const fin = financiamentos.find(f => f.id === b.financiamentoId);
        if (!fin) return s;
        const parcelasAteMes = fin.parcelas.filter(p => new Date(p.vencimento) <= d);
        const amortAcum = parcelasAteMes.reduce((a, p) => a + p.amortizacao, 0);
        return s + (fin.valorFinanciado - amortAcum);
      }, 0);
      months.push({ mes: mesLabel, bruto, liquido: bruto - saldoFin });
    }
    return months;
  }, [bens]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Evolução do Patrimônio Líquido — 12 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <RechartsTooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="bruto" stroke="hsl(213, 78%, 37%)" name="Bruto" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="liquido" stroke="hsl(149, 62%, 26%)" name="Líquido" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Form ──
function NovoBemForm({ onClose }: { onClose: () => void }) {
  const financiamentos = getAllFinanciamentos();
  const [tipo, setTipo] = useState<BemTipo>("imovel_rural");
  const [situacao, setSituacao] = useState<BemSituacao>("quitado");
  const [segurado, setSegurado] = useState(false);

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-4 pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome/Descrição</Label>
            <Input placeholder="Ex: Fazenda Boa Vista — 450 ha" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as BemTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(bemTipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Situação</Label>
            <Select value={situacao} onValueChange={v => setSituacao(v as BemSituacao)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(situacaoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor de aquisição</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Data de aquisição</Label>
            <Input type="date" />
          </div>
          <div className="space-y-1.5">
            <Label>Valor de mercado atual</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Data da avaliação</Label>
            <Input type="date" />
          </div>
          {situacao === "financiado" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Financiamento vinculado</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {financiamentos.map(f => <SelectItem key={f.id} value={f.id}>{f.nome} — {f.instituicao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {(tipo === "imovel_rural" || tipo === "imovel_urbano") && (
            <>
              <div className="space-y-1.5">
                <Label>Localização</Label>
                <Input placeholder="Cidade, Estado" />
              </div>
              <div className="space-y-1.5">
                <Label>Área</Label>
                <div className="flex gap-2">
                  <Input type="number" className="flex-1" />
                  <Select defaultValue="ha">
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ha">ha</SelectItem>
                      <SelectItem value="m2">m²</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {tipo === "imovel_rural" && (
                <div className="space-y-1.5">
                  <Label>Matrícula / INCRA / NIRF</Label>
                  <Input />
                </div>
              )}
            </>
          )}
          {tipo === "veiculo" && (
            <div className="space-y-1.5">
              <Label>Placa</Label>
              <Input placeholder="ABC-1D23" />
            </div>
          )}
        </div>

        <Separator />
        <div className="flex items-center gap-2">
          <Switch checked={segurado} onCheckedChange={setSegurado} />
          <Label>Bem segurado</Label>
        </div>
        {segurado && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Seguradora</Label><Input /></div>
            <div className="space-y-1.5"><Label>Nº Apólice</Label><Input /></div>
            <div className="space-y-1.5"><Label>Valor segurado</Label><Input type="number" /></div>
            <div className="space-y-1.5"><Label>Vencimento</Label><Input type="date" /></div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Documentação</Label>
          <Input type="file" accept=".pdf,.jpg,.png" multiple />
          <p className="text-xs text-muted-foreground">Escritura, CRV, NF, etc.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={2} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onClose} className="gap-1"><Building className="h-4 w-4" /> Salvar Bem</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Main ──
export default function Patrimonio() {
  const [bens] = useState(mockBens);
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const financiamentos = getAllFinanciamentos();

  const filtered = useMemo(() => {
    if (filterTipo === "todos") return bens;
    return bens.filter(b => b.tipo === filterTipo);
  }, [bens, filterTipo]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> Patrimônio
          </h1>
          <p className="text-sm text-muted-foreground">Controle patrimonial de bens pessoais e empresariais</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Bem</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Cadastrar Bem Patrimonial</DialogTitle></DialogHeader>
            <NovoBemForm onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <PatrimonioSummary bens={bens} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComposicaoChart bens={bens} />
        <EvolucaoChart bens={bens} />
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {Object.entries(bemTipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {filterTipo !== "todos" && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setFilterTipo("todos")}>
                <X className="h-3 w-3" /> Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bem</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Aquisição</TableHead>
                  <TableHead className="text-right">Valor Atual</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Financiamento</TableHead>
                  <TableHead>Seguro</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => {
                  const Icon = getIcon(b.tipo);
                  const variacao = b.valorAquisicao > 0 ? ((b.valorMercado - b.valorAquisicao) / b.valorAquisicao * 100) : 0;
                  const fin = b.financiamentoId ? financiamentos.find(f => f.id === b.financiamentoId) : null;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm">{b.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={bemTipoColors[b.tipo] + " border-0 text-xs"}>{bemTipoLabels[b.tipo]}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fmt(b.valorAquisicao)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmt(b.valorMercado)}</TableCell>
                      <TableCell className={`text-right text-sm font-medium ${variacao >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {variacao >= 0 ? "+" : ""}{variacao.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{situacaoLabels[b.situacao]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{fin ? fin.nome : "—"}</TableCell>
                      <TableCell>
                        {b.segurado ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-0 text-xs">
                            <Shield className="h-3 w-3 mr-1" /> Sim
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
