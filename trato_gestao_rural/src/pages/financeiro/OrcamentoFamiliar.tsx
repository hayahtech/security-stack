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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Home, PartyPopper, PiggyBank, AlertTriangle, CheckCircle2, TrendingDown, DollarSign, Edit2, Users } from "lucide-react";

// ─── Types & Mock Data ───
interface FamilyMember {
  id: string;
  name: string;
  contribution: number; // monthly
  contributionPct: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  block: "necessidades" | "desejos" | "poupanca";
  budgeted: number;
  spent: number;
  icon: string;
}

type BudgetMethod = "50-30-20" | "base-zero" | "personalizado";

const mockMembers: FamilyMember[] = [
  { id: "m1", name: "Você", contribution: 8500, contributionPct: 65 },
  { id: "m2", name: "Cônjuge", contribution: 4500, contributionPct: 35 },
];

const mockCategories: BudgetCategory[] = [
  { id: "bc1", name: "Moradia", block: "necessidades", budgeted: 2500, spent: 2500, icon: "🏠" },
  { id: "bc2", name: "Alimentação", block: "necessidades", budgeted: 1800, spent: 1650, icon: "🛒" },
  { id: "bc3", name: "Transporte", block: "necessidades", budgeted: 1200, spent: 980, icon: "🚗" },
  { id: "bc4", name: "Saúde", block: "necessidades", budgeted: 800, spent: 350, icon: "💊" },
  { id: "bc5", name: "Contas (água, luz, tel)", block: "necessidades", budgeted: 700, spent: 720, icon: "📱" },
  { id: "bc6", name: "Lazer", block: "desejos", budgeted: 1000, spent: 780, icon: "🎬" },
  { id: "bc7", name: "Restaurantes", block: "desejos", budgeted: 800, spent: 950, icon: "🍽️" },
  { id: "bc8", name: "Streaming/Assinaturas", block: "desejos", budgeted: 200, spent: 189, icon: "📺" },
  { id: "bc9", name: "Roupas", block: "desejos", budgeted: 500, spent: 320, icon: "👕" },
  { id: "bc10", name: "Viagens", block: "desejos", budgeted: 400, spent: 0, icon: "✈️" },
  { id: "bc11", name: "Metas financeiras", block: "poupanca", budgeted: 1500, spent: 1500, icon: "🎯" },
  { id: "bc12", name: "Investimentos", block: "poupanca", budgeted: 800, spent: 800, icon: "📈" },
  { id: "bc13", name: "Reserva de emergência", block: "poupanca", budgeted: 300, spent: 300, icon: "🛡️" },
];

