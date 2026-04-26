import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, FileText, Scale, Wallet, Clock, AlertTriangle, Landmark, Gauge, TrendingUp, Receipt, GitCompare, Telescope, Eye, FileDown, Mail, Calendar } from "lucide-react";
import { reports, reportsHistory, type Report } from "@/mock/reportsData";
import { toast } from "@/hooks/use-toast";

const iconMap: Record<string, typeof BarChart3> = {
  BarChart3, FileText, Scale, Wallet, Clock, AlertTriangle, Landmark, Gauge, TrendingUp, Receipt, GitCompare, Telescope,
};

const categoryColors: Record<string, string> = {
  Executivo: "bg-primary/20 text-primary border-primary/30",
  Contábil: "bg-secondary/20 text-secondary border-secondary/30",
  Tesouraria: "bg-success/20 text-success border-success/30",
  Contas: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Análise: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Fiscal: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Planejamento: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function Relatorios() {
  const [filter, setFilter] = useState("all");
  const [scheduleModal, setScheduleModal] = useState<Report | null>(null);
  const [scheduleFreq, setScheduleFreq] = useState("mensal");
  const [scheduleEmail, setScheduleEmail] = useState("");

  const filtered = filter === "all" ? reports : reports.filter((r) => r.category === filter);
  const categories = [...new Set(reports.map((r) => r.category))];

  const handleExport = (name: string, format: string) => {
    toast({ title: `Exportando ${format.toUpperCase()}`, description: `${name} será gerado em instantes.` });
  };

  const handleSchedule = () => {
    toast({ title: "Agendamento salvo!", description: `${scheduleModal?.name} será enviado ${scheduleFreq} para ${scheduleEmail}` });
    setScheduleModal(null);
    setScheduleEmail("");
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground font-data text-sm">Hub central de relatórios financeiros</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((report) => {
          const Icon = iconMap[report.icon] || FileText;
          const catColor = categoryColors[report.category] || "";
          return (
            <Card key={report.id} className="border-border/50 bg-card/80 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${catColor}`}>{report.category}</Badge>
                </div>
                <CardTitle className="text-sm font-data mt-2">{report.name}</CardTitle>
                <p className="text-xs text-muted-foreground font-data">{report.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs font-data text-muted-foreground">
                  <span>Gerado: {new Date(report.lastGenerated).toLocaleDateString("pt-BR")}</span>
                  <Badge variant="outline" className="text-[10px]">{report.frequency}</Badge>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => toast({ title: "Visualizando...", description: report.name })}>
                    <Eye className="w-3 h-3" /> Ver
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleExport(report.name, "pdf")}>
                    <FileDown className="w-3 h-3" /> PDF
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleExport(report.name, "excel")}>
                    <FileDown className="w-3 h-3" /> Excel
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => setScheduleModal(report)}>
                    <Mail className="w-3 h-3" /> Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* History */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-data flex items-center gap-2"><Clock className="w-4 h-4" /> Histórico de Geração</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-data">Relatório</TableHead>
                <TableHead className="font-data">Data</TableHead>
                <TableHead className="font-data">Formato</TableHead>
                <TableHead className="font-data">Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportsHistory.map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-data text-sm">{h.report}</TableCell>
                  <TableCell className="font-data text-sm text-muted-foreground">{new Date(h.date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{h.format}</Badge></TableCell>
                  <TableCell className="font-data text-sm text-muted-foreground">{h.user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      <Dialog open={!!scheduleModal} onOpenChange={() => setScheduleModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Agendar Envio</DialogTitle>
            <DialogDescription className="font-data text-sm">{scheduleModal?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-data text-xs">E-mail de destino</Label>
              <Input type="email" value={scheduleEmail} onChange={(e) => setScheduleEmail(e.target.value)} placeholder="cfo@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-data text-xs">Frequência</Label>
              <Select value={scheduleFreq} onValueChange={setScheduleFreq}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModal(null)}>Cancelar</Button>
            <Button onClick={handleSchedule} disabled={!scheduleEmail} className="gap-1"><Calendar className="w-4 h-4" /> Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
