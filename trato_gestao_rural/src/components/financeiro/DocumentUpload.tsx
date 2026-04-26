import React, { useState, useRef } from "react";
import { Upload, FileText, X, Sparkles, Check, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

export interface InvoiceItem {
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export interface InvoiceData {
  data_emissao?: string;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  numero_nota?: string;
  valor_total?: number;
  itens?: InvoiceItem[];
}

interface DocumentUploadProps {
  onDataExtracted?: (data: InvoiceData) => void;
  onFileAttached?: (file: File | null) => void;
}

// Simulated AI reading — replace with real Lovable AI edge function when Cloud is enabled
function simulateAIReading(): Promise<InvoiceData> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data_emissao: "2026-03-05",
        fornecedor_nome: "Nutrifarm Nutrição Animal Ltda",
        fornecedor_cnpj: "12.345.678/0001-90",
        numero_nota: "NF-2026/004521",
        valor_total: 8750.00,
        itens: [
          { descricao: "Ração Boi Gordo Premium 40kg", quantidade: 50, unidade: "sc", valor_unitario: 125.00, valor_total: 6250.00 },
          { descricao: "Sal Mineral Proteínado 25kg", quantidade: 20, unidade: "sc", valor_unitario: 85.00, valor_total: 1700.00 },
          { descricao: "Vermífugo Ivermectina 500ml", quantidade: 10, unidade: "un", valor_unitario: 80.00, valor_total: 800.00 },
        ],
      });
    }, 2000);
  });
}

export function DocumentUpload({ onDataExtracted, onFileAttached }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readStatus, setReadStatus] = useState<"none" | "success" | "warning">("none");
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [itemsOpen, setItemsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(f.type)) {
      toast({ title: "Formato inválido", description: "Aceito: JPG, PNG ou PDF", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo: 10MB", variant: "destructive" });
      return;
    }
    setFile(f);
    setReadStatus("none");
    setExtractedData(null);
    onFileAttached?.(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setReadStatus("none");
    setExtractedData(null);
    onFileAttached?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAIRead = async () => {
    if (!file) return;
    setIsReading(true);
    try {
      const data = await simulateAIReading();
      setExtractedData(data);
      setReadStatus("success");
      onDataExtracted?.(data);
      toast({ title: "Nota lida com sucesso!", description: "Verifique os dados extraídos" });
    } catch {
      setReadStatus("warning");
      toast({ title: "Erro na leitura", description: "Tente novamente ou preencha manualmente", variant: "destructive" });
    } finally {
      setIsReading(false);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    if (!extractedData?.itens) return;
    const newItems = [...extractedData.itens];
    newItems[index] = { ...newItems[index], [field]: value };
    setExtractedData({ ...extractedData, itens: newItems });
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
      {!file ? (
        <Button type="button" variant="outline" className="w-full min-h-[44px] gap-2 border-dashed" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" /> Anexar Nota/Cupom Fiscal
        </Button>
      ) : (
        <Card className="border-border">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-start gap-3">
              {preview ? (
                <img src={preview} alt="Preview" className="w-16 h-16 rounded-md object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center border border-border">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB • {file.type.split("/")[1].toUpperCase()}</p>
                {readStatus === "success" && (
                  <Badge variant="default" className="mt-1 gap-1 bg-primary/10 text-primary border-transparent text-xs">
                    <Check className="h-3 w-3" /> Lido automaticamente
                  </Badge>
                )}
                {readStatus === "warning" && (
                  <Badge variant="secondary" className="mt-1 gap-1 text-amber-600 dark:text-amber-400 text-xs">
                    <AlertTriangle className="h-3 w-3" /> Verifique os dados
                  </Badge>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {readStatus === "none" && (
              <Button type="button" variant="secondary" className="w-full min-h-[44px] gap-2" onClick={handleAIRead} disabled={isReading}>
                {isReading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isReading ? "Lendo documento..." : "Ler automaticamente com IA"}
              </Button>
            )}
            {extractedData?.itens && extractedData.itens.length > 0 && (
              <Collapsible open={itemsOpen} onOpenChange={setItemsOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="w-full justify-between text-sm h-9 px-2">
                    <span>Itens da Nota ({extractedData.itens.length})</span>
                    {itemsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {extractedData.itens.map((item, i) => (
                    <div key={i} className="rounded-md bg-muted p-2.5 space-y-2">
                      <Input value={item.descricao} onChange={(e) => updateItem(i, "descricao", e.target.value)} className="text-sm h-8" />
                      <div className="grid grid-cols-4 gap-2">
                        <div><Label className="text-[10px] text-muted-foreground">Qtd</Label>
                          <Input type="number" value={item.quantidade} onChange={(e) => updateItem(i, "quantidade", Number(e.target.value))} className="text-sm h-8" /></div>
                        <div><Label className="text-[10px] text-muted-foreground">Und</Label>
                          <Input value={item.unidade} onChange={(e) => updateItem(i, "unidade", e.target.value)} className="text-sm h-8" /></div>
                        <div><Label className="text-[10px] text-muted-foreground">V. Unit</Label>
                          <Input type="number" step="0.01" value={item.valor_unitario} onChange={(e) => updateItem(i, "valor_unitario", Number(e.target.value))} className="text-sm h-8" /></div>
                        <div><Label className="text-[10px] text-muted-foreground">Total</Label>
                          <Input type="number" step="0.01" value={item.valor_total} onChange={(e) => updateItem(i, "valor_total", Number(e.target.value))} className="text-sm h-8" /></div>
                      </div>
                    </div>
                  ))}
                  {extractedData.fornecedor_cnpj && (
                    <p className="text-xs text-muted-foreground px-1">CNPJ: {extractedData.fornecedor_cnpj} • NF: {extractedData.numero_nota}</p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Standalone document viewer modal
export function DocumentViewerModal({ file, open, onOpenChange }: {
  file: { name: string; url: string; type: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!file) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader><DialogTitle>{file.name}</DialogTitle></DialogHeader>
        <div className="flex items-center justify-center min-h-[300px]">
          {file.type.startsWith("image") ? (
            <img src={file.url} alt={file.name} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
          ) : (
            <div className="text-center space-y-3">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">{file.name}</p>
              <Button variant="outline" onClick={() => window.open(file.url, "_blank")}>Abrir PDF</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
