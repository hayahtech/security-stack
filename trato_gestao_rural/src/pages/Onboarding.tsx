import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, X, Sprout, User, Tractor, Beef,
  CreditCard, Tags, PartyPopper, Upload, Plus, Trash2, MapPin,
  Wallet, Landmark, Smartphone, CheckCircle2, ArrowRight,
  Weight, Receipt, Calculator, Map, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useOnboarding, brazilianStates, type OnboardingData } from "@/hooks/use-onboarding";
import { brazilianBanks } from "@/data/financeiro-mock";
import { categories } from "@/data/financeiro-mock";
import { maskCnpj, maskCpf, isValidCNPJ, isValidCPF } from "@/lib/validators";

/* ═══ Step Components ═══ */

function StepLGPD({ data, update }: StepProps) {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Seus dados, sua privacidade</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Para usar o AgroFinance Pro precisamos coletar alguns dados pessoais e de sua propriedade.
          Leia como tratamos suas informações antes de prosseguir.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">O que coletamos:</strong> nome, CPF/CNPJ, telefone, localização da fazenda, dados financeiros e zootécnicos.</p>
        <p><strong className="text-foreground">Para quê:</strong> exclusivamente para prestar os serviços de gestão agropecuária e financeira.</p>
        <p><strong className="text-foreground">Como protegemos:</strong> criptografia AES-256 em repouso, TLS em trânsito e isolamento de dados por conta (RLS).</p>
        <p><strong className="text-foreground">Seus direitos (LGPD art. 18):</strong> acesso, correção, portabilidade e exclusão de dados a qualquer momento.</p>
        <p>
          Leia nossa{" "}
          <Link to="/privacidade" target="_blank" className="text-primary underline font-medium">
            Política de Privacidade completa
          </Link>
          .
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <Checkbox
          id="lgpd-consent"
          checked={data.lgpdConsent}
          onCheckedChange={(checked) =>
            update({
              lgpdConsent: !!checked,
              lgpdConsentDate: checked ? new Date().toISOString() : null,
            })
          }
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm text-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
          Li e concordo com a{" "}
          <Link to="/privacidade" target="_blank" className="text-primary underline">
            Política de Privacidade
          </Link>{" "}
          e autorizo o tratamento dos meus dados pessoais conforme descrito acima, nos termos da LGPD (Lei 13.709/2018).
        </span>
      </label>
    </div>
  );
}

