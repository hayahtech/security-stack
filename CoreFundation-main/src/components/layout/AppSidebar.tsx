import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  ScrollText,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
  Building,
  UserCircle,
  TrendingUp,
  Search,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building, label: "Clientes", href: "/customers" },
  { icon: UserCircle, label: "Contatos", href: "/contacts" },
  { icon: TrendingUp, label: "Oportunidades", href: "/opportunities" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: Shield, label: "Roles & Permissões", href: "/roles" },
  { icon: Building2, label: "Empresa", href: "/company" },
  { icon: ScrollText, label: "Audit Logs", href: "/audit-logs" },
];

export function AppSidebar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-slide-in-left">
            <div className="w-8 h-8 rounded-md primary-gradient flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground truncate">ERP Core</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <button
          onClick={onSearchOpen}
          className={cn(
            "flex items-center w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border",
            collapsed ? "justify-center" : "gap-2"
          )}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Buscar…</span>
              <span className="flex items-center gap-0.5">
                <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">⌘</kbd>
                <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">K</kbd>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                "hover:bg-secondary active:scale-[0.97]",
                isActive
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        {!collapsed && profile && (
          <div className="mb-3 px-2">
            <p className="text-xs font-medium text-foreground truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
