import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMonths, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Target, TrendingUp, CheckCircle2, Wallet, ArrowLeft, Share2, PiggyBank, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { mockMetas, metaEmojis, metaCategories, metaColors, averageMonthlyExpenses, type MetaFinanceira } from "@/data/metas-mock";
import { paymentInstruments } from "@/data/financeiro-mock";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MetasFinanceiras() {
  const { isEmpresarial } = useProfile();
  const [metas, setMetas] = useState<MetaFinanceira[]>(mockMetas);
  const [showForm, setShowForm] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<MetaFinanceira | null>(null);
  const [showAporteModal, setShowAporteModal] = useState(false);
  const [aporteMetaId, setAporteMetaId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("🎯");
  const [formCategory, setFormCategory] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formInitial, setFormInitial] = useState("");
  const [formInstrument, setFormInstrument] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [formPriority, setFormPriority] = useState<"alta" | "media" | "baixa">("media");
  const [formColor, setFormColor] = useState(metaColors[0]);
  const [formObs, setFormObs] = useState("");
  const [formMonthlySlider, setFormMonthlySlider] = useState([1000]);

  // Aporte state
  const [aporteDate, setAporteDate] = useState<Date>(new Date());
  const [aporteAmount, setAporteAmount] = useState("");
  const [aporteInstrument, setAporteInstrument] = useState("");
  const [aporteObs, setAporteObs] = useState("");

  // Detail simulator
  const [simSlider, setSimSlider] = useState([0]);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Target className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Metas Financeiras</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Este módulo está disponível apenas no perfil Pessoal. Alterne seu perfil para acessar suas metas financeiras pessoais.
        </p>
      </div>
    );
  }

  const activeMetas = metas.filter(m => !m.completed_at);
  const completedMetas = metas.filter(m => m.completed_at);
  const totalToSave = activeMetas.reduce((s, m) => s + (m.target_amount - m.current_amount), 0);
  const currentMonth = "2026-03";
  const savedThisMonth = metas.reduce((s, m) => s + m.aportes.filter(a => a.date.startsWith(currentMonth)).reduce((ss, a) => ss + a.amount, 0), 0);

  // Emergency reserve
  const emergencyMeta = metas.find(m => m.category === "Reserva de emergência" && !m.completed_at);
  const idealReserve = averageMonthlyExpenses * 6;
  const reserveMonths = emergencyMeta ? Math.floor(emergencyMeta.current_amount / averageMonthlyExpenses) : 0;

  const resetForm = () => {
    setFormName(""); setFormEmoji("🎯"); setFormCategory(""); setFormTarget(""); setFormInitial("");
    setFormInstrument(""); setFormDate(undefined); setFormPriority("media"); setFormColor(metaColors[0]); setFormObs("");
  };

  const handleCreateMeta = () => {
    const target = parseFloat(formTarget) || 0;
    const initial = parseFloat(formInitial) || 0;
    if (!formName || target <= 0) { toast({ title: "Preencha nome e valor da meta", variant: "destructive" }); return; }
    const newMeta: MetaFinanceira = {
      id: `meta-${Date.now()}`, name: formName, emoji: formEmoji, category: formCategory,
      target_amount: target, current_amount: initial, instrument_id: formInstrument,
      target_date: formDate ? format(formDate, "yyyy-MM-dd") : null,
      priority: formPriority, color: formColor, observations: formObs,
      created_at: format(new Date(), "yyyy-MM-dd"), completed_at: null,
      aportes: initial > 0 ? [{ id: `ap-${Date.now()}`, meta_id: `meta-${Date.now()}`, date: format(new Date(), "yyyy-MM-dd"), amount: initial, instrument_id: formInstrument, observation: "Saldo inicial" }] : [],
    };
    setMetas(prev => [...prev, newMeta]);
    setShowForm(false); resetForm();
    toast({ title: "Meta criada com sucesso! 🎯" });
  };

  const handleAporte = () => {
    const amount = parseFloat(aporteAmount) || 0;
    if (!aporteMetaId || amount <= 0) return;
    setMetas(prev => prev.map(m => {
      if (m.id !== aporteMetaId) return m;
      const newAmount = m.current_amount + amount;
      return {
        ...m, current_amount: Math.min(newAmount, m.target_amount),
        completed_at: newAmount >= m.target_amount ? format(new Date(), "yyyy-MM-dd") : null,
        aportes: [...m.aportes, { id: `ap-${Date.now()}`, meta_id: m.id, date: format(aporteDate, "yyyy-MM-dd"), amount, instrument_id: aporteInstrument, observation: aporteObs }],
      };
    }));
    setShowAporteModal(false); setAporteAmount(""); setAporteObs("");
    toast({ title: `Aporte de ${fmt(amount)} registrado! ✅` });
  };

  const getMonthsRemaining = (meta: MetaFinanceira) => {
    if (!meta.target_date) return null;
    return Math.max(0, differenceInMonths(parseISO(meta.target_date), new Date()));
  };

  const getMonthlyNeeded = (meta: MetaFinanceira) => {
    const months = getMonthsRemaining(meta);
    if (!months || months === 0) return meta.target_amount - meta.current_amount;
    return (meta.target_amount - meta.current_amount) / months;
  };

  const formTargetNum = parseFloat(formTarget) || 0;
  const formInitialNum = parseFloat(formInitial) || 0;
  const formMonthsToTarget = formDate ? Math.max(1, differenceInMonths(formDate, new Date())) : null;
  const formMonthlyNeeded = formMonthsToTarget ? (formTargetNum - formInitialNum) / formMonthsToTarget : null;
  const formMonthsWithSlider = formMonthlySlider[0] > 0 ? Math.ceil((formTargetNum - formInitialNum) / formMonthlySlider[0]) : null;

  // ─── DETAIL VIEW ───
  if (selectedMeta) {
    const meta = metas.find(m => m.id === selectedMeta.id) || selectedMeta;
    const pct = Math.round((meta.current_amount / meta.target_amount) * 100);
    const months = getMonthsRemaining(meta);
    const monthlyNeeded = getMonthlyNeeded(meta);

    // Build evolution chart data
    const chartData: { month: string; guardado: number; ideal: number }[] = [];
    const startDate = parseISO(meta.created_at);
    const endDate = meta.target_date ? parseISO(meta.target_date) : addMonths(new Date(), 6);
    let accumulated = 0;
    const totalMonths = differenceInMonths(endDate, startDate) || 12;
    const idealMonthly = meta.target_amount / totalMonths;
    for (let i = 0; i <= totalMonths; i++) {
      const d = addMonths(startDate, i);
      const monthStr = format(d, "MMM/yy", { locale: ptBR });
      const monthAportes = meta.aportes.filter(a => {
        const ad = parseISO(a.date);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      }).reduce((s, a) => s + a.amount, 0);
      accumulated += monthAportes;
      const isFuture = d > new Date();
      chartData.push({
        month: monthStr,
        guardado: isFuture ? accumulated : accumulated, // up to current, then project
        ideal: Math.min(idealMonthly * (i + 1), meta.target_amount),
      });
    }

    // Simulator
    const simMonthly = simSlider[0] || monthlyNeeded || 1000;
    const remaining = meta.target_amount - meta.current_amount;
    const simMonths = simMonthly > 0 ? Math.ceil(remaining / simMonthly) : 0;
    const simDate = addMonths(new Date(), simMonths);

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedMeta(null)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar às Metas
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-4xl">{meta.emoji}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{meta.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={meta.completed_at ? "default" : "secondary"}>{meta.completed_at ? "Concluída ✅" : "Em andamento"}</Badge>
              <Badge variant="outline" style={{ borderColor: `hsl(${meta.color})`, color: `hsl(${meta.color})` }}>{meta.category}</Badge>
              <Badge variant={meta.priority === "alta" ? "destructive" : "outline"}>
                {meta.priority === "alta" ? "Alta" : meta.priority === "media" ? "Média" : "Baixa"}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Imagem da meta copiada! 📋", description: `${meta.emoji} ${meta.name} — ${pct}% concluída 🎯` })}>
            <Share2 className="h-4 w-4" /> Compartilhar
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3" />
            <div className="flex justify-between text-sm mt-2">
              <span className="font-medium text-foreground">{fmt(meta.current_amount)}</span>
              <span className="text-muted-foreground">{fmt(meta.target_amount)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t">
              <div><p className="text-xs text-muted-foreground">Faltam</p><p className="font-semibold text-foreground">{fmt(remaining)}</p></div>
              <div><p className="text-xs text-muted-foreground">Prazo</p><p className="font-semibold text-foreground">{meta.target_date ? format(parseISO(meta.target_date), "dd/MM/yyyy") : "Sem prazo"}</p></div>
              <div><p className="text-xs text-muted-foreground">Aporte mensal necessário</p><p className="font-semibold text-foreground">{fmt(monthlyNeeded || 0)}/mês</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução da Meta</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="guardado" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} name="Guardado" />
                <Line type="monotone" dataKey="ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Caminho ideal" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Simulator */}
        <Card>
          <CardHeader><CardTitle className="text-base">Simulador</CardTitle><CardDescription>Ajuste o aporte mensal para ver o impacto</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Aporte mensal: {fmt(simSlider[0] || monthlyNeeded || 1000)}</Label>
              <Slider min={100} max={Math.max(remaining, 10000)} step={100} value={simSlider[0] ? simSlider : [monthlyNeeded || 1000]} onValueChange={setSimSlider} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50"><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Com {fmt(simMonthly)}/mês</p>
                <p className="text-lg font-bold text-foreground">Atinge em {simMonths} meses</p>
                <p className="text-sm text-muted-foreground">{format(simDate, "dd/MM/yyyy")}</p>
              </CardContent></Card>
              <Card className="bg-muted/50"><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Para atingir no prazo</p>
                <p className="text-lg font-bold text-foreground">{fmt(monthlyNeeded || 0)}/mês</p>
                <p className="text-sm text-muted-foreground">{meta.target_date ? format(parseISO(meta.target_date), "dd/MM/yyyy") : "Sem data alvo"}</p>
              </CardContent></Card>
            </div>
          </CardContent>
        </Card>

        {/* Aportes history */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Histórico de Aportes</CardTitle>
            <Button size="sm" onClick={() => { setAporteMetaId(meta.id); setShowAporteModal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Registrar aporte
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Saldo após</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...meta.aportes].reverse().map((ap, idx) => {
                  const saldoAfter = meta.aportes.slice(0, meta.aportes.length - idx).reduce((s, a) => s + a.amount, 0);
                  return (
                    <TableRow key={ap.id}>
                      <TableCell>{format(parseISO(ap.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium text-primary">{fmt(ap.amount)}</TableCell>
                      <TableCell>{fmt(saldoAfter)}</TableCell>
                      <TableCell className="text-muted-foreground">{ap.observation || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── MAIN DASHBOARD ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metas Financeiras</h1>
          <p className="text-muted-foreground">Planeje e acompanhe seus objetivos pessoais</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Meta</Button>
      </div>

      {/* Emergency Reserve Card */}
      <Card className="border-2" style={{ borderColor: reserveMonths >= 6 ? "hsl(var(--primary))" : reserveMonths >= 3 ? "hsl(var(--warning))" : "hsl(var(--destructive))" }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl" style={{ background: reserveMonths >= 6 ? "hsl(var(--primary) / 0.1)" : reserveMonths >= 3 ? "hsl(var(--warning) / 0.1)" : "hsl(var(--destructive) / 0.1)" }}>
              <PiggyBank className="h-8 w-8" style={{ color: reserveMonths >= 6 ? "hsl(var(--primary))" : reserveMonths >= 3 ? "hsl(var(--warning))" : "hsl(var(--destructive))" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-foreground">Reserva de Emergência</h3>
                {reserveMonths >= 6 ? (
                  <Badge className="bg-primary text-primary-foreground gap-1"><CheckCircle className="h-3 w-3" /> Reserva OK</Badge>
                ) : reserveMonths >= 3 ? (
                  <Badge className="bg-warning text-warning-foreground gap-1"><AlertTriangle className="h-3 w-3" /> Parcial ({reserveMonths} meses)</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Sem reserva</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Despesas mensais médias: {fmt(averageMonthlyExpenses)} • Reserva ideal (6 meses): {fmt(idealReserve)}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={(emergencyMeta?.current_amount || 0) / idealReserve * 100} className="h-3" />
                </div>
                <span className="font-semibold text-foreground whitespace-nowrap">
                  {fmt(emergencyMeta?.current_amount || 0)} / {fmt(idealReserve)}
                </span>
              </div>
              {emergencyMeta && emergencyMeta.current_amount < idealReserve && (
                <p className="text-xs text-muted-foreground mt-2">
                  Faltam {fmt(idealReserve - emergencyMeta.current_amount)} • Sugestão: {fmt((idealReserve - emergencyMeta.current_amount) / 6)}/mês por 6 meses
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Target className="h-4 w-4" /><span className="text-xs">Metas ativas</span></div>
          <p className="text-2xl font-bold text-foreground">{activeMetas.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><Wallet className="h-4 w-4" /><span className="text-xs">Total a economizar</span></div>
          <p className="text-2xl font-bold text-foreground">{fmt(totalToSave)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /><span className="text-xs">Guardado este mês</span></div>
          <p className="text-2xl font-bold text-primary">{fmt(savedThisMonth)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-1"><CheckCircle2 className="h-4 w-4" /><span className="text-xs">Metas concluídas</span></div>
          <p className="text-2xl font-bold text-foreground">{completedMetas.length}</p>
        </CardContent></Card>
      </div>

      {/* Active goals */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Metas Ativas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMetas.map(meta => {
            const pct = Math.round((meta.current_amount / meta.target_amount) * 100);
            const remaining = meta.target_amount - meta.current_amount;
            const months = getMonthsRemaining(meta);
            const monthly = getMonthlyNeeded(meta);
            return (
              <Card key={meta.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1.5" style={{ background: `hsl(${meta.color})` }} />
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <p className="font-semibold text-foreground">{meta.name}</p>
                        <p className="text-xs text-muted-foreground">{meta.category}</p>
                      </div>
                    </div>
                    <Badge variant={meta.priority === "alta" ? "destructive" : "outline"} className="text-[10px]">
                      {meta.priority === "alta" ? "Alta" : meta.priority === "media" ? "Média" : "Baixa"}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{fmt(meta.current_amount)}</span>
                      <span className="font-medium" style={{ color: `hsl(${meta.color})` }}>{pct}%</span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `hsl(${meta.color})` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">{fmt(meta.target_amount)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Faltam:</span> <span className="font-medium text-foreground">{fmt(remaining)}</span></div>
                    <div><span className="text-muted-foreground">Prazo:</span> <span className="font-medium text-foreground">{months !== null ? `${months} meses` : "Sem prazo"}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Necessário:</span> <span className="font-medium text-foreground">{fmt(monthly || 0)}/mês</span></div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={() => { setAporteMetaId(meta.id); setShowAporteModal(true); }}>
                      <Wallet className="h-3 w-3 mr-1" /> Guardar agora
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedMeta(meta); setSimSlider([monthly || 1000]); }}>
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed goals */}
      {completedMetas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Metas Concluídas 🎉</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedMetas.map(meta => (
              <Card key={meta.id} className="opacity-80">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <div>
                      <p className="font-medium text-foreground">{meta.name}</p>
                      <p className="text-xs text-muted-foreground">Concluída em {meta.completed_at ? format(parseISO(meta.completed_at), "dd/MM/yyyy") : ""}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-sm font-medium text-foreground mt-1">{fmt(meta.target_amount)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── NEW GOAL FORM ─── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Meta Financeira</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ícone</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {metaEmojis.map(e => (
                  <button key={e} onClick={() => setFormEmoji(e)} className={cn("text-2xl p-1.5 rounded-lg border transition-colors", formEmoji === e ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted")}>{e}</button>
                ))}
              </div>
            </div>
            <div><Label>Nome da meta</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Viagem para Europa" className="mt-1" /></div>
            <div><Label>Categoria</Label>
              <Select value={formCategory} onValueChange={setFormCategory}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{metaCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor total (R$)</Label><Input type="number" value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="0,00" className="mt-1" /></div>
              <div><Label>Já guardado (R$)</Label><Input type="number" value={formInitial} onChange={e => setFormInitial(e.target.value)} placeholder="0,00" className="mt-1" /></div>
            </div>
            <div><Label>Conta vinculada</Label>
              <Select value={formInstrument} onValueChange={setFormInstrument}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{paymentInstruments.filter(p => p.active && p.type !== "cartao_credito").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label>Data alvo (opcional)</Label>
              <Popover><PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full mt-1 justify-start", !formDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />{formDate ? format(formDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formDate} onSelect={setFormDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Prioridade</Label>
              <Select value={formPriority} onValueChange={v => setFormPriority(v as "alta" | "media" | "baixa")}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent></Select>
            </div>
            <div><Label>Cor do card</Label>
              <div className="flex gap-2 mt-1">{metaColors.map(c => (
                <button key={c} onClick={() => setFormColor(c)} className={cn("h-8 w-8 rounded-full border-2 transition-transform", formColor === c ? "scale-125 border-foreground" : "border-transparent")} style={{ background: `hsl(${c})` }} />
              ))}</div>
            </div>
            <div><Label>Observações</Label><Textarea value={formObs} onChange={e => setFormObs(e.target.value)} className="mt-1" /></div>

            {/* Auto calculation */}
            {formTargetNum > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">📊 Simulação</p>
                  {formMonthlyNeeded !== null && (
                    <p className="text-sm text-muted-foreground">
                      Para atingir no prazo: <span className="font-semibold text-foreground">{fmt(formMonthlyNeeded)}/mês</span>
                    </p>
                  )}
                  <div>
                    <Label className="text-xs">Simular aporte mensal: {fmt(formMonthlySlider[0])}</Label>
                    <Slider min={100} max={Math.max(formTargetNum, 5000)} step={100} value={formMonthlySlider} onValueChange={setFormMonthlySlider} className="mt-2" />
                    {formMonthsWithSlider !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Com {fmt(formMonthlySlider[0])}/mês → atinge em <span className="font-semibold text-foreground">{formMonthsWithSlider} meses</span> ({format(addMonths(new Date(), formMonthsWithSlider), "dd/MM/yyyy")})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={handleCreateMeta}>Criar Meta 🎯</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── APORTE MODAL ─── */}
      <Dialog open={showAporteModal} onOpenChange={setShowAporteModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Aporte</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Data</Label>
              <Popover><PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1 justify-start"><CalendarIcon className="h-4 w-4 mr-2" />{format(aporteDate, "dd/MM/yyyy")}</Button>
              </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={aporteDate} onSelect={d => d && setAporteDate(d)} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Valor (R$)</Label><Input type="number" value={aporteAmount} onChange={e => setAporteAmount(e.target.value)} placeholder="0,00" className="mt-1" /></div>
            <div><Label>Conta de origem</Label>
              <Select value={aporteInstrument} onValueChange={setAporteInstrument}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{paymentInstruments.filter(p => p.active && p.type !== "cartao_credito").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Observação</Label><Input value={aporteObs} onChange={e => setAporteObs(e.target.value)} className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAporteModal(false)}>Cancelar</Button><Button onClick={handleAporte}>Confirmar Aporte</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
