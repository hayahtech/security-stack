import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, ChevronRight, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, timeAgo, severityConfig, type NotificationSeverity } from "@/contexts/NotificationContext";

export default function Notificacoes() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<string>("todas");

  const filtered = filter === "todas"
    ? notifications
    : filter === "nao_lidas"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.severity === filter);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Notificações
            </h1>
            <p className="text-sm text-muted-foreground">{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" className="gap-2" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="nao_lidas">Não lidas</TabsTrigger>
            <TabsTrigger value="urgente">🔴 Urgente</TabsTrigger>
            <TabsTrigger value="atencao">🟠 Atenção</TabsTrigger>
            <TabsTrigger value="informativo">🟡 Informativo</TabsTrigger>
            <TabsTrigger value="sucesso">🟢 Sucesso</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma notificação nesta categoria.</p>
            </div>
          ) : (
            filtered.map((n) => {
              const cfg = severityConfig[n.severity];
              return (
                <Card
                  key={n.id}
                  className={`border-border cursor-pointer hover:shadow-sm transition-shadow ${!n.read ? "border-l-4" : ""}`}
                  style={!n.read ? { borderLeftColor: `var(--${n.severity === "urgente" ? "destructive" : n.severity === "sucesso" ? "primary" : ""})` } : undefined}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`mt-0.5 h-3 w-3 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-foreground/80"}`}>{n.title}</p>
                        <Badge variant="outline" className={`text-[10px] ${cfg.color} ${cfg.bg} border-transparent`}>{cfg.label}</Badge>
                      </div>
                      {n.description && <p className="text-xs text-muted-foreground mt-1">{n.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/60">
                        <span>{timeAgo(n.timestamp)}</span>
                        <span>•</span>
                        <span className="capitalize">{n.category}</span>
                      </div>
                    </div>
                    {n.link && <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1" />}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
