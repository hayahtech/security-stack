import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const mockTransmissoes = [
  { id: 1, lote: "LOTE-2025-001", eventos: 45, dataEnvio: "07/03/2025", protocolo: "1.2.2025.0003456", status: "Aceito" },
  { id: 2, lote: "LOTE-2025-002", eventos: 12, dataEnvio: "15/02/2025", protocolo: "1.2.2025.0002890", status: "Aceito" },
  { id: 3, lote: "LOTE-2025-003", eventos: 3, dataEnvio: "28/02/2025", protocolo: "1.2.2025.0003100", status: "Rejeitado" },
  { id: 4, lote: "LOTE-2025-004", eventos: 8, dataEnvio: "—", protocolo: "—", status: "Aguardando" },
];

export default function TransmissaoPage() {
  const [ambiente, setAmbiente] = useState("producao");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Transmissão eSocial</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Configuração de Transmissão</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Ambiente</Label>
            <Select value={ambiente} onValueChange={setAmbiente}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="producao">Produção</SelectItem>
                <SelectItem value="producao_restrita">Produção Restrita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">Transmitir Lote Pendente</Button>
          <Button variant="outline" className="font-inter">Consultar Protocolos</Button>
        </div>
      </GradientCard>

      <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm font-inter">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 text-muted-foreground font-medium">Lote</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Eventos</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Data Envio</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Protocolo</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Status</th>
              <th className="px-6 py-4 text-muted-foreground font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockTransmissoes.map((t) => (
              <tr key={t.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{t.lote}</td>
                <td className="px-6 py-4 text-foreground">{t.eventos}</td>
                <td className="px-6 py-4 text-foreground">{t.dataEnvio}</td>
                <td className="px-6 py-4 text-muted-foreground text-xs">{t.protocolo}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    t.status === "Aceito" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : t.status === "Rejeitado" ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-accent-foreground"
                  }`}>{t.status}</span>
                </td>
                <td className="px-6 py-4">
                  <Button variant="outline" size="sm" className="text-xs font-inter">Detalhes</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
