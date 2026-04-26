import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, AlertTriangle, ChevronDown, Search } from 'lucide-react';
import { useAuditLogs, formatAuditDescription, isSuspiciousEvent, TABLE_LABELS, ACTION_LABELS, type AuditLog } from '@/hooks/useAuditLogs';

function DiffView({ oldVal, newVal }: { oldVal: Record<string, any> | null; newVal: Record<string, any> | null }) {
  const allKeys = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
  const changedKeys = Array.from(allKeys).filter(k => {
    const o = oldVal?.[k];
    const n = newVal?.[k];
    return JSON.stringify(o) !== JSON.stringify(n);
  });

  if (changedKeys.length === 0) return <p className="text-xs text-muted-foreground">Sem diferenças detectadas</p>;

  return (
    <div className="space-y-1 text-xs font-mono max-h-60 overflow-auto">
      {changedKeys.map(key => (
        <div key={key} className="space-y-0.5">
          <span className="text-muted-foreground font-semibold">{key}:</span>
          {oldVal?.[key] !== undefined && (
            <div className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">
              - {JSON.stringify(oldVal[key])}
            </div>
          )}
          {newVal?.[key] !== undefined && (
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
              + {JSON.stringify(newVal[key])}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: logs, isLoading } = useAuditLogs({
    action: actionFilter || undefined,
    tableName: tableFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const suspiciousCount = (logs || []).filter(isSuspiciousEvent).length;

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
            <Shield className="h-6 w-6" /> Auditoria
          </h1>
          <p className="text-sm text-muted-foreground">Histórico de ações e eventos de segurança</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Eventos</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{(logs || []).length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Eventos Hoje</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {(logs || []).filter(l => l.created_at.startsWith(new Date().toISOString().split('T')[0])).length}
            </p>
          </CardContent>
        </Card>
        <Card className={suspiciousCount > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Eventos Suspeitos
            </CardTitle>
          </CardHeader>
          <CardContent><p className={`text-xl font-bold ${suspiciousCount > 0 ? 'text-destructive' : ''}`}>{suspiciousCount}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Ação</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="INSERT">Inserção</SelectItem>
                  <SelectItem value="UPDATE">Edição</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tabela</Label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(TABLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event list */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum evento encontrado
                </TableCell>
              </TableRow>
            ) : (
              (logs || []).map(log => (
                <Collapsible key={log.id} asChild>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow className={`cursor-pointer hover:bg-muted/50 ${isSuspiciousEvent(log) ? 'bg-destructive/5' : ''}`}>
                        <TableCell>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm">{log.user_email?.split('@')[0] || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'INSERT' ? 'default' : 'secondary'} className="text-xs">
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatAuditDescription(log)}</TableCell>
                        <TableCell>
                          {isSuspiciousEvent(log) && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Suspeito
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold mb-2 text-muted-foreground">Detalhes</p>
                              <div className="space-y-1 text-xs">
                                <p><strong>Tabela:</strong> {TABLE_LABELS[log.table_name || ''] || log.table_name}</p>
                                <p><strong>ID do Registro:</strong> {log.record_id}</p>
                                <p><strong>Usuário:</strong> {log.user_email}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-2 text-muted-foreground">Alterações</p>
                              <DiffView oldVal={log.old_value} newVal={log.new_value} />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
