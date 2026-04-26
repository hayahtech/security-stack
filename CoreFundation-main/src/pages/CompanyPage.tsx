import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Save, Calendar, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: string; gradient: string }) {
  return (
    <div className={`rounded-xl p-5 shadow-lg ${gradient}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-white/80">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export default function CompanyPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").single();
      return data;
    },
  });

  const displayTenant = tenant ?? {
    id: "demo-tenant-id",
    name: "Minha Empresa LTDA",
    document: "12.345.678/0001-90",
    plan: "pro",
    status: "active",
    created_at: "2025-10-01T08:00:00Z",
  };

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setDocument(tenant.document ?? "");
    } else if (!tenant && !isLoading) {
      setName(displayTenant.name);
      setDocument(displayTenant.document ?? "");
    }
  }, [tenant, isLoading]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) return;
      const { error } = await supabase
        .from("tenants")
        .update({ name, document })
        .eq("id", tenant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Dados da empresa atualizados!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar");
    },
  });

  const planLabel: Record<string, string> = { basic: "Básico", pro: "Profissional", enterprise: "Enterprise" };
  const statusLabel: Record<string, string> = { active: "Ativo", inactive: "Inativo", suspended: "Suspenso" };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>Configurações da Empresa</h1>
            <p className="text-sm text-muted-foreground">Gerencie os dados do seu tenant</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={CreditCard} label="Plano" value={planLabel[displayTenant.plan] ?? displayTenant.plan} gradient="stat-gradient-1" />
              <StatCard icon={Shield} label="Status" value={statusLabel[displayTenant.status] ?? displayTenant.status} gradient="stat-gradient-2" />
              <StatCard icon={Calendar} label="Membro desde" value={new Date(displayTenant.created_at).toLocaleDateString("pt-BR")} gradient="stat-gradient-3" />
            </div>

            <div className="glass-panel rounded-xl p-6 space-y-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Nome da empresa</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">CNPJ / Documento</Label>
                  <Input
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="bg-secondary border-border"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="primary-gradient text-primary-foreground hover:opacity-90 active:scale-[0.97]"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </form>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ID do Tenant: <code className="text-foreground/70">{displayTenant.id}</code>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
