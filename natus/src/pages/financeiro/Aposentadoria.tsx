import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Umbrella, CheckCircle, AlertTriangle, XCircle, Save, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend } from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Scenario {
  id: string;
  name: string;
  age: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentWealth: number;
  monthlyContribution: number;
  accumulationReturn: number;
  incomeReturn: number;
  inflation: number;
  inss: number;
  desiredIncome: number;
}

const defaultScenario: Omit<Scenario, "id" | "name"> = {
  age: 35, retirementAge: 60, lifeExpectancy: 85,
  currentWealth: 92000, monthlyContribution: 2300,
  accumulationReturn: 10, incomeReturn: 8, inflation: 4.5,
  inss: 2500, desiredIncome: 12000,
};

// Previdência data
const previdenciaPlans = [
  { name: "VGBL Brasilprev", type: "VGBL", balance: 52000, monthlyContribution: 800 },
  { name: "PGBL XP Vida", type: "PGBL", balance: 0, monthlyContribution: 0 },
];

const irProgressiva = [
  { faixa: "Até R$ 2.259,20", aliquota: "Isento", dedução: "—" },
  { faixa: "R$ 2.259,21 a R$ 2.826,65", aliquota: "7,5%", dedução: "R$ 169,44" },
  { faixa: "R$ 2.826,66 a R$ 3.751,05", aliquota: "15%", dedução: "R$ 381,44" },
  { faixa: "R$ 3.751,06 a R$ 4.664,68", aliquota: "22,5%", dedução: "R$ 662,77" },
  { faixa: "Acima de R$ 4.664,68", aliquota: "27,5%", dedução: "R$ 896,00" },
];

const irRegressiva = [
  { prazo: "Até 2 anos", aliquota: "35%" },
  { prazo: "2 a 4 anos", aliquota: "30%" },
  { prazo: "4 a 6 anos", aliquota: "25%" },
  { prazo: "6 a 8 anos", aliquota: "20%" },
  { prazo: "8 a 10 anos", aliquota: "15%" },
  { prazo: "Acima de 10 anos", aliquota: "10%" },
];

function simulate(s: Omit<Scenario, "id" | "name">) {
  const yearsAccum = s.retirementAge - s.age;
  const yearsIncome = s.lifeExpectancy - s.retirementAge;
  const realReturnAccum = (1 + s.accumulationReturn / 100) / (1 + s.inflation / 100) - 1;
  const realReturnIncome = (1 + s.incomeReturn / 100) / (1 + s.inflation / 100) - 1;
  const monthlyRateAccum = Math.pow(1 + realReturnAccum, 1 / 12) - 1;
  const monthlyRateIncome = Math.pow(1 + realReturnIncome, 1 / 12) - 1;

  // Accumulation phase
  let balance = s.currentWealth;
  let totalContributions = s.currentWealth;
  const chartData: { year: number; age: number; patrimonio: number; necessario: number }[] = [];
  
  for (let y = 0; y <= yearsAccum; y++) {
    chartData.push({ year: y, age: s.age + y, patrimonio: Math.round(balance), necessario: 0 });
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRateAccum) + s.monthlyContribution;
      if (y < yearsAccum) totalContributions += s.monthlyContribution;
    }
  }
  const projectedWealth = Math.round(balance);
  const totalContrib = Math.round(totalContributions);
  const totalReturns = projectedWealth - totalContrib;

  // Required wealth for desired income
  const monthlyNeed = s.desiredIncome - s.inss;
  const monthsIncome = yearsIncome * 12;
  let requiredWealth = 0;
  if (monthlyRateIncome > 0) {
    requiredWealth = monthlyNeed * (1 - Math.pow(1 + monthlyRateIncome, -monthsIncome)) / monthlyRateIncome;
  } else {
    requiredWealth = monthlyNeed * monthsIncome;
  }
  requiredWealth = Math.round(requiredWealth);

  // Income phase chart
  let incomeBalance = projectedWealth;
  for (let y = 1; y <= yearsIncome; y++) {
    for (let m = 0; m < 12; m++) {
      incomeBalance = incomeBalance * (1 + monthlyRateIncome) - monthlyNeed;
    }
    chartData.push({ year: yearsAccum + y, age: s.retirementAge + y, patrimonio: Math.max(0, Math.round(incomeBalance)), necessario: 0 });
  }

  // Add required line
  chartData.forEach(d => { d.necessario = d.age <= s.retirementAge ? requiredWealth : 0; });

  // Projected monthly income from projected wealth
  let projectedIncome = 0;
  if (monthlyRateIncome > 0 && monthsIncome > 0) {
    projectedIncome = projectedWealth * monthlyRateIncome / (1 - Math.pow(1 + monthlyRateIncome, -monthsIncome));
  } else {
    projectedIncome = projectedWealth / monthsIncome;
  }
  projectedIncome = Math.round(projectedIncome) + s.inss;

  const status: "ok" | "warn" | "deficit" = projectedWealth >= requiredWealth * 0.95 ? "ok" : projectedWealth >= requiredWealth * 0.7 ? "warn" : "deficit";

  return { projectedWealth, requiredWealth, projectedIncome, status, chartData, totalContrib, totalReturns, currentCorrected: Math.round(s.currentWealth * Math.pow(1 + realReturnAccum, yearsAccum)), monthlyNeed, yearsAccum, yearsIncome };
}

