import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, ArrowLeftRight, Landmark, CreditCard,
  MapPin, Sprout, Target, PieChart, FileText, Settings, ChevronLeft, ChevronRight, Plus, DollarSign, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BullHead } from '@/components/icons/BullHead';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  icon?: React.ElementType;
  basePath?: string;
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
    ],
  },
  {
    label: 'Financeiro',
    collapsible: true,
    icon: DollarSign,
    basePath: '/app/financeiro',
    items: [
      { icon: Receipt, label: 'Lançamentos', path: '/app/financeiro/lancamentos' },
      { icon: ArrowLeftRight, label: 'Transferências', path: '/app/financeiro/transferencias' },
      { icon: Landmark, label: 'Contas', path: '/app/contas' },
      { icon: CreditCard, label: 'Cartões', path: '/app/cartoes' },
      { icon: Target, label: 'Orçamento', path: '/app/orcamento' },
    ],
  },
  {
    label: 'Produção',
    items: [
      { icon: MapPin, label: 'Propriedades', path: '/app/propriedades' },
      { icon: Sprout, label: 'Atividades', path: '/app/atividades' },
      { icon: BullHead, label: 'Rebanho', path: '/app/rebanho' },
      { icon: PieChart, label: 'Centros de Custo', path: '/app/centros-custo' },
    ],
  },
  {
    label: 'Análises',
    items: [
      { icon: FileText, label: 'Relatórios', path: '/app/relatorios/fluxo-caixa' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { icon: Settings, label: 'Configurações', path: '/app/configuracoes' },
    ],
  },
];

interface DesktopSidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function DesktopSidebar({ open, onToggle }: DesktopSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const financialPaths = ['/app/financeiro', '/app/contas', '/app/cartoes', '/app/orcamento'];
  const isFinanceActive = financialPaths.some(p => location.pathname.startsWith(p));
  const [financeOpen, setFinanceOpen] = useState(isFinanceActive);

  return (
    <aside className={cn(
      'hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 sticky top-0 h-screen overflow-y-auto',
      open ? 'w-60' : 'w-16'
    )}>
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        {open && <span className="text-sm font-semibold text-sidebar-foreground">Menu</span>}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-sidebar-accent mx-auto">
          {open ? <ChevronLeft className="h-4 w-4 text-sidebar-foreground/60" /> : <ChevronRight className="h-4 w-4 text-sidebar-foreground/60" />}
        </button>
      </div>

      <div className="flex-1 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {/* Collapsible Financeiro group */}
            {group.collapsible && open ? (
              <>
                <button
                  onClick={() => setFinanceOpen(!financeOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 text-sm font-semibold tracking-wider transition-colors',
                    isFinanceActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/70'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {group.icon && <group.icon className="h-3.5 w-3.5" />}
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', financeOpen && 'rotate-180')} />
                </button>
                {financeOpen && group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 pl-8 py-2.5 text-sm transition-colors',
                      isActive(item.path)
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </>
            ) : group.collapsible && !open ? (
              /* Collapsed: show icon for Financeiro */
              <>
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center justify-center px-2 py-2.5 text-sm transition-colors',
                      isActive(item.path)
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                    title={item.label}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                  </button>
                ))}
              </>
            ) : (
              /* Normal groups */
              <>
                {open && <p className="px-4 py-1 text-[11px] font-semibold text-sidebar-foreground/50 tracking-wider">{group.label}</p>}
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                      isActive(item.path)
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      !open && 'justify-center px-2'
                    )}
                    title={!open ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {open && <span>{item.label}</span>}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => navigate('/app/financeiro/lancamentos/novo')}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-medium text-sm transition-all hover:opacity-90',
          )}
        >
          <Plus className="h-4 w-4" />
          {open && <span>Novo Lançamento</span>}
        </button>
      </div>
    </aside>
  );
}
