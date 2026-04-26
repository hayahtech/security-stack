import { useState } from "react";
import {
  Plus, Upload, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  Search, ChevronDown, MoreHorizontal, TrendingUp, TrendingDown, Minus,
  Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate } from "react-router-dom";

type TipoTx = "receita" | "despesa" | "transferencia";

interface Transacao {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  conta: string;
  tipo: TipoTx;
  valor: number;
  status: "confirmada" | "pendente";
}

const categoriaEmoji: Record<string, string> = {
  Salário: "💼", Freelance: "💻", Investimentos: "📈",
  Alimentação: "🍔", Moradia: "🏠", Transporte: "🚗",
  Saúde: "🏥", Lazer: "🎬", Educação: "📚",
  Assinaturas: "📱", Roupas: "👕", Outros: "📦",
  Transferência: "↔️",
};

const mockTx: Transacao[] = [
  { id: "1",  data: "2026-04-25", descricao: "Salário Abril",          categoria: "Salário",       conta: "Nubank CC",    tipo: "receita",      valor: 8500,  status: "confirmada" },
  { id: "2",  data: "2026-04-24", descricao: "iFood",                  categoria: "Alimentação",   conta: "Nubank CC",    tipo: "despesa",      valor: 68.90, status: "confirmada" },
  { id: "3",  data: "2026-04-24", descricao: "Uber",                   categoria: "Transporte",    conta: "Nubank CC",    tipo: "despesa",      valor: 32.40, status: "confirmada" },
  { id: "4",  data: "2026-04-23", descricao: "Transferência Poupança", categoria: "Transferência", conta: "Itaú CC",      tipo: "transferencia",valor: 1000,  status: "confirmada" },
  { id: "5",  data: "2026-04-22", descricao: "Netflix",                categoria: "Assinaturas",   conta: "Nubank CC",    tipo: "despesa",      valor: 44.90, status: "confirmada" },
  { id: "6",  data: "2026-04-22", descricao: "Spotify",                categoria: "Assinaturas",   conta: "Nubank CC",    tipo: "despesa",      valor: 21.90, status: "confirmada" },
  { id: "7",  data: "2026-04-21", descricao: "Freelance design",       categoria: "Freelance",     conta: "Inter",        tipo: "receita",      valor: 2200,  status: "confirmada" },
  { id: "8",  data: "2026-04-20", descricao: "Supermercado Extra",     categoria: "Alimentação",   conta: "Itaú CC",      tipo: "despesa",      valor: 347.80,status: "confirmada" },
  { id: "9",  data: "2026-04-19", descricao: "Academia SmartFit",      categoria: "Saúde",         conta: "Nubank CC",    tipo: "despesa",      valor: 99.90, status: "confirmada" },
  { id: "10", data: "2026-04-18", descricao: "Cinema + jantar",        categoria: "Lazer",         conta: "Nubank CC",    tipo: "despesa",      valor: 156.00,status: "confirmada" },
  { id: "11", data: "2026-04-17", descricao: "Farmácia",               categoria: "Saúde",         conta: "Itaú CC",      tipo: "despesa",      valor: 89.50, status: "confirmada" },
  { id: "12", data: "2026-04-16", descricao: "Dividendos ITSA4",       categoria: "Investimentos", conta: "Inter",        tipo: "receita",      valor: 312.40,status: "confirmada" },
  { id: "13", data: "2026-04-15", descricao: "Conta de luz",           categoria: "Moradia",       conta: "Itaú CC",      tipo: "despesa",      valor: 187.60,status: "confirmada" },
  { id: "14", data: "2026-04-14", descricao: "Roupas C&A",             categoria: "Roupas",        conta: "Nubank CC",    tipo: "despesa",      valor: 230.00,status: "pendente"   },
  { id: "15", data: "2026-04-13", descricao: "Curso Udemy",            categoria: "Educação",      conta: "Nubank CC",    tipo: "despesa",      valor: 59.90, status: "confirmada" },
];

const TIPOS: { key: TipoTx | "todas"; label: string }[] = [
  { key: "todas",        label: "Todas"         },
  { key: "receita",      label: "Receitas"      },
  { key: "despesa",      label: "Despesas"      },
  { key: "transferencia",label: "Transferências"},
];

