import React, { useState } from "react";
import {
  Wifi, Eye, EyeOff, CheckCircle2, AlertTriangle, XCircle,
  RefreshCcw, Trash2, Settings, Loader2, Unplug, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  mockConnectedBanks, ConnectedBank, PluggyConfig,
} from "@/data/open-finance-mock";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function OpenFinance() {
  const [config, setConfig] = useState<PluggyConfig>({
    clientId: "",
    clientSecret: "",
    environment: "sandbox",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>(mockConnectedBanks);
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);
  const [syncHour, setSyncHour] = useState("06");
  const [autoSync, setAutoSync] = useState(true);

  const handleTestCredentials = () => {
    if (!config.clientId || !config.clientSecret) {
      toast({ title: "Preencha Client ID e Client Secret", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      if (config.clientId.length >= 5) {
        setTestResult("success");
        toast({ title: "Credenciais válidas!", description: `Ambiente: ${config.environment}` });
      } else {
        setTestResult("error");
        toast({ title: "Credenciais inválidas", variant: "destructive" });
      }
    }, 2000);
  };

  const handleDisconnect = (id: string) => {
    setConnectedBanks((prev) => prev.filter((b) => b.id !== id));
    setDisconnectTarget(null);
    toast({ title: "Conta desconectada" });
  };

  const handleSync = (id: string) => {
    setConnectedBanks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, lastSync: new Date().toISOString(), status: "connected" as const } : b
      )
    );
    toast({ title: "Sincronização concluída", description: "Novas transações foram importadas." });
  };

  const statusIcon = (status: ConnectedBank["status"]) => {
    switch (status) {
      case "connected": return <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3" /> Conectada</Badge>;
      case "needs_reauth": return <Badge className="gap-1 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20"><AlertTriangle className="h-3 w-3" /> Requer reautenticação</Badge>;
      case "error": return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" /> Erro</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Wifi className="h-6 w-6 text-primary" /> Open Finance — Pluggy
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure a integração com a Pluggy para importar extratos automaticamente de qualquer banco.
          </p>
        </div>

        {/* Credentials */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Credenciais da API Pluggy</CardTitle>
            <CardDescription>
              Obtenha suas credenciais em{" "}
              <a href="https://pluggy.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">pluggy.ai</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client ID</Label>
                <Input
                  placeholder="Seu Client ID da Pluggy"
                  value={config.clientId}
                  onChange={(e) => { setConfig({ ...config, clientId: e.target.value }); setTestResult(null); }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Client Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    placeholder="Seu Client Secret"
                    value={config.clientSecret}
                    onChange={(e) => { setConfig({ ...config, clientSecret: e.target.value }); setTestResult(null); }}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label>Ambiente</Label>
                <Select value={config.environment} onValueChange={(v) => setConfig({ ...config, environment: v as "sandbox" | "production" })}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">🧪 Sandbox (testes)</SelectItem>
                    <SelectItem value="production">🚀 Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pt-5">
                <Button variant="outline" size="sm" onClick={handleTestCredentials} disabled={testing} className="gap-1">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  Testar credenciais
                </Button>
                {testResult === "success" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {testResult === "error" && <XCircle className="h-5 w-5 text-destructive" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Config */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-primary" /> Sincronização Automática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sincronizar automaticamente</p>
                <p className="text-xs text-muted-foreground">Importar extratos uma vez por dia no horário definido</p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            {autoSync && (
              <div className="space-y-1.5">
                <Label>Horário da sincronização</Label>
                <Select value={syncHour} onValueChange={setSyncHour}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Contas Conectadas</CardTitle>
            <CardDescription>{connectedBanks.length} conta(s) vinculada(s) via Open Finance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectedBanks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma conta conectada. Vá em Financeiro &gt; Contas &amp; Cartões e clique em "Conectar banco automaticamente".
              </p>
            )}
            {connectedBanks.map((bank) => (
              <div key={bank.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bank.connectorLogo}</span>
                    <div>
                      <p className="font-medium text-foreground">{bank.connectorName} — {bank.accountType}</p>
                      <p className="text-xs text-muted-foreground">
                        {bank.agency && `Ag. ${bank.agency} · `}Conta {bank.accountNumber}
                      </p>
                    </div>
                  </div>
                  {statusIcon(bank.status)}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Saldo Pluggy: </span>
                    <span className="font-medium text-foreground">{fmt(bank.balanceFromPluggy)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última sync: </span>
                    <span className="font-medium text-foreground">
                      {bank.lastSync ? format(new Date(bank.lastSync), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Nunca"}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => handleSync(bank.id)}>
                    <RefreshCcw className="h-3.5 w-3.5" /> Sincronizar agora
                  </Button>
                  {bank.status === "needs_reauth" && (
                    <Button variant="outline" size="sm" className="gap-1 text-amber-600 border-amber-500/30">
                      <RefreshCcw className="h-3.5 w-3.5" /> Reconectar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => setDisconnectTarget(bank.id)}
                  >
                    <Unplug className="h-3.5 w-3.5" /> Desconectar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Disconnect confirm */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar conta bancária?</AlertDialogTitle>
            <AlertDialogDescription>
              A sincronização automática será interrompida. As transações já importadas serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => disconnectTarget && handleDisconnect(disconnectTarget)}>
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
