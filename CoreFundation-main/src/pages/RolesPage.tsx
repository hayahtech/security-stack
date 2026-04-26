import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RoleForm {
  name: string;
  description: string;
  permissionIds: string[];
}

const emptyForm: RoleForm = { name: "", description: "", permissionIds: [] };

export default function RolesPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("roles")
        .select("*, role_permissions(permission_id, permissions(name, module))")
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await supabase.from("permissions").select("*").order("module");
      return data ?? [];
    },
  });

  const groupedPermissions = permissions.reduce((acc: Record<string, typeof permissions>, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const saveMutation = useMutation({
    mutationFn: async (formData: RoleForm) => {
      if (!profile?.tenant_id) throw new Error("Sem tenant");

      let roleId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from("roles")
          .update({ name: formData.name, description: formData.description })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("roles")
          .insert({ name: formData.name, description: formData.description, tenant_id: profile.tenant_id })
          .select("id")
          .single();
        if (error) throw error;
        roleId = data.id;
      }

      // Sync permissions
      if (editingId) {
        await supabase.from("role_permissions").delete().eq("role_id", editingId);
      }

      if (formData.permissionIds.length > 0 && roleId) {
        const rows = formData.permissionIds.map((pid) => ({ role_id: roleId!, permission_id: pid }));
        const { error } = await supabase.from("role_permissions").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: editingId ? "Role atualizado" : "Role criado" });
      handleClose();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (role: any) => {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissionIds: role.role_permissions?.map((rp: any) => rp.permission_id) ?? [],
    });
    setOpen(true);
  };

  const togglePermission = (id: string) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((p) => p !== id)
        : [...prev.permissionIds, id],
    }));
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>Roles & Permissões</h1>
              <p className="text-sm text-muted-foreground">Gerencie roles e controle de acesso</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Role
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Roles do Tenant</h2>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <div className="space-y-3">
                {roles.map((role: any) => (
                  <div key={role.id} className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground capitalize">{role.name}</span>
                      <div className="flex items-center gap-2">
                        {role.is_system && <Badge variant="secondary" className="text-xs">Sistema</Badge>}
                        <button onClick={() => handleEdit(role)} className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{role.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {role.role_permissions?.map((rp: any) => (
                        <Badge key={rp.permission_id} variant="outline" className="text-xs">
                          {rp.permissions?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Permissions overview */}
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Permissões disponíveis</h2>
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module}>
                  <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">{module}</h3>
                  <div className="space-y-1">
                    {perms.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-secondary/30 transition-colors">
                        <span className="text-sm text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Role" : "Novo Role"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: financeiro" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do role" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Permissões</label>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">{module}</h4>
                      <div className="space-y-2">
                        {perms.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/30 rounded px-2 py-1.5 transition-colors">
                            <Checkbox
                              checked={form.permissionIds.includes(p.id)}
                              onCheckedChange={() => togglePermission(p.id)}
                            />
                            <span className="text-sm text-foreground">{p.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{p.description}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
