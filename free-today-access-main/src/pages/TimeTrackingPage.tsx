import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock, UserCheck, AlertTriangle, ChevronLeft, ChevronRight, Plus,
  Timer, LogIn, LogOut, Coffee, Edit2
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useTimeRecords, useTimeRecordsRange, useCreateTimeRecord, useUpdateTimeRecord,
  getNextRecordType, calculateWorkedMinutes, formatMinutes,
  RECORD_ORDER, RECORD_LABELS, type TimeRecord
} from '@/hooks/useTimeTracking';
import { toast } from 'sonner';

const TYPE_ICONS: Record<string, typeof LogIn> = {
  entrada: LogIn,
  saida_almoco: Coffee,
  retorno_almoco: Coffee,
  saida: LogOut,
};

// ─── Record Dialog ───
function RecordDialog({ employees, date }: { employees: any[]; date: string }) {
  const [open, setOpen] = useState(false);
  const create = useCreateTimeRecord();
  const [form, setForm] = useState({
    employee_id: '',
    type: 'entrada',
    recorded_at: `${date}T${format(new Date(), 'HH:mm')}`,
    notes: '',
    manual_adjustment: false,
  });

  const handleSave = async () => {
    if (!form.employee_id) { toast.error('Selecione o funcionário'); return; }
    try {
      await create.mutateAsync({
        ...form,
        recorded_at: new Date(form.recorded_at).toISOString(),
      });
      toast.success(`${RECORD_LABELS[form.type]} registrada!`);
      setOpen(false);
    } catch {
      toast.error('Erro ao registrar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg"><Plus className="h-4 w-4 mr-2" />Registrar Ponto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Registrar Ponto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Funcionário</Label>
            <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECORD_ORDER.map(t => (
                  <SelectItem key={t} value={t}>{RECORD_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data/Hora</Label>
            <Input type="datetime-local" value={form.recorded_at} onChange={e => setForm(f => ({ ...f, recorded_at: e.target.value }))} />
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
          </div>
          <Button onClick={handleSave} disabled={create.isPending} className="w-full">
            {create.isPending ? 'Registrando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Employee Day Card ───
function EmployeeDayCard({ employee, records, onQuickRecord }: {
  employee: any;
  records: TimeRecord[];
  onQuickRecord: (employeeId: string, type: string) => void;
}) {
  const empRecords = records.filter(r => r.employee_id === employee.id);
  const nextType = getNextRecordType(empRecords);
  const workedMin = calculateWorkedMinutes(empRecords);
  const hasStarted = empRecords.some(r => r.type === 'entrada');
  const hasFinished = empRecords.some(r => r.type === 'saida');
  const Icon = TYPE_ICONS[nextType] || Clock;

  return (
    <Card className={`${!hasStarted && new Date().getHours() >= 9 ? 'border-amber-400' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{employee.name}</p>
            <p className="text-xs text-muted-foreground">{employee.role || 'Funcionário'}</p>
            <div className="flex items-center gap-2 mt-1">
              {empRecords.map(r => {
                const RIcon = TYPE_ICONS[r.type] || Clock;
                return (
                  <Badge key={r.id} variant="outline" className="text-[10px] gap-1">
                    <RIcon className="h-2.5 w-2.5" />
                    {format(parseISO(r.recorded_at), 'HH:mm')}
                  </Badge>
                );
              })}
            </div>
            {hasStarted && (
              <p className="text-xs mt-1">
                <Timer className="h-3 w-3 inline mr-1" />
                {formatMinutes(workedMin)} trabalhadas
                {hasFinished && <Badge variant="secondary" className="ml-2 text-[10px]">Finalizado</Badge>}
              </p>
            )}
          </div>
          {!hasFinished && (
            <Button
              size="sm"
              variant={nextType === 'entrada' ? 'default' : 'outline'}
              className="h-9 gap-1"
              onClick={() => onQuickRecord(employee.id, nextType)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{RECORD_LABELS[nextType]}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Alerts ───
function DayAlerts({ employees, records }: { employees: any[]; records: TimeRecord[] }) {
  const now = new Date();
  const hour = now.getHours();
  const alerts: { message: string; type: 'warning' | 'error' }[] = [];

  if (hour >= 9) {
    employees.forEach(emp => {
      const empRecs = records.filter(r => r.employee_id === emp.id);
      if (!empRecs.some(r => r.type === 'entrada')) {
        alerts.push({ message: `${emp.name} não registrou entrada`, type: 'warning' });
      }
      const saidaAlmoco = empRecs.find(r => r.type === 'saida_almoco');
      if (saidaAlmoco && !empRecs.some(r => r.type === 'retorno_almoco')) {
        const min = differenceInMinutes(now, parseISO(saidaAlmoco.recorded_at));
        if (min > 90) {
          alerts.push({ message: `${emp.name} em almoço há ${min}min`, type: 'error' });
        }
      }
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-1">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded ${a.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700'}`}>
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {a.message}
        </div>
      ))}
    </div>
  );
}

// ─── Timesheet Report ───
function TimesheetReport({ employees }: { employees: any[] }) {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [refDate, setRefDate] = useState(new Date());
  const start = format(startOfMonth(refDate), 'yyyy-MM-dd');
  const end = format(endOfMonth(refDate), 'yyyy-MM-dd');
  const { data: records, isLoading } = useTimeRecordsRange(selectedEmp, start, end);

  const days = eachDayOfInterval({ start: startOfMonth(refDate), end: endOfMonth(refDate) });

  const dayData = useMemo(() => {
    if (!records) return [];
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayRecs = records.filter(r => r.recorded_at.startsWith(dateStr));
      const entrada = dayRecs.find(r => r.type === 'entrada');
      const saidaAlmoco = dayRecs.find(r => r.type === 'saida_almoco');
      const retornoAlmoco = dayRecs.find(r => r.type === 'retorno_almoco');
      const saida = dayRecs.find(r => r.type === 'saida');
      const workedMin = calculateWorkedMinutes(dayRecs);
      const extraMin = Math.max(0, workedMin - 8 * 60);
      const isWeekend = [0, 6].includes(day.getDay());
      return {
        date: day, dateStr, entrada, saidaAlmoco, retornoAlmoco, saida,
        workedMin, extraMin, isWeekend, hasRecords: dayRecs.length > 0,
      };
    });
  }, [records, days]);

  const totalWorked = dayData.reduce((s, d) => s + d.workedMin, 0);
  const totalExtra = dayData.reduce((s, d) => s + d.extraMin, 0);
  const workDays = dayData.filter(d => !d.isWeekend).length;
  const absences = dayData.filter(d => !d.isWeekend && !d.hasRecords && d.date < new Date()).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Label>Funcionário</Label>
          <Select value={selectedEmp} onValueChange={setSelectedEmp}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setRefDate(d => subMonths(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center capitalize">
            {format(refDate, 'MMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setRefDate(d => addMonths(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!selectedEmp ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Selecione um funcionário para ver o espelho de ponto</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-60" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Horas Trabalhadas</p><p className="text-lg font-bold">{formatMinutes(totalWorked)}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Horas Extras</p><p className="text-lg font-bold text-amber-600">{formatMinutes(totalExtra)}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Faltas</p><p className="text-lg font-bold text-destructive">{absences}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Saldo Banco Horas</p><p className={`text-lg font-bold ${totalExtra > 0 ? 'text-green-600' : ''}`}>{totalExtra > 0 ? '+' : ''}{formatMinutes(totalExtra)}</p></CardContent></Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-center">Entrada</TableHead>
                    <TableHead className="text-xs text-center">Saída Almoço</TableHead>
                    <TableHead className="text-xs text-center">Retorno</TableHead>
                    <TableHead className="text-xs text-center">Saída</TableHead>
                    <TableHead className="text-xs text-center">Trabalhadas</TableHead>
                    <TableHead className="text-xs text-center">Extras</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayData.map(d => (
                    <TableRow key={d.dateStr} className={d.isWeekend ? 'bg-muted/30' : ''}>
                      <TableCell className="text-xs font-medium">
                        {format(d.date, 'dd/MM EEE', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-xs text-center">{d.entrada ? format(parseISO(d.entrada.recorded_at), 'HH:mm') : '-'}</TableCell>
                      <TableCell className="text-xs text-center">{d.saidaAlmoco ? format(parseISO(d.saidaAlmoco.recorded_at), 'HH:mm') : '-'}</TableCell>
                      <TableCell className="text-xs text-center">{d.retornoAlmoco ? format(parseISO(d.retornoAlmoco.recorded_at), 'HH:mm') : '-'}</TableCell>
                      <TableCell className="text-xs text-center">{d.saida ? format(parseISO(d.saida.recorded_at), 'HH:mm') : '-'}</TableCell>
                      <TableCell className="text-xs text-center font-medium">{d.hasRecords ? formatMinutes(d.workedMin) : '-'}</TableCell>
                      <TableCell className="text-xs text-center">{d.extraMin > 0 ? <span className="text-amber-600">+{formatMinutes(d.extraMin)}</span> : '-'}</TableCell>
                      <TableCell className="text-xs text-center">
                        {d.isWeekend ? (
                          <Badge variant="outline" className="text-[10px]">Folga</Badge>
                        ) : !d.hasRecords && d.date < new Date() ? (
                          <Badge variant="destructive" className="text-[10px]">Falta</Badge>
                        ) : d.hasRecords ? (
                          <Badge variant="secondary" className="text-[10px]">OK</Badge>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function TimeTrackingPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: employeesData, isLoading: loadingEmp } = useEmployees();
  const { data: records, isLoading: loadingRec } = useTimeRecords(today);
  const create = useCreateTimeRecord();

  const employees = useMemo(() =>
    (employeesData || []).filter((e: any) => e.status === 'ativo'),
    [employeesData]
  );

  const handleQuickRecord = async (employeeId: string, type: string) => {
    try {
      await create.mutateAsync({
        employee_id: employeeId,
        type,
        recorded_at: new Date().toISOString(),
        notes: '',
        manual_adjustment: false,
      });
      toast.success(`${RECORD_LABELS[type]} registrada!`);
    } catch {
      toast.error('Erro ao registrar');
    }
  };

  const loading = loadingEmp || loadingRec;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Controle de Ponto
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="hoje">
        <TabsList>
          <TabsTrigger value="hoje">Registro do Dia</TabsTrigger>
          <TabsTrigger value="relatorios">Espelho de Ponto</TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="space-y-4">
          <RecordDialog employees={employees} date={today} />

          <DayAlerts employees={employees} records={records || []} />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
          ) : employees.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum funcionário ativo cadastrado</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {employees.map((emp: any) => (
                <EmployeeDayCard
                  key={emp.id}
                  employee={emp}
                  records={records || []}
                  onQuickRecord={handleQuickRecord}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relatorios">
          <TimesheetReport employees={employees} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
