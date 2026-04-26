import { ReactNode, useState, useEffect } from "react";
import hayahLogo from "@/assets/hayah-logo.jpeg";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Calculator,
  Settings,
  LogOut,
  MessageSquareText,
  Terminal,
  Code2,
  Columns3,
  StickyNote,
  CalendarDays,
  Menu,
  X,
  FileText,
  ArrowLeftRight,
  ChevronDown,
  DollarSign,
  Timer,
  BarChart2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const topNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const midNavItems = [
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/cronometro", label: "Cronômetros", icon: Timer },
  { href: "/cronometro/relatorios", label: "Relatórios de Tempo", icon: BarChart2 },
];

const financeiroSubItems = [
  { href: "/financeiro/faturas", label: "Faturas", icon: FileText },
  { href: "/financeiro/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/calculator", label: "Calculadora", icon: Calculator },
];

const bottomNavItems = [
  { href: "/notes", label: "Notas", icon: StickyNote },
  { href: "/prompts", label: "Prompts", icon: MessageSquareText },
  { href: "/scripts", label: "Scripts", icon: Terminal },
  { href: "/snippets", label: "Códigos", icon: Code2 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isFinanceiroActive = financeiroSubItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [financeiroOpen, setFinanceiroOpen] = useState(isFinanceiroActive);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const renderNavItem = (item: { href: string; label: string; icon: any }) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        to={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-primary/10 text-primary glow-cyan"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && item.label}
      </Link>
    );
  };

  const sidebarContent = (isMobile: boolean) => {
    const isCollapsed = collapsed && !isMobile;

    return (
      <>
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-sidebar-border", isCollapsed ? "justify-center px-2" : "justify-between px-6")}>
          <div className="flex items-center gap-2">
            <img src={hayahLogo} alt="HayaH" className="h-8 w-8 rounded-lg object-cover" />
            {!isCollapsed && <span className="text-lg font-extrabold text-sidebar-foreground tracking-tight">HayaH</span>}
          </div>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {topNavItems.map(renderNavItem)}

          {/* Menu Financeiro colapsável */}
          <div>
            <button
              onClick={() => setFinanceiroOpen(!financeiroOpen)}
              title={isCollapsed ? "Financeiro" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isCollapsed && "justify-center px-2",
                isFinanceiroActive
                  ? "bg-primary/10 text-primary glow-cyan"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <DollarSign className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  Financeiro
                  <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", financeiroOpen && "rotate-180")} />
                </>
              )}
            </button>
            {financeiroOpen && !isCollapsed && (
              <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                {financeiroSubItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        active
                          ? "bg-primary/10 text-primary glow-cyan"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {midNavItems.map(renderNavItem)}
          {bottomNavItems.map(renderNavItem)}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            {!isCollapsed && <span className="truncate text-xs text-muted-foreground">{user?.email}</span>}
            <div className="flex items-center gap-1">
              {!isCollapsed && <ThemeToggle />}
              <button
                onClick={signOut}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-foreground hover:bg-muted transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={hayahLogo} alt="HayaH" className="h-7 w-7 rounded-lg object-cover" />
          <span className="text-base font-extrabold text-foreground tracking-tight">HayaH</span>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - mobile */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-sidebar transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent(true)}
      </aside>

      {/* Sidebar - desktop */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent(false)}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sidebar text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors shadow-sm"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 transition-all duration-300", collapsed ? "lg:ml-16" : "lg:ml-64")}>{children}</main>
    </div>
  );
};

export default AppLayout;
