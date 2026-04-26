import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockFerias = [
  { nome: "Carlos Eduardo Silva", periodoAquisitivo: "01/2024 — 01/2025", diasDireito: 30, diasGozados: 0, inicio: "01/04/2025", fim: "30/04/2025", abono: "Não", status: "Programada" },
  { nome: "Mariana Costa", periodoAquisitivo: "06/2023 — 06/2024", diasDireito: 30, diasGozados: 15, inicio: "15/03/2025", fim: "29/03/2025", abono: "Sim (10 dias)", status: "Em Gozo" },
  { nome: "Juliana Mendes", periodoAquisitivo: "03/2024 — 03/2025", diasDireito: 30, diasGozados: 0, inicio: "—", fim: "—", abono: "—", status: "Pendente" },
  { nome: "Fernando Souza", periodoAquisitivo: "08/2023 — 08/2024", diasDireito: 30, diasGozados: 30, inicio: "01/01/2025", fim: "30/01/2025", abono: "Não", status: "Gozada" },
];

const mock13 = [
  { nome: "Carlos Eduardo Silva", salario: 8500, primeira: 4250, segunda: 4250, descontos: 935, liquido: 7815, status: "1ª Paga" },
  { nome: "Mariana Costa", salario: 12400, primeira: 6200, segunda: 6200, descontos: 1814, liquido: 10586, status: "1ª Paga" },
  { nome: "Roberto Oliveira", salario: 4200, primeira: 2100, segunda: 2100, descontos: 378, liquido: 3822, status: "Pendente" },
  { nome: "Juliana Mendes", salario: 7100, primeira: 3550, segunda: 3550, descontos: 781, liquido: 6319, status: "Pendente" },
];

function fmt(val: number) { return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

export default function FeriasPage() {
  const [form, setForm] = useState({ funcionario: "", inicio: "", dias: "30", abono: "nao" });
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Férias & 13º Salário</h1>

      <Tabs defaultValue="ferias" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="ferias" className="font-inter">Férias</TabsTrigger>
          <TabsTrigger value="decimo" className="font-inter">13º Salário</TabsTrigger>
        </TabsList>

        <TabsContent value="ferias" className="space-y-6 mt-6">
          <GradientCard variant="std" className="!p-6">
            <h3 className="font-nirmala text-lg text-foreground mb-4">Programar Férias</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2"><Label className="font-inter">Funcionário</Label><Input value={form.funcionario} onChange={(e) => update("funcionario", e.target.value)} placeholder="Nome ou matrícula" /></div>
              <div className="space-y-2"><Label className="font-inter">Data Início</Label><Input type="date" value={form.inicio} onChange={(e) => update("inicio", e.target.value)} /></div>
              <div className="space-y-2">
                <Label className="font-inter">Dias</Label>
                <Select value={form.dias} onValueChange={(v) => update("dias", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">30 dias</SelectItem><SelectItem value="20">20 dias</SelectItem><SelectItem value="15">15 dias</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label className="font-inter">Abono Pecuniário</Label>
                <Select value={form.abono} onValueChange={(v) => update("abono", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nao">Não</SelectItem><SelectItem value="sim">Sim (10 dias)</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="mt-4"><Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Programar</Button></div>
          </GradientCard>

          <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm font-inter">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Per. Aquisitivo</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Dias</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Início</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Fim</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Abono</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockFerias.map((f, i) => (
                  <tr key={i} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{f.nome}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{f.periodoAquisitivo}</td>
                    <td className="px-6 py-4 text-foreground">{f.diasDireito}</td>
                    <td className="px-6 py-4 text-foreground">{f.inicio}</td>
                    <td className="px-6 py-4 text-foreground">{f.fim}</td>
                    <td className="px-6 py-4 text-foreground">{f.abono}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        f.status === "Gozada" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : f.status === "Em Gozo" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : f.status === "Programada" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-muted-foreground"
                      }`}>{f.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="decimo" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GradientCard variant="payroll"><p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 font-inter">Total 13º Bruto</p><h3 className="font-nirmala text-3xl text-foreground">R$ 32.200,00</h3></GradientCard>
            <GradientCard variant="std"><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 font-inter">1ª Parcela Paga</p><h3 className="font-nirmala text-3xl text-foreground">2 de 4</h3></GradientCard>
            <GradientCard variant="alert"><p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Prazo 1ª Parcela</p><h3 className="font-nirmala text-3xl text-foreground">30/Nov</h3></GradientCard>
          </div>

          <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm font-inter">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Salário</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">1ª Parcela</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">2ª Parcela</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Descontos</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Líquido</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mock13.map((r, i) => (
                  <tr key={i} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{r.nome}</td>
                    <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.salario)}</td>
                    <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.primeira)}</td>
                    <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(r.segunda)}</td>
                    <td className="px-6 py-4 font-nirmala text-destructive">R$ {fmt(r.descontos)}</td>
                    <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(r.liquido)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        r.status === "1ª Paga" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-accent/20 text-accent-foreground"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
