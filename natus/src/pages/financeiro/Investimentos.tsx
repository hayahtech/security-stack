import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, TrendingUp, TrendingDown, Wallet, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

// ─── Types ───
interface Investment {
  id: string;
  name: string;
  classe: string;
  subclasse: string;
  institution: string;
  indexador: string;
  applied_date: string;
  applied_value: number;
  current_value: number;
  last_update: string;
  contracted_rate: string;
  liquidity: string;
  maturity_date: string | null;
  ir_type: string;
  auto_aporte: boolean;
  aporte_monthly: number;
  aporte_day: number;
  movements: { date: string; type: "aporte" | "resgate" | "atualizacao"; value: number; balance_after: number; note: string }[];
}

const CLASSES: Record<string, string[]> = {
  "Renda Fixa": ["CDB", "LCI", "LCA", "CRI", "CRA", "Tesouro Direto", "Poupança", "Debênture"],
  "Renda Variável": ["Ação", "FII", "ETF", "BDR", "Opção"],
  "Fundo de Investimento": ["Multimercado", "Renda Fixa", "Ações", "Cambial", "Internacional"],
  "Previdência": ["PGBL", "VGBL"],
  "Criptomoeda": ["Bitcoin", "Ethereum", "Stablecoin", "Altcoin"],
  "Outro": ["Outro"],
};
const INDEXADORES = ["CDI", "IPCA", "IGPM", "SELIC", "Pré-fixado", "IBOVESPA", "Dólar"];
const LIQUIDEZ = ["Diária", "D+1", "D+30", "No vencimento", "Sem liquidez"];
const IR_TYPES = ["Tabela regressiva", "15% (ações)", "Isento (LCI/LCA)", "Isento (poupança)", "Outro"];

const classColors: Record<string, string> = {
  "Renda Fixa": "149 62% 26%",
  "Renda Variável": "213 78% 37%",
  "Fundo de Investimento": "37 100% 50%",
  "Previdência": "270 60% 50%",
  "Criptomoeda": "330 70% 50%",
  "Outro": "180 60% 35%",
};

