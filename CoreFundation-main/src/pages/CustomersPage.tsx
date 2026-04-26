import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Plus, Pencil, Trash2, Users, UserPlus, Handshake } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { mockCustomers } from "@/lib/mock-data";

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  document: string;
  type: string;
  notes: string;
}

const empty: CustomerForm = { name: "", email: "", phone: "", document: "", type: "lead", notes: "" };

const typeLabels: Record<string, string> = { lead: "Lead", customer: "Cliente", partner: "Parceiro" };
const typeBadge: Record<string, "default" | "secondary" | "outline"> = { lead: "outline", customer: "default", partner: "secondary" };

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

export default function CustomersPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(empty);

  const { data: dbCustomers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const customers = dbCustomers.length > 0 ? dbCustomers : mockCustomers;
  const leads = customers.filter((c: any) => c.type === "lead").length;
  const clients = customers.filter((c: any) => c.type === "customer").length;
  const partners = customers.filter((c: any) => c.type === "partner").length;

  const save = useMutation({
    mutationFn: async (f: CustomerForm) => {
      if (!profile?.tenant_id) throw new Error("Sem tenant");
      const payload = { ...f, tenant_id: profile.tenant_id } as any;
      if (editId) {
        const { error } = await supabase.from("customers").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: editId ? "Cliente atualizado" : "Cliente criado" });
      handleClose();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Cliente excluído" });
    },
  });

  const handleClose = () => { setOpen(false); setEditId(null); setForm(empty); };
  const handleEdit = (c: any) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", document: c.document ?? "", type: c.type, notes: c.notes ?? "" });
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
              <Building className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">Gerencie sua base de clientes</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setForm(empty); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Building} label="Total" value={customers.length} gradient="stat-gradient-1" />
          <StatCard icon={UserPlus} label="Leads" value={leads} gradient="stat-gradient-2" />
          <StatCard icon={Users} label="Clientes" value={clients} gradient="stat-gradient-3" />
          <StatCard icon={Handshake} label="Parceiros" value={partners} gradient="stat-gradient-4" />
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : (
                customers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-xs font-medium text-white">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell><Badge variant={typeBadge[c.type] ?? "outline"}>{typeLabels[c.type] ?? c.type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(c)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del.mutate(c.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Nome *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Telefone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Documento</label>
                  <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="CNPJ / CPF" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="partner">Parceiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Notas</label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button onClick={() => save.mutate(form)} disabled={!form.name || save.isPending}>
                  {save.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
