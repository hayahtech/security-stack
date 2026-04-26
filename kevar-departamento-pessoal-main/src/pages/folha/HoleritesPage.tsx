import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockHolerites = [
  { nome: "Carlos Eduardo Silva", cpf: "123.456.789-00", competencia: "03/2025", bruto: 8500, descontos: 1950, liquido: 6550, status: "Disponível" },
  { nome: "Mariana Costa", cpf: "234.567.890-11", competencia: "03/2025", bruto: 12400, descontos: 3100, liquido: 9300, status: "Disponível" },
  { nome: "Roberto Oliveira", cpf: "345.678.901-22", competencia: "03/2025", bruto: 4200, descontos: 650, liquido: 3550, status: "Pendente" },
  { nome: "Juliana Mendes", cpf: "456.789.012-33", competencia: "03/2025", bruto: 7100, descontos: 1420, liquido: 5680, status: "Disponível" },
  { nome: "Fernando Souza", cpf: "567.890.123-44", competencia: "03/2025", bruto: 5800, descontos: 980, liquido: 4820, status: "Pendente" },
];

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function HoleritesPage() {
  const [busca, setBusca] = useState("");
  const [competencia, setCompetencia] = useState("03/2025");

  const filtered = mockHolerites.filter((h) => h.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Holerites</h1>

      <GradientCard variant="std" className="!p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-inter">Buscar Funcionário</Label>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou CPF..." />
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="03/2025">Março/2025</SelectItem>
                <SelectItem value="02/2025">Fevereiro/2025</SelectItem>
                <SelectItem value="01/2025">Janeiro/2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Gerar Holerites em Lote</Button>
          </div>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">CPF</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Bruto</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Descontos</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Líquido</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((h, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{h.nome}</td>
                <td className="px-6 py-4 text-muted-foreground">{h.cpf}</td>
                <td className="px-6 py-4 font-nirmala">R$ {fmt(h.bruto)}</td>
                <td className="px-6 py-4 font-nirmala text-destructive">- R$ {fmt(h.descontos)}</td>
                <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(h.liquido)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    h.status === "Disponível" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-accent/20 text-accent-foreground"
                  }`}>{h.status}</span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs font-inter">Visualizar</Button>
                  <Button variant="outline" size="sm" className="text-xs font-inter">PDF</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
