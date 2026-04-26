import { useState, useMemo } from "react";
import { servicos as initialServicos, pets, clientes, type Servico } from "@/lib/mockData";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, Eye, Pencil, Trash2, LayoutGrid, List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ServicosPage() {
  const [servicos, setServicos] = useState(initialServicos);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [selected, setSelected] = useState<Servico | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ tipo: "Banho" as Servico["tipo"], petId: "", data: "", hora: "09:00", preco: "60" });

  const filtered = servicos.filter(s => {
    const matchSearch = s.petNome.toLowerCase().includes(search.toLowerCase()) ||
      s.clienteNome.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === "Todos" || s.tipo === tipoFilter;
    return matchSearch && matchTipo;
  });

  const agendamentosPorDia = useMemo(() => {
    const map: Record<string, Servico[]> = {};
    servicos.forEach(s => {
      if (!map[s.data]) map[s.data] = [];
      map[s.data].push(s);
    });
    return map;
  }, [servicos]);

  const selectedDateStr = calendarDate ? calendarDate.toISOString().split("T")[0] : "";
  const agendamentosDoDia = agendamentosPorDia[selectedDateStr] || [];

  const datesWithEvents = useMemo(() => {
    return Object.keys(agendamentosPorDia).map(d => new Date(d + "T12:00:00"));
  }, [agendamentosPorDia]);

  const handleNewSubmit = () => {
    const pet = pets.find(p => p.id === newForm.petId);
    if (!pet) { toast.error("Selecione um pet"); return; }
    if (!newForm.data) { toast.error("Informe a data"); return; }
    const novo: Servico = {
      id: `srv-${Date.now()}`,
      tipo: newForm.tipo,
      petId: pet.id,
      petNome: pet.nome,
      clienteNome: pet.clienteNome,
      data: newForm.data,
      hora: newForm.hora,
      preco: Number(newForm.preco),
      status: "Agendado",
    };
    setServicos(prev => [novo, ...prev]);
    setShowNew(false);
    setNewForm({ tipo: "Banho", petId: "", data: "", hora: "09:00", preco: "60" });
    toast.success("Agendamento criado!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por pet ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Todos", "Banho", "Tosa", "Vacina", "Consulta", "Cortar Unhas", "Banho e Tosa"].map(t => (
            <Button key={t} variant={tipoFilter === t ? "default" : "outline"} size="sm" onClick={() => setTipoFilter(t)} className="text-xs">{t}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "calendar" ? "default" : "outline"} size="sm" onClick={() => setViewMode("calendar")}><CalendarDays className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />Novo Agendamento</Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} agendamentos</p>

      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              className="pointer-events-auto"
              modifiers={{ hasEvent: datesWithEvents }}
              modifiersClassNames={{ hasEvent: "bg-primary/20 font-bold text-primary" }}
            />
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-bold text-foreground">
                {calendarDate ? calendarDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "Selecione uma data"}
              </h3>
              <p className="text-xs text-muted-foreground">{agendamentosDoDia.length} agendamento(s)</p>
            </div>
            <div className="divide-y divide-border">
              {agendamentosDoDia.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum agendamento nesta data</p>
              )}
              {agendamentosDoDia.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelected(s)}>
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-foreground">{s.hora}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.petNome} — {s.tipo}</p>
                      <p className="text-xs text-muted-foreground">{s.clienteNome} • R$ {s.preco.toFixed(2)}</p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pet</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data/Hora</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Preço</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="data-table-row" onClick={() => setSelected(s)}>
                    <td className="px-4 py-3 font-medium text-foreground">{s.petNome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.clienteNome}</td>
                    <td className="px-4 py-3 text-foreground">{s.tipo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.data} {s.hora}</td>
                    <td className="px-4 py-3 font-semibold text-foreground hidden md:table-cell">R$ {s.preco.toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => { e.stopPropagation(); setSelected(s); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => e.stopPropagation()}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-md hover:bg-destructive/10" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Detalhes do Agendamento</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Pet</p><p className="font-medium text-foreground">{selected.petNome}</p></div>
                <div><p className="text-muted-foreground">Cliente</p><p className="font-medium text-foreground">{selected.clienteNome}</p></div>
                <div><p className="text-muted-foreground">Tipo</p><p className="font-medium text-foreground">{selected.tipo}</p></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-muted-foreground">Data</p><p className="font-medium text-foreground">{selected.data}</p></div>
                <div><p className="text-muted-foreground">Hora</p><p className="font-medium text-foreground">{selected.hora}</p></div>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground">Preço</p>
                <p className="text-xl font-bold font-heading text-foreground">R$ {selected.preco.toFixed(2)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newForm.tipo} onValueChange={v => setNewForm(f => ({ ...f, tipo: v as Servico["tipo"], preco: v === "Banho" ? "60" : v === "Tosa" ? "80" : v === "Vacina" ? "120" : v === "Consulta" ? "150" : v === "Cortar Unhas" ? "30" : "120" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Banho", "Tosa", "Vacina", "Consulta", "Cortar Unhas", "Banho e Tosa"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pet</Label>
              <Select value={newForm.petId} onValueChange={v => setNewForm(f => ({ ...f, petId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione um pet" /></SelectTrigger>
                <SelectContent>
                  {pets.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} ({p.clienteNome})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newForm.data} onChange={e => setNewForm(f => ({ ...f, data: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={newForm.hora} onChange={e => setNewForm(f => ({ ...f, hora: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" value={newForm.preco} onChange={e => setNewForm(f => ({ ...f, preco: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleNewSubmit}>Criar Agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
