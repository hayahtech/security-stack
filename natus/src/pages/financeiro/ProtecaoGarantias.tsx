import { useState, useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, FileText, Plus, AlertTriangle, CheckCircle2, XCircle, Clock, Phone, Heart, Car, Home, Smartphone, Upload, Search, Filter, Siren } from "lucide-react";
import { differenceInDays, differenceInMonths, format, parseISO, addMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ───
interface WarrantyProduct {
  id: string;
  name: string;
  category: "eletronico" | "eletrodomestico" | "veiculo" | "ferramenta" | "outro";
  purchaseDate: string;
  price: number;
  store: string;
  legalWarrantyDays: number;
  manufacturerWarrantyMonths: number;
  extendedWarrantyMonths: number;
  serialNumber: string;
  notes: string;
}

interface InsurancePolicy {
  id: string;
  type: "vida" | "saude" | "veiculo" | "residencial" | "odontologico" | "viagem" | "acidentes" | "prestamista" | "outro";
  insurer: string;
  policyNumber: string;
  beneficiary: string;
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: "mensal" | "trimestral" | "semestral" | "anual";
  startDate: string;
  endDate: string;
  claimsPhone: string;
  coverages: string[];
  exclusions: string;
}

interface ImportantDocument {
  id: string;
  name: string;
  category: "pessoal" | "imovel" | "veiculo" | "financeiro" | "saude" | "outro";
  familyMember: string;
  documentDate: string;
  expiryDate?: string;
  notes: string;
}

// ─── Mock Data ───
const mockWarranties: WarrantyProduct[] = [
  { id: "w1", name: "Notebook Dell XPS 15", category: "eletronico", purchaseDate: "2025-08-15", price: 8500, store: "Dell Online", legalWarrantyDays: 90, manufacturerWarrantyMonths: 12, extendedWarrantyMonths: 24, serialNumber: "DXP15-2025-78493", notes: "Assistência: 0800-728-3355" },
  { id: "w2", name: "Geladeira Brastemp Frost Free", category: "eletrodomestico", purchaseDate: "2024-03-10", price: 4200, store: "Magazine Luiza", legalWarrantyDays: 90, manufacturerWarrantyMonths: 12, extendedWarrantyMonths: 0, serialNumber: "BFR-442918", notes: "" },
  { id: "w3", name: "iPhone 15 Pro", category: "eletronico", purchaseDate: "2025-11-20", price: 7800, store: "Apple Store", legalWarrantyDays: 90, manufacturerWarrantyMonths: 12, extendedWarrantyMonths: 12, serialNumber: "IMEI 356938102847561", notes: "AppleCare+ contratado" },
  { id: "w4", name: "Furadeira Bosch GSB 13", category: "ferramenta", purchaseDate: "2025-01-05", price: 380, store: "Leroy Merlin", legalWarrantyDays: 90, manufacturerWarrantyMonths: 24, extendedWarrantyMonths: 0, serialNumber: "BSH-90182", notes: "" },
  { id: "w5", name: "TV Samsung 55\" QLED", category: "eletronico", purchaseDate: "2023-11-25", price: 3200, store: "Amazon", legalWarrantyDays: 90, manufacturerWarrantyMonths: 12, extendedWarrantyMonths: 0, serialNumber: "SM-QN55-882", notes: "Garantia expirada" },
];

const mockInsurance: InsurancePolicy[] = [
  { id: "s1", type: "saude", insurer: "Unimed", policyNumber: "UNI-2024-558291", beneficiary: "Família toda", coverageAmount: 0, premiumAmount: 1800, premiumFrequency: "mensal", startDate: "2024-01-01", endDate: "2027-01-01", claimsPhone: "0800-722-4000", coverages: ["Consultas", "Exames", "Internação", "Urgência", "Cirurgia"], exclusions: "Procedimentos estéticos" },
  { id: "s2", type: "vida", insurer: "Porto Seguro", policyNumber: "PS-VD-2025-3847", beneficiary: "Ana (Cônjuge)", coverageAmount: 500000, premiumAmount: 180, premiumFrequency: "mensal", startDate: "2025-03-01", endDate: "2026-03-01", claimsPhone: "0800-727-2766", coverages: ["Morte natural", "Morte acidental", "Invalidez permanente", "Doenças graves"], exclusions: "Suicídio nos 2 primeiros anos" },
  { id: "s3", type: "veiculo", insurer: "Tokio Marine", policyNumber: "TM-AU-887421", beneficiary: "Você", coverageAmount: 85000, premiumAmount: 4200, premiumFrequency: "anual", startDate: "2025-10-15", endDate: "2026-10-15", claimsPhone: "0800-723-9696", coverages: ["Colisão", "Roubo/Furto", "Terceiros R$100k", "Guincho 300km", "Carro reserva 15d"], exclusions: "Uso para transporte comercial" },
  { id: "s4", type: "residencial", insurer: "Bradesco Seguros", policyNumber: "BS-RES-2025-1129", beneficiary: "Você", coverageAmount: 350000, premiumAmount: 85, premiumFrequency: "mensal", startDate: "2025-06-01", endDate: "2026-06-01", claimsPhone: "0800-727-9966", coverages: ["Incêndio", "Raio", "Explosão", "Vendaval", "Responsabilidade civil"], exclusions: "" },
];

const mockDocuments: ImportantDocument[] = [
  { id: "d1", name: "CNH - Você", category: "pessoal", familyMember: "Você", documentDate: "2021-05-10", expiryDate: "2026-05-10", notes: "Categoria B" },
  { id: "d2", name: "Passaporte - Você", category: "pessoal", familyMember: "Você", documentDate: "2022-08-20", expiryDate: "2032-08-20", notes: "" },
  { id: "d3", name: "Passaporte - Ana", category: "pessoal", familyMember: "Ana", documentDate: "2023-02-15", expiryDate: "2033-02-15", notes: "" },
  { id: "d4", name: "Escritura do imóvel", category: "imovel", familyMember: "Você", documentDate: "2020-03-12", notes: "Matrícula 45.891 - 3º CRI" },
  { id: "d5", name: "CRLV Hilux 2024", category: "veiculo", familyMember: "Você", documentDate: "2025-01-15", expiryDate: "2026-01-15", notes: "Placa ABC1D23" },
  { id: "d6", name: "Declaração IRPF 2025", category: "financeiro", familyMember: "Você", documentDate: "2025-04-28", notes: "Restituição: 2º lote" },
  { id: "d7", name: "Carteirinha Unimed", category: "saude", familyMember: "Família", documentDate: "2024-01-01", expiryDate: "2027-01-01", notes: "Plano familiar" },
  { id: "d8", name: "Certidão de nascimento - Pedro", category: "pessoal", familyMember: "Pedro", documentDate: "2012-09-12", notes: "" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const WARRANTY_CATEGORY_LABELS: Record<string, string> = { eletronico: "Eletrônico", eletrodomestico: "Eletrodoméstico", veiculo: "Veículo", ferramenta: "Ferramenta", outro: "Outro" };
const WARRANTY_CATEGORY_ICONS: Record<string, string> = { eletronico: "📱", eletrodomestico: "🏠", veiculo: "🚗", ferramenta: "🔧", outro: "📦" };

const INSURANCE_TYPE_LABELS: Record<string, string> = { vida: "Vida", saude: "Saúde", veiculo: "Veículo", residencial: "Residencial", odontologico: "Odontológico", viagem: "Viagem", acidentes: "Acidentes Pessoais", prestamista: "Prestamista", outro: "Outro" };
const INSURANCE_TYPE_ICONS: Record<string, string> = { vida: "❤️", saude: "🏥", veiculo: "🚗", residencial: "🏠", odontologico: "🦷", viagem: "✈️", acidentes: "🩹", prestamista: "📄", outro: "📋" };

const DOC_CATEGORY_LABELS: Record<string, string> = { pessoal: "Pessoal", imovel: "Imóvel", veiculo: "Veículo", financeiro: "Financeiro", saude: "Saúde", outro: "Outro" };
const DOC_CATEGORY_ICONS: Record<string, string> = { pessoal: "🪪", imovel: "🏠", veiculo: "🚗", financeiro: "💰", saude: "🏥", outro: "📄" };

const FREQ_TO_MONTHLY: Record<string, number> = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };

function getWarrantyEnd(w: WarrantyProduct) {
  const purchase = parseISO(w.purchaseDate);
  const legal = addDays(purchase, w.legalWarrantyDays);
  const manufacturer = addMonths(purchase, w.manufacturerWarrantyMonths);
  const extended = w.extendedWarrantyMonths > 0 ? addMonths(manufacturer, w.extendedWarrantyMonths) : manufacturer;
  const dates = [legal, manufacturer];
  if (w.extendedWarrantyMonths > 0) dates.push(extended);
  return dates.reduce((a, b) => (a > b ? a : b), legal);
}

function getWarrantyStatus(w: WarrantyProduct) {
  const end = getWarrantyEnd(w);
  const daysLeft = differenceInDays(end, new Date());
  if (daysLeft < 0) return { status: "expired" as const, daysLeft, label: "Expirada", color: "text-destructive" };
  if (daysLeft <= 30) return { status: "expiring" as const, daysLeft, label: `Vence em ${daysLeft}d`, color: "text-warning" };
  const monthsLeft = differenceInMonths(end, new Date());
  return { status: "active" as const, daysLeft, label: `${monthsLeft} meses restantes`, color: "text-primary" };
}

function getInsuranceStatus(p: InsurancePolicy) {
  const end = parseISO(p.endDate);
  const daysLeft = differenceInDays(end, new Date());
  if (daysLeft < 0) return { status: "expired" as const, daysLeft, label: "Vencido" };
  if (daysLeft <= 30) return { status: "expiring" as const, daysLeft, label: `Vence em ${daysLeft}d` };
  if (daysLeft <= 90) return { status: "attention" as const, daysLeft, label: `Vence em ${daysLeft}d` };
  return { status: "active" as const, daysLeft, label: "Ativo" };
}

function getDocStatus(d: ImportantDocument) {
  if (!d.expiryDate) return null;
  const end = parseISO(d.expiryDate);
  const daysLeft = differenceInDays(end, new Date());
  if (daysLeft < 0) return { status: "expired" as const, daysLeft, label: "Vencido" };
  if (daysLeft <= 30) return { status: "expiring" as const, daysLeft, label: `Vence em ${daysLeft}d` };
  if (daysLeft <= 90) return { status: "attention" as const, daysLeft, label: `Vence em ${daysLeft}d` };
  return { status: "active" as const, daysLeft, label: `Válido — ${daysLeft}d` };
}

// ─── Sub-components ───

function WarrantyCard({ w }: { w: WarrantyProduct }) {
  const st = getWarrantyStatus(w);
  const end = getWarrantyEnd(w);
  return (
    <Card className={cn("hover:shadow-md transition-shadow", st.status === "expiring" && "border-warning/40", st.status === "expired" && "border-destructive/30")}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{WARRANTY_CATEGORY_ICONS[w.category]}</span>
            <div>
              <p className="font-semibold text-foreground text-sm">{w.name}</p>
              <p className="text-xs text-muted-foreground">{WARRANTY_CATEGORY_LABELS[w.category]} • {w.store}</p>
            </div>
          </div>
          <Badge variant={st.status === "active" ? "default" : st.status === "expiring" ? "secondary" : "destructive"} className="text-xs shrink-0">
            {st.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {st.status === "expiring" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {st.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
            {st.label}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-3">
          <div><span className="text-muted-foreground">Compra:</span> <span className="text-foreground">{format(parseISO(w.purchaseDate), "dd/MM/yyyy")}</span></div>
          <div><span className="text-muted-foreground">Valor:</span> <span className="text-foreground">{fmt(w.price)}</span></div>
          <div><span className="text-muted-foreground">Garantia até:</span> <span className={st.color}>{format(end, "dd/MM/yyyy")}</span></div>
          {w.serialNumber && <div><span className="text-muted-foreground">S/N:</span> <span className="text-foreground font-mono text-[10px]">{w.serialNumber}</span></div>}
        </div>
        <div className="flex gap-2 mt-3 text-[10px]">
          <Badge variant="outline" className="text-[10px]">Legal: {w.legalWarrantyDays}d</Badge>
          <Badge variant="outline" className="text-[10px]">Fabricante: {w.manufacturerWarrantyMonths}m</Badge>
          {w.extendedWarrantyMonths > 0 && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Estendida: +{w.extendedWarrantyMonths}m</Badge>}
        </div>
        {w.notes && <p className="text-xs text-muted-foreground mt-2 italic">{w.notes}</p>}
      </CardContent>
    </Card>
  );
}

function InsuranceCard({ p }: { p: InsurancePolicy }) {
  const st = getInsuranceStatus(p);
  const monthlyPremium = p.premiumAmount / (FREQ_TO_MONTHLY[p.premiumFrequency] || 1);
  return (
    <Card className={cn("hover:shadow-md transition-shadow", st.status === "expiring" && "border-destructive/40", st.status === "attention" && "border-warning/40")}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{INSURANCE_TYPE_ICONS[p.type]}</span>
            <div>
              <p className="font-semibold text-foreground text-sm">Seguro {INSURANCE_TYPE_LABELS[p.type]}</p>
              <p className="text-xs text-muted-foreground">{p.insurer} • {p.policyNumber}</p>
            </div>
          </div>
          <Badge variant={st.status === "active" ? "default" : st.status === "expired" ? "destructive" : "secondary"} className="text-xs shrink-0">
            {st.label}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-3">
          <div><span className="text-muted-foreground">Beneficiário:</span> <span className="text-foreground">{p.beneficiary}</span></div>
          {p.coverageAmount > 0 && <div><span className="text-muted-foreground">Cobertura:</span> <span className="text-foreground font-medium">{fmt(p.coverageAmount)}</span></div>}
          <div><span className="text-muted-foreground">Prêmio:</span> <span className="text-foreground">{fmt(p.premiumAmount)}/{p.premiumFrequency === "mensal" ? "mês" : p.premiumFrequency}</span></div>
          <div><span className="text-muted-foreground">Vigência:</span> <span className="text-foreground">{format(parseISO(p.startDate), "dd/MM/yy")} — {format(parseISO(p.endDate), "dd/MM/yy")}</span></div>
        </div>
        {p.coverages.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {p.coverages.slice(0, 4).map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
            {p.coverages.length > 4 && <Badge variant="outline" className="text-[10px]">+{p.coverages.length - 4}</Badge>}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">≈ {fmt(monthlyPremium)}/mês</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{p.claimsPhone}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentRow({ d }: { d: ImportantDocument }) {
  const st = getDocStatus(d);
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-lg">{DOC_CATEGORY_ICONS[d.category]}</span>
        <div>
          <p className="text-sm font-medium text-foreground">{d.name}</p>
          <p className="text-xs text-muted-foreground">{d.familyMember} • {DOC_CATEGORY_LABELS[d.category]}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {st && (
          <Badge variant={st.status === "active" ? "secondary" : st.status === "expired" ? "destructive" : "secondary"} className={cn("text-xs", st.status === "attention" && "border-warning/40 text-warning-foreground", st.status === "expiring" && "border-destructive/40")}>
            {st.label}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7"><FileText className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

// ─── Main ───
export default function ProtecaoGarantias() {
  const { isEmpresarial } = useProfile();
  const [warranties] = useState(mockWarranties);
  const [insurance] = useState(mockInsurance);
  const [documents] = useState(mockDocuments);
  const [warrantyFilter, setWarrantyFilter] = useState("all");
  const [docFilter, setDocFilter] = useState("all");
  const [showAddWarranty, setShowAddWarranty] = useState(false);
  const [showAddInsurance, setShowAddInsurance] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states — warranty
  const [wName, setWName] = useState("");
  const [wCategory, setWCategory] = useState("eletronico");
  const [wDate, setWDate] = useState("");
  const [wPrice, setWPrice] = useState("");
  const [wStore, setWStore] = useState("");
  const [wManufacturer, setWManufacturer] = useState("12");
  const [wExtended, setWExtended] = useState("0");
  const [wSerial, setWSerial] = useState("");
  const [wNotes, setWNotes] = useState("");

  // Form states — insurance
  const [iType, setIType] = useState("vida");
  const [iInsurer, setIInsurer] = useState("");
  const [iPolicy, setIPolicy] = useState("");
  const [iBeneficiary, setIBeneficiary] = useState("");
  const [iCoverage, setICoverage] = useState("");
  const [iPremium, setIPremium] = useState("");
  const [iFrequency, setIFrequency] = useState("mensal");
  const [iStart, setIStart] = useState("");
  const [iEnd, setIEnd] = useState("");
  const [iPhone, setIPhone] = useState("");

  // Form states — document
  const [dName, setDName] = useState("");
  const [dCategory, setDCategory] = useState("pessoal");
  const [dMember, setDMember] = useState("");
  const [dDate, setDDate] = useState("");
  const [dExpiry, setDExpiry] = useState("");
  const [dNotes, setDNotes] = useState("");

  // Computed
  const totalMonthlyInsurance = useMemo(() =>
    insurance.reduce((s, p) => s + p.premiumAmount / (FREQ_TO_MONTHLY[p.premiumFrequency] || 1), 0),
  [insurance]);

  const totalCoverage = useMemo(() =>
    insurance.reduce((s, p) => s + p.coverageAmount, 0),
  [insurance]);

  const missingInsurance = useMemo(() => {
    const existing = new Set(insurance.map(i => i.type));
    const recommended: InsurancePolicy["type"][] = ["vida", "saude", "residencial"];
    return recommended.filter(t => !existing.has(t));
  }, [insurance]);

  const filteredWarranties = useMemo(() => {
    let list = warranties;
    if (warrantyFilter !== "all") {
      if (warrantyFilter === "active") list = list.filter(w => getWarrantyStatus(w).status === "active");
      else if (warrantyFilter === "expiring") list = list.filter(w => getWarrantyStatus(w).status === "expiring");
      else if (warrantyFilter === "expired") list = list.filter(w => getWarrantyStatus(w).status === "expired");
      else list = list.filter(w => w.category === warrantyFilter);
    }
    if (searchTerm) list = list.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [warranties, warrantyFilter, searchTerm]);

  const filteredDocs = useMemo(() => {
    let list = documents;
    if (docFilter !== "all") list = list.filter(d => d.category === docFilter);
    if (searchTerm) list = list.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [documents, docFilter, searchTerm]);

  const expiringAlerts = useMemo(() => {
    const alerts: { type: string; name: string; daysLeft: number; icon: string }[] = [];
    warranties.forEach(w => {
      const st = getWarrantyStatus(w);
      if (st.status === "expiring") alerts.push({ type: "Garantia", name: w.name, daysLeft: st.daysLeft, icon: "🛡️" });
    });
    insurance.forEach(p => {
      const st = getInsuranceStatus(p);
      if (st.status === "expiring" || st.status === "attention") alerts.push({ type: "Seguro", name: `${INSURANCE_TYPE_LABELS[p.type]} - ${p.insurer}`, daysLeft: st.daysLeft, icon: INSURANCE_TYPE_ICONS[p.type] });
    });
    documents.forEach(d => {
      const st = getDocStatus(d);
      if (st && (st.status === "expiring" || st.status === "attention")) alerts.push({ type: "Documento", name: d.name, daysLeft: st.daysLeft, icon: DOC_CATEGORY_ICONS[d.category] });
    });
    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [warranties, insurance, documents]);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldCheck className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Proteção & Garantias</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal. Alterne seu perfil para acessar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proteção & Garantias</h1>
          <p className="text-muted-foreground">Seguros, garantias e documentos importantes</p>
        </div>
        <Button variant="destructive" onClick={() => setShowEmergency(true)} className="gap-2">
          <Siren className="h-4 w-4" /> Modo Emergência
        </Button>
      </div>

      {/* Alerts banner */}
      {expiringAlerts.length > 0 && (
        <Card className="border-warning/40">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="font-medium text-sm text-foreground">Alertas de vencimento ({expiringAlerts.length})</p>
            </div>
            <div className="space-y-1">
              {expiringAlerts.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1">
                  <span className="text-foreground">{a.icon} {a.type}: {a.name}</span>
                  <Badge variant={a.daysLeft <= 30 ? "destructive" : "secondary"} className="text-xs">{a.daysLeft}d</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar garantias, seguros ou documentos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="garantias" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="garantias">🛡️ Garantias</TabsTrigger>
          <TabsTrigger value="seguros">❤️ Seguros</TabsTrigger>
          <TabsTrigger value="documentos">📄 Documentos</TabsTrigger>
        </TabsList>

        {/* ═══ GARANTIAS ═══ */}
        <TabsContent value="garantias" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
              <SelectTrigger className="w-48"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue placeholder="Filtrar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">✅ Ativas</SelectItem>
                <SelectItem value="expiring">⚠️ Vencendo</SelectItem>
                <SelectItem value="expired">❌ Expiradas</SelectItem>
                <SelectItem value="eletronico">📱 Eletrônicos</SelectItem>
                <SelectItem value="eletrodomestico">🏠 Eletrodomésticos</SelectItem>
                <SelectItem value="veiculo">🚗 Veículos</SelectItem>
                <SelectItem value="ferramenta">🔧 Ferramentas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddWarranty(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova garantia</Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-5 text-center">
              <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{warranties.filter(w => getWarrantyStatus(w).status === "active").length}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 text-center">
              <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{warranties.filter(w => getWarrantyStatus(w).status === "expiring").length}</p>
              <p className="text-xs text-muted-foreground">Vencendo</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5 text-center">
              <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{warranties.filter(w => getWarrantyStatus(w).status === "expired").length}</p>
              <p className="text-xs text-muted-foreground">Expiradas</p>
            </CardContent></Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredWarranties.map(w => <WarrantyCard key={w.id} w={w} />)}
          </div>
          {filteredWarranties.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma garantia encontrada.</p>
          )}
        </TabsContent>

        {/* ═══ SEGUROS ═══ */}
        <TabsContent value="seguros" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setShowAddInsurance(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova apólice</Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Apólices ativas</p>
              <p className="text-2xl font-bold text-foreground">{insurance.filter(p => getInsuranceStatus(p).status === "active" || getInsuranceStatus(p).status === "attention").length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Custo mensal total</p>
              <p className="text-2xl font-bold text-foreground">{fmt(totalMonthlyInsurance)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Cobertura total</p>
              <p className="text-2xl font-bold text-foreground">{fmt(totalCoverage)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Custo anual</p>
              <p className="text-2xl font-bold text-foreground">{fmt(totalMonthlyInsurance * 12)}</p>
            </CardContent></Card>
          </div>

          {/* Gap analysis */}
          {missingInsurance.length > 0 && (
            <Card className="border-warning/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <p className="font-medium text-sm text-foreground">Análise de lacunas</p>
                </div>
                {missingInsurance.map(t => (
                  <p key={t} className="text-xs text-muted-foreground py-0.5">
                    ⚠️ Você não possui seguro <span className="font-medium text-foreground">{INSURANCE_TYPE_LABELS[t]}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {insurance.map(p => <InsuranceCard key={p.id} p={p} />)}
          </div>
        </TabsContent>

        {/* ═══ DOCUMENTOS ═══ */}
        <TabsContent value="documentos" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Select value={docFilter} onValueChange={setDocFilter}>
              <SelectTrigger className="w-48"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{DOC_CATEGORY_ICONS[k]} {v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddDocument(true)} className="gap-2"><Plus className="h-4 w-4" /> Novo documento</Button>
          </div>

          <div className="space-y-2">
            {filteredDocs.map(d => <DocumentRow key={d.id} d={d} />)}
          </div>
          {filteredDocs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum documento encontrado.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Dialogs ═══ */}

      {/* Add warranty */}
      <Dialog open={showAddWarranty} onOpenChange={setShowAddWarranty}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cadastrar Garantia</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do produto</Label><Input value={wName} onChange={e => setWName(e.target.value)} className="mt-1" placeholder="Ex: Notebook Dell XPS 15" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={wCategory} onValueChange={setWCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(WARRANTY_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{WARRANTY_CATEGORY_ICONS[k]} {v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data da compra</Label><Input type="date" value={wDate} onChange={e => setWDate(e.target.value)} className="mt-1" /></div>
              <div><Label>Valor pago (R$)</Label><Input type="number" value={wPrice} onChange={e => setWPrice(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Local de compra</Label><Input value={wStore} onChange={e => setWStore(e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Garantia fabricante (meses)</Label><Input type="number" value={wManufacturer} onChange={e => setWManufacturer(e.target.value)} className="mt-1" /></div>
              <div><Label>Garantia estendida (meses)</Label><Input type="number" value={wExtended} onChange={e => setWExtended(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Nº de série / IMEI</Label><Input value={wSerial} onChange={e => setWSerial(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Nota fiscal / Comprovante</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Arraste ou clique para enviar (PDF/JPG)</p>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={wNotes} onChange={e => setWNotes(e.target.value)} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWarranty(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddWarranty(false); toast({ title: "Garantia cadastrada", description: wName }); setWName(""); }}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add insurance */}
      <Dialog open={showAddInsurance} onOpenChange={setShowAddInsurance}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cadastrar Apólice de Seguro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo de seguro</Label>
              <Select value={iType} onValueChange={setIType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INSURANCE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{INSURANCE_TYPE_ICONS[k]} {v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Seguradora</Label><Input value={iInsurer} onChange={e => setIInsurer(e.target.value)} className="mt-1" /></div>
              <div><Label>Nº da apólice</Label><Input value={iPolicy} onChange={e => setIPolicy(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Beneficiário principal</Label><Input value={iBeneficiary} onChange={e => setIBeneficiary(e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor segurado (R$)</Label><Input type="number" value={iCoverage} onChange={e => setICoverage(e.target.value)} className="mt-1" /></div>
              <div><Label>Prêmio (R$)</Label><Input type="number" value={iPremium} onChange={e => setIPremium(e.target.value)} className="mt-1" /></div>
            </div>
            <div>
              <Label>Periodicidade</Label>
              <Select value={iFrequency} onValueChange={setIFrequency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início vigência</Label><Input type="date" value={iStart} onChange={e => setIStart(e.target.value)} className="mt-1" /></div>
              <div><Label>Fim vigência</Label><Input type="date" value={iEnd} onChange={e => setIEnd(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Telefone sinistros</Label><Input value={iPhone} onChange={e => setIPhone(e.target.value)} className="mt-1" placeholder="0800-..." /></div>
            <div>
              <Label>Apólice digital</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Arraste ou clique para enviar (PDF)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInsurance(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddInsurance(false); toast({ title: "Apólice cadastrada" }); setIInsurer(""); }}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add document */}
      <Dialog open={showAddDocument} onOpenChange={setShowAddDocument}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do documento</Label><Input value={dName} onChange={e => setDName(e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={dCategory} onValueChange={setDCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{DOC_CATEGORY_ICONS[k]} {v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Membro da família</Label><Input value={dMember} onChange={e => setDMember(e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data do documento</Label><Input type="date" value={dDate} onChange={e => setDDate(e.target.value)} className="mt-1" /></div>
              <div><Label>Validade (opcional)</Label><Input type="date" value={dExpiry} onChange={e => setDExpiry(e.target.value)} className="mt-1" /></div>
            </div>
            <div>
              <Label>Arquivo</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">PDF ou JPG</p>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={dNotes} onChange={e => setDNotes(e.target.value)} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDocument(false)}>Cancelar</Button>
            <Button onClick={() => { setShowAddDocument(false); toast({ title: "Documento adicionado" }); setDName(""); }}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Mode */}
      <Dialog open={showEmergency} onOpenChange={setShowEmergency}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-5 w-5" /> Modo Emergência
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Health insurance */}
            {insurance.filter(p => p.type === "saude").map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🏥</span>
                  <p className="font-semibold text-foreground text-sm">Plano de Saúde</p>
                </div>
                <p className="text-xs text-foreground">{p.insurer} — Apólice: <span className="font-mono">{p.policyNumber}</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3 text-primary" />
                  <span className="text-sm font-bold text-primary">{p.claimsPhone}</span>
                </div>
              </div>
            ))}

            {/* Life insurance */}
            {insurance.filter(p => p.type === "vida").map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">❤️</span>
                  <p className="font-semibold text-foreground text-sm">Seguro de Vida</p>
                </div>
                <p className="text-xs text-foreground">{p.insurer} — Apólice: <span className="font-mono">{p.policyNumber}</span></p>
                <p className="text-xs text-foreground">Beneficiário: <span className="font-medium">{p.beneficiary}</span></p>
                <p className="text-xs text-foreground">Cobertura: <span className="font-medium">{fmt(p.coverageAmount)}</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3 text-destructive" />
                  <span className="text-sm font-bold text-destructive">{p.claimsPhone}</span>
                </div>
              </div>
            ))}

            {/* Vehicle insurance */}
            {insurance.filter(p => p.type === "veiculo").map(p => (
              <div key={p.id} className="p-3 rounded-lg bg-info/5 border border-info/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🚗</span>
                  <p className="font-semibold text-foreground text-sm">Seguro Veicular</p>
                </div>
                <p className="text-xs text-foreground">{p.insurer} — Apólice: <span className="font-mono">{p.policyNumber}</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3 text-info" />
                  <span className="text-sm font-bold text-info-foreground">{p.claimsPhone}</span>
                </div>
              </div>
            ))}

            {/* Key documents */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="font-semibold text-foreground text-sm mb-2">📄 Documentos Importantes</p>
              {documents.filter(d => ["pessoal", "saude"].includes(d.category)).slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-foreground">{d.name} ({d.familyMember})</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">Abrir</Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
