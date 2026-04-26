import React, { useState } from "react";
import {
  Bell, BellRing, Send, CheckCircle2, XCircle, Smartphone,
  Beef, Wallet, Thermometer, Package, ClipboardList, FileText,
  Info, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePushNotifications, usePushPreferences } from "@/hooks/use-push-notifications";
import { toast } from "@/hooks/use-toast";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  schedule?: string;
}

function ToggleRow({ label, description, checked, onCheckedChange, schedule }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {schedule && (
          <Badge variant="outline" className="mt-1 text-[10px]">{schedule}</Badge>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function NotificacoesPush() {
  const { supported, permission, subscription, subscribe, unsubscribe, sendTestNotification, loading } = usePushNotifications();
  const { prefs, updatePrefs } = usePushPreferences();

  const handleActivate = async () => {
    const sub = await subscribe();
    if (sub) {
      toast({ title: "Notificações push ativadas!" });
    }
  };

  const handleDeactivate = async () => {
    await unsubscribe();
    toast({ title: "Notificações push desativadas" });
  };

  const handleTest = () => {
    sendTestNotification();
    toast({ title: "Notificação de teste enviada" });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" /> Notificações Push
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure quais alertas deseja receber via notificação push no seu dispositivo.
          </p>
        </div>

        {/* Status Card */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${permission === "granted" && subscription ? "bg-primary/10" : "bg-muted"}`}>
                  <Smartphone className={`h-5 w-5 ${permission === "granted" && subscription ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {!supported && "Navegador não suporta notificações push"}
                    {supported && permission === "denied" && "Notificações bloqueadas pelo navegador"}
                    {supported && permission === "granted" && subscription && "Notificações push ativas"}
                    {supported && permission === "granted" && !subscription && "Notificações permitidas mas não inscritas"}
                    {supported && permission === "default" && "Notificações não configuradas"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {permission === "denied" && "Desbloqueie nas configurações do navegador para este site."}
                    {permission === "granted" && subscription && "Você receberá alertas neste dispositivo."}
                    {permission === "default" && "Clique em 'Ativar' para receber alertas."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {supported && permission !== "denied" && !subscription && (
                  <Button size="sm" className="gap-1" onClick={handleActivate} disabled={loading}>
                    <Bell className="h-4 w-4" /> Ativar
                  </Button>
                )}
                {subscription && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1" onClick={handleTest}>
                      <Send className="h-4 w-4" /> Testar
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={handleDeactivate}>
                      <XCircle className="h-4 w-4" /> Desativar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        {permission === "denied" && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Notificações bloqueadas</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Para ativar, clique no ícone de cadeado na barra de endereço do navegador e permita notificações para este site.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences by category */}
        {/* 🐄 REBANHO */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Beef className="h-5 w-5 text-primary" /> Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Parto previsto em menos de 7 dias"
              description="Alerta diário sobre partos próximos"
              schedule="Diário às 7h"
              checked={prefs.partoProximo7dias}
              onCheckedChange={(v) => updatePrefs({ partoProximo7dias: v })}
            />
            <ToggleRow
              label="Parto previsto para amanhã"
              description="Notificação urgente de parto iminente"
              schedule="Urgente às 7h"
              checked={prefs.partoAmanha}
              onCheckedChange={(v) => updatePrefs({ partoAmanha: v })}
            />
            <ToggleRow
              label="Vacina vencendo em 7 dias"
              description="Alerta semanal sobre vacinas próximas do vencimento"
              schedule="Semanal"
              checked={prefs.vacinaVencendo7dias}
              onCheckedChange={(v) => updatePrefs({ vacinaVencendo7dias: v })}
            />
            <ToggleRow
              label="Animal em carência embarcado"
              description="Alerta imediato se animal em período de carência for embarcado"
              schedule="Imediato"
              checked={prefs.animalCarenciaEmbarcado}
              onCheckedChange={(v) => updatePrefs({ animalCarenciaEmbarcado: v })}
            />
            <div className="py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium text-foreground">Animal sem pesagem</p>
                  <p className="text-xs text-muted-foreground">Alerta semanal se animal não for pesado em X dias</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">Semanal</Badge>
                </div>
                <Switch checked={prefs.animalSemPesagem} onCheckedChange={(v) => updatePrefs({ animalSemPesagem: v })} />
              </div>
              {prefs.animalSemPesagem && (
                <div className="mt-2 flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Dias sem pesagem:</Label>
                  <Input
                    type="number"
                    className="h-8 w-20 text-sm"
                    value={prefs.diasSemPesagem}
                    onChange={(e) => updatePrefs({ diasSemPesagem: parseInt(e.target.value) || 30 })}
                    min={7}
                    max={180}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 💰 FINANCEIRO */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Conta a pagar vencendo hoje"
              description="Alerta matinal sobre contas vencendo no dia"
              schedule="Diário às 8h"
              checked={prefs.contaPagarHoje}
              onCheckedChange={(v) => updatePrefs({ contaPagarHoje: v })}
            />
            <ToggleRow
              label="Conta a pagar vencendo amanhã"
              description="Lembrete antecipado de contas próximas"
              schedule="Diário às 8h"
              checked={prefs.contaPagarAmanha}
              onCheckedChange={(v) => updatePrefs({ contaPagarAmanha: v })}
            />
            <ToggleRow
              label="Conta em atraso"
              description="Alerta diário sobre contas vencidas"
              schedule="Diário às 8h"
              checked={prefs.contaEmAtraso}
              onCheckedChange={(v) => updatePrefs({ contaEmAtraso: v })}
            />
            <ToggleRow
              label="Meta financeira atingida"
              description="Comemoração quando uma meta é alcançada"
              schedule="Imediato"
              checked={prefs.metaAtingida}
              onCheckedChange={(v) => updatePrefs({ metaAtingida: v })}
            />
            <div className="py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium text-foreground">Saldo abaixo do mínimo</p>
                  <p className="text-xs text-muted-foreground">Alerta imediato quando o saldo cai abaixo do valor configurado</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">Imediato</Badge>
                </div>
                <Switch checked={prefs.saldoAbaixoMinimo} onCheckedChange={(v) => updatePrefs({ saldoAbaixoMinimo: v })} />
              </div>
              {prefs.saldoAbaixoMinimo && (
                <div className="mt-2 flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Saldo mínimo R$:</Label>
                  <Input
                    type="number"
                    className="h-8 w-28 text-sm"
                    value={prefs.saldoMinimo}
                    onChange={(e) => updatePrefs({ saldoMinimo: parseFloat(e.target.value) || 5000 })}
                    min={0}
                    step={500}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 🌡️ CLIMA */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-primary" /> Clima
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Chuva intensa prevista (>30mm)"
              description="Alerta quando previsão indica chuva forte"
              schedule="Na detecção"
              checked={prefs.chuvaIntensa}
              onCheckedChange={(v) => updatePrefs({ chuvaIntensa: v })}
            />
            <ToggleRow
              label="Estresse térmico previsto (THI>79)"
              description="Alerta de índice de temperatura e umidade elevado"
              schedule="Na detecção"
              checked={prefs.estresseTermico}
              onCheckedChange={(v) => updatePrefs({ estresseTermico: v })}
            />
            <ToggleRow
              label="Geada prevista"
              description="Alerta urgente de geada na região"
              schedule="Urgente na detecção"
              checked={prefs.geadaPrevista}
              onCheckedChange={(v) => updatePrefs({ geadaPrevista: v })}
            />
          </CardContent>
        </Card>

        {/* 🏭 ESTOQUE */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Produto abaixo do estoque mínimo"
              description="Alerta diário sobre produtos com estoque baixo"
              schedule="Diário"
              checked={prefs.estoqueAbaixoMinimo}
              onCheckedChange={(v) => updatePrefs({ estoqueAbaixoMinimo: v })}
            />
            <ToggleRow
              label="Medicamento vencendo em 30 dias"
              description="Alerta semanal sobre medicamentos próximos do vencimento"
              schedule="Semanal"
              checked={prefs.medicamentoVencendo}
              onCheckedChange={(v) => updatePrefs({ medicamentoVencendo: v })}
            />
          </CardContent>
        </Card>

        {/* 📋 ATIVIDADES */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Atividades
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Atividade programada para hoje"
              description="Lembrete matinal de atividades do dia"
              schedule="Diário às 7h"
              checked={prefs.atividadeHoje}
              onCheckedChange={(v) => updatePrefs({ atividadeHoje: v })}
            />
            <ToggleRow
              label="Atividade atrasada"
              description="Alerta diário sobre atividades pendentes"
              schedule="Diário"
              checked={prefs.atividadeAtrasada}
              onCheckedChange={(v) => updatePrefs({ atividadeAtrasada: v })}
            />
          </CardContent>
        </Card>

        {/* 📄 DOCUMENTOS */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <ToggleRow
              label="Documento vencendo em 30 dias"
              description="Alerta semanal sobre documentos próximos do vencimento"
              schedule="Semanal"
              checked={prefs.documentoVencendo}
              onCheckedChange={(v) => updatePrefs({ documentoVencendo: v })}
            />
            <ToggleRow
              label="GTA vencendo em 7 dias"
              description="Alerta diário sobre GTAs próximas do vencimento"
              schedule="Diário"
              checked={prefs.gtaVencendo}
              onCheckedChange={(v) => updatePrefs({ gtaVencendo: v })}
            />
            <ToggleRow
              label="Seguro vencendo em 90 dias"
              description="Alerta mensal sobre seguros a renovar"
              schedule="Mensal"
              checked={prefs.seguroVencendo}
              onCheckedChange={(v) => updatePrefs({ seguroVencendo: v })}
            />
          </CardContent>
        </Card>

        {/* Security note */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Sobre Push Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                As notificações push são enviadas via Web Push API diretamente para o seu dispositivo.
                Nenhum dado pessoal é compartilhado com terceiros. Em produção, as notificações são disparadas
                por uma Edge Function no Supabase executada diariamente via pg_cron, verificando todas as condições
                configuradas acima para cada usuário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
