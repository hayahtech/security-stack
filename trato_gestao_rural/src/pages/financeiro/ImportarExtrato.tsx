import React, { useState, useMemo, useCallback } from "react";
import {
  Upload, FileSpreadsheet, FileText, CheckCircle2, XCircle,
  AlertTriangle, ChevronRight, Wand2, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { paymentInstruments, categories, mockTransactions } from "@/data/financeiro-mock";
import { toast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────
interface RawRow {
  [key: string]: string;
}

interface MappedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "receita" | "despesa";
  category_id: string;
  selected: boolean;
  isDuplicate: boolean;
}

type Step = "upload" | "mapping" | "review" | "done";

// ── Mock CSV data to simulate file parsing ────────────────
const mockRawData: RawRow[] = [
  { Data: "08/03/2026", Descricao: "TED RECEBIDA - JOAO SILVA COMPRADOR", Valor: "45000.00", Tipo: "C" },
  { Data: "07/03/2026", Descricao: "PAG BOLETO - NUTRIFARM RACOES LTDA", Valor: "-12800.00", Tipo: "D" },
  { Data: "06/03/2026", Descricao: "TED RECEBIDA - LATICINIO SAO JOSE", Valor: "8200.00", Tipo: "C" },
  { Data: "05/03/2026", Descricao: "COMPRA CARTAO - POSTO FAZENDEIRO", Valor: "-4500.00", Tipo: "D" },
  { Data: "04/03/2026", Descricao: "PIX ENVIADO - DR CARLOS VETERINARIO", Valor: "-3500.00", Tipo: "D" },
  { Data: "03/03/2026", Descricao: "PAG BOLETO - COOPERATIVA AGRO SUL", Valor: "-2100.00", Tipo: "D" },
  { Data: "02/03/2026", Descricao: "TED RECEBIDA - FAZENDA VIZINHA ALUGUEL", Valor: "3000.00", Tipo: "C" },
  { Data: "01/03/2026", Descricao: "DEB AUTOMATICO - CEMIG ENERGIA", Valor: "-1520.00", Tipo: "D" },
  { Data: "28/02/2026", Descricao: "PAG BOLETO - SEGURO TRATOR", Valor: "-3200.00", Tipo: "D" },
  { Data: "27/02/2026", Descricao: "TED RECEBIDA - FRIGORIFICO CENTRAL", Valor: "18000.00", Tipo: "C" },
  { Data: "25/02/2026", Descricao: "PIX ENVIADO - OFICINA MECANICA RURAL", Valor: "-980.00", Tipo: "D" },
  { Data: "20/02/2026", Descricao: "TRANSFERENCIA - FOLHA PAGAMENTO MAR", Valor: "-15000.00", Tipo: "D" },
];

const columnOptions = ["Data", "Descrição", "Valor", "Tipo", "Ignorar"];

// ── Category auto-detection keywords ──────────────────────
const categoryKeywords: Record<string, string[]> = {
  "cat-1": ["bezerro", "novilho", "vaca", "boi", "gado", "frigorifico", "leilao"],
  "cat-2": ["leite", "laticinio"],
  "cat-3": ["racao", "ração", "nutrifarm", "sal mineral", "feno", "silagem"],
  "cat-4": ["veterinario", "veterinário", "vacina", "medicamento", "dr carlos"],
  "cat-5": ["manutencao", "manutenção", "cerca", "trator", "oficina", "mecanica"],
  "cat-6": ["salario", "salário", "folha", "pagamento", "encargo", "diarista"],
  "cat-7": ["imposto", "funrural", "icms", "itr", "irpj"],
  "cat-8": ["combustivel", "combustível", "diesel", "posto", "energia", "cemig", "agua", "telefone"],
  "cat-9": ["aluguel", "servico", "serviço"],
};

function detectCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const [catId, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) return catId;
  }
  return "";
}

