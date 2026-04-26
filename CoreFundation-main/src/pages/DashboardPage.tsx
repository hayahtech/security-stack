import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Shield, ScrollText, Building2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: number | string; gradient: string }) {
  return (
    <div className={`rounded-xl p-5 animate-fade-in shadow-lg ${gradient}`}>
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

function DashboardContent() {
  const { profile } = useAuth();

  const { data: usersCount = 0 } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: rolesCount = 0 } = useQuery({
    queryKey: ["roles-count"],
    queryFn: async () => {
      const { count } = await supabase.from("roles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: logsCount = 0 } = useQuery({
    queryKey: ["logs-count"],
    queryFn: async () => {
      const { count } = await supabase.from("audit_logs").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").single();
      return data;
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground text-balance" style={{ lineHeight: "1.2" }}>
          Olá, {profile?.name ?? "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tenant?.name ?? "Sua empresa"} · Plano {tenant?.plan ?? "basic"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Usuários" value={usersCount} gradient="stat-gradient-1" />
        <StatCard icon={Shield} label="Roles" value={rolesCount} gradient="stat-gradient-2" />
        <StatCard icon={ScrollText} label="Logs" value={logsCount} gradient="stat-gradient-3" />
        <StatCard icon={Building2} label="Plano" value={tenant?.plan ?? "basic"} gradient="stat-gradient-4" />
      </div>

      <div className="mt-8 glass-panel rounded-xl p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Módulos disponíveis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "CRM", status: "Em breve", desc: "Gestão de clientes e oportunidades" },
            { name: "Financeiro", status: "Em breve", desc: "Contas a pagar e receber" },
            { name: "Estoque", status: "Em breve", desc: "Controle de inventário" },
          ].map((mod) => (
            <div key={mod.name} className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{mod.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{mod.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
