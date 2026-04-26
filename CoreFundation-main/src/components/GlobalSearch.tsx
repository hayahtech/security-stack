import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Building,
  UserCircle,
  TrendingUp,
  Users,
  Shield,
  Building2,
  ScrollText,
} from "lucide-react";
import { useGlobalSearch } from "@/hooks/use-global-search";

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

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { results } = useGlobalSearch(query);

  const handleSelect = (href: string) => {
    navigate(href);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQuery(""); }}>
      <CommandInput
        placeholder="Buscar clientes, contatos, oportunidades…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim() === "" ? (
          <CommandGroup heading="Navegação rápida">
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : results.length > 0 ? (
          <CommandGroup heading="Resultados">
            {results.map((r) => (
              <CommandItem
                key={r.id}
                value={r.title}
                onSelect={() => handleSelect(r.href)}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                <span className="text-sm">{r.title}</span>
                <span className="text-xs text-muted-foreground">{r.subtitle}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <CommandEmpty>Nenhum resultado para "{query}"</CommandEmpty>
        )}
      </CommandList>
      <div className="border-t border-border px-3 py-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↑↓</kbd> navegar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">↵</kbd> abrir
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd> fechar
        </span>
      </div>
    </CommandDialog>
  );
}
