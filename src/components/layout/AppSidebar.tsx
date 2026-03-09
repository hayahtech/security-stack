import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Wallet,
  Droplets,
  Landmark,
  PieChart,
  RefreshCcw,
  AlertTriangle,
  Building2,
  GitCompare,
  Calculator,
  Package,
  Target,
  BarChart3,
  LineChart,
  ShieldAlert,
  Receipt,
  FileBarChart,
  Settings,
  ScanText,
  Shield,
  Plug,
  DollarSign,
  Heart,
  BookOpen,
  ScrollText,
  Scale,
  FileSignature,
  Zap,
  Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Saúde Financeira", url: "/saude", icon: Heart },
  { title: "DRE", url: "/dre", icon: FileText },
  { title: "Balanço Patrimonial", url: "/balanco", icon: Scale },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: TrendingUp },
  { title: "Contas a Pagar/Receber", url: "/contas", icon: Wallet },
  { title: "Contratos", url: "/contratos", icon: FileSignature },
];

const indicatorsNav = [
  { title: "Indicadores de Liquidez", url: "/liquidez", icon: Droplets },
  { title: "Capital de Giro & Dívida", url: "/capital-giro", icon: Landmark },
  { title: "Margem & Rentabilidade", url: "/margem", icon: PieChart },
  { title: "Ciclo Financeiro", url: "/ciclo", icon: RefreshCcw },
  { title: "Inadimplência", url: "/inadimplencia", icon: AlertTriangle },
  { title: "Cobrança", url: "/cobranca", icon: Zap, badge: "12" },
];

const operationsNav = [
  { title: "Tesouraria", url: "/tesouraria", icon: Building2 },
  { title: "Conciliação Bancária", url: "/conciliacao", icon: GitCompare },
  { title: "Custos & Despesas", url: "/custos", icon: Calculator },
  { title: "Centros de Custo & Rateio", url: "/centros-custo", icon: Target },
  { title: "CMV", url: "/cmv", icon: Package },
];

const accountingNav = [
  { title: "Diário Contábil", url: "/diario-contabil", icon: ScrollText },
  { title: "Plano de Contas", url: "/plano-contas", icon: BookOpen },
];

const analyticsNav = [
  { title: "KPIs & ROI", url: "/kpis", icon: Target },
  { title: "Orçamento Anual", url: "/orcamento", icon: DollarSign },
  { title: "Análise Horizontal/Vertical", url: "/analise-hv", icon: BarChart3 },
  { title: "Projeções & Forecasting", url: "/projecoes", icon: LineChart },
  { title: "Análise de Riscos", url: "/riscos", icon: ShieldAlert },
];

const otherNav = [
  { title: "Captura Automática", url: "/captura", icon: ScanText },
  { title: "Governança & Controle", url: "/governanca", icon: Shield },
  { title: "Integrações & Automações", url: "/integracoes", icon: Plug },
  { title: "Emissão de NF-e", url: "/nfe", icon: Receipt },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Segurança", url: "/seguranca", icon: Lock },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const renderNavGroup = (items: typeof mainNav, label: string) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={collapsed ? item.title : undefined}
              >
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-primary glow-primary"
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive(item.url) ? 'text-primary' : 'text-sidebar-foreground'}`} />
                  {!collapsed && (
                    <span className={`text-sm font-data truncate ${isActive(item.url) ? 'text-foreground font-medium' : ''}`}>
                      {item.title}
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
            <span className="font-display font-bold text-lg text-primary-foreground">F</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-lg gradient-text">FinanceOS</h1>
              <p className="text-xs text-muted-foreground">Enterprise Edition</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 space-y-2 overflow-y-auto">
        {renderNavGroup(mainNav, "Principal")}
        {renderNavGroup(accountingNav, "Contabilidade")}
        {renderNavGroup(indicatorsNav, "Indicadores")}
        {renderNavGroup(operationsNav, "Operacional")}
        {renderNavGroup(analyticsNav, "Analytics")}
        {renderNavGroup(otherNav, "Outros")}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            <span className="font-data">v1.0.0</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
