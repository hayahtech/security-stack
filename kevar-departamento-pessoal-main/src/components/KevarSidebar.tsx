import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  UserPlus,
  FileCheck,
  Calculator,
  Calendar,
  FileText,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemConfig {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: { title: string; path: string }[];
}

const navItems: NavItemConfig[] = [
  { title: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
  {
    title: "Folha de Pagamento",
    path: "/folha",
    icon: <DollarSign size={20} />,
    children: [
      { title: "Processamento Mensal", path: "/folha/processamento" },
      { title: "Rubricas & Verbas", path: "/folha/rubricas" },
      { title: "Holerites", path: "/folha/holerites" },
      { title: "Adiantamentos", path: "/folha/adiantamentos" },
    ],
  },
  {
    title: "Admissões & Rescisões",
    path: "/admissoes",
    icon: <UserPlus size={20} />,
    children: [
      { title: "Nova Admissão", path: "/admissoes/nova" },
      { title: "Rescisões", path: "/admissoes/rescisoes" },
      { title: "Contratos", path: "/admissoes/contratos" },
    ],
  },
  {
    title: "eSocial",
    path: "/esocial",
    icon: <FileCheck size={20} />,
    children: [
      { title: "Eventos Pendentes", path: "/esocial/pendentes" },
      { title: "Transmissão", path: "/esocial/transmissao" },
      { title: "Monitor de Erros", path: "/esocial/erros" },
    ],
  },
  {
    title: "Encargos",
    path: "/encargos",
    icon: <Calculator size={20} />,
    children: [
      { title: "INSS", path: "/encargos/inss" },
      { title: "FGTS", path: "/encargos/fgts" },
      { title: "IRRF", path: "/encargos/irrf" },
      { title: "DARF / GFIP", path: "/encargos/darf" },
    ],
  },
  { title: "Férias & 13º", path: "/ferias", icon: <Calendar size={20} /> },
  { title: "Relatórios Legais", path: "/relatorios", icon: <FileText size={20} /> },
];

const bottomItems: NavItemConfig[] = [
  { title: "Configurações", path: "/configuracoes", icon: <Settings size={20} /> },
];

function SidebarNavItem({
  item,
  collapsed,
  currentPath,
}: {
  item: NavItemConfig;
  collapsed: boolean;
  currentPath: string;
}) {
  const isActive = currentPath === item.path;
  const isChildActive = item.children?.some((c) => currentPath === c.path);
  const [open, setOpen] = useState(isActive || !!isChildActive);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <Link
        to={hasChildren ? "#" : item.path}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm",
          isActive || isChildActive
            ? "bg-kevar-bg text-kevar-navy font-semibold"
            : "text-muted-foreground hover:bg-secondary hover:text-kevar-navy"
        )}
      >
        <div className={cn(isActive || isChildActive ? "text-kevar-navy" : "text-muted-foreground/60")}>
          {item.icon}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 whitespace-nowrap">{item.title}</span>
            {hasChildren && (
              <ChevronDown
                size={14}
                className={cn("transition-transform", open && "rotate-180")}
              />
            )}
          </>
        )}
      </Link>

      {hasChildren && open && !collapsed && (
        <div className="ml-8 mt-1 space-y-0.5 border-l border-kevar-border pl-3">
          {item.children!.map((child) => (
            <Link
              key={child.path}
              to={child.path}
              className={cn(
                "block text-xs py-2 px-2 rounded-md transition-colors",
                currentPath === child.path
                  ? "text-kevar-navy font-semibold bg-kevar-bg"
                  : "text-muted-foreground hover:text-kevar-navy hover:bg-secondary"
              )}
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function KevarSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-kevar-border transition-all duration-300 flex flex-col shrink-0 h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-kevar-border">
        {!collapsed && (
          <h1 className="font-nirmala text-2xl tracking-tight text-kevar-navy">
            K<span className="text-kevar-amber">e</span>var
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            currentPath={currentPath}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-kevar-border">
        {bottomItems.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            currentPath={currentPath}
          />
        ))}
      </div>
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-kevar-navy/50 z-40" onClick={onClose} />
      <aside className="fixed left-0 top-0 w-72 h-full bg-sidebar z-50 shadow-xl flex flex-col animate-fade-in">
        <div className="h-16 flex items-center justify-between px-4 border-b border-kevar-border">
          <h1 className="font-nirmala text-2xl tracking-tight text-kevar-navy">
            K<span className="text-kevar-amber">e</span>var
          </h1>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarNavItem key={item.path} item={item} collapsed={false} currentPath={currentPath} />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-kevar-border">
          {bottomItems.map((item) => (
            <SidebarNavItem key={item.path} item={item} collapsed={false} currentPath={currentPath} />
          ))}
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden p-2 text-primary-foreground">
      <Menu size={22} />
    </button>
  );
}
