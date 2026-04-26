import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Printer, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { getDbErrorMessage } from "@/lib/utils";
import { validateDocument, formatDocument } from "@/lib/cnpj";
import hayahLogo from "@/assets/hayah-logo.jpeg";

const COMPANY = {
  name: import.meta.env.VITE_COMPANY_NAME ?? "HayaH Tech",
  cnpj: import.meta.env.VITE_COMPANY_CNPJ ?? "",
  phone: import.meta.env.VITE_COMPANY_PHONE ?? "",
  website: import.meta.env.VITE_COMPANY_WEBSITE ?? "",
};

interface QuoteData {
  hourlyRate: number;
  hours: number;
  complexityLabel: string;
  complexityValue: number;
  basePrice: number;
  marginPercent: number;
  marginValue: number;
  extraCosts: number;
  extraCostsDescription: string;
  suggestedPrice: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: QuoteData;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const QuoteDialog = ({ open, onOpenChange, data }: Props) => {
  const { user } = useAuth();
  const [client, setClient] = useState({ name: "", document: "", phone: "", email: "" });
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("pt-BR");

  const handleDocumentBlur = () => {
    if (!client.document) return;
    // Formata automaticamente ao sair do campo
    const formatted = formatDocument(client.document);
    setClient(prev => ({ ...prev, document: formatted }));
    setDocumentError(validateDocument(formatted));
  };

  const handleDocumentChange = (value: string) => {
    const upper = value.toUpperCase();
    setClient(prev => ({ ...prev, document: upper }));
    if (documentError) setDocumentError(validateDocument(upper));
  };

  const handleSave = async () => {
    if (!user) return;
    const docErr = validateDocument(client.document);
    if (docErr) { setDocumentError(docErr); return; }
    setSaving(true);
    const { error } = await supabase.from("saved_quotes").insert({
      user_id: user.id,
      client_name: client.name,
      client_document: client.document || null,
      client_phone: client.phone || null,
      client_email: client.email || null,
      hourly_rate: data.hourlyRate,
      hours: data.hours,
      complexity_label: data.complexityLabel,
      complexity_value: data.complexityValue,
      base_price: data.basePrice,
      margin_percent: data.marginPercent,
      margin_value: data.marginValue,
      extra_costs: data.extraCosts,
      extra_costs_description: data.extraCostsDescription || null,
      suggested_price: data.suggestedPrice,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: getDbErrorMessage(error), variant: "destructive" });
    } else {
      toast({ title: "Orçamento salvo com sucesso!" });
    }
  };

