import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Search, UserPlus, X } from "lucide-react";
import { getDbErrorMessage } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const statuses = ["Em andamento", "Concluído", "Pausado", "Cancelado"];

const projectSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório").max(255, "Nome muito longo"),
  client_id: z.string().optional(),
  description: z.string().max(2000, "Descrição muito longa").optional(),
  value: z.string().refine(
    (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
    "Valor inválido"
  ).optional(),
  deadline: z.string().optional(),
  links: z.string().max(5000, "Links muito longos").optional(),
  status: z.enum(["Em andamento", "Concluído", "Pausado", "Cancelado"]),
});

type ProjectFormErrors = Partial<Record<keyof z.infer<typeof projectSchema>, string>>;

const ProjectForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<ProjectFormErrors>({});
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [savingClient, setSavingClient] = useState(false);
  const [form, setForm] = useState({
    name: "", client_id: "", description: "", value: "", deadline: "", links: "", status: "Em andamento",
  });

  const DEFAULT_STEPS = [
    "Briefing e Levantamento de Requisitos",
    "Planejamento e Cronograma",
    "Design e Prototipação",
    "Desenvolvimento Frontend",
    "Desenvolvimento Backend",
    "Integração e Testes",
    "Revisão e Ajustes",
    "Deploy e Publicação",
    "Entrega e Suporte",
  ];
  const [steps, setSteps] = useState<string[]>(DEFAULT_STEPS);

  const fetchClients = () => {
    if (!user) return;
    supabase.from("clients").select("id, name, email, company").eq("user_id", user.id).order("name").then(({ data }) => setClients(data ?? []));
  };

  useEffect(() => {
    if (!user) return;
    fetchClients();

    if (isEditing) {
      supabase.from("projects").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setForm({
          name: data.name, client_id: data.client_id ?? "", description: data.description ?? "",
          value: data.value?.toString() ?? "", deadline: data.deadline ?? "", links: data.links ?? "", status: data.status,
        });
      });
    }
  }, [id, user]);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const selectedClient = clients.find((c) => c.id === form.client_id);

  const handleCreateClient = async () => {
    if (!user || !newClient.name.trim()) return;
    setSavingClient(true);
    const { data, error } = await supabase.from("clients").insert({
      name: newClient.name, email: newClient.email || null, phone: newClient.phone || null,
      company: newClient.company || null, notes: newClient.notes || null, user_id: user.id,
    }).select("id").single();
    setSavingClient(false);
    if (error) {
      toast({ title: "Erro ao criar cliente", description: getDbErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Cliente criado!" });
      setForm({ ...form, client_id: data.id });
      setNewClient({ name: "", email: "", phone: "", company: "", notes: "" });
      setShowNewClient(false);
      fetchClients();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = projectSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: ProjectFormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ProjectFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});
    setLoading(true);

    const payload = {
      name: form.name,
      client_id: form.client_id || null,
      description: form.description || null,
      value: form.value ? parseFloat(form.value) : null,
      deadline: form.deadline || null,
      links: form.links || null,
      status: form.status,
      user_id: user.id,
    };

    if (isEditing) {
      const { error } = await supabase.from("projects").update(payload).eq("id", id).eq("user_id", user.id);
      setLoading(false);
      if (error) {
        toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" });
      } else {
        toast({ title: "Projeto atualizado!" });
        navigate("/projects");
      }
    } else {
      const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
      if (error) {
        setLoading(false);
        toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" });
        return;
      }
      // Create project steps and kanban tasks
      const validSteps = steps.filter(s => s.trim());
      if (validSteps.length > 0 && data) {
        const stepsPayload = validSteps.map((title, i) => ({
          project_id: data.id, user_id: user.id, title, sort_order: i, completed: false,
        }));
        const kanbanPayload = validSteps.map((title, i) => ({
          project_id: data.id, user_id: user.id, title, status: "todo", priority: "media", sort_order: i,
        }));
        await Promise.all([
          supabase.from("project_steps").insert(stepsPayload),
          supabase.from("kanban_tasks").insert(kanbanPayload),
        ]);
      }
      setLoading(false);
      toast({ title: "Projeto criado!" });
      navigate("/projects");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-2 sm:px-0">
      <Button variant="default" onClick={() => navigate("/projects")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-2xl">{isEditing ? "Editar Projeto" : "Novo Projeto"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome do projeto */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            {/* Cliente */}
            <div className="space-y-3">
              <Label>Cliente</Label>
              {selectedClient ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedClient.name}</p>
                    {selectedClient.company && <p className="text-xs text-muted-foreground truncate">{selectedClient.company}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setForm({ ...form, client_id: "" })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente por nome, email ou empresa..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {clientSearch && filteredClients.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-popover">
                      {filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                          onClick={() => { setForm({ ...form, client_id: c.id }); setClientSearch(""); }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{c.name}</p>
                            {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {clientSearch && filteredClients.length === 0 && (
                    <p className="text-xs text-muted-foreground px-1">Nenhum cliente encontrado.</p>
                  )}
                  <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                        <UserPlus className="h-4 w-4" /> Cadastrar Novo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md mx-2 sm:mx-auto">
                      <DialogHeader>
                        <DialogTitle>Novo Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                          <Label>Nome *</Label>
                          <Input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                        </div>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label>Email</Label>
                            <Input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Telefone</Label>
                            <Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Empresa</Label>
                          <Input value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Observações</Label>
                          <Textarea value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} rows={2} />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <Button type="button" variant="secondary" onClick={() => setShowNewClient(false)}>Cancelar</Button>
                          <Button type="button" onClick={handleCreateClient} disabled={savingClient || !newClient.name.trim()}>
                            {savingClient ? "Salvando..." : "Criar Cliente"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            {/* Valor e Prazo */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input id="value" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                {formErrors.value && <p className="text-xs text-destructive">{formErrors.value}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Prazo Final</Label>
                <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <Label htmlFor="links">Links Úteis</Label>
              <Textarea id="links" value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} placeholder="Um link por linha" rows={2} />
              {formErrors.links && <p className="text-xs text-destructive">{formErrors.links}</p>}
            </div>

            {/* Etapas do Projeto */}
            {!isEditing && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Etapas do Projeto (Kanban)</Label>
                <p className="text-xs text-muted-foreground">Essas etapas serão adicionadas automaticamente ao Kanban como "A Fazer".</p>
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                      <Input
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...steps];
                          newSteps[i] = e.target.value;
                          setSteps(newSteps);
                        }}
                        placeholder={`Etapa ${i + 1}`}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate("/projects")} className="w-full sm:w-auto">Cancelar</Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectForm;
