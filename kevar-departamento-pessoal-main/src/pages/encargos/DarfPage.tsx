import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const mockGuias = [
  { tipo: "DARF — IRRF", codigo: "0561", competencia: "03/2025", valor: 128320, vencimento: "20/04/2025", status: "Pendente" },
  { tipo: "GPS — INSS", codigo: "2100", competencia: "03/2025", valor: 121751.40, vencimento: "20/04/2025", status: "Pendente" },
  { tipo: "GRF — FGTS", codigo: "—", competencia: "03/2025", valor: 38985.60, vencimento: "07/04/2025", status: "Gerada" },
  { tipo: "DARF — PIS", codigo: "8301", competencia: "03/2025", valor: 4873.20, vencimento: "25/04/2025", status: "Pendente" },
  { tipo: "GFIP", codigo: "—", competencia: "02/2025", valor: 0, vencimento: "07/03/2025", status: "Transmitida" },
];

function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function DarfPage() {
  const [competencia, setCompetencia] = useState("03/2025");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">DARF / GFIP — Guias e Obrigações</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Gerar Guia</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Tipo</Label>
            <Select defaultValue="darf"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="darf">DARF</SelectItem><SelectItem value="gps">GPS</SelectItem><SelectItem value="grf">GRF</SelectItem><SelectItem value="gfip">GFIP</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Código Receita</Label>
            <Input placeholder="Ex: 0561" />
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="03/2025">Março/2025</SelectItem><SelectItem value="02/2025">Fevereiro/2025</SelectItem></SelectContent></Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Gerar</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Tipo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Código</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Comp.</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Valor</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Vencimento</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockGuias.map((g, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{g.tipo}</td>
                <td className="px-6 py-4 text-foreground font-mono text-xs">{g.codigo}</td>
                <td className="px-6 py-4 text-foreground">{g.competencia}</td>
                <td className="px-6 py-4 font-nirmala font-bold text-foreground">{g.valor > 0 ? `R$ ${fmt(g.valor)}` : "—"}</td>
                <td className="px-6 py-4 text-foreground">{g.vencimento}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    g.status === "Transmitida" || g.status === "Gerada" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-accent/20 text-accent-foreground"
                  }`}>{g.status}</span>
                </td>
                <td className="px-6 py-4"><Button variant="outline" size="sm" className="text-xs font-inter">Imprimir</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
