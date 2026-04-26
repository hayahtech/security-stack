import { useState, useMemo } from "react";
import {
  Users, Plus, Search, Phone, Mail, MapPin, Pencil, Trash2,
  ArrowLeft, DollarSign, Beef, ClipboardList, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { maskDocument, isValidCNPJ, isValidCPF } from "@/lib/validators";

/* ── Types ─────────────────────────────────────────── */
type ContatoType = "cliente" | "fornecedor" | "funcionario" | "veterinario" | "transportador" | "contador" | "familiar" | "outro";

interface Contato {
  id: string;
  name: string;
  type: ContatoType;
  doc: string;
  phones: string[];
  email: string;
  address: string;
  notes: string;
}

const typeLabel: Record<ContatoType, string> = {
  cliente: "Cliente", fornecedor: "Fornecedor", funcionario: "Funcionário",
  veterinario: "Veterinário", transportador: "Transportador", contador: "Contador",
  familiar: "Familiar", outro: "Outro",
};

const typeColor: Record<ContatoType, string> = {
  cliente: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  fornecedor: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  funcionario: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  veterinario: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  transportador: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  contador: "bg-primary/15 text-primary border-primary/30",
  familiar: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
  outro: "bg-muted text-muted-foreground border-border",
};

/* ── Mock ──────────────────────────────────────────── */
const initial: Contato[] = [
  { id: "ct1", name: "Frigorífico ABC", type: "cliente", doc: "12.345.678/0001-90", phones: ["(34) 3322-1100"], email: "compras@frigabc.com.br", address: "Rod. BR-050 km 42, Uberlândia-MG", notes: "Compra bois gordos, pagamento em 7 dias" },
  { id: "ct2", name: "Agropecuária Boa Safra", type: "fornecedor", doc: "98.765.432/0001-10", phones: ["(34) 3311-2200", "(34) 99988-7766"], email: "vendas@boasafra.com", address: "Av. Brasil 1500, Uberaba-MG", notes: "Ração, sal mineral, medicamentos" },
  { id: "ct3", name: "Dr. Paulo Veterinário", type: "veterinario", doc: "111.222.333-44", phones: ["(34) 99777-5544"], email: "dr.paulo@vet.com", address: "", notes: "Especialista em reprodução bovina" },
  { id: "ct4", name: "Maria Aparecida", type: "funcionario", doc: "123.456.789-00", phones: ["(34) 98888-5678"], email: "", address: "Centro, Uberaba-MG", notes: "Ordenhadora — CLT" },
  { id: "ct5", name: "Transportadora Rápido", type: "transportador", doc: "55.666.777/0001-88", phones: ["(34) 3344-5566"], email: "frete@rapido.com.br", address: "Distrito Industrial, Uberlândia-MG", notes: "Transporte de gado" },
  { id: "ct6", name: "Carlos Contador", type: "contador", doc: "999.888.777-66", phones: ["(34) 3300-1122"], email: "carlos@contabil.com", address: "", notes: "Escritório contábil parceiro" },
  { id: "ct7", name: "JBS Unidade Sul", type: "cliente", doc: "33.444.555/0001-22", phones: ["(11) 4003-2222"], email: "compras@jbs.com.br", address: "Lins-SP", notes: "" },
  { id: "ct8", name: "José da Silva", type: "funcionario", doc: "", phones: ["(34) 99999-1234"], email: "", address: "Zona rural", notes: "Diarista — Vaqueiro" },
];

interface MockTxn { date: string; desc: string; amount: number; direction: "entrada" | "saida"; }
interface MockAnimalTxn { date: string; ear_tag: string; name: string; type: "compra" | "venda"; value: number; }
interface MockActivity { date: string; title: string; status: string; }

const mockTxns: Record<string, MockTxn[]> = {
  ct1: [
    { date: "2026-01-15", desc: "Venda de boi gordo — Valente", amount: 14506.67, direction: "entrada" },
    { date: "2025-10-05", desc: "Venda de boi — Guerreiro", amount: 14673.33, direction: "entrada" },
  ],
  ct2: [
    { date: "2026-03-06", desc: "Compra de ração concentrada", amount: 3850, direction: "saida" },
    { date: "2026-01-10", desc: "Sal mineral — 500kg", amount: 1200, direction: "saida" },
  ],
  ct4: [
    { date: "2026-03-01", desc: "Salário março/2026", amount: 2200, direction: "saida" },
    { date: "2026-02-01", desc: "Salário fevereiro/2026", amount: 2200, direction: "saida" },
  ],
};

const mockAnimalTxns: Record<string, MockAnimalTxn[]> = {
  ct1: [
    { date: "2026-01-15", ear_tag: "BR007", name: "Valente", type: "venda", value: 14506.67 },
    { date: "2025-10-05", ear_tag: "BR020", name: "Guerreiro", type: "venda", value: 14673.33 },
  ],
};

const mockActivities: Record<string, MockActivity[]> = {
  ct3: [
    { date: "2026-03-14", title: "Diagnóstico de prenhez — 8 vacas", status: "Pendente" },
    { date: "2026-03-07", title: "Exame reprodutivo BR010 (Boneca)", status: "Concluído" },
  ],
  ct4: [
    { date: "2026-03-08", title: "Vermifugação bezerros", status: "Concluído" },
    { date: "2026-03-18", title: "Vacina Aftosa — lote Engorda", status: "Pendente" },
  ],
};

/* ══════════════════════════════════════════════════════ */
export default function Contato() {
  const [contatos, setContatos] = useState<Contato[]>(initial);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const emptyForm: Omit<Contato, "id"> = { name: "", type: "cliente", doc: "", phones: [""], email: "", address: "", notes: "" };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => contatos.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [contatos, search, filterType]);

  const detailContato = detailId ? contatos.find((c) => c.id === detailId) : null;

  function openEdit(c: Contato) {
    setForm({ name: c.name, type: c.type, doc: c.doc, phones: [...c.phones], email: c.email, address: c.address, notes: c.notes });
    setEditId(c.id);
    setShowForm(true);
  }

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (form.doc) {
      const digits = form.doc.replace(/\D/g, "");
      const valid = digits.length === 11 ? isValidCPF(form.doc) : isValidCNPJ(form.doc);
      if (!valid) { toast.error("CPF ou CNPJ inválido — verifique os dígitos verificadores"); return; }
    }
    if (editId) {
      setContatos((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c));
      toast.success("Contato atualizado");
    } else {
      setContatos((prev) => [...prev, { ...form, id: `ct${Date.now()}` }]);
      toast.success("Contato cadastrado");
    }
    setShowForm(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    setContatos((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Contato removido");
  }

  /* ── Detail view ─── */
  if (detailContato) {
    const txns = mockTxns[detailContato.id] || [];
    const animalTxns = mockAnimalTxns[detailContato.id] || [];
    const activities = mockActivities[detailContato.id] || [];
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" />Voltar
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
            {detailContato.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{detailContato.name}</h2>
            <Badge className={`border text-xs ${typeColor[detailContato.type]}`}>{typeLabel[detailContato.type]}</Badge>
          </div>
        </div>

        {/* info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {detailContato.phones[0] && (
            <Card><CardContent className="p-3 flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{detailContato.phones.join(", ")}</CardContent></Card>
          )}
          {detailContato.email && (
            <Card><CardContent className="p-3 flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{detailContato.email}</CardContent></Card>
          )}
          {detailContato.doc && (
            <Card><CardContent className="p-3 flex items-center gap-2 text-sm font-mono">{detailContato.doc}</CardContent></Card>
          )}
        </div>

        <Tabs defaultValue="financeiro">
          <TabsList>
            <TabsTrigger value="financeiro"><DollarSign className="h-4 w-4 mr-1" />Financeiro</TabsTrigger>
            <TabsTrigger value="animais"><Beef className="h-4 w-4 mr-1" />Animais</TabsTrigger>
            <TabsTrigger value="atividades"><ClipboardList className="h-4 w-4 mr-1" />Atividades</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {txns.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(t.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{t.desc}</TableCell>
                        <TableCell className={`text-right font-mono ${t.direction === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                          {t.direction === "entrada" ? "+" : "−"} R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {txns.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sem transações</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="animais" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Brinco</TableHead><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {animalTxns.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(a.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-mono text-xs">{a.ear_tag}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{a.type === "compra" ? "Compra" : "Venda"}</Badge></TableCell>
                        <TableCell className="text-right font-mono">R$ {a.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                    {animalTxns.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem transações de animais</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atividades" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Atividade</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {activities.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(a.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{a.title}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{a.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {activities.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sem atividades</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  /* ── List view ─── */
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Contatos
          </h1>
          <p className="text-sm text-muted-foreground">{contatos.length} contatos cadastrados</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo Contato</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{c.name}</p>
                    <Badge className={`text-[10px] border ${typeColor[c.type]}`}>{typeLabel[c.type]}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {c.phones[0] && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phones[0]}</p>}
                {c.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>}
                {c.address && <p className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 flex-shrink-0" />{c.address}</p>}
              </div>
              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailId(c.id)}>
                  <ExternalLink className="h-3 w-3 mr-1" />Ver
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(c)}>
                  <Pencil className="h-3 w-3 mr-1" />Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">Nenhum contato encontrado</CardContent></Card>
        )}
      </div>

      {/* ── Form Dialog ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Contato" : "Novo Contato"}</DialogTitle>
            <DialogDescription>Preencha os dados do contato</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContatoType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>CPF/CNPJ</Label>
                <Input
                  value={form.doc}
                  onChange={(e) => setForm({ ...form, doc: maskDocument(e.target.value) })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Telefone</Label>
              <Input value={form.phones[0] || ""} onChange={(e) => setForm({ ...form, phones: [e.target.value] })} placeholder="(00) 00000-0000" />
            </div>
            <div className="grid gap-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ─── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
