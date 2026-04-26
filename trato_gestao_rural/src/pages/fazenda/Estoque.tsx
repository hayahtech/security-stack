import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Search, Plus, Filter, BarChart3, FileText, ClipboardCheck, Upload, Download,
  AlertTriangle, CheckCircle2, XCircle, ArrowRight, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  mockProducts, categoryLabel, categoryColor, unitLabel, getProductStatus, getStatusBadge,
  getCategorySummary, adjustmentReasonLabel, generateImportTemplate,
  type StockCategory, type StockProduct, type AdjustmentReason,
} from "@/data/estoque-mock";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const responsibleOptions = ["João", "Carlos", "Maria", "Dr. Silva", "Pedro", "Ana"];

// Expected columns for import mapping
const EXPECTED_COLUMNS = [
  { key: "produto_nome", label: "Nome do Produto", required: true },
  { key: "categoria", label: "Categoria", required: false },
  { key: "quantidade", label: "Quantidade", required: true },
  { key: "unidade", label: "Unidade", required: false },
  { key: "custo_unitario", label: "Custo Unitário", required: false },
  { key: "data_entrada", label: "Data de Entrada", required: false },
  { key: "fornecedor", label: "Fornecedor", required: false },
  { key: "nota_fiscal", label: "Nota Fiscal", required: false },
  { key: "lote", label: "Lote", required: false },
  { key: "validade", label: "Validade", required: false },
];

interface ImportRowValidation {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
  productExists: boolean;
  autoCreate: boolean;
}

function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const synonyms: Record<string, string[]> = {
    produto_nome: ["produto_nome", "produto", "nome", "name", "item", "descricao", "descrição"],
    categoria: ["categoria", "category", "tipo", "type", "grupo"],
    quantidade: ["quantidade", "qty", "qtd", "quant", "quantity", "estoque"],
    unidade: ["unidade", "unit", "un", "medida"],
    custo_unitario: ["custo_unitario", "custo", "preco", "preço", "valor", "cost", "price"],
    data_entrada: ["data_entrada", "data", "date", "dt_entrada"],
    fornecedor: ["fornecedor", "supplier", "vendor", "parceiro"],
    nota_fiscal: ["nota_fiscal", "nf", "nota", "invoice", "nfe"],
    lote: ["lote", "batch", "lot"],
    validade: ["validade", "expiry", "vencimento", "data_validade"],
  };
  const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  for (const [key, syns] of Object.entries(synonyms)) {
    const idx = lowerHeaders.findIndex(h => syns.some(s => h.includes(s)));
    if (idx >= 0) mapping[key] = headers[idx];
  }
  return mapping;
}

function validateRow(row: Record<string, string>, rowIndex: number): ImportRowValidation {
  const errors: string[] = [];
  const name = row["produto_nome"]?.trim();
  if (!name) errors.push("Nome do produto vazio");
  const qty = parseFloat(row["quantidade"]);
  if (!row["quantidade"] || isNaN(qty) || qty < 0) errors.push("Quantidade inválida");
  if (row["data_entrada"]) {
    const d = new Date(row["data_entrada"]);
    if (isNaN(d.getTime())) errors.push("Data inválida");
  }
  if (row["custo_unitario"]) {
    const c = parseFloat(row["custo_unitario"]);
    if (isNaN(c) || c < 0) errors.push("Custo unitário inválido");
  }
  const productExists = name ? mockProducts.some(p => p.name.toLowerCase() === name.toLowerCase()) : false;
  if (name && !productExists) errors.push("Produto não cadastrado");
  return { rowIndex, data: row, errors, isValid: errors.length === 0 || (errors.length === 1 && !productExists && !!name), productExists, autoCreate: false };
}

