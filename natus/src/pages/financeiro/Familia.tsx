import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Users, Plus, Edit2, Trash2, Heart, Baby, UserCheck, Gift, Calendar, PiggyBank, TrendingUp, AlertTriangle, CheckCircle2, Home } from "lucide-react";
import { differenceInYears, format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ───
interface FamilyMember {
  id: string;
  name: string;
  relation: "conjuge" | "filho" | "pai_mae" | "outro";
  birthDate: string;
  linkedUserId?: string;
  monthlyIncome: number;
  receivesAllowance: boolean;
  photoUrl?: string;
  monthlySpent: number;
  activeGoals: number;
}

interface AllowanceConfig {
  memberId: string;
  amount: number;
  payDay: number;
  sourceAccountId: string;
  savingsPercent: number;
}

interface AllowanceExpense {
  id: string;
  memberId: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

interface FamilyEvent {
  id: string;
  name: string;
  type: "aniversario" | "natal" | "viagem" | "volta_aulas" | "formatura" | "outro";
  date: string;
  budget: number;
  spent: number;
  items: { name: string; value: number; paid: boolean }[];
}

interface ExpenseSplitRule {
  category: string;
  member1Pct: number;
  member2Pct: number;
}

// ─── Mock Data ───
const mockMembers: FamilyMember[] = [
  { id: "f1", name: "Você", relation: "conjuge", birthDate: "1988-06-15", monthlyIncome: 8500, receivesAllowance: false, monthlySpent: 4200, activeGoals: 3 },
  { id: "f2", name: "Ana (Cônjuge)", relation: "conjuge", birthDate: "1990-03-22", monthlyIncome: 4500, receivesAllowance: false, monthlySpent: 3800, activeGoals: 2 },
  { id: "f3", name: "Pedro", relation: "filho", birthDate: "2012-09-10", monthlyIncome: 0, receivesAllowance: true, monthlySpent: 180, activeGoals: 1 },
  { id: "f4", name: "Julia", relation: "filho", birthDate: "2016-01-28", monthlyIncome: 0, receivesAllowance: true, monthlySpent: 95, activeGoals: 0 },
];

const mockAllowances: AllowanceConfig[] = [
  { memberId: "f3", amount: 200, payDay: 5, sourceAccountId: "acc1", savingsPercent: 20 },
  { memberId: "f4", amount: 100, payDay: 5, sourceAccountId: "acc1", savingsPercent: 30 },
];

const mockAllowanceExpenses: AllowanceExpense[] = [
  { id: "ae1", memberId: "f3", date: "2026-03-02", description: "Lanche na escola", category: "Lanche", amount: 15 },
  { id: "ae2", memberId: "f3", date: "2026-03-05", description: "Jogo online", category: "Jogo", amount: 30 },
  { id: "ae3", memberId: "f3", date: "2026-03-08", description: "Caderno escolar", category: "Escola", amount: 25 },
  { id: "ae4", memberId: "f3", date: "2026-03-01", description: "Figurinhas", category: "Brinquedo", amount: 20 },
  { id: "ae5", memberId: "f4", date: "2026-03-03", description: "Boneca", category: "Brinquedo", amount: 45 },
  { id: "ae6", memberId: "f4", date: "2026-03-06", description: "Sorvete", category: "Lanche", amount: 12 },
];

const mockSplitRules: ExpenseSplitRule[] = [
  { category: "Moradia", member1Pct: 60, member2Pct: 40 },
  { category: "Alimentação", member1Pct: 50, member2Pct: 50 },
  { category: "Transporte", member1Pct: 70, member2Pct: 30 },
  { category: "Saúde", member1Pct: 50, member2Pct: 50 },
  { category: "Educação filhos", member1Pct: 50, member2Pct: 50 },
  { category: "Lazer", member1Pct: 50, member2Pct: 50 },
];

const mockActualSpending = [
  { category: "Moradia", member1: 2500, member2: 0 },
  { category: "Alimentação", member1: 800, member2: 850 },
  { category: "Transporte", member1: 700, member2: 280 },
  { category: "Saúde", member1: 200, member2: 150 },
  { category: "Educação filhos", member1: 600, member2: 400 },
  { category: "Lazer", member1: 400, member2: 380 },
];

const mockEvents: FamilyEvent[] = [
  {
    id: "ev1", name: "Aniversário Pedro", type: "aniversario", date: "2026-09-10", budget: 2000, spent: 350,
    items: [
      { name: "Bolo e doces", value: 400, paid: true },
      { name: "Decoração", value: 300, paid: false },
      { name: "Presente", value: 500, paid: false },
      { name: "Lanche para convidados", value: 800, paid: false },
    ],
  },
  {
    id: "ev2", name: "Viagem férias julho", type: "viagem", date: "2026-07-15", budget: 8000, spent: 3200,
    items: [
      { name: "Passagens", value: 3200, paid: true },
      { name: "Hospedagem", value: 2800, paid: false },
      { name: "Alimentação", value: 1200, paid: false },
      { name: "Passeios", value: 800, paid: false },
    ],
  },
  {
    id: "ev3", name: "Volta às aulas 2027", type: "volta_aulas", date: "2027-01-20", budget: 3000, spent: 0,
    items: [
      { name: "Material escolar Pedro", value: 800, paid: false },
      { name: "Material escolar Julia", value: 600, paid: false },
      { name: "Uniformes", value: 1000, paid: false },
      { name: "Mochilas", value: 600, paid: false },
    ],
  },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const CHILD_CATEGORIES = ["Lanche", "Brinquedo", "Jogo", "Escola", "Transporte", "Outro"];
const RELATION_LABELS: Record<string, string> = { conjuge: "Cônjuge", filho: "Filho(a)", pai_mae: "Pai/Mãe", outro: "Outro" };
const EVENT_ICONS: Record<string, string> = { aniversario: "🎂", natal: "🎄", viagem: "✈️", volta_aulas: "📚", formatura: "🎓", outro: "📅" };
const PIE_COLORS = ["hsl(149, 62%, 26%)", "hsl(213, 78%, 37%)", "hsl(37, 100%, 50%)", "hsl(0, 72%, 50%)", "hsl(280, 60%, 50%)", "hsl(180, 50%, 40%)"];

function getAge(birthDate: string) {
  return differenceInYears(new Date(), parseISO(birthDate));
}

// ─── Sub-components ───

function MemberCard({ m }: { m: FamilyMember }) {
  const age = getAge(m.birthDate);
  const incomeUsed = m.monthlyIncome > 0 ? Math.round((m.monthlySpent / m.monthlyIncome) * 100) : 0;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
            {m.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground truncate">{m.name}</p>
              <Badge variant="secondary" className="text-xs">{RELATION_LABELS[m.relation]}</Badge>
              {m.receivesAllowance && <Badge className="text-xs bg-accent/20 text-accent-foreground">Mesada</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{age} anos</p>
            {m.monthlyIncome > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Renda: {fmt(m.monthlyIncome)}</span>
                  <span className="text-muted-foreground">{incomeUsed}% comprometida</span>
                </div>
                <Progress value={Math.min(incomeUsed, 100)} className="h-1.5" />
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>Gastos: {fmt(m.monthlySpent)}</span>
              {m.activeGoals > 0 && <span>🎯 {m.activeGoals} metas</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AllowancePanel({ member, config, expenses }: { member: FamilyMember; config: AllowanceConfig; expenses: AllowanceExpense[] }) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const savings = config.amount * (config.savingsPercent / 100);
  const available = config.amount - totalSpent - savings;
  const savedPct = config.amount > 0 ? Math.round((savings / config.amount) * 100) : 0;
  const spentPct = config.amount > 0 ? Math.round((totalSpent / config.amount) * 100) : 0;

  const byCategory = CHILD_CATEGORIES.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.value > 0);

  const pieData = [
    { name: "Gasto", value: totalSpent },
    { name: "Guardado", value: savings },
    ...(available > 0 ? [{ name: "Disponível", value: available }] : []),
  ];

  const monthsSaved = savings > 0 ? Math.ceil(500 / savings) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent-foreground">{member.name.charAt(0)}</div>
          <div>
            <CardTitle className="text-base">{member.name}</CardTitle>
            <CardDescription>Mesada: {fmt(config.amount)}/mês • Dia {config.payDay}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saldo */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className={cn("text-sm font-bold", available >= 0 ? "text-primary" : "text-destructive")}>{fmt(available)}</p>
          </div>
          <div className="p-2 rounded-lg bg-destructive/10">
            <p className="text-xs text-muted-foreground">Gasto</p>
            <p className="text-sm font-bold text-destructive">{fmt(totalSpent)}</p>
          </div>
          <div className="p-2 rounded-lg bg-accent/10">
            <p className="text-xs text-muted-foreground">Guardado</p>
            <p className="text-sm font-bold text-accent-foreground">{fmt(savings)}</p>
          </div>
        </div>

        {/* Pie: gasto vs guardado */}
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={42} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={[PIE_COLORS[3], PIE_COLORS[0], "hsl(var(--muted))"][i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1">
            {byCategory.map(c => (
              <div key={c.name} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-medium text-foreground">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Motivational */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm font-medium text-foreground">
            {savedPct >= 20 ? "🎉" : "💪"} {member.name} guardou {savedPct}% da mesada este mês!
          </p>
          {monthsSaved > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Guardando assim, em {monthsSaved} meses terá {fmt(savings * monthsSaved)}
            </p>
          )}
        </div>

        {/* Recent expenses */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Últimos gastos</p>
          {expenses.slice(0, 4).map(e => (
            <div key={e.id} className="flex justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
              <div>
                <span className="text-foreground">{e.description}</span>
                <span className="text-muted-foreground ml-2">{format(parseISO(e.date), "dd/MM")}</span>
              </div>
              <span className="font-medium text-foreground">{fmt(e.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: FamilyEvent }) {
  const pctUsed = event.budget > 0 ? Math.round((event.spent / event.budget) * 100) : 0;
  const daysUntil = differenceInDays(parseISO(event.date), new Date());
  const isClose = daysUntil <= 60 && daysUntil > 0;
  const remaining = event.budget - event.spent;

  return (
    <Card className={cn(isClose && remaining > 0 && "border-warning/40")}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{EVENT_ICONS[event.type]}</span>
            <div>
              <p className="font-semibold text-foreground">{event.name}</p>
              <p className="text-xs text-muted-foreground">{format(parseISO(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
          </div>
          {daysUntil > 0 ? (
            <Badge variant={isClose ? "destructive" : "secondary"} className="text-xs">
              {daysUntil} dias
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Passado</Badge>
          )}
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Orçamento: {fmt(event.budget)}</span>
          <span className={cn("font-medium", pctUsed > 90 ? "text-destructive" : "text-foreground")}>{pctUsed}% usado</span>
        </div>
        <Progress value={Math.min(pctUsed, 100)} className="h-2 mb-3" />

        <div className="space-y-1.5">
          {event.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {item.paid ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                <span className={cn(item.paid ? "text-muted-foreground line-through" : "text-foreground")}>{item.name}</span>
              </div>
              <span className="font-medium text-foreground">{fmt(item.value)}</span>
            </div>
          ))}
        </div>

        {isClose && remaining > event.budget * 0.5 && (
          <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/20 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <p className="text-xs text-warning-foreground">Evento próximo com {fmt(remaining)} ainda não cobertos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───
export default function Familia() {
  const { isEmpresarial } = useProfile();
  const [members] = useState(mockMembers);
  const [allowances] = useState(mockAllowances);
  const [allowanceExpenses] = useState(mockAllowanceExpenses);
  const [events] = useState(mockEvents);
  const [splitMethod, setSplitMethod] = useState<"50/50" | "proporcional" | "personalizado">("proporcional");
  const [splitRules] = useState(mockSplitRules);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedChild, setSelectedChild] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);

  // New member form
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState<string>("filho");
  const [newBirth, setNewBirth] = useState("");
  const [newIncome, setNewIncome] = useState("");

  // New expense form
  const [expDesc, setExpDesc] = useState("");
  const [expCat, setExpCat] = useState("Lanche");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // New event form
  const [evName, setEvName] = useState("");
  const [evType, setEvType] = useState<string>("aniversario");
  const [evDate, setEvDate] = useState("");
  const [evBudget, setEvBudget] = useState("");

  const totalFamilyIncome = members.reduce((s, m) => s + m.monthlyIncome, 0);
  const totalFamilySpent = members.reduce((s, m) => s + m.monthlySpent, 0);
  const familyBalance = totalFamilyIncome - totalFamilySpent;

  const earners = members.filter(m => m.monthlyIncome > 0);
  const children = members.filter(m => m.relation === "filho");

  // ─── Expense Split Calculation ───
  const splitCalc = useMemo(() => {
    if (earners.length < 2) return null;
    const m1 = earners[0];
    const m2 = earners[1];
    const m1Pct = splitMethod === "50/50" ? 50 : splitMethod === "proporcional"
      ? Math.round((m1.monthlyIncome / (m1.monthlyIncome + m2.monthlyIncome)) * 100) : 0;
    const m2Pct = splitMethod === "50/50" ? 50 : splitMethod === "proporcional" ? 100 - m1Pct : 0;

    const rows = mockActualSpending.map(s => {
      const total = s.member1 + s.member2;
      const rule = splitMethod === "personalizado"
        ? splitRules.find(r => r.category === s.category)
        : { member1Pct: m1Pct, member2Pct: m2Pct };
      const should1 = total * ((rule?.member1Pct ?? 50) / 100);
      const should2 = total * ((rule?.member2Pct ?? 50) / 100);
      return {
        category: s.category,
        total,
        paid1: s.member1, paid2: s.member2,
        should1, should2,
        diff1: s.member1 - should1, diff2: s.member2 - should2,
        rule1Pct: rule?.member1Pct ?? 50,
      };
    });

    const totalDiff1 = rows.reduce((s, r) => s + r.diff1, 0);
    return { m1, m2, m1Pct, m2Pct, rows, totalDiff1 };
  }, [earners, splitMethod, splitRules]);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Família</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal. Alterne seu perfil para acessar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Família</h1>
          <p className="text-muted-foreground">Gestão financeira familiar • Março 2026</p>
        </div>
        <Button onClick={() => setShowAddMember(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar membro
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="divisao" className="text-xs sm:text-sm">Divisão</TabsTrigger>
          <TabsTrigger value="mesada" className="text-xs sm:text-sm">Mesada</TabsTrigger>
          <TabsTrigger value="eventos" className="text-xs sm:text-sm">Eventos</TabsTrigger>
        </TabsList>

        {/* ═══ Dashboard ═══ */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Family consolidated */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Renda familiar</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalFamilyIncome)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Despesas totais</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalFamilySpent)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Sobra/Déficit</p>
              <p className={cn("text-xl font-bold", familyBalance >= 0 ? "text-primary" : "text-destructive")}>{fmt(familyBalance)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Membros</p>
              <p className="text-xl font-bold text-foreground">{members.length}</p>
            </CardContent></Card>
          </div>

          {/* Member cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Membros da Família</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {members.map(m => <MemberCard key={m.id} m={m} />)}
            </div>
          </div>

          {/* Income distribution chart */}
          {earners.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição da Renda Familiar</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={earners.map(e => ({ name: e.name, value: e.monthlyIncome }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="none">
                        {earners.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {earners.map((e, i) => (
                      <div key={e.id} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-sm text-foreground">{e.name}: {fmt(e.monthlyIncome)} ({Math.round((e.monthlyIncome / totalFamilyIncome) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ Divisão de Despesas ═══ */}
        <TabsContent value="divisao" className="space-y-6">
          {earners.length < 2 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Necessário pelo menos 2 membros com renda para a divisão de despesas.</CardContent></Card>
          ) : splitCalc && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Método de Divisão</CardTitle></CardHeader>
                <CardContent>
                  <Select value={splitMethod} onValueChange={v => setSplitMethod(v as typeof splitMethod)}>
                    <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50/50">50/50 — Metade cada</SelectItem>
                      <SelectItem value="proporcional">Proporcional à renda</SelectItem>
                      <SelectItem value="personalizado">Personalizado por categoria</SelectItem>
                    </SelectContent>
                  </Select>
                  {splitMethod === "proporcional" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {splitCalc.m1.name}: {splitCalc.m1Pct}% • {splitCalc.m2.name}: {splitCalc.m2Pct}%
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Despesas do Mês por Categoria</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">{splitCalc.m1.name} pagou</TableHead>
                        <TableHead className="text-right">{splitCalc.m2.name} pagou</TableHead>
                        <TableHead className="text-right">Deveria ({splitCalc.m1.name})</TableHead>
                        <TableHead className="text-right">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {splitCalc.rows.map(r => (
                        <TableRow key={r.category}>
                          <TableCell className="font-medium">{r.category}</TableCell>
                          <TableCell className="text-right">{fmt(r.total)}</TableCell>
                          <TableCell className="text-right">{fmt(r.paid1)}</TableCell>
                          <TableCell className="text-right">{fmt(r.paid2)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{fmt(r.should1)}</TableCell>
                          <TableCell className={cn("text-right font-medium", r.diff1 > 0 ? "text-primary" : r.diff1 < 0 ? "text-destructive" : "text-foreground")}>
                            {r.diff1 > 0 ? `+${fmt(r.diff1)}` : fmt(r.diff1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Settlement */}
              <Card className={cn(splitCalc.totalDiff1 > 0 ? "border-primary/30" : "border-warning/30")}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Acerto do mês</p>
                      {splitCalc.totalDiff1 > 0 ? (
                        <p className="text-lg font-bold text-foreground">{splitCalc.m2.name} deve {fmt(splitCalc.totalDiff1)} para {splitCalc.m1.name}</p>
                      ) : splitCalc.totalDiff1 < 0 ? (
                        <p className="text-lg font-bold text-foreground">{splitCalc.m1.name} deve {fmt(Math.abs(splitCalc.totalDiff1))} para {splitCalc.m2.name}</p>
                      ) : (
                        <p className="text-lg font-bold text-primary">Tudo certo! Sem acerto necessário.</p>
                      )}
                    </div>
                    {splitCalc.totalDiff1 !== 0 && (
                      <Button onClick={() => toast({ title: "Acerto registrado", description: "Transferência criada entre contas." })}>
                        Registrar acerto
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══ Mesada ═══ */}
        <TabsContent value="mesada" className="space-y-6">
          {children.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">Nenhum filho cadastrado. Adicione um membro com relação "Filho(a)".</CardContent></Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Mesadas dos Filhos</h2>
                <Button variant="outline" size="sm" onClick={() => { setShowAddExpense(true); setSelectedChild(children[0]?.id || ""); }}>
                  <Plus className="h-4 w-4 mr-1" /> Registrar gasto
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {children.map(child => {
                  const config = allowances.find(a => a.memberId === child.id);
                  if (!config) return (
                    <Card key={child.id}>
                      <CardContent className="pt-5 text-center">
                        <p className="text-sm text-muted-foreground">{child.name} não tem mesada configurada</p>
                        <Button variant="outline" size="sm" className="mt-2">Configurar mesada</Button>
                      </CardContent>
                    </Card>
                  );
                  const expenses = allowanceExpenses.filter(e => e.memberId === child.id);
                  return <AllowancePanel key={child.id} member={child} config={config} expenses={expenses} />;
                })}
              </div>

              {/* Summary bar chart */}
              <Card>
                <CardHeader><CardTitle className="text-base">Resumo das Mesadas</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={children.map(c => {
                      const cfg = allowances.find(a => a.memberId === c.id);
                      const spent = allowanceExpenses.filter(e => e.memberId === c.id).reduce((s, e) => s + e.amount, 0);
                      const saved = cfg ? cfg.amount * (cfg.savingsPercent / 100) : 0;
                      return { name: c.name, Gasto: spent, Guardado: saved, Disponível: Math.max(0, (cfg?.amount || 0) - spent - saved) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={v => `R$${v}`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="Gasto" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Guardado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Disponível" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══ Eventos ═══ */}
        <TabsContent value="eventos" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Eventos Familiares</h2>
            <Button onClick={() => setShowAddEvent(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo evento</Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).map(ev => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>

          {/* Upcoming alerts */}
          {events.filter(ev => {
            const d = differenceInDays(parseISO(ev.date), new Date());
            return d > 0 && d <= 90 && ev.spent < ev.budget * 0.5;
          }).length > 0 && (
            <Card className="border-warning/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="font-medium text-sm text-foreground">Eventos próximos com orçamento pendente</p>
                </div>
                {events.filter(ev => {
                  const d = differenceInDays(parseISO(ev.date), new Date());
                  return d > 0 && d <= 90 && ev.spent < ev.budget * 0.5;
                }).map(ev => (
                  <div key={ev.id} className="flex justify-between text-sm py-1.5">
                    <span className="text-foreground">{EVENT_ICONS[ev.type]} {ev.name} — em {differenceInDays(parseISO(ev.date), new Date())} dias</span>
                    <span className="text-warning font-medium">{fmt(ev.budget - ev.spent)} faltando</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Dialogs ═══ */}

      {/* Add member */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Membro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Relação</Label>
              <Select value={newRelation} onValueChange={setNewRelation}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conjuge">Cônjuge/Companheiro(a)</SelectItem>
                  <SelectItem value="filho">Filho(a)</SelectItem>
                  <SelectItem value="pai_mae">Pai/Mãe</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data de nascimento</Label><Input type="date" value={newBirth} onChange={e => setNewBirth(e.target.value)} className="mt-1" /></div>
            <div><Label>Renda mensal (opcional)</Label><Input type="number" value={newIncome} onChange={e => setNewIncome(e.target.value)} className="mt-1" placeholder="0" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddMember(false); toast({ title: "Membro adicionado", description: `${newName} foi adicionado à família.` }); setNewName(""); }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add allowance expense */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Gasto da Mesada</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Filho</Label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {children.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="mt-1" /></div>
            <div><Label>Descrição</Label><Input value={expDesc} onChange={e => setExpDesc(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={expCat} onValueChange={setExpCat}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHILD_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$)</Label><Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExpense(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddExpense(false); toast({ title: "Gasto registrado" }); setExpDesc(""); setExpAmount(""); }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add event */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Evento Familiar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do evento</Label><Input value={evName} onChange={e => setEvName(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={evType} onValueChange={setEvType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aniversario">🎂 Aniversário</SelectItem>
                  <SelectItem value="natal">🎄 Natal/Festas</SelectItem>
                  <SelectItem value="viagem">✈️ Viagem</SelectItem>
                  <SelectItem value="volta_aulas">📚 Volta às aulas</SelectItem>
                  <SelectItem value="formatura">🎓 Formatura</SelectItem>
                  <SelectItem value="outro">📅 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data</Label><Input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} className="mt-1" /></div>
            <div><Label>Orçamento total (R$)</Label><Input type="number" value={evBudget} onChange={e => setEvBudget(e.target.value)} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEvent(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddEvent(false); toast({ title: "Evento criado", description: `${evName} adicionado ao planejamento.` }); setEvName(""); setEvBudget(""); }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
