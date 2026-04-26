import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Building2, Users, Plug, FileText, Settings2, Ruler, Globe, Shield, Database,
  ShoppingCart, Truck, CreditCard, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus,
  Warehouse as WarehouseIcon, MapPin, Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { integrations } from '@/data/mockData';
import { NewUserModal } from '@/components/settings/NewUserModal';
import { NewCustomFieldModal } from '@/components/settings/NewCustomFieldModal';
import type { Warehouse } from '@/types';

const roleColors: Record<string, string> = {
  ADMINISTRADOR: 'bg-destructive/20 text-destructive',
  GERENTE: 'bg-primary/20 text-primary',
  OPERADOR: 'bg-success/20 text-success',
  VISUALIZADOR: 'bg-muted text-muted-foreground',
  AUDITOR: 'bg-warning/20 text-warning',
};

const statusIcons = {
  connected: <CheckCircle className="h-4 w-4 text-success" />,
  disconnected: <XCircle className="h-4 w-4 text-muted-foreground" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const integrationIcons: Record<string, React.ElementType> = {
  erp: Database,
  ecommerce: ShoppingCart,
  logistics: Truck,
  financial: CreditCard,
};

export default function SettingsPage() {
  const { users, warehouses } = useAppStore();
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [newFieldOpen, setNewFieldOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu sistema e integrações</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden lg:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden lg:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden lg:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden lg:inline">Auditoria</span>
          </TabsTrigger>
          <TabsTrigger value="custom-fields" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden lg:inline">Campos</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Ruler className="h-4 w-4" />
            <span className="hidden lg:inline">Unidades</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil da Empresa</CardTitle>
              <CardDescription>Informações gerais do negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome da Empresa</label>
                  <p className="text-lg font-medium">TechCommerce Brasil LTDA</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                  <p className="text-lg font-mono">12.345.678/0001-90</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                  <p className="text-lg">contato@techcommerce.com.br</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="text-lg font-mono">(11) 3456-7890</p>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Armazéns Configurados</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {warehouses.map((wh) => (
                    <Badge
                      key={wh.id}
                      variant={selectedWarehouse?.id === wh.id ? 'default' : 'secondary'}
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setSelectedWarehouse(selectedWarehouse?.id === wh.id ? null : wh)}
                    >
                      {wh.city}, {wh.state}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Warehouse Details */}
              {selectedWarehouse && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <WarehouseIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{selectedWarehouse.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Localização</p>
                          <p className="text-sm font-medium">{selectedWarehouse.city}, {selectedWarehouse.state}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Responsável</p>
                          <p className="text-sm font-medium">{selectedWarehouse.manager}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">SKUs Cadastrados</p>
                          <p className="text-sm font-medium">{selectedWarehouse.totalSKUs}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Capacidade</p>
                        <p className="text-sm font-medium">
                          {selectedWarehouse.usedCapacity.toLocaleString('pt-BR')} / {selectedWarehouse.capacity.toLocaleString('pt-BR')} m³
                          <span className="text-muted-foreground ml-1">
                            ({((selectedWarehouse.usedCapacity / selectedWarehouse.capacity) * 100).toFixed(0)}%)
                          </span>
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Zonas</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedWarehouse.zones.map(z => (
                            <Badge key={z.id} variant="outline" className="text-xs">{z.name}</Badge>
                          ))}
                          {selectedWarehouse.zones.length === 0 && (
                            <span className="text-xs text-muted-foreground">Nenhuma zona configurada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>Controle de acesso baseado em perfis</CardDescription>
              </div>
              <Button size="sm" onClick={() => setNewUserOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(user.lastAccess, "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfis de Acesso (RBAC)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {['ADMINISTRADOR', 'GERENTE', 'OPERADOR', 'VISUALIZADOR', 'AUDITOR'].map((role) => (
                  <div key={role} className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Badge className={roleColors[role]}>{role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role === 'ADMINISTRADOR' && 'Acesso total ao sistema'}
                      {role === 'GERENTE' && 'Gestão de estoque e relatórios'}
                      {role === 'OPERADOR' && 'Operações diárias de estoque'}
                      {role === 'VISUALIZADOR' && 'Apenas visualização'}
                      {role === 'AUDITOR' && 'Acesso a logs e relatórios'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {['erp', 'ecommerce', 'logistics', 'financial'].map((type) => {
            const typeIntegrations = integrations.filter((i) => i.type === type);
            const Icon = integrationIcons[type];
            const labels: Record<string, string> = {
              erp: 'ERPs', ecommerce: 'E-commerce', logistics: 'Logística', financial: 'Financeiro',
            };
            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>{labels[type]}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {typeIntegrations.map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {statusIcons[integration.status]}
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            {integration.lastSync && (
                              <p className="text-xs text-muted-foreground">
                                Sync: {format(integration.lastSync, "HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Log de Auditoria</CardTitle>
              <CardDescription>Registro imutável de todas as ações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'SKU Atualizado', user: 'Carlos Silva', target: 'SKU000001', time: '10:45:23' },
                  { action: 'PO Criado', user: 'Ana Costa', target: 'PO-2024-0021', time: '10:32:15' },
                  { action: 'Usuário Adicionado', user: 'Carlos Silva', target: 'Maria Santos', time: '09:58:47' },
                  { action: 'Transferência Executada', user: 'Roberto Martins', target: 'MOV000215', time: '09:45:12' },
                  { action: 'Alerta Reconhecido', user: 'Ana Costa', target: 'ALT003', time: '09:30:00' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-muted-foreground">{log.time}</span>
                      <span className="font-medium">{log.action}</span>
                      <Badge variant="outline">{log.target}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{log.user}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields Tab */}
        <TabsContent value="custom-fields">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Campos Personalizados</CardTitle>
                <CardDescription>Adicione atributos customizados aos SKUs</CardDescription>
              </div>
              <Button size="sm" onClick={() => setNewFieldOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Campo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Código NCM', type: 'Texto', required: true },
                  { name: 'Peso Líquido', type: 'Número', required: false },
                  { name: 'País de Origem', type: 'Seleção', required: false },
                  { name: 'Certificações', type: 'Multi-seleção', required: false },
                ].map((field, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{field.name}</span>
                      <Badge variant="secondary">{field.type}</Badge>
                      {field.required && <Badge variant="destructive">Obrigatório</Badge>}
                    </div>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Unidades de Medida</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['UN - Unidade', 'KG - Quilograma', 'L - Litro', 'M - Metro', 'M² - Metro Quadrado', 'M³ - Metro Cúbico', 'CX - Caixa', 'PCT - Pacote'].map((unit) => (
                    <div key={unit} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <span className="font-mono text-sm">{unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Moedas e Localização</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Moeda Principal</label>
                  <p className="text-lg font-mono">BRL - Real Brasileiro (R$)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fuso Horário</label>
                  <p className="text-lg">America/Sao_Paulo (GMT-3)</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Formato de Data</label>
                  <p className="text-lg font-mono">DD/MM/AAAA</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NewUserModal open={newUserOpen} onOpenChange={setNewUserOpen} />
      <NewCustomFieldModal open={newFieldOpen} onOpenChange={setNewFieldOpen} />
    </div>
  );
}
