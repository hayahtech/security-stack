import { useState, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { SKU, Category, SKUStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Columns3,
  GripVertical,
  ArrowUpDown,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SKUDetailDrawer from '@/components/SKUDetailDrawer';
import NewSKUModal from '@/components/skus/NewSKUModal';

const allCategories: Category[] = ['Eletrônicos', 'Vestuário', 'Casa', 'Alimentos', 'Industrial'];

// ====== Column definition ======
interface ColumnDef {
  id: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'id', label: 'SKU', width: 'w-[90px]', sortable: true },
  { id: 'name', label: 'Produto', sortable: true },
  { id: 'category', label: 'Cat.', width: 'w-[90px]', sortable: true },
  { id: 'brand', label: 'Marca', width: 'w-[100px]', sortable: true },
  { id: 'cost', label: 'Custo', width: 'w-[90px]', align: 'right', sortable: true },
  { id: 'price', label: 'Preço', width: 'w-[90px]', align: 'right', sortable: true },
  { id: 'stock', label: 'Estq.', width: 'w-[70px]', align: 'right', sortable: true },
  { id: 'reserved', label: 'Res.', width: 'w-[60px]', align: 'right', sortable: true },
  { id: 'available', label: 'Disp.', width: 'w-[70px]', align: 'right', sortable: true },
  { id: 'reorderPoint', label: 'P.Repos.', width: 'w-[70px]', align: 'right', sortable: true },
  { id: 'leadTime', label: 'Lead', width: 'w-[55px]', align: 'right', sortable: true },
  { id: 'status', label: 'Status', width: 'w-[75px]' },
];

const DEFAULT_VISIBLE = ['id', 'name', 'category', 'cost', 'price', 'stock', 'reserved', 'available', 'status'];

// ====== Filter Types ======
interface SKUFilters {
  search: string;
  categories: Category[];
  suppliers: string[];
  minStock: number;
  maxStock: number;
  minPrice: number;
  maxPrice: number;
  activeOnly: boolean;
  lowStockOnly: boolean;
  needsReorder: boolean;
}

const defaultFilters: SKUFilters = {
  search: '',
  categories: [],
  suppliers: [],
  minStock: 0,
  maxStock: 1000,
  minPrice: 0,
  maxPrice: 200000,
  activeOnly: false,
  lowStockOnly: false,
  needsReorder: false,
};

type SortDir = 'asc' | 'desc' | null;

// ====== Filters Drawer ======
function FiltersDrawer({
  filters,
  setFilters,
  open,
  onOpenChange,
}: {
  filters: SKUFilters;
  setFilters: (f: SKUFilters) => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { suppliers } = useAppStore();
  const activeCount = [
    filters.categories.length > 0,
    filters.suppliers.length > 0,
    filters.activeOnly,
    filters.lowStockOnly,
    filters.needsReorder,
    filters.minStock > 0,
    filters.maxStock < 1000,
    filters.minPrice > 0,
    filters.maxPrice < 200000,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] p-0 flex flex-col" side="right">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold tracking-wide uppercase">Filtros</SheetTitle>
            {activeCount > 0 && (
              <Badge variant="secondary" className="font-mono text-[10px]">{activeCount}</Badge>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Categories */}
            <section className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Categoria</Label>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map((cat) => {
                  const active = filters.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          categories: active
                            ? filters.categories.filter((c) => c !== cat)
                            : [...filters.categories, cat],
                        });
                      }}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        active
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* Supplier */}
            <section className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Fornecedor</Label>
              <Select
                value={filters.suppliers[0] || 'all'}
                onValueChange={(v) =>
                  setFilters({ ...filters, suppliers: v === 'all' ? [] : [v] })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <Separator />

            {/* Stock Range */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Estoque</Label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {filters.minStock} – {filters.maxStock}
                </span>
              </div>
              <Slider
                value={[filters.minStock, filters.maxStock]}
                min={0}
                max={1000}
                step={10}
                onValueChange={([min, max]) => setFilters({ ...filters, minStock: min, maxStock: max })}
                className="py-1"
              />
            </section>

            {/* Price Range */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Preço de Venda</Label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  R$ {filters.minPrice.toLocaleString('pt-BR')} – R$ {filters.maxPrice.toLocaleString('pt-BR')}
                </span>
              </div>
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                min={0}
                max={200000}
                step={500}
                onValueChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                className="py-1"
              />
            </section>

            <Separator />

            {/* Boolean Toggles */}
            <section className="space-y-3">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Condições</Label>
              {[
                { id: 'activeOnly', label: 'Somente ativos', key: 'activeOnly' as const },
                { id: 'lowStockOnly', label: 'Estoque baixo', key: 'lowStockOnly' as const },
                { id: 'needsReorder', label: 'Precisa repor', key: 'needsReorder' as const },
              ].map((toggle) => (
                <div key={toggle.id} className="flex items-center justify-between">
                  <Label htmlFor={toggle.id} className="text-xs">{toggle.label}</Label>
                  <Switch
                    id={toggle.id}
                    checked={filters[toggle.key]}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, [toggle.key]: checked })
                    }
                    className="scale-90"
                  />
                </div>
              ))}
            </section>
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setFilters({ ...defaultFilters })}
          >
            Limpar
          </Button>
          <Button size="sm" className="flex-1 text-xs" onClick={() => onOpenChange(false)}>
            Aplicar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ====== Column Visibility Dropdown ======
