import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, CalendarIcon, Clock, ArrowLeft, Save, Send, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn, getDbErrorMessage } from "@/lib/utils";
import { getSessoes } from "@/cronometro/lib/storage";
import type { SessaoTempo } from "@/cronometro/types";

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Descrição obrigatória").max(500, "Descrição muito longa"),
  date: z.string().min(1, "Data obrigatória").regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  hours: z.number().min(0, "Horas não pode ser negativo"),
  rate: z.number().min(0, "Valor/hora não pode ser negativo"),
  amount: z.number().min(0),
});

const invoiceSchema = z.object({
  number: z.string().min(1, "Número da fatura é obrigatório").max(50, "Número muito longo"),
  hourlyRate: z.number().min(0, "Valor/hora não pode ser negativo"),
  discount: z.number().min(0, "Desconto não pode ser negativo"),
  notes: z.string().max(2000, "Observações muito longas"),
  items: z.array(invoiceItemSchema),
});

type InvoiceErrors = Partial<Record<"number" | "hourlyRate" | "discount" | "notes", string>> & {
  itemDescriptions?: string[];
  itemDates?: string[];
};

interface InvoiceItem {
  id: string;
  description: string;
  date: string;
  hours: number;
  rate: number;
  amount: number;
}

type ClientRow = { id: string; name: string; company: string | null };
type ProjectRow = { id: string; name: string; client_id: string | null };

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [hourlyRate, setHourlyRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [status, setStatus] = useState("rascunho");
  const [paidAt, setPaidAt] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<InvoiceErrors>({});

  // Import hours dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importStart, setImportStart] = useState<Date | undefined>();
  const [importEnd, setImportEnd] = useState<Date | undefined>();
  const [sessions, setSessions] = useState<(SessaoTempo & { selected: boolean })[]>([]);

  const filteredProjects = useMemo(
    () => (clientId ? projects.filter((p) => p.client_id === clientId) : projects),
    [clientId, projects]
  );

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const totalHours = items.reduce((sum, i) => sum + i.hours, 0);
  const total = subtotal - discount;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [cliRes, projRes, paramsRes] = await Promise.all([
        supabase.from("clients").select("id, name, company").eq("user_id", user.id).order("name"),
        supabase.from("projects").select("id, name, client_id").eq("user_id", user.id).order("name"),
        supabase.from("pricing_params").select("hourly_rate").eq("user_id", user.id).limit(1).single(),
      ]);
      setClients(cliRes.data ?? []);
      setProjects(projRes.data ?? []);
      if (paramsRes.data) setHourlyRate(paramsRes.data.hourly_rate);

      if (isEditing) {
        const { data: inv } = await supabase.from("invoices").select("*").eq("id", id).single();
        if (inv) {
          setClientId(inv.client_id || "");
          setProjectId(inv.project_id || "");
          setNumber(inv.number);
          setIssueDate(new Date(inv.issue_date));
          setDueDate(inv.due_date ? new Date(inv.due_date) : undefined);
          setHourlyRate(inv.hourly_rate);
          setNotes(inv.notes || "");
          setDiscount(inv.discount);
          setStatus(inv.status);
          setPaidAt(inv.paid_at ? new Date(inv.paid_at) : undefined);
        }
        const { data: itemsData } = await supabase.from("invoice_items").select("*").eq("invoice_id", id).order("date");
        setItems(
          (itemsData ?? []).map((i) => ({
            id: i.id,
            description: i.description,
            date: i.date || "",
            hours: Number(i.hours),
            rate: Number(i.rate),
            amount: Number(i.amount),
          }))
        );
      } else {
        const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", user.id);
        setNumber(`FAT-${String((count || 0) + 1).padStart(3, "0")}`);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: "", date: format(new Date(), "yyyy-MM-dd"), hours: 0, rate: hourlyRate, amount: 0 }]);
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "hours" || field === "rate") {
      updated[idx].amount = Number(updated[idx].hours) * Number(updated[idx].rate);
    }
    setItems(updated);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const loadSessions = () => {
    const allSessions = getSessoes().filter((s) => s.hora_fim && s.duracao_segundos);
    let filtered = allSessions;
    if (importStart) filtered = filtered.filter((s) => new Date(s.hora_inicio) >= importStart);
    if (importEnd) {
      const end = new Date(importEnd);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((s) => new Date(s.hora_inicio) <= end);
    }
    setSessions(filtered.map((s) => ({ ...s, selected: false })));
  };

  useEffect(() => {
    if (importOpen) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importOpen, importStart, importEnd]);

  const toggleSession = (idx: number) => {
    const updated = [...sessions];
    updated[idx].selected = !updated[idx].selected;
    setSessions(updated);
  };

  const importSelected = () => {
    const selected = sessions.filter((s) => s.selected);
    const newItems: InvoiceItem[] = selected.map((s) => ({
      id: crypto.randomUUID(),
      description: s.observacoes || "Desenvolvimento",
      date: format(new Date(s.hora_inicio), "yyyy-MM-dd"),
      hours: Math.round(((s.duracao_segundos || 0) / 3600) * 100) / 100,
      rate: hourlyRate,
      amount: Math.round(((s.duracao_segundos || 0) / 3600) * hourlyRate * 100) / 100,
    }));
    setItems([...items, ...newItems]);
    setImportOpen(false);
    toast({ title: `${newItems.length} sessões importadas` });
  };

  const handleSave = async (newStatus?: string) => {
    if (!user) return;

    const result = invoiceSchema.safeParse({ number, hourlyRate, discount, notes, items });
    if (!result.success) {
      const fieldErrors: InvoiceErrors = {};
      const itemDescErrors: string[] = Array(items.length).fill("");
      const itemDateErrors: string[] = Array(items.length).fill("");
      result.error.errors.forEach((err) => {
        const [field, idx, subfield] = err.path;
        if (field === "items" && typeof idx === "number") {
          if (subfield === "description") itemDescErrors[idx] = err.message;
          else if (subfield === "date") itemDateErrors[idx] = err.message;
        } else if (typeof field === "string" && field !== "items") {
          const key = field as keyof Omit<InvoiceErrors, "itemDescriptions" | "itemDates">;
          if (!fieldErrors[key]) fieldErrors[key] = err.message;
        }
      });
      if (itemDescErrors.some(Boolean)) fieldErrors.itemDescriptions = itemDescErrors;
      if (itemDateErrors.some(Boolean)) fieldErrors.itemDates = itemDateErrors;
      setErrors(fieldErrors);
      toast({ title: "Corrija os erros antes de salvar", variant: "destructive" });
      return;
    }
    setErrors({});

    setSaving(true);
    const finalStatus = newStatus || status;
    const invoiceData = {
      user_id: user.id,
      client_id: clientId || null,
      project_id: projectId || null,
      number,
      issue_date: format(issueDate, "yyyy-MM-dd"),
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      status: finalStatus,
      hourly_rate: hourlyRate,
      total_hours: totalHours,
      subtotal,
      discount,
      total,
      notes: notes || null,
      paid_at: finalStatus === "paga" ? (paidAt || new Date()).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let invoiceId = id;
    if (isEditing) {
      const { error } = await supabase.from("invoices").update(invoiceData).eq("id", id);
      if (error) { toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" }); setSaving(false); return; }
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
    } else {
      const { data, error } = await supabase.from("invoices").insert(invoiceData).select("id").single();
      if (error) { toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" }); setSaving(false); return; }
      invoiceId = data.id;
    }

    if (items.length > 0) {
      const { error } = await supabase.from("invoice_items").insert(
        items.map((i) => ({
          invoice_id: invoiceId,
          description: i.description,
          date: i.date || null,
          hours: i.hours,
          rate: i.rate,
          amount: i.amount,
        }))
      );
      if (error) { toast({ title: "Erro nos itens", description: getDbErrorMessage(error), variant: "destructive" }); }
    }

    toast({ title: "Fatura salva com sucesso!" });
    setSaving(false);
    navigate("/financeiro/faturas");
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/financeiro/faturas")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{isEditing ? "Editar Fatura" : "Nova Fatura"}</h1>
          <p className="text-sm font-light text-muted-foreground">{number}</p>
        </div>
      </div>

      {/* Header fields */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-lg font-medium">Dados da Fatura</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>Número *</Label>
            <Input
              value={number}
              onChange={(e) => { setNumber(e.target.value); if (errors.number) setErrors(p => ({ ...p, number: undefined })); }}
              className={errors.number ? "border-destructive" : ""}
            />
            {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setProjectId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Projeto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
              <SelectContent>
                {filteredProjects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Emissão</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !issueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {issueDate ? format(issueDate, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={issueDate} onSelect={(d) => d && setIssueDate(d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Valor/Hora (R$)</Label>
            <Input
              type="number" step="0.01" value={hourlyRate}
              onChange={(e) => { setHourlyRate(Number(e.target.value)); if (errors.hourlyRate) setErrors(p => ({ ...p, hourlyRate: undefined })); }}
              className={errors.hourlyRate ? "border-destructive" : ""}
            />
            {errors.hourlyRate && <p className="text-xs text-destructive">{errors.hourlyRate}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Itens da Fatura</CardTitle>
          <div className="flex gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Clock className="h-4 w-4" /> Importar Horas</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Importar Sessões do Cronômetro</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Data Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {importStart ? format(importStart, "dd/MM/yyyy") : "Início"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={importStart} onSelect={setImportStart} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Data Fim</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {importEnd ? format(importEnd, "dd/MM/yyyy") : "Fim"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={importEnd} onSelect={setImportEnd} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {sessions.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-sm">Nenhuma sessão encontrada no período</p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessions.map((s, i) => (
                            <TableRow key={s.id}>
                              <TableCell><Checkbox checked={s.selected} onCheckedChange={() => toggleSession(i)} /></TableCell>
                              <TableCell className="text-sm">{format(new Date(s.hora_inicio), "dd/MM/yyyy HH:mm")}</TableCell>
                              <TableCell className="text-sm">{formatDuration(s.duracao_segundos || 0)}</TableCell>
                              <TableCell className="text-sm truncate max-w-[200px]">{s.observacoes || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button onClick={importSelected} disabled={!sessions.some((s) => s.selected)} className="w-full">
                        Adicionar Selecionadas ({sessions.filter((s) => s.selected).length})
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-4 w-4" /> Linha</Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Nenhum item. Adicione uma linha ou importe horas do cronômetro.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium min-w-[200px]">Descrição</TableHead>
                    <TableHead className="font-medium w-[130px]">Data</TableHead>
                    <TableHead className="font-medium w-[100px]">Horas</TableHead>
                    <TableHead className="font-medium w-[120px]">Valor/h</TableHead>
                    <TableHead className="font-medium w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            updateItem(i, "description", e.target.value);
                            if (errors.itemDescriptions?.[i]) {
                              const updated = [...(errors.itemDescriptions ?? [])];
                              updated[i] = "";
                              setErrors(p => ({ ...p, itemDescriptions: updated }));
                            }
                          }}
                          placeholder="Descrição"
                          className={cn("h-8", errors.itemDescriptions?.[i] && "border-destructive")}
                        />
                        {errors.itemDescriptions?.[i] && (
                          <p className="text-xs text-destructive mt-1">{errors.itemDescriptions[i]}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => {
                            updateItem(i, "date", e.target.value);
                            if (errors.itemDates?.[i]) {
                              const updated = [...(errors.itemDates ?? [])];
                              updated[i] = "";
                              setErrors(p => ({ ...p, itemDates: updated }));
                            }
                          }}
                          className={cn("h-8", errors.itemDates?.[i] && "border-destructive")}
                        />
                        {errors.itemDates?.[i] && (
                          <p className="text-xs text-destructive mt-1">{errors.itemDates[i]}</p>
                        )}
                      </TableCell>
                      <TableCell><Input type="number" step="0.01" value={item.hours} onChange={(e) => updateItem(i, "hours", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={item.rate} onChange={(e) => updateItem(i, "rate", Number(e.target.value))} className="h-8" /></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeItem(i)}><X className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <div className="space-y-1">
                    <Input
                      type="number" step="0.01" value={discount}
                      onChange={(e) => { setDiscount(Number(e.target.value)); if (errors.discount) setErrors(p => ({ ...p, discount: undefined })); }}
                      className={cn("h-8 w-32 text-right", errors.discount && "border-destructive")}
                    />
                    {errors.discount && <p className="text-xs text-destructive text-right">{errors.discount}</p>}
                  </div>
                </div>
                <div className="flex justify-between text-lg border-t border-border pt-3">
                  <span className="font-medium">Total</span>
                  <span className="font-extrabold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-lg font-medium">Observações</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); if (errors.notes) setErrors(p => ({ ...p, notes: undefined })); }}
            rows={3}
            placeholder="Notas adicionais..."
            className={errors.notes ? "border-destructive" : ""}
          />
          {errors.notes && <p className="text-xs text-destructive mt-1">{errors.notes}</p>}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end pb-8">
        <Button variant="outline" onClick={() => handleSave("rascunho")} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Salvar Rascunho
        </Button>
        <Button variant="outline" onClick={() => handleSave("enviada")} disabled={saving} className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Send className="h-4 w-4" /> Marcar como Enviada
        </Button>
        <Button onClick={() => handleSave("paga")} disabled={saving} className="gap-2">
          <CheckCircle className="h-4 w-4" /> Marcar como Paga
        </Button>
      </div>
    </div>
  );
};

export default InvoiceForm;
