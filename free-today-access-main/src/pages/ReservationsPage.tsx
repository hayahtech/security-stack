import { useState, useMemo } from 'react';
import { format, addDays, differenceInMinutes, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Plus, Phone, Users, Clock, CheckCircle2, XCircle, AlertTriangle, UserCheck, Timer, Bell } from 'lucide-react';
import { useReservations, useCreateReservation, useUpdateReservation, useReservationsByRange, type Reservation } from '@/hooks/useReservations';
import { useWaitlist, useAddToWaitlist, useUpdateWaitlist, type WaitlistEntry } from '@/hooks/useWaitlist';
import { toast } from 'sonner';

// ─── Reservation Status Helpers ───
function statusBadge(status: string, reservedDate: string, reservedTime: string) {
  const now = new Date();
  const resDateTime = new Date(`${reservedDate}T${reservedTime}`);
  const diffMin = differenceInMinutes(resDateTime, now);

  if (status === 'chegou') return <Badge className="bg-green-600 text-white">Chegou</Badge>;
  if (status === 'cancelada') return <Badge variant="destructive">Cancelada</Badge>;
  if (status === 'nao_compareceu') return <Badge variant="destructive">No-show</Badge>;
  if (status === 'pendente') return <Badge variant="secondary">Pendente</Badge>;

  // confirmada
  if (diffMin < 0) return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Atrasado</Badge>;
  if (diffMin <= 30) return <Badge className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" />Em breve</Badge>;
  return <Badge className="bg-blue-600 text-white">Confirmada</Badge>;
}

// ─── Week Calendar ───
function WeekCalendar({ selectedDate, onSelect, reservationCounts }: {
  selectedDate: string;
  onSelect: (d: string) => void;
  reservationCounts: Record<string, number>;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const count = reservationCounts[key] || 0;
        const isSelected = key === selectedDate;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center min-w-[72px] p-2 rounded-lg border transition-colors ${
              isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'
            }`}
          >
            <span className="text-xs uppercase">{format(day, 'EEE', { locale: ptBR })}</span>
            <span className="text-lg font-bold">{format(day, 'dd')}</span>
            {count > 0 && (
              <Badge variant={isSelected ? 'secondary' : 'default'} className="text-[10px] mt-1 px-1.5">
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── New Reservation Dialog ───
function NewReservationDialog({ selectedDate }: { selectedDate: string }) {
  const [open, setOpen] = useState(false);
  const create = useCreateReservation();
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', party_size: 2,
    reserved_date: selectedDate, reserved_time: '19:00',
    notes: '', status: 'confirmada', customer_id: null as string | null, table_id: null as string | null,
  });

  const handleSave = async () => {
    if (!form.customer_name || !form.customer_phone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    try {
      await create.mutateAsync(form);
      toast.success('Reserva criada!');
      setOpen(false);
      setForm(f => ({ ...f, customer_name: '', customer_phone: '', notes: '', party_size: 2 }));
    } catch {
      toast.error('Erro ao criar reserva');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Nova Reserva</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova Reserva</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome do cliente</Label>
            <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="(48) 99999-9999" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.reserved_date} onChange={e => setForm(f => ({ ...f, reserved_date: e.target.value }))} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={form.reserved_time} onChange={e => setForm(f => ({ ...f, reserved_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Número de pessoas</Label>
            <Input type="number" min={1} value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Aniversário, cadeirinha, etc." />
          </div>
          <Button onClick={handleSave} disabled={create.isPending} className="w-full">
            {create.isPending ? 'Salvando...' : 'Salvar Reserva'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reservation Card ───
function ReservationCard({ r, onUpdate }: { r: Reservation; onUpdate: (id: string, data: Partial<Reservation>) => void }) {
  const whatsappMsg = encodeURIComponent(
    `Olá ${r.customer_name}! Confirmando sua reserva para ${format(parseISO(r.reserved_date), 'dd/MM')} às ${r.reserved_time.slice(0, 5)} para ${r.party_size} pessoas. Pizzaria Flow`
  );
  const whatsappLink = `https://wa.me/55${r.customer_phone.replace(/\D/g, '')}?text=${whatsappMsg}`;
  const isActive = !['cancelada', 'nao_compareceu', 'chegou'].includes(r.status);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: r.status === 'chegou' ? 'var(--color-green-600, #16a34a)' : r.status === 'cancelada' || r.status === 'nao_compareceu' ? 'var(--color-red-600, #dc2626)' : 'hsl(var(--primary))' }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{r.reserved_time.slice(0, 5)}</span>
              <span className="font-medium">{r.customer_name}</span>
              {statusBadge(r.status, r.reserved_date, r.reserved_time)}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.party_size} pessoas</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.customer_phone}</span>
            </div>
            {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">{r.notes}</p>}
          </div>
          {isActive && (
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onUpdate(r.id, { status: 'chegou' })}>
                <CheckCircle2 className="h-3 w-3 mr-1" />Chegou
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onUpdate(r.id, { status: 'cancelada', cancelled_at: new Date().toISOString() })}>
                <XCircle className="h-3 w-3 mr-1" />Cancelar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Phone className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Waitlist Timer ───
function WaitTimer({ arrivedAt }: { arrivedAt: string }) {
  const minutes = differenceInMinutes(new Date(), parseISO(arrivedAt));
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <span className={`font-mono text-sm font-bold ${minutes > 30 ? 'text-destructive' : minutes > 15 ? 'text-amber-600' : 'text-muted-foreground'}`}>
      {hrs > 0 ? `${hrs}h${mins.toString().padStart(2, '0')}` : `${mins}min`}
    </span>
  );
}

