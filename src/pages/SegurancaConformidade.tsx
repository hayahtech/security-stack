import { useState } from "react";
import {
  Shield, ShieldCheck, ShieldAlert, Smartphone, Mail, Key, Lock, Unlock,
  Monitor, MapPin, Clock, AlertCircle, CheckCircle2, X, Download,
  Database, HardDrive, RefreshCw, FileDown, Globe, Eye, EyeOff, Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  loginSessions, activeSessions, securityAlerts, backupRecords,
  securitySettings, backupInfo, users2FAStatus
} from "@/mock/securityData";

const statusIcons: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  success: { icon: CheckCircle2, className: "text-emerald-400", label: "✅ Sucesso" },
  blocked: { icon: ShieldAlert, className: "text-destructive", label: "🔴 BLOQUEADO" },
  failed: { icon: AlertCircle, className: "text-amber-400", label: "⚠️ Falha" },
};

function TwoFactorSetup() {
  const [step, setStep] = useState<"off" | "choosing" | "qr" | "verify" | "backup">("off");
  const [verifyCode, setVerifyCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const backupCodes = ["A3K9-M2X1", "B7L4-N8Y2", "C1P6-Q5Z3", "D9R2-S4W7", "E5T8-U6V1", "F2G3-H7J4", "G8K1-L3M9", "H4N6-P2Q5"];

  if (step === "off") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">2FA não configurado ⚠️</p>
            <p className="text-xs text-muted-foreground">Recomendado para proteção de dados financeiros</p>
          </div>
        </div>
        <Button onClick={() => setStep("choosing")} className="gap-2">
          <Shield className="w-4 h-4" /> Configurar 2FA
        </Button>

        {/* Team 2FA status */}
        <div className="mt-6">
          <Label className="text-xs text-muted-foreground mb-2 block">Status da equipe</Label>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users2FAStatus.map(u => (
                  <TableRow key={u.email}>
                    <TableCell>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell className="text-sm">{u.role}</TableCell>
                    <TableCell>
                      {u.twoFAEnabled ? (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 text-xs">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-400 text-xs">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">{u.method || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Switch />
            <Label className="text-sm">Obrigar 2FA para todos os usuários da conta</Label>
          </div>
        </div>
      </div>
    );
  }

  if (step === "choosing") {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Escolha o método de verificação:</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "app", label: "Aplicativo Autenticador", desc: "Google Authenticator, Authy", icon: Smartphone },
            { id: "sms", label: "SMS", desc: "Código via mensagem", icon: MessageSquareIcon },
            { id: "email", label: "E-mail", desc: "Código a cada login", icon: Mail },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setStep("qr")}
              className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <opt.icon className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => setStep("off")}>Cancelar</Button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Escaneie o QR Code com seu autenticador:</h3>
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border">
            <div className="text-center">
              <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">QR Code</p>
              <p className="text-[10px] text-muted-foreground">(placeholder)</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Digite o código de 6 dígitos:</Label>
          <Input
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-[0.5em] font-mono w-48 mx-auto"
          />
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => setStep("choosing")}>Voltar</Button>
          <Button onClick={() => { setStep("backup"); toast.success("2FA configurado com sucesso!"); }}>Verificar e ativar</Button>
        </div>
      </div>
    );
  }

  if (step === "backup") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <p className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 2FA ativado com sucesso!
          </p>
        </div>
        <h3 className="text-sm font-semibold">Códigos de backup (salve em local seguro):</h3>
        <p className="text-xs text-muted-foreground">Esses códigos são exibidos apenas uma vez. Use-os caso perca acesso ao seu dispositivo.</p>
        <div className="grid grid-cols-2 gap-2 p-4 bg-muted/30 rounded-lg border border-border">
          {backupCodes.map(code => (
            <span key={code} className="font-mono text-sm text-center py-1">{code}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1" onClick={() => toast.success("Códigos copiados")}>
            <Copy className="w-3 h-3" /> Copiar
          </Button>
          <Button variant="outline" className="gap-1" onClick={() => toast.success("PDF gerado")}>
            <Download className="w-3 h-3" /> Baixar PDF
          </Button>
        </div>
        <Button onClick={() => setStep("off")}>Concluir</Button>
      </div>
    );
  }

  return null;
}

