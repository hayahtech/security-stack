import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Target, Bell, Users, Link2, Palette, Building2, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const goalDefaults = [
  { metric: "Margem EBITDA", current: 40.4, target: 42, unit: "%" },
  { metric: "Churn Rate", current: 2.3, target: 2.0, unit: "%" },
  { metric: "MRR Mensal", current: 4850, target: 5200, unit: "K" },
  { metric: "NPS", current: 72, target: 75, unit: "" },
  { metric: "Margem Líquida", current: 26.1, target: 28, unit: "%" },
  { metric: "LTV/CAC", current: 29.6, target: 30, unit: "x" },
];

const alertConfigs = [
  { name: "Churn acima de", threshold: 3, unit: "%", enabled: true },
  { name: "Fluxo de caixa negativo em", threshold: 15, unit: "dias", enabled: true },
  { name: "Inadimplência acima de", threshold: 5, unit: "%", enabled: true },
  { name: "Margem EBITDA abaixo de", threshold: 35, unit: "%", enabled: false },
  { name: "CMV acima de", threshold: 32, unit: "%", enabled: true },
];

const users = [
  { name: "João da Silva", email: "joao@techbr.com", role: "Admin", status: "Ativo" },
  { name: "Maria Santos", email: "maria@techbr.com", role: "Gestor", status: "Ativo" },
  { name: "Pedro Costa", email: "pedro@techbr.com", role: "Analista", status: "Ativo" },
  { name: "Ana Oliveira", email: "ana@techbr.com", role: "Visualizador", status: "Ativo" },
  { name: "Carlos Mendes", email: "carlos@techbr.com", role: "Analista", status: "Inativo" },
];

const banks = [
  { name: "Itaú Unibanco", status: "Conectado", lastSync: "Hoje, 08:30", accounts: 2 },
  { name: "Banco do Brasil", status: "Conectado", lastSync: "Hoje, 07:45", accounts: 1 },
  { name: "Bradesco", status: "Desconectado", lastSync: "—", accounts: 0 },
  { name: "Santander", status: "Desconectado", lastSync: "—", accounts: 0 },
];

const roleColors: Record<string, string> = {
  Admin: "bg-destructive/20 text-destructive border-destructive/30",
  Gestor: "bg-primary/20 text-primary border-primary/30",
  Analista: "bg-secondary/20 text-secondary border-secondary/30",
  Visualizador: "bg-muted text-muted-foreground border-border",
};

