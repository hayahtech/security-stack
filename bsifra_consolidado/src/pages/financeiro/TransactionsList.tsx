import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn, getDbErrorMessage } from "@/lib/utils";
import { MotionDiv, staggerContainer, fadeUp, scaleIn } from "@/lib/motion";

const db = supabase as any;

const CATEGORIES = ["Serviços", "Ferramentas", "Impostos", "Marketing", "Infraestrutura", "Outros"];
const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
];

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pago: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelado: "bg-muted/50 text-muted-foreground/70",
};

const TransactionsList = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "receita", category: "Serviços", description: "", amount: 0, date: new Date(),
    status: "pendente", payment_method: "", notes: "", client_id: "", project_id: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const [txRes, cliRes, projRes] = await Promise.all([
      db.from("transactions").select("*, clients(name), projects(name)").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("clients").select("id, name").eq("user_id", user.id).order("name"),
      supabase.from("projects").select("id, name").eq("user_id", user.id).order("name"),
    ]);
    setTransactions((txRes.data as any[]) ?? []);
    setClients(cliRes.data ?? []);
    setProjects(projRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totals = useMemo(() => {
    const receitas = transactions.filter((t) => t.type === "receita" && t.status !== "cancelado").reduce((s, t) => s + Number(t.amount), 0);
    const despesas = transactions.filter((t) => t.type === "despesa" && t.status !== "cancelado").reduce((s, t) => s + Number(t.amount), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [transactions]);

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchType && matchCat && matchStatus;
  });

  const resetForm = () => {
    setForm({ type: "receita", category: "Serviços", description: "", amount: 0, date: new Date(), status: "pendente", payment_method: "", notes: "", client_id: "", project_id: "" });
    setEditId(null);
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({
      type: t.type, category: t.category, description: t.description, amount: Number(t.amount),
      date: new Date(t.date), status: t.status, payment_method: t.payment_method || "",
      notes: t.notes || "", client_id: t.client_id || "", project_id: t.project_id || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.description.trim()) return;
    const data = {
      user_id: user.id,
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      amount: form.amount,
      date: format(form.date, "yyyy-MM-dd"),
      status: form.status,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editId
      ? await db.from("transactions").update(data).eq("id", editId)
      : await db.from("transactions").insert(data);

    if (error) { toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" }); return; }
    toast({ title: editId ? "Transação atualizada" : "Transação criada" });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    await db.from("transactions").delete().eq("id", id);
    toast({ title: "Transação excluída" });
    fetchData();
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <MotionDiv className="space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
      <MotionDiv variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Transações</h1>
          <p className="text-sm font-light text-muted-foreground">Controle suas receitas e despesas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Transação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editar Transação" : "Nova Transação"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(form.date, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.date} onSelect={(d) => d && setForm({ ...form, date: d })} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Método Pagamento</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cliente (opcional)</Label>
                  <Select value={form.client_id || "__none__"} onValueChange={(v) => setForm({ ...form, client_id: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Projeto (opcional)</Label>
                  <Select value={form.project_id || "__none__"} onValueChange={(v) => setForm({ ...form, project_id: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleSave} className="w-full">{editId ? "Atualizar" : "Criar"} Transação</Button>
            </div>
          </DialogContent>
        </Dialog>
      </MotionDiv>

      {/* Summary cards */}
      <MotionDiv variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MotionDiv variants={fadeUp}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-green-500/20 transition-all">
            <CardContent className="pt-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-green-500/10"><TrendingUp className="h-5 w-5 text-green-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Receitas</p>
                <p className="text-xl font-extrabold text-green-400">{formatCurrency(totals.receitas)}</p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
        <MotionDiv variants={fadeUp}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-destructive/20 transition-all">
            <CardContent className="pt-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-destructive/10"><TrendingDown className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Despesas</p>
                <p className="text-xl font-extrabold text-destructive">{formatCurrency(totals.despesas)}</p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
        <MotionDiv variants={fadeUp}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all">
            <CardContent className="pt-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Saldo</p>
                <p className={cn("text-xl font-extrabold", totals.saldo >= 0 ? "text-green-400" : "text-destructive")}>{formatCurrency(totals.saldo)}</p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>

      {/* Filters + table */}
      <MotionDiv variants={scaleIn}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Categorias</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Nenhuma transação encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Data</TableHead>
                    <TableHead className="font-medium">Tipo</TableHead>
                    <TableHead className="font-medium">Categoria</TableHead>
                    <TableHead className="font-medium">Descrição</TableHead>
                    <TableHead className="font-medium">Cliente</TableHead>
                    <TableHead className="font-medium text-right">Valor</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("border font-medium", t.type === "receita" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-destructive/20 text-destructive border-destructive/30")}>
                          {t.type === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{t.category}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="text-sm">{t.clients?.name || "—"}</TableCell>
                      <TableCell className={cn("text-right font-medium", t.type === "receita" ? "text-green-400" : "text-destructive")}>
                        {t.type === "despesa" && "-"}{formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[t.status]} font-medium border`}>
                          {t.status === "pendente" ? "Pendente" : t.status === "pago" ? "Pago" : "Cancelado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </MotionDiv>
    </MotionDiv>
  );
};

export default TransactionsList;
