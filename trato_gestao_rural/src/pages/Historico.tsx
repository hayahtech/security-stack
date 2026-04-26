import { useState, useMemo } from "react";
import {
  History, DollarSign, Weight, ArrowRightLeft, Stethoscope, Baby,
  UserPlus, Pencil, Search, Undo2, ExternalLink, SlidersHorizontal,
  CalendarDays, LayoutList, Layers, Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format, isWithinInterval, parseISO, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────── */
type EventType =
  | "transacao"
  | "pesagem"
  | "movimentacao"
  | "tratamento"
  | "reproducao"
  | "cadastro"
  | "modificacao";

interface HistEvent {
  id: string;
  type: EventType;
  description: string;
  datetime: string;
  user: string;
  link?: string;
}

const eventMeta: Record<EventType, { label: string; icon: React.ReactNode; color: string }> = {
  transacao:    { label: "Transação Financeira", icon: <DollarSign className="h-4 w-4" />,     color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  pesagem:      { label: "Pesagem",              icon: <Weight className="h-4 w-4" />,          color: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  movimentacao: { label: "Movimentação de Pasto", icon: <ArrowRightLeft className="h-4 w-4" />, color: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  tratamento:   { label: "Tratamento",           icon: <Stethoscope className="h-4 w-4" />,    color: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  reproducao:   { label: "Evento Reprodutivo",   icon: <Baby className="h-4 w-4" />,           color: "bg-rose-500/15 text-rose-600 border-rose-500/30" },
  cadastro:     { label: "Cadastro",             icon: <UserPlus className="h-4 w-4" />,       color: "bg-primary/15 text-primary border-primary/30" },
  modificacao:  { label: "Modificação",          icon: <Pencil className="h-4 w-4" />,         color: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
};

/* ── Mock data ─────────────────────────────────────── */
const mockEvents: HistEvent[] = [
  { id: "h1",  type: "transacao",    description: "Receita registrada: Venda de leite — R$ 4.200,00", datetime: "2026-03-08T14:32:00", user: "João Silva", link: "/financeiro/fluxo-de-caixa" },
  { id: "h2",  type: "pesagem",      description: "Pesagem registrada para animal BR001 (Estrela) — 482 kg", datetime: "2026-03-08T10:15:00", user: "Carlos Pereira", link: "/rebanho/pesagens" },
  { id: "h3",  type: "movimentacao", description: "Animal BR006 (Pintado) movido de Pasto Norte → Pasto Sul", datetime: "2026-03-08T08:45:00", user: "João Silva", link: "/rebanho/movimentacoes" },
  { id: "h4",  type: "tratamento",   description: "Vacina Aftosa aplicada em 45 animais do lote Engorda", datetime: "2026-03-07T16:20:00", user: "Maria Aparecida", link: "/rebanho/tratamentos" },
  { id: "h5",  type: "reproducao",   description: "Diagnóstico de prenhez positivo — BR010 (Boneca), 62 dias", datetime: "2026-03-07T11:00:00", user: "Dr. Paulo Vet", link: "/rebanho/reproducao" },
  { id: "h6",  type: "cadastro",     description: "Novo animal cadastrado: BR012 (Faísca), Nelore, Macho", datetime: "2026-03-07T09:30:00", user: "João Silva", link: "/rebanho/animais" },
  { id: "h7",  type: "transacao",    description: "Despesa registrada: Ração concentrada — R$ 3.850,00", datetime: "2026-03-06T17:10:00", user: "João Silva", link: "/financeiro/fluxo-de-caixa" },
  { id: "h8",  type: "modificacao",  description: "Dados do pasto 'Pasto Norte' atualizados — área corrigida para 45ha", datetime: "2026-03-06T15:00:00", user: "João Silva", link: "/pastos" },
  { id: "h9",  type: "pesagem",      description: "Pesagem em lote registrada: 12 animais do Confinamento", datetime: "2026-03-06T08:20:00", user: "Carlos Pereira", link: "/rebanho/pesagens" },
  { id: "h10", type: "transacao",    description: "Pagamento de diária registrado: José da Silva — R$ 120,00", datetime: "2026-03-05T18:00:00", user: "João Silva", link: "/funcionarios" },
  { id: "h11", type: "reproducao",   description: "IATF realizada em BR003 (Mimosa) — sêmen Angus", datetime: "2026-03-05T10:30:00", user: "Dr. Paulo Vet", link: "/rebanho/reproducao" },
  { id: "h12", type: "tratamento",   description: "Vermifugação aplicada em BR005 (Branca) — Ivermectina", datetime: "2026-03-04T14:45:00", user: "Maria Aparecida", link: "/rebanho/tratamentos" },
  { id: "h13", type: "movimentacao", description: "3 animais movidos de Curral 1 → Piquete Maternidade", datetime: "2026-03-04T07:50:00", user: "Carlos Pereira", link: "/rebanho/movimentacoes" },
  { id: "h14", type: "cadastro",     description: "Novo funcionário cadastrado: Antônio Ferreira (Tratorista)", datetime: "2026-03-03T09:00:00", user: "João Silva", link: "/funcionarios" },
  { id: "h15", type: "transacao",    description: "Receita registrada: Venda de 2 bezerros — R$ 8.600,00", datetime: "2026-03-02T16:40:00", user: "João Silva", link: "/financeiro/fluxo-de-caixa" },
  { id: "h16", type: "pesagem",      description: "Pesagem registrada para animal BR009 (Ligeiro) — 615 kg", datetime: "2026-03-01T09:10:00", user: "Carlos Pereira", link: "/rebanho/pesagens" },
  { id: "h17", type: "modificacao",  description: "Preço da diária de José da Silva atualizado para R$ 130,00", datetime: "2026-02-28T11:20:00", user: "João Silva", link: "/funcionarios" },
  { id: "h18", type: "tratamento",   description: "Tratamento de casco realizado em BR004 (Relâmpago)", datetime: "2026-02-27T14:00:00", user: "Dr. Paulo Vet", link: "/rebanho/tratamentos" },
];

const allUsers = [...new Set(mockEvents.map((e) => e.user))];
const allTypes = Object.keys(eventMeta) as EventType[];

type GroupMode = "cronologico" | "tipo" | "dia";

/* ══════════════════════════════════════════════════════ */
export default function Historico() {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([...allTypes]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("cronologico");
  const [undone, setUndone] = useState<Set<string>>(new Set());

  const toggleType = (t: EventType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const filtered = useMemo(() => {
    return mockEvents.filter((e) => {
      if (undone.has(e.id)) return false;
      if (!selectedTypes.includes(e.type)) return false;
      if (selectedUser !== "all" && e.user !== selectedUser) return false;
      if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom || dateTo) {
        const d = parseISO(e.datetime);
        const from = dateFrom ? parseISO(dateFrom) : new Date("2000-01-01");
        const to = dateTo ? parseISO(dateTo + "T23:59:59") : new Date("2099-12-31");
        if (!isWithinInterval(d, { start: from, end: to })) return false;
      }
      return true;
    });
  }, [search, selectedTypes, selectedUser, dateFrom, dateTo, undone]);

  const handleUndo = (ev: HistEvent) => {
    setUndone((prev) => new Set(prev).add(ev.id));
    toast.success(`Ação desfeita: ${ev.description.substring(0, 50)}…`);
  };

  const now = new Date();

  /* grouping */
  const grouped = useMemo(() => {
    if (groupMode === "tipo") {
      const map: Record<string, HistEvent[]> = {};
      filtered.forEach((e) => {
        const key = eventMeta[e.type].label;
        (map[key] ||= []).push(e);
      });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }
    if (groupMode === "dia") {
      const map: Record<string, HistEvent[]> = {};
      filtered.forEach((e) => {
        const key = format(parseISO(e.datetime), "yyyy-MM-dd");
        (map[key] ||= []).push(e);
      });
      return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
    }
    return [["all", filtered]] as [string, HistEvent[]][];
  }, [filtered, groupMode]);

  function renderEvent(ev: HistEvent) {
    const meta = eventMeta[ev.type];
    const dt = parseISO(ev.datetime);
    const canUndo = differenceInHours(now, dt) <= 24;
    return (
      <div key={ev.id} className="flex gap-3 py-3">
        {/* icon */}
        <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center border ${meta.color}`}>
          {meta.icon}
        </div>
        {/* content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{ev.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(dt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </span>
            <span className="text-xs text-muted-foreground">{ev.user}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{meta.label}</Badge>
          </div>
        </div>
        {/* actions */}
        <div className="flex-shrink-0 flex items-start gap-1">
          {ev.link && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={ev.link}><ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
          )}
          {canUndo && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleUndo(ev)}>
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Histórico
        </h1>
        <p className="text-sm text-muted-foreground">{filtered.length} eventos encontrados</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Filtros</span></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-1">
              <Label className="text-xs">Busca</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
            </div>

            {/* Type multi-select */}
            <div className="space-y-1">
              <Label className="text-xs">Tipo de evento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-sm font-normal">
                    {selectedTypes.length === allTypes.length ? "Todos" : `${selectedTypes.length} selecionados`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 space-y-2" align="start">
                  {allTypes.map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selectedTypes.includes(t)} onCheckedChange={() => toggleType(t)} />
                      <span className="text-sm">{eventMeta[t].label}</span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* User */}
            <div className="space-y-1">
              <Label className="text-xs">Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {allUsers.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">De</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Até</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {([
          { value: "cronologico" as GroupMode, icon: <LayoutList className="h-3.5 w-3.5" />, label: "Cronológico" },
          { value: "tipo" as GroupMode, icon: <Layers className="h-3.5 w-3.5" />, label: "Por Tipo" },
          { value: "dia" as GroupMode, icon: <CalendarDays className="h-3.5 w-3.5" />, label: "Por Dia" },
        ]).map((opt) => (
          <Button
            key={opt.value}
            variant={groupMode === opt.value ? "default" : "ghost"}
            size="sm"
            className="text-xs gap-1"
            onClick={() => setGroupMode(opt.value)}
          >
            {opt.icon}{opt.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {grouped.map(([groupKey, events]) => (
        <Card key={groupKey}>
          {groupMode !== "cronologico" && (
            <div className="px-4 pt-4 pb-1">
              <h3 className="text-sm font-semibold text-foreground">
                {groupMode === "dia" ? format(parseISO(groupKey), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : groupKey}
              </h3>
            </div>
          )}
          <CardContent className="px-4 pb-2 divide-y divide-border">
            {events.map(renderEvent)}
          </CardContent>
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhum evento encontrado com os filtros aplicados
          </CardContent>
        </Card>
      )}
    </div>
  );
}
