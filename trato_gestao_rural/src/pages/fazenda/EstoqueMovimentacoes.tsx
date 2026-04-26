import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowDownCircle, ArrowUpCircle, Package, Paperclip, Plus, Scan,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { BarcodeScanner, ScanButton } from "@/components/BarcodeScanner";
import {
  mockProducts, mockMovements, unitLabel, exitReasonLabel, categoryLabel,
  entryTypeLabel, type StockMovement, type MovementType, type ExitReason, type EntryType, type StockUnit,
} from "@/data/estoque-mock";
import { paddocks } from "@/data/rebanho-mock";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const responsibleOptions = ["João", "Carlos", "Maria", "Dr. Silva", "Pedro", "Ana"];
const supplierOptions = ["Agropecuária Boa Safra", "AgroQuímica", "Posto Rural", "Casa Agro", "VetPharm"];

export default function EstoqueMovimentacoes() {
  const navigate = useNavigate();
  const [movements] = useState<StockMovement[]>(mockMovements);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [filterType, setFilterType] = useState<string>("todos");
  const [scannerOpen, setScannerOpen] = useState<"entry" | "exit" | null>(null);

  // Entry form state
  const [entryProduct, setEntryProduct] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("compra");
  const [entryQty, setEntryQty] = useState("");
  const [entryUnit, setEntryUnit] = useState<StockUnit>("unidade");
  const [entryCost, setEntryCost] = useState("");
  const [entrySupplier, setEntrySupplier] = useState("");
  const [entryInvoice, setEntryInvoice] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryLot, setEntryLot] = useState("");
  const [entryExpiry, setEntryExpiry] = useState("");
  const [entryResponsible, setEntryResponsible] = useState("");
  const [entryObservations, setEntryObservations] = useState("");
  const [entryAttachment, setEntryAttachment] = useState<File | null>(null);

  // New product inline
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState<string>("outros");
  const [newProductUnit, setNewProductUnit] = useState<StockUnit>("unidade");
  const [newProductMinQty, setNewProductMinQty] = useState("");

  // Exit form state
  const [exitProduct, setExitProduct] = useState("");
  const [exitQty, setExitQty] = useState("");
  const [exitReason, setExitReason] = useState<ExitReason>("uso_rebanho");
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10));
  const [exitResponsible, setExitResponsible] = useState("");
  const [exitPaddock, setExitPaddock] = useState("");

  // Calculated total cost
  const totalCost = useMemo(() => {
    const q = parseFloat(entryQty) || 0;
    const c = parseFloat(entryCost) || 0;
    return q * c;
  }, [entryQty, entryCost]);

  // Auto-set unit from selected product
  const selectedProduct = useMemo(() => {
    return mockProducts.find(p => p.id === entryProduct);
  }, [entryProduct]);

  React.useEffect(() => {
    if (selectedProduct) setEntryUnit(selectedProduct.unit);
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    if (filterType === "todos") return movements;
    return movements.filter((m) => m.type === filterType);
  }, [movements, filterType]);

  function handleEntry() {
    if (!entryProduct || !entryQty) { toast.error("Produto e quantidade são obrigatórios"); return; }
    if (entryType === "compra" && !entryCost) { toast.error("Custo unitário é obrigatório para compras"); return; }
    if (entryType === "compra" && !entrySupplier) { toast.error("Fornecedor é obrigatório para compras"); return; }
    toast.success("Entrada registrada com sucesso");
    setShowEntryForm(false);
    resetEntryForm();
  }

  function handleExit() {
    if (!exitProduct || !exitQty) { toast.error("Produto e quantidade são obrigatórios"); return; }
    toast.success("Saída registrada com sucesso");
    setShowExitForm(false);
    resetExitForm();
  }

  function handleCreateNewProduct() {
    if (!newProductName.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    toast.success(`Produto "${newProductName}" criado com sucesso`);
    setShowNewProduct(false);
    setNewProductName("");
    setNewProductCategory("outros");
    setNewProductUnit("unidade");
    setNewProductMinQty("");
  }

  function resetEntryForm() {
    setEntryProduct(""); setEntryType("compra"); setEntryQty(""); setEntryUnit("unidade");
    setEntryCost(""); setEntrySupplier(""); setEntryInvoice(""); setEntryLot("");
    setEntryExpiry(""); setEntryResponsible(""); setEntryObservations(""); setEntryAttachment(null);
  }
  function resetExitForm() { setExitProduct(""); setExitQty(""); setExitReason("uso_rebanho"); setExitResponsible(""); setExitPaddock(""); }

  function handleProductScan(code: string, target: "entry" | "exit") {
    const product = mockProducts.find(p => (p as any).barcode === code || p.name === code || p.id === code);
    if (product) {
      if (target === "entry") setEntryProduct(product.id);
      else setExitProduct(product.id);
      toast.success(`Produto encontrado: ${product.name}`);
    } else {
      toast.info(`Código "${code}" não encontrado. Deseja cadastrar?`);
      setShowNewProduct(true);
    }
    setScannerOpen(null);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/fazenda/estoque")} className="self-start gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Estoque
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Movimentações de Estoque
            </h1>
            <p className="text-sm text-muted-foreground">{movements.length} movimentações registradas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowEntryForm(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <ArrowDownCircle className="h-4 w-4" /> Entrada
            </Button>
            <Button onClick={() => setShowExitForm(true)} variant="destructive" className="gap-2">
              <ArrowUpCircle className="h-4 w-4" /> Saída
            </Button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Movement History */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Motivo / Fornecedor</TableHead>
                <TableHead className="text-right">Saldo Após</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Nenhuma movimentação</TableCell></TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-center">
                      {m.type === "entrada" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 text-xs gap-1">
                          <ArrowDownCircle className="h-3 w-3" /> {m.entryType ? entryTypeLabel[m.entryType] : "Entrada"}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300 text-xs gap-1">
                          <ArrowUpCircle className="h-3 w-3" /> Saída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{m.productName}</TableCell>
                    <TableCell className={`text-right font-mono font-bold ${m.type === "entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {m.type === "entrada" ? "+" : "−"}{m.qty}
                    </TableCell>
                    <TableCell>{m.responsibleName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {m.type === "entrada"
                        ? (m.supplierName || "—") + (m.invoiceNumber ? ` • ${m.invoiceNumber}` : "") + (m.totalCost ? ` • ${fmt(m.totalCost)}` : "")
                        : (m.reason ? exitReasonLabel[m.reason] : "—") + (m.linkedPaddock ? ` • ${m.linkedPaddock}` : "")
                      }
                    </TableCell>
                    <TableCell className="text-right font-mono">{m.balanceAfter}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Enhanced Entry Form ── */}
      <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowDownCircle className="h-5 w-5 text-emerald-500" /> Entrada de Estoque</DialogTitle>
            <DialogDescription>Registre a entrada de produtos no estoque</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-2">
              {/* Product + create new */}
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label>Produto *</Label>
                  <div className="flex items-center gap-2">
                    <ScanButton onClick={() => setScannerOpen("entry")} />
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setShowNewProduct(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Criar novo produto
                    </Button>
                  </div>
                </div>
                <Select value={entryProduct} onValueChange={setEntryProduct}>
                  <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Entry type */}
              <div className="grid gap-1.5">
                <Label>Tipo de Entrada *</Label>
                <Select value={entryType} onValueChange={(v) => setEntryType(v as EntryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(entryTypeLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qty + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Quantidade *</Label>
                  <Input type="number" min={0} value={entryQty} onChange={(e) => setEntryQty(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Unidade</Label>
                  <Select value={entryUnit} onValueChange={(v) => setEntryUnit(v as StockUnit)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(unitLabel).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cost (required for compra) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Custo Unitário {entryType === "compra" ? "*" : ""}</Label>
                  <Input type="number" min={0} step={0.01} value={entryCost} onChange={(e) => setEntryCost(e.target.value)} placeholder="R$" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Custo Total</Label>
                  <Input value={totalCost > 0 ? fmt(totalCost) : "—"} readOnly className="bg-muted" />
                </div>
              </div>

              {/* Date */}
              <div className="grid gap-1.5">
                <Label>Data da Entrada</Label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>

              {/* Supplier (required for compra) */}
              {(entryType === "compra" || entryType === "devolucao") && (
                <div className="grid gap-1.5">
                  <Label>Fornecedor {entryType === "compra" ? "*" : ""}</Label>
                  <Select value={entrySupplier} onValueChange={setEntrySupplier}>
                    <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                    <SelectContent>
                      {supplierOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Invoice */}
              <div className="grid gap-1.5">
                <Label>Número da NF-e / Nota Fiscal</Label>
                <Input value={entryInvoice} onChange={(e) => setEntryInvoice(e.target.value)} placeholder="NF-XXXX (opcional)" />
              </div>

              {/* Lot + Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Lote</Label>
                  <Input value={entryLot} onChange={(e) => setEntryLot(e.target.value)} placeholder="Ex: LOTE-2026-A1" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Validade</Label>
                  <Input type="date" value={entryExpiry} onChange={(e) => setEntryExpiry(e.target.value)} />
                </div>
              </div>

              {/* Responsible */}
              <div className="grid gap-1.5">
                <Label>Responsável pelo Recebimento</Label>
                <Select value={entryResponsible} onValueChange={setEntryResponsible}>
                  <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                  <SelectContent>
                    {responsibleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Observations */}
              <div className="grid gap-1.5">
                <Label>Observações</Label>
                <Textarea value={entryObservations} onChange={(e) => setEntryObservations(e.target.value)} placeholder="Informações adicionais..." rows={2} />
              </div>

              {/* Attachment */}
              <div className="grid gap-1.5">
                <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Anexo (foto da nota ou etiqueta)</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setEntryAttachment(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {entryAttachment && (
                  <p className="text-xs text-muted-foreground">📎 {entryAttachment.name}</p>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryForm(false)}>Cancelar</Button>
            <Button onClick={handleEntry} className="bg-emerald-600 hover:bg-emerald-700 text-white">Registrar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create New Product Inline ── */}
      <Dialog open={showNewProduct} onOpenChange={setShowNewProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Novo Produto</DialogTitle>
            <DialogDescription>Cadastre um novo produto no estoque</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome do Produto *</Label>
              <Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Ex: Vacina Raiva" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Categoria</Label>
                <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Unidade</Label>
                <Select value={newProductUnit} onValueChange={(v) => setNewProductUnit(v as StockUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(unitLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Estoque Mínimo</Label>
              <Input type="number" min={0} value={newProductMinQty} onChange={(e) => setNewProductMinQty(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProduct(false)}>Cancelar</Button>
            <Button onClick={handleCreateNewProduct}>Criar Produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Exit Form ── */}
      <Dialog open={showExitForm} onOpenChange={setShowExitForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowUpCircle className="h-5 w-5 text-red-500" /> Saída de Estoque</DialogTitle>
            <DialogDescription>Registre a saída ou uso de produtos</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Produto *</Label>
                <ScanButton onClick={() => setScannerOpen("exit")} />
              </div>
              <Select value={exitProduct} onValueChange={setExitProduct}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>{mockProducts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.currentQty} {unitLabel[p.unit]})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Quantidade *</Label>
                <Input type="number" min={0} value={exitQty} onChange={(e) => setExitQty(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Motivo</Label>
                <Select value={exitReason} onValueChange={(v) => setExitReason(v as ExitReason)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(exitReasonLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {exitReason === "uso_rebanho" && (
              <div className="grid gap-1.5">
                <Label>Pasto / Lote vinculado</Label>
                <Select value={exitPaddock} onValueChange={setExitPaddock}>
                  <SelectTrigger><SelectValue placeholder="Selecione o pasto" /></SelectTrigger>
                  <SelectContent>{paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Data</Label>
                <Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Responsável</Label>
                <Select value={exitResponsible} onValueChange={setExitResponsible}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {responsibleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitForm(false)}>Cancelar</Button>
            <Button onClick={handleExit} variant="destructive">Registrar Saída</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Scanner Modal */}
      <BarcodeScanner
        open={scannerOpen !== null}
        onOpenChange={(v) => { if (!v) setScannerOpen(null); }}
        onScan={(code) => handleProductScan(code, scannerOpen || "entry")}
        title="Escanear Produto"
        description="Aponte para o código de barras do produto"
      />
    </div>
  );
}
