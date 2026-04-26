import React, { useState, useMemo } from "react";
import {
  Shield, Settings, Users, FileText, AlertTriangle, Search,
  ChevronRight, Download, Check, Clock, X as XIcon, Eye, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { mockAnimals, categoryLabel, calcAnimalCategory, age } from "@/data/rebanho-mock";
import {
  mockSisbovConfig, mockSisbovAnimals, mockEventos, mockAlimentacao, mockAlertasSisbov,
  getSisbovStats, getAnimalEventos, getAnimalAlimentacao, getAnimalSisbov,
  SISBOV_STATUS_LABEL, SISBOV_STATUS_COLOR, BRINCO_TIPO_LABEL,
  ANIMAL_SISBOV_STATUS_LABEL, ANIMAL_SISBOV_STATUS_COLOR,
  CERTIFICADORAS, EVENTO_LABEL, EVENTO_ICON,
  type SisbovConfig, type SisbovAnimal, type EventoRastreabilidade,
} from "@/data/sisbov-mock";

export default function SisbovPage() {
  const [tab, setTab] = useState("painel");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [showIdentForm, setShowIdentForm] = useState(false);
  const [showConfigEdit, setShowConfigEdit] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [identAnimalId, setIdentAnimalId] = useState("");
  const [identBrinco, setIdentBrinco] = useState("");
  const [identTipo, setIdentTipo] = useState("convencional");

  const stats = useMemo(() => getSisbovStats(), []);

  // Bovinos ativos
  const bovinos = useMemo(
    () => mockAnimals.filter((a) => a.species === "bovino" && a.current_status === "ativo"),
    [],
  );

  // Filtered animals for identification tab
  const filteredAnimals = useMemo(() => {
    let list = bovinos.map((a) => {
      const sisbov = getAnimalSisbov(a.id);
      return { ...a, sisbov };
    });
    if (filterStatus !== "todos") {
      list = list.filter((a) => {
        if (filterStatus === "identificado") return a.sisbov?.statusSisbov === "identificado";
        if (filterStatus === "pendente") return a.sisbov?.statusSisbov === "pendente";
        return !a.sisbov || a.sisbov.statusSisbov === "nao_identificado";
      });
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((a) =>
        a.ear_tag.toLowerCase().includes(s) ||
        a.name.toLowerCase().includes(s) ||
        (a.sisbov?.brincoSisbov || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [bovinos, filterStatus, search]);

  // Selected animal data
  const selectedAnimal = selectedAnimalId ? mockAnimals.find((a) => a.id === selectedAnimalId) : null;
  const selectedSisbov = selectedAnimalId ? getAnimalSisbov(selectedAnimalId) : undefined;
  const selectedEventos = selectedAnimalId ? getAnimalEventos(selectedAnimalId) : [];
  const selectedAlimentacao = selectedAnimalId ? getAnimalAlimentacao(selectedAnimalId) : [];

  // Relatório data
  const entradas = useMemo(() => mockEventos.filter((e) => e.tipo === "entrada"), []);
  const saidas = useMemo(() => mockEventos.filter((e) => e.tipo === "saida"), []);
  const nascimentos = useMemo(() => mockEventos.filter((e) => e.tipo === "nascimento"), []);
  const vacinacoes = useMemo(() => mockEventos.filter((e) => e.tipo === "vacina"), []);
  const tratamentos = useMemo(() => mockEventos.filter((e) => e.tipo === "tratamento"), []);

  const handleSaveIdent = () => {
    if (!identBrinco.trim()) {
      toast({ title: "Número do brinco obrigatório", variant: "destructive" });
      return;
    }
    toast({ title: "Identificação SISBOV registrada!", description: `Brinco ${identBrinco}` });
    setShowIdentForm(false);
    setIdentBrinco("");
    setIdentAnimalId("");
  };

  const handleExport = (format: string) => {
    toast({ title: `Exportação ${format} iniciada`, description: "O arquivo será gerado em instantes." });
    setShowExportDialog(false);
  };

  const config = mockSisbovConfig;
  const diasAuditoria = Math.round(
    (new Date(config.proximaAuditoria).getTime() - Date.now()) / 86400000,
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            SISBOV & Rastreabilidade
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Certificação {config.numeroCertificacao} • {SISBOV_STATUS_LABEL[config.status]}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="gap-1">
            <Download className="h-3.5 w-3.5" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowConfigEdit(true)} className="gap-1">
            <Settings className="h-3.5 w-3.5" /> Configuração
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="identificacao">Identificação</TabsTrigger>
          <TabsTrigger value="rastreabilidade">Rastreabilidade</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        {/* ══════════ PAINEL ══════════ */}
        <TabsContent value="painel" className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total bovinos</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Identificados</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.identificados}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pendentes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Não identificados</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.naoIdentificados}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Conformidade</p>
                <p className="text-3xl font-bold text-foreground">{stats.conformidade}%</p>
                <Progress value={stats.conformidade} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Certification info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Certificação SISBOV</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Número</span><span className="font-medium">{config.numeroCertificacao}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Certificadora</span><span className="font-medium">{config.certificadora}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CIE</span><span className="font-mono">{config.cie}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">NIRF</span><span className="font-mono">{config.nirf}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IE</span><span className="font-mono">{config.ie}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Início</span><span>{new Date(config.dataInicio).toLocaleDateString("pt-BR")}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={SISBOV_STATUS_COLOR[config.status]}>{SISBOV_STATUS_LABEL[config.status]}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Próxima Auditoria</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <p className="text-4xl font-bold text-foreground">{diasAuditoria}</p>
                <p className="text-sm text-muted-foreground">dias restantes</p>
                <p className="text-xs text-muted-foreground mt-2">
                  📅 {new Date(config.proximaAuditoria).toLocaleDateString("pt-BR")} — {config.certificadora}
                </p>
                {diasAuditoria <= 60 && (
                  <Badge className="mt-3 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    ⚠️ Prepare a documentação
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent alerts */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Alertas Recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockAlertasSisbov.slice(0, 4).map((al) => (
                <div key={al.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  al.severidade === "urgente" ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800" :
                  al.severidade === "atencao" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800" :
                  "bg-muted/50 border-border"
                }`}>
                  <span className="text-lg">{al.severidade === "urgente" ? "🔴" : al.severidade === "atencao" ? "🟠" : "🔵"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{al.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{al.descricao}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(al.data).toLocaleDateString("pt-BR")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ IDENTIFICAÇÃO ══════════ */}
        <TabsContent value="identificacao" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar brinco ou nome..." className="pl-8 w-60" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="identificado">✅ Identificados</SelectItem>
                  <SelectItem value="pendente">🟠 Pendentes</SelectItem>
                  <SelectItem value="nao_identificado">🔴 Não identificados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={() => setShowIdentForm(true)} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Registrar Identificação
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brinco Operacional</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Brinco SISBOV</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Ident.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnimals.slice(0, 30).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono font-semibold text-primary">{a.ear_tag}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="font-mono">{a.sisbov?.brincoSisbov || "—"}</TableCell>
                      <TableCell>{a.sisbov ? BRINCO_TIPO_LABEL[a.sisbov.tipoBrinco] : "—"}</TableCell>
                      <TableCell>{a.sisbov?.dataIdentificacao ? new Date(a.sisbov.dataIdentificacao).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>
                        <Badge className={a.sisbov ? ANIMAL_SISBOV_STATUS_COLOR[a.sisbov.statusSisbov] : ANIMAL_SISBOV_STATUS_COLOR.nao_identificado}>
                          {a.sisbov ? ANIMAL_SISBOV_STATUS_LABEL[a.sisbov.statusSisbov] : "Não identificado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedAnimalId(a.id)} title="Ver rastreabilidade">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {(!a.sisbov || a.sisbov.statusSisbov !== "identificado") && (
                            <Button variant="ghost" size="sm" onClick={() => { setIdentAnimalId(a.id); setShowIdentForm(true); }} title="Registrar brinco">
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ RASTREABILIDADE ══════════ */}
        <TabsContent value="rastreabilidade" className="space-y-4 mt-4">
          <div className="flex gap-3 items-center">
            <Label>Selecionar animal</Label>
            <Select value={selectedAnimalId || ""} onValueChange={setSelectedAnimalId}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Escolha um animal" /></SelectTrigger>
              <SelectContent>
                {bovinos.slice(0, 20).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.ear_tag} — {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAnimal && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => toast({ title: "Gerando Ficha SISBOV...", description: `PDF para ${selectedAnimal.ear_tag}` })}>
                <Download className="h-3.5 w-3.5" /> Gerar Ficha SISBOV
              </Button>
            )}
          </div>

          {selectedAnimal ? (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Animal info */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Ficha do Animal</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Brinco</span><span className="font-mono font-semibold text-primary">{selectedAnimal.ear_tag}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>{selectedAnimal.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Raça</span><span>{selectedAnimal.breed}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sexo</span><span>{selectedAnimal.sex === "M" ? "Macho" : "Fêmea"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Idade</span><span>{age(selectedAnimal.birth_date)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{categoryLabel[calcAnimalCategory(selectedAnimal)]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Peso atual</span><span>{selectedAnimal.current_weight} kg</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pasto</span><span>{selectedAnimal.paddock}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Brinco SISBOV</span><span className="font-mono">{selectedSisbov?.brincoSisbov || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tipo brinco</span><span>{selectedSisbov ? BRINCO_TIPO_LABEL[selectedSisbov.tipoBrinco] : "—"}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status SISBOV</span>
                    <Badge className={selectedSisbov ? ANIMAL_SISBOV_STATUS_COLOR[selectedSisbov.statusSisbov] : ANIMAL_SISBOV_STATUS_COLOR.nao_identificado}>
                      {selectedSisbov ? ANIMAL_SISBOV_STATUS_LABEL[selectedSisbov.statusSisbov] : "Não identificado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3"><CardTitle className="text-base">Linha do Tempo — Rastreabilidade</CardTitle></CardHeader>
                <CardContent>
                  {selectedEventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registrado para este animal</p>
                  ) : (
                    <div className="space-y-0 max-h-[500px] overflow-auto">
                      {selectedEventos.map((ev, i) => (
                        <div key={ev.id} className="flex gap-3 pb-4">
                          <div className="flex flex-col items-center">
                            <div className="text-lg">{EVENTO_ICON[ev.tipo]}</div>
                            {i < selectedEventos.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{EVENTO_LABEL[ev.tipo]}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(ev.data).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <p className="text-sm text-foreground mt-1">{ev.descricao}</p>
                            {ev.detalhes && <p className="text-xs text-muted-foreground mt-0.5">{ev.detalhes}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">👤 {ev.responsavel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alimentação */}
                  {selectedAlimentacao.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="text-sm font-semibold text-foreground mb-3">🌾 Histórico de Alimentação</h4>
                      <div className="space-y-2">
                        {selectedAlimentacao.map((al) => (
                          <div key={al.id} className="p-3 rounded-lg border bg-muted/30 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">{al.tipo}</Badge>
                              <span className="text-xs text-muted-foreground">{al.periodo}</span>
                            </div>
                            <p className="text-foreground">{al.insumos}</p>
                            {al.certificacaoOrigem && (
                              <p className="text-xs text-muted-foreground mt-0.5">📋 {al.certificacaoOrigem}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Selecione um animal para ver sua rastreabilidade completa</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════ RELATÓRIOS ══════════ */}
        <TabsContent value="relatorios" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)} className="gap-1">
              <Download className="h-3.5 w-3.5" /> Exportar para Certificadora
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Inventário */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">📊 Inventário SISBOV</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Rebanho bovino ativo</span><span className="font-bold">{stats.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Identificados</span><span className="font-medium text-emerald-600">{stats.identificados}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Entradas no período</span><span className="font-medium">{entradas.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saídas no período</span><span className="font-medium">{saidas.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nascimentos</span><span className="font-medium">{nascimentos.length}</span></div>
                <Separator />
                <div className="flex justify-between font-semibold"><span>Conformidade</span><span>{stats.conformidade}%</span></div>
              </CardContent>
            </Card>

            {/* Sanitário */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">💉 Relatório Sanitário</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Vacinações registradas</span><span className="font-medium">{vacinacoes.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tratamentos realizados</span><span className="font-medium">{tratamentos.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Animais em carência</span><span className="font-medium text-amber-600">4</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ocorrências de doenças</span><span className="font-medium">0</span></div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Último período de vacinação: Febre Aftosa — Mai/2025
                </p>
              </CardContent>
            </Card>

            {/* Movimentações */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">🔄 Movimentações</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Entradas com GTA</span><span className="font-medium text-emerald-600">{entradas.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saídas com GTA</span><span className="font-medium">{saidas.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Movimentações internas</span><span className="font-medium">{mockEventos.filter((e) => e.tipo === "movimentacao").length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sem GTA vinculado</span><span className="font-medium text-red-600">1</span></div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Conformidade de GTA: 92%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vacinações table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Registro de Vacinações</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Animal</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacinacoes.map((v) => {
                    const animal = mockAnimals.find((a) => a.id === v.animalId);
                    return (
                      <TableRow key={v.id}>
                        <TableCell>{new Date(v.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-mono text-primary">{animal?.ear_tag || v.animalId}</TableCell>
                        <TableCell>{v.descricao}</TableCell>
                        <TableCell>{v.responsavel}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{v.detalhes || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ALERTAS ══════════ */}
        <TabsContent value="alertas" className="space-y-4 mt-4">
          <div className="space-y-3">
            {mockAlertasSisbov.map((al) => (
              <Card key={al.id} className={
                al.severidade === "urgente" ? "border-red-300 dark:border-red-800" :
                al.severidade === "atencao" ? "border-amber-300 dark:border-amber-800" : ""
              }>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="text-2xl shrink-0">
                    {al.severidade === "urgente" ? "🔴" : al.severidade === "atencao" ? "🟠" : "🔵"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground">{al.titulo}</p>
                      <Badge variant="outline" className="text-xs capitalize">{al.tipo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{al.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(al.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge className={
                    al.severidade === "urgente" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
                    al.severidade === "atencao" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  }>
                    {al.severidade === "urgente" ? "Urgente" : al.severidade === "atencao" ? "Atenção" : "Informativo"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── IDENTIFICATION FORM ── */}
      <Dialog open={showIdentForm} onOpenChange={setShowIdentForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Identificação SISBOV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Animal *</Label>
              <Select value={identAnimalId} onValueChange={setIdentAnimalId}>
                <SelectTrigger><SelectValue placeholder="Selecionar animal" /></SelectTrigger>
                <SelectContent>
                  {bovinos.filter((a) => {
                    const s = getAnimalSisbov(a.id);
                    return !s || s.statusSisbov !== "identificado";
                  }).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.ear_tag} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Número do Brinco SISBOV *</Label>
              <Input value={identBrinco} onChange={(e) => setIdentBrinco(e.target.value)} placeholder="BR000000000" className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Brinco</Label>
              <Select value={identTipo} onValueChange={setIdentTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BRINCO_TIPO_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIdentForm(false)}>Cancelar</Button>
            <Button onClick={handleSaveIdent} className="gap-1"><Check className="h-4 w-4" /> Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CONFIG DIALOG ── */}
      <Dialog open={showConfigEdit} onOpenChange={setShowConfigEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Configuração SISBOV</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nº Certificação</Label>
                <Input defaultValue={config.numeroCertificacao} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label>Certificadora</Label>
                <Select defaultValue={config.certificadora}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CERTIFICADORAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data início</Label>
                <Input type="date" defaultValue={config.dataInicio} />
              </div>
              <div className="space-y-1">
                <Label>Próxima auditoria</Label>
                <Input type="date" defaultValue={config.proximaAuditoria} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>CIE</Label>
                <Input defaultValue={config.cie} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label>NIRF</Label>
                <Input defaultValue={config.nirf} className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label>IE</Label>
                <Input defaultValue={config.ie} className="font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status da Certificação</Label>
              <Select defaultValue={config.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SISBOV_STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigEdit(false)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Configuração salva!" }); setShowConfigEdit(false); }} className="gap-1">
              <Check className="h-4 w-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EXPORT DIALOG ── */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Exportar Dados para Auditoria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o formato de exportação. Os dados incluem inventário completo, movimentações,
              vacinações, tratamentos e alimentação de todos os animais rastreados.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { format: "Excel", icon: "📊", desc: "Planilha com abas" },
                { format: "CSV", icon: "📄", desc: "Dados tabulares" },
                { format: "PDF", icon: "📕", desc: "Relatório formatado" },
              ].map(({ format, icon, desc }) => (
                <Card
                  key={format}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleExport(format)}
                >
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className="font-semibold text-sm text-foreground">{format}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data início</Label>
                <Input type="date" defaultValue="2025-01-01" />
              </div>
              <div className="space-y-1">
                <Label>Data fim</Label>
                <Input type="date" defaultValue="2026-03-08" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
