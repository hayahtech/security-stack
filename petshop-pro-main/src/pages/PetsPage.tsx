import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pets as initialPets, clientes, type Pet } from "@/lib/mockData";
import { Search, Plus, Eye, Pencil, Trash2, LayoutGrid, List, Camera, ArrowDownAZ, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function PetsPage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState(initialPets);
  const [search, setSearch] = useState("");
  const [porteFilter, setPorteFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", raca: "", idade: "", porte: "Médio" as Pet["porte"], clienteId: "" });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent");

  const filtered = pets.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.raca.toLowerCase().includes(search.toLowerCase()) ||
      p.clienteNome.toLowerCase().includes(search.toLowerCase());
    const matchPorte = porteFilter === "Todos" || p.porte === porteFilter;
    return matchSearch && matchPorte;
  }).sort((a, b) => {
    if (sortMode === "az") return a.nome.localeCompare(b.nome);
    return 0; // recent = insertion order
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNewSubmit = () => {
    if (!newForm.nome.trim()) { toast.error("Informe o nome"); return; }
    const cliente = clientes.find(c => c.id === newForm.clienteId);
    if (!cliente) { toast.error("Selecione o dono"); return; }
    const novo: Pet = {
      id: `pet-${Date.now()}`,
      nome: newForm.nome,
      raca: newForm.raca,
      idade: Number(newForm.idade) || 1,
      porte: newForm.porte,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      foto: photoPreview || `https://placedog.net/300/300?id=${Date.now()}`,
    };
    setPets(prev => [novo, ...prev]);
    setShowNew(false);
    setNewForm({ nome: "", raca: "", idade: "", porte: "Médio", clienteId: "" });
    setPhotoPreview(null);
    toast.success("Pet cadastrado!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar pet, raça ou dono..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["Todos", "Pequeno", "Médio", "Grande"].map(p => (
            <Button key={p} variant={porteFilter === p ? "default" : "outline"} size="sm" onClick={() => setPorteFilter(p)} className="text-xs">{p}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant={sortMode === "az" ? "default" : "outline"} size="sm" onClick={() => setSortMode("az")} className="gap-1"><ArrowDownAZ className="w-4 h-4" />A-Z</Button>
          <Button variant={sortMode === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortMode("recent")} className="gap-1"><Clock className="w-4 h-4" />Recentes</Button>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />Novo Pet</Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} pets encontrados</p>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} onClick={() => navigate(`/pets/${p.id}`)} className="bg-card rounded-xl border border-border shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center">
                <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground font-heading">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.raca} • {p.porte}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.idade} {p.idade === 1 ? "ano" : "anos"} • Dono: {p.clienteNome}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 rounded-md hover:bg-muted" onClick={e => { e.stopPropagation(); navigate(`/pets/${p.id}`); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1 rounded-md hover:bg-destructive/10" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pet</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Raça</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Porte</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Idade</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Dono</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="data-table-row cursor-pointer" onClick={() => navigate(`/pets/${p.id}`)}>
                    <td className="px-4 py-3 font-medium text-foreground">{p.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.raca}</td>
                    <td className="px-4 py-3 text-foreground">{p.porte}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.idade} {p.idade === 1 ? "ano" : "anos"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.clienteNome}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => { e.stopPropagation(); navigate(`/pets/${p.id}`); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => e.stopPropagation()}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-md hover:bg-destructive/10" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Pet dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Pet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="space-y-2">
              <Label>Foto do Pet</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input type="file" accept="image/*" className="hidden" id="pet-photo-input" onChange={handlePhotoChange} />
                <label htmlFor="pet-photo-input" className="cursor-pointer flex flex-col items-center gap-2">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para adicionar foto</span>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-2"><Label>Nome</Label><Input value={newForm.nome} onChange={e => setNewForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do pet" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Raça</Label><Input value={newForm.raca} onChange={e => setNewForm(f => ({ ...f, raca: e.target.value }))} placeholder="Ex: Labrador" /></div>
              <div className="space-y-2"><Label>Idade</Label><Input type="number" value={newForm.idade} onChange={e => setNewForm(f => ({ ...f, idade: e.target.value }))} placeholder="Anos" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Porte</Label>
                <Select value={newForm.porte} onValueChange={v => setNewForm(f => ({ ...f, porte: v as Pet["porte"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Pequeno", "Médio", "Grande"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dono</Label>
                <Select value={newForm.clienteId} onValueChange={v => setNewForm(f => ({ ...f, clienteId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleNewSubmit}>Cadastrar Pet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