export default function Estoque() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("todas");

  // Adjustment dialog
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjProduct, setAdjProduct] = useState("");
  const [adjPhysicalQty, setAdjPhysicalQty] = useState("");
  const [adjReason, setAdjReason] = useState<AdjustmentReason>("contagem_fisica");
  const [adjResponsible, setAdjResponsible] = useState("");
  const [adjObservations, setAdjObservations] = useState("");

  // Import dialog
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [importMapping, setImportMapping] = useState<Record<string, string>>({});
  const [importValidation, setImportValidation] = useState<ImportRowValidation[]>([]);
  const [importAutoCreate, setImportAutoCreate] = useState<Set<number>>(new Set());
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; created: number } | null>(null);

  const filtered = useMemo(() => mockProducts.filter((p) => {
    if (filterCat !== "todas" && p.category !== filterCat) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase());
    return true;
  }), [search, filterCat]);

  const summary = useMemo(() => getCategorySummary(), []);
  const lowCount = mockProducts.filter((p) => getProductStatus(p) !== "ok").length;

  // Adjustment calculated diff
  const adjSelectedProduct = useMemo(() => mockProducts.find(p => p.id === adjProduct), [adjProduct]);
  const adjDiff = useMemo(() => {
    if (!adjSelectedProduct || !adjPhysicalQty) return null;
    return parseFloat(adjPhysicalQty) - adjSelectedProduct.currentQty;
  }, [adjSelectedProduct, adjPhysicalQty]);

  function handleAdjustment() {
    if (!adjProduct) { toast.error("Selecione um produto"); return; }
    if (!adjPhysicalQty) { toast.error("Informe a quantidade física contada"); return; }
    if (!adjResponsible) { toast.error("Selecione o responsável pelo ajuste"); return; }
    toast.success("Ajuste de inventário registrado com sucesso");
    setShowAdjustment(false);
    setAdjProduct(""); setAdjPhysicalQty(""); setAdjReason("contagem_fisica");
    setAdjResponsible(""); setAdjObservations("");
  }

  function handleDownloadTemplate() {
    const csv = generateImportTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao_estoque.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Modelo de planilha baixado");
  }

  function handleFileUpload(file: File) {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const parsed = lines.map(l => l.split(",").map(c => c.trim()));
      setImportPreview(parsed);
      // Auto-detect mapping
      if (parsed.length > 0) {
        const detected = autoDetectMapping(parsed[0]);
        setImportMapping(detected);
      }
      setImportStep(2);
    };
    reader.readAsText(file);
  }

  function handleMappingConfirm() {
    // Validate required mappings
    const missing = EXPECTED_COLUMNS.filter(c => c.required && !importMapping[c.key]);
    if (missing.length > 0) {
      toast.error(`Mapeie as colunas obrigatórias: ${missing.map(m => m.label).join(", ")}`);
      return;
    }
    // Run validation on all data rows
    const headers = importPreview[0] || [];
    const validated = importPreview.slice(1).map((row, ri) => {
      const mapped: Record<string, string> = {};
      for (const col of EXPECTED_COLUMNS) {
        const sourceCol = importMapping[col.key];
        if (sourceCol) {
          const colIdx = headers.indexOf(sourceCol);
          mapped[col.key] = colIdx >= 0 ? (row[colIdx] || "") : "";
        } else {
          mapped[col.key] = "";
        }
      }
      return validateRow(mapped, ri);
    });
    setImportValidation(validated);
    setImportAutoCreate(new Set());
    setImportStep(3);
  }

  const validRows = useMemo(() => importValidation.filter(r => {
    if (r.isValid) return true;
    // If only error is "not registered" and auto-create is on
    if (!r.productExists && r.errors.length === 1 && r.errors[0] === "Produto não cadastrado" && importAutoCreate.has(r.rowIndex)) return true;
    return false;
  }), [importValidation, importAutoCreate]);

  const errorRows = useMemo(() => importValidation.filter(r => !validRows.includes(r)), [importValidation, validRows]);

  function toggleAutoCreate(rowIndex: number) {
    setImportAutoCreate(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex); else next.add(rowIndex);
      return next;
    });
  }

  function handleImportConfirm() {
    if (validRows.length === 0) { toast.error("Nenhuma linha válida para importar"); return; }
    const created = validRows.filter(r => importAutoCreate.has(r.rowIndex)).length;
    setImportResult({ imported: validRows.length, skipped: errorRows.length, created });
    setImportStep(4);
  }

  function resetImport() {
    setImportFile(null); setImportPreview([]); setImportMapping({});
    setImportValidation([]); setImportAutoCreate(new Set());
    setImportStep(1); setImportResult(null);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Estoque
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockProducts.length} produtos • {lowCount > 0 && <span className="text-amber-600 dark:text-amber-400">{lowCount} abaixo do mínimo</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowAdjustment(true)} className="gap-2">
            <ClipboardCheck className="h-4 w-4" /> Ajuste de Inventário
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
            <Upload className="h-4 w-4" /> Importar Planilha
          </Button>
          <Button variant="outline" onClick={() => navigate("/fazenda/estoque/receber-xml")} className="gap-2">
            <FileText className="h-4 w-4" /> Receber por XML
          </Button>
          <Button variant="outline" onClick={() => navigate("/fazenda/estoque/movimentacoes")} className="gap-2">
            <BarChart3 className="h-4 w-4" /> Movimentações
          </Button>
        </div>
      </div>

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summary.map((s) => (
          <Card
            key={s.category}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterCat(s.category)}
          >
            <CardContent className="p-3">
              <Badge className={`text-[10px] border mb-2 ${s.color}`}>{s.label}</Badge>
              <p className="text-lg font-bold text-foreground">{s.totalQty.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{fmt(s.totalValue)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Categorias</SelectItem>
            {(Object.keys(categoryLabel) as StockCategory[]).map((k) => (
              <SelectItem key={k} value={k}>{categoryLabel[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Est. Mínimo</TableHead>
                <TableHead className="text-right">Custo Médio</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum produto encontrado</TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const status = getProductStatus(p);
                  const badge = getStatusBadge(status);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.supplierName && <p className="text-xs text-muted-foreground">{p.supplierName}</p>}
                          {p.lot && <p className="text-xs text-muted-foreground">Lote: {p.lot}{p.expiryDate ? ` • Val: ${new Date(p.expiryDate + "T12:00").toLocaleDateString("pt-BR")}` : ""}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] border ${categoryColor[p.category]}`}>{categoryLabel[p.category]}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${status === "zerado" ? "text-red-600 dark:text-red-400" : status === "baixo" ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                        {p.currentQty.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{unitLabel[p.unit]}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{p.minQty}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.avgCost)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.currentQty * p.avgCost)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-xs border ${badge.className}`}>{badge.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Inventory Adjustment Dialog ── */}
      <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> Ajuste de Inventário</DialogTitle>
            <DialogDescription>Compare a quantidade do sistema com a contagem física</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Produto *</Label>
              <Select value={adjProduct} onValueChange={setAdjProduct}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {mockProducts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {adjSelectedProduct && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">No Sistema</p>
                      <p className="text-lg font-bold text-foreground">{adjSelectedProduct.currentQty}</p>
                      <p className="text-xs text-muted-foreground">{unitLabel[adjSelectedProduct.unit]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contagem Física</p>
                      <Input
                        type="number"
                        min={0}
                        value={adjPhysicalQty}
                        onChange={(e) => setAdjPhysicalQty(e.target.value)}
                        className="text-center text-lg font-bold h-10 mt-0.5"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Diferença</p>
                      <p className={`text-lg font-bold ${adjDiff === null ? "text-muted-foreground" : adjDiff === 0 ? "text-emerald-600 dark:text-emerald-400" : adjDiff > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                        {adjDiff === null ? "—" : adjDiff > 0 ? `+${adjDiff}` : adjDiff}
                      </p>
                      {adjDiff !== null && adjDiff !== 0 && (
                        <p className="text-xs text-muted-foreground">{adjDiff > 0 ? "Sobra" : "Falta"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-1.5">
              <Label>Motivo do Ajuste *</Label>
              <Select value={adjReason} onValueChange={(v) => setAdjReason(v as AdjustmentReason)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(adjustmentReasonLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Responsável pelo Ajuste *</Label>
              <Select value={adjResponsible} onValueChange={setAdjResponsible}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {responsibleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <Textarea value={adjObservations} onChange={(e) => setAdjObservations(e.target.value)} placeholder="Detalhes do ajuste..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustment(false)}>Cancelar</Button>
            <Button onClick={handleAdjustment} disabled={!adjProduct || !adjPhysicalQty || !adjResponsible}>
              Registrar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Dialog (4 steps) ── */}
      <Dialog open={showImport} onOpenChange={(open) => { setShowImport(open); if (!open) resetImport(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Importar Planilha de Estoque</DialogTitle>
            <DialogDescription>
              {importStep === 1 && "Etapa 1/4 — Faça upload de um arquivo .csv"}
              {importStep === 2 && "Etapa 2/4 — Mapeie as colunas do arquivo"}
              {importStep === 3 && "Etapa 3/4 — Valide os dados antes de importar"}
              {importStep === 4 && "Etapa 4/4 — Resultado da importação"}
            </DialogDescription>
          </DialogHeader>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 px-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`h-2 flex-1 rounded-full ${s <= importStep ? "bg-primary" : "bg-muted"}`} />
              </div>
            ))}
          </div>

          {/* STEP 1: Upload */}
          {importStep === 1 && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                  <Download className="h-4 w-4" /> Baixar modelo de planilha
                </Button>
                <p className="text-xs text-muted-foreground">Preencha o modelo com seus dados e faça upload abaixo</p>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Arraste o arquivo ou clique para selecionar</p>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  className="max-w-xs mx-auto cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-2">Formatos aceitos: .csv, .xlsx</p>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {importStep === 2 && importPreview.length > 0 && (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid gap-4 py-2 pr-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">📎 {importFile?.name}</Badge>
                    <Badge variant="outline">{importPreview.length - 1} linha(s)</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { resetImport(); }}>Trocar arquivo</Button>
                </div>

                {/* Mapping selectors */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-foreground mb-3">Mapeamento de Colunas</p>
                    <p className="text-xs text-muted-foreground mb-4">Colunas detectadas automaticamente. Ajuste se necessário.</p>
                    <div className="grid gap-3">
                      {EXPECTED_COLUMNS.map(col => (
                        <div key={col.key} className="grid grid-cols-2 gap-3 items-center">
                          <Label className="text-xs flex items-center gap-1">
                            {col.label} {col.required && <span className="text-red-500">*</span>}
                          </Label>
                          <Select
                            value={importMapping[col.key] || "__none__"}
                            onValueChange={(v) => setImportMapping(prev => ({ ...prev, [col.key]: v === "__none__" ? "" : v }))}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="— Não mapeada —" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— Não mapeada —</SelectItem>
                              {importPreview[0].map((h, i) => (
                                <SelectItem key={i} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Preview first 5 rows */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Preview (primeiras 5 linhas)</p>
                  <ScrollArea className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {importPreview[0]?.map((h, i) => (
                            <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.slice(1, 6).map((row, ri) => (
                          <TableRow key={ri}>
                            {row.map((cell, ci) => (
                              <TableCell key={ci} className="text-xs whitespace-nowrap">{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* STEP 3: Validation */}
          {importStep === 3 && (
            <ScrollArea className="max-h-[60vh]">
              <div className="grid gap-4 py-2 pr-4">
                {/* Summary badges */}
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {validRows.length} válida(s)
                  </Badge>
                  {errorRows.length > 0 && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300 gap-1">
                      <XCircle className="h-3 w-3" /> {errorRows.length} com erro(s)
                    </Badge>
                  )}
                </div>

                {/* Validation table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8 text-center">#</TableHead>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs text-right">Qtd</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importValidation.map((row) => {
                        const onlyMissing = !row.productExists && row.errors.length === 1 && row.errors[0] === "Produto não cadastrado";
                        const isOk = row.isValid || (onlyMissing && importAutoCreate.has(row.rowIndex));
                        const hasHardError = row.errors.length > 0 && !onlyMissing;
                        return (
                          <TableRow key={row.rowIndex} className={isOk ? "bg-emerald-500/5" : "bg-red-500/5"}>
                            <TableCell className="text-center text-xs font-mono">{row.rowIndex + 1}</TableCell>
                            <TableCell className="text-xs font-medium">{row.data.produto_nome || "—"}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{row.data.quantidade || "—"}</TableCell>
                            <TableCell>
                              {isOk ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> OK
                                  {importAutoCreate.has(row.rowIndex) && " (criar produto)"}
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> {row.errors.join("; ")}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {onlyMissing && !hasHardError && (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={importAutoCreate.has(row.rowIndex)}
                                    onCheckedChange={() => toggleAutoCreate(row.rowIndex)}
                                    id={`ac-${row.rowIndex}`}
                                  />
                                  <label htmlFor={`ac-${row.rowIndex}`} className="text-xs cursor-pointer">Criar produto</label>
                                </div>
                              )}
                              {hasHardError && <span className="text-xs text-muted-foreground">Será ignorada</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Bulk auto-create for unregistered */}
                {importValidation.some(r => !r.productExists && r.errors.length === 1 && r.errors[0] === "Produto não cadastrado") && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSet = new Set(importAutoCreate);
                        importValidation.forEach(r => {
                          if (!r.productExists && r.errors.length === 1 && r.errors[0] === "Produto não cadastrado") newSet.add(r.rowIndex);
                        });
                        setImportAutoCreate(newSet);
                      }}
                      className="text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" /> Criar todos automaticamente
                    </Button>
                    <p className="text-xs text-muted-foreground">Marca todos os produtos não cadastrados para criação automática</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* STEP 4: Result */}
          {importStep === 4 && importResult && (
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
              <h3 className="text-lg font-bold text-foreground">Importação Concluída!</h3>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">Importados</p>
                </div>
                {importResult.created > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.created}</p>
                    <p className="text-xs text-muted-foreground">Produtos criados</p>
                  </div>
                )}
                {importResult.skipped > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.skipped}</p>
                    <p className="text-xs text-muted-foreground">Ignorados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {importStep === 1 && (
              <Button variant="outline" onClick={() => setShowImport(false)}>Cancelar</Button>
            )}
            {importStep === 2 && (
              <>
                <Button variant="outline" onClick={resetImport}>Voltar</Button>
                <Button onClick={handleMappingConfirm} className="gap-2">
                  Validar Dados <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
            {importStep === 3 && (
              <>
                <Button variant="outline" onClick={() => setImportStep(2)}>Voltar ao Mapeamento</Button>
                <Button onClick={handleImportConfirm} disabled={validRows.length === 0} className="gap-2">
                  <Upload className="h-4 w-4" /> Importar {validRows.length} linha(s) válida(s)
                </Button>
              </>
            )}
            {importStep === 4 && (
              <Button onClick={() => { setShowImport(false); resetImport(); toast.success("Estoque atualizado"); }}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
