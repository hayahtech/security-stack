import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockRescisoes = [
  { nome: "Ana Paula Ferreira", cpf: "444.555.666-77", motivo: "Pedido de Demissão", dataDesligamento: "28/02/2025", salario: 5200, verbas: 12480, status: "Homologada" },
  { nome: "Marcos Vinícius", cpf: "555.666.777-88", motivo: "Sem Justa Causa", dataDesligamento: "15/03/2025", salario: 6800, verbas: 28900, status: "Em Cálculo" },
  { nome: "Cristina Alves", cpf: "666.777.888-99", motivo: "Término de Contrato", dataDesligamento: "31/03/2025", salario: 3100, verbas: 8200, status: "Pendente" },
];

function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function RescisoesPage() {
  const [form, setForm] = useState({ funcionario: "", motivo: "", dataDesligamento: "" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Rescisões</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Nova Rescisão</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="font-inter">Funcionário</Label><Input value={form.funcionario} onChange={(e) => update("funcionario", e.target.value)} placeholder="Nome ou matrícula" /></div>
          <div className="space-y-2">
            <Label className="font-inter">Motivo</Label>
            <Select value={form.motivo} onValueChange={(v) => update("motivo", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pedido">Pedido de Demissão</SelectItem>
                <SelectItem value="sem_justa">Sem Justa Causa</SelectItem>
                <SelectItem value="justa">Justa Causa</SelectItem>
                <SelectItem value="acordo">Acordo Mútuo</SelectItem>
                <SelectItem value="termino">Término de Contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label className="font-inter">Data Desligamento</Label><Input type="date" value={form.dataDesligamento} onChange={(e) => update("dataDesligamento", e.target.value)} /></div>
        </div>
        <div className="mt-6">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Calcular Rescisão</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Nome</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">CPF</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Motivo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Desligamento</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Verbas Resc.</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockRescisoes.map((r, i) => (
              <tr key={i} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{r.nome}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.cpf}</td>
                <td className="px-6 py-4 text-foreground">{r.motivo}</td>
                <td className="px-6 py-4 text-foreground">{r.dataDesligamento}</td>
                <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(r.verbas)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    r.status === "Homologada" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : r.status === "Em Cálculo" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-muted-foreground"
                  }`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
