import { useState, useMemo } from "react";
import {
  ArrowLeft, Settings2, FileDown, FileSpreadsheet, Copy, Plus,
  FileText, ExternalLink, Search, Loader2, Eye, XCircle, Send,
  DollarSign, Hash, AlertTriangle, Upload, CheckCircle2, Trash2,
  Building2, Package, Truck, CreditCard, ClipboardList, ScrollText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { maskDocument, maskCnpj, maskCpf } from "@/lib/validators";

import {
  defaultNfeConfig, NfeConfig, NfeDocument, NfeItem, ProducerNote,
  mockNfes, mockProducerNotes, commonNcms, natureOptions,
  purposeLabels, statusLabels, statusColors, taxRegimeLabels,
  apiProviderLabels,
} from "@/data/nfe-saida-mock";

/* ── Helpers ──────────────────────────────── */
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };
const SEFAZ_URL = "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx";

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function NfeSaidaPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<NfeConfig>({ ...defaultNfeConfig });
  const [configOpen, setConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<NfeConfig>({ ...defaultNfeConfig });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<NfeDocument | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [detailNfe, setDetailNfe] = useState<NfeDocument | null>(null);

  // New NF-e form
  const [newNfeOpen, setNewNfeOpen] = useState(false);
  const [formNature, setFormNature] = useState("Venda");
  const [formPurpose, setFormPurpose] = useState("normal");
  const [formRecipientName, setFormRecipientName] = useState("");
  const [formRecipientCnpj, setFormRecipientCnpj] = useState("");
  const [formRecipientState, setFormRecipientState] = useState("SP");
  const [formIeIndicator, setFormIeIndicator] = useState("contribuinte");
  const [formFinalConsumer, setFormFinalConsumer] = useState(false);
  const [formItems, setFormItems] = useState<NfeItem[]>([
    { id: "new-1", code: "", description: "", ncm: "0102.29.90", cfop: "6.101", unit: "CAB", quantity: 1, unitPrice: 0, totalPrice: 0, icmsCst: "00", icmsRate: 12, pisCst: "01", cofinsCst: "01", ipiRate: 0 },
  ]);
  const [formFreightMode, setFormFreightMode] = useState("fob");
  const [formPaymentMode, setFormPaymentMode] = useState("avista");
  const [formAdditionalInfo, setFormAdditionalInfo] = useState("");
  const [formFiscalInfo, setFormFiscalInfo] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const filteredNfes = useMemo(() => {
    let data = [...mockNfes];
    if (filterStatus !== "all") data = data.filter(n => n.status === filterStatus);
    if (filterPeriod === "month") {
      data = data.filter(n => n.emissionDate.startsWith("2026-03"));
    } else if (filterPeriod === "year") {
      data = data.filter(n => n.emissionDate.startsWith("2026"));
    }
    return data;
  }, [filterStatus, filterPeriod]);

  const totalFaturado = filteredNfes.filter(n => n.status === "autorizada").reduce((s, n) => s + n.total, 0);
  const totalCanceladas = filteredNfes.filter(n => n.status === "cancelada").length;
  const totalContingencia = filteredNfes.filter(n => n.status === "contingencia").length;

  const saveConfig = () => { setConfig({ ...tempConfig }); setConfigOpen(false); toast.success("Configuração de NF-e salva"); };

  const handleCancel = () => {
    if (cancelReason.length < 15) { toast.error("Justificativa deve ter no mínimo 15 caracteres"); return; }
    toast.success(`NF-e ${cancelTarget?.number} cancelada com sucesso`);
    setCancelDialogOpen(false); setCancelReason("");
  };

  const addItem = () => {
    const cfop = formRecipientState === config.state ? "5.101" : "6.101";
    setFormItems(prev => [...prev, {
      id: `new-${Date.now()}`, code: "", description: "", ncm: "0102.29.90", cfop,
      unit: "CAB", quantity: 1, unitPrice: 0, totalPrice: 0,
      icmsCst: "00", icmsRate: formRecipientState === config.state ? 7 : 12,
      pisCst: "01", cofinsCst: "01", ipiRate: 0,
    }]);
  };

  const updateItem = (id: string, field: keyof NfeItem, value: string | number) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated.totalPrice = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  const removeItem = (id: string) => setFormItems(prev => prev.filter(i => i.id !== id));

  const formSubtotal = formItems.reduce((s, i) => s + i.totalPrice, 0);

  const handleEmit = () => {
    toast.success("NF-e enviada para emissão via API (simulação)");
    setNewNfeOpen(false); setShowPreview(false);
  };

  const handleCopyData = () => {
    const text = formItems.map(i => `${i.description} | NCM ${i.ncm} | CFOP ${i.cfop} | ${i.quantity} ${i.unit} × ${fmt(i.unitPrice)} = ${fmt(i.totalPrice)}`).join("\n");
    navigator.clipboard.writeText(`DADOS PARA NF-e\nDestinatário: ${formRecipientName} (${formRecipientCnpj})\n\nITENS:\n${text}\n\nTOTAL: ${fmt(formSubtotal)}`);
    toast.success("Dados copiados para a área de transferência");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              NF-e de Saída
            </h1>
            <p className="text-sm text-muted-foreground">
              {config.environment === "homologacao" ? "⚠️ Ambiente de Homologação" : "Ambiente de Produção"} • Série {config.series} • Próximo nº {config.nextNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setTempConfig({ ...config })}>
                <Settings2 className="h-4 w-4 mr-1" />Configurar NF-e
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Configuração de Emissão de NF-e</DialogTitle></DialogHeader>
              <ConfigForm config={tempConfig} onChange={setTempConfig} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={saveConfig}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={() => setNewNfeOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Nova NF-e
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {totalContingencia > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{totalContingencia} NF-e(s) em contingência aguardando autorização da SEFAZ</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">NF-es no Período</span>
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-bold font-mono">{filteredNfes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total Faturado</span>
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{fmt(totalFaturado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Canceladas</span>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-xl font-bold font-mono">{totalCanceladas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Contingência</span>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-xl font-bold font-mono">{totalContingencia}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="historico">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="historico">Histórico de NF-es</TabsTrigger>
          <TabsTrigger value="dados-contador">Dados para Contador</TabsTrigger>
          <TabsTrigger value="notas-produtor">Notas do Produtor</TabsTrigger>
        </TabsList>

        {/* ── HISTÓRICO ──────────────────────── */}
        <TabsContent value="historico" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Período</Label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="month">Mês atual</SelectItem>
                      <SelectItem value="year">Ano atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNfes.map(nfe => (
                    <TableRow key={nfe.id}>
                      <TableCell className="font-mono text-sm">{nfe.number}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(nfe.emissionDate)}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{nfe.recipientName}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{nfe.items.map(i => i.description).join(", ")}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(nfe.total)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusColors[nfe.status]}`}>
                          {statusLabels[nfe.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailNfe(nfe)}>
                            <Eye className="h-3 w-3 mr-1" />DANFE
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Download XML simulado")}>
                            <FileDown className="h-3 w-3 mr-1" />XML
                          </Button>
                          {nfe.status === "autorizada" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => { setCancelTarget(nfe); setCancelDialogOpen(true); }}>
                              Cancelar
                            </Button>
                          )}
                          <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredNfes.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma NF-e encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DADOS PARA CONTADOR ────────────── */}
        <TabsContent value="dados-contador" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Gerar Dados para NF-e (Pré-preenchimento)
              </CardTitle>
              <CardDescription>
                Para produtores pessoa física ou que preferem que o contador emita a NF-e.
                Selecione uma venda para gerar os dados formatados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock sales to pick from */}
              {[
                { id: "txn-1", desc: "Venda de 15 bezerros", date: "08/03/2026", buyer: "João Silva", value: 45000 },
                { id: "txn-9", desc: "Venda de 8 novilhos — leilão", date: "25/02/2026", buyer: "Leilão Rural", value: 32000 },
                { id: "txn-15", desc: "Venda de 5 vacas de descarte", date: "05/02/2026", buyer: "Frigorífico Central", value: 18000 },
              ].map(sale => (
                <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{sale.desc}</p>
                    <p className="text-xs text-muted-foreground">{sale.date} • {sale.buyer} • {fmt(sale.value)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyData}>
                      <Copy className="h-3 w-3 mr-1" />Copiar Dados
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Exportação PDF simulada")}>
                      <FileDown className="h-3 w-3 mr-1" />PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Exportação JSON simulada")}>
                      <FileSpreadsheet className="h-3 w-3 mr-1" />JSON
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview — Dados Formatados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs space-y-3">
                <div>
                  <p className="font-bold text-foreground">EMITENTE:</p>
                  <p>{config.razaoSocial} • {config.emitterType === "pf" ? "CPF" : "CNPJ"}: {config.cnpjCpf}</p>
                  <p>IE: {config.ie} • {config.address} • {config.municipality}/{config.state}</p>
                </div>
                <Separator />
                <div>
                  <p className="font-bold text-foreground">DESTINATÁRIO:</p>
                  <p>Frigorífico ABC Ltda • CNPJ: 11.222.333/0001-44</p>
                  <p>IE: 987654321 • Rod. SP-322 Km 15 — Ribeirão Preto/SP</p>
                </div>
                <Separator />
                <div>
                  <p className="font-bold text-foreground">PRODUTOS:</p>
                  <p>1. Bovino Nelore Macho — Lote 142</p>
                  <p>   NCM: 0102.29.90 | CFOP: 6.101 | 15 CAB × R$ 3.000,00 = R$ 45.000,00</p>
                </div>
                <Separator />
                <div>
                  <p className="font-bold text-foreground">TOTAL: R$ 45.000,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NOTAS DO PRODUTOR ──────────────── */}
        <TabsContent value="notas-produtor" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ScrollText className="h-5 w-5" /> Notas do Produtor Rural
              </h3>
              <p className="text-xs text-muted-foreground">Registro de notas emitidas pela SEFAZ estadual (pessoa física)</p>
            </div>
            <Button size="sm" onClick={() => toast.info("Cadastro de nota do produtor será implementado")}>
              <Plus className="h-4 w-4 mr-1" />Registrar Nota
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Venda Vinculada</TableHead>
                    <TableHead>Documento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProducerNotes.map(note => (
                    <TableRow key={note.id}>
                      <TableCell className="font-mono text-sm">{note.number}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(note.date)}</TableCell>
                      <TableCell className="text-sm">{note.recipientName}</TableCell>
                      <TableCell className="text-sm">{note.product}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{note.quantity} {note.unit}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(note.value)}</TableCell>
                      <TableCell className="text-sm">
                        {note.linkedSaleId ? <Badge variant="secondary" className="text-xs">Vinculada</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Upload de documento simulado")}>
                          <Upload className="h-3 w-3 mr-1" />Upload
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold">Total Ano 2026</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {fmt(mockProducerNotes.filter(n => n.date.startsWith("2026")).reduce((s, n) => s + n.value, 0))}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── NEW NF-e DIALOG ── */}
      <Dialog open={newNfeOpen} onOpenChange={v => { setNewNfeOpen(v); setShowPreview(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{showPreview ? "Preview DANFE — Conferência" : "Nova NF-e de Saída"}</DialogTitle></DialogHeader>

          {!showPreview ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Natureza da Operação</Label>
                  <Select value={formNature} onValueChange={setFormNature}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{natureOptions.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Finalidade</Label>
                  <Select value={formPurpose} onValueChange={setFormPurpose}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(purposeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de Emissão</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              {/* Recipient */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Destinatário</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">CNPJ/CPF</Label>
                    <div className="flex gap-2">
                      <Input value={formRecipientCnpj} onChange={e => setFormRecipientCnpj(maskDocument(e.target.value))} placeholder="00.000.000/0000-00" />
                      <Button variant="outline" size="sm" onClick={() => toast.info("Consulta BrasilAPI simulada")}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Razão Social</Label>
                    <Input value={formRecipientName} onChange={e => setFormRecipientName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">UF</Label>
                    <Select value={formRecipientState} onValueChange={setFormRecipientState}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Indicador IE</Label>
                    <Select value={formIeIndicator} onValueChange={setFormIeIndicator}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contribuinte">Contribuinte ICMS</SelectItem>
                        <SelectItem value="isento">Isento</SelectItem>
                        <SelectItem value="nao_contribuinte">Não Contribuinte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formFinalConsumer} onCheckedChange={setFormFinalConsumer} />
                    <Label className="text-xs">Consumidor Final</Label>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Produtos</h4>
                  <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Adicionar Item</Button>
                </div>
                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <Card key={item.id} className="p-3">
                      <div className="grid gap-2 sm:grid-cols-6">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[10px]">Descrição</Label>
                          <Input value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="Ex: Bovino Nelore Macho" className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">NCM</Label>
                          <Select value={item.ncm} onValueChange={v => updateItem(item.id, "ncm", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{commonNcms.map(n => <SelectItem key={n.code} value={n.code}><span className="text-xs">{n.code}</span></SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">CFOP</Label>
                          <Input value={item.cfop} onChange={e => updateItem(item.id, "cfop", e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Unid.</Label>
                          <Select value={item.unit} onValueChange={v => updateItem(item.id, "unit", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["CAB","KG","LT","SC","CX","UN","TON","@"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => removeItem(item.id)} disabled={formItems.length <= 1}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Qtd</Label>
                          <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, "quantity", Number(e.target.value))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Valor Unit.</Label>
                          <Input type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value))} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Total</Label>
                          <Input value={fmt(item.totalPrice)} readOnly className="h-8 text-xs bg-muted" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">CST ICMS</Label>
                          <Input value={item.icmsCst} onChange={e => updateItem(item.id, "icmsCst", e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Alíq. ICMS %</Label>
                          <Input type="number" value={item.icmsRate} onChange={e => updateItem(item.id, "icmsRate", Number(e.target.value))} className="h-8 text-xs" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <p className="text-sm font-semibold">Subtotal: <span className="font-mono">{fmt(formSubtotal)}</span></p>
                </div>
              </div>

              {/* Transport */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> Transporte</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Modalidade de Frete</Label>
                    <Select value={formFreightMode} onValueChange={setFormFreightMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cif">CIF (Emitente)</SelectItem>
                        <SelectItem value="fob">FOB (Destinatário)</SelectItem>
                        <SelectItem value="sem_frete">Sem Frete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Transportadora</Label>
                    <Input placeholder="Buscar em Parceiros" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Placa</Label>
                    <Input placeholder="ABC-1234" />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Cobrança</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Forma de Pagamento</Label>
                    <Select value={formPaymentMode} onValueChange={setFormPaymentMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avista">À Vista</SelectItem>
                        <SelectItem value="aprazo">A Prazo</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formPaymentMode === "aprazo" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    As duplicatas serão geradas automaticamente e registradas em Contas a Receber ao emitir a NF-e.
                  </p>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Informações Complementares</Label>
                  <Textarea value={formAdditionalInfo} onChange={e => setFormAdditionalInfo(e.target.value)} rows={2} className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Informações do Fisco</Label>
                  <Textarea value={formFiscalInfo} onChange={e => setFormFiscalInfo(e.target.value)} rows={2} className="text-xs" />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-1" />Preview DANFE
                </Button>
                <Button onClick={handleEmit}>
                  <Send className="h-4 w-4 mr-1" />Emitir NF-e
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Preview DANFE */
            <div className="space-y-4">
              <Card className="border-2 border-foreground/20">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center border-b pb-3">
                    <p className="text-lg font-bold">DANFE — Documento Auxiliar da NF-e</p>
                    <p className="text-xs text-muted-foreground">{config.environment === "homologacao" ? "SEM VALOR FISCAL — HOMOLOGAÇÃO" : "DOCUMENTO FISCAL"}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold">EMITENTE</p>
                      <p>{config.razaoSocial}</p>
                      <p>{config.emitterType === "pf" ? "CPF" : "CNPJ"}: {config.cnpjCpf} • IE: {config.ie}</p>
                      <p>{config.address} — {config.municipality}/{config.state}</p>
                    </div>
                    <div>
                      <p className="font-bold">DESTINATÁRIO</p>
                      <p>{formRecipientName || "—"}</p>
                      <p>CNPJ/CPF: {formRecipientCnpj || "—"}</p>
                      <p>UF: {formRecipientState}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Descrição</TableHead>
                        <TableHead className="text-xs">NCM</TableHead>
                        <TableHead className="text-xs">CFOP</TableHead>
                        <TableHead className="text-xs">Qtd</TableHead>
                        <TableHead className="text-xs text-right">Valor Unit.</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.description || "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{item.ncm}</TableCell>
                          <TableCell className="text-xs font-mono">{item.cfop}</TableCell>
                          <TableCell className="text-xs">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmt(item.unitPrice)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmt(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={5} className="font-bold text-xs">TOTAL DA NOTA</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{fmt(formSubtotal)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>

                  <div className="text-xs text-muted-foreground">
                    <p><strong>Nat. Operação:</strong> {formNature} • <strong>Finalidade:</strong> {purposeLabels[formPurpose]}</p>
                    <p><strong>Frete:</strong> {formFreightMode === "cif" ? "CIF" : formFreightMode === "fob" ? "FOB" : "Sem frete"} • <strong>Pagamento:</strong> {formPaymentMode === "avista" ? "À vista" : formPaymentMode === "aprazo" ? "A prazo" : "Outros"}</p>
                    {formAdditionalInfo && <p><strong>Info. Complementares:</strong> {formAdditionalInfo}</p>}
                  </div>
                </CardContent>
              </Card>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />Voltar e Editar
                </Button>
                <Button onClick={handleEmit}>
                  <Send className="h-4 w-4 mr-1" />Emitir NF-e
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail / DANFE Dialog ── */}
      <Dialog open={!!detailNfe} onOpenChange={() => setDetailNfe(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailNfe && (
            <>
              <DialogHeader>
                <DialogTitle>NF-e {detailNfe.number} — DANFE Simplificado</DialogTitle>
              </DialogHeader>
              <Card className="border-2 border-foreground/20">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center border-b pb-3">
                    <p className="font-bold">DANFE — NF-e Nº {detailNfe.number} Série {detailNfe.series}</p>
                    <Badge variant="outline" className={`text-xs ${statusColors[detailNfe.status]}`}>{statusLabels[detailNfe.status]}</Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-bold">EMITENTE</p>
                      <p>{config.razaoSocial}</p>
                      <p>{config.cnpjCpf} • IE: {config.ie}</p>
                    </div>
                    <div>
                      <p className="font-bold">DESTINATÁRIO</p>
                      <p>{detailNfe.recipientName}</p>
                      <p>{detailNfe.recipientCnpjCpf} • IE: {detailNfe.recipientIe}</p>
                      <p>{detailNfe.recipientCity}/{detailNfe.recipientState}</p>
                    </div>
                  </div>

                  <div className="text-xs">
                    <p><strong>Chave de Acesso:</strong></p>
                    <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline flex items-center gap-1">
                      {detailNfe.accessKey} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Descrição</TableHead>
                        <TableHead className="text-xs">NCM</TableHead>
                        <TableHead className="text-xs">CFOP</TableHead>
                        <TableHead className="text-xs">Qtd</TableHead>
                        <TableHead className="text-xs text-right">Unit.</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailNfe.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.description}</TableCell>
                          <TableCell className="text-xs font-mono">{item.ncm}</TableCell>
                          <TableCell className="text-xs font-mono">{item.cfop}</TableCell>
                          <TableCell className="text-xs">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmt(item.unitPrice)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmt(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={5} className="font-bold text-xs">TOTAL</TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs">{fmt(detailNfe.total)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>

                  {detailNfe.installments.length > 0 && (
                    <div className="text-xs">
                      <p className="font-bold mb-1">DUPLICATAS:</p>
                      {detailNfe.installments.map(inst => (
                        <p key={inst.number}>Parcela {inst.number}: {fmt(inst.amount)} — vence {fmtDate(inst.dueDate)}</p>
                      ))}
                    </div>
                  )}

                  {detailNfe.cancelReason && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs">
                      <p className="font-bold text-destructive">CANCELADA:</p>
                      <p>{detailNfe.cancelReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar NF-e {cancelTarget?.number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe a justificativa de cancelamento (mínimo 15 caracteres).</p>
            <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Motivo do cancelamento..." />
            <p className="text-xs text-muted-foreground">{cancelReason.length}/15 caracteres mínimos</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Voltar</Button></DialogClose>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelReason.length < 15}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Config Form ───────────────────────────── */
function ConfigForm({ config, onChange }: { config: NfeConfig; onChange: (c: NfeConfig) => void }) {
  const u = (field: keyof NfeConfig, value: string | number | boolean) => onChange({ ...config, [field]: value });
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Dados do Emitente</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Tipo de Emitente</Label>
            <Select value={config.emitterType} onValueChange={v => u("emitterType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pf">Pessoa Física (Produtor Rural)</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{config.emitterType === "pf" ? "CPF" : "CNPJ"}</Label>
            <Input
              value={config.cnpjCpf}
              onChange={e => u("cnpjCpf", config.emitterType === "pf" ? maskCpf(e.target.value) : maskCnpj(e.target.value))}
              placeholder={config.emitterType === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">{config.emitterType === "pf" ? "Nome Completo" : "Razão Social"}</Label>
            <Input value={config.razaoSocial} onChange={e => u("razaoSocial", e.target.value)} />
          </div>
          <div className="space-y-1"><Label className="text-xs">Inscrição Estadual</Label><Input value={config.ie} onChange={e => u("ie", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Inscrição Municipal</Label><Input value={config.im} onChange={e => u("im", e.target.value)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Endereço</Label><Input value={config.address} onChange={e => u("address", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Município</Label><Input value={config.municipality} onChange={e => u("municipality", e.target.value)} /></div>
          <div className="space-y-1">
            <Label className="text-xs">UF</Label>
            <Select value={config.state} onValueChange={v => u("state", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Regime Tributário</Label>
            <Select value={config.taxRegime} onValueChange={v => u("taxRegime", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(taxRegimeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">CNAE Principal</Label><Input value={config.cnae} onChange={e => u("cnae", e.target.value)} /></div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold mb-3">Configurações Fiscais</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">Série</Label><Input type="number" value={config.series} onChange={e => u("series", Number(e.target.value))} /></div>
          <div className="space-y-1"><Label className="text-xs">Próximo Número</Label><Input type="number" value={config.nextNumber} onChange={e => u("nextNumber", Number(e.target.value))} /></div>
          <div className="space-y-1">
            <Label className="text-xs">Ambiente</Label>
            <Select value={config.environment} onValueChange={v => u("environment", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                <SelectItem value="producao">Produção (Real)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold mb-3">Integração com API de Emissão</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Provedor</Label>
            <Select value={config.apiProvider} onValueChange={v => u("apiProvider", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(apiProviderLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">URL da API</Label><Input value={config.apiUrl} onChange={e => u("apiUrl", e.target.value)} placeholder="https://api.focusnfe.com.br" /></div>
          <div className="space-y-1"><Label className="text-xs">Token de Autenticação</Label><Input type="password" value={config.apiToken} onChange={e => u("apiToken", e.target.value)} /></div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={() => toast.info("Teste de conexão simulado — configurar API real no backend")}>Testar Conexão</Button>
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Certificado Digital (.pfx)</Label>
          <div className="flex gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={() => toast.info("Upload de certificado será implementado com backend")}>
              <Upload className="h-3 w-3 mr-1" />Upload .pfx
            </Button>
            <span className="text-xs text-muted-foreground self-center">
              {config.certificateUploaded ? "✅ Certificado carregado" : "Nenhum certificado carregado"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
