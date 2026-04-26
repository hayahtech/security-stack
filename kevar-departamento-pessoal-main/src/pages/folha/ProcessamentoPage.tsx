import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockProcessamentos = [
  { id: 1, competencia: "03/2025", status: "Em Processamento", funcionarios: 247, totalBruto: 487320, totalLiquido: 389900 },
  { id: 2, competencia: "02/2025", status: "Fechado", funcionarios: 244, totalBruto: 482100, totalLiquido: 385200 },
  { id: 3, competencia: "01/2025", status: "Fechado", funcionarios: 241, totalBruto: 478300, totalLiquido: 382100 },
];

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function ProcessamentoPage() {
  const [competencia, setCompetencia] = useState("03/2025");
  const [tipo, setTipo] = useState("mensal");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Processamento Mensal</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Novo Processamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Input value={competencia} onChange={(e) => setCompetencia(e.target.value)} placeholder="MM/AAAA" />
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Tipo de Folha</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="complementar">Complementar</SelectItem>
                <SelectItem value="adiantamento">Adiantamento</SelectItem>
                <SelectItem value="13_1">13º - 1ª Parcela</SelectItem>
                <SelectItem value="13_2">13º - 2ª Parcela</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Iniciar Processamento</Button>
          </div>
        </div>
      </GradientCard>

      <div className="space-y-4">
        <h2 className="font-nirmala text-lg text-foreground">Histórico de Processamentos</h2>
        <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-muted-foreground font-medium">Competência</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Funcionários</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Total Bruto</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Total Líquido</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockProcessamentos.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{p.competencia}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-inter ${
                      p.status === "Fechado" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-accent/20 text-accent-foreground"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-foreground">{p.funcionarios}</td>
                  <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(p.totalBruto)}</td>
                  <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(p.totalLiquido)}</td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" className="text-xs font-inter">Detalhes</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
