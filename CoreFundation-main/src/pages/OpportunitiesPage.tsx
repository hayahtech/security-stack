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
import { TrendingUp, Plus, Pencil, Trash2, DollarSign, Target, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { mockOpportunities } from "@/lib/mock-data";

interface OppForm {
  customer_id: string;
  contact_id: string;
  title: string;
  value: string;
  stage: string;
  probability: string;
  expected_close_date: string;
  notes: string;
}

const empty: OppForm = { customer_id: "", contact_id: "", title: "", value: "0", stage: "lead", probability: "0", expected_close_date: "", notes: "" };

const stageLabels: Record<string, string> = {
  lead: "Lead", qualification: "Qualificação", proposal: "Proposta",
  negotiation: "Negociação", closed_won: "Ganho", closed_lost: "Perdido",
};

const stageColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  lead: "outline", qualification: "secondary", proposal: "secondary",
  negotiation: "default", closed_won: "default", closed_lost: "destructive",
};

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: string | number; gradient: string }) {
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

export default function OpportunitiesPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<OppForm>(empty);

  const { data: dbOpps = [], isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*, customers(name), contacts(name)")
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

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-for-opp", form.customer_id],
    enabled: !!form.customer_id,
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, name").eq("customer_id", form.customer_id).order("name");
      return data ?? [];
    },
  });

  const opps = dbOpps.length > 0 ? dbOpps : mockOpportunities;
  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const totalValue = opps.reduce((s: number, o: any) => s + Number(o.value), 0);
  const wonCount = opps.filter((o: any) => o.stage === "closed_won").length;
  const avgProb = opps.length > 0 ? Math.round(opps.reduce((s: number, o: any) => s + Number(o.probability), 0) / opps.length) : 0;

  const save = useMutation({
    mutationFn: async (f: OppForm) => {
      if (!profile?.tenant_id) throw new Error("Sem tenant");
      const payload: any = {
        tenant_id: profile.tenant_id,
        customer_id: f.customer_id,
        contact_id: f.contact_id || null,
        title: f.title,
        value: parseFloat(f.value) || 0,
        stage: f.stage,
        probability: parseInt(f.probability) || 0,
        expected_close_date: f.expected_close_date || null,
        notes: f.notes || null,
      };
      if (editId) {
        const { error } = await supabase.from("opportunities").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("opportunities").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      toast({ title: editId ? "Oportunidade atualizada" : "Oportunidade criada" });
      handleClose();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      toast({ title: "Oportunidade excluída" });
    },
  });

  const handleClose = () => { setOpen(false); setEditId(null); setForm(empty); };
  const handleEdit = (o: any) => {
    setEditId(o.id);
    setForm({
      customer_id: o.customer_id, contact_id: o.contact_id ?? "", title: o.title,
      value: String(o.value), stage: o.stage, probability: String(o.probability),
      expected_close_date: o.expected_close_date ?? "", notes: o.notes ?? "",
    });
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg primary-gradient flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Oportunidades</h1>
              <p className="text-sm text-muted-foreground">Pipeline de vendas</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setForm(empty); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nova Oportunidade
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={TrendingUp} label="Total" value={opps.length} gradient="stat-gradient-1" />
          <StatCard icon={DollarSign} label="Valor total" value={formatCurrency(totalValue)} gradient="stat-gradient-2" />
          <StatCard icon={CheckCircle2} label="Ganhas" value={wonCount} gradient="stat-gradient-3" />
          <StatCard icon={Target} label="Prob. média" value={`${avgProb}%`} gradient="stat-gradient-4" />
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Prob.</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : (
                opps.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-foreground">{o.title}</TableCell>
                    <TableCell className="text-muted-foreground">{o.customers?.name}</TableCell>
                    <TableCell className="text-foreground font-medium tabular-nums">{formatCurrency(Number(o.value))}</TableCell>
                    <TableCell><Badge variant={stageColors[o.stage] ?? "outline"}>{stageLabels[o.stage] ?? o.stage}</Badge></TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{o.probability}%</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(o)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del.mutate(o.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar Oportunidade" : "Nova Oportunidade"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground">Título *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Cliente *</label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v, contact_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Contato</label>
                  <Select value={form.contact_id} onValueChange={(v) => setForm({ ...form, contact_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Valor (R$)</label>
                  <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Estágio</label>
                  <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Prob. (%)</label>
                  <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Previsão de fechamento</label>
                <Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Notas</label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button onClick={() => save.mutate(form)} disabled={!form.title || !form.customer_id || save.isPending}>
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
