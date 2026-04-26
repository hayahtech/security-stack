import { useState, useMemo } from "react";
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
  Layers, Plus, Calculator, DollarSign, CalendarDays, Trophy,
  ChevronRight, Eye, Edit, Filter, X,
} from "lucide-react";
import {
  mockConsorcios, Consorcio, ConsorcioStatus,
  consorcioStatusLabels, consorcioStatusColors,
} from "@/data/patrimonio-mock";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };

const bemLabels: Record<string, string> = {
  imovel: "Imóvel", veiculo: "Veículo", maquina: "Máquina", servico: "Serviço",
};

// ── Summary ──
function ConsorcioSummary({ items }: { items: Consorcio[] }) {
  const totalCredito = items.reduce((s, c) => s + c.valorCredito, 0);
  const totalPago = items.reduce((s, c) => s + c.parcelaAtual * c.parcelasPagas, 0);
  const aguardando = items.filter(c => c.status === "aguardando").length;
  const contemplados = items.filter(c => c.status === "contemplado" || c.status === "bem_adquirido").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { title: "Total em Créditos", value: fmt(totalCredito), icon: DollarSign, desc: "Cartas de crédito" },
        { title: "Total Pago", value: fmt(totalPago), icon: CalendarDays, desc: "Parcelas quitadas" },
        { title: "Aguardando", value: String(aguardando), icon: Layers, desc: "Contemplação" },
        { title: "Contemplados", value: String(contemplados), icon: Trophy, desc: "Sorteio ou lance" },
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

// ── Lance Simulator ──
function SimuladorLance({ consorcio }: { consorcio?: Consorcio }) {
  const [valorLance, setValorLance] = useState(0);
  const [fgts, setFgts] = useState(0);
  const credito = consorcio?.valorCredito || 100000;
  const pctLance = credito > 0 ? (valorLance / credito * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" /> Simulação de Lance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Valor do crédito</Label>
            <Input value={fmt(credito)} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Saldo FGTS (informativo)</Label>
            <Input type="number" value={fgts || ""} onChange={e => setFgts(+e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Valor do lance pretendido</Label>
            <Input type="number" value={valorLance || ""} onChange={e => setValorLance(+e.target.value)} />
          </div>
        </div>
        {valorLance > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
            <p className="text-sm">Com este lance você oferece <strong>{pctLance.toFixed(1)}%</strong> do crédito.</p>
            <Progress value={Math.min(pctLance, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">Lances médios dos últimos meses: informe manualmente para comparação</p>
            <Input placeholder="Ex: 25%, 30%, 28%" className="text-xs" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Form ──
function NovoConsorcioForm({ onClose }: { onClose: () => void }) {
  const [contemplado, setContemplado] = useState(false);

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-4 pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Administradora</Label>
            <Input placeholder="Ex: Porto Seguro Consórcios" />
          </div>
          <div className="space-y-1.5">
            <Label>Grupo</Label>
            <Input placeholder="G-XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Cota</Label>
            <Input placeholder="C-XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Bem pretendido</Label>
            <Select defaultValue="veiculo">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(bemLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor do crédito</Label>
            <Input type="number" placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo (meses)</Label>
            <Input type="number" defaultValue={72} />
          </div>
          <div className="space-y-1.5">
            <Label>Taxa de administração (%)</Label>
            <div className="flex gap-2">
              <Input type="number" step="0.1" className="flex-1" />
              <Select defaultValue="total">
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">% total</SelectItem>
                  <SelectItem value="mensal">% a.m.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Fundo de reserva (%)</Label>
            <Input type="number" step="0.1" />
          </div>
          <div className="space-y-1.5">
            <Label>Parcela atual</Label>
            <Input type="number" placeholder="0,00" />
          </div>
        </div>

        <Separator />
        <div className="flex items-center gap-2">
          <Switch checked={contemplado} onCheckedChange={setContemplado} />
          <Label>Foi contemplado?</Label>
        </div>
        {contemplado && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Forma</Label>
              <Select defaultValue="sorteio">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sorteio">Sorteio</SelectItem>
                  <SelectItem value="lance_livre">Lance livre</SelectItem>
                  <SelectItem value="lance_fixo">Lance fixo</SelectItem>
                  <SelectItem value="lance_embutido">Lance embutido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Data da contemplação</Label><Input type="date" /></div>
            <div className="space-y-1.5"><Label>Valor do lance</Label><Input type="number" /></div>
            <div className="space-y-1.5"><Label>Data de aquisição do bem</Label><Input type="date" /></div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={2} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onClose} className="gap-1"><Layers className="h-4 w-4" /> Salvar Consórcio</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Main ──
export default function Consorcios() {
  const [items] = useState(mockConsorcios);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [selectedSim, setSelectedSim] = useState<Consorcio | undefined>(items.find(c => c.status === "aguardando"));

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return items;
    return items.filter(c => c.status === filterStatus);
  }, [items, filterStatus]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Consórcios
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de consórcios com simulação de lance e controle de contemplação</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Consórcio</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Cadastrar Consórcio</DialogTitle></DialogHeader>
            <NovoConsorcioForm onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ConsorcioSummary items={items} />
      <SimuladorLance consorcio={selectedSim} />

      {/* Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {Object.entries(consorcioStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {filterStatus !== "todos" && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setFilterStatus("todos")}><X className="h-3 w-3" /> Limpar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administradora</TableHead>
                  <TableHead>Grupo/Cota</TableHead>
                  <TableHead>Bem</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead className="text-right">Parcela</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Taxa Adm.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const pct = c.prazoMeses > 0 ? Math.round(c.parcelasPagas / c.prazoMeses * 100) : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.administradora}</TableCell>
                      <TableCell className="text-xs">{c.grupo} / {c.cota}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{bemLabels[c.bemPretendido]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(c.valorCredito)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(c.parcelaAtual)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 w-16" />
                          <span className="text-xs">{c.parcelasPagas}/{c.prazoMeses}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{c.taxaAdministracao}% {c.taxaTipo === "total" ? "total" : "a.m."}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={consorcioStatusColors[c.status] + " border-0 text-xs"}>
                          {consorcioStatusLabels[c.status]}
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

      {/* Contemplation details */}
      {items.filter(c => c.contemplado && c.contemplacao).map(c => (
        <Card key={c.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Contemplação — {c.administradora} ({c.grupo}/{c.cota})
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Forma</span><span className="capitalize">{c.contemplacao!.forma.replace("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span>{fmtDate(c.contemplacao!.data)}</span></div>
            {c.contemplacao!.valorLance && (
              <div className="flex justify-between"><span className="text-muted-foreground">Valor do lance</span><span className="font-medium">{fmt(c.contemplacao!.valorLance)} ({(c.contemplacao!.valorLance / c.valorCredito * 100).toFixed(1)}%)</span></div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
