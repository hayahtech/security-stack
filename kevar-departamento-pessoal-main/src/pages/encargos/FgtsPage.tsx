import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const mockFgts = [
  { nome: "Carlos Eduardo Silva", salario: 8500, baseCalculo: 8500, fgts: 680, competencia: "03/2025" },
  { nome: "Mariana Costa", salario: 12400, baseCalculo: 12400, fgts: 992, competencia: "03/2025" },
  { nome: "Roberto Oliveira", salario: 4200, baseCalculo: 4200, fgts: 336, competencia: "03/2025" },
  { nome: "Juliana Mendes", salario: 7100, baseCalculo: 7100, fgts: 568, competencia: "03/2025" },
  { nome: "Fernando Souza", salario: 5800, baseCalculo: 5800, fgts: 464, competencia: "03/2025" },
];

const totalFgts = mockFgts.reduce((s, r) => s + r.fgts, 0);
function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function FgtsPage() {
  const [competencia, setCompetencia] = useState("03/2025");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">FGTS — Fundo de Garantia</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GradientCard variant="charges"><p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-1 font-inter">Total FGTS</p><h3 className="font-nirmala text-3xl text-foreground">R$ {fmt(totalFgts)}</h3></GradientCard>
        <GradientCard variant="std"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 font-inter">Alíquota</p><h3 className="font-nirmala text-3xl text-foreground">8%</h3></GradientCard>
        <GradientCard variant="alert"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Vencimento GRF</p><h3 className="font-nirmala text-3xl text-foreground">07/Abr</h3></GradientCard>
      </div>

      <GradientCard variant="std" className="!p-6">
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="03/2025">Março/2025</SelectItem><SelectItem value="02/2025">Fevereiro/2025</SelectItem></SelectContent></Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Gerar GRF</Button>
          <Button variant="outline" className="font-inter">SEFIP Analítico</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Salário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Base Cálculo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">FGTS (8%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockFgts.map((r, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{r.nome}</td>
                <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.salario)}</td>
                <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.baseCalculo)}</td>
                <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(r.fgts)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-secondary/80 border-t-2 border-border">
            <tr className="font-semibold text-foreground">
              <td className="px-6 py-4" colSpan={3}>Total</td>
              <td className="px-6 py-4 font-nirmala font-bold">R$ {fmt(totalFgts)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
