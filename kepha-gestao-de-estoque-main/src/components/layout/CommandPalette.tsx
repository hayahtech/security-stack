import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowRightLeft,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Plus,
  Search,
  Building2,
  Users,
} from 'lucide-react';

export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, skus, warehouses, suppliers } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === '?' && !commandPaletteOpen) {
        e.preventDefault();
        // Could open shortcuts modal here
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Buscar SKUs, comandos, navegação..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/skus'))}>
            <Package className="mr-2 h-4 w-4" />
            Catálogo de SKUs
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/warehouses'))}>
            <Warehouse className="mr-2 h-4 w-4" />
            Armazéns
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/movements'))}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Movimentações
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/purchase-orders'))}>
            <FileText className="mr-2 h-4 w-4" />
            Pedidos de Compra
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/alerts'))}>
            <Bell className="mr-2 h-4 w-4" />
            Alertas
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/reports'))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => console.log('Criar SKU'))}>
            <Plus className="mr-2 h-4 w-4" />
            Criar novo SKU
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Criar PO'))}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Pedido de Compra
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Registrar movimentação'))}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Registrar Movimentação
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="SKUs Recentes">
          {skus.slice(0, 5).map((sku) => (
            <CommandItem 
              key={sku.id} 
              onSelect={() => runCommand(() => navigate(`/skus?id=${sku.id}`))}
            >
              <Package className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{sku.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{sku.id}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Armazéns">
          {warehouses.map((wh) => (
            <CommandItem 
              key={wh.id} 
              onSelect={() => runCommand(() => navigate(`/warehouses?id=${wh.id}`))}
            >
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{wh.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Fornecedores">
          {suppliers.slice(0, 5).map((sup) => (
            <CommandItem 
              key={sup.id} 
              onSelect={() => runCommand(() => navigate(`/settings?supplier=${sup.id}`))}
            >
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{sup.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
