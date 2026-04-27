import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, Target, ShoppingCart, TrendingUp,
  PiggyBank, HeartPulse, BarChart3, ShieldCheck,
  Sun, Moon, Settings, Gift, User, Users,
  FileUp, CreditCard, Receipt, Building2, ArrowLeftRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfile } from "@/contexts/ProfileContext";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

/* ─── Tipos ──────────────────────────────────────────────────────────────── */
interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  highlight?: "primary" | "lime";  // estilo especial
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/* ─── Estrutura de navegação ─────────────────────────────────────────────── */
const NAV: NavGroup[] = [
  {
    label: "Financeiro",
    items: [
      { to: "/movimentacoes",   label: "Movimentações",    icon: ArrowLeftRight },
      { to: "/contas",          label: "Contas Bancárias",  icon: Building2      },
      { to: "/importar-extrato",label: "Importar Extrato",  icon: FileUp, highlight: "lime"  },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { to: "/orcamento-familiar",  label: "Orçamento Familiar",  icon: Wallet       },
      { to: "/metas",               label: "Metas Financeiras",   icon: Target       },
      { to: "/compras-planejadas",  label: "Compras Planejadas",  icon: ShoppingCart },
      { to: "/dividas",             label: "Dívidas",             icon: CreditCard   },
    ],
  },
  {
    label: "Análise",
    items: [
      { to: "/analise-gastos",   label: "Análise de Gastos", icon: BarChart3  },
      { to: "/saude-financeira", label: "Saúde Financeira",  icon: HeartPulse },
    ],
  },
  {
    label: "Patrimônio & Futuro",
    items: [
      { to: "/investimentos",     label: "Investimentos",      icon: TrendingUp  },
      { to: "/aposentadoria",     label: "Aposentadoria",      icon: PiggyBank   },
      { to: "/consorcios",        label: "Consórcios",         icon: Receipt     },
      { to: "/protecao-garantias",label: "Proteção & Garantias",icon: ShieldCheck },
    ],
  },
  {
    label: "Família",
    items: [
      { to: "/familia", label: "Família", icon: Users },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { to: "/relatorios/doacoes",       label: "Doações do Exercício", icon: Gift },
      { to: "/relatorios/gastos-por-pessoa", label: "Gastos por Pessoa",icon: User },
    ],
  },
];

/* ─── Componente ─────────────────────────────────────────────────────────── */
export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const collapsed = state === "collapsed";

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <SidebarHeader className="p-0">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-black text-sm">N</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-sidebar-foreground text-base leading-none">Natus</p>
              <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">Gestão Pessoal</p>
            </div>
          )}
        </div>

        {/* Perfil */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {"Minha Conta"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50">Pessoa Física</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <SidebarContent className="py-2">

        {/* Dashboard — sempre visível no topo */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-sidebar-border mx-2 my-1" />

        {/* Grupos dinâmicos */}
        {NAV.map((group, gi) => (
          <div key={group.label}>
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider px-4">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(item => {
                    const active = isActive(item.to);
                    const isLime = item.highlight === "lime";

                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active}>
                          <NavLink
                            to={item.to}
                            className={
                              isLime && !active
                                ? "text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 hover:bg-lime-500/10 transition-colors"
                                : "hover:text-sidebar-primary hover:bg-sidebar-primary/10 transition-colors"
                            }
                          >
                            <item.icon
                              className={`h-4 w-4 ${isLime && !active ? "text-lime-600 dark:text-lime-400" : ""}`}
                            />
                            {!collapsed && (
                              <span className={isLime && !active ? "font-bold tracking-wide" : ""}>
                                {item.label}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {gi < NAV.length - 1 && (
              <Separator className="bg-sidebar-border mx-2 my-1" />
            )}
          </div>
        ))}
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">

        {/* Toggle de tema */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
          className={`flex items-center gap-2.5 w-full rounded-xl border px-3 py-2.5 transition-all ${
            collapsed ? "justify-center" : ""
          } ${
            theme === "dark"
              ? "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-400/50"
              : "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/35"
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            theme === "dark" ? "bg-indigo-400/20" : "bg-primary/10"
          }`}>
            {theme === "dark"
              ? <Moon className="h-3.5 w-3.5 text-indigo-300" />
              : <Sun  className="h-3.5 w-3.5 text-primary" />
            }
          </div>
          {!collapsed && (
            <span className={`text-xs font-medium flex-1 text-left ${
              theme === "dark" ? "text-indigo-200/80" : "text-primary/70"
            }`}>
              {theme === "dark" ? "Modo escuro" : "Modo claro"}
            </span>
          )}
          {!collapsed && (
            <div className={`w-7 h-4 rounded-full relative shrink-0 transition-colors ${
              theme === "dark" ? "bg-indigo-500" : "bg-primary/40"
            }`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                theme === "dark" ? "left-3.5" : "left-0.5"
              }`} />
            </div>
          )}
        </button>

        {/* Configurações */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/configuracoes")}>
              <NavLink to="/configuracoes">
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
