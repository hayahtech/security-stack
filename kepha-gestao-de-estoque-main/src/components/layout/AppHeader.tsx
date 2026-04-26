import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Command,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  const { currentUser, alerts, setCommandPaletteOpen } = useAppStore();
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleSearchClick = () => {
    setCommandPaletteOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Search Bar */}
      <div className="flex items-center flex-1 max-w-xl">
        <div
          onClick={handleSearchClick}
          className="relative flex items-center w-full cursor-pointer"
        >
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Buscar SKUs, POs, armazéns..."
            className="pl-9 pr-20 bg-secondary/50 border-border cursor-pointer hover:bg-secondary/80 transition-colors"
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="w-3 h-3" />
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Help */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unacknowledgedAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-mono font-bold bg-destructive text-destructive-foreground rounded-full">
                  {unacknowledgedAlerts > 99 ? '99+' : unacknowledgedAlerts}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificações</span>
              {criticalAlerts > 0 && (
                <Badge variant="destructive" className="font-mono text-xs">
                  {criticalAlerts} crítico{criticalAlerts > 1 ? 's' : ''}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {alerts.filter(a => !a.acknowledged).slice(0, 5).map((alert) => (
                <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.severity === 'critical' ? 'bg-destructive' :
                      alert.severity === 'warning' ? 'bg-warning' : 'bg-primary'
                    }`} />
                    <span className="text-sm font-medium truncate flex-1">{alert.skuName || 'Sistema'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-4">{alert.message}</p>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary cursor-pointer">
              Ver todos os alertas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                <Badge variant="secondary" className="w-fit mt-1 text-xs font-mono">
                  {currentUser?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
