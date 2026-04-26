import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCircle, Plus, Pencil, Trash2, Star, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { mockContacts } from "@/lib/mock-data";

interface ContactForm {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
}

const empty: ContactForm = { customer_id: "", name: "", email: "", phone: "", role: "", is_primary: false };

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

export default function ContactsPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactForm>(empty);

  const { data: dbContacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contacts")
        .select("*, customers(name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, name").order("name");
      return data ?? [];
    },
  });

  const contacts = dbContacts.length > 0 ? dbContacts : mockContacts;
  const primaryCount = contacts.filter((c: any) => c.is_primary).length;
  const withEmail = contacts.filter((c: any) => c.email).length;
  const withPhone = contacts.filter((c: any) => c.phone).length;

  const save = useMutation({
    mutationFn: async (f: ContactForm) => {
      if (!profile?.tenant_id) throw new Error("Sem tenant");
      const payload = { ...f, tenant_id: profile.tenant_id } as any;
      if (editId) {
        const { error } = await supabase.from("contacts").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contacts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: editId ? "Contato atualizado" : "Contato criado" });
      handleClose();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contato excluído" });
    },
  });

  const handleClose = () => { setOpen(false); setEditId(null); setForm(empty); };
  const handleEdit = (c: any) => {
    setEditId(c.id);
    setForm({ customer_id: c.customer_id, name: c.name, email: c.email ?? "", phone: c.phone ?? "", role: c.role ?? "", is_primary: c.is_primary });
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Contatos</h1>
              <p className="text-sm text-muted-foreground">Gerencie contatos vinculados aos clientes</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setForm(empty); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Contato
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={UserCircle} label="Total" value={contacts.length} gradient="stat-gradient-1" />
          <StatCard icon={Star} label="Principais" value={primaryCount} gradient="stat-gradient-2" />
          <StatCard icon={Mail} label="Com email" value={withEmail} gradient="stat-gradient-3" />
          <StatCard icon={Phone} label="Com telefone" value={withPhone} gradient="stat-gradient-4" />
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : (
                contacts.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-xs font-medium text-white">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.customers?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.role}</TableCell>
                    <TableCell>{c.is_primary && <Badge variant="default" className="text-xs">Sim</Badge>}</TableCell>
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
            <DialogHeader><DialogTitle>{editId ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Cliente *</label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((cu: any) => (
                      <SelectItem key={cu.id} value={cu.id}>{cu.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-sm font-medium text-foreground">Cargo</label>
                  <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <Checkbox checked={form.is_primary} onCheckedChange={(v) => setForm({ ...form, is_primary: !!v })} />
                  <span className="text-sm text-foreground">Contato principal</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button onClick={() => save.mutate(form)} disabled={!form.name || !form.customer_id || save.isPending}>
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