// ─── Mock Data ───
const mockInvestments: Investment[] = [
  { id: "inv1", name: "CDB Banco Inter 110% CDI", classe: "Renda Fixa", subclasse: "CDB", institution: "Banco Inter", indexador: "CDI", applied_date: "2024-06-15", applied_value: 50000, current_value: 58200, last_update: "2026-03-01", contracted_rate: "110% CDI", liquidity: "No vencimento", maturity_date: "2027-06-15", ir_type: "Tabela regressiva", auto_aporte: false, aporte_monthly: 0, aporte_day: 1, movements: [
    { date: "2024-06-15", type: "aporte", value: 50000, balance_after: 50000, note: "Aplicação inicial" },
    { date: "2025-06-15", type: "atualizacao", value: 0, balance_after: 55800, note: "Atualização anual" },
    { date: "2026-03-01", type: "atualizacao", value: 0, balance_after: 58200, note: "Atualização" },
  ]},
  { id: "inv2", name: "Tesouro IPCA+ 2029", classe: "Renda Fixa", subclasse: "Tesouro Direto", institution: "Tesouro Nacional", indexador: "IPCA", applied_date: "2024-01-10", applied_value: 30000, current_value: 37500, last_update: "2026-03-01", contracted_rate: "IPCA + 6,2%", liquidity: "Diária", maturity_date: "2029-05-15", ir_type: "Tabela regressiva", auto_aporte: true, aporte_monthly: 1000, aporte_day: 10, movements: [
    { date: "2024-01-10", type: "aporte", value: 30000, balance_after: 30000, note: "Aplicação inicial" },
    { date: "2025-01-10", type: "aporte", value: 12000, balance_after: 35200, note: "Aportes 2024" },
    { date: "2026-03-01", type: "atualizacao", value: 0, balance_after: 37500, note: "" },
  ]},
  { id: "inv3", name: "FII HGLG11", classe: "Renda Variável", subclasse: "FII", institution: "XP Investimentos", indexador: "IBOVESPA", applied_date: "2025-03-01", applied_value: 25000, current_value: 27800, last_update: "2026-03-01", contracted_rate: "—", liquidity: "Diária", maturity_date: null, ir_type: "15% (ações)", auto_aporte: false, aporte_monthly: 0, aporte_day: 1, movements: [
    { date: "2025-03-01", type: "aporte", value: 25000, balance_after: 25000, note: "Compra" },
  ]},
  { id: "inv4", name: "Fundo Alaska Black", classe: "Fundo de Investimento", subclasse: "Multimercado", institution: "BTG Pactual", indexador: "CDI", applied_date: "2025-06-01", applied_value: 20000, current_value: 21400, last_update: "2026-03-01", contracted_rate: "—", liquidity: "D+30", maturity_date: null, ir_type: "Tabela regressiva", auto_aporte: true, aporte_monthly: 500, aporte_day: 5, movements: [
    { date: "2025-06-01", type: "aporte", value: 20000, balance_after: 20000, note: "Aplicação inicial" },
    { date: "2025-12-01", type: "aporte", value: 3000, balance_after: 21200, note: "Aportes semestrais" },
  ]},
  { id: "inv5", name: "VGBL Brasilprev", classe: "Previdência", subclasse: "VGBL", institution: "Brasilprev", indexador: "CDI", applied_date: "2023-01-01", applied_value: 40000, current_value: 52000, last_update: "2026-03-01", contracted_rate: "100% CDI", liquidity: "D+1", maturity_date: null, ir_type: "Tabela regressiva", auto_aporte: true, aporte_monthly: 800, aporte_day: 15, movements: [
    { date: "2023-01-01", type: "aporte", value: 40000, balance_after: 40000, note: "Portabilidade" },
  ]},
  { id: "inv6", name: "LCI Sicoob 95% CDI", classe: "Renda Fixa", subclasse: "LCI", institution: "Sicoob", indexador: "CDI", applied_date: "2025-09-01", applied_value: 15000, current_value: 15900, last_update: "2026-03-01", contracted_rate: "95% CDI", liquidity: "No vencimento", maturity_date: "2026-09-01", ir_type: "Isento (LCI/LCA)", auto_aporte: false, aporte_monthly: 0, aporte_day: 1, movements: [
    { date: "2025-09-01", type: "aporte", value: 15000, balance_after: 15000, note: "" },
  ]},
  { id: "inv7", name: "Bitcoin", classe: "Criptomoeda", subclasse: "Bitcoin", institution: "Binance", indexador: "Dólar", applied_date: "2024-11-01", applied_value: 10000, current_value: 14200, last_update: "2026-03-01", contracted_rate: "—", liquidity: "Diária", maturity_date: null, ir_type: "Outro", auto_aporte: false, aporte_monthly: 0, aporte_day: 1, movements: [
    { date: "2024-11-01", type: "aporte", value: 10000, balance_after: 10000, note: "Compra" },
  ]},
];

const benchmarkData = [
  { month: "Out/25", carteira: 100, cdi: 100, ipca: 100, ibov: 100 },
  { month: "Nov/25", carteira: 101.2, cdi: 100.9, ipca: 100.4, ibov: 99.5 },
  { month: "Dez/25", carteira: 102.5, cdi: 101.8, ipca: 100.9, ibov: 101.2 },
  { month: "Jan/26", carteira: 103.8, cdi: 102.7, ipca: 101.5, ibov: 100.8 },
  { month: "Fev/26", carteira: 105.1, cdi: 103.6, ipca: 102.0, ibov: 103.2 },
  { month: "Mar/26", carteira: 106.9, cdi: 104.5, ipca: 102.6, ibov: 104.1 },
];

