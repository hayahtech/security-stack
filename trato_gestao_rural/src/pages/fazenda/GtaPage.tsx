import { useState, useMemo } from "react";
import {
  FileText, Plus, Truck, AlertTriangle, CheckCircle2, Search,
  Upload, Download, Filter, Trash2, ExternalLink, Edit2, X,
  ClipboardList, BarChart3, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  mockGtas, calcGtaStatus,
  FINALIDADE_LABELS, ESPECIE_LABELS, ESPECIE_VALIDADE, STATUS_CONFIG, ORGAOS_POR_ESTADO,
  type Gta, type GtaFinalidade, type GtaEspecie, type GtaStatus, type AreaSanitaria,
} from "@/data/gta-mock";
import { useDevices } from "@/contexts/DeviceContext";
import ModoEmbarcadouro from "@/components/ModoEmbarcadouro";

const UF_LIST = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const EMPTY_GTA: Partial<Gta> = {
  numero: "", serie: "A", dataEmissao: new Date().toISOString().slice(0, 10),
  dataValidade: "", orgaoEmissor: "", ufEmissao: "MG",
  origemPropriedade: "Fazenda Boa Vista", origemMunicipio: "Uberaba", origemUf: "MG",
  origemProprietario: "João Silva", origemIeNirf: "001.234.567.0001",
  destinoPropriedade: "", destinoMunicipio: "", destinoUf: "MG",
  destinoProprietario: "", destinoIeNirf: "",
  finalidade: "venda", especie: "bovino", quantidade: 0,
  animaisVinculados: [], sexoFaixa: "", identificacao: "convencional",
  placaVeiculo: "", transportadora: "", motorista: "", mdfeVinculado: "",
  areaSanitaria: "livre", examesRealizados: [], resultadoExames: "",
  vacinasEmDia: true, arquivoGta: null, arquivoExames: null,
  status: "ativo", vinculoVenda: null, observacoes: "",
};

function calcValidade(emissao: string, especie: GtaEspecie): string {
  const d = new Date(emissao);
  d.setDate(d.getDate() + (ESPECIE_VALIDADE[especie] || 30));
  return d.toISOString().slice(0, 10);
}