function StepWelcome({ data, update }: StepProps) {
  const options: Array<{ value: OnboardingData["profileType"]; emoji: string; title: string; desc: string }> = [
    { value: "produtor", emoji: "🌾", title: "Produtor Rural", desc: "Tenho fazenda e rebanho" },
    { value: "pessoal", emoji: "👨‍👩‍👧", title: "Uso Pessoal", desc: "Quero controlar minhas finanças pessoais" },
    { value: "ambos", emoji: "🏢", title: "Ambos", desc: "Uso pessoal e tenho fazenda" },
  ];

  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
            AF
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Bem-vindo ao AgroFinance Pro!
        </h2>
        <p className="text-muted-foreground">
          Vamos configurar seu sistema em menos de 5 minutos.
        </p>
      </div>

      <div className="w-full space-y-3">
        <p className="text-sm font-medium text-foreground">Como você vai usar o sistema?</p>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ profileType: opt.value })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
              ${data.profileType === opt.value
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <div>
              <p className="font-semibold text-foreground">{opt.title}</p>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </div>
            {data.profileType === opt.value && (
              <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPersonalData({ data, update }: StepProps) {
  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Seus Dados</h2>
        <p className="text-sm text-muted-foreground">Informações básicas do perfil</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome completo</Label>
          <Input value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder="Seu nome completo" />
        </div>
        <div className="space-y-1.5">
          <Label>Como prefere ser chamado</Label>
          <Input value={data.nickname} onChange={(e) => update({ nickname: e.target.value })} placeholder="Apelido ou primeiro nome" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 space-y-1.5">
            <Label>Tipo</Label>
            <Select value={data.documentType} onValueChange={(v) => update({ documentType: v as "cpf" | "cnpj" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>{data.documentType === "cpf" ? "CPF" : "CNPJ"}</Label>
            <Input
              value={data.document}
              onChange={(e) => update({ document: data.documentType === "cpf" ? maskCpf(e.target.value) : maskCnpj(e.target.value) })}
              placeholder={data.documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <div className="flex items-center gap-3">
            <Input className="flex-1" value={data.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(00) 00000-0000" />
            <div className="flex items-center gap-2">
              <Switch checked={data.whatsapp} onCheckedChange={(v) => update({ whatsapp: v })} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">WhatsApp</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Estado (UF)</Label>
          <Select value={data.state} onValueChange={(v) => update({ state: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {brazilianStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function StepFarm({ data, update }: StepProps) {
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocalização não suportada", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast({ title: "Localização detectada!" });
      },
      () => toast({ title: "Não foi possível detectar a localização", variant: "destructive" })
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Sua Fazenda</h2>
        <p className="text-sm text-muted-foreground">Dados da propriedade rural</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nome da fazenda</Label>
          <Input value={data.farmName} onChange={(e) => update({ farmName: e.target.value })} placeholder="Ex: Fazenda Boa Vista" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Município</Label>
            <Input value={data.farmCity} onChange={(e) => update({ farmCity: e.target.value })} placeholder="Cidade" />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={data.farmState} onValueChange={(v) => update({ farmState: v })}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {brazilianStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Área total (hectares)</Label>
          <Input type="number" value={data.farmArea} onChange={(e) => update({ farmArea: e.target.value })} placeholder="Ex: 150" />
        </div>
        <div className="space-y-1.5">
          <Label>Atividade principal</Label>
          <Select value={data.mainActivity} onValueChange={(v) => update({ mainActivity: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pecuaria_corte">Pecuária de Corte</SelectItem>
              <SelectItem value="leiteira">Pecuária Leiteira</SelectItem>
              <SelectItem value="mista">Mista</SelectItem>
              <SelectItem value="agricultura">Agricultura</SelectItem>
              <SelectItem value="piscicultura">Piscicultura</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tamanho do rebanho (aproximado)</Label>
          <Select value={data.herdSize} onValueChange={(v) => update({ herdSize: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sem rebanho</SelectItem>
              <SelectItem value="1-50">1 a 50 cabeças</SelectItem>
              <SelectItem value="51-200">51 a 200 cabeças</SelectItem>
              <SelectItem value="201-500">201 a 500 cabeças</SelectItem>
              <SelectItem value="500+">Mais de 500 cabeças</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>NIRF <span className="text-muted-foreground">(opcional)</span></Label>
            <Input value={data.nirf} onChange={(e) => update({ nirf: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>IE <span className="text-muted-foreground">(opcional)</span></Label>
            <Input value={data.ie} onChange={(e) => update({ ie: e.target.value })} />
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1 w-full" onClick={handleDetectLocation}>
          <MapPin className="h-4 w-4" />
          {data.lat ? `Localização: ${data.lat.toFixed(4)}, ${data.lng?.toFixed(4)}` : "Detectar localização automaticamente"}
        </Button>
      </div>
    </div>
  );
}

function StepAnimals({ data, update }: StepProps) {
  const addManualAnimal = () => {
    update({
      manualAnimals: [...data.manualAnimals, { earTag: "", sex: "", category: "", birthDate: "" }],
    });
  };

  const updateAnimal = (idx: number, field: string, value: string) => {
    const updated = [...data.manualAnimals];
    updated[idx] = { ...updated[idx], [field]: value };
    update({ manualAnimals: updated });
  };

  const removeAnimal = (idx: number) => {
    update({ manualAnimals: data.manualAnimals.filter((_, i) => i !== idx) });
  };

  const options: Array<{ value: OnboardingData["importMethod"]; emoji: string; title: string; desc: string }> = [
    { value: "csv", emoji: "📋", title: "Importar Planilha", desc: "Upload de arquivo CSV com seus animais" },
    { value: "manual", emoji: "✏️", title: "Cadastrar Manualmente", desc: "Adicionar animais um por um" },
    { value: "later", emoji: "⏭️", title: "Fazer Depois", desc: "Importar em Rebanho > Animais" },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Importar Animais</h2>
        <p className="text-sm text-muted-foreground">Como deseja adicionar seus animais ao sistema?</p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ importMethod: opt.value })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
              ${data.importMethod === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{opt.title}</p>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </div>
            {data.importMethod === opt.value && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
          </button>
        ))}
      </div>

      {data.importMethod === "csv" && (
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <Button variant="outline" size="sm" className="gap-1">
              <Upload className="h-4 w-4" /> Baixar modelo CSV
            </Button>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Arraste o CSV aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Colunas: ear_tag, name, breed, sex, birth_date, category</p>
            </div>
            {data.csvAnimalsCount > 0 && (
              <Badge className="bg-primary/10 text-primary">{data.csvAnimalsCount} animais encontrados</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {data.importMethod === "manual" && (
        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            {data.manualAnimals.map((animal, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Brinco</Label>}
                  <Input className="h-9 text-sm" value={animal.earTag} onChange={(e) => updateAnimal(idx, "earTag", e.target.value)} placeholder="BR001" />
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Sexo</Label>}
                  <Select value={animal.sex} onValueChange={(v) => updateAnimal(idx, "sex", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sexo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Macho</SelectItem>
                      <SelectItem value="F">Fêmea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Categoria</Label>}
                  <Select value={animal.category} onValueChange={(v) => updateAnimal(idx, "category", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Cat." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bezerro">Bezerro</SelectItem>
                      <SelectItem value="novilho">Novilho</SelectItem>
                      <SelectItem value="vaca">Vaca</SelectItem>
                      <SelectItem value="touro">Touro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Nasc.</Label>}
                  <Input type="date" className="h-9 text-sm" value={animal.birthDate} onChange={(e) => updateAnimal(idx, "birthDate", e.target.value)} />
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeAnimal(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1 w-full" onClick={addManualAnimal}>
              <Plus className="h-4 w-4" /> Adicionar animal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepAccounts({ data, update }: StepProps) {
  const typeLabels: Record<string, { icon: React.ElementType; label: string }> = {
    conta_corrente: { icon: Landmark, label: "Conta Corrente" },
    cartao_credito: { icon: CreditCard, label: "Cartão de Crédito" },
    caixa: { icon: Wallet, label: "Dinheiro / Caixa" },
    digital: { icon: Smartphone, label: "Conta Digital" },
  };

  const addAccount = (type: string) => {
    update({
      accounts: [...data.accounts, { id: `acc-${Date.now()}`, type: type as any, bank: "", details: "" }],
    });
  };

  const updateAccount = (idx: number, field: string, value: string) => {
    const updated = [...data.accounts];
    updated[idx] = { ...updated[idx], [field]: value };
    update({ accounts: updated });
  };

  const removeAccount = (idx: number) => {
    update({ accounts: data.accounts.filter((_, i) => i !== idx) });
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Contas Financeiras</h2>
        <p className="text-sm text-muted-foreground">Quais contas você usa para movimentar dinheiro?</p>
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(typeLabels).map(([type, { icon: Icon, label }]) => (
          <button
            key={type}
            onClick={() => addAccount(type)}
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{label}</span>
            <Plus className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </button>
        ))}
      </div>

      {/* Account list */}
      {data.accounts.length > 0 && (
        <div className="space-y-3">
          {data.accounts.map((acc, idx) => {
            const cfg = typeLabels[acc.type];
            const Icon = cfg?.icon || Wallet;
            return (
              <Card key={acc.id} className="border-border">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{cfg?.label}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAccount(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={acc.bank} onValueChange={(v) => updateAccount(idx, "bank", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Banco" /></SelectTrigger>
                      <SelectContent>
                        {brazilianBanks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="h-9 text-sm" placeholder={acc.type === "cartao_credito" ? "Últimos 4 dígitos" : "Agência / Conta"} value={acc.details} onChange={(e) => updateAccount(idx, "details", e.target.value)} />
                  </div>
                  {acc.type === "cartao_credito" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-9 text-sm" placeholder="Dia fechamento" value={acc.closingDay || ""} onChange={(e) => updateAccount(idx, "closingDay", e.target.value)} />
                      <Input className="h-9 text-sm" placeholder="Dia vencimento" value={acc.dueDay || ""} onChange={(e) => updateAccount(idx, "dueDay", e.target.value)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data.accounts.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Clique nos botões acima para adicionar suas contas
        </p>
      )}
    </div>
  );
}

function StepCategories({ data, update }: StepProps) {
  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-display font-bold text-foreground">Categorias</h2>
        <p className="text-sm text-muted-foreground">Suas categorias já foram pré-configuradas!</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <Badge key={cat.id} variant="secondary" className="text-sm py-1.5 px-3">
            {cat.name}
          </Badge>
        ))}
      </div>

      <div className="space-y-2 pt-2">
        <Button className="w-full gap-1" onClick={() => update({ categoriesCustomized: false })}>
          <CheckCircle2 className="h-4 w-4" /> Está ótimo assim — continuar
        </Button>
        <Button variant="outline" className="w-full gap-1" onClick={() => {
          update({ categoriesCustomized: true });
          window.open("/configuracoes/categorias", "_blank");
        }}>
          <Tags className="h-4 w-4" /> Quero personalizar
        </Button>
      </div>
    </div>
  );
}

function StepDone({ data }: StepProps) {
  const navigate = useNavigate();
  const animalsCount = data.importMethod === "manual" ? data.manualAnimals.filter((a) => a.earTag).length : data.csvAnimalsCount;

  const nextSteps = [
    { icon: Weight, label: "Registre sua primeira pesagem", route: "/rebanho/pesagens", color: "text-primary" },
    { icon: Receipt, label: "Lance uma despesa de hoje", route: "/financeiro/fluxo-de-caixa", color: "text-primary" },
    { icon: Calculator, label: "Configure seu orçamento mensal", route: "/financeiro/orcamento", color: "text-primary" },
    { icon: Map, label: "Explore o mapa da fazenda", route: "/fazenda/mapa", color: "text-primary" },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      {/* Confetti effect using emoji */}
      <div className="text-5xl animate-bounce">🎉</div>

      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-foreground">
          AgroFinance Pro configurado com sucesso!
        </h2>
        <p className="text-muted-foreground">Tudo pronto para começar.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 text-left">
        {data.farmName && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fazenda</p>
                <p className="text-sm font-medium text-foreground">{data.farmName} — {data.farmArea || "?"} ha</p>
              </div>
            </CardContent>
          </Card>
        )}
        {animalsCount > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Rebanho</p>
                <p className="text-sm font-medium text-foreground">{animalsCount} animais</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Contas</p>
              <p className="text-sm font-medium text-foreground">{data.accounts.length} conta(s)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Categorias</p>
              <p className="text-sm font-medium text-foreground">{categories.length} ativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <div className="space-y-2 text-left">
        <p className="text-sm font-medium text-foreground">Próximos passos sugeridos:</p>
        {nextSteps.map((step) => (
          <button
            key={step.route}
            onClick={() => navigate(step.route)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <step.icon className={`h-4 w-4 ${step.color} shrink-0`} />
            <span className="text-sm text-foreground flex-1">{step.label}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══ Main Onboarding Page ═══ */

interface StepProps {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
}

interface StepConfig {
  id: string;
  icon: React.ElementType;
  label: string;
  component: React.ComponentType<StepProps>;
  condition?: (data: OnboardingData) => boolean;
  canProceed?: (data: OnboardingData) => boolean;
}

const ALL_STEPS: StepConfig[] = [
  { id: "lgpd", icon: Shield, label: "Privacidade", component: StepLGPD, canProceed: (d) => d.lgpdConsent === true },
  { id: "welcome", icon: Sprout, label: "Bem-vindo", component: StepWelcome, canProceed: (d) => !!d.profileType },
  { id: "personal", icon: User, label: "Dados Pessoais", component: StepPersonalData,
    canProceed: (d) => {
      if (!d.document) return true; // campo opcional — deixa prosseguir sem preencher
      return d.documentType === "cpf" ? isValidCPF(d.document) : isValidCNPJ(d.document);
    },
  },
  { id: "farm", icon: Tractor, label: "Fazenda", component: StepFarm, condition: (d) => d.profileType === "produtor" || d.profileType === "ambos" },
  { id: "animals", icon: Beef, label: "Animais", component: StepAnimals, condition: (d) => {
    const isFarmer = d.profileType === "produtor" || d.profileType === "ambos";
    const isPecuaria = ["pecuaria_corte", "leiteira", "mista"].includes(d.mainActivity);
    return isFarmer && isPecuaria;
  }},
  { id: "accounts", icon: CreditCard, label: "Contas", component: StepAccounts },
  { id: "categories", icon: Tags, label: "Categorias", component: StepCategories },
  { id: "done", icon: PartyPopper, label: "Pronto!", component: StepDone },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { data, updateData, completeOnboarding } = useOnboarding();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Filter steps based on conditions
  const activeSteps = useMemo(() => {
    return ALL_STEPS.filter((s) => !s.condition || s.condition(data));
  }, [data]);

  const currentStep = activeSteps[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === activeSteps.length - 1;
  const progress = ((currentStepIdx + 1) / activeSteps.length) * 100;

  const canProceed = currentStep?.canProceed ? currentStep.canProceed(data) : true;

  const goNext = useCallback(() => {
    if (isLast) {
      completeOnboarding();
      navigate("/");
      toast({ title: "🎉 Configuração concluída!", description: "Bem-vindo ao AgroFinance Pro!" });
    } else {
      setCurrentStepIdx((i) => Math.min(i + 1, activeSteps.length - 1));
    }
  }, [isLast, activeSteps.length, completeOnboarding, navigate]);

  const goBack = useCallback(() => {
    setCurrentStepIdx((i) => Math.max(i - 1, 0));
  }, []);

  const handleSkip = () => {
    completeOnboarding();
    navigate("/");
    toast({ title: "Configuração pulada", description: "Você pode retomar em Configurações." });
  };

  // Ensure step index is valid when steps change
  useEffect(() => {
    if (currentStepIdx >= activeSteps.length) {
      setCurrentStepIdx(activeSteps.length - 1);
    }
  }, [activeSteps.length, currentStepIdx]);

  if (!currentStep) return null;

  const StepComponent = currentStep.component;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
              AF
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Passo {currentStepIdx + 1} de {activeSteps.length}
            </span>
          </div>
          {!isLast && (
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1" onClick={handleSkip}>
              Pular configuração <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300" key={currentStep.id}>
          <StepComponent data={data} update={updateData} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" className="gap-1" onClick={goBack} disabled={isFirst}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button className="gap-1" onClick={goNext} disabled={!canProceed}>
            {isLast ? "IR PARA O DASHBOARD" : "Continuar"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
