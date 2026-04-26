import { useState, useCallback, useRef } from "react";
import { Upload, FileText, FileSpreadsheet, File, X, CheckCircle2, AlertCircle, CreditCard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type FileStatus = "idle" | "parsing" | "done" | "error";

interface ImportFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  rows?: number;
  error?: string;
}

const ACCEPTED = ".pdf,.csv,.xlsx,.xls,.ofx,.qif";
const ACCEPTED_TYPES = ["application/pdf", "text/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/x-ofx", "application/qif"];

function fileIcon(name: string) {
  if (name.endsWith(".pdf")) return <FileText className="h-5 w-5 text-red-400" />;
  if (name.match(/\.(xlsx|xls)$/)) return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
  if (name.endsWith(".csv")) return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
  return <File className="h-5 w-5 text-blue-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function simulateParse(id: string, setFiles: React.Dispatch<React.SetStateAction<ImportFile[]>>) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 25 + 5;
    if (progress >= 100) {
      clearInterval(interval);
      setFiles(prev => prev.map(f =>
        f.id === id
          ? { ...f, status: "done", progress: 100, rows: Math.floor(Math.random() * 80) + 20 }
          : f
      ));
    } else {
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress: Math.min(progress, 95) } : f
      ));
    }
  }, 150);
}

const banks = [
  { name: "Nubank", color: "bg-purple-500", letter: "N" },
  { name: "Itaú", color: "bg-orange-500", letter: "I" },
  { name: "Bradesco", color: "bg-red-500", letter: "B" },
  { name: "Santander", color: "bg-red-700", letter: "S" },
  { name: "Caixa", color: "bg-blue-700", letter: "C" },
  { name: "BB", color: "bg-yellow-500", letter: "B" },
  { name: "Inter", color: "bg-orange-400", letter: "I" },
  { name: "C6", color: "bg-zinc-800", letter: "C" },
];

export default function ImportarExtrato() {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [docType, setDocType] = useState<"extrato" | "fatura">("extrato");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: ImportFile[] = Array.from(incoming)
      .filter(f => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        return ["pdf", "csv", "xlsx", "xls", "ofx", "qif"].includes(ext);
      })
      .map(f => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        status: "parsing" as FileStatus,
        progress: 0,
      }));

    if (!newFiles.length) return;
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => simulateParse(f.id, setFiles));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const remove = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const doneCount = files.filter(f => f.status === "done").length;
  const totalRows = files.filter(f => f.status === "done").reduce((s, f) => s + (f.rows ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Importar Extrato</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importe extratos bancários e faturas de cartão para análise automática de gastos.
        </p>
      </div>

      {/* Tipo do documento */}
      <div className="neon-card rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de documento</p>
        <div className="flex gap-3">
          {(["extrato", "fatura"] as const).map(t => (
            <button
              key={t}
              onClick={() => setDocType(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                docType === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t === "extrato" ? <Building2 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              {t === "extrato" ? "Extrato Bancário" : "Fatura Cartão"}
            </button>
          ))}
        </div>

        {/* Banco */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Banco / Instituição</p>
          <div className="flex flex-wrap gap-2">
            {banks.map(b => (
              <button
                key={b.name}
                onClick={() => setSelectedBank(prev => prev === b.name ? null : b.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedBank === b.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${b.color} text-white text-[8px] flex items-center justify-center font-bold`}>
                  {b.letter}
                </span>
                {b.name}
              </button>
            ))}
            <button
              onClick={() => setSelectedBank("outro")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedBank === "outro"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              Outro
            </button>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`drop-zone${dragging ? " active" : ""} rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
          dragging ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary"
        }`}>
          <Upload className="h-7 w-7" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">
            {dragging ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF, CSV, XLSX, OFX, QIF • Máx. 20 MB por arquivo</p>
        </div>
        <div className="flex gap-2 mt-1">
          {["PDF", "CSV", "XLSX", "OFX"].map(ext => (
            <Badge key={ext} variant="secondary" className="text-[10px] font-mono">{ext}</Badge>
          ))}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="neon-card rounded-xl p-4 flex items-center gap-3">
              <div className="shrink-0">{fileIcon(f.file.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.file.size)}</span>
                </div>
                {f.status === "parsing" && (
                  <Progress value={f.progress} className="h-1.5" />
                )}
                {f.status === "done" && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {f.rows} transações identificadas
                  </p>
                )}
                {f.status === "error" && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {f.error ?? "Erro ao processar"}
                  </p>
                )}
              </div>
              <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary + CTA */}
      {doneCount > 0 && (
        <div className="neon-card-emerald rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-foreground">
              {doneCount} arquivo{doneCount > 1 ? "s" : ""} processado{doneCount > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {totalRows} transações prontas para categorização
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Revisar</Button>
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
              Importar e Categorizar
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: "PDF", desc: "Extratos e faturas em PDF são lidos com OCR automático.", icon: FileText, color: "text-red-400" },
          { title: "CSV / Excel", desc: "Formatos tabulares — basta selecionar a coluna de valor e data.", icon: FileSpreadsheet, color: "text-emerald-400" },
          { title: "OFX / QIF", desc: "Formato nativo dos bancos — importação 100% fiel, sem ajustes.", icon: File, color: "text-blue-400" },
        ].map(item => (
          <div key={item.title} className="neon-card rounded-xl p-4 space-y-1.5">
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
