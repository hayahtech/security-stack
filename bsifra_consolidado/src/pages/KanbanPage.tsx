import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, GripVertical, Calendar, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

const COLUMNS = [
  { id: "todo", label: "A Fazer", color: "border-t-[hsl(var(--neon-cyan))]" },
  { id: "in_progress", label: "Em Progresso", color: "border-t-[hsl(var(--neon-yellow))]" },
  { id: "in_review", label: "Em Revisão", color: "border-t-[hsl(var(--neon-purple))]" },
  { id: "done", label: "Concluído", color: "border-t-[hsl(var(--neon-green))]" },
];

const PRIORITIES = [
  { value: "alta", label: "Alta", className: "bg-[hsl(var(--neon-red))] text-foreground" },
  { value: "media", label: "Média", className: "bg-[hsl(var(--neon-yellow))] text-foreground" },
  { value: "baixa", label: "Baixa", className: "bg-[hsl(var(--neon-green))] text-foreground" },
];

interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  client_id: string | null;
  project_id: string | null;
  deadline: string | null;
  sort_order: number;
}

interface Client { id: string; name: string; }
interface Project { id: string; name: string; }

const KanbanPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KanbanTask | null>(null);
  const [filterClient, setFilterClient] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [form, setForm] = useState({ title: "", description: "", priority: "media", client_id: "", project_id: "", deadline: "" });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [tasksRes, clientsRes, projectsRes] = await Promise.all([
      supabase.from("kanban_tasks").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("clients").select("id, name").eq("user_id", user.id).order("name"),
      supabase.from("projects").select("id, name").eq("user_id", user.id).order("name"),
    ]);
    setTasks((tasksRes.data as KanbanTask[]) || []);
    setClients((clientsRes.data as Client[]) || []);
    setProjects((projectsRes.data as Project[]) || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", priority: "media", client_id: "", project_id: "", deadline: "" });
    setModalOpen(true);
  };

  const openEdit = (t: KanbanTask) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      client_id: t.client_id || "",
      project_id: t.project_id || "",
      deadline: t.deadline || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    const payload = {
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      deadline: form.deadline || null,
    };
    if (editing) {
      await supabase.from("kanban_tasks").update(payload).eq("id", editing.id).eq("user_id", user.id);
      toast({ title: "Tarefa atualizada" });
    } else {
      const colTasks = tasks.filter(t => t.status === "todo");
      await supabase.from("kanban_tasks").insert({ ...payload, user_id: user.id, status: "todo", sort_order: colTasks.length });
      toast({ title: "Tarefa criada" });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("kanban_tasks").delete().eq("id", id).eq("user_id", user!.id);
    toast({ title: "Tarefa excluída" });
    fetchData();
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newTasks = [...tasks];
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    if (taskIndex === -1) return;

    const task = { ...newTasks[taskIndex] };
    task.status = destination.droppableId;

    // Remove from old position
    newTasks.splice(taskIndex, 1);

    // Get tasks in dest column (excluding moved task)
    const destTasks = newTasks.filter(t => t.status === destination.droppableId);
    
    // Insert at new index
    const insertAt = destination.index;
    const allOther = newTasks.filter(t => t.status !== destination.droppableId);
    destTasks.splice(insertAt, 0, task);
    
    // Reindex
    destTasks.forEach((t, i) => { t.sort_order = i; });
    const final = [...allOther, ...destTasks];
    setTasks(final);

    // Persist
    await supabase.from("kanban_tasks").update({ status: task.status, sort_order: destination.index }).eq("id", task.id).eq("user_id", user!.id);
    // Update sort orders for dest column
    for (const dt of destTasks) {
      if (dt.id !== task.id) {
        await supabase.from("kanban_tasks").update({ sort_order: dt.sort_order }).eq("id", dt.id).eq("user_id", user!.id);
      }
    }
  };

  const getClientName = (id: string | null) => clients.find(c => c.id === id)?.name;
  const getProjectName = (id: string | null) => projects.find(p => p.id === id)?.name;
  const getPriority = (val: string) => PRIORITIES.find(p => p.value === val) || PRIORITIES[1];

  const filteredTasks = tasks.filter(t => {
    if (filterClient !== "all" && t.client_id !== filterClient) return false;
    if (filterProject !== "all" && t.project_id !== filterProject) return false;
    return true;
  });

  const getColumnTasks = (colId: string) =>
    filteredTasks.filter(t => t.status === colId).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Kanban</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Nova Tarefa</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Projeto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.id} className={`rounded-lg border border-border bg-card/50 ${col.color} border-t-2`}>
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <Badge variant="secondary" className="text-[10px]">{getColumnTasks(col.id).length}</Badge>
                </div>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2 min-h-[200px] space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                  >
                    {getColumnTasks(col.id).map((task, index) => {
                      const pri = getPriority(task.priority);
                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`rounded-lg border border-border bg-card p-3 space-y-2 transition-shadow ${snapshot.isDragging ? "shadow-lg shadow-primary/20 ring-1 ring-primary/30" : "hover:border-primary/30"}`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-muted-foreground cursor-grab active:cursor-grabbing">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground leading-tight">{task.title}</p>
                                </div>
                                <Badge className={`${pri.className} shrink-0 text-[10px]`}>{pri.label}</Badge>
                              </div>

                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{task.description}</p>
                              )}

                              <div className="flex flex-wrap gap-1 pl-6">
                                {task.client_id && (
                                  <Badge variant="outline" className="text-[10px]">{getClientName(task.client_id)}</Badge>
                                )}
                                {task.project_id && (
                                  <Badge variant="secondary" className="text-[10px]">{getProjectName(task.project_id)}</Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between pl-6">
                                {task.deadline && (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(task.deadline), "dd/MM/yyyy")}
                                  </span>
                                )}
                                <div className="flex gap-0.5 ml-auto">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(task)}><Pencil className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(task.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título da tarefa" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.client_id || "none"} onValueChange={v => setForm({ ...form, client_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.project_id || "none"} onValueChange={v => setForm({ ...form, project_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Projeto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={!form.title.trim()}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanPage;
