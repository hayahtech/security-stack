import { useState, useMemo } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, ExternalLink,
  Filter, X, Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameDay, parseISO, isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────── */
type CalEventType = "conta_pagar" | "recebimento" | "vacina" | "pesagem" | "reproducao" | "compromisso" | "atividade";

interface CalEvent {
  id: string;
  type: CalEventType;
  title: string;
  date: string;       // yyyy-MM-dd
  time?: string;       // HH:mm
  description: string;
  link?: string;
  reminder_days?: number;
}

const typeMeta: Record<CalEventType, { label: string; dot: string; badge: string }> = {
  conta_pagar:  { label: "Conta a Pagar",       dot: "bg-red-500",     badge: "bg-red-500/15 text-red-600 border-red-500/30" },
  recebimento:  { label: "Recebimento",          dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  vacina:       { label: "Vacina",               dot: "bg-violet-500",  badge: "bg-violet-500/15 text-violet-600 border-violet-500/30" },
  pesagem:      { label: "Pesagem",              dot: "bg-sky-500",     badge: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  reproducao:   { label: "Evento Reprodutivo",   dot: "bg-amber-500",   badge: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  compromisso:  { label: "Compromisso",          dot: "bg-primary",     badge: "bg-primary/15 text-primary border-primary/30" },
  atividade:    { label: "Atividade",            dot: "bg-muted-foreground", badge: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
};

const allTypes = Object.keys(typeMeta) as CalEventType[];

/* ── Mock ──────────────────────────────────────────── */
const mockEvents: CalEvent[] = [
  { id: "c1",  type: "conta_pagar",  title: "Parcela ração concentrada",       date: "2026-03-10", description: "3/6 — R$ 1.200,00", link: "/financeiro/pagar-receber" },
  { id: "c2",  type: "conta_pagar",  title: "Energia elétrica",                date: "2026-03-15", description: "Fatura mensal — R$ 680,00", link: "/financeiro/pagar-receber" },
  { id: "c3",  type: "recebimento",  title: "Venda de leite — Laticínio ABC",  date: "2026-03-12", description: "Previsão R$ 4.200,00", link: "/financeiro/pagar-receber" },
  { id: "c4",  type: "recebimento",  title: "Venda de bezerros",               date: "2026-03-25", description: "5 bezerros — R$ 12.500,00", link: "/financeiro/pagar-receber" },
  { id: "c5",  type: "vacina",       title: "Vacina Aftosa — lote Engorda",    date: "2026-03-18", time: "08:00", description: "45 animais", link: "/rebanho/tratamentos" },
  { id: "c6",  type: "vacina",       title: "Vermifugação — lote Cria",        date: "2026-03-22", time: "07:30", description: "28 bezerros", link: "/rebanho/tratamentos" },
  { id: "c7",  type: "pesagem",      title: "Pesagem mensal Confinamento",     date: "2026-03-20", time: "06:00", description: "12 animais", link: "/rebanho/pesagens" },
  { id: "c8",  type: "reproducao",   title: "Parto previsto — BR010 (Boneca)", date: "2026-03-28", description: "Gestação ~280 dias", link: "/rebanho/reproducao" },
  { id: "c9",  type: "reproducao",   title: "Diagnóstico de prenhez — lote",   date: "2026-03-14", time: "09:00", description: "8 vacas para toque", link: "/rebanho/reproducao" },
  { id: "c10", type: "compromisso",  title: "Visita do veterinário",           date: "2026-03-14", time: "10:00", description: "Dr. Paulo — exames reprodutivos", reminder_days: 1 },
  { id: "c11", type: "atividade",    title: "Manutenção cerca Pasto Sul",      date: "2026-03-16", description: "Trocar mourões setor 3", link: "/atividades" },
  { id: "c12", type: "atividade",    title: "Limpeza do curral",               date: "2026-03-08", description: "Limpeza geral + desinfecção" },
  { id: "c13", type: "conta_pagar",  title: "Salário — Maria Aparecida",       date: "2026-03-05", description: "R$ 2.200,00", link: "/funcionarios" },
  { id: "c14", type: "compromisso",  title: "Reunião cooperativa",             date: "2026-03-21", time: "14:00", description: "Assembleia semestral", reminder_days: 2 },
  { id: "c15", type: "pesagem",      title: "Pesagem lote Recria",             date: "2026-04-03", time: "06:30", description: "15 animais", link: "/rebanho/pesagens" },
  { id: "c16", type: "recebimento",  title: "Venda de leite — abril",          date: "2026-04-10", description: "Previsão R$ 4.500,00" },
  { id: "c17", type: "vacina",       title: "Brucelose — novilhas",            date: "2026-04-05", time: "08:00", description: "12 novilhas 3-8 meses" },
];

type ViewMode = "mensal" | "semanal" | "lista";

/* ══════════════════════════════════════════════════════ */
export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [view, setView] = useState<ViewMode>("mensal");
  const [visibleTypes, setVisibleTypes] = useState<CalEventType[]>([...allTypes]);
  const [events, setEvents] = useState<CalEvent[]>(mockEvents);

  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDate, setAddDate] = useState("");

  const emptyForm = { title: "", date: "", time: "", type: "compromisso" as CalEventType, description: "", reminder_days: 0 };
  const [form, setForm] = useState(emptyForm);

  const toggleType = (t: CalEventType) =>
    setVisibleTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const filteredEvents = useMemo(() => events.filter((e) => visibleTypes.includes(e.type)), [events, visibleTypes]);

  const eventsOnDay = (day: Date) => filteredEvents.filter((e) => isSameDay(parseISO(e.date), day));

  /* navigation */
  const prev = () => setCurrentDate((d) => view === "mensal" ? subMonths(d, 1) : subWeeks(d, 1));
  const next = () => setCurrentDate((d) => view === "mensal" ? addMonths(d, 1) : addWeeks(d, 1));

  /* calendar grid days */
  const calendarDays = useMemo(() => {
    if (view === "mensal") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { locale: ptBR });
      const end = endOfWeek(monthEnd, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate, view]);

  /* list view: next 30 days */
  const listDays = useMemo(() => {
    const start = new Date(2026, 2, 1);
    const end = new Date(2026, 3, 1);
    return eachDayOfInterval({ start, end })
      .map((d) => ({ day: d, events: eventsOnDay(d) }))
      .filter((d) => d.events.length > 0);
  }, [filteredEvents]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 6); // 6-19

  function openAddDialog(dateStr: string) {
    setForm({ ...emptyForm, date: dateStr });
    setAddDate(dateStr);
    setShowAddDialog(true);
  }

  function handleSaveEvent() {
    if (!form.title.trim() || !form.date) { toast.error("Título e data são obrigatórios"); return; }
    const newEv: CalEvent = { id: `c${Date.now()}`, ...form };
    setEvents((prev) => [...prev, newEv]);
    setShowAddDialog(false);
    setForm(emptyForm);
    toast.success("Compromisso adicionado");
  }

  const weekDayHeaders = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Calendário
          </h1>
        </div>
        <Button size="sm" onClick={() => openAddDialog(format(new Date(), "yyyy-MM-dd"))}>
          <Plus className="h-4 w-4 mr-1" />Novo Compromisso
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold min-w-[180px] text-center capitalize">
            {view === "mensal"
              ? format(currentDate, "MMMM yyyy", { locale: ptBR })
              : `Semana de ${format(calendarDays[0], "dd/MM")} a ${format(calendarDays[6], "dd/MM")}`}
          </span>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(["mensal", "semanal", "lista"] as ViewMode[]).map((v) => (
            <Button key={v} variant={view === v ? "default" : "ghost"} size="sm" className="text-xs capitalize" onClick={() => setView(v)}>
              {v}
            </Button>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3">
            {allTypes.map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs">
                <Checkbox checked={visibleTypes.includes(t)} onCheckedChange={() => toggleType(t)} />
                <span className={`h-2.5 w-2.5 rounded-full ${typeMeta[t].dot}`} />
                <span>{typeMeta[t].label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── MENSAL ────────────────────────── */}
      {view === "mensal" && (
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-7">
              {weekDayHeaders.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 border-b">{d}</div>
              ))}
              {calendarDays.map((day) => {
                const dayEvents = eventsOnDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[90px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-accent/40 ${!isCurrentMonth ? "opacity-40" : ""}`}
                    onClick={() => { if (dayEvents.length === 0) openAddDialog(format(day, "yyyy-MM-dd")); }}
                  >
                    <span className={`text-xs font-medium inline-flex h-6 w-6 items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                      {day.getDate()}
                    </span>
                    <div className="space-y-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <button
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${typeMeta[ev.type].badge}`}
                        >
                          {ev.time && <span className="font-mono mr-0.5">{ev.time}</span>}
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} mais</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SEMANAL ───────────────────────── */}
      {view === "semanal" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[700px]">
              {/* header */}
              <div className="border-b border-r" />
              {calendarDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className="text-center py-2 border-b border-r">
                    <span className="text-[11px] text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</span>
                    <span className={`block text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</span>
                  </div>
                );
              })}
              {/* rows */}
              {hours.map((h) => (
                <div key={h} className="contents">
                  <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-r h-12">{`${h}:00`}</div>
                  {calendarDays.map((day) => {
                    const dayEvents = eventsOnDay(day).filter((e) => {
                      if (!e.time) return h === 8; // default 8:00 for all-day
                      return parseInt(e.time.split(":")[0]) === h;
                    });
                    return (
                      <div
                        key={day.toISOString() + h}
                        className="border-b border-r h-12 p-0.5 cursor-pointer hover:bg-accent/30"
                        onClick={() => { if (!dayEvents.length) openAddDialog(format(day, "yyyy-MM-dd")); }}
                      >
                        {dayEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                            className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${typeMeta[ev.type].badge}`}
                          >
                            {ev.title}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── LISTA ─────────────────────────── */}
      {view === "lista" && (
        <div className="space-y-3">
          {listDays.map(({ day, events: dayEvts }) => (
            <Card key={day.toISOString()}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm capitalize">{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {dayEvts.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className={`h-3 w-3 rounded-full flex-shrink-0 ${typeMeta[ev.type].dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{ev.description}</p>
                    </div>
                    {ev.time && <span className="text-xs font-mono text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{ev.time}</span>}
                    <Badge variant="outline" className={`text-[10px] ${typeMeta[ev.type].badge}`}>{typeMeta[ev.type].label}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
          {listDays.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum evento nos próximos 30 dias</CardContent></Card>
          )}
        </div>
      )}

      {/* ── Event Detail Dialog ───────────── */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${typeMeta[selectedEvent.type].dot}`} />
                {selectedEvent.title}
              </DialogTitle>
              <DialogDescription>{typeMeta[selectedEvent.type].label}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(selectedEvent.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                {selectedEvent.time && <><Clock className="h-4 w-4 text-muted-foreground ml-2" /><span>{selectedEvent.time}</span></>}
              </div>
              {selectedEvent.description && <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>}
              {selectedEvent.reminder_days && selectedEvent.reminder_days > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Bell className="h-3 w-3" />Lembrete: {selectedEvent.reminder_days} dia(s) antes</div>
              )}
            </div>
            <DialogFooter>
              {selectedEvent.link && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedEvent.link}><ExternalLink className="h-4 w-4 mr-1" />Ver registro</a>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Add Event Dialog ──────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Compromisso</DialogTitle>
            <DialogDescription>Adicione um evento ao calendário</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Data *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Hora</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CalEventType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allTypes.map((t) => <SelectItem key={t} value={t}>{typeMeta[t].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Lembrete (dias antes)</Label>
                <Input type="number" min={0} value={form.reminder_days || ""} onChange={(e) => setForm({ ...form, reminder_days: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvent}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
