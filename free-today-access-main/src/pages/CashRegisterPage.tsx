import { useState, useMemo, useRef } from 'react';
import {
  useActiveCashSession, useCashSessions, useCashMovements,
  useOpenCashSession, useCloseCashSession, useCreateCashMovement,
} from '@/hooks/useCashRegister';
import { useSales } from '@/hooks/useSales';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, Printer, Clock, AlertTriangle } from 'lucide-react';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export default function CashRegisterPage() {
  const { data: activeSession, isLoading } = useActiveCashSession();
  const { data: allSessions } = useCashSessions();
  const { data: employees } = useEmployees();
  const openSession = useOpenCashSession();
  const closeSession = useCloseCashSession();
  const createMovement = useCreateCashMovement();

  // Get today's sales for breakdown
  const today = new Date().toISOString().split('T')[0];
  const { data: todaySales } = useSales(today);
  const { data: movements } = useCashMovements(activeSession?.id);

  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'sangria' | 'suprimento'>('sangria');
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

  const [openingBalance, setOpeningBalance] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [openNotes, setOpenNotes] = useState('');
  const [actualBalance, setActualBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [movAmount, setMovAmount] = useState('');
  const [movReason, setMovReason] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);

  // Payment breakdown from today's sales
  const paymentBreakdown = useMemo(() => {
    const activeSales = (todaySales || []).filter(s => s.status !== 'cancelado');
    const breakdown: Record<string, number> = { dinheiro: 0, pix: 0, cartao: 0, app: 0 };
    activeSales.forEach(s => { breakdown[s.payment_method] = (breakdown[s.payment_method] || 0) + Number(s.total_amount); });
    return breakdown;
  }, [todaySales]);

  const totalSales = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);
  const cashSales = paymentBreakdown.dinheiro || 0;

  // Sangrias and suprimentos totals
  const sangriasTotal = (movements || []).filter(m => m.type === 'sangria').reduce((s, m) => s + Number(m.amount), 0);
  const suprimentosTotal = (movements || []).filter(m => m.type === 'suprimento').reduce((s, m) => s + Number(m.amount), 0);

  // Expected cash = opening + cash sales + suprimentos - sangrias
  const expectedCash = activeSession
    ? Number(activeSession.opening_balance) + cashSales + suprimentosTotal - sangriasTotal
    : 0;

  const handleOpen = () => {
    openSession.mutate({ opening_balance: parseFloat(openingBalance) || 0, employee_id: employeeId || undefined, notes: openNotes || undefined });
    setOpenDialogOpen(false);
    setOpeningBalance(''); setEmployeeId(''); setOpenNotes('');
  };

  const handleClose = () => {
    if (!activeSession) return;
    closeSession.mutate({ id: activeSession.id, actual_balance: parseFloat(actualBalance) || 0, expected_balance: expectedCash, notes: closeNotes || undefined });
    setCloseDialogOpen(false);
    setActualBalance(''); setCloseNotes('');
  };

  const handleMovement = () => {
    if (!activeSession) return;
    createMovement.mutate({ session_id: activeSession.id, type: movementType, amount: parseFloat(movAmount) || 0, reason: movReason || undefined });
    setMovementDialogOpen(false);
    setMovAmount(''); setMovReason('');
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Fechamento de Caixa</title><style>body{font-family:monospace;padding:20px;font-size:14px}table{width:100%;border-collapse:collapse}td,th{padding:4px 8px;text-align:left;border-bottom:1px dashed #ccc}.right{text-align:right}h2,h3{margin:8px 0}hr{border:1px dashed #333;margin:12px 0}</style></head><body>`);
    printWindow.document.write(reportRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const activeEmployees = (employees || []).filter((e: any) => e.status === 'ativo');
  const closedDiff = activeSession ? parseFloat(actualBalance || '0') - expectedCash : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Caixa</h1>
          <p className="text-sm text-muted-foreground">Abertura, fechamento e movimentações</p>
        </div>
        {!activeSession ? (
          <Button onClick={() => setOpenDialogOpen(true)} size="lg" className="gap-2"><Unlock className="h-5 w-5" /> Abrir Caixa</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setMovementType('suprimento'); setMovementDialogOpen(true); }} className="gap-1"><ArrowDownCircle className="h-4 w-4" /> Suprimento</Button>
            <Button variant="outline" onClick={() => { setMovementType('sangria'); setMovementDialogOpen(true); }} className="gap-1"><ArrowUpCircle className="h-4 w-4" /> Sangria</Button>
            <Button variant="destructive" onClick={() => setCloseDialogOpen(true)} className="gap-2"><Lock className="h-4 w-4" /> Fechar Caixa</Button>
          </div>
        )}
      </div>

      {/* Active session info */}
      {activeSession && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Aberto às</p>
                <p className="font-bold">{new Date(activeSession.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                {(activeSession as any).employees?.name && <p className="text-xs text-muted-foreground">{(activeSession as any).employees.name}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <DollarSign className="h-5 w-5 text-[hsl(var(--success))] mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Troco Inicial</p>
                <p className="font-bold">{fmt(Number(activeSession.opening_balance))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Vendas em Dinheiro</p>
                <p className="font-bold">{fmt(cashSales)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Esperado no Caixa</p>
                <p className="text-xl font-bold text-primary">{fmt(expectedCash)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Forma de Pagamento</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Dinheiro', key: 'dinheiro', icon: '💵' },
                  { label: 'PIX', key: 'pix', icon: '📱' },
                  { label: 'Cartão', key: 'cartao', icon: '💳' },
                  { label: 'App', key: 'app', icon: '📲' },
                ].map(pm => (
                  <div key={pm.key} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <span className="text-lg">{pm.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">{pm.label}</p>
                      <p className="font-semibold">{fmt(paymentBreakdown[pm.key] || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de vendas:</span>
                <span className="font-bold">{fmt(totalSales)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Movements */}
          {movements && movements.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Movimentações do Turno</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === 'sangria' ? 'destructive' : 'default'} className="text-xs">
                            {m.type === 'sangria' ? '↑ Sangria' : '↓ Suprimento'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${m.type === 'sangria' ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
                          {m.type === 'sangria' ? '-' : '+'}{fmt(Number(m.amount))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.reason || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between text-sm mt-3 pt-2 border-t">
                  <span>Sangrias: <strong className="text-destructive">-{fmt(sangriasTotal)}</strong></span>
                  <span>Suprimentos: <strong className="text-[hsl(var(--success))]">+{fmt(suprimentosTotal)}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de Caixas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead className="text-right">Abertura</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Contado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(allSessions || []).filter(s => s.status === 'fechado').slice(0, 20).map(s => {
                const diff = Number(s.difference || 0);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{new Date(s.opened_at).toLocaleDateString('pt-BR')} {new Date(s.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell className="text-sm">{(s as any).employees?.name || '—'}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(Number(s.opening_balance))}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(Number(s.expected_balance))}</TableCell>
                    <TableCell className="text-right text-sm">{s.actual_balance != null ? fmt(Number(s.actual_balance)) : '—'}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${diff > 0 ? 'text-[hsl(var(--success))]' : diff < 0 ? 'text-destructive' : ''}`}>
                      {diff > 0 ? '+' : ''}{fmt(diff)}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">Fechado</Badge></TableCell>
                  </TableRow>
                );
              })}
              {(allSessions || []).filter(s => s.status === 'fechado').length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhum caixa fechado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Open Cash Dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Troco Inicial (R$)</Label><Input type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="Ex: 200.00" /></div>
            {activeEmployees.length > 0 && (
              <div><Label>Operador</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{activeEmployees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Observações</Label><Input value={openNotes} onChange={e => setOpenNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleOpen}>Abrir Caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Fechar Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Closing report preview */}
            <div ref={reportRef} className="space-y-3 text-sm">
              <h2 className="font-bold text-center text-base">Relatório de Fechamento</h2>
              <p className="text-center text-muted-foreground">{new Date().toLocaleDateString('pt-BR')} — {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between"><span>Troco inicial:</span><span>{fmt(Number(activeSession?.opening_balance || 0))}</span></div>
                <div className="flex justify-between"><span>Vendas (dinheiro):</span><span className="text-[hsl(var(--success))]">+{fmt(cashSales)}</span></div>
                <div className="flex justify-between"><span>Vendas (PIX):</span><span>{fmt(paymentBreakdown.pix || 0)}</span></div>
                <div className="flex justify-between"><span>Vendas (Cartão):</span><span>{fmt(paymentBreakdown.cartao || 0)}</span></div>
                <div className="flex justify-between"><span>Vendas (App):</span><span>{fmt(paymentBreakdown.app || 0)}</span></div>
                <Separator />
                <div className="flex justify-between"><span>Suprimentos:</span><span className="text-[hsl(var(--success))]">+{fmt(suprimentosTotal)}</span></div>
                <div className="flex justify-between"><span>Sangrias:</span><span className="text-destructive">-{fmt(sangriasTotal)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span>Total vendas:</span><span>{fmt(totalSales)}</span></div>
                <div className="flex justify-between font-bold text-primary"><span>Esperado em caixa (dinheiro):</span><span>{fmt(expectedCash)}</span></div>
              </div>
            </div>

            <Separator />
            <div><Label className="font-semibold">Valor contado no caixa (R$)</Label><Input type="number" step="0.01" value={actualBalance} onChange={e => setActualBalance(e.target.value)} placeholder="Informe o valor contado..." className="text-lg h-12" /></div>
            {actualBalance && (
              <Card className={closedDiff === 0 ? 'border-[hsl(var(--success))]' : 'border-destructive'}>
                <CardContent className="p-3 text-center">
                  {closedDiff === 0 ? (
                    <p className="text-[hsl(var(--success))] font-bold">✅ Caixa confere!</p>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className={closedDiff > 0 ? 'text-[hsl(var(--success))] font-bold' : 'text-destructive font-bold'}>
                        {closedDiff > 0 ? `Sobra: +${fmt(closedDiff)}` : `Falta: ${fmt(closedDiff)}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <div><Label>Observações</Label><Input value={closeNotes} onChange={e => setCloseNotes(e.target.value)} /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-1"><Printer className="h-4 w-4" /> Imprimir</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleClose} disabled={!actualBalance}>Confirmar Fechamento</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{movementType === 'sangria' ? 'Registrar Sangria' : 'Registrar Suprimento'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {movementType === 'sangria' ? 'Retirada de dinheiro do caixa' : 'Adição de dinheiro ao caixa'}
            </p>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={movAmount} onChange={e => setMovAmount(e.target.value)} /></div>
            <div><Label>Motivo</Label><Input value={movReason} onChange={e => setMovReason(e.target.value)} placeholder={movementType === 'sangria' ? 'Ex: Pagamento fornecedor' : 'Ex: Troco adicional'} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMovement} disabled={!movAmount}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
