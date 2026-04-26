import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Package, Layers, BarChart3, ArrowDownAZ, Clock, LayoutGrid, List, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";

interface GrupoItem {
  id: string;
  nome: string;
  descricao: string;
}

interface ItemEstoque {
  id: string;
  nome: string;
  sku: string;
  grupoId: string;
  grupoNome: string;
  quantidade: number;
  estoqueMinimo: number;
  precoCusto: number;
  precoVenda: number;
  unidade: string;
  localizacao: string;
  status: "Normal" | "Baixo" | "Crítico" | "Esgotado";
  ultimaEntrada: string;
}

const gruposIniciais: GrupoItem[] = [
  { id: "grp-1", nome: "Rações", descricao: "Rações para cães e gatos" },
  { id: "grp-2", nome: "Medicamentos", descricao: "Medicamentos e vacinas" },
  { id: "grp-3", nome: "Higiene", descricao: "Produtos de higiene e limpeza" },
  { id: "grp-4", nome: "Acessórios", descricao: "Coleiras, camas, comedouros" },
  { id: "grp-5", nome: "Brinquedos", descricao: "Brinquedos variados" },
];

const today = new Date().toISOString().split("T")[0];

const itensIniciais: ItemEstoque[] = [
  { id: "est-1", nome: "Ração Royal Canin Mini 3kg", sku: "RAC-RC-MINI-3K", grupoId: "grp-1", grupoNome: "Rações", quantidade: 45, estoqueMinimo: 10, precoCusto: 120, precoVenda: 189.90, unidade: "un", localizacao: "Prateleira A1", status: "Normal", ultimaEntrada: today },
  { id: "est-2", nome: "Ração Golden Premium 15kg", sku: "RAC-GP-15K", grupoId: "grp-1", grupoNome: "Rações", quantidade: 8, estoqueMinimo: 10, precoCusto: 85, precoVenda: 129.90, unidade: "un", localizacao: "Prateleira A2", status: "Baixo", ultimaEntrada: today },
  { id: "est-3", nome: "Vacina V10", sku: "MED-VAC-V10", grupoId: "grp-2", grupoNome: "Medicamentos", quantidade: 30, estoqueMinimo: 5, precoCusto: 45, precoVenda: 120, unidade: "dose", localizacao: "Refrigerador 1", status: "Normal", ultimaEntrada: today },
  { id: "est-4", nome: "Vermífugo Drontal Plus", sku: "MED-VERM-DP", grupoId: "grp-2", grupoNome: "Medicamentos", quantidade: 3, estoqueMinimo: 10, precoCusto: 18, precoVenda: 35.90, unidade: "comp", localizacao: "Gaveta M1", status: "Crítico", ultimaEntrada: today },
  { id: "est-5", nome: "Shampoo Neutro 500ml", sku: "HIG-SH-N500", grupoId: "grp-3", grupoNome: "Higiene", quantidade: 90, estoqueMinimo: 15, precoCusto: 12, precoVenda: 29.90, unidade: "un", localizacao: "Prateleira B1", status: "Normal", ultimaEntrada: today },
  { id: "est-6", nome: "Condicionador Pet 300ml", sku: "HIG-CD-P300", grupoId: "grp-3", grupoNome: "Higiene", quantidade: 0, estoqueMinimo: 10, precoCusto: 10, precoVenda: 24.90, unidade: "un", localizacao: "Prateleira B1", status: "Esgotado", ultimaEntrada: today },
  { id: "est-7", nome: "Coleira Ajustável P", sku: "ACE-COL-P", grupoId: "grp-4", grupoNome: "Acessórios", quantidade: 40, estoqueMinimo: 8, precoCusto: 15, precoVenda: 34.90, unidade: "un", localizacao: "Prateleira C1", status: "Normal", ultimaEntrada: today },
  { id: "est-8", nome: "Cama Pet Luxo M", sku: "ACE-CAM-LM", grupoId: "grp-4", grupoNome: "Acessórios", quantidade: 5, estoqueMinimo: 5, precoCusto: 75, precoVenda: 149.90, unidade: "un", localizacao: "Prateleira C3", status: "Baixo", ultimaEntrada: today },
  { id: "est-9", nome: "Bolinha de Borracha", sku: "BRI-BOL-BOR", grupoId: "grp-5", grupoNome: "Brinquedos", quantidade: 100, estoqueMinimo: 20, precoCusto: 5, precoVenda: 19.90, unidade: "un", localizacao: "Cesto D1", status: "Normal", ultimaEntrada: today },
  { id: "est-10", nome: "Osso de Nylon G", sku: "BRI-OSS-NG", grupoId: "grp-5", grupoNome: "Brinquedos", quantidade: 2, estoqueMinimo: 10, precoCusto: 8, precoVenda: 24.90, unidade: "un", localizacao: "Cesto D2", status: "Crítico", ultimaEntrada: today },
];

