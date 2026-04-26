import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInMonths } from "date-fns";
import { CalendarIcon, Plus, ShoppingBag, GripVertical, Check, X, CircleDot } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface PlannedPurchase {
  id: string;
  name: string;
  category: string;
  value: number;
  priority: "necessario" | "desejado" | "sonho";
  target_date: string | null;
  payment_method: "avista" | "parcelado" | "financiamento";
  installments: number;
  link: string;
  observations: string;
  status: "planejada" | "poupando" | "comprada" | "cancelada";
  order: number;
}

const purchaseCategories = ["Eletrônico", "Eletrodoméstico", "Móvel", "Veículo", "Roupa", "Viagem", "Educação", "Saúde", "Outro"];

const mockPurchases: PlannedPurchase[] = [
  { id: "cp1", name: "iPhone 16 Pro", category: "Eletrônico", value: 9500, priority: "desejado", target_date: "2026-06-01", payment_method: "parcelado", installments: 12, link: "", observations: "", status: "poupando", order: 1 },
  { id: "cp2", name: "Sofá retrátil", category: "Móvel", value: 4200, priority: "necessario", target_date: "2026-04-15", payment_method: "parcelado", installments: 6, link: "", observations: "Modelo L 3 lugares", status: "planejada", order: 2 },
  { id: "cp3", name: "Curso MBA", category: "Educação", value: 28000, priority: "necessario", target_date: "2027-01-01", payment_method: "parcelado", installments: 24, link: "", observations: "MBA em Gestão Financeira", status: "planejada", order: 3 },
  { id: "cp4", name: "Drone DJI Mini 4", category: "Eletrônico", value: 5800, priority: "sonho", target_date: null, payment_method: "avista", installments: 1, link: "", observations: "", status: "planejada", order: 4 },
  { id: "cp5", name: "Smart TV 65\"", category: "Eletrodoméstico", value: 3500, priority: "desejado", target_date: "2026-05-01", payment_method: "avista", installments: 1, link: "", observations: "", status: "comprada", order: 5 },
];

const MONTHLY_INCOME = 13000;
const MONTHLY_SAVINGS_CAPACITY = 2600; // 20% of income

