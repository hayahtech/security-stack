import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Transaction } from "@/data/types";
import { paymentInstruments, categories, costCenters, people } from "@/data/financeiro-mock";
import { DocumentUpload, type InvoiceData } from "./DocumentUpload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (txn: Transaction) => void;
}

export function TransactionFormDrawer({ open, onOpenChange, onSave }: Props) {
  const [type, setType] = useState<"receita" | "despesa" | "transferencia">("despesa");
  const [txnDate, setTxnDate] = useState<Date | undefined>(new Date());
  const [competenceMonth, setCompetenceMonth] = useState(format(new Date(), "yyyy-MM"));
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [payerId, setPayerId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("mensal");
  const [notes, setNotes] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const reset = () => {
    setType("despesa"); setDescription(""); setMerchant(""); setAmount("");
    setInstrumentId(""); setCategoryId(""); setSubcategory(""); setCostCenterId("");
    setTags([]); setPayerId(""); setBeneficiaryId(""); setIsInstallment(false);
    setIsRecurring(false); setNotes(""); setTxnDate(new Date()); setAttachedFile(null);
  };

  const handleInvoiceData = (data: InvoiceData) => {
    if (data.fornecedor_nome) setMerchant(data.fornecedor_nome);
    if (data.valor_total) setAmount(String(data.valor_total));
    if (data.data_emissao) {
      try { setTxnDate(new Date(data.data_emissao)); } catch { /* ignore */ }
    }
    if (data.numero_nota) {
      setDescription((prev) => prev || `NF ${data.numero_nota}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const txn: Transaction = {
      id: `txn-new-${Date.now()}`,
      type,
      txn_date: txnDate ? format(txnDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      competence_month: competenceMonth,
      description,
      merchant,
      amount: parseFloat(amount) || 0,
      instrument_id: instrumentId,
      category_id: categoryId,
      subcategory,
      cost_center_id: costCenterId,
      tags,
      status: "pendente",
      payer_person_id: payerId || null,
      beneficiary_person_id: beneficiaryId || null,
      notes,
      has_attachment: !!attachedFile,
    };
    onSave(txn);
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Nova Transação</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Documento Fiscal</Label>
            <DocumentUpload
              onDataExtracted={handleInvoiceData}
              onFileAttached={setAttachedFile}
            />
          </div>

          <Separator />

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              {(["receita", "despesa", "transferencia"] as const).map((t) => (
                <Button key={t} type="button" variant={type === t ? "default" : "outline"} size="sm"
                  onClick={() => setType(t)} className="flex-1 capitalize">
                  {t === "transferencia" ? "Transferência" : t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Date & Competence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !txnDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {txnDate ? format(txnDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={txnDate} onSelect={setTxnDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Competência</Label>
              <Input type="month" value={competenceMonth} onChange={(e) => setCompetenceMonth(e.target.value)} />
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Compra de ração" required />
          </div>
          <div className="space-y-2">
            <Label>Merchant / Fornecedor</Label>
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Ex: Nutrifarm" />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required />
          </div>

          {/* Instrument */}
          <div className="space-y-2">
            <Label>Conta / Cartão</Label>
            <Select value={instrumentId} onValueChange={setInstrumentId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {paymentInstruments.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategory(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={!selectedCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {selectedCategory?.subcategories.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Center */}
          <div className="space-y-2">
            <Label>Centro de Custo (opcional)</Label>
            <Select value={costCenterId} onValueChange={setCostCenterId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Adicionar tag..." className="flex-1" />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Payer & Beneficiary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Pagador</Label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beneficiário</Label>
              <Select value={beneficiaryId} onValueChange={setBeneficiaryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {people.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Installment */}
          <div className="flex items-center justify-between">
            <Label>Parcelado?</Label>
            <Switch checked={isInstallment} onCheckedChange={setIsInstallment} />
          </div>
          {isInstallment && (
            <div className="space-y-2">
              <Label>Número de Parcelas</Label>
              <Input type="number" min="2" value={installments} onChange={(e) => setInstallments(e.target.value)} />
            </div>
          )}

          {/* Recurring */}
          <div className="flex items-center justify-between">
            <Label>Recorrente?</Label>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
          {isRecurring && (
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais..." rows={3} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Salvar</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
