import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowRightLeft,
  FileText,
  Bell,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Box,
  Radio,
  CalendarClock,
  Truck,
  ShoppingCart,
  DoorOpen,
  BadgeDollarSign,
  Building2,
  TrendingUp,
  Bot,
  CheckCircle2,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import otsraLogo from '@/assets/otsra-logo.jpg';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: 'alerts' | 'approvals' | 'live';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Visão Geral',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/torre-controle', label: 'Torre de Controle', icon: Radio, badge: 'live' },
    ],
  },
  {
    label: 'Estoque',
    items: [
      { path: '/skus', label: 'Catálogo de SKUs', icon: Package },
      { path: '/warehouses', label: 'Armazéns', icon: Warehouse },
      { path: '/movements', label: 'Movimentações', icon: ArrowRightLeft },
      { path: '/validade', label: 'Validade & Lotes', icon: CalendarClock },
      { path: '/logistica', label: 'Logística Interna', icon: Truck },
    ],
  },
  {
    label: 'Compras & Recebimento',
    items: [
      { path: '/purchase-orders', label: 'Pedidos de Compra', icon: ShoppingCart },
      { path: '/recebimento', label: 'Recebimento / Doca', icon: DoorOpen },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { path: '/precificacao', label: 'Precificação', icon: BadgeDollarSign },
      { path: '/centros-custo', label: 'Centros de Custo', icon: Building2 },
      { path: '/forecast', label: 'Forecast', icon: TrendingUp },
      { path: '/automacao', label: 'Automação Fiscal', icon: Bot },
    ],
  },
  {
    label: 'Controle & Governança',
    items: [
      { path: '/alerts', label: 'Alertas', icon: Bell, badge: 'alerts' },
      { path: '/governanca', label: 'Aprovações', icon: CheckCircle2, badge: 'approvals' },
      { path: '/multi-cnpj', label: 'Multi-CNPJ', icon: Landmark },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: '/reports', label: 'Relatórios', icon: BarChart3 },
      { path: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar, alerts } = useAppStore();
  const location = useLocation();

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;
  // Mock pending approvals count — in production pull from store
  const pendingApprovals = 4;

  // All groups open by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map((g) => [g.label, true]))
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderBadge = (badge: NavItem['badge']) => {
    if (!badge) return null;
    if (badge === 'live') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {!sidebarCollapsed && 'Ao vivo'}
        </span>
      );
    }
    const count = badge === 'alerts' ? unacknowledgedAlerts : pendingApprovals;
    if (count === 0) return null;
    const colors =
      badge === 'alerts'
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-amber-500 text-white';
    return (
      <span
        className={cn(
          'flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono rounded-full',
          colors
        )}
      >
        {count}
      </span>
    );
  };

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    const link = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-all',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive
            ? 'bg-primary/15 text-primary font-semibold'
            : 'text-sidebar-foreground/70'
        )}
      >
        <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {renderBadge(item.badge)}
          </>
        )}
      </NavLink>
    );

    if (sidebarCollapsed) {
      return (
        <li key={item.path}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2 text-xs">
              {item.label}
              {item.badge === 'alerts' && unacknowledgedAlerts > 0 && (
                <span className="text-destructive font-mono">({unacknowledgedAlerts})</span>
              )}
              {item.badge === 'approvals' && pendingApprovals > 0 && (
                <span className="text-amber-500 font-mono">({pendingApprovals})</span>
              )}
              {item.badge === 'live' && (
                <span className="text-emerald-500 font-mono text-[10px]">AO VIVO</span>
              )}
            </TooltipContent>
          </Tooltip>
        </li>
      );
    }

    return <li key={item.path}>{link}</li>;
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0',
        sidebarCollapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-14 px-3 border-b border-sidebar-border',
          sidebarCollapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <img src={otsraLogo} alt="Otsra" className="w-8 h-8 rounded-lg object-cover" />
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-sidebar-foreground">Otsra</span>
            <span className="text-[10px] text-muted-foreground font-mono">v2.4.1</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.label];
          const groupHasActive = group.items.some((i) => location.pathname === i.path);

          if (sidebarCollapsed) {
            return (
              <div key={group.label} className="px-1 mb-1">
                <div className="h-px bg-sidebar-border my-1.5" />
                <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
              </div>
            );
          }

          return (
            <Collapsible
              key={group.label}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.label)}
              className="px-1.5 mb-0.5"
            >
              <CollapsibleTrigger className="flex items-center w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown
                  className={cn(
                    'w-3 h-3 mr-1.5 transition-transform',
                    !isOpen && '-rotate-90'
                  )}
                />
                {group.label}
                {groupHasActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            'w-full justify-center text-muted-foreground hover:text-foreground',
            !sidebarCollapsed && 'justify-end'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <span className="text-xs mr-2">Recolher</span>
              <ChevronLeft className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
