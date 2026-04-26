import { useMemo, useState } from 'react';
import { SKU, StockMovement, MovementType } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CornerDownLeft,
  Flame,
  XCircle,
  Truck,
  Mail,
  Phone,
  Clock,
  Calendar,
  Package,
  Edit,
  ShoppingCart,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const movementIcon: Record<MovementType, { icon: typeof ArrowDownLeft; color: string }> = {
  ENTRADA: { icon: ArrowDownLeft, color: 'text-success' },
  SAÍDA: { icon: ArrowUpRight, color: 'text-destructive' },
  TRANSFERÊNCIA: { icon: RefreshCw, color: 'text-primary' },
  AJUSTE: { icon: AlertTriangle, color: 'text-warning' },
  DEVOLUÇÃO: { icon: CornerDownLeft, color: 'text-warning' },
  AVARIA: { icon: Flame, color: 'text-destructive' },
  BAIXA: { icon: XCircle, color: 'text-destructive' },
};

interface Props {
  sku: SKU | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SKUDetailDrawer({ sku, open, onOpenChange }: Props) {
  const { warehouses, movements, suppliers, updateSKU } = useAppStore();
  const [editingReorder, setEditingReorder] = useState(false);
  const [reorderPoint, setReorderPoint] = useState(0);
  const [minOrderQty, setMinOrderQty] = useState(0);

  const supplier = useMemo(
    () => (sku ? suppliers.find((s) => s.id === sku.supplierId) : null),
    [sku, suppliers]
  );

  const skuMovements = useMemo(
    () => (sku ? movements.filter((m) => m.skuId === sku.id).slice(0, 15) : []),
    [sku, movements]
  );

  // Distribute stock across warehouses proportionally (mock)
  const warehouseStock = useMemo(() => {
    if (!sku) return [];
    const ratios = [0.55, 0.28, 0.17];
    return warehouses.map((wh, i) => {
      const available = Math.floor(sku.available * (ratios[i] || 0.1));
      const reserved = Math.floor(sku.reserved * (ratios[i] || 0.1));
      const total = available + reserved;
      const capacity = Math.floor(sku.stock * 1.5 * (ratios[i] || 0.1));
      return { warehouse: wh, available, reserved, total, capacity, utilization: capacity > 0 ? Math.round((total / capacity) * 100) : 0 };
    });
  }, [sku, warehouses]);

  const lastDeliveryMovement = useMemo(
    () => skuMovements.find((m) => m.type === 'ENTRADA'),
    [skuMovements]
  );

  if (!sku) return null;

  const statusColor =
    sku.status === 'active'
      ? 'bg-success/15 text-success border-success/20'
      : sku.status === 'inactive'
      ? 'bg-muted text-muted-foreground border-border'
      : 'bg-destructive/15 text-destructive border-destructive/20';
  const statusLabel = sku.status === 'active' ? 'Ativo' : sku.status === 'inactive' ? 'Inativo' : 'Descontinuado';

  const handleSaveReorder = () => {
    updateSKU(sku.id, { reorderPoint });
    setEditingReorder(false);
  };

  const startEditing = () => {
    setReorderPoint(sku.reorderPoint);
    setMinOrderQty(Math.ceil(sku.reorderPoint * 1.5));
    setEditingReorder(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 flex flex-col gap-0" side="right">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{sku.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-muted-foreground">{sku.id}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border rounded ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Estoque', value: sku.stock, mono: true },
                { label: 'Reservado', value: sku.reserved, mono: true },
                { label: 'Disponível', value: sku.available, mono: true, highlight: true },
                { label: 'Lead Time', value: `${sku.leadTime}d`, mono: true },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-2 rounded border border-border bg-muted/20">
                  <div className={`text-sm font-bold ${stat.highlight ? 'text-success' : ''} ${stat.mono ? 'font-mono' : ''}`}>
                    {stat.value}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Estoque por Armazém */}
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Estoque por Armazém
              </h3>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-2.5 py-1.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Armazém</th>
                      <th className="px-2.5 py-1.5 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Disp.</th>
                      <th className="px-2.5 py-1.5 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Res.</th>
                      <th className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-24">Utilização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseStock.map((ws) => (
                      <tr key={ws.warehouse.id} className="border-b border-border/50 last:border-0">
                        <td className="px-2.5 py-1.5">
                          <div className="font-medium text-[11px]">{ws.warehouse.city}</div>
                          <div className="text-[9px] text-muted-foreground">{ws.warehouse.state}</div>
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono text-[11px] text-success">{ws.available}</td>
                        <td className="px-2.5 py-1.5 text-right font-mono text-[11px] text-muted-foreground">{ws.reserved}</td>
                        <td className="px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <Progress value={ws.utilization} className="h-1.5 flex-1" />
                            <span className="font-mono text-[10px] text-muted-foreground w-7 text-right">{ws.utilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <Separator />

            {/* Histórico de Movimentações */}
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Histórico de Movimentações
              </h3>
              {skuMovements.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Sem movimentações registradas</p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
                  <div className="space-y-0">
                    {skuMovements.map((mov) => {
                      const config = movementIcon[mov.type];
                      const Icon = config.icon;
                      return (
                        <div key={mov.id} className="flex items-start gap-2.5 py-1.5 relative">
                          <div className={`w-[22px] h-[22px] rounded-full border border-border bg-card flex items-center justify-center shrink-0 z-10 ${config.color}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium">{mov.type}</span>
                              <span className={`font-mono text-[11px] font-medium ${mov.type === 'ENTRADA' || mov.type === 'DEVOLUÇÃO' ? 'text-success' : mov.type === 'SAÍDA' || mov.type === 'AVARIA' || mov.type === 'BAIXA' ? 'text-destructive' : 'text-warning'}`}>
                                {mov.type === 'ENTRADA' || mov.type === 'DEVOLUÇÃO' ? '+' : mov.type === 'SAÍDA' || mov.type === 'AVARIA' || mov.type === 'BAIXA' ? '-' : '±'}
                                {mov.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span>{format(mov.timestamp, "dd MMM HH:mm", { locale: ptBR })}</span>
                              <span>·</span>
                              <span>{mov.operator}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* Fornecedor */}
            {supplier && (
              <section>
                <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Fornecedor
                </h3>
                <div className="border border-border rounded p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{supplier.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Lead Time: <span className="font-mono text-foreground">{supplier.leadTime}d</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Última: <span className="font-mono text-foreground">{lastDeliveryMovement ? format(lastDeliveryMovement.timestamp, 'dd/MM/yy') : 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{supplier.phone}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <div className="flex-1 text-center p-1.5 rounded bg-muted/30 border border-border">
                      <div className="font-mono text-xs font-bold text-success">{supplier.onTimeDeliveryRate}%</div>
                      <div className="text-[9px] text-muted-foreground uppercase">On-Time</div>
                    </div>
                    <div className="flex-1 text-center p-1.5 rounded bg-muted/30 border border-border">
                      <div className="font-mono text-xs font-bold">{supplier.fillRate}%</div>
                      <div className="text-[9px] text-muted-foreground uppercase">Fill Rate</div>
                    </div>
                    <div className="flex-1 text-center p-1.5 rounded bg-muted/30 border border-border">
                      <div className="font-mono text-xs font-bold">{supplier.totalOrders}</div>
                      <div className="text-[9px] text-muted-foreground uppercase">Pedidos</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Configurações de Reposição */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Configurações de Reposição
                </h3>
                {!editingReorder && (
                  <button onClick={startEditing} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    <Edit className="h-2.5 w-2.5" /> Editar
                  </button>
                )}
              </div>
              <div className="border border-border rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ponto de Reposição</span>
                  {editingReorder ? (
                    <Input
                      type="number"
                      value={reorderPoint}
                      onChange={(e) => setReorderPoint(Number(e.target.value))}
                      className="w-20 h-6 text-xs text-right font-mono"
                    />
                  ) : (
                    <span className="font-mono text-xs font-medium">{sku.reorderPoint} un</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Qtd. Mínima de Pedido</span>
                  {editingReorder ? (
                    <Input
                      type="number"
                      value={minOrderQty}
                      onChange={(e) => setMinOrderQty(Number(e.target.value))}
                      className="w-20 h-6 text-xs text-right font-mono"
                    />
                  ) : (
                    <span className="font-mono text-xs font-medium">{Math.ceil(sku.reorderPoint * 1.5)} un</span>
                  )}
                </div>
                {editingReorder && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 h-6 text-[11px]" onClick={() => setEditingReorder(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="flex-1 h-6 text-[11px]" onClick={handleSaveReorder}>
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5">
            <Edit className="h-3 w-3" />
            Editar SKU completo
          </Button>
          <Button size="sm" className="flex-1 text-xs gap-1.5">
            <ShoppingCart className="h-3 w-3" />
            Criar PO
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
