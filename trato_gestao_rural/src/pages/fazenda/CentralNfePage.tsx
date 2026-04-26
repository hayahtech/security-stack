import { useState, useMemo } from "react";
import {
  ArrowLeft, Settings2, RefreshCw, FileText, ExternalLink, Search,
  AlertTriangle, CheckCircle2, XCircle, Eye, Download, Ban, Plus,
  DollarSign, Hash, Building2, Package, Clock, History, Loader2,
  ChevronRight, ChevronLeft, EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  defaultDfeConfig, DfeConfig, SefazNfe, mockSefazNfes, mockSyncLogs,
  apiProviderLabels, apiProviderUrls, manifestLabels, manifestColors,
  getDfeAlerts, type SyncLog,
} from "@/data/central-nfe-mock";

/* ── Helpers ──────────────────────────────── */
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => { const [y, m, day] = d.split("-"); return `${day}/${m}/${y}`; };
const fmtDateTime = (d: string) => { const dt = new Date(d); return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };
const SEFAZ_URL = "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx";
const timeAgo = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `há ${mins} minutos`;
  if (mins < 1440) return `há ${Math.floor(mins / 60)} horas`;
  return `há ${Math.floor(mins / 1440)} dias`;
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function CentralNfePage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<DfeConfig>({ ...defaultDfeConfig });
  const [configOpen, setConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<DfeConfig>({ ...defaultDfeConfig });
  const [syncLogOpen, setSyncLogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [nfes, setNfes] = useState<SefazNfe[]>([...mockSefazNfes]);
  const [activeTab, setActiveTab] = useState("novas");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showToken, setShowToken] = useState(false);

  // Import modal
  const [importNfe, setImportNfe] = useState<SefazNfe | null>(null);
  const [importStep, setImportStep] = useState(1);
  // Ignore modal
  const [ignoreNfe, setIgnoreNfe] = useState<SefazNfe | null>(null);
  const [ignoreReason, setIgnoreReason] = useState("");
  // Detail modal
  const [detailNfe, setDetailNfe] = useState<SefazNfe | null>(null);

  const alerts = useMemo(() => getDfeAlerts(nfes), [nfes]);
  const lastSync = mockSyncLogs[0];

  const novas = nfes.filter(n => n.status === "nova");
  const revisao = nfes.filter(n => n.status === "revisao");
  const importadas = nfes.filter(n => n.status === "importada");
  const ignoradas = nfes.filter(n => n.status === "ignorada");

  const totalImportedMonth = importadas.filter(n => n.emissionDate.startsWith("2026-03")).reduce((s, n) => s + n.netTotal, 0);
  const newSuppliers = nfes.filter(n => !n.emitterKnown).length;

  const saveConfig = () => { setConfig({ ...tempConfig }); setConfigOpen(false); toast.success("Configuração salva"); };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success("Sincronização concluída — 0 novas NF-es encontradas"); }, 2000);
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = (ids: string[]) => setSelectedIds(prev => prev.length === ids.length ? [] : ids);

  const handleImport = (nfe: SefazNfe) => { setImportNfe(nfe); setImportStep(1); };
  const confirmImport = () => {
    if (!importNfe) return;
    setNfes(prev => prev.map(n => n.id === importNfe.id ? { ...n, status: "importada" as const, manifestStatus: "confirmada" as const, importedAt: new Date().toISOString(), payableStatus: "pendente" as const } : n));
    setImportNfe(null);
    toast.success(`NF-e ${importNfe.number} importada com sucesso!\n${importNfe.items.length} itens processados | 1 conta a pagar de ${fmt(importNfe.netTotal)}`);
  };

  const handleIgnore = () => {
    if (!ignoreNfe) return;
    const manifest = ignoreReason.toLowerCase().includes("não reconhe") || ignoreReason.toLowerCase().includes("desconhec") ? "desconhecida" as const : "nao_realizada" as const;
    setNfes(prev => prev.map(n => n.id === ignoreNfe.id ? { ...n, status: "ignorada" as const, manifestStatus: manifest, ignoreReason } : n));
    setIgnoreNfe(null); setIgnoreReason("");
    toast.info("NF-e movida para Ignoradas");
  };

  const batchImport = () => {
    setNfes(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, status: "importada" as const, manifestStatus: "confirmada" as const, importedAt: new Date().toISOString(), payableStatus: "pendente" as const } : n));
    toast.success(`${selectedIds.length} NF-e(s) importadas em lote`);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Central de NF-e — Busca SEFAZ
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Última sincronização: {timeAgo(lastSync.dateTime)}</span>
              <Badge variant={lastSync.status === "sucesso" ? "secondary" : "destructive"} className="text-xs">
                {lastSync.status === "sucesso" ? "✅ Ativa" : lastSync.status === "erro" ? "❌ Com erros" : "⚠️ Parcial"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setSyncLogOpen(true)}>
            <History className="h-4 w-4 mr-1" />Log
          </Button>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setTempConfig({ ...config })}>
                <Settings2 className="h-4 w-4 mr-1" />Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Configuração da Integração DF-e / SEFAZ</DialogTitle></DialogHeader>
              <ConfigForm config={tempConfig} onChange={setTempConfig} showToken={showToken} setShowToken={setShowToken} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={saveConfig}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Agora"}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${a.type === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300" : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{a.message}</p>
        </div>
      ))}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">NF-es Novas</span>
              {novas.length > 0 && <Badge variant="destructive" className="text-xs">{novas.length}</Badge>}
            </div>
            <p className="text-xl font-bold font-mono">{novas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Importadas (mês)</span>
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-bold font-mono">{importadas.filter(n => n.emissionDate.startsWith("2026-03")).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Compras (mês)</span>
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-bold font-mono">{fmt(totalImportedMonth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Fornecedores Novos</span>
              <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-xl font-bold font-mono">{newSuppliers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch actions */}
      {selectedIds.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium">{selectedIds.length} NF-e(s) selecionadas</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={batchImport}><CheckCircle2 className="h-3 w-3 mr-1" />Importar Selecionadas</Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>Limpar Seleção</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="novas">Novas{novas.length > 0 && ` — ${novas.length}`}</TabsTrigger>
          <TabsTrigger value="revisao">Revisão{revisao.length > 0 && ` — ${revisao.length}`}</TabsTrigger>
          <TabsTrigger value="importadas">Importadas</TabsTrigger>
          <TabsTrigger value="ignoradas">Ignoradas</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        {/* ── NOVAS ── */}
        <TabsContent value="novas" className="mt-4 space-y-3">
          {novas.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedIds.length === novas.length} onCheckedChange={() => selectAll(novas.map(n => n.id))} />
              <span className="text-xs text-muted-foreground">Selecionar todas</span>
            </div>
          )}
          {novas.map(nfe => <NfeCard key={nfe.id} nfe={nfe} selected={selectedIds.includes(nfe.id)} onToggle={() => toggleSelect(nfe.id)} onImport={() => handleImport(nfe)} onView={() => setDetailNfe(nfe)} onIgnore={() => { setIgnoreNfe(nfe); setIgnoreReason(""); }} />)}
          {novas.length === 0 && <EmptyState message="Nenhuma NF-e nova — todas foram processadas" />}
        </TabsContent>

        {/* ── REVISÃO ── */}
        <TabsContent value="revisao" className="mt-4 space-y-3">
          {revisao.map(nfe => <NfeCard key={nfe.id} nfe={nfe} selected={selectedIds.includes(nfe.id)} onToggle={() => toggleSelect(nfe.id)} onImport={() => handleImport(nfe)} onView={() => setDetailNfe(nfe)} onIgnore={() => { setIgnoreNfe(nfe); setIgnoreReason(""); }} />)}
          {revisao.length === 0 && <EmptyState message="Nenhuma NF-e em revisão" />}
        </TabsContent>

        {/* ── IMPORTADAS ── */}
        <TabsContent value="importadas" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Manifestação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importadas.map(nfe => (
                    <TableRow key={nfe.id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(nfe.emissionDate)}</TableCell>
                      <TableCell className="font-mono text-sm">{nfe.number}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{nfe.emitterName}</TableCell>
                      <TableCell className="text-sm">{nfe.items.length} itens</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(nfe.netTotal)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${nfe.payableStatus === "pago" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : nfe.payableStatus === "vencido" ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"}`}>
                          {nfe.payableStatus === "pago" ? "Pago" : nfe.payableStatus === "vencido" ? "Vencido" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${manifestColors[nfe.manifestStatus]}`}>{manifestLabels[nfe.manifestStatus]}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailNfe(nfe)}><Eye className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info("Download XML simulado")}><Download className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IGNORADAS ── */}
        <TabsContent value="ignoradas" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Manifestação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ignoradas.map(nfe => (
                    <TableRow key={nfe.id} className="opacity-70">
                      <TableCell className="text-sm">{fmtDate(nfe.emissionDate)}</TableCell>
                      <TableCell className="font-mono text-sm">{nfe.number}</TableCell>
                      <TableCell className="text-sm">{nfe.emitterName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(nfe.netTotal)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{nfe.ignoreReason || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${manifestColors[nfe.manifestStatus]}`}>{manifestLabels[nfe.manifestStatus]}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {ignoradas.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma NF-e ignorada</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TODAS ── */}
        <TabsContent value="todas" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manifestação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfes.map(nfe => (
                    <TableRow key={nfe.id}>
                      <TableCell className="text-sm">{fmtDate(nfe.emissionDate)}</TableCell>
                      <TableCell className="font-mono text-sm">{nfe.number}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{nfe.emitterName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(nfe.netTotal)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${nfe.status === "nova" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" : nfe.status === "importada" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : nfe.status === "ignorada" ? "bg-muted text-muted-foreground border-border" : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"}`}>
                          {nfe.status === "nova" ? "Nova" : nfe.status === "importada" ? "Importada" : nfe.status === "ignorada" ? "Ignorada" : "Revisão"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${manifestColors[nfe.manifestStatus]}`}>{manifestLabels[nfe.manifestStatus]}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailNfe(nfe)}><Eye className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── IMPORT MODAL ── */}
      <Dialog open={!!importNfe} onOpenChange={() => setImportNfe(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {importNfe && (
            <>
              <DialogHeader>
                <DialogTitle>Importar NF-e {importNfe.number} — Etapa {importStep} de 4</DialogTitle>
              </DialogHeader>

              {importStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Etapa 1 — Dados da Nota</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoField label="Número / Série" value={`${importNfe.number} / ${importNfe.series}`} />
                    <InfoField label="Data de Emissão" value={fmtDate(importNfe.emissionDate)} />
                    <InfoField label="Natureza" value={importNfe.nature} />
                    <InfoField label="CFOP" value={importNfe.cfop} />
                  </div>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoField label="Emitente" value={importNfe.emitterName} />
                    <InfoField label="CNPJ" value={importNfe.emitterCnpj} />
                    <div className="flex items-center gap-2">
                      {importNfe.emitterKnown
                        ? <Badge className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Fornecedor cadastrado</Badge>
                        : <><Badge className="text-xs bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30">Novo fornecedor</Badge><Button variant="outline" size="sm" className="h-6 text-xs"><Plus className="h-3 w-3 mr-1" />Cadastrar</Button></>
                      }
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-4">
                    <InfoField label="Subtotal" value={fmt(importNfe.totalValue)} />
                    <InfoField label="Frete" value={fmt(importNfe.freight)} />
                    <InfoField label="Desconto" value={fmt(importNfe.discount)} />
                    <InfoField label="Total Líquido" value={fmt(importNfe.netTotal)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Chave de Acesso</Label>
                    <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer" className="block text-xs font-mono text-primary hover:underline mt-0.5 flex items-center gap-1">
                      {importNfe.accessKey} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {importStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Etapa 2 — Produtos e Estoque</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>NCM</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importNfe.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm max-w-[180px]">{item.description}</TableCell>
                          <TableCell className="font-mono text-xs">{item.ncm}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{item.suggestedCategory}</Badge></TableCell>
                          <TableCell className="text-sm">{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(item.totalPrice)}</TableCell>
                          <TableCell><Switch checked={item.includeInStock} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {importStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Etapa 3 — Financeiro</h4>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-medium">Conta a Pagar a ser gerada:</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <InfoField label="Fornecedor" value={importNfe.emitterName} />
                        <InfoField label="Valor Total" value={fmt(importNfe.netTotal)} />
                      </div>
                      {importNfe.installments.length > 0 ? (
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Parcelas ({importNfe.installments.length}):</Label>
                          {importNfe.installments.map(inst => (
                            <div key={inst.number} className="flex justify-between p-2 rounded bg-background border mb-1">
                              <span className="text-sm">Parcela {inst.number}</span>
                              <span className="text-sm font-mono">{fmt(inst.amount)} — vence {fmtDate(inst.dueDate)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <InfoField label="Vencimento" value="30 dias após emissão" />
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Centro de Custo</Label>
                          <Select defaultValue="cc-1"><SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cc-1">Fazenda Boa Vista</SelectItem>
                              <SelectItem value="cc-2">Fazenda Santa Maria</SelectItem>
                              <SelectItem value="cc-3">Sede / Administrativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Conta de Débito</Label>
                          <Select defaultValue="pi-1"><SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pi-1">Conta Corrente Sicoob</SelectItem>
                              <SelectItem value="pi-5">Caixa — Fazenda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {importStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Etapa 4 — Confirmação</h4>
                  <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Resumo da importação:</p>
                      <ul className="text-sm space-y-1">
                        <li>✅ {importNfe.items.filter(i => i.includeInStock).length} itens adicionados ao estoque</li>
                        <li>✅ {importNfe.installments.length > 1 ? `${importNfe.installments.length} parcelas` : "1 conta a pagar"} de {fmt(importNfe.netTotal)}</li>
                        {!importNfe.emitterKnown && <li>✅ 1 fornecedor cadastrado ({importNfe.emitterName})</li>}
                        <li>✅ XML salvo e vinculado</li>
                        <li>✅ Manifestação: Confirmação da Operação</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              <DialogFooter className="gap-2">
                {importStep > 1 && <Button variant="outline" onClick={() => setImportStep(s => s - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>}
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                {importStep < 4 ? (
                  <Button onClick={() => setImportStep(s => s + 1)}>Próximo<ChevronRight className="h-4 w-4 ml-1" /></Button>
                ) : (
                  <Button onClick={confirmImport}><CheckCircle2 className="h-4 w-4 mr-1" />Confirmar Importação</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── IGNORE MODAL ── */}
      <Dialog open={!!ignoreNfe} onOpenChange={() => setIgnoreNfe(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ignorar NF-e {ignoreNfe?.number}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o motivo para ignorar esta NF-e. A manifestação será registrada automaticamente.</p>
            <Textarea value={ignoreReason} onChange={e => setIgnoreReason(e.target.value)} rows={3} placeholder="Ex: Mercadoria não recebida, nota não reconhecida..." />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleIgnore} disabled={!ignoreReason.trim()}>
              <Ban className="h-4 w-4 mr-1" />Ignorar NF-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DETAIL MODAL ── */}
      <Dialog open={!!detailNfe} onOpenChange={() => setDetailNfe(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailNfe && (
            <>
              <DialogHeader><DialogTitle>NF-e {detailNfe.number} — Detalhes</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Número / Série" value={`${detailNfe.number} / ${detailNfe.series}`} />
                  <InfoField label="Data" value={fmtDate(detailNfe.emissionDate)} />
                  <InfoField label="Emitente" value={detailNfe.emitterName} />
                  <InfoField label="CNPJ" value={detailNfe.emitterCnpj} />
                  <InfoField label="Natureza" value={detailNfe.nature} />
                  <InfoField label="CFOP" value={detailNfe.cfop} />
                </div>
                <Separator />
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>NCM</TableHead><TableHead>Qtd</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {detailNfe.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className="font-mono text-xs">{item.ncm}</TableCell>
                        <TableCell className="text-sm">{item.quantity} {item.unit}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(item.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter><TableRow><TableCell colSpan={3} className="font-bold">Total</TableCell><TableCell className="text-right font-mono font-bold">{fmt(detailNfe.netTotal)}</TableCell></TableRow></TableFooter>
                </Table>
                <div className="flex gap-2">
                  <Badge variant="outline" className={`text-xs ${manifestColors[detailNfe.manifestStatus]}`}>{manifestLabels[detailNfe.manifestStatus]}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chave de Acesso</Label>
                  <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer" className="block text-xs font-mono text-primary hover:underline mt-0.5 flex items-center gap-1">
                    {detailNfe.accessKey} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── SYNC LOG MODAL ── */}
      <Dialog open={syncLogOpen} onOpenChange={setSyncLogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de Sincronizações</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Encontradas</TableHead>
                <TableHead>Novas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSyncLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap">{fmtDateTime(log.dateTime)}</TableCell>
                  <TableCell className="text-sm">{log.type === "automatica" ? "Automática" : "Manual"}</TableCell>
                  <TableCell className="font-mono text-sm">{log.nfesFound}</TableCell>
                  <TableCell className="font-mono text-sm">{log.nfesNew}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${log.status === "sucesso" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : log.status === "erro" ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"}`}>
                      {log.status === "sucesso" ? "Sucesso" : log.status === "erro" ? "Erro" : "Parcial"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">{log.errorDetail || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── NF-e Card Component ── */
function NfeCard({ nfe, selected, onToggle, onImport, onView, onIgnore }: {
  nfe: SefazNfe; selected: boolean; onToggle: () => void; onImport: () => void; onView: () => void; onIgnore: () => void;
}) {
  return (
    <Card className={`transition-colors ${selected ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold">NF-e {nfe.number}/{nfe.series}</span>
                <span className="text-xs text-muted-foreground">{fmtDate(nfe.emissionDate)}</span>
                <Badge variant="outline" className={`text-xs ${manifestColors[nfe.manifestStatus]}`}>{manifestLabels[nfe.manifestStatus]}</Badge>
              </div>
              <span className="font-mono font-bold text-sm">{fmt(nfe.netTotal)}</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{nfe.emitterName}</span>
              <span className="text-xs text-muted-foreground">({nfe.emitterCnpj})</span>
              {nfe.emitterKnown
                ? <Badge variant="secondary" className="text-[10px]">Cadastrado</Badge>
                : <Badge className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30">Novo</Badge>
              }
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              {nfe.items.slice(0, 2).map(i => i.description).join(" • ")}
              {nfe.items.length > 2 && ` e mais ${nfe.items.length - 2} itens...`}
            </p>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={onImport}><CheckCircle2 className="h-3 w-3 mr-1" />Importar</Button>
              <Button variant="outline" size="sm" onClick={onView}><Eye className="h-3 w-3 mr-1" />Visualizar</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onIgnore}><Ban className="h-3 w-3 mr-1" />Ignorar</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Empty State ── */
function EmptyState({ message }: { message: string }) {
  return <Card><CardContent className="p-8 text-center text-muted-foreground">{message}</CardContent></Card>;
}

/* ── Info Field ── */
function InfoField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

/* ── Config Form ── */
function ConfigForm({ config, onChange, showToken, setShowToken }: { config: DfeConfig; onChange: (c: DfeConfig) => void; showToken: boolean; setShowToken: (v: boolean) => void }) {
  const u = (field: keyof DfeConfig, value: string | number | boolean) => {
    const updated = { ...config, [field]: value };
    if (field === "apiProvider" && typeof value === "string" && value in apiProviderUrls) {
      updated.apiUrl = apiProviderUrls[value as keyof typeof apiProviderUrls];
    }
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Dados do Destinatário</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={config.recipientType} onValueChange={v => u("recipientType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{config.recipientType === "pf" ? "CPF" : "CNPJ"}</Label>
            <Input value={config.cnpjCpf} onChange={e => u("cnpjCpf", e.target.value)} />
          </div>
          <div className="space-y-1"><Label className="text-xs">Razão Social / Nome</Label><Input value={config.razaoSocial} onChange={e => u("razaoSocial", e.target.value)} /></div>
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
        <h4 className="text-sm font-semibold mb-3">Provedor de API</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Provedor</Label>
            <Select value={config.apiProvider} onValueChange={v => u("apiProvider", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(apiProviderLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">URL Base</Label><Input value={config.apiUrl} onChange={e => u("apiUrl", e.target.value)} /></div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Token de Autenticação</Label>
            <div className="flex gap-2">
              <Input type={showToken ? "text" : "password"} value={config.apiToken} onChange={e => u("apiToken", e.target.value)} />
              <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Teste de conexão simulado — configure a API real no backend")}>Testar Conexão</Button>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold mb-3">Sincronização</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Switch checked={config.autoSync} onCheckedChange={v => u("autoSync", v)} />
            <Label className="text-xs">Sincronização automática</Label>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Frequência</Label>
            <Select value={config.syncFrequency} onValueChange={v => u("syncFrequency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">A cada 1 hora</SelectItem>
                <SelectItem value="6h">A cada 6 horas</SelectItem>
                <SelectItem value="diaria">Diariamente</SelectItem>
                <SelectItem value="manual">Manualmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.syncFrequency === "diaria" && (
            <div className="space-y-1"><Label className="text-xs">Horário</Label><Input type="time" value={config.syncHour} onChange={e => u("syncHour", e.target.value)} /></div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Período Inicial</Label>
            <Select value={config.initialPeriod} onValueChange={v => u("initialPeriod", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="60d">Últimos 60 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1a">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.notifyNew} onCheckedChange={v => u("notifyNew", v)} />
            <Label className="text-xs">Notificar novas NF-es</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
