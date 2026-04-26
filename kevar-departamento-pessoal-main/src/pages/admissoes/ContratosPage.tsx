import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const mockContratos = [
  { nome: "Carlos Eduardo Silva", tipo: "CLT Indeterminado", inicio: "15/01/2022", fim: "—", jornada: "44h/sem", status: "Vigente" },
  { nome: "Mariana Costa", tipo: "CLT Indeterminado", inicio: "03/06/2020", fim: "—", jornada: "44h/sem", status: "Vigente" },
  { nome: "Roberto Oliveira", tipo: "CLT Determinado", inicio: "01/01/2025", fim: "30/06/2025", jornada: "44h/sem", status: "Vigente" },
  { nome: "Lucas Pereira", tipo: "Estágio", inicio: "01/03/2025", fim: "01/03/2026", jornada: "30h/sem", status: "Vigente" },
  { nome: "Ana Paula Ferreira", tipo: "CLT Indeterminado", inicio: "10/03/2021", fim: "28/02/2025", jornada: "44h/sem", status: "Encerrado" },
];

export default function ContratosPage() {
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const filtered = filtroTipo === "todos" ? mockContratos : mockContratos.filter((c) => c.tipo.toLowerCase().includes(filtroTipo));

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Contratos</h1>

      <GradientCard variant="std" className="!p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-inter">Buscar</Label>
            <Input placeholder="Nome do funcionário..." />
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Tipo de Contrato</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="indeterminado">CLT Indeterminado</SelectItem>
                <SelectItem value="determinado">CLT Determinado</SelectItem>
                <SelectItem value="estágio">Estágio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Novo Contrato</Button>
          </div>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Tipo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Início</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Fim</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Jornada</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{c.nome}</td>
                <td className="px-6 py-4 text-foreground">{c.tipo}</td>
                <td className="px-6 py-4 text-foreground">{c.inicio}</td>
                <td className="px-6 py-4 text-foreground">{c.fim}</td>
                <td className="px-6 py-4 text-foreground">{c.jornada}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    c.status === "Vigente" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-secondary text-muted-foreground"
                  }`}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
