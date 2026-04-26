import { useState } from 'react';
import { useAlerts, useUnreadCount, useMarkAlertRead, useMarkAllRead, useArchiveAlert, useGenerateAlerts } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, X, Package, CreditCard, Cake, Thermometer, AlertTriangle, TrendingDown, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  stock_critical: { icon: Package, color: 'text-destructive' },
  bill_due: { icon: CreditCard, color: 'text-[hsl(var(--warning))]' },
  birthday: { icon: Cake, color: 'text-primary' },
  loan_due: { icon: CreditCard, color: 'text-[hsl(var(--warning))]' },
  temperature: { icon: Thermometer, color: 'text-destructive' },
  revenue_low: { icon: TrendingDown, color: 'text-destructive' },
  loyalty_reward: { icon: Trophy, color: 'text-[hsl(var(--success))]' },
};

export function AlertsBell() {
  useGenerateAlerts();
  const { data: alerts } = useAlerts();
  const unreadCount = useUnreadCount();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllRead();
  const archiveAlert = useArchiveAlert();
  const [open, setOpen] = useState(false);

  const unreadAlerts = (alerts || []).filter(a => !a.read);
  const readAlerts = (alerts || []).filter(a => a.read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {(alerts || []).length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhuma notificação
            </div>
          ) : (
            <div>
              {unreadAlerts.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">Novas</p>
                  {unreadAlerts.map(alert => {
                    const config = typeConfig[alert.type] || { icon: AlertTriangle, color: 'text-muted-foreground' };
                    const Icon = config.icon;
                    return (
                      <div key={alert.id} className="flex gap-3 px-4 py-3 border-b bg-accent/30 hover:bg-accent/50 transition-colors">
                        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{alert.title}</p>
                          {alert.message && <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>}
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markRead.mutate(alert.id)} title="Marcar como lida">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => archiveAlert.mutate(alert.id)} title="Arquivar">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {readAlerts.length > 0 && (
                <div>
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">Anteriores</p>
                  {readAlerts.slice(0, 20).map(alert => {
                    const config = typeConfig[alert.type] || { icon: AlertTriangle, color: 'text-muted-foreground' };
                    const Icon = config.icon;
                    return (
                      <div key={alert.id} className="flex gap-3 px-4 py-3 border-b hover:bg-accent/30 transition-colors opacity-70">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-tight">{alert.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground shrink-0" onClick={() => archiveAlert.mutate(alert.id)} title="Arquivar">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
