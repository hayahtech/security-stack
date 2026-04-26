import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const mockInss = [
  { faixa: "Até R$ 1.412,00", aliquota: "7,5%", contribuintes: 12, totalBase: 16944, totalDesconto: 1270.80 },
  { faixa: "R$ 1.412,01 a R$ 2.666,68", aliquota: "9%", contribuintes: 45, totalBase: 93340, totalDesconto: 8400.60 },
  { faixa: "R$ 2.666,69 a R$ 4.000,03", aliquota: "12%", contribuintes: 82, totalBase: 278800, totalDesconto: 33456.00 },
  { faixa: "R$ 4.000,04 a R$ 7.786,02", aliquota: "14%", contribuintes: 108, totalBase: 561600, totalDesconto: 78624.00 },
];

const totalContribuintes = mockInss.reduce((s, r) => s + r.contribuintes, 0);
const totalDesconto = mockInss.reduce((s, r) => s + r.totalDesconto, 0);

function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function InssPage() {
  const [competencia, setCompetencia] = useState("03/2025");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">INSS — Contribuição Previdenciária</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GradientCard variant="payroll"><p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 font-inter">Total INSS</p><h3 className="font-nirmala text-3xl text-foreground">R$ {fmt(totalDesconto)}</h3></GradientCard>
        <GradientCard variant="std"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 font-inter">Contribuintes</p><h3 className="font-nirmala text-3xl text-foreground">{totalContribuintes}</h3></GradientCard>
        <GradientCard variant="alert"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Vencimento GPS</p><h3 className="font-nirmala text-3xl text-foreground">20/Abr</h3></GradientCard>
      </div>

      <GradientCard variant="std" className="!p-6">
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="03/2025">Março/2025</SelectItem><SelectItem value="02/2025">Fevereiro/2025</SelectItem></SelectContent></Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Gerar GPS</Button>
          <Button variant="outline" className="font-inter">Exportar Relatório</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Faixa Salarial</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Alíquota</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Contribuintes</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Base de Cálculo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Total Desconto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockInss.map((r, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 text-foreground">{r.faixa}</td>
                <td className="px-6 py-4 font-bold text-foreground">{r.aliquota}</td>
                <td className="px-6 py-4 text-foreground">{r.contribuintes}</td>
                <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.totalBase)}</td>
                <td className="px-6 py-4 font-nirmala font-bold text-destructive">R$ {fmt(r.totalDesconto)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-secondary/80 border-t-2 border-border">
            <tr className="font-semibold text-foreground">
              <td className="px-6 py-4">Total</td><td className="px-6 py-4">—</td><td className="px-6 py-4">{totalContribuintes}</td><td className="px-6 py-4">—</td>
              <td className="px-6 py-4 font-nirmala font-bold text-destructive">R$ {fmt(totalDesconto)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