function ColumnVisibilityDropdown({
  visibleColumns,
  setVisibleColumns,
  columnOrder,
  setColumnOrder,
}: {
  visibleColumns: string[];
  setVisibleColumns: (cols: string[]) => void;
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
}) {
  const moveColumn = (colId: string, dir: 'up' | 'down') => {
    const idx = columnOrder.indexOf(colId);
    if (dir === 'up' && idx > 0) {
      const newOrder = [...columnOrder];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      setColumnOrder(newOrder);
    } else if (dir === 'down' && idx < columnOrder.length - 1) {
      const newOrder = [...columnOrder];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      setColumnOrder(newOrder);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Columns3 className="h-3.5 w-3.5" />
          Colunas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Visibilidade & Ordem
        </div>
        <DropdownMenuSeparator />
        {columnOrder.map((colId) => {
          const col = ALL_COLUMNS.find((c) => c.id === colId);
          if (!col) return null;
          const visible = visibleColumns.includes(colId);
          return (
            <div key={colId} className="flex items-center gap-1 px-1 py-0.5 group">
              <div className="flex flex-col">
                <button
                  onClick={() => moveColumn(colId, 'up')}
                  className="h-3 w-3 flex items-center justify-center text-muted-foreground/50 hover:text-foreground"
                >
                  <ChevronUp className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => moveColumn(colId, 'down')}
                  className="h-3 w-3 flex items-center justify-center text-muted-foreground/50 hover:text-foreground"
                >
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
              </div>
              <DropdownMenuCheckboxItem
                checked={visible}
                onCheckedChange={(checked) => {
                  setVisibleColumns(
                    checked
                      ? [...visibleColumns, colId]
                      : visibleColumns.filter((c) => c !== colId)
                  );
                }}
                className="flex-1 text-xs"
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            </div>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs justify-center"
          onClick={() => {
            setVisibleColumns([...DEFAULT_VISIBLE]);
            setColumnOrder(ALL_COLUMNS.map((c) => c.id));
          }}
        >
          Resetar Padrão
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ====== Cell Renderer ======
function CellValue({ sku, colId }: { sku: SKU; colId: string }) {
  switch (colId) {
    case 'id':
      return <span className="font-mono text-[11px] text-muted-foreground">{sku.id}</span>;
    case 'name':
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center shrink-0">
            <Package className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="truncate text-xs font-medium max-w-[180px]">{sku.name}</span>
        </div>
      );
    case 'category':
      return <span className="text-[11px] text-muted-foreground">{sku.category.slice(0, 5)}</span>;
    case 'brand':
      return <span className="text-[11px] text-muted-foreground">{sku.brand}</span>;
    case 'cost':
      return <span className="font-mono text-[11px]">R$ {sku.cost.toLocaleString('pt-BR')}</span>;
    case 'price':
      return <span className="font-mono text-[11px]">R$ {sku.price.toLocaleString('pt-BR')}</span>;
    case 'stock': {
      const needsReorder = sku.stock <= sku.reorderPoint;
      return (
        <span className={`font-mono text-[11px] font-medium ${needsReorder ? 'text-warning' : sku.stock === 0 ? 'text-destructive' : ''}`}>
          {sku.stock}
        </span>
      );
    }
    case 'reserved':
      return <span className="font-mono text-[11px] text-muted-foreground">{sku.reserved}</span>;
    case 'available':
      return <span className="font-mono text-[11px] text-success">{sku.available}</span>;
    case 'reorderPoint':
      return <span className="font-mono text-[11px] text-muted-foreground">{sku.reorderPoint}</span>;
    case 'leadTime':
      return <span className="font-mono text-[11px] text-muted-foreground">{sku.leadTime}d</span>;
    case 'status': {
      const color =
        sku.status === 'active'
          ? 'bg-success/15 text-success border-success/20'
          : sku.status === 'inactive'
          ? 'bg-muted text-muted-foreground border-border'
          : 'bg-destructive/15 text-destructive border-destructive/20';
      const label = sku.status === 'active' ? 'Ativo' : sku.status === 'inactive' ? 'Off' : 'Desc.';
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium border rounded ${color}`}>
          {label}
        </span>
      );
    }
    default:
      return null;
  }
}

// ====== Main Component ======
export default function SKUCatalog() {
  const { skus, suppliers } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SKUFilters>({ ...defaultFilters });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([...DEFAULT_VISIBLE]);
  const [columnOrder, setColumnOrder] = useState<string[]>(ALL_COLUMNS.map((c) => c.id));
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [detailSKU, setDetailSKU] = useState<SKU | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newSKUOpen, setNewSKUOpen] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

  const handleSort = useCallback(
    (colId: string) => {
      if (sortCol === colId) {
        setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
        if (sortDir === 'desc') setSortCol(null);
      } else {
        setSortCol(colId);
        setSortDir('asc');
      }
    },
    [sortCol, sortDir]
  );

  // Ordered visible columns
  const displayedColumns = useMemo(() => {
    return columnOrder
      .filter((id) => visibleColumns.includes(id))
      .map((id) => ALL_COLUMNS.find((c) => c.id === id)!)
      .filter(Boolean);
  }, [columnOrder, visibleColumns]);

  // Filtered + sorted
  const filteredSKUs = useMemo(() => {
    let result = skus.filter((sku) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !sku.name.toLowerCase().includes(s) &&
          !sku.id.toLowerCase().includes(s) &&
          !sku.barcode.includes(filters.search) &&
          !sku.brand.toLowerCase().includes(s)
        )
          return false;
      }
      if (filters.categories.length > 0 && !filters.categories.includes(sku.category)) return false;
      if (filters.suppliers.length > 0 && !filters.suppliers.includes(sku.supplierId)) return false;
      if (sku.stock < filters.minStock || sku.stock > filters.maxStock) return false;
      if (sku.price < filters.minPrice || sku.price > filters.maxPrice) return false;
      if (filters.activeOnly && sku.status !== 'active') return false;
      if (filters.lowStockOnly && sku.stock > sku.reorderPoint) return false;
      if (filters.needsReorder && sku.stock > sku.reorderPoint) return false;
      return true;
    });

    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol];
        const bv = (b as any)[sortCol];
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
      });
    }

    return result;
  }, [skus, filters, sortCol, sortDir]);

  const rowVirtualizer = useVirtualizer({
    count: filteredSKUs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === filteredSKUs.length ? new Set() : new Set(filteredSKUs.map((s) => s.id))
    );
  };

  const activeFiltersCount = [
    filters.categories.length > 0,
    filters.suppliers.length > 0,
    filters.activeOnly,
    filters.lowStockOnly,
    filters.needsReorder,
    filters.minStock > 0,
    filters.maxStock < 1000,
    filters.minPrice > 0,
    filters.maxPrice < 200000,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Catálogo de SKUs</h1>
          <p className="text-xs text-muted-foreground">
            {filteredSKUs.length} resultado{filteredSKUs.length !== 1 ? 's' : ''}
            {filters.search && ` para "${filters.search}"`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => setNewSKUOpen(true)}>
            <Package className="h-3.5 w-3.5" />
            Novo SKU
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, SKU, barcode..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-8 h-7 text-xs"
          />
        </div>

        {/* Quick category chips */}
        {allCategories.map((cat) => {
          const active = filters.categories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() =>
                setFilters({
                  ...filters,
                  categories: active
                    ? filters.categories.filter((c) => c !== cat)
                    : [...filters.categories, cat],
                })
              }
              className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                active
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
              }`}
            >
              {cat}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1.5">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="font-mono text-[10px] h-5">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>

          <ColumnVisibilityDropdown
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-primary/30 bg-primary/5 text-xs">
          <span className="font-mono font-medium">{selectedIds.size}</span>
          <span className="text-muted-foreground">selecionado{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">Editar</Button>
            <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">Tags</Button>
            <Button variant="outline" size="sm" className="h-6 text-[11px] px-2 text-destructive">Desativar</Button>
            <button onClick={() => setSelectedIds(new Set())} className="ml-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="border border-border rounded overflow-hidden bg-card">
        <div ref={parentRef} className="overflow-auto max-h-[calc(100vh-260px)]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-card border-b border-border">
              <tr>
                <th className="w-8 px-2 py-2">
                  <Checkbox
                    checked={selectedIds.size === filteredSKUs.length && filteredSKUs.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="scale-90"
                  />
                </th>
                {displayedColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`px-2 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground ${col.width || ''} ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } ${col.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''}`}
                    onClick={() => col.sortable && handleSort(col.id)}
                  >
                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      {col.label}
                      {col.sortable && sortCol === col.id && sortDir && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                      {col.sortable && sortCol !== col.id && (
                        <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const sku = filteredSKUs[virtualRow.index];
                const selected = selectedIds.has(sku.id);
                return (
                  <tr
                    key={sku.id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                      selected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSelect(sku.id)}
                        className="scale-90"
                      />
                    </td>
                    {displayedColumns.map((col) => (
                      <td
                        key={col.id}
                        className={`px-2 py-1.5 ${col.align === 'right' ? 'text-right' : ''}`}
                      >
                        <CellValue sku={sku} colId={col.id} />
                      </td>
                    ))}
                    <td className="px-1 py-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => { setDetailSKU(sku); setDetailOpen(true); }}>
                            <Eye className="h-3 w-3" /> Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2">
                            <Edit className="h-3 w-3" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs gap-2 text-destructive">
                            <Trash2 className="h-3 w-3" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSKUs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum SKU encontrado</p>
              <p className="text-xs mt-1">Tente ajustar os filtros</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-7 text-xs"
                onClick={() => setFilters({ ...defaultFilters })}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground bg-muted/30">
          <span>
            {filteredSKUs.length} de {skus.length} SKUs
            {selectedIds.size > 0 && ` · ${selectedIds.size} selecionados`}
          </span>
          <span className="font-mono">
            {displayedColumns.length}/{ALL_COLUMNS.length} colunas
          </span>
        </div>
      </div>

      {/* Filters Drawer */}
      <FiltersDrawer
        filters={filters}
        setFilters={setFilters}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      />

      <SKUDetailDrawer
        sku={detailSKU}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <NewSKUModal open={newSKUOpen} onOpenChange={setNewSKUOpen} />
    </div>
  );
}
