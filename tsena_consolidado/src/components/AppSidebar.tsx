import {
  LayoutDashboard, Users, Car, ShieldBan, Package,
  FileText, Scale, LayoutGrid, HardHat, Dice5, Utensils,
  ChevronLeft, ChevronRight, FileBarChart, ClipboardList,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAppMode } from '@/contexts/AppModeContext';
import { useState } from 'react';

const coreItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Visitantes', url: '/visitantes', icon: Users },
  { title: 'Veículos', url: '/veiculos', icon: Car },
  { title: 'Blacklist', url: '/blacklist', icon: ShieldBan },
  { title: 'Refeitório', url: '/refeitorio', icon: Utensils },
  { title: 'Cadastros', url: '/cadastros', icon: ClipboardList },
  { title: 'Relatórios', url: '/relatorios', icon: FileBarChart },
];

const recepcaoItems = [
  { title: 'Entregas', url: '/entregas', icon: Package },
];

const guaritaItems = [
  { title: 'Barreira Fiscal', url: '/nfe', icon: FileText },
  { title: 'Balança', url: '/balanca', icon: Scale },
  { title: 'Gestão de Pátio', url: '/patio', icon: LayoutGrid },
  { title: 'SST', url: '/sst', icon: HardHat },
  { title: 'Sorteio Revista', url: '/sorteio', icon: Dice5 },
];

const AppSidebar = () => {
  const { mode } = useAppMode();
  const [collapsed, setCollapsed] = useState(false);

  const modeItems = mode === 'recepcao' ? recepcaoItems : mode === 'guarita' ? guaritaItems : [];

  return (
    <aside
      className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-[260px]'
      }`}
    >
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div className="mb-2">
          {!collapsed && (
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Principal
            </span>
          )}
          <div className="mt-1 space-y-0.5">
            {coreItems.map(item => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === '/'}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-ros hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-sidebar-accent text-primary font-medium"
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </div>
        </div>

        {modeItems.length > 0 && (
          <div className="pt-2 border-t border-sidebar-border">
            {!collapsed && (
              <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {mode === 'recepcao' ? 'Recepção' : 'Industrial'}
              </span>
            )}
            <div className="mt-1 space-y-0.5">
              {modeItems.map(item => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-ros hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-sidebar-border py-2.5 text-muted-foreground transition-ros hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
