import React, { useState } from "react";
import { Search, Building2, Loader2, CheckCircle2, Link2, Plus, ArrowLeft, Wifi } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { availableBanks, ConnectedBank } from "@/data/open-finance-mock";
import { paymentInstruments } from "@/data/financeiro-mock";
import { toast } from "@/hooks/use-toast";

type Step = "select_bank" | "pluggy_widget" | "link_account" | "done";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBankConnected: (bank: ConnectedBank) => void;
}

export function ConnectBankModal({ open, onOpenChange, onBankConnected }: Props) {
  const [step, setStep] = useState<Step>("select_bank");
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<typeof availableBanks[0] | null>(null);
  const [widgetProgress, setWidgetProgress] = useState(0);
  const [linkedInstrumentId, setLinkedInstrumentId] = useState<string>("new");

  const filteredBanks = availableBanks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBank = (bank: typeof availableBanks[0]) => {
    setSelectedBank(bank);
    setStep("pluggy_widget");
    // Simulate Pluggy widget loading
    setWidgetProgress(0);
    const steps = [10, 25, 40, 60, 75, 90, 100];
    steps.forEach((p, i) => {
      setTimeout(() => {
        setWidgetProgress(p);
        if (p === 100) {
          setTimeout(() => setStep("link_account"), 800);
        }
      }, (i + 1) * 700);
    });
  };

  const handleFinishLink = () => {
    const newBank: ConnectedBank = {
      id: `cb-new-${Date.now()}`,
      itemId: `pluggy-item-${Date.now()}`,
      connectorName: selectedBank?.name || "Banco",
      connectorLogo: "🏦",
      accountType: "Conta Corrente",
      agency: "0001",
      accountNumber: `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(Math.random() * 10)}`,
      linkedInstrumentId: linkedInstrumentId === "new" ? null : linkedInstrumentId,
      status: "connected",
      lastSync: new Date().toISOString(),
      balanceFromPluggy: Math.floor(Math.random() * 50000) + 5000,
      createdAt: new Date().toISOString().split("T")[0],
    };
    onBankConnected(newBank);
    setStep("done");
    toast({ title: "Banco conectado!", description: `${selectedBank?.name} vinculado com sucesso via Open Finance.` });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("select_bank");
      setSelectedBank(null);
      setWidgetProgress(0);
      setLinkedInstrumentId("new");
      setSearch("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Conectar Banco via Open Finance
          </DialogTitle>
          <DialogDescription>
            {step === "select_bank" && "Selecione seu banco para conectar automaticamente via Pluggy."}
            {step === "pluggy_widget" && "Autenticando com o banco de forma segura..."}
            {step === "link_account" && "Vincule a conta bancária ao seu sistema."}
            {step === "done" && "Conexão finalizada!"}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Select Bank */}
        {step === "select_bank" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar banco..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {filteredBanks.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleSelectBank(bank)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-center"
                >
                  <div className={`h-10 w-10 rounded-full ${bank.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {bank.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-foreground leading-tight">{bank.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              🔒 Seus dados são protegidos pelo Open Finance. O sistema nunca acessa suas senhas.
            </p>
          </div>
        )}

        {/* STEP 2: Pluggy Widget (Simulated) */}
        {step === "pluggy_widget" && selectedBank && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className={`h-16 w-16 rounded-full ${selectedBank.color} flex items-center justify-center text-white font-bold text-2xl`}>
                {selectedBank.name.charAt(0)}
              </div>
              <p className="font-medium text-foreground">{selectedBank.name}</p>
            </div>
            <div className="border border-border rounded-lg p-6 bg-muted/30 space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Pluggy Connect</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${widgetProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {widgetProgress < 40 && "Conectando ao banco..."}
                {widgetProgress >= 40 && widgetProgress < 75 && "Autenticando credenciais..."}
                {widgetProgress >= 75 && widgetProgress < 100 && "Obtendo dados da conta..."}
                {widgetProgress === 100 && "✅ Conexão estabelecida!"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Em produção, o widget oficial da Pluggy será exibido aqui para login seguro no banco.
            </p>
          </div>
        )}

        {/* STEP 3: Link Account */}
        {step === "link_account" && selectedBank && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{selectedBank.name} — Conta Corrente</p>
                <p className="text-xs text-muted-foreground">Ag. 0001 · Conta 1234-5 · Saldo: R$ 24.500,00</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Esta conta bancária corresponde a qual conta no sistema?</Label>
              <Select value={linkedInstrumentId} onValueChange={setLinkedInstrumentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <span className="flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> Criar nova conta automaticamente</span>
                  </SelectItem>
                  {paymentInstruments.filter((p) => p.active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {p.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 gap-1" onClick={() => { setStep("select_bank"); setSelectedBank(null); }}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button className="flex-1 gap-1" onClick={handleFinishLink}>
                <Link2 className="h-4 w-4" /> Vincular Conta
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">Banco Conectado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                A sincronização automática de extratos já está ativa.<br />
                Novos lançamentos serão importados diariamente às 6h.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
