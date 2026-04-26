import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockAdmissoes = [
  { nome: "Lucas Pereira", cpf: "111.222.333-44", cargo: "Analista Jr.", departamento: "TI", dataAdmissao: "01/03/2025", salario: 4500, status: "Ativa" },
  { nome: "Beatriz Lima", cpf: "222.333.444-55", cargo: "Assistente RH", departamento: "RH", dataAdmissao: "15/02/2025", salario: 3200, status: "Ativa" },
  { nome: "Pedro Santos", cpf: "333.444.555-66", cargo: "Estagiário", departamento: "Financeiro", dataAdmissao: "10/03/2025", salario: 1800, status: "Pendente eSocial" },
];

function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function NovaAdmissaoPage() {
  const [form, setForm] = useState({ nome: "", cpf: "", cargo: "", departamento: "", salario: "", dataAdmissao: "" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Nova Admissão</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Dados do Funcionário</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label className="font-inter">Nome Completo</Label><Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Nome completo" /></div>
          <div className="space-y-2"><Label className="font-inter">CPF</Label><Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
          <div className="space-y-2"><Label className="font-inter">Cargo</Label><Input value={form.cargo} onChange={(e) => update("cargo", e.target.value)} placeholder="Ex: Analista Jr." /></div>
          <div className="space-y-2">
            <Label className="font-inter">Departamento</Label>
            <Select value={form.departamento} onValueChange={(v) => update("departamento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ti">TI</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="operacoes">Operações</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label className="font-inter">Salário Base</Label><Input value={form.salario} onChange={(e) => update("salario", e.target.value)} placeholder="R$ 0,00" /></div>
          <div className="space-y-2"><Label className="font-inter">Data de Admissão</Label><Input type="date" value={form.dataAdmissao} onChange={(e) => update("dataAdmissao", e.target.value)} /></div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Registrar Admissão</Button>
          <Button variant="outline" className="font-inter">Limpar</Button>
        </div>
      </GradientCard>

      <div className="space-y-4">
        <h2 className="font-nirmala text-lg text-foreground">Admissões Recentes</h2>
        <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-muted-foreground font-medium">Nome</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">CPF</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Cargo</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Depto</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Admissão</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Salário</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockAdmissoes.map((a, i) => (
                <tr key={i} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{a.nome}</td>
                  <td className="px-6 py-4 text-muted-foreground">{a.cpf}</td>
                  <td className="px-6 py-4 text-foreground">{a.cargo}</td>
                  <td className="px-6 py-4 text-foreground">{a.departamento}</td>
                  <td className="px-6 py-4 text-foreground">{a.dataAdmissao}</td>
                  <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(a.salario)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      a.status === "Ativa" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-accent/20 text-accent-foreground"
                    }`}>{a.status}</span>
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
