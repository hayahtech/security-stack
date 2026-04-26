import { useState } from "react";
import {
  Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
  TrendingDown, Coins, Calendar, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
type TipoDivida = "cartao" | "financiamento" | "emprestimo" | "boleto";

interface Divida {
  id: string;
  descricao: string;
  banco: string;
  tipo: TipoDivida;
  parcela: number;
  parcelasTotal: number;   // 0 = sem parcelas (fatura rotativa)
  parcelaAtual: number;
  diaVencimento: number;
  taxaJuros: number;       // % a.m.
  pago: boolean;
}

/* ─── Mock data ──────────────────────────────────────────────────────────── */
const INICIAL: Divida[] = [
  { id: "1", descricao: "Fatura Nubank",         banco: "Nubank",   tipo: "cartao",        parcela: 1240.50, parcelasTotal: 0,  parcelaAtual: 0,  diaVencimento: 10, taxaJuros: 0,    pago: false },
  { id: "2", descricao: "Financiamento Veículo", banco: "Itaú",     tipo: "financiamento", parcela:  890.00, parcelasTotal: 48, parcelaAtual: 18, diaVencimento: 15, taxaJuros: 1.49, pago: false },
  { id: "3", descricao: "Empréstimo Pessoal",    banco: "Bradesco", tipo: "emprestimo",    parcela:  430.00, parcelasTotal: 24, parcelaAtual: 6,  diaVencimento: 5,  taxaJuros: 2.1,  pago: false },
  { id: "4", descricao: "Fatura Itaú",           banco: "Itaú",     tipo: "cartao",        parcela:  670.00, parcelasTotal: 0,  parcelaAtual: 0,  diaVencimento: 20, taxaJuros: 0,    pago: false },
  { id: "5", descricao: "Celular Samsung",       banco: "Magazine", tipo: "financiamento", parcela:  189.90, parcelasTotal: 12, parcelaAtual: 3,  diaVencimento: 8,  taxaJuros: 0,    pago: false },
  { id: "6", descricao: "Notebook Dell",         banco: "Amazon",   tipo: "financiamento", parcela:  312.00, parcelasTotal: 10, parcelaAtual: 10, diaVencimento: 1,  taxaJuros: 0,    pago: true  },
];

const TIPO_LABELS: Record<TipoDivida, string> = {
  cartao:        "Cartão",
  financiamento: "Financiamento",
  emprestimo:    "Empréstimo",
  boleto:        "Boleto",
};

const TIPO_CORES: Record<TipoDivida, string> = {
  cartao:        "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  financiamento: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  emprestimo:    "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  boleto:        "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const R = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function diasParaVencer(dia: number) {
  const hoje = new Date();
  const v = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
  if (v < hoje) v.setMonth(v.getMonth() + 1);
  return Math.ceil((v.getTime() - hoje.getTime()) / 86_400_000);
}

function urgClass(dias: number) {
  if (dias <= 3) return "text-destructive font-semibold";
  if (dias <= 7) return "text-amber-500 font-medium";
  return "text-muted-foreground";
}

function residual(d: Divida) {
  if (d.parcelasTotal === 0) return d.parcela;
  return d.parcela * (d.parcelasTotal - d.parcelaAtual);
}

/* ─── Formulário vazio ───────────────────────────────────────────────────── */
const FORM_VAZIO: Omit<Divida, "id"> = {
  descricao: "",
  banco: "",
  tipo: "emprestimo",
  parcela: 0,
  parcelasTotal: 0,
  parcelaAtual: 0,
  diaVencimento: 10,
  taxaJuros: 0,
  pago: false,
};

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function Dividas() {
  const [dividas, setDividas] = useState<Divida[]>(INICIAL);
  const [filtro, setFiltro] = useState<"todas" | TipoDivida>("todas");
  const [mostrarPagas, setMostrarPagas] = useState(false);

  /* modais */
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Divida | null>(null);
  const [form, setForm] = useState<Omit<Divida, "id">>(FORM_VAZIO);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  /* ── filtragem ─────────────────────────────────────────────────────────── */
  const filtradas = dividas.filter(d => {
    if (!mostrarPagas && d.pago) return false;
    if (filtro !== "todas" && d.tipo !== filtro) return false;
    return true;
  });

  /* ── KPIs ──────────────────────────────────────────────────────────────── */
  const ativas = dividas.filter(d => !d.pago);
  const totalMensal = ativas.reduce((s, d) => s + d.parcela, 0);
  const totalResidual = ativas.reduce((s, d) => s + residual(d), 0);
  const urgente = [...ativas].sort((a, b) => diasParaVencer(a.diaVencimento) - diasParaVencer(b.diaVencimento))[0];

  /* ── ações ─────────────────────────────────────────────────────────────── */
  function abrirAdicionar() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setDialogAberto(true);
  }

  function abrirEditar(d: Divida) {
    setEditando(d);
    const { id: _id, ...rest } = d;
    setForm(rest);
    setDialogAberto(true);
  }

  function salvar() {
    if (!form.descricao.trim()) return;
    if (editando) {
      setDividas(prev => prev.map(d => d.id === editando.id ? { ...form, id: d.id } : d));
    } else {
      setDividas(prev => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setDialogAberto(false);
  }

  function confirmarDelete() {
    if (deletandoId) setDividas(prev => prev.filter(d => d.id !== deletandoId));
    setDeletandoId(null);
  }

  function togglePago(id: string) {
    setDividas(prev => prev.map(d => d.id === id ? { ...d, pago: !d.pago } : d));
  }

  function setF<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dívidas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ativas.length} compromisso{ativas.length !== 1 ? "s" : ""} ativo{ativas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={abrirAdicionar}
          className="bg-primary text-white hover:bg-primary/90 gap-1.5 font-semibold shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="h-4 w-4" /> Nova Dívida
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="neon-card-rose rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total mensal</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{R(totalMensal)}</p>
          <p className="text-xs text-muted-foreground">{ativas.length} compromissos ativos</p>
        </div>

        <div className="neon-card-amber rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Saldo devedor</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{R(totalResidual)}</p>
          <p className="text-xs text-muted-foreground">total em aberto</p>
        </div>

        <div className="neon-card rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Próx. vencimento</span>
          </div>
          {urgente ? (
            <>
              <p className="text-base font-bold text-foreground truncate">{urgente.descricao}</p>
              <p className={`text-xs ${urgClass(diasParaVencer(urgente.diaVencimento))}`}>
                {diasParaVencer(urgente.diaVencimento) === 0 ? "Vence hoje" : `em ${diasParaVencer(urgente.diaVencimento)} dia(s)`}
                {" — dia "}{urgente.diaVencimento}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma pendente</p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {(["todas", "cartao", "financiamento", "emprestimo", "boleto"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filtro === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {f === "todas" ? "Todas" : TIPO_LABELS[f]}
          </button>
        ))}
        <button
          onClick={() => setMostrarPagas(v => !v)}
          className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            mostrarPagas
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border text-muted-foreground hover:border-emerald-500/40"
          }`}
        >
          {mostrarPagas ? "Ocultar quitadas" : "Mostrar quitadas"}
        </button>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────────── */}
      <div className="neon-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-[180px]">Descrição</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Banco/Credor</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Parcela</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Qtde</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Pagas</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Restam</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Residual</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Venc.</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Juros</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground min-w-[100px]">Progresso</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground text-sm">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    Nenhuma dívida encontrada.
                  </TableCell>
                </TableRow>
              )}

              {filtradas.map(d => {
                const temParcelas = d.parcelasTotal > 0;
                const restantes   = temParcelas ? d.parcelasTotal - d.parcelaAtual : 0;
                const progresso   = temParcelas ? (d.parcelaAtual / d.parcelasTotal) * 100 : 0;
                const dias        = diasParaVencer(d.diaVencimento);

                return (
                  <TableRow
                    key={d.id}
                    className={`border-border transition-colors ${d.pago ? "opacity-50" : "hover:bg-muted/30"}`}
                  >
                    {/* Descrição */}
                    <TableCell className="font-medium text-foreground text-sm py-3">
                      <span className={d.pago ? "line-through text-muted-foreground" : ""}>{d.descricao}</span>
                    </TableCell>

                    {/* Banco */}
                    <TableCell className="text-sm text-muted-foreground py-3">{d.banco}</TableCell>

                    {/* Tipo */}
                    <TableCell className="py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TIPO_CORES[d.tipo]}`}>
                        {TIPO_LABELS[d.tipo]}
                      </span>
                    </TableCell>

                    {/* Parcela */}
                    <TableCell className="text-sm font-semibold text-foreground text-right py-3 tabular-nums">
                      {R(d.parcela)}
                    </TableCell>

                    {/* Qtde total */}
                    <TableCell className="text-sm text-center text-muted-foreground py-3 tabular-nums">
                      {temParcelas ? d.parcelasTotal : "—"}
                    </TableCell>

                    {/* Pagas */}
                    <TableCell className="text-sm text-center py-3 tabular-nums">
                      {temParcelas ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{d.parcelaAtual}</span>
                      ) : "—"}
                    </TableCell>

                    {/* Restantes */}
                    <TableCell className="text-sm text-center py-3 tabular-nums">
                      {temParcelas ? (
                        <span className={restantes > 0 ? "text-amber-500 font-medium" : "text-emerald-500 font-medium"}>
                          {restantes}
                        </span>
                      ) : "—"}
                    </TableCell>

                    {/* Residual */}
                    <TableCell className="text-sm font-semibold text-right py-3 tabular-nums text-foreground">
                      {R(residual(d))}
                    </TableCell>

                    {/* Vencimento */}
                    <TableCell className="text-center py-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" /> {d.diaVencimento}
                        </span>
                        <span className={`text-[10px] ${urgClass(dias)}`}>
                          {dias === 0 ? "Hoje" : `${dias}d`}
                        </span>
                      </div>
                    </TableCell>

                    {/* Juros */}
                    <TableCell className="text-sm text-center py-3">
                      {d.taxaJuros > 0 ? (
                        <span className="text-rose-500 font-medium tabular-nums">{d.taxaJuros}%</span>
                      ) : (
                        <span className="text-emerald-500 text-xs">Sem juros</span>
                      )}
                    </TableCell>

                    {/* Progresso */}
                    <TableCell className="py-3 min-w-[100px]">
                      {temParcelas ? (
                        <div className="space-y-1">
                          <Progress value={progresso} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {progresso.toFixed(0)}% concluído
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Fatura rotativa</span>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Marcar pago/pendente */}
                        <button
                          onClick={() => togglePago(d.id)}
                          title={d.pago ? "Marcar como pendente" : "Marcar como pago"}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            d.pago
                              ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                              : "bg-muted text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-500"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => abrirEditar(d)}
                          title="Editar"
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/15 hover:text-primary transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => setDeletandoId(d.id)}
                          title="Excluir"
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Rodapé totalizador */}
        {filtradas.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>{filtradas.filter(d => !d.pago).length} dívida(s) ativa(s) exibida(s)</span>
            <div className="flex gap-6 tabular-nums">
              <span>
                Mensal: <strong className="text-foreground">{R(filtradas.filter(d => !d.pago).reduce((s, d) => s + d.parcela, 0))}</strong>
              </span>
              <span>
                Residual: <strong className="text-foreground">{R(filtradas.filter(d => !d.pago).reduce((s, d) => s + residual(d), 0))}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Dialog: Adicionar / Editar ────────────────────────────────── */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Dívida" : "Nova Dívida"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Descrição */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: Financiamento Honda Civic"
                value={form.descricao}
                onChange={e => setF("descricao", e.target.value)}
              />
            </div>

            {/* Banco */}
            <div className="space-y-1.5">
              <Label htmlFor="banco">Banco / Credor</Label>
              <Input
                id="banco"
                placeholder="Ex: Itaú"
                value={form.banco}
                onChange={e => setF("banco", e.target.value)}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setF("tipo", v as TipoDivida)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TIPO_LABELS) as [TipoDivida, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parcela */}
            <div className="space-y-1.5">
              <Label htmlFor="parcela">Valor da Parcela (R$)</Label>
              <Input
                id="parcela"
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.parcela || ""}
                onChange={e => setF("parcela", parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Qtde parcelas */}
            <div className="space-y-1.5">
              <Label htmlFor="ptotal">Qtde de Parcelas (0 = rotativo)</Label>
              <Input
                id="ptotal"
                type="number"
                min={0}
                placeholder="0"
                value={form.parcelasTotal || ""}
                onChange={e => setF("parcelasTotal", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Pagas */}
            {form.parcelasTotal > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="ppagas">Parcelas já pagas</Label>
                <Input
                  id="ppagas"
                  type="number"
                  min={0}
                  max={form.parcelasTotal}
                  placeholder="0"
                  value={form.parcelaAtual || ""}
                  onChange={e => setF("parcelaAtual", Math.min(parseInt(e.target.value) || 0, form.parcelasTotal))}
                />
              </div>
            )}

            {/* Dia vencimento */}
            <div className="space-y-1.5">
              <Label htmlFor="dia">Dia do Vencimento</Label>
              <Input
                id="dia"
                type="number"
                min={1}
                max={31}
                placeholder="10"
                value={form.diaVencimento || ""}
                onChange={e => setF("diaVencimento", parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Juros */}
            <div className="space-y-1.5">
              <Label htmlFor="juros">Taxa de Juros (% a.m.)</Label>
              <Input
                id="juros"
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.taxaJuros || ""}
                onChange={e => setF("taxaJuros", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Preview residual */}
          {form.parcela > 0 && (
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm flex justify-between">
              <span className="text-muted-foreground">Saldo devedor estimado:</span>
              <strong className="text-foreground">
                {R(form.parcelasTotal > 0
                  ? form.parcela * (form.parcelasTotal - form.parcelaAtual)
                  : form.parcela)}
              </strong>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} className="bg-primary text-white hover:bg-primary/90">
              {editando ? "Salvar alterações" : "Adicionar dívida"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Alert: Confirmar exclusão ──────────────────────────────────── */}
      <AlertDialog open={!!deletandoId} onOpenChange={v => !v && setDeletandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dívida?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A dívida será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
