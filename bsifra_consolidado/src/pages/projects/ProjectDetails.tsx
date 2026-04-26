import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [newStep, setNewStep] = useState("");
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const fetchData = async () => {
    if (!user || !id) return;
    const [pRes, sRes] = await Promise.all([
      supabase.from("projects").select("*, clients(name)").eq("id", id).single(),
      supabase.from("project_steps").select("*").eq("project_id", id).order("sort_order"),
    ]);
    setProject(pRes.data);
    setSteps(sRes.data ?? []);
  };

  useEffect(() => { fetchData(); }, [id, user]);

  const addStep = async () => {
    if (!newStep.trim() || !user || !id) return;
    await supabase.from("project_steps").insert({
      project_id: id, user_id: user.id, title: newStep.trim(), sort_order: steps.length,
    });
    setNewStep("");
    fetchData();
  };

  const toggleStep = async (step: any) => {
    await supabase.from("project_steps").update({ completed: !step.completed }).eq("id", step.id).eq("user_id", user!.id);
    fetchData();
  };

  const deleteStep = async (stepId: string) => {
    await supabase.from("project_steps").delete().eq("id", stepId).eq("user_id", user!.id);
    fetchData();
  };

  const saveEditStep = async (stepId: string) => {
    if (!editingTitle.trim()) return;
    await supabase.from("project_steps").update({ title: editingTitle.trim() }).eq("id", stepId).eq("user_id", user!.id);
    setEditingStep(null);
    fetchData();
  };

  if (!project) return <p className="text-muted-foreground">Carregando...</p>;

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="default" onClick={() => navigate("/projects")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Project info */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{project.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {(project as any).clients?.name ?? "Sem cliente"}
              {project.deadline && ` • Prazo: ${format(new Date(project.deadline), "dd/MM/yyyy")}`}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{project.status}</span>
            <Button asChild variant="outline" size="sm"><Link to={`/projects/${id}/edit`}><Pencil className="mr-1 h-3 w-3" /> Editar</Link></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && <p className="text-sm text-foreground">{project.description}</p>}
          {project.value && <p className="text-sm text-muted-foreground">Valor: R$ {Number(project.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}
          {project.links && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Links:</p>
              {project.links.split("\n").filter(Boolean).map((link: string, i: number) => (
                <a key={i} href={link.trim()} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">{link.trim()}</a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Etapas ({completedCount}/{steps.length})</CardTitle>
            <span className="text-sm text-primary font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary mt-2">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Checkbox checked={step.completed} onCheckedChange={() => toggleStep(step)} />
              {editingStep === step.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="h-8" onKeyDown={(e) => e.key === "Enter" && saveEditStep(step.id)} />
                  <Button size="icon" variant="ghost" onClick={() => saveEditStep(step.id)}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingStep(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <>
                  <span className={`flex-1 text-sm ${step.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{step.title}</span>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingStep(step.id); setEditingTitle(step.title); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteStep(step.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </>
              )}
            </div>
          ))}

          {/* Add step */}
          <div className="flex gap-2 pt-2">
            <Input placeholder="Nova etapa..." value={newStep} onChange={(e) => setNewStep(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStep()} />
            <Button onClick={addStep} size="sm"><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
