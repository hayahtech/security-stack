import { useState, useMemo } from 'react';
import { printKitchenOrder, printCustomerReceipt } from '@/lib/print';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Users, Clock, Receipt, ArrowRightLeft, X, Printer, Search } from 'lucide-react';
import {
  useTables, useCreateTable, useOpenTableSession, useCloseTableSession,
  useRequestBill, useTransferTable, useTableOrders, useAddTableOrder,
  useCancelTableOrder, useTableSession, useUpdateTable,
} from '@/hooks/useTables';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateSale } from '@/hooks/useSales';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  livre: { label: 'Livre', color: 'text-green-700', bg: 'bg-green-100 border-green-400 dark:bg-green-950 dark:border-green-700' },
  ocupada: { label: 'Ocupada', color: 'text-red-700', bg: 'bg-red-50 border-red-400 dark:bg-red-950 dark:border-red-700' },
  conta_pedida: { label: 'Conta Pedida', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-400 dark:bg-yellow-950 dark:border-yellow-700' },
  reservada: { label: 'Reservada', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-400 dark:bg-blue-950 dark:border-blue-700' },
  limpeza: { label: 'Limpeza', color: 'text-muted-foreground', bg: 'bg-muted border-muted-foreground/30' },
};

const locationLabels: Record<string, string> = { salao: 'Salão', varanda: 'Varanda', vip: 'VIP', delivery: 'Delivery' };

export default function TablesPage() {
  const { data: tables, isLoading } = useTables();
  const { data: menuItems } = useMenuItems();
  const { data: employees } = useEmployees();
  const createTable = useCreateTable();
  const openSession = useOpenTableSession();
  const closeSession = useCloseTableSession();
  const requestBill = useRequestBill();
  const transferTable = useTransferTable();
  const createSale = useCreateSale();

  const [showNewTable, setShowNewTable] = useState(false);
  const [newTable, setNewTable] = useState({ number: 1, capacity: 4, location: 'salao' });
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [openForm, setOpenForm] = useState({ customer_count: 1, waiter_id: '' });
  const [showSheet, setShowSheet] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const [showTransfer, setShowTransfer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [splitMode, setSplitMode] = useState<'none' | 'equal' | 'items'>('none');
  const [splitCount, setSplitCount] = useState(2);
  const [showCancel, setShowCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const filtered = useMemo(() => {
    if (!tables) return [];
    if (locationFilter === 'all') return tables;
    return tables.filter((t: any) => t.location === locationFilter);
  }, [tables, locationFilter]);

  const handleTableClick = (table: any) => {
    setSelectedTable(table);
    if (table.status === 'livre') {
      setOpenForm({ customer_count: 1, waiter_id: '' });
      setShowOpenModal(true);
    } else {
      setShowSheet(true);
    }
  };

  const handleOpenTable = async () => {
    await openSession.mutateAsync({
      table_id: selectedTable.id,
      customer_count: openForm.customer_count,
      waiter_id: openForm.waiter_id || undefined,
    });
    setShowOpenModal(false);
  };

  const handleCreateTable = async () => {
    await createTable.mutateAsync(newTable);
    setShowNewTable(false);
    setNewTable({ number: 1, capacity: 4, location: 'salao' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mesas & Comandas</h1>
          <p className="text-muted-foreground">Gerencie mesas, pedidos e comandas</p>
        </div>
        <div className="flex gap-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="salao">Salão</SelectItem>
              <SelectItem value="varanda">Varanda</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewTable(true)}><Plus className="h-4 w-4 mr-1" />Nova Mesa</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['livre', 'ocupada', 'conta_pedida', 'reservada', 'limpeza'].map(s => {
          const count = tables?.filter((t: any) => t.status === s).length ?? 0;
          const cfg = statusConfig[s];
          return (
            <Card key={s} className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold">{count}</p>
                <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((table: any) => (
            <TableCard key={table.id} table={table} onClick={() => handleTableClick(table)} />
          ))}
        </div>
      )}

      {/* New Table Dialog */}
      <Dialog open={showNewTable} onOpenChange={setShowNewTable}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Mesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Número</Label><Input type="number" value={newTable.number} onChange={e => setNewTable(p => ({ ...p, number: Number(e.target.value) }))} /></div>
            <div><Label>Capacidade</Label><Input type="number" value={newTable.capacity} onChange={e => setNewTable(p => ({ ...p, capacity: Number(e.target.value) }))} /></div>
            <div>
              <Label>Localização</Label>
              <Select value={newTable.location} onValueChange={v => setNewTable(p => ({ ...p, location: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salao">Salão</SelectItem>
                  <SelectItem value="varanda">Varanda</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreateTable} disabled={createTable.isPending}>Cadastrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Table Dialog */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir Mesa {selectedTable?.number}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Número de Pessoas</Label><Input type="number" min={1} value={openForm.customer_count} onChange={e => setOpenForm(p => ({ ...p, customer_count: Number(e.target.value) }))} /></div>
            <div>
              <Label>Garçom</Label>
              <Select value={openForm.waiter_id} onValueChange={v => setOpenForm(p => ({ ...p, waiter_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {employees?.filter((e: any) => e.status === 'ativo').map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleOpenTable} disabled={openSession.isPending}>Abrir Mesa</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Detail Sheet */}
      {selectedTable && selectedTable.status !== 'livre' && (
        <TableDetailSheet
          table={selectedTable}
          open={showSheet}
          onOpenChange={setShowSheet}
          menuItems={menuItems ?? []}
          tables={tables ?? []}
          onRequestBill={() => requestBill.mutateAsync({ sessionId: selectedTable.current_session_id, tableId: selectedTable.id })}
          onCloseTable={async (method: string) => {
            const orders = await (supabase as any).from('table_orders').select('*').eq('table_session_id', selectedTable.current_session_id).neq('status', 'cancelado');
            const items = (orders.data || []).map((o: any) => ({
              menu_item_id: o.menu_item_id,
              quantity: o.quantity,
              unit_price: o.unit_price,
              subtotal: o.subtotal,
              notes: o.notes,
            }));
            const total = items.reduce((s: number, i: any) => s + i.subtotal, 0);
            if (items.length > 0) {
              await createSale.mutateAsync({
                channel: 'balcao',
                customer_name: `Mesa ${selectedTable.number}`,
                table_number: String(selectedTable.number),
                payment_method: method as any,
                total_amount: total,
                items,
              });
            }
            await closeSession.mutateAsync({ sessionId: selectedTable.current_session_id, tableId: selectedTable.id });
            setShowSheet(false);
          }}
          onTransfer={async (toTableId: string) => {
            await transferTable.mutateAsync({ sessionId: selectedTable.current_session_id, fromTableId: selectedTable.id, toTableId });
            setShowSheet(false);
          }}
        />
      )}
    </div>
  );
}

function TableCard({ table, onClick }: { table: any; onClick: () => void }) {
  const cfg = statusConfig[table.status] || statusConfig.livre;
  const isOccupied = ['ocupada', 'conta_pedida'].includes(table.status);

  return (
    <Card className={`cursor-pointer border-2 transition-all hover:scale-105 ${cfg.bg}`} onClick={onClick}>
      <CardContent className="pt-4 pb-3 text-center space-y-1">
        <p className="text-2xl font-bold">{table.number}</p>
        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />{table.capacity}
        </div>
        <p className="text-xs text-muted-foreground">{locationLabels[table.location]}</p>
        {isOccupied && table.current_session_id && <OccupiedInfo sessionId={table.current_session_id} />}
      </CardContent>
    </Card>
  );
}

function OccupiedInfo({ sessionId }: { sessionId: string }) {
  const { data: session } = useTableSession(sessionId);
  const { data: orders } = useTableOrders(sessionId);
  if (!session) return null;
  const total = orders?.filter((o: any) => o.status !== 'cancelado').reduce((s: number, o: any) => s + Number(o.subtotal), 0) ?? 0;
  const elapsed = formatDistanceToNow(new Date(session.opened_at), { locale: ptBR, addSuffix: false });

  return (
    <div className="space-y-0.5 mt-1">
      <div className="flex items-center justify-center gap-1 text-xs"><Clock className="h-3 w-3" />{elapsed}</div>
      {total > 0 && <p className="text-xs font-semibold">R$ {total.toFixed(2)}</p>}
      {session.employees?.name && <p className="text-xs text-muted-foreground truncate">{session.employees.name}</p>}
    </div>
  );
}

// Import supabase for inline query in onCloseTable
import { supabase } from '@/integrations/supabase/client';

function TableDetailSheet({ table, open, onOpenChange, menuItems, tables, onRequestBill, onCloseTable, onTransfer }: {
  table: any; open: boolean; onOpenChange: (v: boolean) => void;
  menuItems: any[]; tables: any[];
  onRequestBill: () => void; onCloseTable: (method: string) => void; onTransfer: (toTableId: string) => void;
}) {
  const { data: session } = useTableSession(table.current_session_id);
  const { data: orders, isLoading } = useTableOrders(table.current_session_id);
  const addOrder = useAddTableOrder();
  const cancelOrder = useCancelTableOrder();

  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState('dinheiro');
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCancel, setShowCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [splitMode, setSplitMode] = useState<'none' | 'equal'>('none');
  const [splitCount, setSplitCount] = useState(2);
  const [showAddItems, setShowAddItems] = useState(false);

  const activeOrders = orders?.filter((o: any) => o.status !== 'cancelado') ?? [];
  const total = activeOrders.reduce((s: number, o: any) => s + Number(o.subtotal), 0);
  const elapsed = session ? formatDistanceToNow(new Date(session.opened_at), { locale: ptBR, addSuffix: false }) : '';

  const filteredMenu = menuItems.filter((m: any) => m.active && m.name.toLowerCase().includes(search.toLowerCase()));
  const freeTables = tables.filter((t: any) => t.status === 'livre' && t.id !== table.id);

  const handleAddItem = async (item: any) => {
    await addOrder.mutateAsync({
      table_session_id: table.current_session_id,
      menu_item_id: item.id,
      quantity: 1,
      unit_price: item.sale_price,
    });
  };

  const handleCancel = async () => {
    if (showCancel && cancelReason.trim()) {
      await cancelOrder.mutateAsync({ id: showCancel, reason: cancelReason });
      setShowCancel(null);
      setCancelReason('');
    }
  };

  const handlePrintComanda = () => {
    printKitchenOrder({
      tableNumber: table.number,
      orderNumber: table.current_session_id?.slice(0, 8),
      waiterName: session?.employees?.name,
      items: activeOrders.map((o: any) => ({
        name: o.menu_items?.name || 'Item',
        quantity: o.quantity,
        notes: o.notes || undefined,
        category: o.menu_items?.category,
      })),
      createdAt: new Date().toISOString(),
    });
  };

  const handlePrintReceipt = () => {
    printCustomerReceipt({
      date: new Date().toLocaleDateString('pt-BR'),
      tableNumber: String(table.number),
      waiterName: session?.employees?.name,
      orderNumber: table.current_session_id?.slice(0, 8) || '',
      items: activeOrders.map((o: any) => ({
        name: o.menu_items?.name || 'Item',
        quantity: o.quantity,
        total: Number(o.subtotal),
      })),
      subtotal: total,
      discount: 0,
      total: total,
      paymentMethod: payMethod || 'Dinheiro',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Mesa {table.number}
            <Badge variant="outline" className={statusConfig[table.status]?.color}>{statusConfig[table.status]?.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{elapsed}</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{session?.customer_count ?? 0} pessoas</span>
          {session?.employees?.name && <span>Garçom: {session.employees.name}</span>}
        </div>

        <Separator />

        {/* Orders list */}
        <ScrollArea className="flex-1 -mx-2">
          <div className="px-2 space-y-2">
            {isLoading ? <p className="text-muted-foreground text-sm">Carregando...</p> : activeOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum item pedido</p>
            ) : activeOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                <div>
                  <p className="text-sm font-medium">{o.quantity}x {o.menu_items?.name}</p>
                  {o.notes && <p className="text-xs text-muted-foreground">{o.notes}</p>}
                  <Badge variant="outline" className="text-xs mt-1">{o.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">R$ {Number(o.subtotal).toFixed(2)}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setShowCancel(o.id); setCancelReason(''); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Total + split */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          {splitMode === 'equal' && splitCount > 1 && (
            <p className="text-sm text-muted-foreground text-right">
              {splitCount}x de R$ {(total / splitCount).toFixed(2)}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSplitMode(splitMode === 'equal' ? 'none' : 'equal')}>
              Dividir conta
            </Button>
            {splitMode === 'equal' && (
              <Input type="number" min={2} className="w-20" value={splitCount} onChange={e => setSplitCount(Number(e.target.value))} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button onClick={() => setShowAddItems(!showAddItems)} variant="outline">
            <Plus className="h-4 w-4 mr-1" />Adicionar Itens
          </Button>
          <Button onClick={handlePrintComanda} variant="outline">
            <Printer className="h-4 w-4 mr-1" />Imprimir Comanda
          </Button>
          <Button onClick={onRequestBill} variant="outline" className="text-yellow-600" disabled={table.status === 'conta_pedida'}>
            <Receipt className="h-4 w-4 mr-1" />Pedir Conta
          </Button>
          <Button onClick={() => setShowTransfer(true)} variant="outline">
            <ArrowRightLeft className="h-4 w-4 mr-1" />Transferir
          </Button>
          <Button onClick={() => setShowPayment(true)} className="col-span-2" variant="default">
            Fechar Mesa
          </Button>
        </div>

        {/* Add Items Panel */}
        {showAddItems && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
            </div>
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {filteredMenu.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer" onClick={() => handleAddItem(item)}>
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium">R$ {Number(item.sale_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent>
            <DialogHeader><DialogTitle>Fechar Mesa {table.number}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-lg font-bold">Total: R$ {total.toFixed(2)}</p>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handlePrintReceipt}><Printer className="h-4 w-4 mr-1" />Imprimir Cupom</Button>
              <Button onClick={() => { onCloseTable(payMethod); setShowPayment(false); }}>Confirmar Fechamento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
          <DialogContent>
            <DialogHeader><DialogTitle>Transferir para outra mesa</DialogTitle></DialogHeader>
            {freeTables.length === 0 ? <p className="text-muted-foreground">Nenhuma mesa livre disponível</p> : (
              <div className="grid grid-cols-3 gap-2">
                {freeTables.map((t: any) => (
                  <Button key={t.id} variant="outline" onClick={() => { onTransfer(t.id); setShowTransfer(false); }}>
                    Mesa {t.number}
                  </Button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={!!showCancel} onOpenChange={() => setShowCancel(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Cancelar Item</DialogTitle></DialogHeader>
            <div><Label>Motivo (obrigatório)</Label><Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Informe o motivo..." /></div>
            <DialogFooter><Button onClick={handleCancel} disabled={!cancelReason.trim()} variant="destructive">Cancelar Item</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
