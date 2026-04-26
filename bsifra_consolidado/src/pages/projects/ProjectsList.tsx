import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Eye, Copy } from "lucide-react";
import { getDbErrorMessage } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MotionDiv, staggerContainer, fadeUp, scaleIn } from "@/lib/motion";

const statuses = ["Todos", "Em andamento", "Concluído", "Pausado", "Cancelado"];

const ProjectsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [clientFilter, setClientFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const [pRes, cRes] = await Promise.all([
      supabase.from("projects").select("*, clients(name)").eq("user_id", user.id).order("deadline", { ascending: true, nullsFirst: false }),
      supabase.from("clients").select("id, name").eq("user_id", user.id).order("name"),
    ]);
    setProjects(pRes.data ?? []);
    setClients(cRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    await supabase.from("projects").delete().eq("id", id).eq("user_id", user!.id);
    toast({ title: "Projeto excluído" });
    fetchData();
  };

  const handleDuplicate = async (project: any) => {
    if (!user) return;
    const { id, created_at, updated_at, clients, ...rest } = project;
    const { error } = await supabase.from("projects").insert({ ...rest, user_id: user.id, name: `${rest.name} (cópia)` });
    if (error) {
      toast({ title: "Erro ao duplicar", description: getDbErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Projeto duplicado" });
      fetchData();
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    const matchClient = clientFilter === "Todos" || p.client_id === clientFilter;
    return matchSearch && matchStatus && matchClient;
  });

  return (
    <MotionDiv className="space-y-8" initial="hidden" animate="show" variants={staggerContainer}>
      <MotionDiv variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-extrabold text-foreground tracking-tight">Projetos</h1>
          <p className="text-sm font-light text-muted-foreground">Gerencie todos os seus projetos</p>
        </div>
        <Button asChild className="font-medium">
          <Link to="/projects/new"><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Link>
        </Button>
      </MotionDiv>

      <MotionDiv variants={scaleIn}>
        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-wrap gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-normal focus:ring-2 focus:ring-primary/30 transition-shadow" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 font-normal"><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-44 font-normal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os clientes</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Nome</TableHead>
                    <TableHead className="font-medium">Cliente</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Prazo</TableHead>
                    <TableHead className="w-40 font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer transition-colors hover:bg-muted/60" onClick={() => navigate(`/projects/${p.id}`)}>
                      <TableCell className="font-medium py-4 px-5">{p.name}</TableCell>
                      <TableCell className="font-normal py-4 px-5">{(p as any).clients?.name ?? "—"}</TableCell>
                      <TableCell className="py-4 px-5">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{p.status}</span>
                      </TableCell>
                      <TableCell className="font-normal py-4 px-5">{p.deadline ? format(new Date(p.deadline), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="py-4 px-5">
                        <div className="flex gap-2">
                          <Button asChild variant="ghost" size="icon" className="hover:text-primary transition-colors"><Link to={`/projects/${p.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          <Button asChild variant="ghost" size="icon" className="hover:text-primary transition-colors"><Link to={`/projects/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(p)} className="hover:text-primary transition-colors"><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </MotionDiv>
    </MotionDiv>
  );
};

export default ProjectsList;
