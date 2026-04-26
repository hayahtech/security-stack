import { useState } from "react";
import { produtos as initialProdutos, type Produto } from "@/lib/mockData";
import { Search, Plus, Eye, Pencil, Trash2, Package, LayoutGrid, List, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<(Produto & { fotoFrente?: string })[]>(initialProdutos);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todos");
  const [selected, setSelected] = useState<(Produto & { fotoFrente?: string }) | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", categoria: "Ração" as Produto["categoria"], preco: "", estoque: "", fotoFrente: "", fotoBarcode: "" });

  const categorias = ["Todos", "Ração", "Brinquedo", "Acessório", "Higiene"];

  const filtered = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Todos" || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const handleFileRead = (file: File, field: "fotoFrente" | "fotoBarcode") => {
    const reader = new FileReader();
    reader.onload = () => setNewForm(f => ({ ...f, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleNewSubmit = () => {
    if (!newForm.nome.trim()) { toast.error("Informe o nome"); return; }
    if (!newForm.preco) { toast.error("Informe o preço"); return; }
    const novo: Produto & { fotoFrente?: string } = {
      id: `prod-${Date.now()}`,
      nome: newForm.nome,
      categoria: newForm.categoria,
      preco: Number(newForm.preco),
      estoque: Number(newForm.estoque) || 0,
      foto: newForm.fotoBarcode || "",
      fotoFrente: newForm.fotoFrente || "",
    };
    setProdutos(prev => [novo, ...prev]);
    setShowNew(false);
    setNewForm({ nome: "", categoria: "Ração", preco: "", estoque: "", fotoFrente: "", fotoBarcode: "" });
    toast.success("Produto cadastrado!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categorias.map(c => (
            <Button key={c} variant={catFilter === c ? "default" : "outline"} size="sm" onClick={() => setCatFilter(c)} className="text-xs">{c}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />Novo Produto</Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} produtos</p>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className="bg-card rounded-xl border border-border shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
              {(p as any).fotoFrente ? (
                <div className="w-full h-40 overflow-hidden">
                  <img src={(p as any).fotoFrente} alt={p.nome} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="p-4">
                <p className="font-medium text-foreground">{p.nome}</p>
                <p className="text-xs text-muted-foreground mb-2">{p.categoria}</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground">R$ {p.preco.toFixed(2)}</p>
                  <span className={`text-xs font-semibold ${p.estoque < 10 ? "text-destructive" : "text-muted-foreground"}`}>{p.estoque} un.</span>
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preço</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estoque</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="data-table-row" onClick={() => setSelected(p)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.categoria}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">R$ {p.preco.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={p.estoque < 10 ? "text-destructive font-semibold" : "text-foreground"}>{p.estoque} un.</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-md hover:bg-muted" onClick={e => { e.stopPropagation(); setSelected(p); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
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
          <DialogHeader><DialogTitle className="font-heading">Detalhes do Produto</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Nome</p><p className="font-medium text-foreground">{selected.nome}</p></div>
                <div><p className="text-muted-foreground">Categoria</p><p className="font-medium text-foreground">{selected.categoria}</p></div>
                <div><p className="text-muted-foreground">Preço</p><p className="font-bold text-lg text-foreground">R$ {selected.preco.toFixed(2)}</p></div>
                <div><p className="text-muted-foreground">Estoque</p><p className={`font-medium ${selected.estoque < 10 ? "text-destructive" : "text-foreground"}`}>{selected.estoque} unidades</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={newForm.nome} onChange={e => setNewForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do produto" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newForm.categoria} onValueChange={v => setNewForm(f => ({ ...f, categoria: v as Produto["categoria"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Ração", "Brinquedo", "Acessório", "Higiene"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input type="number" value={newForm.preco} onChange={e => setNewForm(f => ({ ...f, preco: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input type="number" value={newForm.estoque} onChange={e => setNewForm(f => ({ ...f, estoque: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Foto Frente</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" id="prod-foto-frente" onChange={e => { if (e.target.files?.[0]) handleFileRead(e.target.files[0], "fotoFrente"); }} />
                  <label htmlFor="prod-foto-frente" className="cursor-pointer flex flex-col items-center gap-1.5">
                    {newForm.fotoFrente ? (
                      <img src={newForm.fotoFrente} alt="Frente" className="w-full h-20 object-cover rounded" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Frente do produto</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" id="prod-foto-barcode" onChange={e => { if (e.target.files?.[0]) handleFileRead(e.target.files[0], "fotoBarcode"); }} />
                  <label htmlFor="prod-foto-barcode" className="cursor-pointer flex flex-col items-center gap-1.5">
                    {newForm.fotoBarcode ? (
                      <img src={newForm.fotoBarcode} alt="Código" className="w-full h-20 object-cover rounded" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Código de barras</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleNewSubmit}>Cadastrar Produto</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
