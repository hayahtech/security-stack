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

const LANGUAGES = ["Bash", "DAX", "Excel", "Go", "JavaScript", "Outro", "PHP", "Python", "Ruby", "Rust", "SQL", "TypeScript"];

interface Script {
  id: string;
  title: string;
  description: string | null;
  language: string;
  content: string;
  created_at: string;
}

const langColor = (lang: string) => {
  const map: Record<string, string> = {
    JavaScript: "bg-[hsl(var(--neon-yellow))]",
    TypeScript: "bg-[hsl(var(--neon-cyan))]",
    Python: "bg-[hsl(var(--neon-green))]",
    Bash: "bg-[hsl(var(--neon-orange))]",
    SQL: "bg-[hsl(var(--neon-purple))]",
    PHP: "bg-[hsl(var(--neon-red))]",
    Ruby: "bg-[hsl(var(--neon-red))]",
    Go: "bg-[hsl(var(--neon-cyan))]",
    Rust: "bg-[hsl(var(--neon-orange))]",
  };
  return map[lang] || "bg-primary";
};

const ScriptsLibrary = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Script | null>(null);
  const [form, setForm] = useState({ title: "", description: "", language: "JavaScript", content: "" });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase.from("scripts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data as Script[]) || []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", language: "JavaScript", content: "" }); setModalOpen(true); };
  const openEdit = (s: Script) => { setEditing(s); setForm({ title: s.title, description: s.description || "", language: s.language, content: s.content }); setModalOpen(true); };

  const { inputRef: fileRef, triggerImport, handleFileChange, acceptedExtensions } = useFileImport((content, fileName) => {
    const name = fileName.replace(/\.[^/.]+$/, "");
    setEditing(null);
    setForm({ title: name, description: "", language: "JavaScript", content });
    setModalOpen(true);
  });

  const handleSave = async () => {
    if (!user || !form.title.trim() || !form.content.trim()) return;
    if (editing) {
      await supabase.from("scripts").update({ title: form.title, description: form.description || null, language: form.language, content: form.content }).eq("id", editing.id).eq("user_id", user.id);
      toast({ title: "Script atualizado" });
    } else {
      await supabase.from("scripts").insert({ user_id: user.id, title: form.title, description: form.description || null, language: form.language, content: form.content });
      toast({ title: "Script adicionado" });
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("scripts").delete().eq("id", id).eq("user_id", user!.id);
    toast({ title: "Script excluído" });
    fetchData();
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: "Copiado!" }); };

  const filtered = items.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.description || "").toLowerCase().includes(search.toLowerCase());
    const matchLang = filterLang === "all" || s.language === filterLang;
    return matchSearch && matchLang;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Biblioteca de Scripts</h1>
        <div className="flex gap-2">
          <Button onClick={triggerImport} variant="outline" className="gap-2"><Upload className="h-4 w-4" />Importar</Button>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Novo Script</Button>
        </div>
        <input ref={fileRef} type="file" accept={acceptedExtensions} onChange={handleFileChange} className="hidden" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar scripts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Linguagem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Nenhum script encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="group hover:border-primary/40 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground leading-tight">{s.title}</h3>
                  <Badge className={`${langColor(s.language)} text-foreground shrink-0 text-[10px]`}>{s.language}</Badge>
                </div>
                {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                <div className="relative">
                  <pre className="text-xs bg-muted/50 rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-muted-foreground">{s.content}</pre>
                </div>
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(s.content)} title="Copiar"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Script" : "Novo Script"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Código do script..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} className="font-mono text-sm" />
          </div>
          <DialogFooter><Button onClick={handleSave} disabled={!form.title.trim() || !form.content.trim()}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScriptsLibrary;