function getStatusForQty(qty: number, min: number): ItemEstoque["status"] {
  if (qty === 0) return "Esgotado";
  if (qty <= min * 0.3) return "Crítico";
  if (qty <= min) return "Baixo";
  return "Normal";
}

export default function EstoquePage() {
  const [itens, setItens] = useState(itensIniciais);
  const [grupos, setGrupos] = useState(gruposIniciais);
  const [search, setSearch] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [tab, setTab] = useState<"itens" | "grupos">("itens");

  // Dialogs
  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewGrupo, setShowNewGrupo] = useState(false);
  const [showEntrada, setShowEntrada] = useState(false);
  const [entradaItemId, setEntradaItemId] = useState("");

  // Forms
  const [itemForm, setItemForm] = useState({ nome: "", sku: "", grupoId: "", quantidade: "", estoqueMinimo: "10", precoCusto: "", precoVenda: "", unidade: "un", localizacao: "" });
  const [grupoForm, setGrupoForm] = useState({ nome: "", descricao: "" });
  const [entradaQty, setEntradaQty] = useState("");

  const filtered = itens.filter(i => {
    const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchGrupo = grupoFilter === "Todos" || i.grupoNome === grupoFilter;
    const matchStatus = statusFilter === "Todos" || i.status === statusFilter;
    return matchSearch && matchGrupo && matchStatus;
  }).sort((a, b) => sortMode === "az" ? a.nome.localeCompare(b.nome) : 0);

  const handleNewItem = () => {
    if (!itemForm.nome.trim() || !itemForm.sku.trim()) { toast.error("Preencha nome e SKU"); return; }
    const grupo = grupos.find(g => g.id === itemForm.grupoId);
    if (!grupo) { toast.error("Selecione um grupo"); return; }
    const qty = Number(itemForm.quantidade) || 0;
    const min = Number(itemForm.estoqueMinimo) || 10;
    const novo: ItemEstoque = {
      id: `est-${Date.now()}`,
      nome: itemForm.nome,
      sku: itemForm.sku.toUpperCase(),
      grupoId: grupo.id,
      grupoNome: grupo.nome,
      quantidade: qty,
      estoqueMinimo: min,
      precoCusto: Number(itemForm.precoCusto) || 0,
      precoVenda: Number(itemForm.precoVenda) || 0,
      unidade: itemForm.unidade,
      localizacao: itemForm.localizacao,
      status: getStatusForQty(qty, min),
      ultimaEntrada: today,
    };
    setItens(prev => [novo, ...prev]);
    setShowNewItem(false);
    setItemForm({ nome: "", sku: "", grupoId: "", quantidade: "", estoqueMinimo: "10", precoCusto: "", precoVenda: "", unidade: "un", localizacao: "" });
    toast.success("Item cadastrado!");
  };

  const handleNewGrupo = () => {
    if (!grupoForm.nome.trim()) { toast.error("Informe o nome do grupo"); return; }
    setGrupos(prev => [...prev, { id: `grp-${Date.now()}`, nome: grupoForm.nome, descricao: grupoForm.descricao }]);
    setShowNewGrupo(false);
    setGrupoForm({ nome: "", descricao: "" });
    toast.success("Grupo criado!");
  };

  const handleEntrada = () => {
    const qty = Number(entradaQty);
    if (!qty || qty <= 0) { toast.error("Informe uma quantidade válida"); return; }
    setItens(prev => prev.map(i => {
      if (i.id !== entradaItemId) return i;
      const newQty = i.quantidade + qty;
      return { ...i, quantidade: newQty, status: getStatusForQty(newQty, i.estoqueMinimo), ultimaEntrada: today };
    }));
    setShowEntrada(false);
    setEntradaQty("");
    toast.success(`Entrada de ${qty} unidades registrada!`);
  };

  const handleDelete = (id: string) => {
    setItens(prev => prev.filter(i => i.id !== id));
    toast.success("Item removido!");
  };

  const statusColor = (s: ItemEstoque["status"]) => {
    switch (s) {
      case "Normal": return "success";
      case "Baixo": return "warning";
      case "Crítico": return "error";
      case "Esgotado": return "error";
      default: return "default";
    }
  };

  // Summary stats
  const totalItens = itens.length;
  const totalUnidades = itens.reduce((s, i) => s + i.quantidade, 0);
  const itensBaixo = itens.filter(i => i.status === "Baixo" || i.status === "Crítico").length;
  const itensEsgotado = itens.filter(i => i.status === "Esgotado").length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Package className="w-4 h-4" />Total de Itens</div>
          <p className="text-2xl font-bold text-foreground">{totalItens}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Layers className="w-4 h-4" />Total Unidades</div>
          <p className="text-2xl font-bold text-foreground">{totalUnidades}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertTriangle className="w-4 h-4 text-warning-foreground" />Estoque Baixo</div>
          <p className="text-2xl font-bold text-warning-foreground">{itensBaixo}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><AlertTriangle className="w-4 h-4 text-destructive" />Esgotados</div>
          <p className="text-2xl font-bold text-destructive">{itensEsgotado}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button variant={tab === "itens" ? "default" : "ghost"} size="sm" onClick={() => setTab("itens")} className="gap-1.5"><Package className="w-4 h-4" />Itens</Button>
        <Button variant={tab === "grupos" ? "default" : "ghost"} size="sm" onClick={() => setTab("grupos")} className="gap-1.5"><Layers className="w-4 h-4" />Grupos</Button>
      </div>

      {tab === "itens" ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar item ou SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={grupoFilter} onValueChange={setGrupoFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos grupos</SelectItem>
                {grupos.map(g => <SelectItem key={g.id} value={g.nome}>{g.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos status</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Baixo">Baixo</SelectItem>
                <SelectItem value="Crítico">Crítico</SelectItem>
                <SelectItem value="Esgotado">Esgotado</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant={sortMode === "az" ? "default" : "outline"} size="sm" onClick={() => setSortMode("az")} className="gap-1"><ArrowDownAZ className="w-4 h-4" />A-Z</Button>
              <Button variant={sortMode === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortMode("recent")} className="gap-1"><Clock className="w-4 h-4" />Recentes</Button>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowNewItem(true)}><Plus className="w-4 h-4" />Novo Item</Button>
          </div>

          <p className="text-sm text-muted-foreground">{filtered.length} itens encontrados</p>

          {viewMode === "list" ? (
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Grupo</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Mín.</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Custo</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Venda</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.localizacao}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{item.grupoNome}</td>
                        <td className="px-4 py-3 text-center font-bold text-foreground">{item.quantidade} {item.unidade}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{item.estoqueMinimo}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">R$ {item.precoCusto.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">R$ {item.precoVenda.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => { setEntradaItemId(item.id); setShowEntrada(true); }}>
                              <Plus className="w-3 h-3" />Entrada
                            </Button>
                            <button className="p-1.5 rounded-md hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(item => (
                <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-foreground font-heading">{item.nome}</p>
                      <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Grupo</span><span className="text-foreground">{item.grupoNome}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Quantidade</span><span className="font-bold text-foreground">{item.quantidade} {item.unidade}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Mínimo</span><span className="text-foreground">{item.estoqueMinimo}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Preço Venda</span><span className="font-medium text-foreground">R$ {item.precoVenda.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Local</span><span className="text-foreground">{item.localizacao}</span></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={() => { setEntradaItemId(item.id); setShowEntrada(true); }}><Plus className="w-3 h-3" />Entrada</Button>
                    <button className="p-1.5 rounded-md hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Grupos tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{grupos.length} grupos</p>
            <Button size="sm" className="gap-1.5" onClick={() => setShowNewGrupo(true)}><Plus className="w-4 h-4" />Novo Grupo</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grupos.map(g => {
              const count = itens.filter(i => i.grupoId === g.id).length;
              const totalQty = itens.filter(i => i.grupoId === g.id).reduce((s, i) => s + i.quantidade, 0);
              return (
                <div key={g.id} className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-heading">{g.nome}</p>
                      <p className="text-xs text-muted-foreground">{g.descricao}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm mt-3">
                    <div><span className="text-muted-foreground">Itens: </span><span className="font-bold text-foreground">{count}</span></div>
                    <div><span className="text-muted-foreground">Unidades: </span><span className="font-bold text-foreground">{totalQty}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Item Dialog */}
      <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">Novo Item de Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={itemForm.nome} onChange={e => setItemForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do item" /></div>
              <div className="space-y-2"><Label>SKU</Label><Input value={itemForm.sku} onChange={e => setItemForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ex: RAC-RC-3K" className="font-mono uppercase" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={itemForm.grupoId} onValueChange={v => setItemForm(f => ({ ...f, grupoId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={itemForm.unidade} onValueChange={v => setItemForm(f => ({ ...f, unidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="ml">mL</SelectItem>
                    <SelectItem value="dose">Dose</SelectItem>
                    <SelectItem value="comp">Comprimido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={itemForm.quantidade} onChange={e => setItemForm(f => ({ ...f, quantidade: e.target.value }))} placeholder="0" /></div>
              <div className="space-y-2"><Label>Estoque Mín.</Label><Input type="number" value={itemForm.estoqueMinimo} onChange={e => setItemForm(f => ({ ...f, estoqueMinimo: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Localização</Label><Input value={itemForm.localizacao} onChange={e => setItemForm(f => ({ ...f, localizacao: e.target.value }))} placeholder="Prateleira A1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Preço Custo (R$)</Label><Input type="number" step="0.01" value={itemForm.precoCusto} onChange={e => setItemForm(f => ({ ...f, precoCusto: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Preço Venda (R$)</Label><Input type="number" step="0.01" value={itemForm.precoVenda} onChange={e => setItemForm(f => ({ ...f, precoVenda: e.target.value }))} /></div>
            </div>
            <Button className="w-full" onClick={handleNewItem}>Cadastrar Item</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={showNewGrupo} onOpenChange={setShowNewGrupo}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Novo Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome do Grupo</Label><Input value={grupoForm.nome} onChange={e => setGrupoForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Medicamentos" /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={grupoForm.descricao} onChange={e => setGrupoForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição breve" /></div>
            <Button className="w-full" onClick={handleNewGrupo}>Criar Grupo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entrada Dialog */}
      <Dialog open={showEntrada} onOpenChange={setShowEntrada}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Entrada de Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Item: <span className="font-medium text-foreground">{itens.find(i => i.id === entradaItemId)?.nome}</span></p>
            <p className="text-sm text-muted-foreground">Estoque atual: <span className="font-bold text-foreground">{itens.find(i => i.id === entradaItemId)?.quantidade}</span></p>
            <div className="space-y-2"><Label>Quantidade a adicionar</Label><Input type="number" value={entradaQty} onChange={e => setEntradaQty(e.target.value)} placeholder="0" /></div>
            <Button className="w-full" onClick={handleEntrada}>Registrar Entrada</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
