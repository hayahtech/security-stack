import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, FileText, Package, Loader2, CheckCircle, AlertTriangle,
  XCircle, Plus, Building2, Truck, CreditCard, ExternalLink, Info, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { mockProducts, type StockCategory } from "@/data/estoque-mock";
import { mockParceiros } from "@/data/parceiros-mock";
import { formatCNPJ } from "@/lib/validators";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── NCM Classification Map ──
const ncmCategoryMap: { prefix: string; category: StockCategory; label: string }[] = [
  { prefix: "23", category: "alimentacao", label: "Alimentação Animal" },
  { prefix: "30", category: "saude_animal", label: "Medicamentos/Veterinário" },
  { prefix: "2710", category: "combustivel", label: "Combustível" },
  { prefix: "8701", category: "ferramentas", label: "Máquinas/Implementos" },
  { prefix: "8716", category: "ferramentas", label: "Máquinas/Implementos" },
  { prefix: "3808", category: "defensivo", label: "Defensivos Agrícolas" },
  { prefix: "3101", category: "outros", label: "Fertilizantes/Adubos" },
  { prefix: "3102", category: "outros", label: "Fertilizantes/Adubos" },
];

function classifyNcm(ncm: string): { category: StockCategory; label: string } | null {
  for (const entry of ncmCategoryMap) {
    if (ncm.startsWith(entry.prefix)) return { category: entry.category, label: entry.label };
  }
  return null;
}

// ── CFOP Classification ──
function classifyCfop(cfop: string): { tipo: string; label: string; color: string } {
  const num = parseInt(cfop.replace(/\./g, ""), 10);
  if ([1201, 2201, 1202, 2202].includes(num)) return { tipo: "devolucao", label: "Devolução (Crédito)", color: "text-amber-600 border-amber-500/30 bg-amber-500/10" };
  if ([1551, 2551, 1552, 2552].includes(num)) return { tipo: "ativo", label: "Ativo Imobilizado", color: "text-blue-600 border-blue-500/30 bg-blue-500/10" };
  if (num >= 1000 && num < 3000) return { tipo: "compra", label: "Compra/Consumo", color: "text-primary border-primary/30 bg-primary/10" };
  return { tipo: "outro", label: `CFOP ${cfop}`, color: "text-muted-foreground border-border bg-muted/30" };
}

// ── NatOp Classification ──
function classifyNatOp(natOp: string): { tipo: "compra" | "devolucao" | "transferencia" | "remessa"; label: string } {
  const lower = natOp.toLowerCase();
  if (lower.includes("devolu")) return { tipo: "devolucao", label: "Devolução → Gerar crédito" };
  if (lower.includes("transfer")) return { tipo: "transferencia", label: "Transferência → Apenas estoque" };
  if (lower.includes("remessa") || lower.includes("consigna")) return { tipo: "remessa", label: "Remessa → Entrada em consignação" };
  return { tipo: "compra", label: "Compra → Conta a pagar" };
}

// ── Types ──
interface NFeItem {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  cfopClass: ReturnType<typeof classifyCfop>;
  ncmClass: ReturnType<typeof classifyNcm>;
  ean: string;
  unidadeComercial: string;
  unidadeTributavel: string;
  qtdTributavel: number;
  fatorConversao: number;
  unidadeRegistro: "comercial" | "tributavel";
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  ipi: number;
  icms: number;
  icmsBase: number;
  icmsAliq: number;
  pis: number;
  cofins: number;
  // mapping
  stockProductId: string;
  suggestedCategory: StockCategory | "";
  incluirEstoque: boolean;
  editQty: number;
  editUnitCost: number;
}

interface Duplicata {
  numero: string;
  vencimento: string;
  valor: number;
}