// Inline icon component since MessageSquare is imported differently
function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function SegurancaConformidade() {
  const [settings, setSettings] = useState(securitySettings);
  const [alerts, setAlerts] = useState(securityAlerts);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
    toast.success("Alerta resolvido");
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Segurança & Conformidade</h1>
        <p className="text-sm text-muted-foreground font-data mt-1">
          Proteção de dados, controle de acesso e conformidade LGPD
        </p>
      </div>

      {/* Unresolved alerts */}
      {alerts.filter(a => !a.resolved).map(alert => (
        <div key={alert.id} className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">🔴 {alert.message}</p>
            <p className="text-xs text-muted-foreground">{alert.date}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleDismissAlert(alert.id)}>Confirmar que fui eu</Button>
            <Button size="sm" variant="destructive" onClick={() => { handleDismissAlert(alert.id); toast.error("Sessão bloqueada e senha alterada"); }}>
              Não fui eu — bloquear
            </Button>
          </div>
        </div>
      ))}

      <Tabs defaultValue="2fa">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="2fa" className="gap-1"><Shield className="w-3 h-3" /> 2FA</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1"><Monitor className="w-3 h-3" /> Sessões</TabsTrigger>
          <TabsTrigger value="backup" className="gap-1"><Database className="w-3 h-3" /> Backup</TabsTrigger>
        </TabsList>

        {/* 2FA TAB */}
        <TabsContent value="2fa" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Autenticação de Dois Fatores (2FA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TwoFactorSetup />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SESSIONS TAB */}
        <TabsContent value="sessions" className="space-y-6 mt-6">
          {/* Active sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Sessões Ativas Agora
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => toast.success("Todas as sessões encerradas (exceto atual)")}>
                  Encerrar todas as sessões
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{s.user}</p>
                        <p className="text-xs text-muted-foreground">{s.device} — {s.location} — {s.startedAt}</p>
                      </div>
                    </div>
                    {s.isCurrent ? (
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 text-xs">Sessão atual</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toast.success(`Sessão de ${s.user} encerrada`)}>
                        Encerrar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Timeout de sessão</Label>
                  <Select value={String(settings.sessionTimeout)} onValueChange={v => setSettings({...settings, sessionTimeout: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 4, 8, 12, 24].map(h => <SelectItem key={h} value={String(h)}>{h} horas</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Máx. sessões simultâneas</Label>
                  <Select value={String(settings.maxConcurrentSessions)} onValueChange={v => setSettings({...settings, maxConcurrentSessions: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Bloqueio após tentativas</Label>
                  <Select value={String(settings.maxFailedAttempts)} onValueChange={v => setSettings({...settings, maxFailedAttempts: parseInt(v)})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 10].map(n => <SelectItem key={n} value={String(n)}>{n} tentativas</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Alertar login novo país</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={settings.alertNewCountry} onCheckedChange={v => setSettings({...settings, alertNewCountry: v})} />
                    <span className="text-sm">{settings.alertNewCountry ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Acessos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginSessions.map(s => {
                      const cfg = statusIcons[s.status];
                      return (
                        <TableRow key={s.id} className={s.status === "blocked" ? "bg-destructive/5" : ""}>
                          <TableCell className="font-data text-xs">{s.date}</TableCell>
                          <TableCell className="text-sm">{s.user}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{s.ip}</TableCell>
                          <TableCell className="text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" /> {s.location}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.device}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold ${cfg.className}`}>
                              {cfg.label}
                            </span>
                            {s.reason && <p className="text-[10px] text-muted-foreground">({s.reason})</p>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP TAB */}
        <TabsContent value="backup" className="space-y-6 mt-6">
          {/* Status */}
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <HardDrive className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    🟢 Seus Dados Estão Seguros
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Último backup:</span>
                      <p className="font-semibold">{backupInfo.lastBackup}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequência:</span>
                      <p className="font-semibold">{backupInfo.frequency}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retenção:</span>
                      <p className="font-semibold">{backupInfo.retention}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Local:</span>
                      <p className="font-semibold">{backupInfo.location}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tamanho:</span>
                      <p className="font-semibold">{backupInfo.size}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Criptografia:</span>
                      <p className="font-semibold">{backupInfo.encryption} ✅</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup history */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Histórico de Backups</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setRestoreDialogOpen(true)} className="gap-1">
                  <RefreshCw className="w-3 h-3" /> Restaurar ponto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Data</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupRecords.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-data text-sm">{b.date}</TableCell>
                        <TableCell className="text-sm">{b.size}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 text-xs">
                            ✅ Completo
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setRestoreDialogOpen(true)} className="text-xs">
                            Restaurar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toast.success("Download iniciado")} className="text-xs">
                            Baixar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* LGPD Export */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileDown className="w-5 h-5 text-primary" />
                Exportação de Dados (LGPD — Portabilidade)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Em conformidade com a LGPD, exporte todos os dados da sua organização.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setExportDialogOpen(true)} className="gap-2">
                  <Download className="w-4 h-4" /> Exportar todos os meus dados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Restore dialog */}
          <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restaurar Ponto de Recuperação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm font-semibold text-destructive">⚠️ ATENÇÃO</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta ação sobrescreve todos os dados atuais. Recomendamos fazer um backup antes de restaurar.
                  </p>
                </div>
                <Select defaultValue={backupRecords[0].id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ponto de restauração" />
                  </SelectTrigger>
                  <SelectContent>
                    {backupRecords.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.date} ({b.size})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={() => { setRestoreDialogOpen(false); toast.info("Restauração iniciada"); }}>
                    Confirmar restauração
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export dialog */}
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar Dados (LGPD)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Selecione o formato de exportação:</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "json", label: "JSON Completo" },
                    { id: "csv", label: "CSV por módulo" },
                    { id: "excel", label: "Excel consolidado" },
                  ].map(fmt => (
                    <button key={fmt.id} className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
                      <p className="text-sm font-semibold">{fmt.label}</p>
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  <p>📦 Inclui: lançamentos, clientes, fornecedores, configurações, histórico</p>
                  <p>⏱️ Prazo de geração: até 24h</p>
                  <p>📧 Link de download seguro enviado por e-mail (expira em 7 dias)</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={() => { setExportDialogOpen(false); toast.success("Exportação solicitada! Você receberá o link por e-mail em até 24h."); }}>
                    Solicitar exportação
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