// ─── Add to Waitlist Dialog ───
function AddToWaitlistDialog() {
  const [open, setOpen] = useState(false);
  const add = useAddToWaitlist();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', party_size: 2, notes: '', estimated_wait_minutes: 15 });

  const handleSave = async () => {
    if (!form.customer_name) { toast.error('Preencha o nome'); return; }
    try {
      await add.mutateAsync(form);
      toast.success('Adicionado à fila!');
      setOpen(false);
      setForm({ customer_name: '', customer_phone: '', party_size: 2, notes: '', estimated_wait_minutes: 15 });
    } catch {
      toast.error('Erro ao adicionar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Adicionar à Fila</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Adicionar à Lista de Espera</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
          <div><Label>Telefone</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
          <div><Label>Pessoas</Label><Input type="number" min={1} value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: Number(e.target.value) }))} /></div>
          <div><Label>Tempo estimado (min)</Label><Input type="number" min={5} step={5} value={form.estimated_wait_minutes} onChange={e => setForm(f => ({ ...f, estimated_wait_minutes: Number(e.target.value) }))} /></div>
          <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <Button onClick={handleSave} disabled={add.isPending} className="w-full">Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Waitlist Card ───
function WaitlistCard({ entry, position, onCall, onSeat, onGiveUp }: {
  entry: WaitlistEntry; position: number;
  onCall: () => void; onSeat: () => void; onGiveUp: () => void;
}) {
  const isCalled = entry.status === 'chamado';
  const calledMinAgo = entry.called_at ? differenceInMinutes(new Date(), parseISO(entry.called_at)) : 0;
  const isPulsing = isCalled && calledMinAgo < 5;

  return (
    <Card className={`transition-all ${isPulsing ? 'animate-pulse border-amber-400 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {position}
            </div>
            <div>
              <p className="font-medium text-sm">{entry.customer_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{entry.party_size}</span>
                {entry.customer_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{entry.customer_phone}</span>}
                <span className="flex items-center gap-1"><Timer className="h-3 w-3" /><WaitTimer arrivedAt={entry.arrived_at} /></span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {!isCalled ? (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCall}>
                <Bell className="h-3 w-3 mr-1" />Chamar
              </Button>
            ) : (
              <>
                <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={onSeat}>
                  <UserCheck className="h-3 w-3 mr-1" />Sentar
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={onGiveUp}>
                  Desistiu
                </Button>
              </>
            )}
          </div>
        </div>
        {entry.notes && <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>}
        {entry.estimated_wait_minutes && !isCalled && (
          <p className="text-xs text-muted-foreground mt-1">Estimativa: ~{entry.estimated_wait_minutes}min</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function ReservationsPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const weekEnd = format(addDays(new Date(), 6), 'yyyy-MM-dd');

  const { data: reservations, isLoading: loadingRes } = useReservations(selectedDate);
  const { data: weekData } = useReservationsByRange(today, weekEnd);
  const { data: waitlist, isLoading: loadingWait } = useWaitlist();
  const updateRes = useUpdateReservation();
  const updateWait = useUpdateWaitlist();

  const reservationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    weekData?.forEach(r => {
      if (!['cancelada', 'nao_compareceu'].includes(r.status)) {
        counts[r.reserved_date] = (counts[r.reserved_date] || 0) + 1;
      }
    });
    return counts;
  }, [weekData]);

  const handleUpdateReservation = async (id: string, data: Partial<Reservation>) => {
    try {
      await updateRes.mutateAsync({ id, ...data });
      toast.success(data.status === 'chegou' ? 'Cliente chegou!' : data.status === 'cancelada' ? 'Reserva cancelada' : 'Reserva atualizada');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleCallWaitlist = async (id: string) => {
    try {
      await updateWait.mutateAsync({ id, status: 'chamado', called_at: new Date().toISOString() });
      toast.success('Cliente chamado!');
    } catch {
      toast.error('Erro');
    }
  };

  const handleSeatWaitlist = async (id: string) => {
    try {
      await updateWait.mutateAsync({ id, status: 'sentado', seated_at: new Date().toISOString() });
      toast.success('Cliente sentado!');
    } catch {
      toast.error('Erro');
    }
  };

  const handleGiveUpWaitlist = async (id: string) => {
    try {
      await updateWait.mutateAsync({ id, status: 'desistiu' });
      toast.info('Removido da fila');
    } catch {
      toast.error('Erro');
    }
  };

  // Reminders WhatsApp
  const handleSendReminders = () => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const tomorrowRes = weekData?.filter(r => r.reserved_date === tomorrow && !['cancelada', 'nao_compareceu'].includes(r.status)) || [];
    if (tomorrowRes.length === 0) {
      toast.info('Nenhuma reserva para amanhã');
      return;
    }
    toast.success(`${tomorrowRes.length} lembrete(s) gerado(s). Abra cada reserva para enviar via WhatsApp.`);
  };

  // Metrics
  const todayReservations = reservations || [];
  const confirmed = todayReservations.filter(r => r.status === 'confirmada').length;
  const arrived = todayReservations.filter(r => r.status === 'chegou').length;
  const cancelled = todayReservations.filter(r => r.status === 'cancelada').length;
  const noShow = todayReservations.filter(r => r.status === 'nao_compareceu').length;
  const waitingNow = (waitlist || []).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Reservas & Lista de Espera
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Reservas', value: todayReservations.length, icon: CalendarDays },
          { label: 'Confirmadas', value: confirmed, icon: CheckCircle2 },
          { label: 'Canceladas', value: cancelled, icon: XCircle },
          { label: 'No-show', value: noShow, icon: AlertTriangle },
          { label: 'Na fila', value: waitingNow, icon: Users },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <m.icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reservas">
        <TabsList>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="espera">Lista de Espera ({waitingNow})</TabsTrigger>
        </TabsList>

        {/* ─── Reservas Tab ─── */}
        <TabsContent value="reservas" className="space-y-4">
          <WeekCalendar selectedDate={selectedDate} onSelect={setSelectedDate} reservationCounts={reservationCounts} />

          <div className="flex gap-2">
            <NewReservationDialog selectedDate={selectedDate} />
            <Button variant="outline" onClick={handleSendReminders}>
              <Bell className="h-4 w-4 mr-2" />Enviar Lembretes
            </Button>
          </div>

          {loadingRes ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : todayReservations.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma reserva para {format(parseISO(selectedDate), "dd 'de' MMMM", { locale: ptBR })}</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {todayReservations.map(r => (
                <ReservationCard key={r.id} r={r} onUpdate={handleUpdateReservation} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Waitlist Tab ─── */}
        <TabsContent value="espera" className="space-y-4">
          <AddToWaitlistDialog />

          {loadingWait ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : (waitlist || []).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum grupo na lista de espera</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {(waitlist || []).map((entry, i) => (
                <WaitlistCard
                  key={entry.id}
                  entry={entry}
                  position={i + 1}
                  onCall={() => handleCallWaitlist(entry.id)}
                  onSeat={() => handleSeatWaitlist(entry.id)}
                  onGiveUp={() => handleGiveUpWaitlist(entry.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
