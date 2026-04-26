import { useState, useMemo } from "react";
import {
  Users, Plus, Phone, DollarSign, CalendarDays, Search,
  ChevronLeft, ChevronRight, History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────── */
interface Funcionario {
  id: string;
  name: string;
  bond: "clt" | "diarista" | "empreiteiro" | "informal";
  role: string;
  doc: string;
  phone: string;
  address: string;
  start_date: string;
  base_pay: number;
  notes: string;
  active: boolean;
}

interface Pagamento {
  id: string;
  funcionario_id: string;
  period: string;
  amount: number;
  method: string;
  date: string;
}

/* ── Mock ──────────────────────────────────────────── */
const bondLabel: Record<Funcionario["bond"], string> = {
  clt: "CLT", diarista: "Diarista", empreiteiro: "Empreiteiro", informal: "Informal",
};

const roleOptions = ["Vaqueiro", "Tratorista", "Ordenhador", "Peão", "Gerente", "Outro"];

const initialFuncionarios: Funcionario[] = [
  { id: "f1", name: "José da Silva", bond: "diarista", role: "Vaqueiro", doc: "", phone: "(34) 99999-1234", address: "Zona rural", start_date: "2023-03-10", base_pay: 120, notes: "", active: true },
  { id: "f2", name: "Maria Aparecida", bond: "clt", role: "Ordenhador", doc: "123.456.789-00", phone: "(34) 98888-5678", address: "Centro", start_date: "2022-01-15", base_pay: 2200, notes: "Experiência com ordenha mecânica", active: true },
  { id: "f3", name: "Carlos Pereira", bond: "informal", role: "Peão", doc: "", phone: "(34) 97777-0000", address: "", start_date: "2024-06-01", base_pay: 100, notes: "", active: false },
  { id: "f4", name: "Antônio Ferreira", bond: "empreiteiro", role: "Tratorista", doc: "987.654.321-00", phone: "(34) 96666-4321", address: "Faz. vizinha", start_date: "2024-01-20", base_pay: 3500, notes: "Contrato por safra", active: true },
];

const initialPagamentos: Pagamento[] = [
  { id: "p1", funcionario_id: "f1", period: "2025-05", amount: 2400, method: "PIX", date: "2025-06-05" },
  { id: "p2", funcionario_id: "f1", period: "2025-04", amount: 1920, method: "PIX", date: "2025-05-05" },
  { id: "p3", funcionario_id: "f2", period: "2025-05", amount: 2200, method: "Transferência", date: "2025-06-01" },
  { id: "p4", funcionario_id: "f4", period: "2025-05", amount: 3500, method: "Depósito", date: "2025-06-01" },
];

const initialDiarias: Record<string, string[]> = {
  "f1": ["2025-06-02", "2025-06-03", "2025-06-04", "2025-06-05", "2025-06-06", "2025-06-09", "2025-06-10", "2025-06-11", "2025-06-12", "2025-06-13", "2025-06-16", "2025-06-17", "2025-06-18", "2025-06-19", "2025-06-20", "2025-06-23", "2025-06-24", "2025-06-25", "2025-06-26", "2025-06-27"],
  "f3": ["2025-06-02", "2025-06-05", "2025-06-09", "2025-06-12", "2025-06-16"],
};

/* ── Component ─────────────────────────────────────── */
export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(initialFuncionarios);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(initialPagamentos);
  const [diarias, setDiarias] = useState<Record<string, string[]>>(initialDiarias);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPagForm, setShowPagForm] = useState(false);
  const [selectedFunc, setSelectedFunc] = useState<Funcionario | null>(null);
  const [calMonth, setCalMonth] = useState(new Date());

  /* form state */
  const empty: Omit<Funcionario, "id"> = { name: "", bond: "diarista", role: "Vaqueiro", doc: "", phone: "", address: "", start_date: format(new Date(), "yyyy-MM-dd"), base_pay: 0, notes: "", active: true };
  const [form, setForm] = useState(empty);

  const emptyPag = { funcionario_id: "", period: format(new Date(), "yyyy-MM"), amount: 0, method: "PIX", date: format(new Date(), "yyyy-MM-dd") };
  const [pagForm, setPagForm] = useState(emptyPag);

  const filtered = funcionarios.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = funcionarios.filter((f) => f.active).length;

  /* ── Handlers ─── */
  function handleSave() {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const nf: Funcionario = { ...form, id: `f${Date.now()}`, name: form.name.trim() };
    setFuncionarios((prev) => [...prev, nf]);
    setShowForm(false);
    setForm(empty);
    toast.success("Funcionário cadastrado");
  }

  function handleSavePag() {
    if (!pagForm.funcionario_id || pagForm.amount <= 0) { toast.error("Preencha todos os campos"); return; }
    setPagamentos((prev) => [...prev, { ...pagForm, id: `p${Date.now()}` }]);
    setShowPagForm(false);
    setPagForm(emptyPag);
    toast.success("Pagamento registrado");
  }

  function toggleDiaria(funcId: string, dateStr: string) {
    setDiarias((prev) => {
      const list = prev[funcId] || [];
      return { ...prev, [funcId]: list.includes(dateStr) ? list.filter((d) => d !== dateStr) : [...list, dateStr] };
    });
  }

  /* calendar helpers */
  const calDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const calFuncId = selectedFunc?.id || "";
  const calWorked = diarias[calFuncId] || [];
  const calWorkedThisMonth = calWorked.filter((d) => isSameMonth(new Date(d), calMonth)).length;
  const calTotal = calWorkedThisMonth * (selectedFunc?.base_pay || 0);

  /* pagamentos do funcionário selecionado */
  const funcPagamentos = selectedFunc ? pagamentos.filter((p) => p.funcionario_id === selectedFunc.id).sort((a, b) => b.date.localeCompare(a.date)) : [];

  const totalPagFunc = funcPagamentos.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Funcionários
          </h1>
          <p className="text-sm text-muted-foreground">{activeCount} ativos de {funcionarios.length} cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPagForm(true)} variant="outline" size="sm"><DollarSign className="h-4 w-4 mr-1" />Registrar Pagamento</Button>
          <Button onClick={() => { setForm(empty); setShowForm(true); }} size="sm"><Plus className="h-4 w-4 mr-1" />Novo Funcionário</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar funcionário…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista"><Users className="h-4 w-4 mr-1" />Lista</TabsTrigger>
          <TabsTrigger value="diarias"><CalendarDays className="h-4 w-4 mr-1" />Diárias</TabsTrigger>
          <TabsTrigger value="historico"><History className="h-4 w-4 mr-1" />Histórico</TabsTrigger>
        </TabsList>

        {/* ── TAB LISTA ───────────────────── */}
        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Salário/Diária</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id} className="cursor-pointer" onClick={() => setSelectedFunc(f)}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>
                        <Badge variant={f.bond === "clt" ? "default" : "secondary"} className="text-xs">
                          {bondLabel[f.bond]}
                        </Badge>
                      </TableCell>
                      <TableCell>{f.role}</TableCell>
                      <TableCell className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground" />{f.phone || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">R$ {f.base_pay.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant={f.active ? "default" : "outline"} className={f.active ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground"}>
                          {f.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum funcionário encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB DIÁRIAS ─────────────────── */}
        <TabsContent value="diarias" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <Label className="text-xs text-muted-foreground mb-1 block">Funcionário</Label>
              <Select value={calFuncId} onValueChange={(v) => setSelectedFunc(funcionarios.find((f) => f.id === v) || null)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.filter((f) => f.bond === "diarista" || f.bond === "informal").map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* month nav */}
            <div className="flex items-end gap-2">
              <Button variant="outline" size="icon" onClick={() => setCalMonth((m) => subMonths(m, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium min-w-[120px] text-center capitalize">{format(calMonth, "MMMM yyyy", { locale: ptBR })}</span>
              <Button variant="outline" size="icon" onClick={() => setCalMonth((m) => addMonths(m, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {selectedFunc ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{selectedFunc.name} — Diárias</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {calWorkedThisMonth} dias × R$ {selectedFunc.base_pay.toFixed(2)} = <span className="font-semibold text-primary">R$ {calTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                    <div key={d} className="text-[10px] text-center text-muted-foreground font-medium">{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* offset */}
                  {Array.from({ length: getDay(calDays[0]) }).map((_, i) => <div key={`e${i}`} />)}
                  {calDays.map((day) => {
                    const ds = format(day, "yyyy-MM-dd");
                    const worked = calWorked.includes(ds);
                    return (
                      <button
                        key={ds}
                        onClick={() => toggleDiaria(selectedFunc.id, ds)}
                        className={`h-10 rounded-md text-xs font-medium transition-colors border ${worked ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent text-foreground"}`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um diarista/informal para controlar diárias</CardContent></Card>
          )}
        </TabsContent>

        {/* ── TAB HISTÓRICO ───────────────── */}
        <TabsContent value="historico" className="mt-4 space-y-4">
          <div className="w-full sm:w-64">
            <Label className="text-xs text-muted-foreground mb-1 block">Funcionário</Label>
            <Select value={calFuncId} onValueChange={(v) => setSelectedFunc(funcionarios.find((f) => f.id === v) || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFunc ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Pagamentos — {selectedFunc.name}</span>
                  <span className="text-sm text-muted-foreground">Total: <span className="font-semibold text-primary">R$ {totalPagFunc.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Forma</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcPagamentos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.date + "T12:00"), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{p.period}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell className="text-right font-mono">R$ {p.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                    {funcPagamentos.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem pagamentos registrados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um funcionário para ver o histórico</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── DIALOG: Novo Funcionário ──── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
            <DialogDescription>Preencha os dados do funcionário</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome completo *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Vínculo</Label>
                <Select value={form.bond} onValueChange={(v) => setForm({ ...form, bond: v as Funcionario["bond"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(bondLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Função</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>CPF/RG (opcional)</Label>
                <Input value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Data de início</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Salário/Diária (R$)</Label>
                <Input type="number" min={0} value={form.base_pay || ""} onChange={(e) => setForm({ ...form, base_pay: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: Registrar Pagamento ── */}
      <Dialog open={showPagForm} onOpenChange={setShowPagForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>Informe os dados do pagamento</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Funcionário *</Label>
              <Select value={pagForm.funcionario_id} onValueChange={(v) => setPagForm({ ...pagForm, funcionario_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.filter((f) => f.active).map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Período</Label>
                <Input type="month" value={pagForm.period} onChange={(e) => setPagForm({ ...pagForm, period: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" min={0} value={pagForm.amount || ""} onChange={(e) => setPagForm({ ...pagForm, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={pagForm.method} onValueChange={(v) => setPagForm({ ...pagForm, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["PIX", "Transferência", "Depósito", "Dinheiro", "Cheque"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Data</Label>
                <Input type="date" value={pagForm.date} onChange={(e) => setPagForm({ ...pagForm, date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPagForm(false)}>Cancelar</Button>
            <Button onClick={handleSavePag}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
