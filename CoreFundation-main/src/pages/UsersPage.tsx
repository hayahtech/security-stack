import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, UserCheck, UserX, ShieldCheck } from "lucide-react";
import { mockUsers } from "@/lib/mock-data";

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

export default function UsersPage() {
  const { data: dbUsers = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, user_roles(role_id, roles(name))")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const users = dbUsers.length > 0 ? dbUsers : mockUsers;
  const activeCount = users.filter((u: any) => u.status === "active").length;
  const inactiveCount = users.filter((u: any) => u.status === "inactive").length;
  const rolesCount = new Set(users.flatMap((u: any) => u.user_roles?.map((ur: any) => ur.roles?.name) ?? [])).size;

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
            <UsersIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>Usuários</h1>
            <p className="text-sm text-muted-foreground">Gerencie os usuários do tenant</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={UsersIcon} label="Total" value={users.length} gradient="stat-gradient-1" />
          <StatCard icon={UserCheck} label="Ativos" value={activeCount} gradient="stat-gradient-2" />
          <StatCard icon={UserX} label="Inativos" value={inactiveCount} gradient="stat-gradient-3" />
          <StatCard icon={ShieldCheck} label="Roles distintos" value={rolesCount} gradient="stat-gradient-4" />
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Roles</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-xs font-medium text-white">
                          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.user_roles?.map((ur: any) => (
                          <Badge key={ur.role_id} variant="secondary" className="text-xs capitalize">
                            {ur.roles?.name ?? "—"}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-xs">
                        {user.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground tabular-nums">
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
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
