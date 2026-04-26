import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Plus, Search, Phone, Mail, MapPin, Pencil, Trash2,
  ExternalLink, CheckCircle, XCircle, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  mockParceiros, tipoLabel, tipoColor, especialidades, filterTabs,
  type Parceiro, type ParceiroTipo,
} from "@/data/parceiros-mock";
import { cleanCnpj, isValidCNPJ, formatCNPJ } from "@/lib/validators";

const emptyForm: Omit<Parceiro, "id"> = {
  name: "", tipo: "fornecedor", especialidade: "", doc: "",
  phones: [""], email: "", city: "", state: "", address: "",
  crmv: "", anac_sisant: "", notes: "", active: true,
};

const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function Parceiros() {
  const navigate = useNavigate();
  const [parceiros, setParceiros] = useState<Parceiro[]>(mockParceiros);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"idle" | "success" | "error">("idle");

  // Máscara progressiva — suporta formato numérico legado e alfanumérico (jul/2026)
  const maskCnpj = (raw: string): string => {
    const c = cleanCnpj(raw).slice(0, 14);
    if (c.length <= 2) return c;
    if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
    if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
    if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
  };

  async function handleCnpjSearch() {
    const clean = cleanCnpj(form.doc);
    if (!isValidCNPJ(form.doc)) {
      toast.error("CNPJ inválido — verifique os dígitos verificadores");
      return;
    }
    // BrasilAPI aceita apenas CNPJs numéricos (formato legado)
    if (!/^\d{14}$/.test(clean)) {
      toast.info("Busca automática disponível apenas para CNPJs numéricos. O CNPJ alfanumérico foi validado com sucesso.");
      setCnpjStatus("success");
      return;
    }
    setCnpjLoading(true);
    setCnpjStatus("idle");
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error("not_found");
      const data = await res.json();
      const parts = [data.logradouro, data.numero, data.complemento, data.bairro].filter(Boolean);
      setForm(prev => ({
        ...prev,
        name: data.razao_social || prev.name,
        doc: formatCNPJ(clean),
        address: parts.join(", "),
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
        phones: data.ddd_telefone_1 ? [`(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}`] : prev.phones,
        email: data.email && data.email.trim() ? data.email.toLowerCase() : prev.email,
      }));
      setCnpjStatus("success");
      toast.success("Dados do CNPJ preenchidos automaticamente");
    } catch {
      setCnpjStatus("error");
      toast.error("CNPJ não encontrado ou inválido");
    } finally {
      setCnpjLoading(false);
    }
  }

  const filtered = useMemo(() => parceiros.filter((p) => {
    if (activeTab !== "todos" && p.tipo !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.doc.includes(q) || p.city.toLowerCase().includes(q);
    }
    return true;
  }), [parceiros, search, activeTab]);

  function openNew() { setForm(emptyForm); setEditId(null); setCnpjStatus("idle"); setShowForm(true); }

  function openEdit(p: Parceiro) {
    setForm({
      name: p.name, tipo: p.tipo, especialidade: p.especialidade, doc: p.doc,
      phones: [...p.phones], email: p.email, city: p.city, state: p.state,
      address: p.address, crmv: p.crmv, anac_sisant: p.anac_sisant,
      notes: p.notes, active: p.active,
    });
    setEditId(p.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error("Nome / Razão Social é obrigatório"); return; }
    if (form.doc && !isValidCNPJ(form.doc)) { toast.error("CNPJ inválido — verifique os dígitos verificadores"); return; }
    if (editId) {
      setParceiros((prev) => prev.map((p) => p.id === editId ? { ...p, ...form } : p));
      toast.success("Parceiro atualizado");
    } else {
      setParceiros((prev) => [...prev, { ...form, id: `p${Date.now()}` }]);
      toast.success("Parceiro cadastrado");
    }
    setShowForm(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    setParceiros((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Parceiro removido");
  }

  const hasEspecialidade = !!especialidades[form.tipo];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Parceiros & Fornecedores
          </h1>
          <p className="text-sm text-muted-foreground">{parceiros.length} cadastrados</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Parceiro</Button>
      </div>

      {/* Tabs + Search */}
      <div className="space-y-3">
        <ScrollArea className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap">
              {filterTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CNPJ ou cidade…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className={`hover:shadow-md transition-shadow ${!p.active ? "opacity-60" : ""}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <Badge className={`text-[10px] border ${tipoColor[p.tipo]}`}>{tipoLabel[p.tipo]}</Badge>
                      {p.especialidade && <Badge variant="outline" className="text-[10px]">{p.especialidade}</Badge>}
                      {!p.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {p.phones[0] && <p className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{p.phones.join(", ")}</p>}
                {p.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{p.email}</p>}
                {(p.city || p.state) && <p className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{[p.city, p.state].filter(Boolean).join(" — ")}</p>}
                {p.doc && <p className="font-mono text-[11px]">{p.doc}</p>}
              </div>

              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/contato/parceiros/${p.id}`)}>
                  <ExternalLink className="h-3 w-3 mr-1" /> Detalhes
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(p)}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">Nenhum parceiro encontrado</CardContent></Card>
        )}
      </div>

      {/* ── Form Dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle>
            <DialogDescription>Preencha os dados do parceiro ou fornecedor</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-1.5">
              <Label>Nome / Razão Social *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Agropecuária Boa Safra Ltda" />
            </div>

            {/* Tipo + Especialidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as ParceiroTipo, especialidade: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {hasEspecialidade && (
                <div className="grid gap-1.5">
                  <Label>Especialidade / Categoria</Label>
                  <Select value={form.especialidade} onValueChange={(v) => setForm({ ...form, especialidade: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {especialidades[form.tipo].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Doc + CNPJ Search */}
            <div className="grid gap-1.5">
              <Label>CPF ou CNPJ</Label>
              <div className="flex gap-2">
                <Input
                  value={form.doc}
                  onChange={(e) => {
                    setForm({ ...form, doc: maskCnpj(e.target.value) });
                    setCnpjStatus("idle");
                  }}
                  placeholder="00.000.000/0001-00"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={cnpjLoading || !isValidCNPJ(form.doc)}
                  onClick={handleCnpjSearch}
                >
                  {cnpjLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar CNPJ
                </Button>
              </div>
              {cnpjStatus === "success" && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Dados preenchidos automaticamente — verifique antes de salvar
                </p>
              )}
              {cnpjStatus === "error" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> CNPJ não encontrado ou inválido
                </p>
              )}
            </div>

            {/* Phones + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Telefone(s)</Label>
                <Input value={form.phones[0] || ""} onChange={(e) => setForm({ ...form, phones: [e.target.value] })} placeholder="(00) 00000-0000" />
              </div>
              <div className="grid gap-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            {/* City + State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Estado</Label>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{estados.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-1.5">
              <Label>Endereço completo</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            {/* CRMV — only Veterinário */}
            {form.tipo === "veterinario" && (
              <div className="grid gap-1.5">
                <Label>CRMV</Label>
                <Input value={form.crmv} onChange={(e) => setForm({ ...form, crmv: e.target.value })} placeholder="CRMV-UF 00000" />
              </div>
            )}

            {/* ANAC / SISANT — only Serviços Aéreos */}
            {form.tipo === "servicos_aereos" && (
              <div className="grid gap-1.5">
                <Label>ANAC / SISANT (Registro de Operador de Drone)</Label>
                <Input value={form.anac_sisant} onChange={(e) => setForm({ ...form, anac_sisant: e.target.value })} placeholder="ANAC-OP-XXXX-XXXX" />
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
              <Label className="cursor-pointer">{form.active ? "Ativo" : "Inativo"}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir parceiro?</AlertDialogTitle>
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
