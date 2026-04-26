import { useState } from "react";
import { clientes as initialClientes, type Cliente } from "@/lib/mockData";
import { Search, Plus, Eye, Pencil, Trash2, Phone, Mail, MapPin, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ClientesPage() {
  const [clientes, setClientes] = useState(initialClientes);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", email: "", telefone: "", endereco: "", petPreferido: "" });

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewSubmit = () => {
    if (!newForm.nome.trim()) { toast.error("Informe o nome"); return; }
    if (!newForm.email.trim()) { toast.error("Informe o email"); return; }
    const novo: Cliente = { id: `cli-${Date.now()}`, ...newForm };
    setClientes(prev => [novo, ...prev]);
    setShowNew(false);
    setNewForm({ nome: "", email: "", telefone: "", endereco: "", petPreferido: "" });
    toast.success("Cliente cadastrado!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />Novo Cliente</Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} clientes encontrados</p>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className="bg-card rounded-xl border border-border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {c.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.telefone}</p>
                </div>
                <div className="ml-auto flex gap-1 shrink-0">
                  <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => { e.stopPropagation(); setSelected(c); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => e.stopPropagation()}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded-md hover:bg-destructive/10" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Pet Preferido</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="data-table-row" onClick={() => setSelected(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {c.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.telefone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.petPreferido}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => { e.stopPropagation(); setSelected(c); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
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

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Detalhes do Cliente</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selected.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg font-heading">{selected.nome}</p>
                  <p className="text-sm text-muted-foreground">Pet preferido: {selected.petPreferido}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{selected.email}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{selected.telefone}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{selected.endereco}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={newForm.nome} onChange={e => setNewForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telefone</Label><Input value={newForm.telefone} onChange={e => setNewForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
              <div className="space-y-2"><Label>Pet Preferido</Label><Input value={newForm.petPreferido} onChange={e => setNewForm(f => ({ ...f, petPreferido: e.target.value }))} placeholder="Raça favorita" /></div>
            </div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={newForm.endereco} onChange={e => setNewForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número" /></div>
            <Button className="w-full" onClick={handleNewSubmit}>Cadastrar Cliente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
