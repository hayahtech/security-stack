import { useState, useMemo } from 'react';
import {
  useTemperatureLogs, useCreateTemperatureLog, useCleaningLogs, useCreateCleaningLog,
  equipmentLabels, equipmentRanges, getTempStatus, type Equipment,
} from '@/hooks/useSanitary';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Thermometer, SprayCan, AlertTriangle, CheckCircle, XCircle, Printer } from 'lucide-react';

const defaultOpenChecklist = [
  { label: 'Verificar temperatura dos equipamentos', done: false },
  { label: 'Higienizar bancadas e superfícies', done: false },
  { label: 'Verificar validade dos insumos', done: false },
  { label: 'Verificar estoque de descartáveis', done: false },
  { label: 'Lavar as mãos e colocar EPIs', done: false },
  { label: 'Ligar exaustores e ventilação', done: false },
];

const defaultCloseChecklist = [
  { label: 'Limpar e higienizar todas as superfícies', done: false },
  { label: 'Guardar alimentos adequadamente', done: false },
  { label: 'Verificar temperatura dos equipamentos', done: false },
  { label: 'Retirar lixo e higienizar lixeiras', done: false },
  { label: 'Limpar pisos e ralos', done: false },
  { label: 'Desligar equipamentos não essenciais', done: false },
];

const cleaningAreas = ['Cozinha', 'Salão', 'Banheiros', 'Estoque', 'Área de preparo', 'Balcão'];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ok: { label: 'OK', color: 'text-[hsl(var(--success))]', icon: CheckCircle },
  alerta: { label: 'Alerta', color: 'text-[hsl(var(--warning))]', icon: AlertTriangle },
  critico: { label: 'Crítico', color: 'text-destructive', icon: XCircle },
};

