import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Heart, Download, FileText, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";

// ─── Mock ───
interface Donation {
  id: string;
  date: string;
  beneficiary: string;
  cnpj?: string;
  type: "dinheiro" | "dizimo" | "oferta" | "bens" | "patrocinio" | "outro";
  amount: number;
  deductible: boolean;
  hasReceipt: boolean;
  category: string;
}

const mockDonations: Donation[] = [
  { id: "dn1", date: "2026-01-15", beneficiary: "Igreja Batista Central", cnpj: "", type: "dizimo", amount: 850, deductible: false, hasReceipt: true, category: "Dízimo/Oferta" },
  { id: "dn2", date: "2026-01-28", beneficiary: "Fundo Municipal da Criança", cnpj: "12.345.678/0001-90", type: "dinheiro", amount: 500, deductible: true, hasReceipt: true, category: "Doações" },
  { id: "dn3", date: "2026-02-10", beneficiary: "Igreja Batista Central", cnpj: "", type: "dizimo", amount: 850, deductible: false, hasReceipt: true, category: "Dízimo/Oferta" },
  { id: "dn4", date: "2026-02-20", beneficiary: "APAE - Associação de Pais e Amigos", cnpj: "23.456.789/0001-01", type: "dinheiro", amount: 300, deductible: true, hasReceipt: true, category: "Doações" },
  { id: "dn5", date: "2026-03-05", beneficiary: "Igreja Batista Central", cnpj: "", type: "dizimo", amount: 850, deductible: false, hasReceipt: true, category: "Dízimo/Oferta" },
  { id: "dn6", date: "2026-03-02", beneficiary: "Campanha do Agasalho", type: "bens", amount: 200, deductible: false, hasReceipt: false, category: "Doações" },
  { id: "dn7", date: "2026-02-14", beneficiary: "Fundo Municipal do Idoso", cnpj: "34.567.890/0001-12", type: "dinheiro", amount: 400, deductible: true, hasReceipt: true, category: "Doações" },
  { id: "dn8", date: "2026-01-20", beneficiary: "ONG Amigos do Bem", cnpj: "45.678.901/0001-23", type: "patrocinio", amount: 1000, deductible: false, hasReceipt: true, category: "Doações" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const TYPE_LABELS: Record<string, string> = { dinheiro: "Dinheiro", dizimo: "Dízimo", oferta: "Oferta", bens: "Bens", patrocinio: "Patrocínio", outro: "Outro" };
const PIE_COLORS = ["hsl(149, 62%, 26%)", "hsl(213, 78%, 37%)", "hsl(37, 100%, 50%)", "hsl(0, 72%, 50%)", "hsl(280, 60%, 50%)", "hsl(180, 50%, 40%)"];

export default function DoacoesExercicio() {
  const { isEmpresarial } = useProfile();
  const [year, setYear] = useState("2026");
  const [filterType, setFilterType] = useState("all");

  const filtered = useMemo(() => {
    let list = mockDonations.filter(d => d.date.startsWith(year));
    if (filterType !== "all") list = list.filter(d => d.type === filterType);
    return list;
  }, [year, filterType]);

  const totalDonated = filtered.reduce((s, d) => s + d.amount, 0);
  const totalDeductible = filtered.filter(d => d.deductible).reduce((s, d) => s + d.amount, 0);
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(d => map.set(d.type, (map.get(d.type) || 0) + d.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name: TYPE_LABELS[name] || name, value }));
  }, [filtered]);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Doações do Exercício</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doações do Exercício</h1>
          <p className="text-muted-foreground">Relatório anual de doações para declaração de IR</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => toast({ title: "PDF gerado", description: "Relatório de doações exportado." })}>
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground mb-1">Total doado</p>
          <p className="text-xl font-bold text-foreground">{fmt(totalDonated)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground mb-1">Potencialmente dedutível</p>
          <p className="text-xl font-bold text-primary">{fmt(totalDeductible)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground mb-1">Doações no ano</p>
          <p className="text-xl font-bold text-foreground">{filtered.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground mb-1">Com comprovante</p>
          <p className="text-xl font-bold text-foreground">{filtered.filter(d => d.hasReceipt).length}</p>
        </CardContent></Card>
      </div>

      {/* Chart + info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Composição por Tipo</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" stroke="none">
                  {byType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {byType.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-foreground">{d.name}: {fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <p className="font-semibold text-foreground">Dedutibilidade no IR</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Apenas doações a Fundos da Criança/Adolescente, do Idoso, incentivos culturais (Lei Rouanet) e desportivos podem ser deduzidas do Imposto de Renda, respeitando o limite de 6% do IR devido.
            </p>
            <p className="text-xs text-warning-foreground bg-warning/10 p-2 rounded">
              ⚠️ Consulte seu contador sobre dedutibilidade. Este relatório é informativo.
            </p>
            {totalDeductible > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-foreground">Valor potencialmente dedutível: <span className="font-bold text-primary">{fmt(totalDeductible)}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Dedutível</TableHead>
                <TableHead className="text-center">Comprovante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">{format(parseISO(d.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.beneficiary}</p>
                      {d.cnpj && <p className="text-xs text-muted-foreground font-mono">{d.cnpj}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{TYPE_LABELS[d.type]}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(d.amount)}</TableCell>
                  <TableCell className="text-center">
                    {d.deductible ? <CheckCircle2 className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {d.hasReceipt ? <FileText className="h-4 w-4 text-primary mx-auto" /> : <span className="text-xs text-destructive">Sem</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
