import { useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  Settings, User, DollarSign, Beef, Bell, Database,
  Plus, Trash2, Save, Download, Upload, AlertTriangle, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  getGrowthCurves, setGrowthCurve, resetToDefaults, getAvailableBreeds,
  type CurvePoint, type GrowthCurveMap,
} from "@/data/growth-curves";
import type { Sexo } from "@/data/rebanho-mock";

/* ── Section wrapper ──────────────────────────────── */
function Section({ id, icon: Icon, title, desc, children }: { id: string; icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-primary" />{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

/* ── Editable list (CRUD) ─────────────────────────── */
function CrudList({ items: initial, label }: { items: string[]; label: string }) {
  const [items, setItems] = useState(initial);
  const [newItem, setNewItem] = useState("");
  const add = () => { if (!newItem.trim()) return; setItems([...items, newItem.trim()]); setNewItem(""); };
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="gap-1 pr-1">
            {item}
            <button onClick={() => remove(i)} className="ml-0.5 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`Novo ${label.toLowerCase()}…`} className="max-w-xs" onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button variant="outline" size="sm" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ── Notification Settings Section ─────────────────── */
function NotificationSettingsSection() {
  const { settings, updateSettings } = useNotifications();

  const toggleItems: { key: "urgente" | "atencao" | "informativo" | "sucesso"; label: string; desc: string; dot: string }[] = [
    { key: "urgente", label: "🔴 Urgente", desc: "Contas vencidas, óbitos, estoque zerado", dot: "bg-destructive" },
    { key: "atencao", label: "🟠 Atenção", desc: "Vencimentos próximos, carências, estoque baixo, projeção negativa", dot: "bg-yellow-500" },
    { key: "informativo", label: "🟡 Informativo", desc: "Vencimentos na semana, vacinas, partos, extratos", dot: "bg-blue-500" },
    { key: "sucesso", label: "🟢 Sucesso", desc: "Pagamentos, conciliações, metas atingidas", dot: "bg-emerald-500" },
  ];

  return (
    <Section id="notificacoes" icon={Bell} title="Notificações & Alertas" desc="Configure quais alertas deseja receber e a frequência de e-mails">
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tipos de alerta</p>
        {toggleItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${item.dot}`} />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <Switch checked={settings[item.key]} onCheckedChange={(v) => updateSettings({ [item.key]: v })} />
          </div>
        ))}

        <Separator />

        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Antecedência de vencimento</p>
        <div className="flex items-center justify-between max-w-md">
          <div>
            <p className="text-sm font-medium">Alertar com antecedência de</p>
            <p className="text-xs text-muted-foreground">Dias antes do vencimento para gerar alerta</p>
          </div>
          <Select value={String(settings.antecedenciaVencimento)} onValueChange={(v) => updateSettings({ antecedenciaVencimento: Number(v) })}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 dia</SelectItem>
              <SelectItem value="3">3 dias</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Notificação por e-mail</p>
        <div className="flex items-center justify-between max-w-md">
          <div>
            <p className="text-sm font-medium">Frequência de e-mail</p>
            <p className="text-xs text-muted-foreground">Com que frequência deseja receber alertas por e-mail</p>
          </div>
          <Select value={settings.emailFrequency} onValueChange={(v) => updateSettings({ emailFrequency: v as any })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="imediata">Imediata</SelectItem>
              <SelectItem value="diario">Resumo diário</SelectItem>
              <SelectItem value="semanal">Resumo semanal</SelectItem>
              <SelectItem value="desativado">Desativado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Section>
  );
}

/* ══════════════════════════════════════════════════════ */
export default function Configuracoes() {
  const { profile, isEmpresarial } = useProfile();

  /* profile */
  const [userName, setUserName] = useState("João Silva");
  const [userEmail, setUserEmail] = useState("joao@agrofinance.com");
  const [companyName, setCompanyName] = useState("Fazenda Boa Vista LTDA");

  /* financeiro */
  const [currency, setCurrency] = useState("BRL");
  const [finStartDay, setFinStartDay] = useState("1");
  const [alertDays, setAlertDays] = useState("5");

  /* rebanho */
  const [arrobaWeight, setArrobaWeight] = useState("15");
  const [activeSpecies, setActiveSpecies] = useState({ bovino: true, equino: true, caprino: true, suino: true, avicola: false });

  /* growth curves */
  const [curveBreed, setCurveBreed] = useState<string>(getAvailableBreeds()[0] || "Nelore");
  const [curveSex, setCurveSex] = useState<Sexo>("M");
  const [curves, setCurves] = useState<GrowthCurveMap>(getGrowthCurves());
  const [newBreed, setNewBreed] = useState("");

  const currentCurve = curves[curveBreed]?.[curveSex] || [];

  function updateCurvePoint(idx: number, field: "months" | "weight", value: number) {
    const updated = [...currentCurve];
    updated[idx] = { ...updated[idx], [field]: value };
    const sorted = updated.sort((a, b) => a.months - b.months);
    setGrowthCurve(curveBreed, curveSex, sorted);
    setCurves({ ...getGrowthCurves() });
  }

  function addCurvePoint() {
    const lastMonth = currentCurve.length > 0 ? currentCurve[currentCurve.length - 1].months + 6 : 0;
    const updated = [...currentCurve, { months: lastMonth, weight: 0 }];
    setGrowthCurve(curveBreed, curveSex, updated);
    setCurves({ ...getGrowthCurves() });
  }

  function removeCurvePoint(idx: number) {
    const updated = currentCurve.filter((_, i) => i !== idx);
    setGrowthCurve(curveBreed, curveSex, updated);
    setCurves({ ...getGrowthCurves() });
  }

  function handleAddBreed() {
    if (!newBreed.trim()) return;
    setGrowthCurve(newBreed.trim(), "M", [{ months: 0, weight: 30 }, { months: 12, weight: 200 }, { months: 24, weight: 350 }]);
    setGrowthCurve(newBreed.trim(), "F", [{ months: 0, weight: 28 }, { months: 12, weight: 180 }, { months: 24, weight: 300 }]);
    setCurves({ ...getGrowthCurves() });
    setCurveBreed(newBreed.trim());
    setNewBreed("");
    toast.success(`Curva criada para ${newBreed.trim()}`);
  }

  function handleResetCurves() {
    resetToDefaults();
    setCurves({ ...getGrowthCurves() });
    toast.success("Curvas restauradas aos valores padrão");
  }

  /* notificações */
  const [emailVencimento, setEmailVencimento] = useState(true);
  const [emailVacina, setEmailVacina] = useState(true);
  const [resumoFreq, setResumoFreq] = useState("semanal");

  /* data */
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleSave() { toast.success("Configurações salvas com sucesso"); }
  function handleExport() { toast.info("Exportação de dados será implementada com backend"); }
  function handleImport() { toast.info("Importação de dados será implementada com backend"); }
  function handleClear() { setShowClearConfirm(false); toast.success("Dados de teste removidos"); }

  const nav = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "rebanho", label: "Rebanho", icon: Beef },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "dados", label: "Dados", icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Configurações
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie as preferências do sistema</p>
        </div>
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />Salvar</Button>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        {nav.map((n) => (
          <Button key={n.id} variant="outline" size="sm" className="text-xs gap-1" asChild>
            <a href={`#${n.id}`}><n.icon className="h-3.5 w-3.5" />{n.label}</a>
          </Button>
        ))}
      </div>

      {/* ── Perfil ─── */}
      <Section id="perfil" icon={User} title="Perfil e Empresa" desc="Dados do usuário e empresa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome do usuário</Label>
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nome da empresa / tenant</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm">Perfil ativo:</Label>
          <Badge variant={isEmpresarial ? "default" : "secondary"} className="text-xs">
            {isEmpresarial ? "Empresarial" : "Pessoal"}
          </Badge>
          <span className="text-xs text-muted-foreground">(altere via toggle na sidebar)</span>
        </div>
      </Section>

      {/* ── Financeiro ─── */}
      <Section id="financeiro" icon={DollarSign} title="Financeiro" desc="Preferências financeiras e cadastros">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Moeda padrão</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">R$ — BRL</SelectItem>
                <SelectItem value="USD">$ — USD</SelectItem>
                <SelectItem value="EUR">€ — EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Início do mês financeiro</Label>
            <Select value={finStartDay} onValueChange={setFinStartDay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>Dia {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Alerta de vencimento (dias antes)</Label>
            <Input type="number" min={0} value={alertDays} onChange={(e) => setAlertDays(e.target.value)} />
          </div>
        </div>
        <Separator />
        <CrudList items={["Receita Operacional", "Custo de Produção", "Despesa Administrativa", "Pessoal/Folha", "Investimento", "Outros"]} label="Categorias" />
        <CrudList items={["Fazenda Boa Vista", "Fazenda São José", "Sítio Esperança", "Administrativo"]} label="Centros de Custo" />
        <CrudList items={["50% Fazenda Boa Vista / 50% Fazenda São José", "100% Fazenda Boa Vista"]} label="Regras de Rateio" />
      </Section>

      {/* ── Rebanho ─── */}
      <Section id="rebanho" icon={Beef} title="Rebanho" desc="Configurações de manejo animal">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Espécies ativas no sistema</Label>
          <div className="flex flex-wrap gap-4">
            {(Object.entries(activeSpecies) as [string, boolean][]).map(([sp, active]) => (
              <label key={sp} className="flex items-center gap-2 cursor-pointer">
                <Switch checked={active} onCheckedChange={(v) => setActiveSpecies({ ...activeSpecies, [sp]: v })} />
                <span className="text-sm capitalize">{sp}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 max-w-xs">
          <Label>Peso de arroba padrão (kg)</Label>
          <Input type="number" value={arrobaWeight} onChange={(e) => setArrobaWeight(e.target.value)} />
        </div>
        <Separator />
        <CrudList items={["Bezerro(a)", "Novilho(a)", "Garrote", "Vaca", "Touro", "Boi gordo"]} label="Categorias de Animal" />
        <CrudList items={["Ivermectina", "Doramectina", "Vacina Aftosa", "Vacina Brucelose", "Vacina Raiva", "Oxitetraciclina"]} label="Medicamentos Cadastrados" />

        {/* Growth Curves */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Curvas de Crescimento por Raça</Label>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={handleResetCurves}>
              <RotateCcw className="h-3 w-3" /> Restaurar Padrão
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Raça</Label>
              <Select value={curveBreed} onValueChange={setCurveBreed}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(curves).sort().map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sexo</Label>
              <Select value={curveSex} onValueChange={(v) => setCurveSex(v as Sexo)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="F">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Idade (meses)</TableHead>
                <TableHead className="w-32">Peso esperado (kg)</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCurve.map((pt, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input
                      type="number" min={0} className="w-24 h-8"
                      value={pt.months}
                      onChange={(e) => updateCurvePoint(idx, "months", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" min={0} className="w-24 h-8"
                      value={pt.weight}
                      onChange={(e) => updateCurvePoint(idx, "weight", Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCurvePoint(idx)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={addCurvePoint} className="gap-1">
            <Plus className="h-3 w-3" /> Adicionar ponto
          </Button>

          {/* Add custom breed */}
          <Separator />
          <Label className="text-xs text-muted-foreground">Adicionar raça customizada</Label>
          <div className="flex gap-2">
            <Input value={newBreed} onChange={(e) => setNewBreed(e.target.value)} placeholder="Nome da raça" className="max-w-xs" onKeyDown={(e) => e.key === "Enter" && handleAddBreed()} />
            <Button variant="outline" size="sm" onClick={handleAddBreed}><Plus className="h-4 w-4 mr-1" /> Criar Curva</Button>
          </div>
        </div>
      </Section>

      {/* ── Notificações ─── */}
      <NotificationSettingsSection />

      {/* ── Dados ─── */}
      <Section id="dados" icon={Database} title="Dados e Exportação" desc="Gerenciamento de dados do sistema">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Exportar todos os dados (JSON)</Button>
          <Button variant="outline" onClick={handleImport}><Upload className="h-4 w-4 mr-1" />Importar dados</Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <div>
            <p className="text-sm font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Limpar dados de teste</p>
            <p className="text-xs text-muted-foreground">Remove todos os dados mock do sistema. Ação irreversível.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowClearConfirm(true)}>Limpar</Button>
        </div>
      </Section>

      {/* Clear confirm */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os dados de teste?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá todos os dados mock do sistema. Não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