function detectDuplicate(desc: string, amount: number): boolean {
  return mockTransactions.some(
    (t) => Math.abs(t.amount - Math.abs(amount)) < 0.01 &&
      t.description.toLowerCase().includes(desc.toLowerCase().slice(0, 10))
  );
}

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── Upload Step ───────────────────────────────────────────
function UploadStep({ instrumentId, setInstrumentId, onFileLoaded }: {
  instrumentId: string; setInstrumentId: (v: string) => void;
  onFileLoaded: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false); onFileLoaded();
  }, [onFileLoaded]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Conta / Cartão do Extrato</Label>
        <Select value={instrumentId} onValueChange={setInstrumentId}>
          <SelectTrigger className="max-w-sm"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
          <SelectContent>
            {paymentInstruments.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
          ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={onFileLoaded}
      >
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-1">Arraste o arquivo ou clique para selecionar</p>
        <p className="text-sm text-muted-foreground mb-4">Formatos aceitos: CSV, PDF, Excel (.xlsx)</p>
        <div className="flex justify-center gap-3">
          {[
            { icon: FileSpreadsheet, label: "CSV", color: "text-primary" },
            { icon: FileText, label: "PDF", color: "text-destructive" },
            { icon: FileSpreadsheet, label: "XLSX", color: "text-blue-500" },
          ].map((f) => (
            <Badge key={f.label} variant="secondary" className="gap-1 py-1">
              <f.icon className={`h-3.5 w-3.5 ${f.color}`} /> {f.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mapping Step ──────────────────────────────────────────
function MappingStep({ rawData, mapping, setMapping, onNext }: {
  rawData: RawRow[]; mapping: Record<string, string>;
  setMapping: (m: Record<string, string>) => void; onNext: () => void;
}) {
  const detectedCols = Object.keys(rawData[0] || {});

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Mapeamento de Colunas</p>
          <p className="text-xs text-muted-foreground">Associe as colunas detectadas aos campos do sistema.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {detectedCols.map((col) => (
              <div key={col} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{col}</Label>
                <Select value={mapping[col] || "Ignorar"} onValueChange={(v) => setMapping({ ...mapping, [col]: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columnOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm font-semibold text-foreground">Preview do Extrato ({rawData.length} linhas)</p>
      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {detectedCols.map((c) => (
                  <TableHead key={c}>
                    <div>
                      <span className="text-xs">{c}</span>
                      <Badge variant="secondary" className="ml-1 text-[10px]">{mapping[c] || "—"}</Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rawData.slice(0, 5).map((row, i) => (
                <TableRow key={i}>
                  {detectedCols.map((c) => <TableCell key={c} className="text-sm">{row[c]}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rawData.length > 5 && (
            <p className="text-xs text-muted-foreground text-center py-2">+ {rawData.length - 5} linhas adicionais</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} className="gap-1"><ChevronRight className="h-4 w-4" /> Continuar para Revisão</Button>
      </div>
    </div>
  );
}

// ── Review Step ───────────────────────────────────────────
function ReviewStep({ transactions, setTransactions, onImport }: {
  transactions: MappedTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<MappedTransaction[]>>;
  onImport: () => void;
}) {
  const selectedCount = transactions.filter((t) => t.selected).length;
  const duplicateCount = transactions.filter((t) => t.isDuplicate).length;

  const toggleAll = (checked: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: checked })));
  };

  const toggleOne = (id: string) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const updateCategory = (id: string, catId: string) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, category_id: catId } : t));
  };

  const autoDetectAll = () => {
    setTransactions((prev) => prev.map((t) => {
      const detected = detectCategory(t.description);
      return detected ? { ...t, category_id: detected } : t;
    }));
    toast({ title: "Categorias detectadas automaticamente" });
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant="secondary" className="text-sm py-1">{selectedCount} de {transactions.length} selecionadas</Badge>
        {duplicateCount > 0 && (
          <Badge variant="destructive" className="text-sm py-1 gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> {duplicateCount} possíveis duplicatas
          </Badge>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-1" onClick={autoDetectAll}>
          <Wand2 className="h-4 w-4" /> Detectar Categorias
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedCount === transactions.length}
                    onCheckedChange={(c) => toggleAll(!!c)}
                  />
                </TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className={t.isDuplicate ? "bg-destructive/5" : ""}>
                  <TableCell>
                    <Checkbox checked={t.selected} onCheckedChange={() => toggleOne(t.id)} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{t.date}</TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium text-foreground">{t.description}</span>
                  </TableCell>
                  <TableCell>
                    <Select value={t.category_id || "none"} onValueChange={(v) => updateCategory(t.id, v === "none" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className={`text-right font-medium whitespace-nowrap ${t.type === "receita" ? "text-primary" : "text-destructive"}`}>
                    {t.type === "receita" ? "+" : "-"} {fmt(t.amount)}
                  </TableCell>
                  <TableCell>
                    {t.isDuplicate ? (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <AlertTriangle className="h-3 w-3" /> Duplicata?
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Nova</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onImport} disabled={selectedCount === 0} className="gap-1">
          <CheckCircle2 className="h-4 w-4" /> Importar {selectedCount} transações
        </Button>
      </div>
    </div>
  );
}

// ── Done Step ─────────────────────────────────────────────
function DoneStep({ imported, errors, onReset }: { imported: number; errors: number; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="rounded-full bg-primary/10 p-6">
        <CheckCircle2 className="h-16 w-16 text-primary" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground">Importação Concluída</h2>
      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">{imported}</p>
          <p className="text-sm text-muted-foreground">importadas</p>
        </div>
        {errors > 0 && (
          <div className="text-center">
            <p className="text-3xl font-bold text-destructive">{errors}</p>
            <p className="text-sm text-muted-foreground">erros</p>
          </div>
        )}
      </div>
      <Button onClick={onReset} variant="outline" className="gap-1">
        <Upload className="h-4 w-4" /> Importar outro extrato
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ImportarExtrato() {
  const [step, setStep] = useState<Step>("upload");
  const [instrumentId, setInstrumentId] = useState("pi-1");
  const [mapping, setMapping] = useState<Record<string, string>>({
    Data: "Data", Descricao: "Descrição", Valor: "Valor", Tipo: "Tipo",
  });
  const [transactions, setTransactions] = useState<MappedTransaction[]>([]);
  const [importResult, setImportResult] = useState({ imported: 0, errors: 0 });

  const handleFileLoaded = () => {
    setStep("mapping");
  };

  const handleMappingDone = () => {
    // Convert raw data to mapped transactions
    const mapped: MappedTransaction[] = mockRawData.map((row, i) => {
      const amount = parseFloat(row.Valor) || 0;
      const type: "receita" | "despesa" = amount >= 0 ? "receita" : "despesa";
      const desc = row.Descricao || "";
      return {
        id: `import-${i}`,
        date: row.Data,
        description: desc,
        amount: Math.abs(amount),
        type,
        category_id: detectCategory(desc),
        selected: true,
        isDuplicate: detectDuplicate(desc.slice(0, 15), amount),
      };
    });
    setTransactions(mapped);
    setStep("review");
  };

  const handleImport = () => {
    const selected = transactions.filter((t) => t.selected);
    const errors = Math.floor(Math.random() * 2); // simulate 0-1 errors
    setImportResult({ imported: selected.length - errors, errors });
    setStep("done");
    toast({ title: `${selected.length - errors} transações importadas com sucesso!` });
  };

  const handleReset = () => {
    setStep("upload");
    setTransactions([]);
    setImportResult({ imported: 0, errors: 0 });
  };

  const stepIndex = ["upload", "mapping", "review", "done"].indexOf(step);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Importar Extrato</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {["Upload", "Mapeamento", "Revisão", "Concluído"].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className={`h-0.5 flex-1 ${i <= stepIndex ? "bg-primary" : "bg-border"}`} />}
              <div className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap
                ${i <= stepIndex ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < stepIndex ? "bg-primary text-primary-foreground" : i === stepIndex ? "bg-primary/10 text-primary border border-primary" : "bg-muted text-muted-foreground"}`}>
                  {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        {step === "upload" && (
          <UploadStep instrumentId={instrumentId} setInstrumentId={setInstrumentId} onFileLoaded={handleFileLoaded} />
        )}
        {step === "mapping" && (
          <MappingStep rawData={mockRawData} mapping={mapping} setMapping={setMapping} onNext={handleMappingDone} />
        )}
        {step === "review" && (
          <ReviewStep transactions={transactions} setTransactions={setTransactions} onImport={handleImport} />
        )}
        {step === "done" && (
          <DoneStep imported={importResult.imported} errors={importResult.errors} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
