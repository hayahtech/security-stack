import { useState, useMemo } from "react";
import {
  ArrowLeft, Upload, Truck, FileText, ExternalLink, Search,
  AlertTriangle, CheckCircle2, XCircle, Loader2, Package,
  Weight, DollarSign, Building2, MapPin, ChevronDown, Link2,
  User, Car, FileWarning, Clock, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  mockMdfes, MdfeRecord, modalLabels, transportStatusLabels,
  transportStatusColors, getMdfeAlerts, type MdfeAlert,
} from "@/data/mdfe-mock";

/* ── Helpers ──────────────────────────────── */
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtWeight = (v: number) => v.toLocaleString("pt-BR") + " kg";
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const SEFAZ_URL = "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx";

/* ── XML Parser ───────────────────────────── */
function parseMdfeXml(xmlString: string): Partial<MdfeRecord> | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    const err = doc.querySelector("parsererror");
    if (err) return null;

    const ide = doc.querySelector("ide");
    const emit = doc.querySelector("emit");
    const modal = doc.querySelector("rodo") ? "rodoviario"
      : doc.querySelector("ferrov") ? "ferroviario"
      : doc.querySelector("aquav") ? "aquaviario" : "aereo";

    const infMDFe = doc.querySelector("infMDFe");
    const chave = infMDFe?.getAttribute("Id")?.replace("MDFe", "") || "";

    const veicTracao = doc.querySelector("veicTracao");
    const condutor = doc.querySelector("condutor");
    const infCarga = doc.querySelector("infCarga");
    const infDoc = doc.querySelectorAll("infMunDescarga infCTe, infMunDescarga infNFe");

    // Collect NF-e keys
    const nfeKeys: string[] = [];
    doc.querySelectorAll("infNFe chNFe, infCTe chCTe").forEach(el => {
      if (el.textContent) nfeKeys.push(el.textContent);
    });

    const getVal = (parent: Element | null, tag: string) => parent?.querySelector(tag)?.textContent || "";

    // Parse quantity from infCarga
    const infUnidTransp = doc.querySelectorAll("infUnidTransp");
    let qVol = 0;
    doc.querySelectorAll("infCarga qCarga").forEach(el => {
      const v = parseFloat(el.textContent || "0");
      if (v > qVol) qVol = v;
    });

    const prodPred = getVal(infCarga, "proPred");
    const cepCarrega = getVal(infCarga, "cEPCarrega") || getVal(doc.querySelector("infMunCarrega"), "cMunCarrega");

    return {
      number: getVal(ide, "nMDF"),
      series: getVal(ide, "serie"),
      accessKey: chave,
      emissionDate: getVal(ide, "dhEmi"),
      ufStart: getVal(ide, "UFIni"),
      ufEnd: getVal(ide, "UFFim"),
      modal: modal as MdfeRecord["modal"],
      emitterCnpj: getVal(emit, "CNPJ") || getVal(emit, "CPF"),
      emitterName: getVal(emit, "xNome"),
      emitterIe: getVal(emit, "IE"),
      carrierCnpj: getVal(doc.querySelector("rodo prop"), "CNPJ") || "",
      carrierName: getVal(doc.querySelector("rodo prop"), "xNome") || "",
      carrierRntrc: getVal(doc.querySelector("rodo infANTT"), "RNTRC") || "",
      vehiclePlate: getVal(veicTracao, "placa"),
      vehicleUf: getVal(veicTracao, "UF"),
      vehicleRntrc: getVal(doc.querySelector("rodo infANTT"), "RNTRC") || "",
      driverCpf: getVal(condutor, "CPF"),
      driverName: getVal(condutor, "xNome"),
      productName: prodPred || "Carga geral",
      ncm: "",
      unit: "KG",
      quantity: qVol,
      grossWeight: parseFloat(getVal(doc.querySelector("tot"), "qCarga") || "0"),
      netWeight: parseFloat(getVal(doc.querySelector("tot"), "qCarga") || "0"),
      declaredValue: parseFloat(getVal(doc.querySelector("tot"), "vCarga") || "0"),
      linkedNfeKeys: nfeKeys,
      transportStatus: "registrado",
    };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function MdfePage() {
  const navigate = useNavigate();
  const [mdfes, setMdfes] = useState<MdfeRecord[]>([...mockMdfes]);
  const [activeTab, setActiveTab] = useState("historico");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedMdfe, setUploadedMdfe] = useState<Partial<MdfeRecord> | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterCarrier, setFilterCarrier] = useState("all");
  const [filterUf, setFilterUf] = useState("all");

  // Detail view
  const [selectedMdfe, setSelectedMdfe] = useState<MdfeRecord | null>(null);

  // Link sale dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingMdfe, setLinkingMdfe] = useState<MdfeRecord | null>(null);

  const alerts = useMemo(() => getMdfeAlerts(mdfes), [mdfes]);

  const filteredMdfes = useMemo(() => {
    let data = [...mdfes];
    if (filterCarrier !== "all") data = data.filter(m => m.carrierName === filterCarrier);
    if (filterUf !== "all") data = data.filter(m => m.ufEnd === filterUf);
    if (filterPeriod !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (filterPeriod === "30d") cutoff.setDate(now.getDate() - 30);
      else if (filterPeriod === "90d") cutoff.setDate(now.getDate() - 90);
      else if (filterPeriod === "year") cutoff.setMonth(0, 1);
      data = data.filter(m => new Date(m.emissionDate) >= cutoff);
    }
    return data.sort((a, b) => b.emissionDate.localeCompare(a.emissionDate));
  }, [mdfes, filterCarrier, filterUf, filterPeriod]);

  const uniqueCarriers = [...new Set(mdfes.map(m => m.carrierName))];
  const uniqueUfs = [...new Set(mdfes.map(m => m.ufEnd))].sort();

  // Summary
  const totalWeight = filteredMdfes.reduce((s, m) => s + m.grossWeight, 0);
  const totalValue = filteredMdfes.reduce((s, m) => s + m.declaredValue, 0);
  const totalCarriers = new Set(filteredMdfes.map(m => m.carrierCnpj)).size;

  /* ── File handling ── */
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploadedMdfe(null);
    setUploading(true);

    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setUploadError("Formato inválido. Selecione um arquivo XML de MDF-e.");
      setUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Validate MDF-e namespace/root
      if (!content.includes("infMDFe") && !content.includes("mdfeProc")) {
        setUploadError("XML inválido. O arquivo não contém dados de MDF-e (namespace mdfeProc ou infMDFe não encontrado).");
        setUploading(false);
        return;
      }
      const parsed = parseMdfeXml(content);
      if (!parsed) {
        setUploadError("Não foi possível extrair dados do XML. Verifique se é um MDF-e válido.");
        setUploading(false);
        return;
      }
      setTimeout(() => {
        setUploadedMdfe(parsed);
        setUploading(false);
        setActiveTab("upload");
        toast.success("XML do MDF-e lido com sucesso!");
      }, 800);
    };
    reader.readAsText(file);
  };

  const confirmUpload = () => {
    if (!uploadedMdfe) return;
    const newMdfe: MdfeRecord = {
      id: `mdfe-${Date.now()}`,
      number: uploadedMdfe.number || "000000",
      series: uploadedMdfe.series || "1",
      accessKey: uploadedMdfe.accessKey || "",
      emissionDate: uploadedMdfe.emissionDate || new Date().toISOString(),
      ufStart: uploadedMdfe.ufStart || "",
      ufEnd: uploadedMdfe.ufEnd || "",
      modal: uploadedMdfe.modal || "rodoviario",
      emitterCnpj: uploadedMdfe.emitterCnpj || "",
      emitterName: uploadedMdfe.emitterName || "",
      emitterIe: uploadedMdfe.emitterIe || "",
      carrierCnpj: uploadedMdfe.carrierCnpj || "",
      carrierName: uploadedMdfe.carrierName || "Não identificada",
      carrierRntrc: uploadedMdfe.carrierRntrc || "",
      vehiclePlate: uploadedMdfe.vehiclePlate || "",
      vehicleUf: uploadedMdfe.vehicleUf || "",
      vehicleRntrc: uploadedMdfe.vehicleRntrc || "",
      driverCpf: uploadedMdfe.driverCpf || "",
      driverName: uploadedMdfe.driverName || "",
      productName: uploadedMdfe.productName || "",
      ncm: uploadedMdfe.ncm || "",
      unit: uploadedMdfe.unit || "",
      quantity: uploadedMdfe.quantity || 0,
      grossWeight: uploadedMdfe.grossWeight || 0,
      netWeight: uploadedMdfe.netWeight || 0,
      declaredValue: uploadedMdfe.declaredValue || 0,
      linkedNfeKeys: uploadedMdfe.linkedNfeKeys || [],
      transportStatus: "registrado",
    };
    setMdfes(prev => [newMdfe, ...prev]);
    setUploadedMdfe(null);
    setActiveTab("historico");
    toast.success(`MDF-e ${newMdfe.number} registrado com sucesso!`);
  };

  const handleLinkSale = (mdfe: MdfeRecord) => {
    setMdfes(prev => prev.map(m =>
      m.id === mdfe.id ? { ...m, transportStatus: "vinculado", linkedSaleDescription: "Venda vinculada manualmente" } : m
    ));
    setLinkDialogOpen(false);
    toast.success("MDF-e vinculado à venda com sucesso!");
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
              <Truck className="h-6 w-6 text-primary" />
              MDF-e — Manifesto de Cargas
            </h1>
            <p className="text-sm text-muted-foreground">Controle de manifestos eletrônicos de transporte</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
              alert.type === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                : alert.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                : "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300"
            }`}>
              {alert.type === "warning" ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : <FileWarning className="h-4 w-4 mt-0.5 shrink-0" />}
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total de Cargas</span>
              <Package className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-bold font-mono">{filteredMdfes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Peso Total</span>
              <Weight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xl font-bold font-mono">{fmtWeight(totalWeight)}</p>
            <p className="text-xs text-muted-foreground">{(totalWeight / 15).toFixed(0)} arrobas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Valor Total</span>
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-bold font-mono">{fmt(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Transportadoras</span>
              <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-xl font-bold font-mono">{totalCarriers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="upload">Upload XML</TabsTrigger>
          <TabsTrigger value="rastreabilidade">Rastreabilidade</TabsTrigger>
        </TabsList>

        {/* ── HISTÓRICO ──────────────────────── */}
        <TabsContent value="historico" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Período</Label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                      <SelectItem value="year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Transportadora</Label>
                  <Select value={filterCarrier} onValueChange={setFilterCarrier}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueCarriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UF Destino</Label>
                  <Select value={filterUf} onValueChange={setFilterUf}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueUfs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nº MDF-e</TableHead>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Peso</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>UF Dest.</TableHead>
                    <TableHead>Venda Vinculada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMdfes.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDateShort(m.emissionDate)}</TableCell>
                      <TableCell className="font-mono text-sm">{m.number}</TableCell>
                      <TableCell className="text-sm">{m.carrierName}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{m.productName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtWeight(m.grossWeight)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.declaredValue)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.ufEnd}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {m.linkedSaleDescription ? (
                          <span className="text-xs text-primary">{m.linkedSaleDescription}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${transportStatusColors[m.transportStatus]}`}>
                          {transportStatusLabels[m.transportStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedMdfe(m)}>
                            Detalhes
                          </Button>
                          {!m.linkedSaleId && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setLinkingMdfe(m); setLinkDialogOpen(true); }}>
                              <Link2 className="h-3 w-3 mr-1" />Vincular
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMdfes.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhum MDF-e encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── UPLOAD XML ─────────────────────── */}
        <TabsContent value="upload" className="mt-4 space-y-4">
          {/* Drop zone */}
          {!uploadedMdfe && (
            <Card
              className={`border-2 border-dashed transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".xml"; input.multiple = true; input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files); input.click(); }}
            >
              <CardContent className="p-12 text-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Processando XML do MDF-e...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Arraste o XML do MDF-e aqui</p>
                      <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar arquivo</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Aceita múltiplos arquivos XML</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}

          {/* Parsed data preview */}
          {uploadedMdfe && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold text-foreground">Dados extraídos do MDF-e</h3>
              </div>

              {/* Identification */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Identificação do Manifesto</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoField label="Número" value={uploadedMdfe.number} />
                    <InfoField label="Série" value={uploadedMdfe.series} />
                    <InfoField label="Data/Hora" value={uploadedMdfe.emissionDate ? fmtDate(uploadedMdfe.emissionDate) : "—"} />
                    <InfoField label="Modal" value={uploadedMdfe.modal ? modalLabels[uploadedMdfe.modal] : "—"} />
                    <InfoField label="UF Início" value={uploadedMdfe.ufStart} />
                    <InfoField label="UF Término" value={uploadedMdfe.ufEnd} />
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Chave de Acesso</Label>
                      {uploadedMdfe.accessKey ? (
                        <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer"
                          className="block text-xs font-mono text-primary hover:underline mt-0.5 flex items-center gap-1">
                          {uploadedMdfe.accessKey} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : <p className="text-sm">—</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emitter & Carrier */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Emitente</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <InfoField label="CNPJ/CPF" value={uploadedMdfe.emitterCnpj} />
                      <InfoField label="Razão Social" value={uploadedMdfe.emitterName} />
                      <InfoField label="IE" value={uploadedMdfe.emitterIe} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Transportadora</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <InfoField label="CNPJ" value={uploadedMdfe.carrierCnpj} />
                      <InfoField label="Razão Social" value={uploadedMdfe.carrierName} />
                      <InfoField label="RNTRC" value={uploadedMdfe.carrierRntrc} />
                      <Badge variant="outline" className="text-xs mt-1">
                        {uploadedMdfe.carrierCnpj ? "Buscar em Parceiros →" : "Cadastro rápido necessário"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle & Driver */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4" /> Veículo</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <InfoField label="Placa" value={uploadedMdfe.vehiclePlate} />
                      <InfoField label="UF" value={uploadedMdfe.vehicleUf} />
                      <InfoField label="RNTRC" value={uploadedMdfe.vehicleRntrc} />
                      {uploadedMdfe.vehiclePlate && (
                        <Badge variant="outline" className="text-xs">Buscar em Máquinas & Ativos →</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Motorista</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <InfoField label="CPF" value={uploadedMdfe.driverCpf} />
                      <InfoField label="Nome" value={uploadedMdfe.driverName} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cargo */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Carga Transportada</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoField label="Produto" value={uploadedMdfe.productName} />
                    <InfoField label="Unidade" value={uploadedMdfe.unit} />
                    <InfoField label="Peso Bruto" value={uploadedMdfe.grossWeight ? fmtWeight(uploadedMdfe.grossWeight) : "—"} />
                    <InfoField label="Valor Declarado" value={uploadedMdfe.declaredValue ? fmt(uploadedMdfe.declaredValue) : "—"} />
                  </div>
                </CardContent>
              </Card>

              {/* Linked NF-es */}
              {(uploadedMdfe.linkedNfeKeys?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">NF-es Vinculadas ({uploadedMdfe.linkedNfeKeys?.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {uploadedMdfe.linkedNfeKeys?.map((key, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
                            {key} <ExternalLink className="h-3 w-3" />
                          </a>
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                            Verificar no sistema
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={confirmUpload}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />Registrar MDF-e
                </Button>
                <Button variant="outline" onClick={() => setUploadedMdfe(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── RASTREABILIDADE ────────────────── */}
        <TabsContent value="rastreabilidade" className="mt-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Rastreabilidade de Vendas de Animais
          </h3>
          <p className="text-sm text-muted-foreground">Linha do tempo completa: Venda → MDF-e → Saída → Destino</p>

          {mdfes.filter(m => m.animalEarTags && m.animalEarTags.length > 0).map(m => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-sm">{m.linkedSaleDescription || m.productName}</p>
                    <p className="text-xs text-muted-foreground">MDF-e {m.number} • {fmtDateShort(m.emissionDate)}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${transportStatusColors[m.transportStatus]}`}>
                    {transportStatusLabels[m.transportStatus]}
                  </Badge>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-0 overflow-x-auto pb-2">
                  <TimelineStep icon={<DollarSign className="h-3 w-3" />} label="Venda Registrada" date={fmtDateShort(m.emissionDate)} active />
                  <TimelineConnector />
                  <TimelineStep icon={<FileText className="h-3 w-3" />} label="MDF-e Emitido" date={`Nº ${m.number}`} active />
                  <TimelineConnector />
                  <TimelineStep icon={<Truck className="h-3 w-3" />} label="Saída da Fazenda" date={`${m.ufStart} → ${m.ufEnd}`} active={m.transportStatus !== "registrado"} />
                  <TimelineConnector />
                  <TimelineStep icon={<MapPin className="h-3 w-3" />} label="Destino" date={m.carrierName} active={m.transportStatus === "entregue"} />
                </div>

                {/* Animals */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-3 gap-2 text-xs text-muted-foreground">
                      {m.animalEarTags?.length} animais transportados
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {m.animalEarTags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs font-mono">{tag}</Badge>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}

          {mdfes.filter(m => m.animalEarTags && m.animalEarTags.length > 0).length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum MDF-e com animais registrado</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!selectedMdfe} onOpenChange={() => setSelectedMdfe(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedMdfe && (
            <>
              <DialogHeader>
                <DialogTitle>MDF-e {selectedMdfe.number} — Detalhes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Número / Série" value={`${selectedMdfe.number} / ${selectedMdfe.series}`} />
                  <InfoField label="Data/Hora Emissão" value={fmtDate(selectedMdfe.emissionDate)} />
                  <InfoField label="Modal" value={modalLabels[selectedMdfe.modal]} />
                  <InfoField label="Rota" value={`${selectedMdfe.ufStart} → ${selectedMdfe.ufEnd}`} />
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Emitente" value={`${selectedMdfe.emitterName} (${selectedMdfe.emitterCnpj})`} />
                  <InfoField label="Transportadora" value={`${selectedMdfe.carrierName} (RNTRC: ${selectedMdfe.carrierRntrc})`} />
                  <InfoField label="Veículo" value={`${selectedMdfe.vehiclePlate} (${selectedMdfe.vehicleUf})`} />
                  <InfoField label="Motorista" value={`${selectedMdfe.driverName} (${selectedMdfe.driverCpf})`} />
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Produto" value={selectedMdfe.productName} />
                  <InfoField label="Qtd / Unidade" value={`${selectedMdfe.quantity} ${selectedMdfe.unit}`} />
                  <InfoField label="Peso Bruto" value={fmtWeight(selectedMdfe.grossWeight)} />
                  <InfoField label="Valor Declarado" value={fmt(selectedMdfe.declaredValue)} />
                </div>
                {selectedMdfe.accessKey && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">Chave de Acesso</Label>
                      <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer"
                        className="block text-xs font-mono text-primary hover:underline mt-0.5 flex items-center gap-1">
                        {selectedMdfe.accessKey} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </>
                )}
                {selectedMdfe.linkedNfeKeys.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">NF-es Vinculadas</Label>
                      {selectedMdfe.linkedNfeKeys.map((key, i) => (
                        <a key={i} href={SEFAZ_URL} target="_blank" rel="noopener noreferrer"
                          className="block text-xs font-mono text-primary hover:underline mb-1 flex items-center gap-1">
                          {key} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </>
                )}
                {selectedMdfe.animalEarTags && selectedMdfe.animalEarTags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Animais Transportados ({selectedMdfe.animalEarTags.length})</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMdfe.animalEarTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs font-mono">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Link Sale Dialog ── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular MDF-e à Venda</DialogTitle>
          </DialogHeader>
          {linkingMdfe && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                MDF-e {linkingMdfe.number} — {linkingMdfe.productName} — {fmt(linkingMdfe.declaredValue)}
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Vendas sugeridas (por data e valor aproximado):</Label>
                <div className="space-y-2">
                  {[
                    { id: "txn-1", desc: "Venda de 15 bezerros — R$ 45.000", date: "08/03/2026" },
                    { id: "txn-9", desc: "Venda de 8 novilhos — R$ 32.000", date: "25/02/2026" },
                    { id: "txn-15", desc: "Venda de 5 vacas de descarte — R$ 18.000", date: "05/02/2026" },
                  ].map(sale => (
                    <div key={sale.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => handleLinkSale(linkingMdfe)}>
                      <Checkbox />
                      <div>
                        <p className="text-sm font-medium">{sale.desc}</p>
                        <p className="text-xs text-muted-foreground">{sale.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={() => handleLinkSale(linkingMdfe)}>Confirmar Vinculação</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Small Components ─────────────────────── */
function InfoField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
    </div>
  );
}

function TimelineStep({ icon, label, date, active }: { icon: React.ReactNode; label: string; date: string; active: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 min-w-[100px] ${active ? "text-primary" : "text-muted-foreground/50"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${active ? "border-primary bg-primary/10" : "border-muted-foreground/30"}`}>
        {icon}
      </div>
      <p className="text-[10px] font-medium text-center">{label}</p>
      <p className="text-[10px] text-center">{date}</p>
    </div>
  );
}

function TimelineConnector() {
  return <div className="h-[2px] w-8 bg-muted-foreground/20 mb-8" />;
}