export default function ComprasPlanejadas() {
  const { isEmpresarial } = useProfile();
  const [purchases, setPurchases] = useState(mockPurchases);
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Form state
  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fValue, setFValue] = useState("");
  const [fPriority, setFPriority] = useState<"necessario" | "desejado" | "sonho">("desejado");
  const [fDate, setFDate] = useState<Date | undefined>();
  const [fPayment, setFPayment] = useState<"avista" | "parcelado" | "financiamento">("avista");
  const [fInstallments, setFInstallments] = useState("1");
  const [fLink, setFLink] = useState("");
  const [fObs, setFObs] = useState("");

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Compras Planejadas</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal.</p>
      </div>
    );
  }

  const activePurchases = purchases.filter(p => p.status !== "comprada" && p.status !== "cancelada").sort((a, b) => a.order - b.order);
  const completedPurchases = purchases.filter(p => p.status === "comprada" || p.status === "cancelada");
  const totalPlanned = activePurchases.reduce((s, p) => s + p.value, 0);
  const monthsToComplete = MONTHLY_SAVINGS_CAPACITY > 0 ? Math.ceil(totalPlanned / MONTHLY_SAVINGS_CAPACITY) : 0;

  const priorityLabel = (p: string) => p === "necessario" ? "Necessário" : p === "desejado" ? "Desejado" : "Sonho";
  const priorityColor = (p: string) => p === "necessario" ? "destructive" : p === "desejado" ? "secondary" : "outline";
  const statusLabel = (s: string) => s === "planejada" ? "Planejada" : s === "poupando" ? "Poupando" : s === "comprada" ? "Comprada" : "Cancelada";
  const statusColor = (s: string): string => s === "comprada" ? "hsl(var(--primary))" : s === "poupando" ? "hsl(var(--info))" : s === "cancelada" ? "hsl(var(--muted-foreground))" : "hsl(var(--warning))";

  const getImpact = (value: number, installments: number, paymentMethod: string) => {
    const pctIncome = (value / MONTHLY_INCOME) * 100;
    const monthlyImpact = paymentMethod === "avista" ? value : value / installments;
    const pctMonthly = (monthlyImpact / MONTHLY_INCOME) * 100;
    const monthsToSave = MONTHLY_SAVINGS_CAPACITY > 0 ? Math.ceil(value / MONTHLY_SAVINGS_CAPACITY) : 0;
    const signal: "green" | "yellow" | "red" = pctMonthly <= 5 ? "green" : pctMonthly <= 15 ? "yellow" : "red";
    return { pctIncome, monthlyImpact, pctMonthly, monthsToSave, signal };
  };

  const handleCreate = () => {
    const value = parseFloat(fValue) || 0;
    if (!fName || value <= 0) { toast({ title: "Preencha nome e valor", variant: "destructive" }); return; }
    const newPurchase: PlannedPurchase = {
      id: `cp-${Date.now()}`, name: fName, category: fCategory || "Outro", value,
      priority: fPriority, target_date: fDate ? format(fDate, "yyyy-MM-dd") : null,
      payment_method: fPayment, installments: parseInt(fInstallments) || 1,
      link: fLink, observations: fObs, status: "planejada",
      order: activePurchases.length + 1,
    };
    setPurchases(prev => [...prev, newPurchase]);
    setShowForm(false);
    setFName(""); setFCategory(""); setFValue(""); setFPriority("desejado"); setFDate(undefined);
    setFPayment("avista"); setFInstallments("1"); setFLink(""); setFObs("");
    toast({ title: "Compra adicionada à lista! 🛒" });
  };

  const updateStatus = (id: string, status: PlannedPurchase["status"]) => {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (status === "comprada") toast({ title: "Compra registrada! ✅" });
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    setPurchases(prev => {
      const items = [...prev];
      const dragIdx = items.findIndex(p => p.id === draggedId);
      const targetIdx = items.findIndex(p => p.id === targetId);
      if (dragIdx === -1 || targetIdx === -1) return prev;
      const [removed] = items.splice(dragIdx, 1);
      items.splice(targetIdx, 0, removed);
      return items.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };
  const handleDragEnd = () => setDraggedId(null);

  // Form impact simulation
  const formValue = parseFloat(fValue) || 0;
  const formInstallments = parseInt(fInstallments) || 1;
  const formImpact = formValue > 0 ? getImpact(formValue, formInstallments, fPayment) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras Planejadas</h1>
          <p className="text-muted-foreground">Lista de desejos com análise de impacto</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova Compra</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Compras planejadas</p>
          <p className="text-2xl font-bold text-foreground">{activePurchases.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Total estimado</p>
          <p className="text-2xl font-bold text-foreground">{fmt(totalPlanned)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Capacidade de poupança</p>
          <p className="text-2xl font-bold text-primary">{fmt(MONTHLY_SAVINGS_CAPACITY)}/mês</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Tempo para tudo</p>
          <p className="text-2xl font-bold text-foreground">{monthsToComplete} meses</p>
        </CardContent></Card>
      </div>

      {/* Active Purchases - Draggable */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Ranking de Prioridades</h2>
        <p className="text-xs text-muted-foreground mb-3">Arraste para reordenar por prioridade</p>
        <div className="space-y-3">
          {activePurchases.map((purchase, idx) => {
            const impact = getImpact(purchase.value, purchase.installments, purchase.payment_method);
            const months = purchase.target_date ? Math.max(0, differenceInMonths(parseISO(purchase.target_date), new Date())) : null;
            return (
              <Card
                key={purchase.id}
                draggable
                onDragStart={() => handleDragStart(purchase.id)}
                onDragOver={e => handleDragOver(e, purchase.id)}
                onDragEnd={handleDragEnd}
                className={cn("transition-all cursor-grab active:cursor-grabbing", draggedId === purchase.id && "opacity-50 scale-[0.98]")}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-foreground">{purchase.name}</p>
                        <Badge variant={priorityColor(purchase.priority) as any}>{priorityLabel(purchase.priority)}</Badge>
                        <Badge variant="outline" style={{ borderColor: statusColor(purchase.status), color: statusColor(purchase.status) }}>{statusLabel(purchase.status)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>{purchase.category}</span>
                        <span className="font-medium text-foreground">{fmt(purchase.value)}</span>
                        <span>{purchase.payment_method === "avista" ? "À vista" : `${purchase.installments}x de ${fmt(purchase.value / purchase.installments)}`}</span>
                        {months !== null && <span>Em {months} meses</span>}
                      </div>
                      {/* Impact indicator */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg">{impact.signal === "green" ? "🟢" : impact.signal === "yellow" ? "🟡" : "🔴"}</span>
                        <span className="text-xs text-muted-foreground">
                          {impact.pctIncome.toFixed(0)}% da renda
                          {purchase.payment_method !== "avista" && ` • ${fmt(impact.monthlyImpact)}/mês (${impact.pctMonthly.toFixed(1)}%)`}
                          {` • ${impact.monthsToSave} meses poupando`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {purchase.status === "planejada" && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus(purchase.id, "poupando")} title="Começar a poupar">
                          <CircleDot className="h-4 w-4 text-info" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus(purchase.id, "comprada")} title="Marcar como comprada">
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus(purchase.id, "cancelada")} title="Cancelar">
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completed */}
      {completedPurchases.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Finalizadas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedPurchases.map(p => (
              <Card key={p.id} className="opacity-70">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  {p.status === "comprada" ? <Check className="h-5 w-5 text-primary" /> : <X className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(p.value)} • {p.status === "comprada" ? "Comprada" : "Cancelada"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New Purchase Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Compra Planejada</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome do produto/serviço</Label><Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: iPhone 16 Pro" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Categoria</Label>
                <Select value={fCategory} onValueChange={setFCategory}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{purchaseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Valor estimado (R$)</Label><Input type="number" value={fValue} onChange={e => setFValue(e.target.value)} placeholder="0,00" className="mt-1" /></div>
            </div>
            <div><Label>Prioridade</Label>
              <Select value={fPriority} onValueChange={v => setFPriority(v as any)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="necessario">Necessário</SelectItem>
                  <SelectItem value="desejado">Desejado</SelectItem>
                  <SelectItem value="sonho">Sonho</SelectItem>
                </SelectContent></Select>
            </div>
            <div>
              <Label>Data pretendida (opcional)</Label>
              <Popover><PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full mt-1 justify-start", !fDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />{fDate ? format(fDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fDate} onSelect={setFDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Forma de pagamento</Label>
                <Select value={fPayment} onValueChange={v => setFPayment(v as any)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avista">À vista</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                  </SelectContent></Select>
              </div>
              {fPayment !== "avista" && (
                <div><Label>Parcelas</Label><Input type="number" value={fInstallments} onChange={e => setFInstallments(e.target.value)} min="2" className="mt-1" /></div>
              )}
            </div>
            <div><Label>Link do produto (opcional)</Label><Input value={fLink} onChange={e => setFLink(e.target.value)} placeholder="https://..." className="mt-1" /></div>
            <div><Label>Observações</Label><Textarea value={fObs} onChange={e => setFObs(e.target.value)} className="mt-1" /></div>

            {/* Impact Simulation */}
            {formImpact && (
              <Card className={cn("border-2", formImpact.signal === "green" ? "border-primary/30 bg-primary/5" : formImpact.signal === "yellow" ? "border-warning/30 bg-warning/5" : "border-destructive/30 bg-destructive/5")}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{formImpact.signal === "green" ? "🟢" : formImpact.signal === "yellow" ? "🟡" : "🔴"}</span>
                    <p className="font-medium text-foreground text-sm">
                      {formImpact.signal === "green" ? "Tranquilo" : formImpact.signal === "yellow" ? "Atenção" : "Pode comprometer o orçamento"}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Representa <span className="font-semibold text-foreground">{formImpact.pctIncome.toFixed(1)}%</span> da renda mensal</p>
                    {fPayment !== "avista" && (
                      <p>Parcelado em {formInstallments}x: <span className="font-semibold text-foreground">{fmt(formImpact.monthlyImpact)}/mês</span> — compromete {formImpact.pctMonthly.toFixed(1)}% do orçamento</p>
                    )}
                    <p>Tempo para juntar à vista: <span className="font-semibold text-foreground">{formImpact.monthsToSave} meses</span> poupando {fmt(MONTHLY_SAVINGS_CAPACITY)}/mês</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={handleCreate}>Adicionar 🛒</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