export default function Investimentos() {
  const { isEmpresarial } = useProfile();
  const [investments, setInvestments] = useState(mockInvestments);
  const [showForm, setShowForm] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [filterClass, setFilterClass] = useState("all");
  const [activeTab, setActiveTab] = useState("carteira");

  // Form state
  const [fName, setFName] = useState("");
  const [fClasse, setFClasse] = useState("");
  const [fSub, setFSub] = useState("");
  const [fInst, setFInst] = useState("");
  const [fIdx, setFIdx] = useState("");
  const [fDate, setFDate] = useState<Date | undefined>();
  const [fValue, setFValue] = useState("");
  const [fCurrent, setFCurrent] = useState("");
  const [fRate, setFRate] = useState("");
  const [fLiq, setFLiq] = useState("");
  const [fMaturity, setFMaturity] = useState<Date | undefined>();
  const [fIr, setFIr] = useState("");
  const [fAutoAporte, setFAutoAporte] = useState(false);
  const [fAporteVal, setFAporteVal] = useState("");
  const [fAporteDay, setFAporteDay] = useState("10");

  // Target allocation
  const [targetAlloc] = useState<Record<string, number>>({
    "Renda Fixa": 50, "Renda Variável": 20, "Fundo de Investimento": 10,
    "Previdência": 10, "Criptomoeda": 5, "Outro": 5,
  });

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Investimentos</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal.</p>
      </div>
    );
  }

  const totalApplied = investments.reduce((s, i) => s + i.applied_value, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.current_value, 0);
  const totalReturn = totalCurrent - totalApplied;
  const totalReturnPct = totalApplied > 0 ? (totalReturn / totalApplied) * 100 : 0;
  const monthReturn = totalCurrent * 0.012; // ~1.2% mock
  const yearReturn = totalCurrent * 0.069; // ~6.9% mock

  // Composition by class
  const compositionData = Object.keys(CLASSES).map(cls => {
    const total = investments.filter(i => i.classe === cls).reduce((s, i) => s + i.current_value, 0);
    return { name: cls, value: total, pct: totalCurrent > 0 ? (total / totalCurrent) * 100 : 0 };
  }).filter(d => d.value > 0);

  // Liquidity analysis
  const liquidDaily = investments.filter(i => i.liquidity === "Diária" || i.liquidity === "D+1").reduce((s, i) => s + i.current_value, 0);
  const liquid30 = investments.filter(i => ["Diária", "D+1", "D+30"].includes(i.liquidity)).reduce((s, i) => s + i.current_value, 0);
  const liquidYear = investments.filter(i => {
    if (!i.maturity_date) return true;
    return differenceInMonths(parseISO(i.maturity_date), new Date()) <= 12;
  }).reduce((s, i) => s + i.current_value, 0);

  // Filtered list
  const filtered = filterClass === "all" ? investments : investments.filter(i => i.classe === filterClass);

  // Ranking
  const ranked = [...investments].map(i => ({
    ...i, returnPct: i.applied_value > 0 ? ((i.current_value - i.applied_value) / i.applied_value) * 100 : 0
  })).sort((a, b) => b.returnPct - a.returnPct);

  const resetForm = () => {
    setFName(""); setFClasse(""); setFSub(""); setFInst(""); setFIdx(""); setFDate(undefined);
    setFValue(""); setFCurrent(""); setFRate(""); setFLiq(""); setFMaturity(undefined);
    setFIr(""); setFAutoAporte(false); setFAporteVal(""); setFAporteDay("10");
  };

  const handleCreate = () => {
    const applied = parseFloat(fValue) || 0;
    const current = parseFloat(fCurrent) || applied;
    if (!fName || applied <= 0) { toast({ title: "Preencha nome e valor", variant: "destructive" }); return; }
    const newInv: Investment = {
      id: `inv-${Date.now()}`, name: fName, classe: fClasse || "Outro", subclasse: fSub || "",
      institution: fInst, indexador: fIdx, applied_date: fDate ? format(fDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      applied_value: applied, current_value: current, last_update: format(new Date(), "yyyy-MM-dd"),
      contracted_rate: fRate, liquidity: fLiq || "Diária",
      maturity_date: fMaturity ? format(fMaturity, "yyyy-MM-dd") : null,
      ir_type: fIr || "Outro", auto_aporte: fAutoAporte,
      aporte_monthly: parseFloat(fAporteVal) || 0, aporte_day: parseInt(fAporteDay) || 10,
      movements: [{ date: fDate ? format(fDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), type: "aporte", value: applied, balance_after: applied, note: "Aplicação inicial" }],
    };
    setInvestments(prev => [...prev, newInv]);
    setShowForm(false); resetForm();
    toast({ title: "Investimento cadastrado! 📈" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground">Carteira pessoal de investimentos</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo Investimento</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Patrimônio investido</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalCurrent)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Rentabilidade no mês</p>
          <p className="text-2xl font-bold text-primary">{fmt(monthReturn)}</p>
          <p className="text-xs text-primary">{fmtPct(1.2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Rentabilidade no ano</p>
          <p className="text-2xl font-bold text-primary">{fmt(yearReturn)}</p>
          <p className="text-xs text-primary">{fmtPct(6.9)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Rentabilidade total</p>
          <p className={cn("text-2xl font-bold", totalReturn >= 0 ? "text-primary" : "text-destructive")}>{fmt(totalReturn)}</p>
          <p className={cn("text-xs", totalReturn >= 0 ? "text-primary" : "text-destructive")}>{fmtPct(totalReturnPct)}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="diversificacao">Diversificação</TabsTrigger>
          <TabsTrigger value="liquidez">Liquidez</TabsTrigger>
          <TabsTrigger value="rentabilidade">Rentabilidade</TabsTrigger>
        </TabsList>

        {/* ─── CARTEIRA ─── */}
        <TabsContent value="carteira" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Composition Pie */}
            <Card>
              <CardHeader><CardTitle className="text-base">Composição da Carteira</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={compositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, pct }) => `${name.split(" ")[0]} ${pct.toFixed(0)}%`} labelLine={false}>
                      {compositionData.map((entry) => (
                        <Cell key={entry.name} fill={`hsl(${classColors[entry.name] || "0 0% 50%"})`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Evolution Line */}
            <Card>
              <CardHeader><CardTitle className="text-base">Evolução vs Benchmarks</CardTitle><CardDescription>Base 100</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={benchmarkData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={[98, "auto"]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="carteira" stroke="hsl(var(--primary))" strokeWidth={2.5} name="Carteira" dot={false} />
                    <Line type="monotone" dataKey="cdi" stroke="hsl(var(--info))" strokeWidth={1.5} strokeDasharray="5 5" name="CDI" dot={false} />
                    <Line type="monotone" dataKey="ipca" stroke="hsl(var(--warning))" strokeWidth={1.5} strokeDasharray="5 5" name="IPCA" dot={false} />
                    <Line type="monotone" dataKey="ibov" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="5 5" name="IBOV" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Investment Table */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Investimentos</CardTitle>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar classe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as classes</SelectItem>
                  {Object.keys(CLASSES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Instituição</TableHead>
                      <TableHead className="text-right">Aplicado</TableHead>
                      <TableHead className="text-right">Atual</TableHead>
                      <TableHead className="text-right">Rent. R$</TableHead>
                      <TableHead className="text-right">Rent. %</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Liquidez</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(inv => {
                      const ret = inv.current_value - inv.applied_value;
                      const retPct = inv.applied_value > 0 ? (ret / inv.applied_value) * 100 : 0;
                      return (
                        <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInv(inv)}>
                          <TableCell className="font-medium">{inv.name}</TableCell>
                          <TableCell><Badge variant="outline" style={{ borderColor: `hsl(${classColors[inv.classe] || "0 0% 50%"})`, color: `hsl(${classColors[inv.classe] || "0 0% 50%"})` }}>{inv.subclasse || inv.classe}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{inv.institution}</TableCell>
                          <TableCell className="text-right">{fmt(inv.applied_value)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(inv.current_value)}</TableCell>
                          <TableCell className={cn("text-right", ret >= 0 ? "text-primary" : "text-destructive")}>{fmt(ret)}</TableCell>
                          <TableCell className={cn("text-right font-medium", retPct >= 0 ? "text-primary" : "text-destructive")}>{fmtPct(retPct)}</TableCell>
                          <TableCell className="text-muted-foreground">{inv.maturity_date ? format(parseISO(inv.maturity_date), "dd/MM/yyyy") : "—"}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{inv.liquidity}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── DIVERSIFICAÇÃO ─── */}
        <TabsContent value="diversificacao" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Alocação Atual vs Ideal</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(CLASSES).map(cls => {
                  const currentPct = compositionData.find(c => c.name === cls)?.pct || 0;
                  const target = targetAlloc[cls] || 0;
                  const diff = currentPct - target;
                  const isOff = Math.abs(diff) > 5;
                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: `hsl(${classColors[cls] || "0 0% 50%"})` }} />
                          <span className="font-medium text-foreground">{cls}</span>
                          {isOff && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">Ideal: {target}%</span>
                          <span className={cn("font-medium", isOff ? "text-warning" : "text-foreground")}>Atual: {currentPct.toFixed(1)}%</span>
                          <span className={cn("text-xs", diff > 0 ? "text-warning" : diff < 0 ? "text-info" : "text-muted-foreground")}>
                            {diff > 0 ? `+${diff.toFixed(1)}%` : diff < 0 ? `${diff.toFixed(1)}%` : "OK"}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(currentPct, 100)}%`, background: `hsl(${classColors[cls] || "0 0% 50%"})` }} />
                        <div className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${target}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── LIQUIDEZ ─── */}
        <TabsContent value="liquidez" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Disponível hoje</p>
              <p className="text-2xl font-bold text-primary">{fmt(liquidDaily)}</p>
              <p className="text-xs text-muted-foreground">{(liquidDaily / totalCurrent * 100).toFixed(0)}% da carteira</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Disponível em 30 dias</p>
              <p className="text-2xl font-bold text-foreground">{fmt(liquid30)}</p>
              <p className="text-xs text-muted-foreground">{(liquid30 / totalCurrent * 100).toFixed(0)}% da carteira</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Disponível em 1 ano</p>
              <p className="text-2xl font-bold text-foreground">{fmt(liquidYear)}</p>
              <p className="text-xs text-muted-foreground">{(liquidYear / totalCurrent * 100).toFixed(0)}% da carteira</p>
            </CardContent></Card>
          </div>

          {/* Maturity calendar */}
          <Card>
            <CardHeader><CardTitle className="text-base">Vencimentos nos Próximos 12 Meses</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {investments.filter(i => i.maturity_date && differenceInMonths(parseISO(i.maturity_date), new Date()) <= 12 && differenceInMonths(parseISO(i.maturity_date), new Date()) >= 0)
                  .sort((a, b) => a.maturity_date!.localeCompare(b.maturity_date!))
                  .map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-foreground">{inv.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.institution} • {inv.liquidity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{fmt(inv.current_value)}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(inv.maturity_date!), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                  ))}
                {investments.filter(i => i.maturity_date && differenceInMonths(parseISO(i.maturity_date), new Date()) <= 12 && differenceInMonths(parseISO(i.maturity_date), new Date()) >= 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum vencimento nos próximos 12 meses</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── RENTABILIDADE ─── */}
        <TabsContent value="rentabilidade" className="space-y-6">
          {/* Ranking */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base text-primary">🏆 Melhores desempenhos</CardTitle></CardHeader>
              <CardContent>
                {ranked.slice(0, 3).map((inv, idx) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.subclasse}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="font-semibold">{fmtPct(inv.returnPct)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base text-destructive">📉 Piores desempenhos</CardTitle></CardHeader>
              <CardContent>
                {ranked.slice(-3).reverse().map((inv, idx) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.subclasse}</p>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: inv.returnPct >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                      {inv.returnPct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="font-semibold">{fmtPct(inv.returnPct)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Comparison bar chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Rentabilidade por Investimento vs CDI (9,5% a.a.)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={ranked.map(i => ({ name: i.name.length > 20 ? i.name.substring(0, 20) + "…" : i.name, rentabilidade: i.returnPct, cdi: 9.5 * (differenceInMonths(new Date(), parseISO(i.applied_date)) / 12) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={v => `${v.toFixed(0)}%`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={150} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="rentabilidade" name="Rentabilidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="cdi" name="CDI proporcional" fill="hsl(var(--muted-foreground) / 0.3)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Projection */}
          <Card>
            <CardHeader><CardTitle className="text-base">Projeção de Crescimento</CardTitle><CardDescription>Mantendo aportes atuais ({fmt(investments.filter(i => i.auto_aporte).reduce((s, i) => s + i.aporte_monthly, 0))}/mês) a 10% a.a.</CardDescription></CardHeader>
            <CardContent>
              {(() => {
                const monthlyAporte = investments.filter(i => i.auto_aporte).reduce((s, i) => s + i.aporte_monthly, 0);
                const projData = [];
                let balance = totalCurrent;
                const monthlyRate = Math.pow(1.10, 1/12) - 1;
                for (let i = 0; i <= 60; i += 6) {
                  projData.push({ month: i === 0 ? "Hoje" : `+${i}m`, valor: Math.round(balance) });
                  for (let j = 0; j < 6; j++) { balance = balance * (1 + monthlyRate) + monthlyAporte; }
                }
                return (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={projData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Projeção" />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog open={!!selectedInv} onOpenChange={() => setSelectedInv(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedInv && (() => {
            const inv = investments.find(i => i.id === selectedInv.id) || selectedInv;
            const ret = inv.current_value - inv.applied_value;
            const retPct = inv.applied_value > 0 ? (ret / inv.applied_value) * 100 : 0;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {inv.name}
                    <Badge variant="outline" style={{ borderColor: `hsl(${classColors[inv.classe] || "0 0% 50%"})`, color: `hsl(${classColors[inv.classe] || "0 0% 50%"})` }}>{inv.subclasse}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground">Instituição</p><p className="font-medium text-foreground">{inv.institution}</p></div>
                    <div><p className="text-xs text-muted-foreground">Indexador</p><p className="font-medium text-foreground">{inv.indexador} • {inv.contracted_rate}</p></div>
                    <div><p className="text-xs text-muted-foreground">Aplicado</p><p className="font-medium text-foreground">{fmt(inv.applied_value)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Valor atual</p><p className="font-medium text-foreground">{fmt(inv.current_value)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Rentabilidade</p><p className={cn("font-medium", ret >= 0 ? "text-primary" : "text-destructive")}>{fmt(ret)} ({fmtPct(retPct)})</p></div>
                    <div><p className="text-xs text-muted-foreground">Liquidez</p><p className="font-medium text-foreground">{inv.liquidity}</p></div>
                    <div><p className="text-xs text-muted-foreground">Vencimento</p><p className="font-medium text-foreground">{inv.maturity_date ? format(parseISO(inv.maturity_date), "dd/MM/yyyy") : "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">IR</p><p className="font-medium text-foreground">{inv.ir_type}</p></div>
                  </div>
                  {inv.auto_aporte && (
                    <Badge variant="secondary">Aporte automático: {fmt(inv.aporte_monthly)}/mês (dia {inv.aporte_day})</Badge>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Movimentações</p>
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Saldo</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {[...inv.movements].reverse().map((mov, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{format(parseISO(mov.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant={mov.type === "aporte" ? "default" : mov.type === "resgate" ? "destructive" : "secondary"} className="text-xs">
                                {mov.type === "aporte" ? "Aporte" : mov.type === "resgate" ? "Resgate" : "Atualização"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{mov.type !== "atualizacao" ? fmt(mov.value) : "—"}</TableCell>
                            <TableCell className="text-right font-medium">{fmt(mov.balance_after)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── NEW INVESTMENT FORM ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Investimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: CDB Banco Inter 110% CDI" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Classe</Label>
                <Select value={fClasse} onValueChange={v => { setFClasse(v); setFSub(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{Object.keys(CLASSES).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subclasse</Label>
                <Select value={fSub} onValueChange={setFSub} disabled={!fClasse}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{(CLASSES[fClasse] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Instituição</Label><Input value={fInst} onChange={e => setFInst(e.target.value)} className="mt-1" /></div>
              <div><Label>Indexador</Label>
                <Select value={fIdx} onValueChange={setFIdx}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{INDEXADORES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div><Label>Rentabilidade contratada</Label><Input value={fRate} onChange={e => setFRate(e.target.value)} placeholder="Ex: 110% CDI, IPCA + 6,2%" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor aplicado (R$)</Label><Input type="number" value={fValue} onChange={e => setFValue(e.target.value)} className="mt-1" /></div>
              <div><Label>Valor atual (R$)</Label><Input type="number" value={fCurrent} onChange={e => setFCurrent(e.target.value)} placeholder="Igual ao aplicado" className="mt-1" /></div>
            </div>
            <div>
              <Label>Data de aplicação</Label>
              <Popover><PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full mt-1 justify-start", !fDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />{fDate ? format(fDate, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fDate} onSelect={setFDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Liquidez</Label>
                <Select value={fLiq} onValueChange={setFLiq}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{LIQUIDEZ.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>IR</Label>
                <Select value={fIr} onValueChange={setFIr}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{IR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div>
              <Label>Vencimento (opcional)</Label>
              <Popover><PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full mt-1 justify-start", !fMaturity && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />{fMaturity ? format(fMaturity, "dd/MM/yyyy") : "Sem vencimento"}
                </Button>
              </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fMaturity} onSelect={setFMaturity} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Switch checked={fAutoAporte} onCheckedChange={setFAutoAporte} />
              <Label>Aporte mensal automático</Label>
            </div>
            {fAutoAporte && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor mensal (R$)</Label><Input type="number" value={fAporteVal} onChange={e => setFAporteVal(e.target.value)} className="mt-1" /></div>
                <div><Label>Dia do mês</Label><Input type="number" value={fAporteDay} onChange={e => setFAporteDay(e.target.value)} min="1" max="28" className="mt-1" /></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button><Button onClick={handleCreate}>Cadastrar 📈</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