interface NFeData {
  numero: string;
  serie: string;
  dataEmissao: string;
  chaveAcesso: string;
  natOp: string;
  natOpClass: ReturnType<typeof classifyNatOp>;
  // Emitente
  fornecedorCnpj: string;
  fornecedorRazaoSocial: string;
  fornecedorIE: string;
  fornecedorRegime: string;
  // Transportadora
  modalidadeFrete: string; // "0"=CIF "1"=FOB etc
  transportadoraCnpj: string;
  transportadoraNome: string;
  // Itens
  itens: NFeItem[];
  // Totais
  valorTotal: number;
  frete: number;
  desconto: number;
  totalLiquido: number;
  // Fiscal summary
  icmsBaseTotal: number;
  icmsTotal: number;
  ipiTotal: number;
  pisTotal: number;
  cofinsTotal: number;
  // Pagamento
  duplicatas: Duplicata[];
}

type Step = "upload" | "review" | "mapping" | "done";

function parseNFeXml(xmlText: string): NFeData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("XML inválido");

  const ns = "http://www.portalfiscal.inf.br/nfe";
  const getTag = (parent: Element | Document, tag: string): string => {
    const el = parent.getElementsByTagNameNS(ns, tag)[0] || parent.getElementsByTagName(tag)[0];
    return el?.textContent?.trim() || "";
  };
  const getAllTags = (parent: Element | Document, tag: string): Element[] => {
    const fromNs = parent.getElementsByTagNameNS(ns, tag);
    const fromPlain = parent.getElementsByTagName(tag);
    return Array.from(fromNs.length > 0 ? fromNs : fromPlain);
  };

  const nfeProc = getAllTags(doc, "nfeProc")[0] || getAllTags(doc, "NFe")[0];
  if (!nfeProc && !getAllTags(doc, "ide")[0]) throw new Error("Este arquivo não parece ser um XML de NF-e válido");

  const ide = getAllTags(doc, "ide")[0];
  const emit = getAllTags(doc, "emit")[0];
  const icmsTot = getAllTags(doc, "ICMSTot")[0];
  const infNFe = getAllTags(doc, "infNFe")[0];
  const transp = getAllTags(doc, "transp")[0];
  const cobr = getAllTags(doc, "cobr")[0];

  const natOp = ide ? getTag(ide, "natOp") : "";
  const numero = ide ? getTag(ide, "nNF") : "";
  const serie = ide ? getTag(ide, "serie") : "";
  const dataEmissao = ide ? getTag(ide, "dhEmi").slice(0, 10) : "";
  const chaveAcesso = infNFe?.getAttribute("Id")?.replace("NFe", "") || "";

  // Emitente
  const fornecedorCnpj = emit ? getTag(emit, "CNPJ") : "";
  const fornecedorRazaoSocial = emit ? getTag(emit, "xNome") : "";
  const fornecedorIE = emit ? getTag(emit, "IE") : "";
  const crt = emit ? getTag(emit, "CRT") : "";
  const regimeMap: Record<string, string> = { "1": "Simples Nacional", "2": "Simples Nacional — Excesso", "3": "Regime Normal" };
  const fornecedorRegime = regimeMap[crt] || (crt ? `CRT ${crt}` : "");

  // Transportadora
  const modalidadeFrete = transp ? getTag(transp, "modFrete") : "9";
  const transportador = transp ? getAllTags(transp, "transporta")[0] : null;
  const transportadoraCnpj = transportador ? getTag(transportador, "CNPJ") : "";
  const transportadoraNome = transportador ? getTag(transportador, "xNome") : "";

  // Totais
  const v = (tag: string) => parseFloat(icmsTot ? getTag(icmsTot, tag) : "0") || 0;
  const valorTotal = v("vNF");
  const frete = v("vFrete");
  const desconto = v("vDesc");
  const totalLiquido = valorTotal - desconto + frete;
  const icmsBaseTotal = v("vBC");
  const icmsTotal = v("vICMS");
  const ipiTotal = v("vIPI");
  const pisTotal = v("vPIS");
  const cofinsTotal = v("vCOFINS");

  // Duplicatas
  const duplicatas: Duplicata[] = [];
  if (cobr) {
    const dups = getAllTags(cobr, "dup");
    dups.forEach(dup => {
      duplicatas.push({
        numero: getTag(dup, "nDup"),
        vencimento: getTag(dup, "dVenc"),
        valor: parseFloat(getTag(dup, "vDup")) || 0,
      });
    });
  }

  // Itens
  const detElements = getAllTags(doc, "det");
  const itens: NFeItem[] = Array.from(detElements).map((det) => {
    const prod = getAllTags(det, "prod")[0];
    const imposto = getAllTags(det, "imposto")[0];

    const ncm = prod ? getTag(prod, "NCM") : "";
    const cfop = prod ? getTag(prod, "CFOP") : "";
    const ean = prod ? (getTag(prod, "cEAN") || getTag(prod, "cEANTrib")) : "";
    const unidadeComercial = prod ? getTag(prod, "uCom") : "";
    const unidadeTributavel = prod ? getTag(prod, "uTrib") : "";
    const quantidade = parseFloat(prod ? getTag(prod, "qCom") : "0") || 0;
    const qtdTributavel = parseFloat(prod ? getTag(prod, "qTrib") : "0") || 0;
    const valorUnitario = parseFloat(prod ? getTag(prod, "vUnCom") : "0") || 0;
    const valorTotalItem = parseFloat(prod ? getTag(prod, "vProd") : "0") || 0;

    const fatorConversao = quantidade > 0 && qtdTributavel > 0 && unidadeComercial !== unidadeTributavel
      ? Math.round(qtdTributavel / quantidade) : 1;

    let ipi = 0, icms = 0, icmsBase = 0, icmsAliq = 0, pis = 0, cofins = 0;
    if (imposto) {
      const ipiEl = getAllTags(imposto, "IPI")[0];
      if (ipiEl) ipi = parseFloat(getTag(ipiEl, "vIPI")) || 0;
      const icmsEl = getAllTags(imposto, "ICMS")[0];
      if (icmsEl) {
        icms = parseFloat(getTag(icmsEl, "vICMS")) || 0;
        icmsBase = parseFloat(getTag(icmsEl, "vBC")) || 0;
        icmsAliq = parseFloat(getTag(icmsEl, "pICMS")) || 0;
      }
      const pisEl = getAllTags(imposto, "PIS")[0];
      if (pisEl) pis = parseFloat(getTag(pisEl, "vPIS")) || 0;
      const cofinsEl = getAllTags(imposto, "COFINS")[0];
      if (cofinsEl) cofins = parseFloat(getTag(cofinsEl, "vCOFINS")) || 0;
    }

    const ncmClass = classifyNcm(ncm);
    const cfopClass = classifyCfop(cfop);

    return {
      codigo: prod ? getTag(prod, "cProd") : "",
      descricao: prod ? getTag(prod, "xProd") : "",
      ncm, cfop, cfopClass, ncmClass, ean,
      unidadeComercial, unidadeTributavel, qtdTributavel, fatorConversao,
      unidadeRegistro: "comercial" as const,
      quantidade, valorUnitario, valorTotal: valorTotalItem,
      ipi, icms, icmsBase, icmsAliq, pis, cofins,
      stockProductId: "",
      suggestedCategory: ncmClass?.category || "",
      incluirEstoque: true,
      editQty: quantidade,
      editUnitCost: valorUnitario,
    };
  });

  if (itens.length === 0) throw new Error("Nenhum item encontrado no XML da NF-e");

  return {
    numero, serie, dataEmissao, chaveAcesso, natOp,
    natOpClass: classifyNatOp(natOp),
    fornecedorCnpj, fornecedorRazaoSocial, fornecedorIE, fornecedorRegime,
    modalidadeFrete, transportadoraCnpj, transportadoraNome,
    itens, valorTotal, frete, desconto, totalLiquido,
    icmsBaseTotal, icmsTotal, ipiTotal, pisTotal, cofinsTotal,
    duplicatas,
  };
}


