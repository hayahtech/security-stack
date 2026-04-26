import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { AlertType, AlertSeverity } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  PackageX,
  PackagePlus,
  Clock,
  Activity,
  Check,
  BellOff,
  Settings,
  Search,
  Trash2,
  ShoppingCart,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfigureRulesModal } from '@/components/alerts/ConfigureRulesModal';

const alertTypeConfig: Record<AlertType, { label: string; emoji: string; icon: React.ElementType; className: string }> = {
  OUT_OF_STOCK: { label: 'Sem Estoque', emoji: '🔴', icon: PackageX, className: 'border-red-500/40 text-red-400 bg-red-500/10' },
  LOW_STOCK: { label: 'Estoque Baixo', emoji: '🟡', icon: AlertTriangle, className: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  OVERSTOCK: { label: 'Excesso', emoji: '🟠', icon: PackagePlus, className: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
  EXPIRING: { label: 'Vencimento', emoji: '🔵', icon: Clock, className: 'border-sky-500/40 text-sky-400 bg-sky-500/10' },
  ANOMALY: { label: 'Anomalia', emoji: '⚠️', icon: Activity, className: 'border-violet-500/40 text-violet-400 bg-violet-500/10' },
};

const severityConfig: Record<AlertSeverity, { label: string; className: string; order: number }> = {
  critical: { label: 'Crítico', className: 'border-red-500/40 text-red-400 bg-red-500/10', order: 0 },
  warning: { label: 'Atenção', className: 'border-amber-500/40 text-amber-400 bg-amber-500/10', order: 1 },
  info: { label: 'Info', className: 'border-sky-500/40 text-sky-400 bg-sky-500/10', order: 2 },
};

export default function Alerts() {
  const { alerts, acknowledgeAlert, snoozeAlert } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeSeverities, setActiveSeverities] = useState<Set<AlertSeverity>>(new Set());
  const [rulesOpen, setRulesOpen] = useState(false);

  const toggleSeverity = useCallback((sev: AlertSeverity) => {
    setActiveSeverities(prev => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev); else next.add(sev);
      return next;
    });
  }, []);

  const activeAlerts = useMemo(() => {
    return alerts
      .filter(a => !a.acknowledged)
      .filter(a => {
        if (search) {
          const q = search.toLowerCase();
          const match = (a.skuName?.toLowerCase().includes(q)) ||
            (a.skuId?.toLowerCase().includes(q)) ||
            a.message.toLowerCase().includes(q) ||
            (a.warehouseName?.toLowerCase().includes(q));
          if (!match) return false;
        }
        if (activeSeverities.size > 0 && !activeSeverities.has(a.severity)) return false;
        return true;
      })
      .sort((a, b) => severityConfig[a.severity].order - severityConfig[b.severity].order);
  }, [alerts, search, activeSeverities]);

  const criticalCount = alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;
  const warningCount = alerts.filter(a => !a.acknowledged && a.severity === 'warning').length;
  const infoCount = alerts.filter(a => !a.acknowledged && a.severity === 'info').length;
  const totalActive = alerts.filter(a => !a.acknowledged).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === activeAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeAlerts.map(a => a.id)));
    }
  };

  const handleDismissSelected = () => {
    selectedIds.forEach(id => acknowledgeAlert(id));
    toast.success(`${selectedIds.size} alerta(s) descartado(s)`);
    setSelectedIds(new Set());
  };

  const handleSnooze = (id: string, hours: number) => {
    const until = new Date();
    until.setHours(until.getHours() + hours);
    snoozeAlert(id, until);
    toast.success(`Alerta em soneca por ${hours >= 168 ? '7 dias' : hours >= 48 ? '48h' : '24h'}`);
  };

  const summaryCards = [
    { label: 'Total Ativos', count: totalActive, icon: AlertTriangle, borderClass: 'border-border' },
    { label: 'Críticos', count: criticalCount, icon: PackageX, borderClass: 'border-red-500/30' },
    { label: 'Atenção', count: warningCount, icon: AlertTriangle, borderClass: 'border-amber-500/30' },
    { label: 'Informativos', count: infoCount, icon: Activity, borderClass: 'border-sky-500/30' },
  ];

  const columns = [
    { key: 'check', width: 'w-[36px]' },
    { key: 'severity', label: 'Sev.', width: 'w-[70px]' },
    { key: 'type', label: 'Tipo', width: 'w-[130px]' },
    { key: 'sku', label: 'SKU', width: 'w-[180px]' },
    { key: 'warehouse', label: 'Armazém', width: 'w-[120px]' },
    { key: 'message', label: 'Mensagem', width: 'flex-1' },
    { key: 'time', label: 'Há quanto tempo', width: 'w-[120px]' },
    { key: 'actions', label: 'Ações', width: 'w-[200px]' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Central de Alertas</h1>
          <p className="text-xs text-muted-foreground">Monitore e gerencie alertas de estoque em tempo real</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRulesOpen(true)}>
          <Settings className="h-3 w-3 mr-1" />
          Configurar Regras
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-2 grid-cols-4">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className={card.borderClass}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-1.5 rounded bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold font-mono leading-none">{card.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU, armazém, mensagem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-7 text-xs"
              />
            </div>

            {selectedIds.size > 0 && (
              <Button variant="outline" size="sm" className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10" onClick={handleDismissSelected}>
                <Trash2 className="h-3 w-3 mr-1" />
                Descartar {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
              </Button>
            )}

            {(activeSeverities.size > 0 || search) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { setActiveSeverities(new Set()); setSearch(''); }}>
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Severity Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Severidade:</span>
            {(Object.entries(severityConfig) as [AlertSeverity, typeof severityConfig[AlertSeverity]][]).map(([sev, config]) => {
              const active = activeSeverities.has(sev);
              const count = alerts.filter(a => !a.acknowledged && a.severity === sev).length;
              return (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium border transition-all',
                    active ? config.className : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  )}
                >
                  {config.label}
                  <span className="font-mono text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center border-b bg-muted/30 px-1 h-8 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <div className={cn(columns[0].width, 'shrink-0 flex items-center justify-center')}>
              <Checkbox
                checked={selectedIds.size === activeAlerts.length && activeAlerts.length > 0}
                onCheckedChange={toggleAll}
                className="h-3.5 w-3.5"
              />
            </div>
            {columns.slice(1).map(col => (
              <div key={col.key} className={cn(col.width, 'shrink-0 px-1.5')}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="max-h-[calc(100vh-380px)] min-h-[300px] overflow-auto">
            {activeAlerts.map(alert => {
              const typeConf = alertTypeConfig[alert.type];
              const sevConf = severityConfig[alert.severity];
              const TypeIcon = typeConf.icon;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center px-1 border-b border-border/40 hover:bg-muted/30 transition-colors',
                    selectedIds.has(alert.id) && 'bg-primary/5',
                    alert.severity === 'critical' && 'border-l-2 border-l-red-500/60'
                  )}
                  style={{ minHeight: 40 }}
                >
                  {/* Checkbox */}
                  <div className={cn(columns[0].width, 'shrink-0 flex items-center justify-center')}>
                    <Checkbox
                      checked={selectedIds.has(alert.id)}
                      onCheckedChange={() => toggleSelect(alert.id)}
                      className="h-3.5 w-3.5"
                    />
                  </div>

                  {/* Severity */}
                  <div className={cn(columns[1].width, 'shrink-0 px-1.5')}>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 font-mono', sevConf.className)}>
                      {sevConf.label}
                    </Badge>
                  </div>

                  {/* Type */}
                  <div className={cn(columns[2].width, 'shrink-0 px-1.5')}>
                    <Badge variant="outline" className={cn('gap-1 text-[11px] px-1.5 py-0', typeConf.className)}>
                      <TypeIcon className="h-3 w-3" />
                      {typeConf.label}
                    </Badge>
                  </div>

                  {/* SKU */}
                  <div className={cn(columns[3].width, 'shrink-0 px-1.5')}>
                    {alert.skuName ? (
                      <div className="truncate">
                        <span className="font-mono text-[10px] text-muted-foreground mr-1">{alert.skuId}</span>
                        <span className="text-[11px]">{alert.skuName}</span>
                      </div>
                    ) : <span className="text-[11px] text-muted-foreground">—</span>}
                  </div>

                  {/* Warehouse */}
                  <div className={cn(columns[4].width, 'shrink-0 px-1.5 text-[11px] text-muted-foreground truncate')}>
                    {alert.warehouseName || '—'}
                  </div>

                  {/* Message */}
                  <div className={cn(columns[5].width, 'shrink-0 px-1.5 text-[11px] truncate')}>
                    {alert.message}
                  </div>

                  {/* Time */}
                  <div className={cn(columns[6].width, 'shrink-0 px-1.5 text-[11px] text-muted-foreground font-mono')}>
                    {formatDistanceToNow(alert.createdAt, { locale: ptBR })}
                  </div>

                  {/* Actions */}
                  <div className={cn(columns[7].width, 'shrink-0 px-1.5 flex items-center gap-1')}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => { acknowledgeAlert(alert.id); toast.success('Alerta resolvido'); }}
                    >
                      <Check className="h-3 w-3 mr-0.5" />
                      Resolver
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5">
                          <BellOff className="h-3 w-3 mr-0.5" />
                          Soneca
                          <ChevronDown className="h-2.5 w-2.5 ml-0.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-xs" onClick={() => handleSnooze(alert.id, 24)}>
                          24 horas
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => handleSnooze(alert.id, 48)}>
                          48 horas
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs" onClick={() => handleSnooze(alert.id, 168)}>
                          7 dias
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {alert.skuId && (
                      <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-primary">
                        <ShoppingCart className="h-3 w-3 mr-0.5" />
                        PO
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {activeAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Check className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Tudo sob controle</p>
                <p className="text-xs">Nenhum alerta ativo encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <ConfigureRulesModal open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
}
