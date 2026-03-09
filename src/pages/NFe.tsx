import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Receipt, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { nfeList, nfeResumo, type NFe } from "@/mock/nfeData";
import { toast } from "@/hooks/use-toast";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusConfig: Record<NFe["status"], { color: string; icon: typeof CheckCircle2 }> = {
  Emitida: { color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  Pendente: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
  Cancelada: { color: "bg-destructive/20 text-destructive border-destructive/30", icon: XCircle },
};

export default function NFePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ tomador: "", cnpj: "", servico: "Licenciamento de Software SaaS", valor: "" });

  const filtered = nfeList.filter((nf) => {
    const matchSearch = nf.tomador.toLowerCase().includes(search.toLowerCase()) || nf.numero.includes(search);
    const matchStatus = statusFilter === "all" || nf.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const valorForm = parseFloat(formData.valor) || 0;
  const issCalc = valorForm * 0.02;
  const pisCalc = valorForm * 0.0065;
  const cofinsCalc = valorForm * 0.03;
  const liquidoCalc = valorForm - issCalc - pisCalc - cofinsCalc;

  const handleEmit = () => {
    setShowModal(false);
    setFormData({ tomador: "", cnpj: "", servico: "Licenciamento de Software SaaS", valor: "" });
    toast({ title: "NF-e emitida com sucesso!", description: `Nota fiscal para ${formData.tomador} no valor de ${fmtBRL(valorForm)}` });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Emissão de NF-e</h1>
          <p className="text-muted-foreground font-data text-sm">Gestão de notas fiscais de serviço</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Emitir NF-e
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Emitido", value: fmtBRL(nfeResumo.totalEmitido), icon: Receipt, accent: "text-primary" },
          { label: "NFs Emitidas", value: nfeResumo.totalNFs.toString(), icon: FileText, accent: "text-success" },
          { label: "Pendentes", value: nfeResumo.totalPendentes.toString(), icon: AlertTriangle, accent: "text-yellow-400" },
          { label: "ISS + PIS + COFINS", value: fmtBRL(nfeResumo.issTotal + nfeResumo.pisTotal + nfeResumo.cofinsTotal), icon: Receipt, accent: "text-muted-foreground" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/50 bg-card/80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-data">{item.label}</p>
                    <p className={`text-xl font-bold font-data ${item.accent}`}>{item.value}</p>
                  </div>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por tomador ou número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Emitida">Emitida</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-data">Número</TableHead>
                <TableHead className="font-data">Tomador</TableHead>
                <TableHead className="font-data text-right">Valor</TableHead>
                <TableHead className="font-data text-right">Impostos</TableHead>
                <TableHead className="font-data text-right">Líquido</TableHead>
                <TableHead className="font-data">Data</TableHead>
                <TableHead className="font-data">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 20).map((nf) => {
                const cfg = statusConfig[nf.status];
                const Icon = cfg.icon;
                return (
                  <TableRow key={nf.id}>
                    <TableCell className="font-data text-xs">{nf.numero}</TableCell>
                    <TableCell className="font-data text-xs">{nf.tomador}</TableCell>
                    <TableCell className="font-data text-xs text-right">{fmtBRL(nf.valor)}</TableCell>
                    <TableCell className="font-data text-xs text-right text-muted-foreground">{fmtBRL(nf.iss + nf.pis + nf.cofins)}</TableCell>
                    <TableCell className="font-data text-xs text-right">{fmtBRL(nf.valorLiquido)}</TableCell>
                    <TableCell className="font-data text-xs text-muted-foreground">{new Date(nf.dataEmissao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{nf.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Emit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Emitir Nova NF-e</DialogTitle>
            <DialogDescription className="font-data text-sm">Preencha os dados para emissão da nota fiscal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-data text-xs">Tomador</Label>
                <Input value={formData.tomador} onChange={(e) => setFormData({ ...formData, tomador: e.target.value })} placeholder="Razão social" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-data text-xs">CNPJ</Label>
                <Input value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-data text-xs">Serviço</Label>
              <Input value={formData.servico} onChange={(e) => setFormData({ ...formData, servico: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-data text-xs">Valor (R$)</Label>
              <Input type="number" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0,00" />
            </div>
            {valorForm > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 font-data text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">ISS (2%)</span><span>{fmtBRL(issCalc)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">PIS (0,65%)</span><span>{fmtBRL(pisCalc)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">COFINS (3%)</span><span>{fmtBRL(cofinsCalc)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Valor Líquido</span><span className="text-primary">{fmtBRL(liquidoCalc)}</span></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleEmit} disabled={!formData.tomador || valorForm <= 0}>Emitir NF-e</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
