import { useState, useMemo, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { MovementType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  CalendarIcon,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MovementTypeBadge, movementTypeConfig } from '@/components/movements/MovementTypeBadge';
import { NewAdjustmentModal } from '@/components/movements/NewAdjustmentModal';
import { ExportModal } from '@/components/movements/ExportModal';
import { cn } from '@/lib/utils';

const allTypes: MovementType[] = ['ENTRADA', 'SAÍDA', 'TRANSFERÊNCIA', 'AJUSTE', 'DEVOLUÇÃO', 'AVARIA', 'BAIXA'];

export default function Movements() {
  const { movements, warehouses } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<MovementType>>(new Set());
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const toggleType = useCallback((type: MovementType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          mov.skuName.toLowerCase().includes(q) ||
          mov.skuId.toLowerCase().includes(q) ||
          mov.operator.toLowerCase().includes(q) ||
          (mov.reference && mov.reference.toLowerCase().includes(q)) ||
          (mov.notes && mov.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (activeTypes.size > 0 && !activeTypes.has(mov.type)) return false;

      if (warehouseFilter !== 'all') {
        const match = mov.fromWarehouse?.includes(warehouseFilter) || mov.toWarehouse?.includes(warehouseFilter);
        if (!match) return false;
      }

      if (dateRange.from && mov.timestamp < dateRange.from) return false;
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (mov.timestamp > endOfDay) return false;
      }

      return true;
    });
  }, [movements, search, activeTypes, warehouseFilter, dateRange]);

  const virtualizer = useVirtualizer({
    count: filteredMovements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  const columns = [
    { key: 'timestamp', label: 'Timestamp', width: 'w-[140px]' },
    { key: 'sku', label: 'SKU', width: 'w-[90px]' },
    { key: 'type', label: 'Tipo', width: 'w-[130px]' },
    { key: 'qty', label: 'Qtd', width: 'w-[70px]' },
    { key: 'from', label: 'De', width: 'w-[120px]' },
    { key: 'to', label: 'Para', width: 'w-[120px]' },
    { key: 'reference', label: 'Referência', width: 'w-[110px]' },
    { key: 'operator', label: 'Operador', width: 'w-[120px]' },
    { key: 'notes', label: 'Observações', width: 'flex-1' },
  ];

  const qtyPrefix = (type: MovementType) => {
    if (type === 'ENTRADA' || type === 'DEVOLUÇÃO') return '+';
    if (type === 'SAÍDA' || type === 'AVARIA' || type === 'BAIXA') return '−';
    return '';
  };

  const qtyColor = (type: MovementType) => {
    if (type === 'ENTRADA' || type === 'DEVOLUÇÃO') return 'text-emerald-400';
    if (type === 'SAÍDA' || type === 'AVARIA' || type === 'BAIXA') return 'text-red-400';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Movimentações de Estoque</h1>
          <p className="text-xs text-muted-foreground">Ledger completo · {filteredMovements.length.toLocaleString('pt-BR')} registros</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setExportOpen(true)}>
            <Download className="h-3 w-3 mr-1" />
            Exportar
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={() => setModalOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Novo Ajuste
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar SKU, operador, referência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-7 text-xs"
              />
            </div>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-[160px] h-7 text-xs">
                <SelectValue placeholder="Armazém" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos armazéns</SelectItem>
                {warehouses.map(wh => (
                  <SelectItem key={wh.id} value={wh.city} className="text-xs">{wh.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('h-7 text-xs gap-1.5', dateRange.from && 'text-primary')}>
                  <CalendarIcon className="h-3 w-3" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'dd/MM', { locale: ptBR })} — ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                    ) : format(dateRange.from, 'dd/MM/yy', { locale: ptBR })
                  ) : 'Período'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
                {dateRange.from && (
                  <div className="p-2 border-t flex justify-end">
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setDateRange({})}>
                      Limpar
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {(activeTypes.size > 0 || warehouseFilter !== 'all' || dateRange.from) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setActiveTypes(new Set()); setWarehouseFilter('all'); setDateRange({}); }}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Type Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Tipo:</span>
            {allTypes.map(type => {
              const c = movementTypeConfig[type];
              const active = activeTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium border transition-all',
                    active ? c.className : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  )}
                >
                  <c.icon className="h-3 w-3" />
                  {c.label}
                  {active && (
                    <span className="ml-0.5 font-mono text-[10px]">
                      ({movements.filter(m => m.type === type).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Virtualized Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center border-b bg-muted/30 px-3 h-8 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {columns.map(col => (
              <div key={col.key} className={cn(col.width, 'shrink-0 px-1')}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Body */}
          <div ref={parentRef} className="overflow-auto" style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}>
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map(virtualRow => {
                const mov = filteredMovements[virtualRow.index];
                return (
                  <div
                    key={mov.id}
                    className="absolute left-0 right-0 flex items-center px-3 border-b border-border/40 hover:bg-muted/30 transition-colors"
                    style={{
                      height: 36,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className={cn(columns[0].width, 'shrink-0 px-1 font-mono text-[11px] text-muted-foreground')}>
                      {format(mov.timestamp, 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </div>
                    <div className={cn(columns[1].width, 'shrink-0 px-1 font-mono text-[11px]')}>
                      {mov.skuId}
                    </div>
                    <div className={cn(columns[2].width, 'shrink-0 px-1')}>
                      <MovementTypeBadge type={mov.type} />
                    </div>
                    <div className={cn(columns[3].width, 'shrink-0 px-1 font-mono text-xs font-semibold text-right', qtyColor(mov.type))}>
                      {qtyPrefix(mov.type)}{mov.quantity}
                    </div>
                    <div className={cn(columns[4].width, 'shrink-0 px-1 text-[11px] text-muted-foreground truncate')}>
                      {mov.fromWarehouse || '—'}
                    </div>
                    <div className={cn(columns[5].width, 'shrink-0 px-1 text-[11px] text-muted-foreground truncate')}>
                      {mov.toWarehouse || '—'}
                    </div>
                    <div className={cn(columns[6].width, 'shrink-0 px-1')}>
                      {mov.reference ? (
                        <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">{mov.reference}</Badge>
                      ) : <span className="text-muted-foreground text-[11px]">—</span>}
                    </div>
                    <div className={cn(columns[7].width, 'shrink-0 px-1 text-[11px] truncate')}>
                      {mov.operator}
                    </div>
                    <div className={cn(columns[8].width, 'shrink-0 px-1 text-[11px] text-muted-foreground truncate')}>
                      {mov.notes || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {filteredMovements.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Nenhuma movimentação encontrada
            </div>
          )}
        </CardContent>
      </Card>

      <NewAdjustmentModal open={modalOpen} onOpenChange={setModalOpen} />
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
