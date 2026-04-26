import { useState, useMemo } from "react";
import {
  ClipboardList, Plus, Search, LayoutList, Columns3,
  Calendar, User, Flag, GripVertical, Paperclip, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────── */
type ActType = "manejo" | "manutencao" | "colheita" | "defensivo" | "plantio" | "administrativo" | "outro";
type ActStatus = "pendente" | "em_andamento" | "concluido";
type Priority = "baixa" | "media" | "alta" | "urgente";

interface Atividade {
  id: string;
  title: string;
  type: ActType;
  start_date: string;
  end_date: string;
  responsible: string;
  description: string;
  priority: Priority;
  status: ActStatus;
  linked_to: string;
  recurrent: boolean;
  frequency: string;
  attachments: string[];
}

const typeLabel: Record<ActType, string> = {
  manejo: "Manejo", manutencao: "Manutenção", colheita: "Colheita",
  defensivo: "Defensivo", plantio: "Plantio", administrativo: "Administrativo", outro: "Outro",
};

const statusLabel: Record<ActStatus, string> = {
  pendente: "Pendente", em_andamento: "Em andamento", concluido: "Concluído",
};

const statusStyle: Record<ActStatus, string> = {
  pendente: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  em_andamento: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  concluido: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

const priorityLabel: Record<Priority, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
const priorityStyle: Record<Priority, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-sky-500/15 text-sky-600",
  alta: "bg-amber-500/15 text-amber-600",
  urgente: "bg-red-500/15 text-red-600",
};

const people = ["João Silva", "Carlos Pereira", "Maria Aparecida", "Antônio Ferreira", "José da Silva"];

/* ── Mock ──────────────────────────────────────────── */
const initial: Atividade[] = [
  { id: "a1", title: "Vacina Aftosa — lote Engorda", type: "manejo", start_date: "2026-03-18", end_date: "2026-03-18", responsible: "Maria Aparecida", description: "Aplicar em 45 animais", priority: "alta", status: "pendente", linked_to: "", recurrent: false, frequency: "", attachments: [] },
  { id: "a2", title: "Manutenção cerca Pasto Sul", type: "manutencao", start_date: "2026-03-16", end_date: "2026-03-17", responsible: "Carlos Pereira", description: "Trocar 8 mourões setor 3", priority: "media", status: "em_andamento", linked_to: "Pasto Sul", recurrent: false, frequency: "", attachments: [] },
  { id: "a3", title: "Limpeza curral", type: "manejo", start_date: "2026-03-08", end_date: "2026-03-08", responsible: "José da Silva", description: "Limpeza geral + desinfecção", priority: "baixa", status: "concluido", linked_to: "Curral 1", recurrent: true, frequency: "semanal", attachments: [] },
  { id: "a4", title: "Aplicação de herbicida", type: "defensivo", start_date: "2026-03-20", end_date: "2026-03-21", responsible: "Antônio Ferreira", description: "Pasto Grande — glifosato", priority: "alta", status: "pendente", linked_to: "Pasto Grande", recurrent: false, frequency: "", attachments: [] },
  { id: "a5", title: "Pesagem mensal Confinamento", type: "manejo", start_date: "2026-03-20", end_date: "2026-03-20", responsible: "Carlos Pereira", description: "12 animais", priority: "media", status: "pendente", linked_to: "", recurrent: true, frequency: "mensal", attachments: [] },
  { id: "a6", title: "Plantio de capim Tifton", type: "plantio", start_date: "2026-03-25", end_date: "2026-03-28", responsible: "Antônio Ferreira", description: "Renovação Pasto Leste — 10 ha", priority: "media", status: "pendente", linked_to: "Pasto Leste", recurrent: false, frequency: "", attachments: [] },
  { id: "a7", title: "Reunião cooperativa", type: "administrativo", start_date: "2026-03-21", end_date: "2026-03-21", responsible: "João Silva", description: "Assembleia semestral", priority: "baixa", status: "pendente", linked_to: "", recurrent: false, frequency: "", attachments: [] },
  { id: "a8", title: "Vermifugação bezerros", type: "manejo", start_date: "2026-03-12", end_date: "2026-03-12", responsible: "Maria Aparecida", description: "28 bezerros — Ivermectina", priority: "alta", status: "concluido", linked_to: "", recurrent: false, frequency: "", attachments: [] },
];

type ViewMode = "lista" | "kanban";
const kanbanCols: ActStatus[] = ["pendente", "em_andamento", "concluido"];

/* ══════════════════════════════════════════════════════ */
export default function Atividades() {
  const [atividades, setAtividades] = useState<Atividade[]>(initial);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [showForm, setShowForm] = useState(false);

  const emptyForm: Omit<Atividade, "id"> = {
    title: "", type: "manejo", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "",
    responsible: "", description: "", priority: "media", status: "pendente",
    linked_to: "", recurrent: false, frequency: "", attachments: [],
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => atividades.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterPriority !== "all" && a.priority !== filterPriority) return false;
    return true;
  }), [atividades, search, filterType, filterPriority]);

  function handleSave() {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    setAtividades((prev) => [...prev, { ...form, id: `a${Date.now()}` }]);
    setShowForm(false);
    setForm(emptyForm);
    toast.success("Atividade criada");
  }

  function moveStatus(id: string, newStatus: ActStatus) {
    setAtividades((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
  }

  const statusCount = (s: ActStatus) => filtered.filter((a) => a.status === s).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Atividades
          </h1>
          <p className="text-sm text-muted-foreground">
            {statusCount("pendente")} pendentes • {statusCount("em_andamento")} em andamento • {statusCount("concluido")} concluídas
          </p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" />Nova Atividade
        </Button>
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(typeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(priorityLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button variant={viewMode === "lista" ? "default" : "ghost"} size="sm" className="text-xs gap-1" onClick={() => setViewMode("lista")}>
            <LayoutList className="h-3.5 w-3.5" />Lista
          </Button>
          <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" className="text-xs gap-1" onClick={() => setViewMode("kanban")}>
            <Columns3 className="h-3.5 w-3.5" />Kanban
          </Button>
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────── */}
      {viewMode === "lista" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{a.title}</span>
                        {a.recurrent && <RotateCcw className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        {a.linked_to && <span className="block text-[11px] text-muted-foreground">{a.linked_to}</span>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{typeLabel[a.type]}</Badge></TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(a.start_date + "T12:00").toLocaleDateString("pt-BR")}
                      {a.end_date && a.end_date !== a.start_date && ` — ${new Date(a.end_date + "T12:00").toLocaleDateString("pt-BR")}`}
                    </TableCell>
                    <TableCell className="text-sm">{a.responsible || "—"}</TableCell>
                    <TableCell><Badge className={`text-[10px] border ${priorityStyle[a.priority]}`}>{priorityLabel[a.priority]}</Badge></TableCell>
                    <TableCell>
                      <Select value={a.status} onValueChange={(v) => moveStatus(a.id, v as ActStatus)}>
                        <SelectTrigger className={`h-7 text-xs w-32 border ${statusStyle[a.status]}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {kanbanCols.map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma atividade encontrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── KANBAN VIEW ───────────────────── */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanCols.map((col) => {
            const items = filtered.filter((a) => a.status === col);
            return (
              <div key={col} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`border ${statusStyle[col]}`}>{statusLabel[col]}</Badge>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/40 border border-dashed border-border">
                  {items.map((a) => (
                    <Card key={a.id} className="cursor-default">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground leading-tight">{a.title}</p>
                          <Badge className={`text-[9px] border flex-shrink-0 ${priorityStyle[a.priority]}`}>
                            {priorityLabel[a.priority]}
                          </Badge>
                        </div>
                        {a.linked_to && <p className="text-[11px] text-muted-foreground">{a.linked_to}</p>}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(a.start_date + "T12:00").toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.responsible || "—"}</span>
                        </div>
                        {/* move buttons */}
                        <div className="flex gap-1">
                          {col !== "pendente" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => moveStatus(a.id, kanbanCols[kanbanCols.indexOf(col) - 1])}>
                              ← {statusLabel[kanbanCols[kanbanCols.indexOf(col) - 1]]}
                            </Button>
                          )}
                          {col !== "concluido" && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 ml-auto" onClick={() => moveStatus(a.id, kanbanCols[kanbanCols.indexOf(col) + 1])}>
                              {statusLabel[kanbanCols[kanbanCols.indexOf(col) + 1]]} →
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Form Dialog ───────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
            <DialogDescription>Preencha os dados da atividade</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(priorityLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Data início</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Data fim previsto</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Responsável</Label>
              <Select value={form.responsible} onValueChange={(v) => setForm({ ...form, responsible: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{people.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-1.5">
              <Label>Vincular a (pasto, animal, etc.)</Label>
              <Input value={form.linked_to} onChange={(e) => setForm({ ...form, linked_to: e.target.value })} placeholder="Ex: Pasto Norte, BR001…" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.recurrent} onCheckedChange={(v) => setForm({ ...form, recurrent: v })} />
              <Label>Recorrente</Label>
              {form.recurrent && (
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Frequência" /></SelectTrigger>
                  <SelectContent>
                    {["diária", "semanal", "quinzenal", "mensal", "trimestral"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