const mockHistory = [
  { month: "Out/25", orcado: 12500, gasto: 11800 },
  { month: "Nov/25", orcado: 12500, gasto: 13200 },
  { month: "Dez/25", orcado: 13000, gasto: 14500 },
  { month: "Jan/26", orcado: 13000, gasto: 12100 },
  { month: "Fev/26", orcado: 13000, gasto: 12800 },
  { month: "Mar/26", orcado: 13000, gasto: 11039 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function OrcamentoFamiliar() {
  const { isEmpresarial } = useProfile();
  const [income, setIncome] = useState(13000);
  const [method, setMethod] = useState<BudgetMethod>("50-30-20");
  const [categories, setCategories] = useState(mockCategories);
  const [members] = useState(mockMembers);
  const [showByMember, setShowByMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState("");

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Home className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Orçamento Familiar</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Disponível apenas no perfil Pessoal. Alterne seu perfil para acessar.
        </p>
      </div>
    );
  }

  const blocks = {
    necessidades: { label: "Necessidades", pct: 50, icon: <Home className="h-5 w-5" />, emoji: "🏠", color: "var(--primary)" },
    desejos: { label: "Desejos", pct: 30, icon: <PartyPopper className="h-5 w-5" />, emoji: "🎉", color: "var(--info)" },
    poupanca: { label: "Poupança", pct: 20, icon: <PiggyBank className="h-5 w-5" />, emoji: "💰", color: "var(--accent)" },
  };

  const totalBudgeted = categories.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const freeBalance = income - totalSpent;

  const overBudget = categories.filter(c => c.spent > c.budgeted);
  const underBudget = categories.filter(c => c.budgeted > 0 && c.spent / c.budgeted < 0.7);

  const getBarColor = (spent: number, budgeted: number) => {
    if (budgeted === 0) return "hsl(var(--muted-foreground))";
    const pct = spent / budgeted;
    if (pct > 1) return "hsl(var(--destructive))";
    if (pct > 0.8) return "hsl(var(--warning))";
    return "hsl(var(--primary))";
  };

  const memberFactor = (memberId: string) => {
    if (memberId === "all") return 1;
    const m = members.find(mm => mm.id === memberId);
    return m ? m.contributionPct / 100 : 1;
  };

  const factor = memberFactor(selectedMember);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamento Familiar</h1>
          <p className="text-muted-foreground">Março 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Por membro</Label>
            <Switch checked={showByMember} onCheckedChange={setShowByMember} />
          </div>
          {showByMember && (
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Income & Method */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Renda familiar total</p>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingIncome(true); setTempIncome(String(income)); }}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-3xl font-bold text-foreground">{fmt(income)}</p>
            {members.length > 1 && (
              <div className="flex gap-3 mt-2">
                {members.map(m => (
                  <Badge key={m.id} variant="secondary" className="text-xs">{m.name}: {fmt(m.contribution)} ({m.contributionPct}%)</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Método de orçamento</p>
            <Select value={method} onValueChange={v => setMethod(v as BudgetMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50-30-20">50/30/20 (Necessidades/Desejos/Poupança)</SelectItem>
                <SelectItem value="base-zero">Orçamento base zero</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {method === "50-30-20" && (
              <p className="text-xs text-muted-foreground mt-2">
                50% para necessidades básicas, 30% para desejos e 20% para poupança e investimentos.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 50/30/20 Blocks */}
      {method === "50-30-20" && (
        <div className="grid md:grid-cols-3 gap-4">
          {(["necessidades", "desejos", "poupanca"] as const).map(block => {
            const b = blocks[block];
            const cats = categories.filter(c => c.block === block);
            const budgeted = cats.reduce((s, c) => s + c.budgeted, 0);
            const spent = cats.reduce((s, c) => s + c.spent, 0) * factor;
            const ideal = income * (b.pct / 100);
            const pctUsed = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
            return (
              <Card key={block}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{b.emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground">{b.label} ({b.pct}%)</p>
                      <p className="text-xs text-muted-foreground">Ideal: {fmt(ideal)}</p>
                    </div>
                  </div>
                  <Progress value={Math.min(pctUsed, 100)} className="h-2.5 mb-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{fmt(spent)} gasto</span>
                    <span className={cn("font-medium", pctUsed > 100 ? "text-destructive" : pctUsed > 80 ? "text-warning" : "text-primary")}>{pctUsed}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Orçado: {fmt(budgeted)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Renda total</p>
          <p className="text-xl font-bold text-foreground">{fmt(income)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Total orçado</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalBudgeted)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Total gasto</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalSpent * factor)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Saldo livre</p>
          <p className={cn("text-xl font-bold", freeBalance >= 0 ? "text-primary" : "text-destructive")}>{fmt(freeBalance)}</p>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        {overBudget.length > 0 && (
          <Card className="border-destructive/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="font-medium text-destructive text-sm">Categorias acima do orçamento</p>
              </div>
              {overBudget.map(c => (
                <div key={c.id} className="flex justify-between text-sm py-1">
                  <span className="text-foreground">{c.icon} {c.name}</span>
                  <span className="text-destructive font-medium">+{fmt(c.spent - c.budgeted)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {underBudget.length > 0 && (
          <Card className="border-primary/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="font-medium text-primary text-sm">Categorias com folga (&gt;30%)</p>
              </div>
              {underBudget.map(c => (
                <div key={c.id} className="flex justify-between text-sm py-1">
                  <span className="text-foreground">{c.icon} {c.name}</span>
                  <span className="text-primary font-medium">{fmt(c.budgeted - c.spent)} sobrando</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Orçamento por Categoria</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Orçado</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="text-right">Restante</TableHead>
                <TableHead className="text-right">% usado</TableHead>
                <TableHead className="w-32">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(cat => {
                const spent = cat.spent * factor;
                const remaining = cat.budgeted - spent;
                const pct = cat.budgeted > 0 ? Math.round((spent / cat.budgeted) * 100) : 0;
                return (
                  <TableRow key={cat.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{cat.icon} {cat.name}</TableCell>
                    <TableCell className="text-right">{fmt(cat.budgeted)}</TableCell>
                    <TableCell className="text-right">{fmt(spent)}</TableCell>
                    <TableCell className={cn("text-right font-medium", remaining < 0 ? "text-destructive" : "text-foreground")}>{fmt(remaining)}</TableCell>
                    <TableCell className={cn("text-right font-medium", pct > 100 ? "text-destructive" : pct > 80 ? "text-warning" : "text-primary")}>{pct}%</TableCell>
                    <TableCell>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: getBarColor(spent, cat.budgeted) }} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member balance */}
      {showByMember && members.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Divisão entre Membros</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map(m => {
                const share = totalSpent * (m.contributionPct / 100);
                const diff = m.contribution - share;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">Contribui: {fmt(m.contribution)} ({m.contributionPct}%)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Parte das despesas: {fmt(share)}</p>
                      <p className={cn("text-sm font-medium", diff >= 0 ? "text-primary" : "text-destructive")}>
                        {diff >= 0 ? `Sobra ${fmt(diff)}` : `Faltam ${fmt(Math.abs(diff))}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico Mensal</CardTitle><CardDescription>Gasto real vs orçado nos últimos 6 meses</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gasto" name="Gasto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Edit income dialog */}
      <Dialog open={editingIncome} onOpenChange={setEditingIncome}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Renda Mensal</DialogTitle></DialogHeader>
          <div><Label>Renda familiar total (R$)</Label><Input type="number" value={tempIncome} onChange={e => setTempIncome(e.target.value)} className="mt-1" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIncome(false)}>Cancelar</Button>
            <Button onClick={() => { setIncome(parseFloat(tempIncome) || income); setEditingIncome(false); toast({ title: "Renda atualizada" }); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
