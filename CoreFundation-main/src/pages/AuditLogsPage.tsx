import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { ScrollText, FilePlus, Pencil, Trash2, LogIn } from "lucide-react";
import { mockAuditLogs } from "@/lib/mock-data";

const actionColors: Record<string, string> = {
  CREATE: "bg-accent/20 text-accent",
  UPDATE: "bg-primary/20 text-primary",
  DELETE: "bg-destructive/20 text-destructive",
  LOGIN: "bg-secondary text-foreground",
  LOGOUT: "bg-secondary text-muted-foreground",
  ACCESS: "bg-secondary text-muted-foreground",
};

const actionIcons: Record<string, any> = {
  CREATE: FilePlus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
};

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: number | string; gradient: string }) {
  return (
    <div className={`rounded-xl p-5 shadow-lg ${gradient}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-white/80">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

export default function AuditLogsPage() {
  const { data: dbLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles(name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const logs = dbLogs.length > 0 ? dbLogs : mockAuditLogs;
  const creates = logs.filter((l: any) => l.action === "CREATE").length;
  const updates = logs.filter((l: any) => l.action === "UPDATE").length;
  const deletes = logs.filter((l: any) => l.action === "DELETE").length;

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>Audit Logs</h1>
            <p className="text-sm text-muted-foreground">Histórico de ações do sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={ScrollText} label="Total de logs" value={logs.length} gradient="stat-gradient-1" />
          <StatCard icon={FilePlus} label="Criações" value={creates} gradient="stat-gradient-2" />
          <StatCard icon={Pencil} label="Atualizações" value={updates} gradient="stat-gradient-3" />
          <StatCard icon={Trash2} label="Exclusões" value={deletes} gradient="stat-gradient-4" />
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ação</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Entidade</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full primary-gradient flex items-center justify-center text-[10px] font-medium text-white">
                          {log.profiles?.name?.charAt(0)?.toUpperCase() ?? "S"}
                        </div>
                        <span className="text-sm text-foreground">{log.profiles?.name ?? "Sistema"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${actionColors[log.action] ?? "bg-secondary text-foreground"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground capitalize">{log.entity}</span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
