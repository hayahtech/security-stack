import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, PawPrint, Package, Scissors, ShoppingCart,
  Menu, X, Dog, Moon, Sun, ChevronsLeft, ChevronsRight, Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Pets", href: "/pets", icon: PawPrint },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Serviços", href: "/servicos", icon: Scissors },
  { label: "Gestão de Estoque", href: "/estoque", icon: Warehouse },
  { label: "Vendas", href: "/vendas", icon: ShoppingCart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col transition-all duration-300 lg:static lg:z-auto",
          collapsed ? "lg:w-16" : "lg:w-64",
          "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Dog className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <>
              <span className="font-heading text-lg font-bold text-foreground whitespace-nowrap">
                PetShop<span className="text-primary">Pro</span>
              </span>
              <button
                onClick={() => setCollapsed(true)}
                className="ml-auto hidden lg:flex p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Recolher menu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            className="ml-auto lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Expand toggle (only when collapsed) */}
        {collapsed && (
          <div className="hidden lg:flex px-2 pb-2">
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold shrink-0">
              A
            </div>
            {!collapsed && (
              <div className="text-sm">
                <p className="font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">admin@petshoppro.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="page-header text-foreground">
            {navItems.find((i) => i.href === location.pathname)?.label || "PetShopPro"}
          </h1>
          <button
            onClick={() => setDark(!dark)}
            className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title={dark ? "Modo claro" : "Modo escuro"}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
