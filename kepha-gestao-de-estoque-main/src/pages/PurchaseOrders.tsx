import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { POStatus, PurchaseOrder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from
'@/components/ui/dropdown-menu';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  LayoutGrid,
  List,
  MoreHorizontal,
  ArrowRight,
  Eye } from
'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NewPOModal } from '@/components/purchase-orders/NewPOModal';

const statusConfig: Record<POStatus, {label: string;className: string;icon: React.ElementType;}> = {
  RASCUNHO: { label: 'Rascunho', className: 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10', icon: FileText },
  ENVIADO: { label: 'Enviado', className: 'border-sky-500/40 text-sky-400 bg-sky-500/10', icon: Clock },
  CONFIRMADO: { label: 'Confirmado', className: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10', icon: CheckCircle },
  PARCIAL: { label: 'Parcial', className: 'border-amber-500/40 text-amber-400 bg-amber-500/10', icon: AlertCircle },
  RECEBIDO: { label: 'Recebido', className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', icon: Package },
  FECHADO: { label: 'Fechado', className: 'border-zinc-500/40 text-zinc-500 bg-zinc-500/5', icon: CheckCircle }
};

const statusOrder: POStatus[] = ['RASCUNHO', 'ENVIADO', 'CONFIRMADO', 'PARCIAL', 'RECEBIDO', 'FECHADO'];

export default function PurchaseOrders() {
  const { purchaseOrders, updatePOStatus } = useAppStore();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [draggedPO, setDraggedPO] = useState<string | null>(null);

  const posByStatus = useMemo(() => {
    return statusOrder.reduce((acc, status) => {
      acc[status] = purchaseOrders.filter((po) => po.status === status);
      return acc;
    }, {} as Record<POStatus, PurchaseOrder[]>);
  }, [purchaseOrders]);

  const handleDragStart = (e: React.DragEvent, poId: string) => {
    setDraggedPO(poId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: POStatus) => {
    e.preventDefault();
    if (draggedPO) {
      const po = purchaseOrders.find((p) => p.id === draggedPO);
      if (po && po.status !== targetStatus) {
        updatePOStatus(draggedPO, targetStatus);
        toast.success(`${po.number} movido para ${statusConfig[targetStatus].label}`);
      }
    }
    setDraggedPO(null);
  };

  const advanceStatus = (po: PurchaseOrder) => {
    const idx = statusOrder.indexOf(po.status);
    if (idx < statusOrder.length - 1) {
      const next = statusOrder[idx + 1];
      updatePOStatus(po.id, next);
      toast.success(`${po.number} → ${statusConfig[next].label}`);
    }
  };

  const columns = [
  { key: 'number', label: 'PO#', width: 'w-[110px]' },
  { key: 'supplier', label: 'Fornecedor', width: 'w-[200px]' },
  { key: 'items', label: 'Itens', width: 'w-[60px]' },
  { key: 'value', label: 'Valor Total', width: 'w-[120px]' },
  { key: 'created', label: 'Criado em', width: 'w-[100px]' },
  { key: 'delivery', label: 'Entrega Prevista', width: 'w-[110px]' },
  { key: 'status', label: 'Status', width: 'w-[120px]' },
  { key: 'actions', label: 'Ações', width: 'w-[100px]' }];


  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Pedidos de Compra</h1>
          <p className="text-xs text-green-300">
            {purchaseOrders.length} pedidos · R$ {purchaseOrders.reduce((a, p) => a + p.totalValue, 0).toLocaleString('pt-BR')} total
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border rounded p-0.5">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setViewMode('kanban')}>
              
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setViewMode('table')}>
              
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button size="sm" className="h-7 text-xs" onClick={() => setModalOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Novo PO
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
      /* Kanban View */
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {statusOrder.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const pos = posByStatus[status];
          return (
            <div
              key={status}
              className="flex-1 min-w-[200px] max-w-[240px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}>
              
                {/* Column header */}
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{config.label}</span>
                  <Badge variant="outline" className="ml-auto font-mono text-[10px] px-1.5 py-0 h-4">
                    {pos.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="space-y-1.5">
                  {pos.map((po) =>
                <Card
                  key={po.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, po.id)}
                  className={cn(
                    'cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all',
                    draggedPO === po.id && 'opacity-50'
                  )}>
                  
                      <CardContent className="p-2.5 space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-xs font-semibold">{po.number}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                              {po.supplierName}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-xs">
                                <Eye className="h-3 w-3 mr-1.5" /> Detalhes
                              </DropdownMenuItem>
                              {statusOrder.indexOf(po.status) < statusOrder.length - 1 &&
                          <DropdownMenuItem className="text-xs" onClick={() => advanceStatus(po)}>
                                  <ArrowRight className="h-3 w-3 mr-1.5" /> Avançar Status
                                </DropdownMenuItem>
                          }
                              <DropdownMenuSeparator />
                              {statusOrder.filter((s) => s !== po.status).map((s) =>
                          <DropdownMenuItem key={s} className="text-xs" onClick={() => {updatePOStatus(po.id, s);toast.success(`${po.number} → ${statusConfig[s].label}`);}}>
                                  Mover para {statusConfig[s].label}
                                </DropdownMenuItem>
                          )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground flex items-center gap-0.5">
                            <Package className="h-3 w-3" />
                            {po.lines.length} itens
                          </span>
                          <span className="font-mono font-semibold">
                            R$ {po.totalValue.toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Truck className="h-3 w-3" />
                          {format(po.expectedDelivery, 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </CardContent>
                    </Card>
                )}
                  {pos.length === 0 &&
                <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed rounded">
                      Nenhum PO
                    </div>
                }
                </div>
              </div>);

        })}
        </div>) : (

      /* Table View */
      <Card>
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center border-b bg-muted/30 px-3 h-8 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {columns.map((col) =>
            <div key={col.key} className={cn(col.width, 'shrink-0 px-1')}>
                  {col.label}
                </div>
            )}
            </div>

            {/* Rows */}
            <div className="max-h-[calc(100vh-260px)] min-h-[300px] overflow-auto">
              {purchaseOrders.map((po) => {
              const config = statusConfig[po.status];
              return (
                <div key={po.id} className="flex items-center px-3 border-b border-border/40 hover:bg-muted/30 transition-colors" style={{ height: 38 }}>
                    <div className={cn(columns[0].width, 'shrink-0 px-1 font-mono text-xs font-semibold')}>
                      {po.number}
                    </div>
                    <div className={cn(columns[1].width, 'shrink-0 px-1 text-xs truncate')}>
                      {po.supplierName}
                    </div>
                    <div className={cn(columns[2].width, 'shrink-0 px-1 text-xs font-mono text-center')}>
                      {po.lines.length}
                    </div>
                    <div className={cn(columns[3].width, 'shrink-0 px-1 text-xs font-mono text-right font-medium')}>
                      R$ {po.totalValue.toLocaleString('pt-BR')}
                    </div>
                    <div className={cn(columns[4].width, 'shrink-0 px-1 text-[11px] text-muted-foreground font-mono')}>
                      {format(po.createdAt, 'dd/MM/yy', { locale: ptBR })}
                    </div>
                    <div className={cn(columns[5].width, 'shrink-0 px-1 text-[11px] text-muted-foreground font-mono')}>
                      {format(po.expectedDelivery, 'dd/MM/yy', { locale: ptBR })}
                    </div>
                    <div className={cn(columns[6].width, 'shrink-0 px-1')}>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.className)}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className={cn(columns[7].width, 'shrink-0 px-1 flex items-center gap-1')}>
                      <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5">
                        <Eye className="h-3 w-3" />
                      </Button>
                      {statusOrder.indexOf(po.status) < statusOrder.length - 1 &&
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-primary" onClick={() => advanceStatus(po)}>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                    }
                    </div>
                  </div>);

            })}
            </div>
          </CardContent>
        </Card>)
      }

      <NewPOModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>);

}