const freteModalidadeLabel: Record<string, string> = {
  "0": "CIF (Fornecedor)", "1": "FOB (Comprador)", "2": "Terceiros",
  "3": "Próprio Remetente", "4": "Próprio Destinatário", "9": "Sem Frete",
};

const categoryLabels: Record<StockCategory, string> = {
  alimentacao: "Alimentação", saude_animal: "Saúde Animal", defensivo: "Defensivo Agrícola",
  combustivel: "Combustível", ferramentas: "Ferramentas", outros: "Outros",
};

// ════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════

export default function ReceberXml() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [xmlFileName, setXmlFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fornecedorMatch, setFornecedorMatch] = useState<string | null>(null);
  const [transportadoraMatch, setTransportadoraMatch] = useState<string | null>(null);
  const [showNewFornecedor, setShowNewFornecedor] = useState(false);
  const [showNewTransportadora, setShowNewTransportadora] = useState(false);
  const [distribuirFrete, setDistribuirFrete] = useState(true);
  const [summary, setSummary] = useState<{ itens: number; valor: number; parcelas: number; tipo: string } | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("O arquivo deve ser um XML de NF-e");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const text = await file.text();
      const data = parseNFeXml(text);

      // Distribute freight proportionally
      if (data.frete > 0) {
        const totalProd = data.itens.reduce((s, i) => s + i.valorTotal, 0);
        if (totalProd > 0) {
          data.itens.forEach(item => {
            const freteProporcion = (item.valorTotal / totalProd) * data.frete;
            item.editUnitCost = item.quantidade > 0
              ? (item.valorTotal + freteProporcion) / item.quantidade
              : item.valorUnitario;
          });
        }
      }

      setNfeData(data);
      setXmlFileName(file.name);

      // Match fornecedor
      const cnpjDigits = data.fornecedorCnpj.replace(/\D/g, "");
      const match = mockParceiros.find(p => p.doc.replace(/\D/g, "") === cnpjDigits);
      setFornecedorMatch(match ? match.name : null);

      // Match transportadora
      if (data.transportadoraCnpj) {
        const tCnpj = data.transportadoraCnpj.replace(/\D/g, "");
        const tMatch = mockParceiros.find(p => p.doc.replace(/\D/g, "") === tCnpj);
        setTransportadoraMatch(tMatch ? tMatch.name : null);
      }

      // Auto-map products
      data.itens.forEach(item => {
        const found = mockProducts.find(p =>
          p.name.toLowerCase().includes(item.descricao.toLowerCase().split(" ")[0]) ||
          item.descricao.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
        );
        if (found) item.stockProductId = found.id;
      });

      setStep("review");
    } catch (e: any) {
      setError(e.message || "Erro ao processar o XML");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const updateItem = (idx: number, updates: Partial<NFeItem>) => {
    if (!nfeData) return;
    const newItens = [...nfeData.itens];
    newItens[idx] = { ...newItens[idx], ...updates };
    setNfeData({ ...nfeData, itens: newItens });
  };

  const handleConfirm = () => {
    if (!nfeData) return;
    const included = nfeData.itens.filter(i => i.incluirEstoque);
    const parcelas = nfeData.duplicatas.length || 1;
    setSummary({
      itens: included.length,
      valor: nfeData.totalLiquido,
      parcelas,
      tipo: nfeData.natOpClass.tipo,
    });
    setStep("done");
    toast.success(`${included.length} itens adicionados ao estoque`);
  };

  const sefazUrl = "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fazenda/estoque")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Receber Mercadorias por XML
          </h1>
          <p className="text-sm text-muted-foreground">Importe XML de NF-e para dar entrada no estoque automaticamente</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["Upload XML", "Revisar Nota", "Mapear Produtos", "Concluído"].map((label, i) => {
          const stepMap: Step[] = ["upload", "review", "mapping", "done"];
          const current = stepMap.indexOf(step);
          const isActive = i === current;
          const isDoneStep = i < current;
          return (
            <React.Fragment key={label}>
              {i > 0 && <div className={`h-px flex-1 ${isDoneStep ? "bg-primary" : "bg-border"}`} />}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                isActive ? "bg-primary text-primary-foreground" :
                isDoneStep ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {isDoneStep ? <CheckCircle className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 flex items-center justify-center font-bold">{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ══ STEP 1: Upload ══ */}
      {step === "upload" && (
        <Card>
          <CardContent className="p-8">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input ref={fileRef} type="file" accept=".xml" onChange={handleFileChange} className="hidden" />
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-foreground font-medium">Processando XML…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-foreground font-medium">Arraste o XML da NF-e aqui</p>
                  <p className="text-sm text-muted-foreground">ou clique para selecionar o arquivo</p>
                  <Badge variant="outline" className="mt-2">Apenas arquivos .xml de NF-e</Badge>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                <XCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══ STEP 2: Review ══ */}
      {step === "review" && nfeData && (
        <div className="space-y-4">
          {/* Nota info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Dados da Nota Fiscal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">Número:</span> <strong>{nfeData.numero}</strong></div>
                <div><span className="text-muted-foreground">Série:</span> <strong>{nfeData.serie}</strong></div>
                <div><span className="text-muted-foreground">Emissão:</span> <strong>{nfeData.dataEmissao}</strong></div>
                <div><span className="text-muted-foreground">Arquivo:</span> <strong className="text-xs">{xmlFileName}</strong></div>
              </div>

              {/* Natureza da Operação */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Natureza:</span>
                <Badge variant="outline" className="font-medium">{nfeData.natOp || "Não informada"}</Badge>
                <Badge className={`text-xs ${
                  nfeData.natOpClass.tipo === "compra" ? "bg-primary/10 text-primary border-primary/30" :
                  nfeData.natOpClass.tipo === "devolucao" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                  nfeData.natOpClass.tipo === "transferencia" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                  "bg-violet-500/10 text-violet-600 border-violet-500/30"
                }`}>
                  {nfeData.natOpClass.label}
                </Badge>
              </div>

              {/* Chave de Acesso */}
              {nfeData.chaveAcesso && (
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 rounded p-2 break-all">
                  <span className="shrink-0">Chave:</span>
                  <span className="flex-1">{nfeData.chaveAcesso}</span>
                  <a href={sefazUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> SEFAZ
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fornecedor / Emitente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Emitente / Fornecedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm">
                  <p className="font-medium text-foreground">{nfeData.fornecedorRazaoSocial}</p>
                  <p className="text-muted-foreground font-mono">{nfeData.fornecedorCnpj ? formatCNPJ(nfeData.fornecedorCnpj) : "CNPJ não informado"}</p>
                </div>
                {fornecedorMatch ? (
                  <Badge className="gap-1"><CheckCircle className="h-3 w-3" /> {fornecedorMatch}</Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30">
                      <AlertTriangle className="h-3 w-3" /> Não cadastrado
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowNewFornecedor(true)}>
                      <Plus className="h-3 w-3" /> Cadastrar
                    </Button>
                  </div>
                )}
              </div>
              {/* Additional emitter data */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {nfeData.fornecedorIE && <span>IE: <strong className="text-foreground">{nfeData.fornecedorIE}</strong></span>}
                {nfeData.fornecedorRegime && <span>Regime: <strong className="text-foreground">{nfeData.fornecedorRegime}</strong></span>}
              </div>
            </CardContent>
          </Card>

          {/* Frete & Transportadora */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Frete & Transporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="text-muted-foreground">Modalidade:</span>
                <Badge variant="outline">{freteModalidadeLabel[nfeData.modalidadeFrete] || "Não informada"}</Badge>
                {nfeData.frete > 0 && <span className="font-medium text-foreground">Valor: {fmt(nfeData.frete)}</span>}
              </div>

              {/* FOB: show transportadora */}
              {nfeData.modalidadeFrete === "1" && nfeData.transportadoraNome && (
                <div className="flex items-center justify-between flex-wrap gap-3 pl-4 border-l-2 border-border">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{nfeData.transportadoraNome}</p>
                    {nfeData.transportadoraCnpj && <p className="text-muted-foreground font-mono text-xs">{formatCNPJ(nfeData.transportadoraCnpj)}</p>}
                  </div>
                  {transportadoraMatch ? (
                    <Badge className="gap-1"><CheckCircle className="h-3 w-3" /> {transportadoraMatch}</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30">
                        <AlertTriangle className="h-3 w-3" /> Não cadastrada
                      </Badge>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowNewTransportadora(true)}>
                        <Plus className="h-3 w-3" /> Cadastrar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Freight distribution */}
              {nfeData.frete > 0 && (
                <div className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">O frete foi distribuído proporcionalmente no custo unitário de cada item.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Nota */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Itens da Nota ({nfeData.itens.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>NCM</TableHead>
                    <TableHead>CFOP</TableHead>
                    <TableHead>EAN</TableHead>
                    <TableHead>Und</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Vlr Unit</TableHead>
                    <TableHead className="text-right">Vlr Total</TableHead>
                    <TableHead>Classif. NCM</TableHead>
                    <TableHead>Classif. CFOP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfeData.itens.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="truncate block text-sm">{item.descricao}</span>
                        {item.unidadeComercial !== item.unidadeTributavel && item.fatorConversao > 1 && (
                          <span className="text-[10px] text-amber-600 flex items-center gap-0.5 mt-0.5">
                            <RefreshCw className="h-2.5 w-2.5" /> {item.unidadeComercial} → {item.fatorConversao} {item.unidadeTributavel}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.ncm}</TableCell>
                      <TableCell className="font-mono text-xs">{item.cfop}</TableCell>
                      <TableCell className="font-mono text-[10px]">{item.ean && item.ean !== "SEM GTIN" ? item.ean : "—"}</TableCell>
                      <TableCell>{item.unidadeComercial}</TableCell>
                      <TableCell className="text-right">{item.quantidade.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(item.valorUnitario)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{fmt(item.valorTotal)}</TableCell>
                      <TableCell>
                        {item.ncmClass ? (
                          <Badge variant="outline" className="text-[10px]">{item.ncmClass.label}</Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${item.cfopClass.color}`}>{item.cfopClass.label}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resumo Fiscal */}
          <Collapsible>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Resumo Fiscal
                    <Badge variant="outline" className="ml-auto text-xs font-normal">Clique para expandir</Badge>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Base ICMS</p>
                      <p className="font-bold text-foreground">{fmt(nfeData.icmsBaseTotal)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">ICMS Total</p>
                      <p className="font-bold text-foreground">{fmt(nfeData.icmsTotal)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">IPI Total</p>
                      <p className="font-bold text-foreground">{fmt(nfeData.ipiTotal)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">PIS</p>
                      <p className="font-bold text-foreground">{fmt(nfeData.pisTotal)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">COFINS</p>
                      <p className="font-bold text-foreground">{fmt(nfeData.cofinsTotal)}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 text-center">
                    Valores apenas para referência — nenhum cálculo fiscal automático é realizado.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Condições de Pagamento / Duplicatas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {nfeData.duplicatas.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {nfeData.duplicatas.length === 1
                      ? "Pagamento à vista — 1 parcela"
                      : `Parcelamento em ${nfeData.duplicatas.length}× — preview das parcelas:`}
                  </p>
                  <div className="grid gap-2">
                    {nfeData.duplicatas.map((dup, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg p-3">
                        <Badge variant="outline" className="shrink-0">Parcela {dup.numero || i + 1}</Badge>
                        <span className="font-bold text-foreground">{fmt(dup.valor)}</span>
                        <span className="text-muted-foreground">— vence</span>
                        <span className="font-medium text-foreground">{dup.vencimento}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma duplicata informada na nota. O vencimento será definido manualmente.</p>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6 justify-end text-sm">
                <div><span className="text-muted-foreground">Produtos:</span> <strong>{fmt(nfeData.valorTotal)}</strong></div>
                {nfeData.frete > 0 && <div><span className="text-muted-foreground">Frete:</span> <strong>{fmt(nfeData.frete)}</strong></div>}
                {nfeData.desconto > 0 && <div><span className="text-muted-foreground">Desconto:</span> <strong className="text-primary">-{fmt(nfeData.desconto)}</strong></div>}
                <div className="text-base"><span className="text-muted-foreground">Total Líquido:</span> <strong className="text-foreground">{fmt(nfeData.totalLiquido)}</strong></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setStep("upload"); setNfeData(null); setError(""); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button onClick={() => setStep("mapping")}>Mapear Produtos →</Button>
          </div>
        </div>
      )}

      {/* ══ STEP 3: Mapping ══ */}
      {step === "mapping" && nfeData && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mapeamento de Produtos ao Estoque</CardTitle>
              <p className="text-sm text-muted-foreground">Vincule cada item da nota a um produto do seu estoque ou crie um novo</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {nfeData.itens.map((item, idx) => (
                <div key={idx} className={`rounded-lg border p-4 space-y-3 ${!item.incluirEstoque ? "opacity-50 bg-muted/30" : "bg-card"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.descricao}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground">Cód: {item.codigo}</span>
                        <span className="text-xs text-muted-foreground">NCM: {item.ncm}</span>
                        <span className="text-xs text-muted-foreground">CFOP: {item.cfop}</span>
                        {item.ean && item.ean !== "SEM GTIN" && <span className="text-xs text-muted-foreground">EAN: {item.ean}</span>}
                      </div>
                      {/* NCM category suggestion */}
                      {item.ncmClass && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-muted-foreground">Sugestão NCM:</span>
                          <Badge variant="outline" className="text-[10px]">{item.ncmClass.label}</Badge>
                        </div>
                      )}
                      {/* CFOP classification */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">CFOP:</span>
                        <Badge variant="outline" className={`text-[10px] ${item.cfopClass.color}`}>{item.cfopClass.label}</Badge>
                      </div>
                      {/* Unit conversion alert */}
                      {item.unidadeComercial !== item.unidadeTributavel && item.fatorConversao > 1 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 bg-amber-500/5 rounded p-1.5">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Nota em {item.unidadeComercial} (cada = {item.fatorConversao} {item.unidadeTributavel}).
                          <Select
                            value={item.unidadeRegistro}
                            onValueChange={(v: "comercial" | "tributavel") => {
                              const newQty = v === "tributavel" ? item.quantidade * item.fatorConversao : item.quantidade;
                              const newCost = v === "tributavel" ? item.editUnitCost / item.fatorConversao : item.editUnitCost * item.fatorConversao;
                              updateItem(idx, { unidadeRegistro: v, editQty: newQty, editUnitCost: newCost });
                            }}
                          >
                            <SelectTrigger className="h-6 w-auto text-[10px] ml-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comercial">Registrar em {item.unidadeComercial}</SelectItem>
                              <SelectItem value="tributavel">Converter para {item.unidadeTributavel}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-xs text-muted-foreground">Incluir</Label>
                      <Switch checked={item.incluirEstoque} onCheckedChange={v => updateItem(idx, { incluirEstoque: v })} />
                    </div>
                  </div>

                  {item.incluirEstoque && (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Vincular ao produto do estoque</Label>
                        <Select value={item.stockProductId} onValueChange={v => updateItem(idx, { stockProductId: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione ou crie novo…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__new__">
                              <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Criar novo produto</span>
                            </SelectItem>
                            {mockProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Categoria</Label>
                        <Select value={item.suggestedCategory} onValueChange={v => updateItem(idx, { suggestedCategory: v as StockCategory })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input type="number" value={item.editQty} onChange={e => updateItem(idx, { editQty: Number(e.target.value) })} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Custo Unit. (c/ frete)</Label>
                        <Input type="number" step="0.01" value={item.editUnitCost} onChange={e => updateItem(idx, { editUnitCost: Number(e.target.value) })} className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("review")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button onClick={handleConfirm} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Confirmar Entrada
            </Button>
          </div>
        </div>
      )}

      {/* ══ STEP 4: Done ══ */}
      {step === "done" && summary && nfeData && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Recebimento Concluído!</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <Badge className="mr-1">{summary.itens}</Badge>
                {summary.itens === 1 ? "item adicionado" : "itens adicionados"} ao estoque
              </p>
              {summary.tipo === "compra" && (
                <p>
                  <Badge variant="outline" className="mr-1">{summary.parcelas}</Badge>
                  {summary.parcelas === 1 ? "conta a pagar gerada" : "parcelas geradas"} — total de <strong className="text-foreground">{fmt(summary.valor)}</strong>
                </p>
              )}
              {summary.tipo === "devolucao" && (
                <p><Badge variant="outline" className="mr-1 text-amber-600">Crédito</Badge> de <strong className="text-foreground">{fmt(summary.valor)}</strong> gerado para o fornecedor</p>
              )}
              {summary.tipo === "transferencia" && (
                <p className="text-muted-foreground">Transferência — apenas movimentação de estoque registrada (sem transação financeira)</p>
              )}
              {summary.tipo === "remessa" && (
                <p><Badge variant="outline" className="mr-1 text-violet-600">Consignação</Badge> — entrada temporária registrada</p>
              )}
              <Separator className="my-3" />
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Fornecedor: {nfeData.fornecedorRazaoSocial} | NF-e {nfeData.numero}</p>
                {nfeData.chaveAcesso && (
                  <p className="font-mono">
                    Chave: {nfeData.chaveAcesso.slice(0, 22)}…
                    <a href={sefazUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                      Consultar SEFAZ ↗
                    </a>
                  </p>
                )}
                <p>XML original anexado à transação financeira</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => { setStep("upload"); setNfeData(null); setSummary(null); }}>
                <Plus className="h-4 w-4 mr-1" /> Importar Outra Nota
              </Button>
              <Button onClick={() => navigate("/fazenda/estoque")}>
                <Package className="h-4 w-4 mr-1" /> Ver Estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Fornecedor Dialog ── */}
      <Dialog open={showNewFornecedor} onOpenChange={setShowNewFornecedor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Fornecedor</DialogTitle>
            <DialogDescription>Dados extraídos da NF-e — campos editáveis</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Razão Social</Label>
              <Input defaultValue={nfeData?.fornecedorRazaoSocial || ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>CNPJ</Label>
                <Input defaultValue={nfeData?.fornecedorCnpj ? formatCNPJ(nfeData.fornecedorCnpj) : ""} readOnly className="bg-muted" />
              </div>
              <div className="grid gap-1.5">
                <Label>Inscrição Estadual</Label>
                <Input defaultValue={nfeData?.fornecedorIE || ""} />
              </div>
            </div>
            {nfeData?.fornecedorRegime && (
              <div className="grid gap-1.5">
                <Label>Regime Tributário</Label>
                <Input defaultValue={nfeData.fornecedorRegime} readOnly className="bg-muted" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFornecedor(false)}>Cancelar</Button>
            <Button onClick={() => {
              setFornecedorMatch(nfeData?.fornecedorRazaoSocial || "Novo Fornecedor");
              setShowNewFornecedor(false);
              toast.success("Fornecedor cadastrado com sucesso");
            }}>Salvar Fornecedor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quick Transportadora Dialog ── */}
      <Dialog open={showNewTransportadora} onOpenChange={setShowNewTransportadora}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Transportadora</DialogTitle>
            <DialogDescription>Dados extraídos da NF-e</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Nome / Razão Social</Label>
              <Input defaultValue={nfeData?.transportadoraNome || ""} />
            </div>
            <div className="grid gap-1.5">
              <Label>CNPJ</Label>
              <Input defaultValue={nfeData?.transportadoraCnpj ? formatCNPJ(nfeData.transportadoraCnpj) : ""} readOnly className="bg-muted" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTransportadora(false)}>Cancelar</Button>
            <Button onClick={() => {
              setTransportadoraMatch(nfeData?.transportadoraNome || "Nova Transportadora");
              setShowNewTransportadora(false);
              toast.success("Transportadora cadastrada com sucesso");
            }}>Salvar Transportadora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
