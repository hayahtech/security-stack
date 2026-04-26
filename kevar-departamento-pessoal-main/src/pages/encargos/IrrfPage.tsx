import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const mockIrrf = [
  { faixa: "Até R$ 2.259,20", aliquota: "Isento", dedução: 0, contribuintes: 35, totalRetido: 0 },
  { faixa: "R$ 2.259,21 a R$ 2.826,65", aliquota: "7,5%", dedução: 169.44, contribuintes: 42, totalRetido: 8920 },
  { faixa: "R$ 2.826,66 a R$ 3.751,05", aliquota: "15%", dedução: 381.44, contribuintes: 68, totalRetido: 28400 },
  { faixa: "R$ 3.751,06 a R$ 4.664,68", aliquota: "22,5%", dedução: 662.77, contribuintes: 55, totalRetido: 38200 },
  { faixa: "Acima de R$ 4.664,68", aliquota: "27,5%", dedução: 896.00, contribuintes: 47, totalRetido: 52800 },
];

const totalRetido = mockIrrf.reduce((s, r) => s + r.totalRetido, 0);
function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function IrrfPage() {
  const [competencia, setCompetencia] = useState("03/2025");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">IRRF — Imposto de Renda Retido na Fonte</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GradientCard variant="payroll"><p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 font-inter">Total IRRF</p><h3 className="font-nirmala text-3xl text-foreground">R$ {fmt(totalRetido)}</h3></GradientCard>
        <GradientCard variant="std"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 font-inter">Contribuintes</p><h3 className="font-nirmala text-3xl text-foreground">212</h3><p className="text-[10px] text-muted-foreground mt-1 font-inter">35 isentos</p></GradientCard>
        <GradientCard variant="alert"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Vencimento DARF</p><h3 className="font-nirmala text-3xl text-foreground">20/Abr</h3></GradientCard>
      </div>

      <GradientCard variant="std" className="!p-6">
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="03/2025">Março/2025</SelectItem><SelectItem value="02/2025">Fevereiro/2025</SelectItem></SelectContent></Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Gerar DARF</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Faixa</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Alíquota</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Dedução</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Contribuintes</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Total Retido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockIrrf.map((r, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 text-foreground text-xs">{r.faixa}</td>
                <td className="px-6 py-4 font-bold text-foreground">{r.aliquota}</td>
                <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.dedução)}</td>
                <td className="px-6 py-4 text-foreground">{r.contribuintes}</td>
                <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(r.totalRetido)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-secondary/80 border-t-2 border-border">
            <tr className="font-semibold text-foreground"><td className="px-6 py-4" colSpan={4}>Total</td><td className="px-6 py-4 font-nirmala font-bold">R$ {fmt(totalRetido)}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
