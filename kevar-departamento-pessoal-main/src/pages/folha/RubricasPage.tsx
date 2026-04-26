import { useState } from "react";
import { GradientCard } from "@/components/GradientCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockRubricas = [
  { codigo: "1000", descricao: "Salário Base", tipo: "Provento", incidencia: "INSS/IRRF/FGTS", valor: null },
  { codigo: "1010", descricao: "Hora Extra 50%", tipo: "Provento", incidencia: "INSS/IRRF/FGTS", valor: null },
  { codigo: "1020", descricao: "Hora Extra 100%", tipo: "Provento", incidencia: "INSS/IRRF/FGTS", valor: null },
  { codigo: "1050", descricao: "Adicional Noturno", tipo: "Provento", incidencia: "INSS/IRRF/FGTS", valor: null },
  { codigo: "2000", descricao: "Desc. INSS", tipo: "Desconto", incidencia: "—", valor: null },
  { codigo: "2010", descricao: "Desc. IRRF", tipo: "Desconto", incidencia: "—", valor: null },
  { codigo: "2020", descricao: "Vale Transporte", tipo: "Desconto", incidencia: "—", valor: "6%" },
  { codigo: "2030", descricao: "Vale Refeição", tipo: "Desconto", incidencia: "—", valor: "20%" },
  { codigo: "3000", descricao: "Férias", tipo: "Provento", incidencia: "INSS/IRRF/FGTS", valor: null },
  { codigo: "3010", descricao: "1/3 Férias", tipo: "Provento", incidencia: "INSS/IRRF/FGTS", valor: null },
];

export default function RubricasPage() {
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("provento");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Rubricas & Verbas</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Cadastrar Nova Rubrica</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="font-inter">Código</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: 1100" />
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Comissão" />
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="provento">Provento</SelectItem>
                <SelectItem value="desconto">Desconto</SelectItem>
                <SelectItem value="informativo">Informativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Salvar</Button>
          </div>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Código</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Descrição</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Tipo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Incidência</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Valor/Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockRubricas.map((r) => (
              <tr key={r.codigo} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{r.codigo}</td>
                <td className="px-6 py-4 text-foreground">{r.descricao}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    r.tipo === "Provento" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-destructive/10 text-destructive"
                  }`}>{r.tipo}</span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{r.incidencia}</td>
                <td className="px-6 py-4 text-foreground">{r.valor || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