export default function Configuracoes() {
  const [goals, setGoals] = useState(goalDefaults);
  const [alertsState, setAlertsState] = useState(alertConfigs);
  const [companyName, setCompanyName] = useState("TechBR Ltda");
  const [primaryColor, setPrimaryColor] = useState("#00e5ff");

  const handleSave = () => {
    toast({ title: "Configurações salvas!", description: "Todas as alterações foram aplicadas." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground font-data text-sm">Metas, alertas, usuários e integrações</p>
        </div>
        <Button onClick={handleSave} className="gap-2"><Settings className="w-4 h-4" /> Salvar Alterações</Button>
      </div>

      <Tabs defaultValue="metas" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="metas"><Target className="w-3.5 h-3.5 mr-1" /> Metas</TabsTrigger>
          <TabsTrigger value="alertas"><Bell className="w-3.5 h-3.5 mr-1" /> Alertas</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="w-3.5 h-3.5 mr-1" /> Usuários</TabsTrigger>
          <TabsTrigger value="integracoes"><Link2 className="w-3.5 h-3.5 mr-1" /> Integrações</TabsTrigger>
          <TabsTrigger value="empresa"><Palette className="w-3.5 h-3.5 mr-1" /> Empresa</TabsTrigger>
        </TabsList>

        {/* Metas */}
        <TabsContent value="metas">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data">Definição de Metas por Indicador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {goals.map((g, i) => {
                  const progress = Math.min((g.current / g.target) * 100, 100);
                  const isAchieved = g.current >= g.target;
                  return (
                    <div key={g.metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isAchieved ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Target className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-sm font-data font-medium">{g.metric}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-data">Atual: <span className="text-foreground">{g.current}{g.unit}</span></span>
                          <div className="flex items-center gap-1">
                            <Label className="text-xs text-muted-foreground">Meta:</Label>
                            <Input
                              type="number"
                              value={g.target}
                              onChange={(e) => {
                                const updated = [...goals];
                                updated[i] = { ...g, target: parseFloat(e.target.value) || 0 };
                                setGoals(updated);
                              }}
                              className="w-20 h-7 text-xs font-data"
                            />
                            <span className="text-xs text-muted-foreground">{g.unit}</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alertas">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data">Configuração de Alertas (Thresholds)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alertsState.map((a, i) => (
                <div key={a.name} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={a.enabled}
                      onCheckedChange={(v) => {
                        const updated = [...alertsState];
                        updated[i] = { ...a, enabled: v };
                        setAlertsState(updated);
                      }}
                    />
                    <span className="text-sm font-data">{a.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={a.threshold}
                      onChange={(e) => {
                        const updated = [...alertsState];
                        updated[i] = { ...a, threshold: parseFloat(e.target.value) || 0 };
                        setAlertsState(updated);
                      }}
                      className="w-20 h-7 text-xs font-data"
                      disabled={!a.enabled}
                    />
                    <span className="text-xs text-muted-foreground">{a.unit}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios */}
        <TabsContent value="usuarios">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-data">Gestão de Usuários e Permissões</CardTitle>
                <Button size="sm" className="gap-1"><Users className="w-3.5 h-3.5" /> Convidar</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-data">Nome</TableHead>
                    <TableHead className="font-data">E-mail</TableHead>
                    <TableHead className="font-data">Papel</TableHead>
                    <TableHead className="font-data">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell className="font-data text-sm font-medium">{u.name}</TableCell>
                      <TableCell className="font-data text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${roleColors[u.role] || ""}`}>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${u.status === "Ativo" ? "text-success" : "text-muted-foreground"}`}>
                          {u.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80 mt-4">
            <CardHeader><CardTitle className="text-sm font-data flex items-center gap-2"><Shield className="w-4 h-4" /> Níveis de Permissão</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs font-data text-muted-foreground">
              <p><span className="text-destructive font-semibold">Admin:</span> Acesso total, configurações, usuários, integrações</p>
              <p><span className="text-primary font-semibold">Gestor:</span> Visualizar tudo, editar metas e alertas, gerar relatórios</p>
              <p><span className="text-secondary font-semibold">Analista:</span> Visualizar indicadores, gerar relatórios, emitir NF-e</p>
              <p><span className="font-semibold">Visualizador:</span> Apenas visualização do dashboard e relatórios</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integracoes */}
        <TabsContent value="integracoes">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data flex items-center gap-2"><Building2 className="w-4 h-4" /> Integrações Bancárias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {banks.map((b) => (
                <div key={b.name} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-data font-medium">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground font-data">
                        {b.status === "Conectado" ? `Última sync: ${b.lastSync} • ${b.accounts} conta(s)` : "Não conectado"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={b.status === "Conectado" ? "outline" : "default"}
                    className="text-xs"
                    onClick={() => toast({ title: b.status === "Conectado" ? "Sincronizando..." : "Conectando...", description: b.name })}
                  >
                    {b.status === "Conectado" ? "Sincronizar" : "Conectar"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empresa */}
        <TabsContent value="empresa">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader><CardTitle className="text-base font-data">Dados da Empresa</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-data">Nome da Empresa</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-data">CNPJ</Label>
                  <Input value="12.345.678/0001-99" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-data">Segmento</Label>
                  <Select defaultValue="saas">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS B2B</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="industria">Indústria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80">
              <CardHeader><CardTitle className="text-base font-data flex items-center gap-2"><Palette className="w-4 h-4" /> Personalização</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-data">Logotipo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground font-data">Arraste ou clique para enviar</p>
                    <p className="text-[10px] text-muted-foreground mt-1">PNG, SVG • Máx 2MB</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-data">Cor Principal</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-28 font-data text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