export default function Aposentadoria() {
  const { isEmpresarial } = useProfile();
  const [age, setAge] = useState(defaultScenario.age);
  const [retirementAge, setRetirementAge] = useState(defaultScenario.retirementAge);
  const [lifeExpectancy, setLifeExpectancy] = useState(defaultScenario.lifeExpectancy);
  const [currentWealth, setCurrentWealth] = useState(defaultScenario.currentWealth);
  const [monthlyContribution, setMonthlyContribution] = useState(defaultScenario.monthlyContribution);
  const [accumulationReturn, setAccumulationReturn] = useState(defaultScenario.accumulationReturn);
  const [incomeReturn, setIncomeReturn] = useState(defaultScenario.incomeReturn);
  const [inflation, setInflation] = useState(defaultScenario.inflation);
  const [inss, setInss] = useState(defaultScenario.inss);
  const [desiredIncome, setDesiredIncome] = useState(defaultScenario.desiredIncome);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  // PGBL simulation
  const annualGrossIncome = 180000;

  const currentParams = { age, retirementAge, lifeExpectancy, currentWealth, monthlyContribution, accumulationReturn, incomeReturn, inflation, inss, desiredIncome };
  const result = useMemo(() => simulate(currentParams), [age, retirementAge, lifeExpectancy, currentWealth, monthlyContribution, accumulationReturn, incomeReturn, inflation, inss, desiredIncome]);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Umbrella className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Aposentadoria</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal.</p>
      </div>
    );
  }

  const saveScenario = () => {
    if (!scenarioName) return;
    setScenarios(prev => [...prev.slice(0, 2), { id: `sc-${Date.now()}`, name: scenarioName, ...currentParams }]);
    setShowSaveDialog(false); setScenarioName("");
    toast({ title: "Cenário salvo! 📋" });
  };

  const pgblMaxDeduction = annualGrossIncome * 0.12;
  const pgblTaxSaved = pgblMaxDeduction * 0.275; // 27.5% bracket

  // Composition pie
  const compositionData = [
    { name: "Aportes totais", value: result.totalContrib, color: "var(--primary)" },
    { name: "Rendimentos", value: result.totalReturns, color: "var(--info)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planejamento de Aposentadoria</h1>
          <p className="text-muted-foreground">Simule e planeje sua independência financeira</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSaveDialog(true)} className="gap-2"><Save className="h-4 w-4" /> Salvar cenário</Button>
          {scenarios.length > 0 && <Button variant="outline" onClick={() => setCompareMode(!compareMode)}>{compareMode ? "Voltar" : "Comparar cenários"}</Button>}
        </div>
      </div>

      {/* Compare mode */}
      {compareMode && scenarios.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Comparação de Cenários</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parâmetro</TableHead>
                    <TableHead className="text-center font-bold">Atual</TableHead>
                    {scenarios.map(s => <TableHead key={s.id} className="text-center">{s.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "Aposentadoria aos", current: `${retirementAge} anos`, values: scenarios.map(s => `${s.retirementAge} anos`) },
                    { label: "Aporte mensal", current: fmt(monthlyContribution), values: scenarios.map(s => fmt(s.monthlyContribution)) },
                    { label: "Rentabilidade", current: `${accumulationReturn}% a.a.`, values: scenarios.map(s => `${s.accumulationReturn}% a.a.`) },
                    { label: "Patrimônio projetado", current: fmt(result.projectedWealth), values: scenarios.map(s => fmt(simulate(s).projectedWealth)) },
                    { label: "Patrimônio necessário", current: fmt(result.requiredWealth), values: scenarios.map(s => fmt(simulate(s).requiredWealth)) },
                    { label: "Renda projetada", current: fmt(result.projectedIncome), values: scenarios.map(s => fmt(simulate(s).projectedIncome)) },
                  ].map(row => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-center font-semibold">{row.current}</TableCell>
                      {row.values.map((v, i) => <TableCell key={i} className="text-center">{v}</TableCell>)}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell className="text-center">
                      {result.status === "ok" ? <Badge className="bg-primary text-primary-foreground">✅ No caminho</Badge> :
                       result.status === "warn" ? <Badge className="bg-warning text-warning-foreground">⚠️ Atenção</Badge> :
                       <Badge variant="destructive">❌ Déficit</Badge>}
                    </TableCell>
                    {scenarios.map(s => {
                      const r = simulate(s);
                      return <TableCell key={s.id} className="text-center">
                        {r.status === "ok" ? <Badge className="bg-primary text-primary-foreground">✅</Badge> :
                         r.status === "warn" ? <Badge className="bg-warning text-warning-foreground">⚠️</Badge> :
                         <Badge variant="destructive">❌</Badge>}
                      </TableCell>;
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2 mt-4">
              {scenarios.map(s => (
                <Button key={s.id} variant="ghost" size="sm" className="text-destructive" onClick={() => setScenarios(prev => prev.filter(x => x.id !== s.id))}>
                  <Trash2 className="h-3 w-3 mr-1" /> {s.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="simulador">
          <TabsList>
            <TabsTrigger value="simulador">Simulador</TabsTrigger>
            <TabsTrigger value="previdencia">Previdência Privada</TabsTrigger>
          </TabsList>

          <TabsContent value="simulador" className="space-y-6">
            {/* Result Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6">
                <p className="text-xs text-muted-foreground mb-1">Patrimônio projetado</p>
                <p className="text-xl font-bold text-foreground">{fmt(result.projectedWealth)}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <p className="text-xs text-muted-foreground mb-1">Patrimônio necessário</p>
                <p className="text-xl font-bold text-foreground">{fmt(result.requiredWealth)}</p>
              </CardContent></Card>
              <Card className={cn(result.status === "ok" ? "border-primary/50" : result.status === "warn" ? "border-warning/50" : "border-destructive/50")}>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground mb-1">Situação</p>
                  <div className="flex items-center gap-2">
                    {result.status === "ok" ? <CheckCircle className="h-5 w-5 text-primary" /> :
                     result.status === "warn" ? <AlertTriangle className="h-5 w-5 text-warning" /> :
                     <XCircle className="h-5 w-5 text-destructive" />}
                    <p className={cn("font-bold", result.status === "ok" ? "text-primary" : result.status === "warn" ? "text-warning" : "text-destructive")}>
                      {result.status === "ok" ? "No caminho certo" : result.status === "warn" ? "Aumentar aportes" : "Déficit projetado"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card><CardContent className="pt-6">
                <p className="text-xs text-muted-foreground mb-1">Renda mensal projetada</p>
                <p className={cn("text-xl font-bold", result.projectedIncome >= desiredIncome ? "text-primary" : "text-destructive")}>{fmt(result.projectedIncome)}</p>
                <p className="text-xs text-muted-foreground">{result.projectedIncome >= desiredIncome ? `+${fmt(result.projectedIncome - desiredIncome)} de sobra` : `Faltam ${fmt(desiredIncome - result.projectedIncome)}`}</p>
              </CardContent></Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-base">Evolução do Patrimônio</CardTitle><CardDescription>Fase de acumulação → Fase de renda</CardDescription></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="age" fontSize={11} stroke="hsl(var(--muted-foreground))" label={{ value: "Idade", position: "bottom", fontSize: 10 }} />
                      <YAxis tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `${l} anos`} />
                      <ReferenceLine x={retirementAge} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "Aposentadoria", fill: "hsl(var(--warning))", fontSize: 10 }} />
                      <Line type="monotone" dataKey="patrimonio" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Patrimônio" />
                      <Line type="monotone" dataKey="necessario" stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Necessário" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Composição Futura</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={360}>
                    <PieChart>
                      <Pie data={compositionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {compositionData.map((entry, i) => (
                          <Cell key={i} fill={`hsl(${i === 0 ? "149 62% 26%" : "213 78% 37%"})`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 text-xs text-center">
                    <p className="text-muted-foreground">Aportes: {fmt(result.totalContrib)}</p>
                    <p className="text-muted-foreground">Rendimentos: {fmt(result.totalReturns)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Sliders */}
            <Card>
              <CardHeader><CardTitle className="text-base">Simulador Interativo</CardTitle><CardDescription>Ajuste os parâmetros e veja o impacto em tempo real</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Personal data */}
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-foreground">Dados Pessoais</p>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><Label>Idade atual</Label><span className="font-medium text-foreground">{age} anos</span></div>
                      <Slider min={18} max={65} value={[age]} onValueChange={v => setAge(v[0])} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><Label>Aposentadoria aos</Label><span className="font-medium text-foreground">{retirementAge} anos</span></div>
                      <Slider min={Math.max(age + 1, 50)} max={75} value={[retirementAge]} onValueChange={v => setRetirementAge(v[0])} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><Label>Expectativa de vida</Label><span className="font-medium text-foreground">{lifeExpectancy} anos</span></div>
                      <Slider min={retirementAge + 5} max={100} value={[lifeExpectancy]} onValueChange={v => setLifeExpectancy(v[0])} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div><Label className="text-xs">Anos até aposentadoria</Label><p className="text-lg font-bold text-foreground">{retirementAge - age}</p></div>
                      <div><Label className="text-xs">Anos de aposentadoria</Label><p className="text-lg font-bold text-foreground">{lifeExpectancy - retirementAge}</p></div>
                    </div>
                  </div>

                  {/* Financial params */}
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-foreground">Parâmetros Financeiros</p>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><Label>Renda desejada</Label><span className="font-medium text-foreground">{fmt(desiredIncome)}/mês</span></div>
                      <Slider min={1000} max={20000} step={500} value={[desiredIncome]} onValueChange={v => setDesiredIncome(v[0])} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><Label>Aporte mensal</Label><span className="font-medium text-foreground">{fmt(monthlyContribution)}</span></div>
                      <Slider min={0} max={10000} step={100} value={[monthlyContribution]} onValueChange={v => setMonthlyContribution(v[0])} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1"><Label>Rentabilidade (acumulação)</Label><span className="font-medium text-foreground">{accumulationReturn}% a.a.</span></div>
                      <Slider min={4} max={15} step={0.5} value={[accumulationReturn]} onValueChange={v => setAccumulationReturn(v[0])} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Patrimônio atual (R$)</Label>
                        <Input type="number" value={currentWealth} onChange={e => setCurrentWealth(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">INSS esperado (R$/mês)</Label>
                        <Input type="number" value={inss} onChange={e => setInss(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Rent. fase renda (% a.a.)</Label>
                        <Input type="number" value={incomeReturn} onChange={e => setIncomeReturn(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Inflação (% a.a.)</Label>
                        <Input type="number" value={inflation} onChange={e => setInflation(parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PREVIDÊNCIA PRIVADA ─── */}
          <TabsContent value="previdencia" className="space-y-6">
            {/* Plans */}
            <div className="grid md:grid-cols-2 gap-4">
              {previdenciaPlans.map((plan, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        <Badge variant="outline">{plan.type}</Badge>
                      </div>
                      <Umbrella className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-muted-foreground">Saldo</p><p className="font-semibold text-foreground">{fmt(plan.balance)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Aporte mensal</p><p className="font-semibold text-foreground">{plan.monthlyContribution > 0 ? fmt(plan.monthlyContribution) : "—"}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* PGBL Tax Benefit */}
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">💰 Benefício Fiscal do PGBL</CardTitle><CardDescription>Simulação baseada na renda bruta anual de {fmt(annualGrossIncome)}</CardDescription></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50"><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Limite dedutível (12%)</p>
                    <p className="text-lg font-bold text-foreground">{fmt(pgblMaxDeduction)}/ano</p>
                    <p className="text-xs text-muted-foreground">{fmt(pgblMaxDeduction / 12)}/mês</p>
                  </CardContent></Card>
                  <Card className="bg-muted/50"><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Economia no IR (27,5%)</p>
                    <p className="text-lg font-bold text-primary">{fmt(pgblTaxSaved)}/ano</p>
                    <p className="text-xs text-muted-foreground">{fmt(pgblTaxSaved / 12)}/mês</p>
                  </CardContent></Card>
                  <Card className="bg-muted/50"><CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Economia em 25 anos</p>
                    <p className="text-lg font-bold text-primary">{fmt(pgblTaxSaved * 25)}</p>
                    <p className="text-xs text-muted-foreground">Reinvestindo a economia</p>
                  </CardContent></Card>
                </div>
                <p className="text-sm text-muted-foreground mt-4 p-3 rounded-lg bg-muted/30">
                  💡 Ao aportar <span className="font-semibold text-foreground">{fmt(pgblMaxDeduction)}</span> no PGBL, você deduz esse valor da base de cálculo do IR, economizando <span className="font-semibold text-primary">{fmt(pgblTaxSaved)}</span> por ano. O imposto será cobrado no resgate, mas com a tabela regressiva pode chegar a apenas 10% após 10 anos.
                </p>
              </CardContent>
            </Card>

            {/* PGBL vs VGBL */}
            <Card>
              <CardHeader><CardTitle className="text-base">PGBL vs VGBL — Qual escolher?</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <p className="font-semibold text-foreground mb-2">PGBL — Para quem faz IR completo</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✅ Deduz até 12% da renda bruta no IR</li>
                        <li>✅ Ideal para empregados CLT / renda alta</li>
                        <li>⚠️ IR incide sobre o valor total no resgate</li>
                        <li>📋 Requer declaração completa do IR</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-info/5 border-info/20">
                    <CardContent className="pt-4">
                      <p className="font-semibold text-foreground mb-2">VGBL — Para quem faz IR simplificado</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✅ Sem dedução no IR, mas IR só nos rendimentos</li>
                        <li>✅ Ideal para autônomos / IR simplificado</li>
                        <li>✅ Mais flexível para planejamento sucessório</li>
                        <li>📋 Pode usar declaração simplificada</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Tax Tables */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Tabela Progressiva</CardTitle><CardDescription>IR no resgate conforme faixa</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Faixa</TableHead><TableHead>Alíquota</TableHead><TableHead>Dedução</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {irProgressiva.map((row, i) => (
                        <TableRow key={i}><TableCell className="text-xs">{row.faixa}</TableCell><TableCell className="font-medium">{row.aliquota}</TableCell><TableCell>{row.dedução}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tabela Regressiva</CardTitle>
                  <CardDescription>IR no resgate conforme tempo — <span className="text-primary font-medium">recomendada para longo prazo</span></CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Prazo</TableHead><TableHead>Alíquota</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {irRegressiva.map((row, i) => (
                        <TableRow key={i} className={i === irRegressiva.length - 1 ? "bg-primary/5" : ""}>
                          <TableCell>{row.prazo}</TableCell>
                          <TableCell className={cn("font-medium", i === irRegressiva.length - 1 && "text-primary")}>{row.aliquota}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-2">⏱ Após 10 anos, a alíquota é de apenas 10% — significativamente menor que a progressiva para rendas médias/altas.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Save scenario dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar Cenário</DialogTitle></DialogHeader>
          <div><Label>Nome do cenário</Label><Input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder='Ex: "Conservador", "Agressivo"' className="mt-1" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button><Button onClick={saveScenario}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
