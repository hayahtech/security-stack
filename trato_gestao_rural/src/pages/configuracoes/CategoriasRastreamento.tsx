import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Settings, ChevronRight, ChevronDown, Plus, GripVertical, Trash2, Search, Tag, X } from "lucide-react";
import {
  type CategoryItem, type SubcategoryItem,
  defaultPersonalCategories, defaultBusinessCategories,
  CATEGORY_COLORS, CATEGORY_EMOJIS,
} from "@/data/categories-data";

// ─── Keyword Chips ───
function KeywordChips({ keywords, onChange }: { keywords: string[]; onChange: (kw: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim().toLowerCase();
    if (val && !keywords.includes(val)) { onChange([...keywords, val]); }
    setInput("");
  };
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {keywords.map((kw, i) => (
          <Badge key={i} variant="outline" className="text-[10px] gap-1 pr-1">
            {kw}
            <button onClick={() => onChange(keywords.filter((_, idx) => idx !== i))} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Palavra-chave..." className="h-7 text-xs max-w-[160px]" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={add}><Plus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

// ─── Color Picker ───
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)} className={cn("h-6 w-6 rounded-full border-2 transition-all", value === c ? "border-foreground scale-110" : "border-transparent")} style={{ background: c }} />
      ))}
    </div>
  );
}

