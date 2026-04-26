import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Copy, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFileImport } from "@/hooks/useFileImport";

const CATEGORIES = ["Geral", "Copywriting", "Código", "Análise", "Atendimento", "SEO", "Marketing", "Design"];
const AI_TOOLS = ["Todas", "Bolt", "ChatGPT", "Claude", "Copilot", "Cursor", "DALL-E", "DeepSeek", "ElevenLabs", "Gemini", "Grok", "Kling AI", "Leonardo AI", "Lovable", "LumaAI", "Manus", "Midjourney", "Perplexity", "Runway", "Stable Diffusion", "Suno AI"];

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  category: string;
  ai_tool: string;
  content: string;
  created_at: string;
}

const PromptsLibrary = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterAi, setFilterAi] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "Geral", ai_tool: "Todas", content: "" });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("prompts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setPrompts((data as Prompt[]) || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", category: "Geral", ai_tool: "Todas", content: "" }); setModalOpen(true); };
  const openEdit = (p: Prompt) => { setEditing(p); setForm({ title: p.title, description: p.description || "", category: p.category, ai_tool: p.ai_tool || "Todas", content: p.content }); setModalOpen(true); };

  const { inputRef: fileRef, triggerImport, handleFileChange, acceptedExtensions } = useFileImport((content, fileName) => {
    const name = fileName.replace(/\.[^/.]+$/, "");
    setEditing(null);
    setForm({ title: name, description: "", category: "Geral", ai_tool: "Todas", content });
    setModalOpen(true);
  });

  const handleSave = async () => {
    if (!user || !form.title.trim() || !form.content.trim()) return;
    if (editing) {
      await supabase.from("prompts").update({ title: form.title, description: form.description || null, category: form.category, ai_tool: form.ai_tool, content: form.content }).eq("id", editing.id).eq("user_id", user.id);
      toast({ title: "Prompt atualizado" });
    } else {
      await supabase.from("prompts").insert({ user_id: user.id, title: form.title, description: form.description || null, category: form.category, ai_tool: form.ai_tool, content: form.content });
      toast({ title: "Prompt adicionado" });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("prompts").delete().eq("id", id).eq("user_id", user!.id);
    toast({ title: "Prompt excluído" });
    fetchData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const filtered = prompts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchAi = filterAi === "all" || p.ai_tool === filterAi;
    return matchSearch && matchCat && matchAi;
  });

  const catColor = (cat: string) => {
    const map: Record<string, string> = { Copywriting: "bg-[hsl(var(--neon-purple))]", Código: "bg-[hsl(var(--neon-cyan))]", Análise: "bg-[hsl(var(--neon-yellow))]", Atendimento: "bg-[hsl(var(--neon-green))]", SEO: "bg-[hsl(var(--neon-orange))]", Marketing: "bg-[hsl(var(--neon-red))]", Design: "bg-[hsl(var(--neon-purple))]" };
    return map[cat] || "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Biblioteca de Prompts</h1>
        <div className="flex gap-2">
          <Button onClick={triggerImport} variant="outline" className="gap-2"><Upload className="h-4 w-4" />Importar</Button>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Novo Prompt</Button>
        </div>
        <input ref={fileRef} type="file" accept={acceptedExtensions} onChange={handleFileChange} className="hidden" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar prompts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAi} onValueChange={setFilterAi}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="I.A." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas I.A.</SelectItem>
            {AI_TOOLS.filter(a => a !== "Todas").map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Nenhum prompt encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Card key={p.id} className="group hover:border-primary/40 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground leading-tight">{p.title}</h3>
                  <Badge className={`${catColor(p.category)} text-foreground shrink-0 text-[10px]`}>{p.category}</Badge>
                </div>
                {p.ai_tool && p.ai_tool !== "Todas" && <Badge variant="outline" className="text-[10px]">{p.ai_tool}</Badge>}
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <pre className="text-xs bg-muted/50 rounded-lg p-3 max-h-32 overflow-auto whitespace-pre-wrap text-muted-foreground">{p.content}</pre>
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(p.content)} title="Copiar"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Prompt" : "Novo Prompt"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Descrição curta (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.ai_tool} onValueChange={v => setForm({ ...form, ai_tool: v })}>
              <SelectTrigger><SelectValue placeholder="I.A. relacionada" /></SelectTrigger>
              <SelectContent>{AI_TOOLS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Texto do prompt..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} />
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={!form.title.trim() || !form.content.trim()}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptsLibrary;
