import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Users, Download, User, ArrowUpRight, ArrowDownRight } from "lucide-react";

// ─── Mock ───
interface PersonTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "gasto" | "receita";
  amount: number;
  reimbursable: boolean;
  personId: string;
}

interface Person {
  id: string;
  name: string;
  role: string;
}

const mockPeople: Person[] = [
  { id: "p1", name: "Você", role: "Titular" },
  { id: "p2", name: "Ana", role: "Cônjuge" },
  { id: "p3", name: "Pedro", role: "Filho" },
  { id: "p4", name: "Julia", role: "Filha" },
];

const mockTransactions: PersonTransaction[] = [
  { id: "pt1", date: "2026-03-01", description: "Mercado mensal", category: "Alimentação", type: "gasto", amount: 890, reimbursable: false, personId: "p1" },
  { id: "pt2", date: "2026-03-02", description: "Restaurante almoço", category: "Alimentação", type: "gasto", amount: 75, reimbursable: false, personId: "p2" },
  { id: "pt3", date: "2026-03-03", description: "Material escolar Pedro", category: "Educação", type: "gasto", amount: 320, reimbursable: false, personId: "p3" },
  { id: "pt4", date: "2026-03-04", description: "Uber para escola", category: "Transporte", type: "gasto", amount: 25, reimbursable: false, personId: "p3" },
  { id: "pt5", date: "2026-03-05", description: "Salário", category: "Renda", type: "receita", amount: 8500, reimbursable: false, personId: "p1" },
  { id: "pt6", date: "2026-03-05", description: "Salário Ana", category: "Renda", type: "receita", amount: 4500, reimbursable: false, personId: "p2" },
  { id: "pt7", date: "2026-03-06", description: "Combustível", category: "Transporte", type: "gasto", amount: 280, reimbursable: false, personId: "p1" },
  { id: "pt8", date: "2026-03-07", description: "Farmácia", category: "Saúde", type: "gasto", amount: 145, reimbursable: false, personId: "p2" },
  { id: "pt9", date: "2026-03-08", description: "Ballet Julia", category: "Educação", type: "gasto", amount: 180, reimbursable: false, personId: "p4" },
  { id: "pt10", date: "2026-03-03", description: "Consulta médica", category: "Saúde", type: "gasto", amount: 350, reimbursable: true, personId: "p1" },
  { id: "pt11", date: "2026-03-04", description: "Delivery iFood", category: "Alimentação", type: "gasto", amount: 65, reimbursable: false, personId: "p2" },
  { id: "pt12", date: "2026-03-07", description: "Academia", category: "Lazer", type: "gasto", amount: 120, reimbursable: false, personId: "p1" },
  { id: "pt13", date: "2026-03-02", description: "Lanche escolar", category: "Alimentação", type: "gasto", amount: 15, reimbursable: false, personId: "p3" },
  { id: "pt14", date: "2026-03-06", description: "Brinquedo", category: "Lazer", type: "gasto", amount: 45, reimbursable: false, personId: "p4" },
  { id: "pt15", date: "2026-03-01", description: "Aluguel", category: "Moradia", type: "gasto", amount: 2500, reimbursable: false, personId: "p1" },
  { id: "pt16", date: "2026-03-08", description: "Streaming Netflix", category: "Lazer", type: "gasto", amount: 55, reimbursable: false, personId: "p1" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PIE_COLORS = ["hsl(149, 62%, 26%)", "hsl(213, 78%, 37%)", "hsl(37, 100%, 50%)", "hsl(0, 72%, 50%)", "hsl(280, 60%, 50%)", "hsl(180, 50%, 40%)", "hsl(330, 60%, 50%)"];

export default function GastosPorPessoa() {
  const { isEmpresarial } = useProfile();
  const [selectedPerson, setSelectedPerson] = useState("all");
  const [period, setPeriod] = useState("2026-03");

  const filtered = useMemo(() => {
    let list = mockTransactions.filter(t => t.date.startsWith(period));
    if (selectedPerson !== "all") list = list.filter(t => t.personId === selectedPerson);
    return list;
  }, [selectedPerson, period]);

  const totalGasto = filtered.filter(t => t.type === "gasto").reduce((s, t) => s + t.amount, 0);
  const totalReceita = filtered.filter(t => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const saldo = totalReceita - totalGasto;
  const totalReimbursable = filtered.filter(t => t.reimbursable).reduce((s, t) => s + t.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(t => t.type === "gasto").forEach(t => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Comparative bar chart: all people
  const byPerson = useMemo(() => {
    return mockPeople.map(p => {
      const txns = mockTransactions.filter(t => t.personId === p.id && t.date.startsWith(period) && t.type === "gasto");
      return { name: p.name, total: txns.reduce((s, t) => s + t.amount, 0) };
    }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos & Receitas por Pessoa</h1>
          <p className="text-muted-foreground">Rastreamento financeiro por membro</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast({ title: "PDF gerado", description: "Prestação de contas exportada." })}>
          <Download className="h-4 w-4" /> Exportar prestação de contas
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedPerson} onValueChange={setSelectedPerson}>
          <SelectTrigger className="w-48"><User className="h-3.5 w-3.5 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os membros</SelectItem>
            {mockPeople.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-03">Março 2026</SelectItem>
            <SelectItem value="2026-02">Fevereiro 2026</SelectItem>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <p className="text-xs text-muted-foreground">Total gasto</p>
          </div>
          <p className="text-xl font-bold text-foreground">{fmt(totalGasto)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total recebido</p>
          </div>
          <p className="text-xl font-bold text-foreground">{fmt(totalReceita)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground mb-1">Saldo do período</p>
          <p className={cn("text-xl font-bold", saldo >= 0 ? "text-primary" : "text-destructive")}>{fmt(saldo)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground mb-1">Reembolsável</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalReimbursable)}</p>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie chart by category */}
        <Card>
          <CardHeader><CardTitle className="text-base">Gastos por Categoria</CardTitle></CardHeader>
          <CardContent>
            {byCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" stroke="none">
                      {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {byCategory.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-foreground">{d.name}: {fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados para o período.</p>
            )}
          </CardContent>
        </Card>

        {/* Comparative bars */}
        <Card>
          <CardHeader><CardTitle className="text-base">Comparativo por Membro</CardTitle><CardDescription>Gastos do mês por pessoa</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byPerson} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" width={60} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" name="Gasto" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Pessoa</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Reemb.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => {
                const person = mockPeople.find(p => p.id === t.personId);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{t.date.split("-").reverse().join("/")}</TableCell>
                    <TableCell className="font-medium text-sm">{t.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                    <TableCell className="text-sm">{person?.name}</TableCell>
                    <TableCell className="text-center">
                      {t.type === "gasto"
                        ? <Badge variant="destructive" className="text-xs">Gasto</Badge>
                        : <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Receita</Badge>
                      }
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", t.type === "receita" ? "text-primary" : "text-foreground")}>{fmt(t.amount)}</TableCell>
                    <TableCell className="text-center">
                      {t.reimbursable ? <Badge variant="secondary" className="text-xs">Sim</Badge> : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
