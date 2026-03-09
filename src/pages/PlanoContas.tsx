import { useState, useMemo, useCallback } from "react";
import { ChevronRight, ChevronDown, Plus, Edit2, Ban, Search, Download, Upload, FileSpreadsheet, BookOpen, Activity, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { chartOfAccountsData, accountTemplates, flattenAccounts, type ChartAccount, type AccountType, type AccountNature } from "@/mock/chartOfAccountsData";

const typeLabels: Record<AccountType, string> = {
  ativo: "Ativo", passivo: "Passivo", patrimonio: "Patrimônio", receita: "Receita", custo: "Custo", despesa: "Despesa",
};

const typeColors: Record<AccountType, string> = {
  ativo: "bg-emerald-500/20 text-emerald-400",
  passivo: "bg-rose-500/20 text-rose-400",
  patrimonio: "bg-violet-500/20 text-violet-400",
  receita: "bg-cyan-500/20 text-cyan-400",
  custo: "bg-amber-500/20 text-amber-400",
  despesa: "bg-orange-500/20 text-orange-400",
};

interface AccountNodeProps {
  account: ChartAccount;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  searchTerm: string;
  onEdit: (account: ChartAccount) => void;
  onToggleActive: (account: ChartAccount) => void;
  onAddChild: (parentId: string) => void;
}

function AccountNode({ account, expanded, toggleExpand, searchTerm, onEdit, onToggleActive, onAddChild }: AccountNodeProps) {
  const isExpanded = expanded.has(account.id);
  const hasChildren = account.children && account.children.length > 0;
  const isHighlighted = searchTerm && account.name.toLowerCase().includes(searchTerm.toLowerCase());
  const indentPx = (account.level - 1) * 28;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 hover:bg-muted/50 ${
          isHighlighted ? "bg-primary/10 ring-1 ring-primary/30" : ""
        } ${!account.active ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${indentPx + 12}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => hasChildren && toggleExpand(account.id)}
          className={`w-5 h-5 flex items-center justify-center rounded transition-transform duration-200 ${
            hasChildren ? "hover:bg-muted cursor-pointer" : "invisible"
          }`}
        >
          {hasChildren && (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Activity indicator */}
        {account.hasEntries ? (
          <Activity className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
        )}

        {/* Code */}
        <span className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">{account.code}</span>

        {/* Name */}
        <span className={`text-sm flex-1 truncate ${account.level === 1 ? "font-bold text-foreground" : account.level === 2 ? "font-semibold text-foreground" : "text-foreground/90"}`}>
          {account.name}
        </span>

        {/* Type badge */}
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[account.type]}`}>
          {typeLabels[account.type]}
        </Badge>

        {/* Nature badge */}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {account.nature === "devedora" ? "D" : "C"}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddChild(account.id)} className="p-1 rounded hover:bg-muted" title="Adicionar subconta">
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onEdit(account)} className="p-1 rounded hover:bg-muted" title="Editar">
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onToggleActive(account)} className="p-1 rounded hover:bg-muted" title={account.active ? "Desativar" : "Ativar"}>
            <Ban className={`w-3.5 h-3.5 ${account.active ? "text-muted-foreground" : "text-destructive"}`} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          {account.children!.map((child) => (
            <AccountNode
              key={child.id}
              account={child}
              expanded={expanded}
              toggleExpand={toggleExpand}
              searchTerm={searchTerm}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlanoContas() {
  const [accounts, setAccounts] = useState<ChartAccount[]>(chartOfAccountsData);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "2", "3", "4", "5", "6"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  // New/edit form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("ativo");
  const [formNature, setFormNature] = useState<AccountNature>("devedora");

  const flatList = useMemo(() => flattenAccounts(accounts), [accounts]);
  const totalAccounts = flatList.length;
  const activeAccounts = flatList.filter((a) => a.active).length;

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => {
    setExpanded(new Set(flatList.map((a) => a.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const handleAddChild = (parentId: string) => {
    setParentIdForNew(parentId);
    setEditingAccount(null);
    setFormCode("");
    setFormName("");
    setFormType("ativo");
    setFormNature("devedora");
    setAddDialogOpen(true);
  };

  const handleEdit = (account: ChartAccount) => {
    setEditingAccount(account);
    setParentIdForNew(null);
    setFormCode(account.code);
    setFormName(account.name);
    setFormType(account.type);
    setFormNature(account.nature);
    setAddDialogOpen(true);
  };

  const handleToggleActive = (account: ChartAccount) => {
    toast.success(account.active ? `Conta "${account.name}" desativada` : `Conta "${account.name}" reativada`);
  };

  const handleSave = () => {
    if (!formCode || !formName) {
      toast.error("Preencha código e nome da conta");
      return;
    }
    if (editingAccount) {
      toast.success(`Conta "${formName}" atualizada com sucesso`);
    } else {
      toast.success(`Conta "${formName}" adicionada com sucesso`);
    }
    setAddDialogOpen(false);
  };

  const handleApplyTemplate = (templateName: string) => {
    toast.success(`Template "${templateName}" aplicado com sucesso!`);
  };

  const handleExport = () => {
    toast.success("Plano de contas exportado para Excel");
  };

  const handleImport = () => {
    toast.info("Funcionalidade de importação em breve");
  };

  const searchMatches = useMemo(() => {
    if (!searchTerm) return 0;
    return flatList.filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase())).length;
  }, [flatList, searchTerm]);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Plano de Contas</h1>
          <p className="text-sm text-muted-foreground font-data mt-1">
            Estrutura contábil hierárquica — {totalAccounts} contas ({activeAccounts} ativas)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Exportar Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} className="gap-2">
            <Upload className="w-4 h-4" /> Importar Excel
          </Button>
        </div>
      </div>

      {/* Templates */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-data">Templates prontos:</span>
            {accountTemplates.map((t) => (
              <Button key={t.id} variant="outline" size="sm" onClick={() => handleApplyTemplate(t.name)} className="text-xs">
                {t.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Contas", value: totalAccounts, color: "text-primary" },
          { label: "Contas Ativas", value: activeAccounts, color: "text-emerald-400" },
          { label: "Com Lançamentos", value: flatList.filter((a) => a.hasEntries).length, color: "text-cyan-400" },
          { label: "Níveis", value: 4, color: "text-violet-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold font-data ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Árvore de Contas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs">Expandir tudo</Button>
              <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs">Colapsar tudo</Button>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1" onClick={() => { setEditingAccount(null); setParentIdForNew(null); setFormCode(""); setFormName(""); }}>
                    <Plus className="w-4 h-4" /> Nova Conta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAccount ? "Editar Conta" : "Nova Conta Contábil"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {parentIdForNew && (
                      <p className="text-sm text-muted-foreground">
                        Subconta de: <span className="font-semibold text-foreground">{flatList.find((a) => a.id === parentIdForNew)?.name}</span>
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Código</Label>
                        <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="1.1.1.05" className="font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome da conta" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={formType} onValueChange={(v) => setFormType(v as AccountType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(typeLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Natureza</Label>
                        <Select value={formNature} onValueChange={(v) => setFormNature(v as AccountNature)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="devedora">Devedora</SelectItem>
                            <SelectItem value="credora">Credora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSave} className="gap-1">
                        <Check className="w-4 h-4" /> {editingAccount ? "Salvar alterações" : "Criar conta"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conta por nome (ex: caixa, fornecedor, estoque)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{searchMatches} resultado(s)</span>
                <button onClick={() => setSearchTerm("")} className="p-0.5 rounded hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground border-b border-border pb-2">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-primary" /> Com lançamentos</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border border-muted-foreground/30" /> Sem movimento</span>
            <span className="ml-auto font-mono">D = Devedora | C = Credora</span>
          </div>

          {/* Tree */}
          <div className="space-y-0">
            {accounts.map((account) => (
              <AccountNode
                key={account.id}
                account={account}
                expanded={expanded}
                toggleExpand={toggleExpand}
                searchTerm={searchTerm}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