function fmtVal(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtData(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const CATEGORIAS = ["Salário","Freelance","Investimentos","Alimentação","Moradia","Transporte","Saúde","Lazer","Educação","Assinaturas","Roupas","Outros","Transferência"];
const CONTAS_LIST = ["Nubank CC","Itaú CC","Inter","Bradesco CC"];

const FORM_TX_VAZIO = { descricao: "", categoria: "Alimentação", conta: "Nubank CC", tipo: "despesa" as TipoTx, valor: 0, data: new Date().toISOString().split("T")[0], status: "confirmada" as "confirmada" | "pendente" };

export default function Movimentacoes() {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<Transacao[]>(mockTx);
  const [filtroTipo, setFiltroTipo] = useState<TipoTx | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [form, setForm] = useState(FORM_TX_VAZIO);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const receitas  = txs.filter(t => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);
  const despesas  = txs.filter(t => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
  const saldo     = receitas - despesas;

  const filtradas = txs.filter(t => {
    const matchTipo  = filtroTipo === "todas" || t.tipo === filtroTipo;
    const matchBusca = !busca || t.descricao.toLowerCase().includes(busca.toLowerCase()) || t.categoria.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchBusca;
  });

  const grouped: Record<string, Transacao[]> = {};
  filtradas.forEach(t => {
    if (!grouped[t.data]) grouped[t.data] = [];
    grouped[t.data].push(t);
  });
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function abrirNova() {
    setEditando(null);
    setForm(FORM_TX_VAZIO);
    setDialogAberto(true);
  }
  function abrirEditar(t: Transacao) {
    setEditando(t);
    const { id: _id, ...rest } = t;
    setForm(rest);
    setDialogAberto(true);
  }
  function salvar() {
    if (!form.descricao.trim()) return;
    if (editando) {
      setTxs(prev => prev.map(t => t.id === editando.id ? { ...form, id: t.id } : t));
    } else {
      setTxs(prev => [{ ...form, id: Date.now().toString() }, ...prev]);
    }
    setDialogAberto(false);
  }
  function confirmarDelete() {
    if (deletandoId) setTxs(prev => prev.filter(t => t.id !== deletandoId));
    setDeletandoId(null);
  }
  function setF<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

      {/* Header + CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Movimentações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Abril 2026 · {mockTx.length} transações</p>
        </div>
        <div className="flex gap-2">
          {/* Importar — destaque secundário mas visível */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/importar-extrato")}
            className="border-primary/40 text-primary hover:bg-primary/8 hover:border-primary gap-1.5 font-medium"
          >
            <Upload className="h-4 w-4" />
            Importar PDF / CSV
          </Button>

          {/* Nova Movimentação — CTA principal */}
          <Button
            size="sm"
            onClick={abrirNova}
            className="bg-primary text-white hover:bg-primary/90 gap-1.5 font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="neon-card-emerald rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Receitas</span>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R$ {fmtVal(receitas)}</p>
          <p className="text-[10px] text-muted-foreground">este mês</p>
        </div>

        <div className="neon-card-rose rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-xl font-bold text-red-500 dark:text-red-400">R$ {fmtVal(despesas)}</p>
          <p className="text-[10px] text-muted-foreground">este mês</p>
        </div>

        <div className={`rounded-xl p-4 space-y-1 ${saldo >= 0 ? "neon-card-emerald" : "neon-card-rose"}`}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Minus className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Saldo</span>
          </div>
          <p className={`text-xl font-bold ${saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            R$ {fmtVal(saldo)}
          </p>
          <p className="text-[10px] text-muted-foreground">líquido</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar descrição ou categoria…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TIPOS.map(t => (
            <button
              key={t.key}
              onClick={() => setFiltroTipo(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filtroTipo === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por data */}
      <div className="space-y-4">
        {dates.length === 0 && (
          <div className="neon-card rounded-xl p-10 text-center text-muted-foreground text-sm">
            Nenhuma transação encontrada.
          </div>
        )}
        {dates.map(date => (
          <div key={date} className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {fmtData(date)}
            </p>
            <div className="space-y-1.5">
              {grouped[date].map(tx => (
                <div
                  key={tx.id}
                  className="neon-card rounded-xl px-4 py-3 flex items-center gap-3 group hover:cursor-pointer"
                >
                  {/* Ícone tipo */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    tx.tipo === "receita"       ? "bg-emerald-500/15 text-emerald-500" :
                    tx.tipo === "despesa"       ? "bg-red-500/15 text-red-500" :
                    "bg-primary/15 text-primary"
                  }`}>
                    {tx.tipo === "receita"        ? <ArrowUpRight className="h-4 w-4" />  :
                     tx.tipo === "despesa"        ? <ArrowDownLeft className="h-4 w-4" />  :
                     <ArrowLeftRight className="h-4 w-4" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{tx.descricao}</p>
                      {tx.status === "pendente" && (
                        <Badge variant="outline" className="text-[9px] shrink-0">pendente</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {categoriaEmoji[tx.categoria] ?? "📦"} {tx.categoria}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">·</span>
                      <span className="text-xs text-muted-foreground">{tx.conta}</span>
                    </div>
                  </div>

                  {/* Valor */}
                  <p className={`text-sm font-bold shrink-0 ${
                    tx.tipo === "receita"       ? "text-emerald-600 dark:text-emerald-400" :
                    tx.tipo === "despesa"       ? "text-red-500 dark:text-red-400" :
                    "text-foreground"
                  }`}>
                    {tx.tipo === "receita" ? "+" : tx.tipo === "despesa" ? "−" : ""}
                    R$ {fmtVal(tx.valor)}
                  </p>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                    <button onClick={() => abrirEditar(tx)} title="Editar"
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => setDeletandoId(tx.id)} title="Excluir"
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog Nova/Editar Movimentação */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Descrição *</Label>
              <Input placeholder="Ex: Salário" value={form.descricao} onChange={e => setF("descricao", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setF("tipo", v as TipoTx)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setF("categoria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta</Label>
              <Select value={form.conta} onValueChange={v => setF("conta", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTAS_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" min={0} step={0.01} placeholder="0,00"
                value={form.valor || ""} onChange={e => setF("valor", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={e => setF("data", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setF("status", v as "confirmada" | "pendente")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Banner importar */}
      <div
        onClick={() => navigate("/importar-extrato")}
        className="neon-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Importar extrato bancário ou fatura</p>
          <p className="text-xs text-muted-foreground">PDF, CSV, Excel, OFX — categorização automática</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg] shrink-0 group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}
