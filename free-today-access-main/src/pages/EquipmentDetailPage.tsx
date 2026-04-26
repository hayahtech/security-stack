import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEquipmentById, useMaintenances, useCreateMaintenance, useUpdateEquipment, calcDepreciation } from '@/hooks/useEquipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ArrowLeft, Plus, Settings, Wrench } from 'lucide-react';
import { addMonths, format } from 'date-fns';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const statusConfig: Record<string, { label: string; class: string }> = {
  ativo: { label: 'Ativo', class: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]' },
  manutencao: { label: 'Em Manutenção', class: 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]' },
  inativo: { label: 'Inativo', class: 'bg-muted text-muted-foreground' },
  baixado: { label: 'Baixado', class: 'bg-destructive/15 text-destructive' },
};

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: eq, isLoading } = useEquipmentById(id);
  const { data: maintenances } = useMaintenances(id);
  const createMaintenance = useCreateMaintenance();
  const updateEquipment = useUpdateEquipment();

  const [maintOpen, setMaintOpen] = useState(false);
  const [mType, setMType] = useState('preventiva');
  const [mDesc, setMDesc] = useState('');
  const [mCost, setMCost] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mNext, setMNext] = useState('');
  const [mBy, setMBy] = useState('');
  const [mNotes, setMNotes] = useState('');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!eq) return <p className="text-muted-foreground p-8">Equipamento não encontrado</p>;

  const d = calcDepreciation(eq);
  const st = statusConfig[eq.status] || statusConfig.ativo;

  // Depreciation chart data
  const chartData = [];
  const acqValue = Number(eq.acquisition_value);
  const residual = Number(eq.residual_value) || 0;
  const life = eq.useful_life_months || 60;
  const monthlyDep = (acqValue - residual) / life;
  for (let i = 0; i <= life; i += Math.max(1, Math.floor(life / 24))) {
    const val = Math.max(residual, acqValue - monthlyDep * i);
    chartData.push({ month: format(addMonths(new Date(eq.acquisition_date), i), 'MMM/yy'), value: val, months: i });
  }

  const handleSaveMaint = () => {
    if (!mDesc) return;
    createMaintenance.mutate({
      equipment_id: eq.id, type: mType, description: mDesc,
      cost: parseFloat(mCost) || 0, performed_at: mDate,
      next_maintenance_date: mNext || null, performed_by: mBy || null, notes: mNotes || null,
    } as any);
    setMaintOpen(false);
  };

  const handleStatusChange = (newStatus: string) => {
    updateEquipment.mutate({ id: eq.id, status: newStatus } as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/equipamentos"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
            <Settings className="h-5 w-5" /> {eq.name}
          </h1>
          <div className="flex gap-2 mt-1">
            <Badge className={st.class}>{st.label}</Badge>
            {eq.brand && <Badge variant="outline">{eq.brand} {eq.model}</Badge>}
          </div>
        </div>
      </div>

      {/* Info + Depreciation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-muted-foreground">Aquisição</p><p className="font-semibold">{fmt(acqValue)}</p></div>
              <div><p className="text-muted-foreground">Valor Atual</p><p className="font-semibold text-[hsl(var(--success))]">{fmt(d.currentValue)}</p></div>
              <div><p className="text-muted-foreground">Deprec. Mensal</p><p className="font-semibold">{fmt(d.monthlyDeprec)}</p></div>
              <div><p className="text-muted-foreground">Deprec. Acumulada</p><p className="font-semibold text-destructive">{fmt(d.accumulated)}</p></div>
              <div><p className="text-muted-foreground">Vida Útil</p><p className="font-semibold">{life} meses</p></div>
              <div><p className="text-muted-foreground">Restante</p><p className="font-semibold">{d.remainingMonths} meses</p></div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Vida útil consumida</span><span>{d.lifePercent.toFixed(0)}%</span>
              </div>
              <Progress value={d.lifePercent} className="h-2" />
            </div>
            {eq.serial_number && <p className="text-muted-foreground">Nº Série: {eq.serial_number}</p>}
            {eq.location && <p className="text-muted-foreground">Local: {eq.location}</p>}
            {eq.notes && <p className="text-muted-foreground">{eq.notes}</p>}
            <div className="pt-2">
              <Label className="text-xs">Alterar Status</Label>
              <Select value={eq.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Curva de Depreciação</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="value" name="Valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Maintenances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Histórico de Manutenções</CardTitle>
            <Button size="sm" onClick={() => { setMType('preventiva'); setMDesc(''); setMCost(''); setMDate(new Date().toISOString().split('T')[0]); setMNext(''); setMBy(''); setMNotes(''); setMaintOpen(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Registrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Realizado por</TableHead>
                <TableHead>Próxima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(maintenances || []).map(m => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.performed_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{m.type}</Badge></TableCell>
                  <TableCell>{m.description}</TableCell>
                  <TableCell className="text-right">{fmt(Number(m.cost))}</TableCell>
                  <TableCell>{m.performed_by || '-'}</TableCell>
                  <TableCell>{m.next_maintenance_date ? new Date(m.next_maintenance_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                </TableRow>
              ))}
              {(!maintenances || maintenances.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma manutenção registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Maintenance Dialog */}
      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={mType} onValueChange={setMType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição *</Label><Input value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="O que foi feito?" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={mCost} onChange={e => setMCost(e.target.value)} /></div>
              <div><Label>Data Realizada</Label><Input type="date" value={mDate} onChange={e => setMDate(e.target.value)} /></div>
            </div>
            <div><Label>Realizado por</Label><Input value={mBy} onChange={e => setMBy(e.target.value)} placeholder="Empresa ou técnico" /></div>
            <div><Label>Próxima Manutenção</Label><Input type="date" value={mNext} onChange={e => setMNext(e.target.value)} /></div>
            <div><Label>Observações</Label><Input value={mNotes} onChange={e => setMNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMaint} disabled={!mDesc}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