  // Escapa caracteres HTML para prevenir XSS ao serializar conteúdo do DOM
  const escapeHtml = (node: HTMLElement): string => {
    const clone = node.cloneNode(true) as HTMLElement;
    // Remove atributos de evento (onclick, onload, etc.) de todos os elementos
    clone.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
      });
      // Remove tags script e iframe injetadas
      if (el.tagName === "SCRIPT" || el.tagName === "IFRAME") el.remove();
    });
    return clone.innerHTML;
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const safeContent = escapeHtml(content);
    win.document.write(`
      <html><head><title>Orçamento HayaH Tech</title>
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; script-src 'none';">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; padding: 40px; font-size: 14px; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #00b4d8; padding-bottom: 20px; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-section img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; }
        .logo-section h1 { font-size: 22px; color: #00b4d8; font-weight: 800; }
        .company-info { font-size: 12px; color: #555; line-height: 1.5; }
        .date-section { text-align: right; font-size: 12px; color: #777; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .party { padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .party h3 { font-size: 13px; color: #00b4d8; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
        .party p { font-size: 13px; color: #333; }
        .details { margin-bottom: 30px; }
        .details h3 { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 6px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
        .detail-row.total { border-top: 2px solid #00b4d8; border-bottom: none; font-size: 18px; font-weight: 800; color: #00b4d8; padding-top: 14px; margin-top: 6px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
      </style></head><body>
      ${safeContent}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setShowPreview(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Orçamento</DialogTitle>
          </DialogHeader>

          <div ref={printRef}>
            <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: "3px solid #00b4d8", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={hayahLogo} alt="HayaH Tech" style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }} />
                <div>
                  <h1 style={{ fontSize: 22, color: "#00b4d8", fontWeight: 800 }}>{COMPANY.name}</h1>
                  {COMPANY.cnpj && <p style={{ fontSize: 12, color: "#555" }}>CNPJ: {COMPANY.cnpj}</p>}
                  {COMPANY.phone && <p style={{ fontSize: 12, color: "#555" }}>Tel: {COMPANY.phone}</p>}
                  {COMPANY.website && <p style={{ fontSize: 12, color: "#555" }}>{COMPANY.website}</p>}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "#777" }}>
                <p><strong>Data:</strong> {today}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#00b4d8", marginTop: 4 }}>ORÇAMENTO</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ padding: 14, border: "1px solid #e0e0e0", borderRadius: 8 }}>
                <h3 style={{ fontSize: 13, color: "#00b4d8", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Prestador de Serviços</h3>
                <p style={{ fontSize: 13 }}><strong>{COMPANY.name}</strong></p>
                {COMPANY.cnpj && <p style={{ fontSize: 12, color: "#555" }}>CNPJ: {COMPANY.cnpj}</p>}
                {COMPANY.phone && <p style={{ fontSize: 12, color: "#555" }}>Tel: {COMPANY.phone}</p>}
                {COMPANY.website && <p style={{ fontSize: 12, color: "#555" }}>{COMPANY.website}</p>}
              </div>
              <div style={{ padding: 14, border: "1px solid #e0e0e0", borderRadius: 8 }}>
                <h3 style={{ fontSize: 13, color: "#00b4d8", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Cliente</h3>
                <p style={{ fontSize: 13 }}><strong>{client.name || "—"}</strong></p>
                {client.document && <p style={{ fontSize: 12, color: "#555" }}>CNPJ/CPF: {client.document}</p>}
                {client.phone && <p style={{ fontSize: 12, color: "#555" }}>Tel: {client.phone}</p>}
                {client.email && <p style={{ fontSize: 12, color: "#555" }}>Email: {client.email}</p>}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, borderBottom: "1px solid #eee", paddingBottom: 6 }}>Detalhamento do Orçamento</h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                <span>Valor/hora</span><span>R$ {fmt(data.hourlyRate)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                <span>Horas estimadas</span><span>{data.hours}h</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                <span>Complexidade</span><span>{data.complexityLabel} (x{data.complexityValue})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                <span>Subtotal (base)</span><span>R$ {fmt(data.basePrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                <span>Margem de lucro ({data.marginPercent}%)</span><span>R$ {fmt(data.marginValue)}</span>
              </div>
              {data.extraCosts > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                    <span>Custos adicionais</span><span>R$ {fmt(data.extraCosts)}</span>
                  </div>
                  {data.extraCostsDescription && (
                    <div style={{ padding: "4px 0 8px", fontSize: 11, color: "#777", fontStyle: "italic", borderBottom: "1px solid #f5f5f5" }}>
                      {data.extraCostsDescription}
                    </div>
                  )}
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #00b4d8", fontSize: 18, fontWeight: 800, color: "#00b4d8", paddingTop: 14, marginTop: 6 }}>
                <span>VALOR TOTAL</span><span>R$ {fmt(data.suggestedPrice)}</span>
              </div>
            </div>

            <div style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "#999", borderTop: "1px solid #eee", paddingTop: 15 }}>
              {COMPANY.name} — Soluções em Tecnologia{COMPANY.website ? ` • ${COMPANY.website}` : ""}{COMPANY.phone ? ` • ${COMPANY.phone}` : ""}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="default" onClick={() => setShowPreview(false)}>Voltar</Button>
            <Button variant="secondary" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" /> Imprimir / PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Dados do Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome / Razão Social *</Label>
            <Input placeholder="Nome do cliente" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ ou CPF</Label>
            <Input
              placeholder="00.000.000/0000-00 ou 00.000.000/AB12-34 (alfanumérico)"
              value={client.document}
              onChange={e => handleDocumentChange(e.target.value)}
              onBlur={handleDocumentBlur}
              className={documentError ? "border-destructive" : ""}
            />
            {documentError && <p className="text-xs text-destructive">{documentError}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input placeholder="(00) 00000-0000" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@exemplo.com" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => setShowPreview(true)} disabled={!client.name.trim()} className="gap-2">
            <FileText className="h-4 w-4" /> Gerar Orçamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDialog;