// ─── Emoji Picker ───
function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-xl hover:scale-110 transition-transform">{value}</button>
      {open && (
        <div className="absolute z-50 top-8 left-0 bg-popover border border-border rounded-lg p-2 shadow-lg grid grid-cols-6 gap-1 w-[200px]">
          {CATEGORY_EMOJIS.map(e => (
            <button key={e} onClick={() => { onChange(e); setOpen(false); }} className="text-lg hover:bg-muted rounded p-1">{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Subcategory Row ───
function SubcategoryRow({ sub, onToggle, onUpdateKeywords }: { sub: SubcategoryItem; onToggle: () => void; onUpdateKeywords: (kw: string[]) => void }) {
  return (
    <div className="flex items-start gap-3 py-2 pl-10 border-b border-border/30 last:border-0">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 cursor-grab shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{sub.name}</span>
          {sub.transactionCount > 0 && <Badge variant="secondary" className="text-[10px]">{sub.transactionCount} txns</Badge>}
        </div>
        <KeywordChips keywords={sub.keywords} onChange={onUpdateKeywords} />
      </div>
      <Switch checked={sub.active} onCheckedChange={onToggle} />
    </div>
  );
}

// ─── Category Tree Item ───
function CategoryTreeItem({ cat, onUpdate, onAddSub }: {
  cat: CategoryItem;
  onUpdate: (updated: CategoryItem) => void;
  onAddSub: () => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleActive = () => {
    if (cat.active && cat.transactionCount > 0) {
      toast({ title: "Categoria inativada", description: `"${cat.name}" foi inativada. Transações existentes mantidas.` });
    }
    onUpdate({ ...cat, active: !cat.active });
  };

  const toggleSubActive = (subIdx: number) => {
    const sub = cat.subcategories[subIdx];
    if (sub.active && sub.transactionCount > 0) {
      toast({ title: "Subcategoria inativada", description: `"${sub.name}" foi inativada.` });
    }
    const updated = [...cat.subcategories];
    updated[subIdx] = { ...sub, active: !sub.active };
    onUpdate({ ...cat, subcategories: updated });
  };

  const updateSubKeywords = (subIdx: number, kw: string[]) => {
    const updated = [...cat.subcategories];
    updated[subIdx] = { ...updated[subIdx], keywords: kw };
    onUpdate({ ...cat, subcategories: updated });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("border border-border rounded-lg overflow-hidden", !cat.active && "opacity-60")}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
            <EmojiPicker value={cat.emoji} onChange={e => onUpdate({ ...cat, emoji: e })} />
            <div className="h-4 w-4 rounded-full shrink-0" style={{ background: cat.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">{cat.name}</span>
                <Badge variant="outline" className="text-[10px]">{cat.domain === "pessoal" ? "Pessoal" : cat.domain === "empresarial" ? "Empresarial" : "Ambos"}</Badge>
                <Badge variant="secondary" className="text-[10px]">{cat.subcategories.length} sub</Badge>
                {cat.transactionCount > 0 && <Badge variant="secondary" className="text-[10px]">{cat.transactionCount} txns</Badge>}
              </div>
            </div>
            <Switch checked={cat.active} onCheckedChange={toggleActive} onClick={e => e.stopPropagation()} />
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border bg-muted/20">
            {/* Category config */}
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cor</Label>
                  <ColorPicker value={cat.color} onChange={c => onUpdate({ ...cat, color: c })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Domínio</Label>
                  <Select value={cat.domain} onValueChange={v => onUpdate({ ...cat, domain: v as CategoryItem["domain"] })}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pessoal">Pessoal</SelectItem>
                      <SelectItem value="empresarial">Empresarial</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Palavras-chave da categoria</Label>
                <KeywordChips keywords={cat.keywords} onChange={kw => onUpdate({ ...cat, keywords: kw })} />
              </div>
            </div>
            <Separator />
            {/* Subcategories */}
            {cat.subcategories.map((sub, i) => (
              <SubcategoryRow key={sub.id} sub={sub} onToggle={() => toggleSubActive(i)} onUpdateKeywords={kw => updateSubKeywords(i, kw)} />
            ))}
            <div className="p-2 pl-10">
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={onAddSub}>
                <Plus className="h-3 w-3" /> Nova subcategoria
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── Main Component ───
export default function CategoriasRastreamento() {
  const { isEmpresarial } = useProfile();
  const [personalCats, setPersonalCats] = useState(defaultPersonalCategories);
  const [businessCats, setBusinessCats] = useState(defaultBusinessCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [addSubParentId, setAddSubParentId] = useState("");

  // Add category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📋");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [newCatDomain, setNewCatDomain] = useState<CategoryItem["domain"]>("pessoal");

  // Add sub form
  const [newSubName, setNewSubName] = useState("");

  const activeTab = isEmpresarial ? "empresarial" : "pessoal";

  const filteredPersonal = useMemo(() => {
    if (!searchTerm) return personalCats;
    const q = searchTerm.toLowerCase();
    return personalCats.filter(c => c.name.toLowerCase().includes(q) || c.subcategories.some(s => s.name.toLowerCase().includes(q)));
  }, [personalCats, searchTerm]);

  const filteredBusiness = useMemo(() => {
    if (!searchTerm) return businessCats;
    const q = searchTerm.toLowerCase();
    return businessCats.filter(c => c.name.toLowerCase().includes(q) || c.subcategories.some(s => s.name.toLowerCase().includes(q)));
  }, [businessCats, searchTerm]);

  const updatePersonalCat = (id: string, updated: CategoryItem) => {
    setPersonalCats(prev => prev.map(c => c.id === id ? updated : c));
  };

  const updateBusinessCat = (id: string, updated: CategoryItem) => {
    setBusinessCats(prev => prev.map(c => c.id === id ? updated : c));
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: CategoryItem = {
      id: `c_${Date.now()}`, name: newCatName.trim(), emoji: newCatEmoji, color: newCatColor,
      domain: newCatDomain, keywords: [], active: true, order: 99, transactionCount: 0, subcategories: [],
    };
    if (newCatDomain === "pessoal" || newCatDomain === "ambos") setPersonalCats(prev => [...prev, newCat]);
    if (newCatDomain === "empresarial" || newCatDomain === "ambos") setBusinessCats(prev => [...prev, newCat]);
    setShowAddCategory(false);
    setNewCatName("");
    toast({ title: "Categoria criada", description: newCatName.trim() });
  };

  const handleAddSub = () => {
    if (!newSubName.trim()) return;
    const newSub: SubcategoryItem = { id: `s_${Date.now()}`, name: newSubName.trim(), keywords: [], active: true, order: 99, transactionCount: 0 };
    setPersonalCats(prev => prev.map(c => c.id === addSubParentId ? { ...c, subcategories: [...c.subcategories, newSub] } : c));
    setBusinessCats(prev => prev.map(c => c.id === addSubParentId ? { ...c, subcategories: [...c.subcategories, newSub] } : c));
    setShowAddSub(false);
    setNewSubName("");
    toast({ title: "Subcategoria adicionada" });
  };

  const openAddSub = (parentId: string) => {
    setAddSubParentId(parentId);
    setShowAddSub(true);
  };

  // Stats
  const allCats = isEmpresarial ? businessCats : personalCats;
  const totalActive = allCats.filter(c => c.active).length;
  const totalSubs = allCats.reduce((s, c) => s + c.subcategories.length, 0);
  const totalInactive = allCats.filter(c => !c.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" /> Categorias & Rastreamento
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie categorias, subcategorias e palavras-chave para categorização automática</p>
        </div>
        <Button onClick={() => setShowAddCategory(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-foreground">{totalActive}</p>
          <p className="text-xs text-muted-foreground">Categorias ativas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-foreground">{totalSubs}</p>
          <p className="text-xs text-muted-foreground">Subcategorias</p>
        </CardContent></Card>
        <Card><CardContent className="pt-5 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{totalInactive}</p>
          <p className="text-xs text-muted-foreground">Inativas</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar categorias ou subcategorias..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pessoal">🏠 Pessoal ({filteredPersonal.length})</TabsTrigger>
          <TabsTrigger value="empresarial">🏢 Empresarial ({filteredBusiness.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoal" className="space-y-3">
          {filteredPersonal.map(cat => (
            <CategoryTreeItem key={cat.id} cat={cat} onUpdate={updated => updatePersonalCat(cat.id, updated)} onAddSub={() => openAddSub(cat.id)} />
          ))}
          {filteredPersonal.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma categoria encontrada.</p>}
        </TabsContent>

        <TabsContent value="empresarial" className="space-y-3">
          {filteredBusiness.map(cat => (
            <CategoryTreeItem key={cat.id} cat={cat} onUpdate={updated => updateBusinessCat(cat.id, updated)} onAddSub={() => openAddSub(cat.id)} />
          ))}
          {filteredBusiness.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma categoria encontrada.</p>}
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="mt-1" placeholder="Ex: Assinaturas" /></div>
            <div className="flex gap-6">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Ícone</Label>
                <EmojiPicker value={newCatEmoji} onChange={setNewCatEmoji} />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-muted-foreground">Cor</Label>
                <ColorPicker value={newCatColor} onChange={setNewCatColor} />
              </div>
            </div>
            <div>
              <Label>Domínio</Label>
              <Select value={newCatDomain} onValueChange={v => setNewCatDomain(v as CategoryItem["domain"])}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancelar</Button>
            <Button onClick={handleAddCategory}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Subcategoria</DialogTitle></DialogHeader>
          <div><Label>Nome</Label><Input value={newSubName} onChange={e => setNewSubName(e.target.value)} className="mt-1" placeholder="Ex: Assinatura de software" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSub(false)}>Cancelar</Button>
            <Button onClick={handleAddSub}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
