import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileKey, Plus, DollarSign, CalendarDays, Wrench, AlertTriangle,
  Eye, Edit, Info,
} from "lucide-react";
import {
  mockLeasings, LeasingContract, LeasingTipo,
  leasingTipoLabels, leasingContabil,
} from "@/data/patrimonio-mock";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

const statusLabels: Record<string, string> = {
  ativo: "Ativo", encerrado: "Encerrado", pendente_devolucao: "Pendente Devolução",
};
const statusColors: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  encerrado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  pendente_devolucao: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

// ── Summary ──
function LeasingSummary({ items }: { items: LeasingContract[] }) {
  const ativos = items.filter(l => l.status === "ativo");
  const totalBens = ativos.reduce((s, l) => s + l.valorBem, 0);
  const comprMensal = ativos.reduce((s, l) => s + l.contraprestacaoMensal, 0);
  const totalPago = items.reduce((s, l) => s + l.contraprestacaoMensal * l.parcelasPagas, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { title: "Bens em Leasing", value: fmt(totalBens), icon: FileKey, desc: `${ativos.length} contratos ativos` },
        { title: "Comprometimento Mensal", value: fmt(comprMensal), icon: CalendarDays, desc: "Contraprestações" },
        { title: "Total Pago", value: fmt(totalPago), icon: DollarSign, desc: "Todas as parcelas" },
        { title: "Manutenções", value: String(items.reduce((s, l) => s + (l.manutencoes?.length || 0), 0)), icon: Wrench, desc: "Registradas" },
      ].map(c => (
        <Card key={c.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              </div>
              <c.icon className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Accounting info ──
function ContabilCard({ tipo }: { tipo: LeasingTipo }) {
  const info = leasingContabil[tipo];
  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">{info.titulo}</p>
            <p className="text-xs text-muted-foreground mt-1">{info.descricao}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Form ──
function NovoLeasingForm({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState<LeasingTipo>("financeiro");
  const [opcaoCompra, setOpcaoCompra] = useState(true);

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-4 pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Arrendador</Label>
            <Input placeholder="Ex: BV Leasing" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bem arrendado</Label>
            <Input placeholder="Ex: Colheitadeira New Holland CR 7.90" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de leasing</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as LeasingTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(leasingTipoLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor do bem</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Valor residual (VRG)</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Contraprestação mensal</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo (meses)</Label>
            <Input type="number" defaultValue={60} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de início</Label>
            <Input type="date" />
          </div>
          <div className="space-y-1.5">
            <Label>Data de término</Label>
            <Input type="date" />
          </div>
        </div>

        <ContabilCard tipo={tipo} />

        <div className="flex items-center gap-2">
          <Switch checked={opcaoCompra} onCheckedChange={setOpcaoCompra} />
          <Label>Opção de compra ao final</Label>
        </div>
        {opcaoCompra && (
          <div className="space-y-1.5">
            <Label>Valor de compra ao final</Label>
            <Input type="number" placeholder="0,00" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={2} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onClose} className="gap-1"><FileKey className="h-4 w-4" /> Salvar Leasing</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Main ──
export default function LeasingPage() {
  const [items] = useState(mockLeasings);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileKey className="h-6 w-6 text-primary" /> Leasing
          </h1>
          <p className="text-sm text-muted-foreground">Contratos de arrendamento mercantil com tratamento contábil</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Leasing</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Cadastrar Contrato de Leasing</DialogTitle></DialogHeader>
            <NovoLeasingForm onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <LeasingSummary items={items} />

      {/* Contracts table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Contratos de Leasing</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bem</TableHead>
                  <TableHead>Arrendador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor Bem</TableHead>
                  <TableHead className="text-right">Parcela</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Compra Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(l => {
                  const pct = l.prazoMeses > 0 ? Math.round(l.parcelasPagas / l.prazoMeses * 100) : 0;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{l.bemDescricao}</TableCell>
                      <TableCell className="text-sm">{l.arrendador}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{leasingTipoLabels[l.tipoLeasing]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{fmt(l.valorBem)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(l.contraprestacaoMensal)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 w-16" />
                          <span className="text-xs">{l.parcelasPagas}/{l.prazoMeses}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(l.dataTermino)}</TableCell>
                      <TableCell>
                        {l.opcaoCompra ? (
                          <span className="text-xs font-medium">{fmt(l.valorCompraFinal || l.valorResidual)}</span>
                        ) : <span className="text-xs text-muted-foreground">Não</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[l.status] + " border-0 text-xs"}>
                          {statusLabels[l.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Accounting cards per type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(["financeiro", "operacional"] as LeasingTipo[]).map(t => (
          <ContabilCard key={t} tipo={t} />
        ))}
      </div>

      {/* Maintenance */}
      {items.filter(l => l.manutencoes && l.manutencoes.length > 0).map(l => (
        <Card key={l.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Manutenções — {l.bemDescricao}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {l.manutencoes!.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{fmtDate(m.data)}</TableCell>
                    <TableCell className="text-sm">{m.descricao}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(m.custo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
