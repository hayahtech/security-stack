import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockAdiantamentos = [
  { id: 1, nome: "Carlos Eduardo Silva", valor: 3400, percentual: "40%", competencia: "03/2025", dataPagamento: "15/03/2025", status: "Pago" },
  { id: 2, nome: "Mariana Costa", valor: 4960, percentual: "40%", competencia: "03/2025", dataPagamento: "15/03/2025", status: "Pago" },
  { id: 3, nome: "Roberto Oliveira", valor: 1680, percentual: "40%", competencia: "03/2025", dataPagamento: "15/03/2025", status: "Pendente" },
  { id: 4, nome: "Juliana Mendes", valor: 2840, percentual: "40%", competencia: "03/2025", dataPagamento: "15/03/2025", status: "Pendente" },
];

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function AdiantamentosPage() {
  const [percentual, setPercentual] = useState("40");
  const [dataPagamento, setDataPagamento] = useState("2025-03-15");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Adiantamentos</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Gerar Adiantamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-inter">Percentual do Salário</Label>
            <Select value={percentual} onValueChange={setPercentual}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30%</SelectItem>
                <SelectItem value="40">40%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Data de Pagamento</Label>
            <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Gerar para Todos</Button>
          </div>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Funcionário</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Valor</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">%</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Competência</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Data Pgto</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockAdiantamentos.map((a) => (
              <tr key={a.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{a.nome}</td>
                <td className="px-6 py-4 font-nirmala text-foreground">R$ {fmt(a.valor)}</td>
                <td className="px-6 py-4 text-foreground">{a.percentual}</td>
                <td className="px-6 py-4 text-foreground">{a.competencia}</td>
                <td className="px-6 py-4 text-foreground">{a.dataPagamento}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    a.status === "Pago" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-accent/20 text-accent-foreground"
                  }`}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
