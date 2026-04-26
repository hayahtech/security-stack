import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, timeAgo, severityConfig } from "@/contexts/NotificationContext";

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const recent = notifications.slice(0, 20);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-display font-semibold text-foreground text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((n) => {
                const cfg = severityConfig[n.severity];
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    {/* Severity dot */}
                    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!n.read ? "font-medium text-foreground" : "text-foreground/80"}`}>
                        {n.title}
                      </p>
                      {n.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                    {n.link && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => navigate("/notificacoes")}>
            Ver todas <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