export default function SanitaryPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const { data: tempLogs, isLoading: tempLoading } = useTemperatureLogs(dateFrom, dateTo);
  const { data: cleanLogs, isLoading: cleanLoading } = useCleaningLogs(dateFrom, dateTo);
  const { data: employees } = useEmployees();
  const createTemp = useCreateTemperatureLog();
  const createClean = useCreateCleaningLog();

  const [tempDialogOpen, setTempDialogOpen] = useState(false);
  const [cleanDialogOpen, setCleanDialogOpen] = useState(false);
  const [checklistType, setChecklistType] = useState<'abertura' | 'fechamento'>('abertura');
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);

  // Temp form
  const [tEquip, setTEquip] = useState<Equipment>('geladeira');
  const [tTemp, setTTemp] = useState('');
  const [tEmployee, setTEmployee] = useState('');
  const [tNotes, setTNotes] = useState('');

  // Clean form
  const [cArea, setCArea] = useState('Cozinha');
  const [cEmployee, setCEmployee] = useState('');
  const [cNotes, setCNotes] = useState('');

  // Checklist state
  const [checklist, setChecklist] = useState(defaultOpenChecklist.map(c => ({ ...c })));

  const activeEmployees = (employees || []).filter((e: any) => e.status === 'ativo');

  // Temp preview status
  const previewStatus = tTemp ? getTempStatus(tEquip, parseFloat(tTemp)) : null;
  const range = equipmentRanges[tEquip];

  // Compliance stats
  const complianceStats = useMemo(() => {
    if (!tempLogs) return { total: 0, ok: 0, alerta: 0, critico: 0, rate: 0 };
    const total = tempLogs.length;
    const ok = tempLogs.filter(l => l.status === 'ok').length;
    const alerta = tempLogs.filter(l => l.status === 'alerta').length;
    const critico = tempLogs.filter(l => l.status === 'critico').length;
    return { total, ok, alerta, critico, rate: total > 0 ? (ok / total) * 100 : 100 };
  }, [tempLogs]);

  // Today's alerts
  const todayAlerts = useMemo(() => {
    if (!tempLogs) return [];
    return tempLogs.filter(l => l.recorded_at.startsWith(today) && l.status !== 'ok');
  }, [tempLogs, today]);

  const handleTemp = () => {
    createTemp.mutate({ equipment: tEquip, temperature: parseFloat(tTemp), recorded_by: tEmployee || undefined, notes: tNotes || undefined });
    setTempDialogOpen(false);
    setTTemp(''); setTNotes('');
  };

  const handleClean = () => {
    createClean.mutate({ area: cArea, employee_id: cEmployee || undefined, notes: cNotes || undefined });
    setCleanDialogOpen(false);
    setCNotes('');
  };

  const handleChecklist = () => {
    const area = checklistType === 'abertura' ? 'Checklist Abertura' : 'Checklist Fechamento';
    createClean.mutate({ area, employee_id: cEmployee || undefined, checklist: checklist, notes: `${checklist.filter(c => c.done).length}/${checklist.length} itens concluídos` });
    setChecklistDialogOpen(false);
  };

  const openChecklist = (type: 'abertura' | 'fechamento') => {
    setChecklistType(type);
    setChecklist((type === 'abertura' ? defaultOpenChecklist : defaultCloseChecklist).map(c => ({ ...c })));
    setChecklistDialogOpen(true);
  };

  const handlePrintReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Relatório Sanitário</title><style>body{font-family:sans-serif;padding:20px;font-size:13px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{padding:4px 8px;border:1px solid #ddd;text-align:left}h2{margin:16px 0 8px}.ok{color:green}.alerta{color:orange}.critico{color:red}</style></head><body>`);
    w.document.write(`<h1>Relatório de Conformidade Sanitária</h1><p>Período: ${new Date(dateFrom).toLocaleDateString('pt-BR')} a ${new Date(dateTo).toLocaleDateString('pt-BR')}</p>`);
    w.document.write(`<h2>Resumo</h2><p>Total de registros: ${complianceStats.total} | Conformidade: ${complianceStats.rate.toFixed(1)}%</p>`);
    w.document.write(`<p class="ok">OK: ${complianceStats.ok}</p><p class="alerta">Alerta: ${complianceStats.alerta}</p><p class="critico">Crítico: ${complianceStats.critico}</p>`);
    w.document.write(`<h2>Registros de Temperatura</h2><table><tr><th>Data/Hora</th><th>Equipamento</th><th>Temp.</th><th>Status</th><th>Responsável</th></tr>`);
    (tempLogs || []).forEach(l => {
      w.document.write(`<tr><td>${new Date(l.recorded_at).toLocaleString('pt-BR')}</td><td>${equipmentLabels[l.equipment] || l.equipment}</td><td>${l.temperature}°C</td><td class="${l.status}">${l.status.toUpperCase()}</td><td>${(l as any).employees?.name || '—'}</td></tr>`);
    });
    w.document.write(`</table>`);
    w.document.write(`<h2>Registros de Limpeza</h2><table><tr><th>Data/Hora</th><th>Área</th><th>Responsável</th><th>Obs</th></tr>`);
    (cleanLogs || []).forEach(l => {
      w.document.write(`<tr><td>${new Date(l.cleaned_at).toLocaleString('pt-BR')}</td><td>${l.area}</td><td>${(l as any).employees?.name || '—'}</td><td>${l.notes || '—'}</td></tr>`);
    });
    w.document.write(`</table></body></html>`);
    w.document.close();
    w.print();
  };

  if (tempLoading || cleanLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Vigilância Sanitária</h1>
          <p className="text-sm text-muted-foreground">Temperatura, limpeza e conformidade</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openChecklist('abertura')} className="gap-1">📋 Abertura</Button>
          <Button variant="outline" onClick={() => openChecklist('fechamento')} className="gap-1">📋 Fechamento</Button>
          <Button variant="outline" onClick={handlePrintReport} className="gap-1"><Printer className="h-4 w-4" /> Relatório</Button>
        </div>
      </div>

      {/* Today's alerts */}
      {todayAlerts.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-5 w-5 text-destructive" /><span className="font-semibold text-destructive">Alertas de Hoje</span></div>
            {todayAlerts.map(a => {
              const cfg = statusConfig[a.status];
              return (
                <p key={a.id} className={`text-sm ${cfg.color}`}>
                  {a.status === 'critico' ? '🚨' : '⚠️'} {equipmentLabels[a.equipment]}: {a.temperature}°C às {new Date(a.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Compliance summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Thermometer className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-xl font-bold">{complianceStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 text-[hsl(var(--success))] mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">OK</p>
            <p className="text-xl font-bold text-[hsl(var(--success))]">{complianceStats.ok}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Alertas</p>
            <p className="text-xl font-bold text-[hsl(var(--warning))]">{complianceStats.alerta}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Críticos</p>
            <p className="text-xl font-bold text-destructive">{complianceStats.critico}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Conformidade</p>
            <p className={`text-xl font-bold ${complianceStats.rate >= 90 ? 'text-[hsl(var(--success))]' : complianceStats.rate >= 70 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>
              {complianceStats.rate.toFixed(1)}%
            </p>
            <Progress value={complianceStats.rate} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div><Label className="text-xs">De</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" /></div>
      </div>

      <Tabs defaultValue="temperatura">
        <TabsList>
          <TabsTrigger value="temperatura" className="gap-1"><Thermometer className="h-4 w-4" /> Temperatura</TabsTrigger>
          <TabsTrigger value="limpeza" className="gap-1"><SprayCan className="h-4 w-4" /> Limpeza</TabsTrigger>
        </TabsList>

        <TabsContent value="temperatura" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTempDialogOpen(true)} className="gap-1"><Thermometer className="h-4 w-4" /> Registrar Temperatura</Button>
          </div>

          {/* Equipment cards with latest reading */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(equipmentLabels).map(([key, label]) => {
              const latest = (tempLogs || []).find(l => l.equipment === key);
              const range = equipmentRanges[key];
              const cfg = latest ? statusConfig[latest.status] : null;
              const Icon = cfg?.icon || Thermometer;
              return (
                <Card key={key} className={latest?.status === 'critico' ? 'border-destructive' : latest?.status === 'alerta' ? 'border-[hsl(var(--warning))]' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{label}</span>
                      {cfg && <Icon className={`h-4 w-4 ${cfg.color}`} />}
                    </div>
                    {latest ? (
                      <>
                        <p className={`text-2xl font-bold ${cfg?.color}`}>{Number(latest.temperature).toFixed(1)}°C</p>
                        <p className="text-xs text-muted-foreground">{new Date(latest.recorded_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem registro</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Faixa ideal: {range.min}°C a {range.max}°C</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Temperature history table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Temperaturas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead className="text-right">Temp.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tempLogs || []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum registro</TableCell></TableRow>
                  ) : (tempLogs || []).map(l => {
                    const cfg = statusConfig[l.status];
                    return (
                      <TableRow key={l.id} className={l.status === 'critico' ? 'bg-destructive/5' : ''}>
                        <TableCell className="text-sm">{new Date(l.recorded_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell className="text-sm">{equipmentLabels[l.equipment] || l.equipment}</TableCell>
                        <TableCell className={`text-right font-semibold ${cfg.color}`}>{Number(l.temperature).toFixed(1)}°C</TableCell>
                        <TableCell><Badge variant={l.status === 'ok' ? 'default' : l.status === 'alerta' ? 'secondary' : 'destructive'} className="text-xs">{cfg.label}</Badge></TableCell>
                        <TableCell className="text-sm">{(l as any).employees?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.notes || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limpeza" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCleanDialogOpen(true)} className="gap-1"><SprayCan className="h-4 w-4" /> Registrar Limpeza</Button>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Registros de Limpeza</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cleanLogs || []).length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhum registro</TableCell></TableRow>
                  ) : (cleanLogs || []).map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{new Date(l.cleaned_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell className="text-sm font-medium">{l.area}</TableCell>
                      <TableCell className="text-sm">{(l as any).employees?.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Temperature Dialog */}
      <Dialog open={tempDialogOpen} onOpenChange={setTempDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Temperatura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Equipamento</Label>
              <Select value={tEquip} onValueChange={v => setTEquip(v as Equipment)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(equipmentLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Faixa ideal: {range.min}°C a {range.max}°C</p>
            </div>
            <div>
              <Label>Temperatura (°C)</Label>
              <Input type="number" step="0.1" value={tTemp} onChange={e => setTTemp(e.target.value)} placeholder="Ex: 4.5" className="text-lg" />
              {previewStatus && (
                <div className={`mt-1 text-sm font-medium ${statusConfig[previewStatus].color}`}>
                  {previewStatus === 'ok' ? '✅ Dentro da faixa' : previewStatus === 'alerta' ? '⚠️ Fora da faixa ideal' : '🚨 TEMPERATURA CRÍTICA!'}
                </div>
              )}
            </div>
            {activeEmployees.length > 0 && (
              <div><Label>Responsável</Label>
                <Select value={tEmployee} onValueChange={setTEmployee}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{activeEmployees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Observações</Label><Input value={tNotes} onChange={e => setTNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTempDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleTemp} disabled={!tTemp}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleaning Dialog */}
      <Dialog open={cleanDialogOpen} onOpenChange={setCleanDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Limpeza</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Área</Label>
              <Select value={cArea} onValueChange={setCArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cleaningAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {activeEmployees.length > 0 && (
              <div><Label>Responsável</Label>
                <Select value={cEmployee} onValueChange={setCEmployee}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{activeEmployees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Observações</Label><Input value={cNotes} onChange={e => setCNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleClean}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog open={checklistDialogOpen} onOpenChange={setChecklistDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Checklist de {checklistType === 'abertura' ? 'Abertura' : 'Fechamento'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {activeEmployees.length > 0 && (
              <div><Label>Responsável</Label>
                <Select value={cEmployee} onValueChange={setCEmployee}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{activeEmployees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Separator />
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Checkbox checked={item.done} onCheckedChange={(checked) => {
                  setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, done: !!checked } : c));
                }} />
                <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
              </div>
            ))}
            <Separator />
            <div className="text-sm text-muted-foreground text-center">
              {checklist.filter(c => c.done).length}/{checklist.length} itens concluídos
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleChecklist}>Salvar Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