/* ══════════════════════════════════════════════════════ */
export default function GtaPage() {
  const [gtas, setGtas] = useState<Gta[]>(() => mockGtas.map((g) => ({ ...g, status: calcGtaStatus(g) })));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Gta>>({ ...EMPTY_GTA });
  const [showEmbarcadouro, setShowEmbarcadouro] = useState(false);
  const { readers } = useDevices();
  const hasReaders = readers.length > 0;

  /* filters */
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFinalidade, setFilterFinalidade] = useState("all");
  const [filterEspecie, setFilterEspecie] = useState("all");
  const [search, setSearch] = useState("");

  /* ── derived ─── */
  const ativos = gtas.filter((g) => g.status === "ativo").length;
  const vencendo = gtas.filter((g) => g.status === "vencendo").length;
  const vencidos = gtas.filter((g) => g.status === "vencido").length;
  const doMes = gtas.filter((g) => {
    const m = new Date().toISOString().slice(0, 7);
    return g.dataEmissao.startsWith(m);
  }).length;

  const filtered = useMemo(() => {
    return gtas.filter((g) => {
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      if (filterFinalidade !== "all" && g.finalidade !== filterFinalidade) return false;
      if (filterEspecie !== "all" && g.especie !== filterEspecie) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!g.numero.toLowerCase().includes(s) && !g.origemPropriedade.toLowerCase().includes(s) && !g.destinoPropriedade.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [gtas, filterStatus, filterFinalidade, filterEspecie, search]);

  /* report data */
  const entradas = gtas.filter((g) => g.destinoPropriedade.includes("Fazenda Boa Vista") || g.destinoPropriedade.includes("Fazenda São José"));
  const saidas = gtas.filter((g) => g.origemPropriedade.includes("Fazenda Boa Vista") || g.origemPropriedade.includes("Fazenda São José"));
  const totalEntradas = entradas.reduce((s, g) => s + g.quantidade, 0);
  const totalSaidas = saidas.reduce((s, g) => s + g.quantidade, 0);

  /* alerts */
  const alerts = useMemo(() => {
    const a: { icon: string; msg: string; severity: string }[] = [];
    gtas.filter((g) => g.status === "vencendo").forEach((g) => {
      const dias = Math.round((new Date(g.dataValidade).getTime() - Date.now()) / 86400000);
      a.push({ icon: "🟠", msg: `GTA nº ${g.numero} vence em ${dias} dia(s) — ${g.quantidade} animais`, severity: "atencao" });
    });
    gtas.filter((g) => g.status === "vencido").forEach((g) => {
      a.push({ icon: "🔴", msg: `GTA nº ${g.numero} VENCIDO — ${g.quantidade} animais sem movimentação`, severity: "urgente" });
    });
    return a;
  }, [gtas]);

  /* ── form handlers ─── */
  function upd(field: string, value: any) {
    const updated = { ...form, [field]: value };
    if (field === "dataEmissao" || field === "especie") {
      updated.dataValidade = calcValidade(updated.dataEmissao || new Date().toISOString().slice(0, 10), (updated.especie as GtaEspecie) || "bovino");
    }
    if (field === "ufEmissao") {
      updated.orgaoEmissor = ORGAOS_POR_ESTADO[value as string] || "";
    }
    setForm(updated);
  }

  function openNew() {
    const f = { ...EMPTY_GTA };
    f.dataValidade = calcValidade(f.dataEmissao!, "bovino");
    f.orgaoEmissor = ORGAOS_POR_ESTADO["MG"];
    setForm(f);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.numero?.trim()) { toast.error("Informe o número do GTA"); return; }
    if (!form.quantidade || form.quantidade <= 0) { toast.error("Informe a quantidade de animais"); return; }
    const newGta: Gta = { ...form, id: `gta${Date.now()}` } as Gta;
    newGta.status = calcGtaStatus(newGta);
    setGtas([newGta, ...gtas]);
    setShowForm(false);

    let extra = "";
    if (form.finalidade === "venda") extra = " — Vincule à venda correspondente para atualizar status dos animais.";
    if (form.finalidade === "transferencia") extra = " — Atualize o pasto/fazenda dos animais manualmente.";

    toast.success(`GTA nº ${form.numero} cadastrado${extra}`);
  }

  function handleExportPDF() {
    toast.info("Relatório de movimentações — exportação PDF será implementada com backend");
  }

  function toggleExame(exame: string) {
    const exames = form.examesRealizados || [];
    if (exames.includes(exame)) {
      setForm({ ...form, examesRealizados: exames.filter((e) => e !== exame) });
    } else {
      setForm({ ...form, examesRealizados: [...exames, exame] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> GTA — Guia de Trânsito Animal
          </h1>
          <p className="text-sm text-muted-foreground">Controle de guias de trânsito e movimentações sanitárias</p>
        </div>
        <div className="flex items-center gap-2">
          {hasReaders && (
            <Button variant="outline" className="gap-1" onClick={() => setShowEmbarcadouro(true)}>
              <Truck className="h-4 w-4" /> Modo Embarcadouro
            </Button>
          )}
          <Button onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> Novo GTA</Button>
        </div>
      </div>

      <Tabs defaultValue="painel">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="painel" className="gap-1"><ClipboardList className="h-3.5 w-3.5" />Painel</TabsTrigger>
          <TabsTrigger value="cadastro" className="gap-1"><Plus className="h-3.5 w-3.5" />Cadastrar</TabsTrigger>
          <TabsTrigger value="relatorio" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Relatório</TabsTrigger>
        </TabsList>

        {/* ═══ PAINEL ═══ */}
        <TabsContent value="painel" className="mt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">{ativos}</p>
                <p className="text-xs text-muted-foreground">GTAs ativos</p>
              </CardContent>
            </Card>
            <Card className={vencendo > 0 ? "border-amber-500/30" : ""}>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{vencendo}</p>
                <p className="text-xs text-muted-foreground">Vencendo em 7 dias</p>
              </CardContent>
            </Card>
            <Card className={vencidos > 0 ? "border-destructive/30" : ""}>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-destructive">{vencidos}</p>
                <p className="text-xs text-muted-foreground">Vencidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-foreground">{doMes}</p>
                <p className="text-xs text-muted-foreground">GTAs do mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-4 space-y-1">
                <p className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Alertas de GTA</p>
                {alerts.map((a, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{a.icon} {a.msg}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Finalidade</Label>
                  <Select value={filterFinalidade} onValueChange={setFilterFinalidade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(FINALIDADE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Espécie</Label>
                  <Select value={filterEspecie} onValueChange={setFilterEspecie}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(ESPECIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nº GTA, origem, destino..." className="pl-9" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Finalidade</TableHead>
                      <TableHead>Origem → Destino</TableHead>
                      <TableHead>Espécie</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vínculo</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum GTA encontrado</TableCell></TableRow>
                    ) : filtered.map((g) => {
                      const st = STATUS_CONFIG[g.status];
                      return (
                        <TableRow key={g.id}>
                          <TableCell className="font-mono font-medium text-sm">{g.numero}</TableCell>
                          <TableCell className="text-xs">{new Date(g.dataEmissao).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-xs">{new Date(g.dataValidade).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{FINALIDADE_LABELS[g.finalidade]}</Badge></TableCell>
                          <TableCell className="text-xs">
                            <span className="font-medium">{g.origemPropriedade}</span>
                            <span className="text-muted-foreground"> → </span>
                            <span className="font-medium">{g.destinoPropriedade}</span>
                          </TableCell>
                          <TableCell className="text-xs">{ESPECIE_LABELS[g.especie]}</TableCell>
                          <TableCell className="text-sm font-medium">{g.quantidade}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${st.color}`}>{st.icon} {st.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{g.vinculoVenda || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setGtas(gtas.filter((x) => x.id !== g.id))}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">{filtered.length} GTA(s) encontrado(s)</p>
        </TabsContent>

        {/* ═══ CADASTRO ═══ */}
        <TabsContent value="cadastro" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Identificação do GTA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Número do GTA *</Label>
                  <Input value={form.numero} onChange={(e) => upd("numero", e.target.value)} placeholder="000.000.000" className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Série</Label>
                  <Input value={form.serie} onChange={(e) => upd("serie", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de emissão</Label>
                  <Input type="date" value={form.dataEmissao} onChange={(e) => upd("dataEmissao", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de validade</Label>
                  <Input type="date" value={form.dataValidade} onChange={(e) => upd("dataValidade", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>UF de emissão</Label>
                  <Select value={form.ufEmissao} onValueChange={(v) => upd("ufEmissao", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Órgão emissor</Label>
                  <Input value={form.orgaoEmissor} onChange={(e) => upd("orgaoEmissor", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Origem/Destino */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm text-emerald-700 dark:text-emerald-300">📍 Origem</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Propriedade</Label>
                  <Input value={form.origemPropriedade} onChange={(e) => upd("origemPropriedade", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Município</Label>
                    <Input value={form.origemMunicipio} onChange={(e) => upd("origemMunicipio", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>UF</Label>
                    <Select value={form.origemUf} onValueChange={(v) => upd("origemUf", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Proprietário</Label>
                    <Input value={form.origemProprietario} onChange={(e) => upd("origemProprietario", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>IE / NIRF</Label>
                    <Input value={form.origemIeNirf} onChange={(e) => upd("origemIeNirf", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm text-blue-700 dark:text-blue-300">📍 Destino</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Propriedade</Label>
                  <Input value={form.destinoPropriedade} onChange={(e) => upd("destinoPropriedade", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Município</Label>
                    <Input value={form.destinoMunicipio} onChange={(e) => upd("destinoMunicipio", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>UF</Label>
                    <Select value={form.destinoUf} onValueChange={(v) => upd("destinoUf", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Proprietário</Label>
                    <Input value={form.destinoProprietario} onChange={(e) => upd("destinoProprietario", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>IE / NIRF</Label>
                    <Input value={form.destinoIeNirf} onChange={(e) => upd("destinoIeNirf", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Animais */}
          <Card>
            <CardHeader><CardTitle className="text-base">🐄 Animais Transportados</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Finalidade *</Label>
                  <Select value={form.finalidade} onValueChange={(v) => upd("finalidade", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FINALIDADE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Espécie</Label>
                  <Select value={form.especie} onValueChange={(v) => upd("especie", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESPECIE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Quantidade *</Label>
                  <Input type="number" min={1} value={form.quantidade} onChange={(e) => upd("quantidade", Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Identificação</Label>
                  <Select value={form.identificacao} onValueChange={(v) => upd("identificacao", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eletronico">Brinco eletrônico</SelectItem>
                      <SelectItem value="convencional">Brinco convencional</SelectItem>
                      <SelectItem value="tatuagem">Tatuagem</SelectItem>
                      <SelectItem value="sem">Sem identificação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sexo e faixa etária</Label>
                <Input value={form.sexoFaixa} onChange={(e) => upd("sexoFaixa", e.target.value)} placeholder="Ex: Machos 24-36 meses" />
              </div>
            </CardContent>
          </Card>

          {/* Transporte */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Transporte</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Placa do veículo</Label>
                  <Input value={form.placaVeiculo} onChange={(e) => upd("placaVeiculo", e.target.value)} placeholder="ABC-1234" />
                </div>
                <div className="space-y-1.5">
                  <Label>Transportadora</Label>
                  <Input value={form.transportadora} onChange={(e) => upd("transportadora", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Motorista</Label>
                  <Input value={form.motorista} onChange={(e) => upd("motorista", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>MDF-e vinculado</Label>
                  <Input value={form.mdfeVinculado} onChange={(e) => upd("mdfeVinculado", e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sanitário */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Situação Sanitária</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Área sanitária da origem</Label>
                  <Select value={form.areaSanitaria} onValueChange={(v) => upd("areaSanitaria", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="livre">Livre</SelectItem>
                      <SelectItem value="controlada">Controlada</SelectItem>
                      <SelectItem value="foco">Foco</SelectItem>
                      <SelectItem value="vazio">Vazio sanitário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Label>Vacinas em dia?</Label>
                  <Switch checked={form.vacinasEmDia} onCheckedChange={(v) => upd("vacinasEmDia", v)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Exames realizados</Label>
                <div className="flex flex-wrap gap-2">
                  {["Brucelose", "Tuberculose", "Febre Aftosa", "AIE", "Mormo", "Outros"].map((ex) => (
                    <label key={ex} className="flex items-center gap-1.5 cursor-pointer">
                      <Switch checked={(form.examesRealizados || []).includes(ex)} onCheckedChange={() => toggleExame(ex)} />
                      <span className="text-sm">{ex}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Resultado dos exames</Label>
                <Textarea value={form.resultadoExames} onChange={(e) => upd("resultadoExames", e.target.value)} rows={2} placeholder="Ex: Todos negativos" />
              </div>
            </CardContent>
          </Card>

          {/* Observações & Save */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={(e) => upd("observacoes", e.target.value)} rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setForm({ ...EMPTY_GTA })}>Limpar</Button>
                <Button onClick={handleSave} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Cadastrar GTA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ RELATÓRIO ═══ */}
        <TabsContent value="relatorio" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExportPDF} className="gap-1"><Download className="h-4 w-4" /> Exportar PDF</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{totalEntradas}</p>
                <p className="text-xs text-muted-foreground">Entradas (cabeças)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-destructive">{totalSaidas}</p>
                <p className="text-xs text-muted-foreground">Saídas (cabeças)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalEntradas - totalSaidas > 0 ? "+" : ""}{totalEntradas - totalSaidas}</p>
                <p className="text-xs text-muted-foreground">Saldo</p>
              </CardContent>
            </Card>
          </div>

          {/* Entradas */}
          <Card>
            <CardHeader><CardTitle className="text-base text-emerald-700 dark:text-emerald-300">Entradas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>GTA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhuma entrada</TableCell></TableRow>
                  ) : entradas.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-xs">{new Date(g.dataEmissao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{g.origemPropriedade} ({g.origemUf})</TableCell>
                      <TableCell className="text-xs">{ESPECIE_LABELS[g.especie]}</TableCell>
                      <TableCell className="font-medium">{g.quantidade}</TableCell>
                      <TableCell className="text-xs font-mono">{g.numero}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Saídas */}
          <Card>
            <CardHeader><CardTitle className="text-base text-destructive">Saídas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Finalidade</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>GTA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saidas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhuma saída</TableCell></TableRow>
                  ) : saidas.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-xs">{new Date(g.dataEmissao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{g.destinoPropriedade} ({g.destinoUf})</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{FINALIDADE_LABELS[g.finalidade]}</Badge></TableCell>
                      <TableCell className="text-xs">{ESPECIE_LABELS[g.especie]}</TableCell>
                      <TableCell className="font-medium">{g.quantidade}</TableCell>
                      <TableCell className="text-xs font-mono">{g.numero}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {showEmbarcadouro && (
        <ModoEmbarcadouro
          gtas={gtas}
          onClose={() => setShowEmbarcadouro(false)}
          onFinalize={(gtaId, scanned) => {
            setGtas((prev) => prev.map((g) => g.id === gtaId ? { ...g, status: "utilizado" as const } : g));
            toast.success(`Embarque finalizado — ${scanned.filter((s) => s.inGta).length} animais confirmados`);
          }}
        />
      )}
    </div>
  );
}
