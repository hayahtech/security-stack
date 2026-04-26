import { useState, useMemo } from 'react';
import { useEquipment, useMaintenances, useCreateEquipment, useDeleteEquipment, calcDepreciation } from '@/hooks/useEquipment';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Wrench, Settings, AlertTriangle, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addDays, isBefore } from 'date-fns';
import { exportPDF } from '@/lib/export-utils';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const categoryLabels: Record<string, string> = {
  forno: 'Forno', refrigeracao: 'Refrigeração', preparo: 'Preparo',
  entrega: 'Entrega', informatica: 'Informática', movel: 'Móvel', outro: 'Outro',
};

const statusConfig: Record<string, { label: string; class: string }> = {
  ativo: { label: 'Ativo', class: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30' },
  manutencao: { label: 'Em Manutenção', class: 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30' },
  inativo: { label: 'Inativo', class: 'bg-muted text-muted-foreground' },
  baixado: { label: 'Baixado', class: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export default function EquipmentPage() {
  const { data: equipment, isLoading } = useEquipment();
  const { data: allMaintenances } = useMaintenances();
  const createEquipment = useCreateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const [formOpen, setFormOpen] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('outro');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [acquisitionValue, setAcquisitionValue] = useState('');
  const [usefulLife, setUsefulLife] = useState('60');
  const [residualValue, setResidualValue] = useState('0');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    if (!equipment) return [];
    return equipment.filter(e => {
      if (filterCat !== 'all' && e.category !== filterCat) return false;
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      return true;
    });
  }, [equipment, filterCat, filterStatus]);

  // Summary
  const summary = useMemo(() => {
    if (!equipment) return { active: 0, totalAcq: 0, totalCurrent: 0, totalDeprec: 0, maintenanceSoon: 0 };
    const active = equipment.filter(e => e.status === 'ativo').length;
    let totalAcq = 0, totalCurrent = 0, totalDeprec = 0;
    equipment.forEach(e => {
      const d = calcDepreciation(e);
      totalAcq += Number(e.acquisition_value);
      totalCurrent += d.currentValue;
      totalDeprec += d.accumulated;
    });
    const now = new Date();
    const in30 = addDays(now, 30);
    const maintenanceSoon = (allMaintenances || []).filter(m =>
      m.next_maintenance_date && isBefore(new Date(m.next_maintenance_date), in30) && !isBefore(new Date(m.next_maintenance_date), now)
    ).length;
    return { active, totalAcq, totalCurrent, totalDeprec, maintenanceSoon };
  }, [equipment, allMaintenances]);

  // Overdue maintenances
  const overdueMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (allMaintenances || []).forEach(m => {
      if (m.next_maintenance_date && isBefore(new Date(m.next_maintenance_date), new Date())) {
        map.set(m.equipment_id, true);
      }
    });
    return map;
  }, [allMaintenances]);

  // Last maintenance per equipment
  const lastMaintenanceMap = useMemo(() => {
    const map = new Map<string, { performed_at: string; next_maintenance_date: string | null }>();
    (allMaintenances || []).forEach(m => {
      const existing = map.get(m.equipment_id);
      if (!existing || m.performed_at > existing.performed_at) {
        map.set(m.equipment_id, { performed_at: m.performed_at, next_maintenance_date: m.next_maintenance_date });
      }
    });
    return map;
  }, [allMaintenances]);

  const openNew = () => {
    setName(''); setCategory('outro'); setBrand(''); setModel(''); setSerialNumber('');
    setAcquisitionDate(new Date().toISOString().split('T')[0]); setAcquisitionValue('');
    setUsefulLife('60'); setResidualValue('0'); setLocation(''); setNotes('');
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!name || !acquisitionValue) return;
    createEquipment.mutate({
      name, category, brand: brand || null, model: model || null, serial_number: serialNumber || null,
      acquisition_date: acquisitionDate, acquisition_value: parseFloat(acquisitionValue),
      useful_life_months: parseInt(usefulLife) || 60, residual_value: parseFloat(residualValue) || 0,
      location: location || null, notes: notes || null, status: 'ativo',
    } as any);
    setFormOpen(false);
  };

  const previewDeprec = useMemo(() => {
    const acq = parseFloat(acquisitionValue) || 0;
    const res = parseFloat(residualValue) || 0;
    const life = parseInt(usefulLife) || 60;
    if (acq <= 0) return null;
    const monthly = (acq - res) / life;
    return { monthly, years: Math.ceil(life / 12) };
  }, [acquisitionValue, residualValue, usefulLife]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="space-y-6" id="equipment-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Máquinas e Equipamentos</h1>
          <p className="text-sm text-muted-foreground">Controle de ativos e depreciação</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Equipamento</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Ativos</p><p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{summary.active}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Valor Aquisição</p><p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>{fmt(summary.totalAcq)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Valor Atual</p><p className="text-lg font-bold text-[hsl(var(--success))]" style={{ fontFamily: 'Nunito' }}>{fmt(summary.totalCurrent)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Deprec. Acumulada</p><p className="text-lg font-bold text-destructive" style={{ fontFamily: 'Nunito' }}>{fmt(summary.totalDeprec)}</p></CardContent></Card>
        <Card className={summary.maintenanceSoon > 0 ? 'border-[hsl(var(--warning))]' : ''}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Manutenções 30d</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{summary.maintenanceSoon}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="grid">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Equipamentos</TabsTrigger>
            <TabsTrigger value="depreciation">Relatório Depreciação</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Equipment Grid */}
        <TabsContent value="grid" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(eq => {
              const d = calcDepreciation(eq);
              const st = statusConfig[eq.status] || statusConfig.ativo;
              const lastM = lastMaintenanceMap.get(eq.id);
              const overdue = overdueMap.has(eq.id);

              return (
                <Card key={eq.id} className={overdue ? 'border-[hsl(var(--warning))]' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" /> {eq.name}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Link to={`/equipamentos/${eq.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => { if (confirm('Excluir equipamento?')) deleteEquipment.mutate(eq.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[eq.category] || eq.category}</Badge>
                      <Badge className={`text-[10px] ${st.class}`}>{st.label}</Badge>
                      {overdue && <Badge className="text-[10px] bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"><AlertTriangle className="h-2 w-2 mr-0.5" /> Manut. vencida</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {(eq.brand || eq.model) && <p className="text-muted-foreground">{[eq.brand, eq.model].filter(Boolean).join(' ')}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-muted-foreground">Aquisição</p><p className="font-semibold">{fmt(Number(eq.acquisition_value))}</p></div>
                      <div><p className="text-xs text-muted-foreground">Valor Atual</p><p className="font-semibold text-[hsl(var(--success))]">{fmt(d.currentValue)}</p></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Vida útil consumida</span>
                        <span>{d.lifePercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={d.lifePercent} className="h-2" />
                    </div>
                    {lastM && (
                      <div className="text-xs text-muted-foreground">
                        <p>Última manut.: {new Date(lastM.performed_at).toLocaleDateString('pt-BR')}</p>
                        {lastM.next_maintenance_date && <p>Próxima: {new Date(lastM.next_maintenance_date).toLocaleDateString('pt-BR')}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && <p className="text-muted-foreground text-center col-span-full py-8">Nenhum equipamento encontrado</p>}
          </div>
        </TabsContent>

        {/* Depreciation Report */}
        <TabsContent value="depreciation" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Relatório de Depreciação</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportPDF('equipment-page', 'relatorio-depreciacao')}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead className="text-right">Valor Aquisição</TableHead>
                    <TableHead className="text-right">Deprec. Mensal</TableHead>
                    <TableHead className="text-right">Deprec. Acumulada</TableHead>
                    <TableHead className="text-right">Valor Atual</TableHead>
                    <TableHead className="text-right">Vida Restante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(equipment || []).map(eq => {
                    const d = calcDepreciation(eq);
                    return (
                      <TableRow key={eq.id}>
                        <TableCell className="font-medium">{eq.name}</TableCell>
                        <TableCell className="text-right">{fmt(Number(eq.acquisition_value))}</TableCell>
                        <TableCell className="text-right">{fmt(d.monthlyDeprec)}</TableCell>
                        <TableCell className="text-right text-destructive">{fmt(d.accumulated)}</TableCell>
                        <TableCell className="text-right text-[hsl(var(--success))]">{fmt(d.currentValue)}</TableCell>
                        <TableCell className="text-right">{d.remainingMonths} meses</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-muted/50 rounded flex justify-between font-semibold text-sm">
                <span>Depreciação total do mês</span>
                <span>{fmt((equipment || []).reduce((s, eq) => s + calcDepreciation(eq).monthlyDeprec, 0))}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Equipamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Forno a gás industrial" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marca</Label><Input value={brand} onChange={e => setBrand(e.target.value)} /></div>
              <div><Label>Modelo</Label><Input value={model} onChange={e => setModel(e.target.value)} /></div>
            </div>
            <div><Label>Nº de Série</Label><Input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data de Aquisição *</Label><Input type="date" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} /></div>
              <div><Label>Valor de Aquisição (R$) *</Label><Input type="number" step="0.01" value={acquisitionValue} onChange={e => setAcquisitionValue(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Vida Útil (meses)</Label><Input type="number" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} /></div>
              <div><Label>Valor Residual (R$)</Label><Input type="number" step="0.01" value={residualValue} onChange={e => setResidualValue(e.target.value)} /></div>
            </div>
            <div><Label>Localização</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Cozinha principal" /></div>
            <div><Label>Observações</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>

            {previewDeprec && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm">
                  Este equipamento deprecia <strong>{fmt(previewDeprec.monthly)}</strong> por mês durante <strong>{previewDeprec.years} anos</strong>.
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name || !acquisitionValue}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
