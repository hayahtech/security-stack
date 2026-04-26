import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const mockEventos = [
  { id: 1, tipo: "S-1200", descricao: "Remuneração do Trabalhador", competencia: "03/2025", funcionario: "Carlos Eduardo Silva", prazo: "07/04/2025", status: "Pendente" },
  { id: 2, tipo: "S-1200", descricao: "Remuneração do Trabalhador", competencia: "03/2025", funcionario: "Mariana Costa", prazo: "07/04/2025", status: "Pendente" },
  { id: 3, tipo: "S-2200", descricao: "Admissão de Trabalhador", competencia: "03/2025", funcionario: "Pedro Santos", prazo: "10/03/2025", status: "Atrasado" },
  { id: 4, tipo: "S-1000", descricao: "Informações do Empregador", competencia: "03/2025", funcionario: "—", prazo: "07/04/2025", status: "Pendente" },
  { id: 5, tipo: "S-1210", descricao: "Pagamentos de Rendimentos", competencia: "03/2025", funcionario: "Todos", prazo: "07/04/2025", status: "Pendente" },
  { id: 6, tipo: "S-2299", descricao: "Desligamento", competencia: "02/2025", funcionario: "Ana Paula Ferreira", prazo: "10/03/2025", status: "Transmitido" },
];

export default function EventosPendentesPage() {
  const [filtro, setFiltro] = useState("todos");

  const filtered = filtro === "todos" ? mockEventos : mockEventos.filter((e) => e.status.toLowerCase() === filtro);

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Eventos eSocial Pendentes</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GradientCard variant="alert"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Pendentes</p><h3 className="font-nirmala text-3xl text-foreground">4</h3></GradientCard>
        <GradientCard variant="std"><p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1 font-inter">Atrasados</p><h3 className="font-nirmala text-3xl text-foreground">1</h3></GradientCard>
        <GradientCard variant="esocial"><p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1 font-inter">Transmitidos</p><h3 className="font-nirmala text-3xl text-foreground">1</h3></GradientCard>
      </div>

      <GradientCard variant="std" className="!p-6">
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Filtrar por Status</Label>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="transmitido">Transmitido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Transmitir Selecionados</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Evento</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Descrição</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Comp.</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Prazo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-bold text-foreground">{e.tipo}</td>
                <td className="px-6 py-4 text-foreground">{e.descricao}</td>
                <td className="px-6 py-4 text-foreground">{e.funcionario}</td>
                <td className="px-6 py-4 text-foreground">{e.competencia}</td>
                <td className="px-6 py-4 text-foreground">{e.prazo}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    e.status === "Pendente" ? "bg-accent/20 text-accent-foreground" : e.status === "Atrasado" ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }`}>{e.status}</span>
                </td>
                <td className="px-6 py-4">
                  {e.status !== "Transmitido" && <Button variant="outline" size="sm" className="text-xs font-inter">Transmitir</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
