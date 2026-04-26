import { SidebarTrigger } from '@/components/ui/sidebar';
import { ScopeToggle } from './ScopeToggle';
import { AlertsBell } from './AlertsBell';
import { useTheme } from '@/contexts/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Moon, Sun, Pizza, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const roleLabels: Record<string, string> = {
  dono: 'Dono', gerente: 'Gerente', caixa: 'Caixa',
  cozinha: 'Cozinha', contador: 'Contador', entregador: 'Entregador',
};

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { currentRestaurant, currentRole, memberships, switchRestaurant } = useRestaurant();

  const hasMultiple = memberships.length > 1;

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-card no-print">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-foreground" />
        <div className="flex items-center gap-2">
          <Pizza className="h-6 w-6 text-primary" />
          {hasMultiple ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2 h-8 gap-1 font-bold text-lg" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {currentRestaurant?.name || 'PizzaFlow'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {memberships.map(m => (
                  <DropdownMenuItem key={m.restaurant_id} onClick={() => switchRestaurant(m.restaurant_id)} className={m.restaurant_id === currentRestaurant?.id ? 'bg-accent' : ''}>
                    <div className="flex items-center gap-2">
                      <span>{m.restaurant?.name}</span>
                      <Badge variant="outline" className="text-xs">{roleLabels[m.role] || m.role}</Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h1 className="text-lg font-bold tracking-tight hidden sm:block" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {currentRestaurant?.name || 'PizzaFlow'}
            </h1>
          )}
        </div>
        {currentRole && (
          <Badge variant="secondary" className="hidden md:inline-flex text-xs">
            {roleLabels[currentRole] || currentRole}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4">
        {profile?.full_name && (
          <span className="text-sm text-muted-foreground hidden sm:block">Olá, {profile.full_name}</span>
        )}
        <ScopeToggle />
        <AlertsBell />
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
