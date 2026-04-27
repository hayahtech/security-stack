import { useState } from "react";
import {
  Plus, Upload, Eye, EyeOff, RefreshCw, MoreHorizontal, Pencil, Trash2,
  ArrowUpRight, ArrowDownLeft, Building2, Wallet, TrendingUp, CreditCard,
  FileUp, CheckCircle2, AlertCircle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

type TipoConta = "corrente" | "poupanca" | "investimento" | "cartao";

interface Conta {
  id: string;
  banco: string;
  nome: string;
  tipo: TipoConta;
  saldo: number;
  cor: string;       // bg color classe tailwind
  letra: string;
  ultimaSync: string;
  ativa: boolean;
}

const mockContas: Conta[] = [
  { id: "1", banco: "Nubank",   nome: "Conta corrente",   tipo: "corrente",    saldo: 4_320.50, cor: "bg-purple-600",  letra: "N", ultimaSync: "agora",    ativa: true  },
  { id: "2", banco: "Itaú",     nome: "Conta corrente",   tipo: "corrente",    saldo: 1_870.00, cor: "bg-orange-500",  letra: "I", ultimaSync: "2h atrás", ativa: true  },
  { id: "3", banco: "Itaú",     nome: "Poupança",         tipo: "poupanca",    saldo: 8_500.00, cor: "bg-orange-500",  letra: "I", ultimaSync: "2h atrás", ativa: true  },
  { id: "4", banco: "Inter",    nome: "Conta digital",    tipo: "corrente",    saldo:   940.20, cor: "bg-orange-400",  letra: "I", ultimaSync: "1h atrás", ativa: true  },
  { id: "5", banco: "Inter",    nome: "Conta investimento",tipo:"investimento", saldo: 12_150.00,cor: "bg-orange-400",  letra: "I", ultimaSync: "1h atrás", ativa: true  },
  { id: "6", banco: "XP",       nome: "Carteira",         tipo: "investimento",saldo: 34_800.00,cor: "bg-zinc-700",    letra: "X", ultimaSync: "ontem",    ativa: true  },
  { id: "7", banco: "Bradesco", nome: "Poupança",         tipo: "poupanca",    saldo: 2_200.00, cor: "bg-red-600",     letra: "B", ultimaSync: "3d atrás", ativa: false },
  { id: "8", banco: "Nubank",   nome: "Cartão de crédito",tipo: "cartao",      saldo: 2_150.00, cor: "bg-purple-600",  letra: "N", ultimaSync: "agora",    ativa: true  },
];

const tipoLabel: Record<TipoConta, string> = {
  corrente:    "Corrente",
  poupanca:    "Poupança",
  investimento:"Investimentos",
  cartao:      "Cartão",
};

const tipoIcon: Record<TipoConta, React.ElementType> = {
  corrente:    Wallet,
  poupanca:    Building2,
  investimento:TrendingUp,
  cartao:      CreditCard,
};

const neonByTipo: Record<TipoConta, string> = {
  corrente:    "neon-card",
  poupanca:    "neon-card-emerald",
  investimento:"neon-card-amber",
  cartao:      "neon-card-violet",
};

function fmtVal(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

const BANCOS_LISTA = ["Nubank","Itaú","Bradesco","Santander","Caixa","BB","Inter","C6","XP","BTG","Outro"];
const COR_LETRA: Record<string, { cor: string; letra: string }> = {
  Nubank: { cor: "bg-purple-600", letra: "N" }, Itaú: { cor: "bg-orange-500", letra: "I" },
  Bradesco: { cor: "bg-red-600", letra: "B" }, Santander: { cor: "bg-red-700", letra: "S" },
  Caixa: { cor: "bg-blue-700", letra: "C" }, BB: { cor: "bg-yellow-500", letra: "B" },
  Inter: { cor: "bg-orange-400", letra: "I" }, C6: { cor: "bg-zinc-800", letra: "C" },
  XP: { cor: "bg-zinc-700", letra: "X" }, BTG: { cor: "bg-blue-900", letra: "B" },
  Outro: { cor: "bg-gray-500", letra: "?" },
};
const FORM_CONTA_VAZIO = { banco: "Nubank", nome: "", tipo: "corrente" as TipoConta, saldo: 0, cor: "bg-purple-600", letra: "N", ultimaSync: "agora", ativa: true };

export default function Contas() {
  const navigate = useNavigate();
  const [contas, setContas] = useState<Conta[]>(mockContas);
  const [mostrarSaldo, setMostrarSaldo] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoConta | "todas">("todas");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Conta | null>(null);
  const [form, setForm] = useState(FORM_CONTA_VAZIO);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  // Invoice import state
  const [importInvoiceOpen, setImportInvoiceOpen] = useState(false);
  const [importingContaId, setImportingContaId] = useState<string | null>(null);
  const [invoiceFiles, setInvoiceFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);

  function abrirAdicionar() {
    setEditando(null);
    setForm(FORM_CONTA_VAZIO);
    setDialogAberto(true);
  }
  function abrirEditar(c: Conta) {
    setEditando(c);
    const { id: _id, ...rest } = c;
    setForm(rest);
    setDialogAberto(true);
  }
  function abrirImportarFatura(contaId: string) {
    setImportingContaId(contaId);
    setInvoiceFiles([]);
    setParsedTransactions([]);
    setUploadProgress({});
    setImportInvoiceOpen(true);
  }
  function handleFileSelect(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => {
      const ext = f.name.toLowerCase().split(".").pop();
      return ["pdf", "csv", "xlsx", "xls"].includes(ext || "");
    });
    setInvoiceFiles(prev => [...prev, ...newFiles]);

    // Simulate parsing
    newFiles.forEach(file => {
      setUploadProgress(p => ({ ...p, [file.name]: 0 }));
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          // Simulate parsed transactions
          const mockTxCount = Math.floor(Math.random() * 8) + 3;
          const newTxs = Array.from({ length: mockTxCount }).map((_, i) => ({
            id: `tx-${Date.now()}-${i}`,
            data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            descricao: `Transação importada ${i + 1}`,
            categoria: ["Alimentação", "Transporte", "Saúde", "Lazer"][Math.floor(Math.random() * 4)],
            valor: Math.floor(Math.random() * 500) + 10,
            tipo: "despesa" as const,
            status: "confirmada" as const,
          }));
          setParsedTransactions(prev => [...prev, ...newTxs]);
        }
        setUploadProgress(p => ({ ...p, [file.name]: Math.min(progress, 100) }));
      }, 300);
    });
  }
  function confirmarImportacao() {
    // Navigate to movimentacoes with parsed transactions
    // In a real app, this would create the transactions in the backend
    setImportInvoiceOpen(false);
    setInvoiceFiles([]);
    setParsedTransactions([]);
    // Could add a toast here: "X transações importadas com sucesso"
    navigate("/movimentacoes");
  }
  function salvar() {
    if (!form.nome.trim() && !form.banco) return;
    const cl = COR_LETRA[form.banco] ?? { cor: "bg-gray-500", letra: "?" };
    const dados = { ...form, cor: cl.cor, letra: cl.letra, nome: form.nome || tipoLabel[form.tipo] };
    if (editando) {
      setContas(prev => prev.map(c => c.id === editando.id ? { ...dados, id: c.id } : c));
    } else {
      setContas(prev => [...prev, { ...dados, id: Date.now().toString() }]);
    }
    setDialogAberto(false);
  }
  function confirmarDelete() {
    if (deletandoId) setContas(prev => prev.filter(c => c.id !== deletandoId));
    setDeletandoId(null);
  }
  function setF<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  const filtradas = contas.filter(c =>
    filtroTipo === "todas" ? true : c.tipo === filtroTipo
  );

  const totalAtivo = contas.filter(c => c.ativa).reduce((s, c) => s + c.saldo, 0);
  const totalInvest = contas.filter(c => c.ativa && c.tipo === "investimento").reduce((s, c) => s + c.saldo, 0);
  const totalLiquido = contas.filter(c => c.ativa && c.tipo !== "investimento").reduce((s, c) => s + c.saldo, 0);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Contas Bancárias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mockContas.filter(c => c.ativa).length} contas ativas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/importar-extrato")}
            className="border-primary/40 text-primary hover:bg-primary/8 hover:border-primary gap-1.5 font-medium"
          >
            <Upload className="h-4 w-4" />
            Importar Extrato
          </Button>
          <Button
            size="sm"
            onClick={abrirAdicionar}
            className="bg-primary text-white hover:bg-primary/90 gap-1.5 font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Adicionar Conta
          </Button>
        </div>
      </div>

      {/* Saldo consolidado */}
      <div className="neon-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Patrimônio total consolidado
          </p>
          <button
            onClick={() => setMostrarSaldo(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={mostrarSaldo ? "Ocultar saldos" : "Mostrar saldos"}
          >
            {mostrarSaldo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {mostrarSaldo ? `R$ ${fmtVal(totalAtivo)}` : "R$ ••••••"}
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Disponível</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {mostrarSaldo ? `R$ ${fmtVal(totalLiquido)}` : "••••"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Investido</p>
              <p className="text-base font-bold text-amber-500">
                {mostrarSaldo ? `R$ ${fmtVal(totalInvest)}` : "••••"}
              </p>
            </div>
          </div>
        </div>

        {/* Mini barra de composição */}
        <div className="space-y-1.5">
          <div className="h-2 rounded-full bg-muted overflow-hidden flex gap-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(totalLiquido / totalAtivo) * 100}%` }}
            />
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${(totalInvest / totalAtivo) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Disponível</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Investimentos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["todas", "corrente", "poupanca", "investimento"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroTipo(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filtroTipo === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f === "todas" ? "Todas" : tipoLabel[f]}
          </button>
        ))}
      </div>

      {/* Grid de contas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtradas.map(conta => {
          const Icon = tipoIcon[conta.tipo];
          return (
            <div
              key={conta.id}
              className={`${neonByTipo[conta.tipo]} rounded-xl p-4 space-y-3 ${!conta.ativa ? "opacity-50" : ""}`}
            >
              {/* Cabeçalho */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${conta.cor} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-black text-sm">{conta.letra}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">{conta.banco}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{conta.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Icon className="h-2.5 w-2.5" />
                    {tipoLabel[conta.tipo]}
                  </Badge>
                  <button onClick={() => abrirEditar(conta)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeletandoId(conta.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Saldo */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  {mostrarSaldo ? `R$ ${fmtVal(conta.saldo)}` : "R$ ••••••"}
                </p>
              </div>

              {/* Rodapé */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-2.5 w-2.5" />
                  {conta.ultimaSync}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  <button
                    onClick={() => navigate("/movimentacoes")}
                    className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                  >
                    <ArrowDownLeft className="h-3 w-3" /> Extrato
                  </button>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  {conta.tipo === "cartao" ? (
                    <button
                      onClick={() => abrirImportarFatura(conta.id)}
                      className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <FileUp className="h-3 w-3" /> Fatura
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/importar-extrato")}
                      className="text-[11px] text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <ArrowUpRight className="h-3 w-3" /> Importar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Card "Adicionar nova conta" */}
        <div onClick={abrirAdicionar} className="neon-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[140px] border-dashed cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
          <div className="w-9 h-9 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center group-hover:border-primary/70 transition-colors">
            <Plus className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Adicionar conta
          </p>
        </div>
      </div>

      {/* Contas inativas */}
      {contas.some(c => !c.ativa) && (
        <p className="text-[11px] text-muted-foreground text-center">
          {contas.filter(c => !c.ativa).length} conta(s) inativa(s) ocultada(s) do saldo total.
        </p>
      )}

      {/* Dialog Adicionar/Editar Conta */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Conta" : "Adicionar Conta"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Banco / Instituição</Label>
              <Select value={form.banco} onValueChange={v => setF("banco", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BANCOS_LISTA.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Conta</Label>
              <Select value={form.tipo} onValueChange={v => setF("tipo", v as TipoConta)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="investimento">Investimentos</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Nome / Apelido</Label>
              <Input placeholder="Ex: Conta corrente principal"
                value={form.nome} onChange={e => setF("nome", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Saldo atual (R$)</Label>
              <Input type="number" min={0} step={0.01} placeholder="0,00"
                value={form.saldo || ""} onChange={e => setF("saldo", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} className="bg-primary text-white hover:bg-primary/90">
              {editando ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog excluir */}
      <AlertDialog open={!!deletandoId} onOpenChange={v => !v && setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>A conta será removida da lista. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Importar Fatura de Cartão */}
      <Dialog open={importInvoiceOpen} onOpenChange={setImportInvoiceOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Fatura de Cartão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Upload Area */}
            <div className="rounded-xl border-2 border-dashed border-primary/30 p-6 text-center hover:border-primary/60 transition-colors cursor-pointer group"
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-primary/60"); }}
              onDragLeave={e => { e.currentTarget.classList.remove("border-primary/60"); }}
              onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
              onClick={() => document.getElementById("invoice-file-input")?.click()}>
              <FileUp className="h-8 w-8 text-primary/40 group-hover:text-primary/60 mx-auto mb-2 transition-colors" />
              <p className="text-sm font-medium text-foreground">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, CSV, Excel (.xlsx, .xls)</p>
              <input id="invoice-file-input" type="file" multiple accept=".pdf,.csv,.xlsx,.xls" onChange={e => handleFileSelect(e.target.files)} className="hidden" />
            </div>

            {/* File List */}
            {invoiceFiles.length > 0 && (
              <div className="space-y-2">
                {invoiceFiles.map(file => (
                  <div key={file.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={uploadProgress[file.name] || 0} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(uploadProgress[file.name] || 0)}%</span>
                      </div>
                    </div>
                    {uploadProgress[file.name] === 100 && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {/* Parsed Transactions */}
            {parsedTransactions.length > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-primary">{parsedTransactions.length} transações extraídas</p>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {parsedTransactions.slice(0, 5).map((tx, i) => (
                    <div key={tx.id} className="text-xs flex justify-between text-muted-foreground">
                      <span>{tx.descricao}</span>
                      <span className="text-foreground font-medium">R$ {tx.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  {parsedTransactions.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+ {parsedTransactions.length - 5} mais</p>
                  )}
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-200/20">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-700 dark:text-blue-300">PDF: OCR para extrair dados automaticamente</p>
              </div>
              <div className="flex gap-2 p-2 rounded-lg bg-green-500/10 border border-green-200/20">
                <AlertCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-green-700 dark:text-green-300">CSV/Excel: Mapeie as colunas data, descrição e valor</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportInvoiceOpen(false)}>Cancelar</Button>
            <Button
              onClick={confirmarImportacao}
              disabled={parsedTransactions.length === 0}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Importar {parsedTransactions.length > 0 && `(${parsedTransactions.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
