import { useState } from "react";
import { vendas as initialVendas, clientes, produtos, type Venda } from "@/lib/mockData";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function VendasPage() {
  const [vendas, setVendas] = useState(initialVendas);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Venda | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ clienteNome: "", itens: "", total: "", tipo: "Produto" as Venda["tipo"], status: "Pendente" as Venda["status"] });

  const filtered = vendas.filter(v => {
    const matchSearch = v.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      v.itens.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalFiltrado = filtered.reduce((s, v) => s + v.total, 0);

  const handleNewSubmit = () => {
    if (!newForm.clienteNome) { toast.error("Selecione o cliente"); return; }
    if (!newForm.itens.trim()) { toast.error("Informe os itens"); return; }
    if (!newForm.total) { toast.error("Informe o total"); return; }
    const novo: Venda = {
      id: `v-${Date.now()}`,
      clienteNome: newForm.clienteNome,
      itens: newForm.itens,
      total: Number(newForm.total),
      data: new Date().toISOString().split("T")[0],
      tipo: newForm.tipo,
      status: newForm.status,
    };
    setVendas(prev => [novo, ...prev]);
    setShowNew(false);
    setNewForm({ clienteNome: "", itens: "", total: "", tipo: "Produto", status: "Pendente" });
    toast.success("Venda registrada!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["Todos", "Pago", "Pendente", "Cancelado"].map(s => (
            <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="text-xs">{s}</Button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />Nova Venda</Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} vendas • Total: <span className="font-semibold text-foreground">R$ {totalFiltrado.toFixed(2)}</span>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Itens</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="data-table-row" onClick={() => setSelected(v)}>
                  <td className="px-4 py-3 font-medium text-foreground">{v.clienteNome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">{v.itens}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">R$ {v.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{v.data}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors" onClick={e => { e.stopPropagation(); setSelected(v); }}><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 rounded-md hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Detalhes da Venda</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Cliente</p><p className="font-medium text-foreground">{selected.clienteNome}</p></div>
                <div><p className="text-muted-foreground">Data</p><p className="font-medium text-foreground">{selected.data}</p></div>
                <div><p className="text-muted-foreground">Tipo</p><p className="font-medium text-foreground">{selected.tipo}</p></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={selected.status} /></div>
              </div>
              <div><p className="text-muted-foreground">Itens</p><p className="font-medium text-foreground">{selected.itens}</p></div>
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground">Total</p>
                <p className="text-xl font-bold font-heading text-foreground">R$ {selected.total.toFixed(2)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Nova Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={newForm.clienteNome} onValueChange={v => setNewForm(f => ({ ...f, clienteNome: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Itens</Label><Input value={newForm.itens} onChange={e => setNewForm(f => ({ ...f, itens: e.target.value }))} placeholder="Ex: Ração Royal Canin + Banho" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total (R$)</Label>
                <Input type="number" value={newForm.total} onChange={e => setNewForm(f => ({ ...f, total: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newForm.tipo} onValueChange={v => setNewForm(f => ({ ...f, tipo: v as Venda["tipo"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Produto", "Serviço", "Misto"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newForm.status} onValueChange={v => setNewForm(f => ({ ...f, status: v as Venda["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Pendente", "Pago", "Cancelado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleNewSubmit}>Registrar Venda</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
