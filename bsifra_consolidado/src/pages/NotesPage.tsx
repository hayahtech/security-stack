import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Pin, PinOff, Archive, ArchiveRestore, Trash2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const NOTE_COLORS: { value: string; label: string; bg: string; border: string }[] = [
  { value: "default", label: "Padrão", bg: "bg-card", border: "border-border" },
  { value: "cyan", label: "Cyan", bg: "bg-[hsl(187_100%_45%/0.1)]", border: "border-[hsl(var(--neon-cyan)/0.4)]" },
  { value: "yellow", label: "Amarelo", bg: "bg-[hsl(45_100%_55%/0.1)]", border: "border-[hsl(var(--neon-yellow)/0.4)]" },
  { value: "green", label: "Verde", bg: "bg-[hsl(145_70%_45%/0.1)]", border: "border-[hsl(var(--neon-green)/0.4)]" },
  { value: "red", label: "Vermelho", bg: "bg-[hsl(350_85%_55%/0.1)]", border: "border-[hsl(var(--neon-red)/0.4)]" },
  { value: "purple", label: "Roxo", bg: "bg-[hsl(270_70%_55%/0.1)]", border: "border-[hsl(var(--neon-purple)/0.3)]" },
];

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  archived: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const autoSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    setNotes((data as Note[]) || []);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createNote = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .insert({ user_id: user.id, title: "Nova nota", content: "" })
      .select()
      .single();
    if (data) {
      setNotes(prev => [data as Note, ...prev]);
    }
  };

  const updateNote = (id: string, field: "title" | "content" | "color", value: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
    // Auto-save debounce
    if (autoSaveTimers.current[id]) clearTimeout(autoSaveTimers.current[id]);
    autoSaveTimers.current[id] = setTimeout(async () => {
      await supabase.from("notes").update({ [field]: value }).eq("id", id).eq("user_id", user!.id);
    }, 800);
  };

  const togglePin = async (note: Note) => {
    await supabase.from("notes").update({ pinned: !note.pinned }).eq("id", note.id).eq("user_id", user!.id);
    fetchData();
  };

  const toggleArchive = async (note: Note) => {
    await supabase.from("notes").update({ archived: !note.archived }).eq("id", note.id).eq("user_id", user!.id);
    toast({ title: note.archived ? "Nota restaurada" : "Nota arquivada" });
    fetchData();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id).eq("user_id", user!.id);
    toast({ title: "Nota excluída" });
    fetchData();
  };

  const getColor = (c: string) => NOTE_COLORS.find(nc => nc.value === c) || NOTE_COLORS[0];

  const filtered = notes.filter(n => {
    if (n.archived !== showArchived) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Notas Rápidas</h1>
        <div className="flex gap-2">
          <Button variant={showArchived ? "secondary" : "outline"} size="sm" onClick={() => setShowArchived(!showArchived)} className="gap-2">
            <Archive className="h-4 w-4" />{showArchived ? "Arquivadas" : "Arquivo"}
          </Button>
          <Button onClick={createNote} className="gap-2"><Plus className="h-4 w-4" />Nova Nota</Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar notas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1"><Pin className="h-3 w-3" />Fixadas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {pinned.map(n => <NoteCard key={n.id} note={n} getColor={getColor} updateNote={updateNote} togglePin={togglePin} toggleArchive={toggleArchive} deleteNote={deleteNote} />)}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Outras</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {unpinned.map(n => <NoteCard key={n.id} note={n} getColor={getColor} updateNote={updateNote} togglePin={togglePin} toggleArchive={toggleArchive} deleteNote={deleteNote} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {showArchived ? "Nenhuma nota arquivada." : "Nenhuma nota encontrada. Crie uma!"}
        </div>
      )}
    </div>
  );
};

const NoteCard = ({
  note, getColor, updateNote, togglePin, toggleArchive, deleteNote,
}: {
  note: Note;
  getColor: (c: string) => typeof NOTE_COLORS[0];
  updateNote: (id: string, field: "title" | "content" | "color", value: string) => void;
  togglePin: (n: Note) => void;
  toggleArchive: (n: Note) => void;
  deleteNote: (id: string) => void;
}) => {
  const color = getColor(note.color);

  return (
    <div className={cn("rounded-lg border p-4 space-y-2 transition-all hover:shadow-md", color.bg, color.border)}>
      <input
        className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        value={note.title}
        onChange={e => updateNote(note.id, "title", e.target.value)}
        placeholder="Título..."
      />
      <textarea
        className="w-full bg-transparent text-sm text-foreground/90 outline-none resize-none min-h-[80px] placeholder:text-muted-foreground"
        value={note.content}
        onChange={e => updateNote(note.id, "content", e.target.value)}
        placeholder="Escreva aqui..."
        rows={4}
      />
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {NOTE_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => updateNote(note.id, "color", c.value)}
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                c.value === "default" ? "bg-card border-border" : `${c.bg} ${c.border}`,
                note.color === c.value && "ring-2 ring-primary ring-offset-1 ring-offset-background"
              )}
              title={c.label}
            />
          ))}
        </div>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(note)} title={note.pinned ? "Desafixar" : "Fixar"}>
            {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleArchive(note)} title={note.archived ? "Restaurar" : "Arquivar"}>
            {note.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNote(note.id)} title="Excluir">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">{format(new Date(note.updated_at), "dd/MM/yyyy HH:mm")}</p>
    </div>
  );
};

export default NotesPage;
