import { GradientCard } from "@/components/GradientCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { FileText, Download } from "lucide-react";

const relatorios = [
  { categoria: "Folha de Pagamento", items: ["Resumo da Folha", "Folha Analítica", "Folha Sintética", "Líquido por Departamento", "Provisão de Férias e 13º"] },
  { categoria: "Encargos Sociais", items: ["GPS — Guia da Previdência Social", "GRF — FGTS", "DARF — IRRF", "SEFIP/GFIP", "DCTFWeb"] },
  { categoria: "Obrigações Acessórias", items: ["DIRF", "RAIS", "CAGED / Novo CAGED", "Informe de Rendimentos", "eSocial — Relatório de Eventos"] },
  { categoria: "Gestão de Pessoal", items: ["Ficha de Registro", "Quadro de Horários", "Escala de Férias", "Controle de Ponto", "Afastamentos"] },
];

const mockHistorico = [
  { relatorio: "Folha Analítica", competencia: "03/2025", geradoEm: "25/03/2025 14:30", usuario: "Ana Gestora", formato: "PDF" },
  { relatorio: "GPS — INSS", competencia: "02/2025", geradoEm: "20/02/2025 16:45", usuario: "Ana Gestora", formato: "PDF" },
  { relatorio: "SEFIP/GFIP", competencia: "02/2025", geradoEm: "07/03/2025 09:15", usuario: "Carlos Silva", formato: "TXT" },
  { relatorio: "Informe de Rendimentos", competencia: "2024", geradoEm: "28/02/2025 11:00", usuario: "Ana Gestora", formato: "PDF" },
];

export default function RelatoriosPage() {
  const [competencia, setCompetencia] = useState("03/2025");
  const [formato, setFormato] = useState("pdf");

  return (
    <div className="space-y-8">
      <h1 className="font-nirmala text-2xl text-foreground">Relatórios Legais</h1>

      <GradientCard variant="std" className="!p-6">
        <h3 className="font-nirmala text-lg text-foreground mb-4">Gerar Relatório</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="font-inter">Relatório</Label>
            <Select defaultValue="folha_analitica"><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {relatorios.flatMap((cat) => cat.items.map((item) => (
                  <SelectItem key={item} value={item.toLowerCase().replace(/\s/g, "_")}>{item}</SelectItem>
                )))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Competência</Label>
            <Select value={competencia} onValueChange={setCompetencia}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="03/2025">Março/2025</SelectItem><SelectItem value="02/2025">Fevereiro/2025</SelectItem><SelectItem value="01/2025">Janeiro/2025</SelectItem><SelectItem value="2024">Ano 2024</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-2">
            <Label className="font-inter">Formato</Label>
            <Select value={formato} onValueChange={setFormato}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pdf">PDF</SelectItem><SelectItem value="xlsx">Excel (XLSX)</SelectItem><SelectItem value="csv">CSV</SelectItem><SelectItem value="txt">TXT</SelectItem></SelectContent></Select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-inter">
            <Download size={16} className="mr-2" />Gerar
          </Button>
        </div>
      </GradientCard>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatorios.map((cat) => (
          <GradientCard key={cat.categoria} variant="std" className="!p-5">
            <h4 className="font-nirmala text-lg text-foreground mb-3 flex items-center gap-2">
              <FileText size={18} className="text-muted-foreground" />
              {cat.categoria}
            </h4>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div key={item} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary transition-colors">
                  <span className="text-sm text-foreground font-inter">{item}</span>
                  <Button variant="ghost" size="sm" className="text-xs text-accent font-inter">Gerar</Button>
                </div>
              ))}
            </div>
          </GradientCard>
        ))}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h2 className="font-nirmala text-lg text-foreground">Histórico de Relatórios</h2>
        <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm font-inter">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-4 text-muted-foreground font-medium">Relatório</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Competência</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Gerado em</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Usuário</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Formato</th>
                <th className="px-6 py-4 text-muted-foreground font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockHistorico.map((r, i) => (
                <tr key={i} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{r.relatorio}</td>
                  <td className="px-6 py-4 text-foreground">{r.competencia}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{r.geradoEm}</td>
                  <td className="px-6 py-4 text-foreground">{r.usuario}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-secondary text-muted-foreground">{r.formato}</span>
                  </td>
                  <td className="px-6 py-4"><Button variant="outline" size="sm" className="text-xs font-inter"><Download size={12} className="mr-1" />Baixar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
