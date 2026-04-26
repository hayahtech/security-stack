import {
  LayoutDashboard, TrendingUp, ShoppingCart, Building, Percent,
  Megaphone, Landmark, User, Pizza, Package, PackagePlus, Truck, Users, TrendingDown,
  ShoppingBag, UtensilsCrossed, BarChart3, UserCircle, Star, ClipboardList, ClipboardCheck, Wallet, ShieldCheck, MessageSquareText, Brain, MapPinned, Bell, FileText, Smartphone, Settings, LayoutGrid, UsersRound, Receipt, Shield, CalendarDays, Building2, Clock, Target, ArrowLeftRight, ChevronDown
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useScope } from '@/contexts/ScopeContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

type MenuItem = { title: string; url: string; icon: React.ElementType };
type MenuGroup = { label: string; icon: React.ElementType; items: MenuItem[] };

const businessGroups: MenuGroup[] = [
  {
    label: 'Geral',
    icon: LayoutDashboard,
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Vendas & Atendimento',
    icon: ShoppingBag,
    items: [
      { title: 'Vendas', url: '/vendas', icon: ShoppingBag },
      { title: 'Caixa', url: '/caixa', icon: Wallet },
      { title: 'Mesas', url: '/mesas', icon: LayoutGrid },
      { title: 'Reservas', url: '/reservas', icon: CalendarDays },
      { title: 'Delivery', url: '/delivery', icon: Truck },
      { title: 'Zonas de Entrega', url: '/zonas-entrega', icon: MapPinned },
      { title: 'Desempenho', url: '/desempenho', icon: BarChart3 },
    ],
  },
  {
    label: 'Cardápio & Produção',
    icon: UtensilsCrossed,
    items: [
      { title: 'Cardápio', url: '/cardapio', icon: UtensilsCrossed },
      { title: 'Fichas Técnicas', url: '/fichas-tecnicas', icon: ClipboardList },
      { title: 'CMV', url: '/cmv', icon: Percent },
      { title: 'Previsão de Demanda', url: '/previsao-demanda', icon: Brain },
    ],
  },
  {
    label: 'Estoque & Compras',
    icon: Package,
    items: [
      { title: 'Estoque', url: '/estoque', icon: Package },
      { title: 'Entrada Estoque', url: '/estoque/entrada', icon: PackagePlus },
      { title: 'Inventário', url: '/estoque/inventario', icon: ClipboardCheck },
      { title: 'Fornecedores', url: '/fornecedores', icon: Truck },
    ],
  },
  {
    label: 'Financeiro',
    icon: TrendingUp,
    items: [
      { title: 'Receitas', url: '/receitas', icon: TrendingUp },
      { title: 'Desp. Operacionais', url: '/despesas-operacionais', icon: ShoppingCart },
      { title: 'Despesas Fixas', url: '/despesas-fixas', icon: Building },
      { title: 'Taxas e Impostos', url: '/taxas', icon: Percent },
      { title: 'Contas', url: '/contas', icon: Receipt },
      { title: 'Empréstimos', url: '/emprestimos', icon: Landmark },
      { title: 'Fluxo de Caixa', url: '/fluxo-de-caixa', icon: TrendingDown },
      { title: 'Conciliação', url: '/conciliacao', icon: ArrowLeftRight },
      { title: 'Centro de Custos', url: '/centro-custos', icon: Building2 },
      { title: 'Orçamento', url: '/orcamento', icon: Target },
      { title: 'Balanço Patrimonial', url: '/balanco', icon: FileText },
    ],
  },
  {
    label: 'Clientes & Marketing',
    icon: UserCircle,
    items: [
      { title: 'Clientes', url: '/clientes', icon: UserCircle },
      { title: 'Fidelidade', url: '/fidelidade', icon: Star },
      { title: 'Avaliações', url: '/avaliacoes', icon: MessageSquareText },
      { title: 'Marketing', url: '/marketing', icon: Megaphone },
    ],
  },
  {
    label: 'Equipe & RH',
    icon: Users,
    items: [
      { title: 'Funcionários', url: '/funcionarios', icon: Users },
      { title: 'Ponto', url: '/ponto', icon: Clock },
      { title: 'Equipe', url: '/configuracoes/equipe', icon: UsersRound },
    ],
  },
  {
    label: 'Operações',
    icon: Settings,
    items: [
      { title: 'Equipamentos', url: '/equipamentos', icon: Settings },
      { title: 'Vigilância Sanitária', url: '/sanitario', icon: ShieldCheck },
      { title: 'Auditoria', url: '/auditoria', icon: Shield },
    ],
  },
  {
    label: 'Relatórios & Alertas',
    icon: FileText,
    items: [
      { title: 'Relatórios', url: '/relatorios', icon: FileText },
      { title: 'Notificações', url: '/notificacoes', icon: Bell },
    ],
  },
  {
    label: 'Configurações',
    icon: Smartphone,
    items: [
      { title: 'Instalar App', url: '/instalar', icon: Smartphone },
    ],
  },
];

const personalGroups: MenuGroup[] = [
  {
    label: 'Pessoal',
    icon: User,
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
      { title: 'Gastos Pessoais', url: '/pessoal', icon: User },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { scope } = useScope();
  const { hasPermission } = useRestaurant();
  const currentPath = location.pathname;
  const groups = scope === 'business' ? businessGroups : personalGroups;

  // Determine which groups are initially open (contain the active route)
  const getInitialOpen = () => {
    const openSet = new Set<string>();
    groups.forEach(g => {
      if (g.items.some(i => currentPath === i.url)) openSet.add(g.label);
    });
    // Always open "Geral"
    if (groups.some(g => g.label === 'Geral')) openSet.add('Geral');
    return openSet;
  };

  const [openGroups, setOpenGroups] = useState<Set<string>>(getInitialOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="pt-2">
        {collapsed && (
          <div className="flex justify-center py-3">
            <Pizza className="h-6 w-6 text-primary" />
          </div>
        )}

        {groups.map(group => {
          const visibleItems = group.items.filter(item => hasPermission(item.url));
          if (visibleItems.length === 0) return null;
          const isOpen = openGroups.has(group.label);
          const hasActive = visibleItems.some(i => currentPath === i.url);

          if (collapsed) {
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map(item => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={currentPath === item.url}>
                          <NavLink
                            to={item.url}
                            end={item.url === '/'}
                            className="hover:bg-foreground/10 transition-colors"
                            activeClassName="bg-sidebar-accent text-primary font-semibold"
                          >
                            <item.icon className="h-4 w-4" />
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={group.label} open={isOpen} onOpenChange={() => toggleGroup(group.label)}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className={`text-xs uppercase tracking-wider cursor-pointer flex items-center justify-between pr-2 hover:bg-foreground/10 rounded-md transition-colors ${hasActive ? 'text-[hsl(225,73%,57%)]' : 'text-muted-foreground'}`}>
                    <span className="flex items-center gap-2">
                      <group.icon className="h-3.5 w-3.5" />
                      {group.label}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map(item => (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={currentPath === item.url}>
                            <NavLink
                              to={item.url}
                              end={item.url === '/'}
                              className="hover:bg-foreground/10 transition-colors"
                              activeClassName="bg-sidebar-accent text-primary font-semibold"
                            >
                              <item.icon className="h-4 w-4 mr-2" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
