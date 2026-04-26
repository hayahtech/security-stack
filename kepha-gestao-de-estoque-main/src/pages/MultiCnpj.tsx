import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Building2, Store, Landmark, Truck, ArrowRightLeft, Package, FileText,
  AlertTriangle, Link2, Eye, HandCoins, Handshake, ClipboardList, Plus,
  ChevronRight, Check, X, Clock, Send, ReceiptText, ArrowRight, Filter
} from 'lucide-react';
import { NewComodatoModal } from '@/components/multi-cnpj/NewComodatoModal';
import {
  companies, stockOwnership, intercompanyTransfers, consignments,
  comodatoItems, intercompanyBalances, fiscalObligations, cfopMap,
  type GroupCompany, type IntercompanyTransfer, type TransferStatus, type Consignment, type ComodatoItem
} from '@/data/multiCnpjData';

const fmt = (v: number) => v >= 1_000_000 ? `R$ ${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}K` : `R$ ${v.toLocaleString('pt-BR')}`;
const fmtFull = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR');

const companyIcon = (type: GroupCompany['type']) => {
  switch (type) {
    case 'cd_central': return <Building2 className="h-5 w-5 text-primary" />;
    case 'filial_varejo': return <Store className="h-5 w-5 text-chart-2" />;
    case 'holding': return <Landmark className="h-5 w-5 text-chart-4" />;
    default: return <Truck className="h-5 w-5 text-chart-3" />;
  }
};

const typeLabel = (type: GroupCompany['type']) => {
  const m: Record<string, string> = { cd_central: 'CD Central', filial_varejo: 'Filial Varejista', holding: 'Holding', transportadora: 'Transportadora' };
  return m[type] || type;
};

const transferStatusConfig: Record<TransferStatus, { label: string; color: string; icon: React.ReactNode }> = {
  SOLICITADO: { label: 'Solicitado', color: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
  APROVADO: { label: 'Aprovado', color: 'bg-chart-2/20 text-chart-2', icon: <Check className="h-3 w-3" /> },
  NF_EMITIDA: { label: 'NF Emitida', color: 'bg-chart-4/20 text-chart-4', icon: <ReceiptText className="h-3 w-3" /> },
  EM_TRANSITO: { label: 'Em Trânsito', color: 'bg-primary/20 text-primary', icon: <Truck className="h-3 w-3" /> },
  RECEBIDO: { label: 'Recebido', color: 'bg-chart-2/20 text-chart-2', icon: <Package className="h-3 w-3" /> },
  CONCLUIDO: { label: 'Concluído', color: 'bg-chart-2/15 text-chart-2', icon: <Check className="h-3 w-3" /> },
};

const MultiCnpj = () => {
  const [perspective, setPerspective] = useState<'consolidated' | 'cnpj' | 'cd'>('consolidated');
  const [stockView, setStockView] = useState<'posse' | 'propriedade'>('posse');
  const [selectedTransfer, setSelectedTransfer] = useState<IntercompanyTransfer | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [newTransferOpen, setNewTransferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newComodatoOpen, setNewComodatoOpen] = useState(false);

  const kanbanCols: TransferStatus[] = ['SOLICITADO', 'APROVADO', 'NF_EMITIDA', 'EM_TRANSITO', 'RECEBIDO', 'CONCLUIDO'];

  const divergentFiscal = fiscalObligations.filter(f => f.senderStatus === 'DIVERGENTE' || f.receiverStatus === 'DIVERGENTE');
  const overdueCom = comodatoItems.filter(c => c.status === 'VENCIDO');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão Multi-CNPJ</h1>
          <p className="text-sm text-muted-foreground">Controle intercompany, consignação e comodato do grupo econômico</p>
        </div>
        <div className="flex items-center gap-2">
          {divergentFiscal.length > 0 && (
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{divergentFiscal.length} divergência(s) fiscal</Badge>
          )}
          {overdueCom.length > 0 && (
            <Badge className="bg-warning/20 text-warning gap-1"><Clock className="h-3 w-3" />{overdueCom.length} comodato(s) vencido(s)</Badge>
          )}
        </div>
      </div>

      {/* Perspective Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Perspectiva:</span>
        {(['consolidated', 'cnpj', 'cd'] as const).map(p => (
          <Button key={p} size="sm" variant={perspective === p ? 'default' : 'outline'}
            onClick={() => setPerspective(p)}>
            {p === 'consolidated' ? 'Visão Consolidada' : p === 'cnpj' ? 'Por CNPJ' : 'Por CD Físico'}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 h-9">
          <TabsTrigger value="overview" className="text-xs">Painel do Grupo</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs">Estoque</TabsTrigger>
          <TabsTrigger value="transfers" className="text-xs">Transferências</TabsTrigger>
          <TabsTrigger value="consignment" className="text-xs">Consignação</TabsTrigger>
          <TabsTrigger value="comodato" className="text-xs">Comodato</TabsTrigger>
          <TabsTrigger value="balances" className="text-xs">Posição IC</TabsTrigger>
          <TabsTrigger value="fiscal" className="text-xs">Fiscal</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW ===== */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {companies.map(c => (
              <Card key={c.id} className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {companyIcon(c.type)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{c.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">{c.cnpj}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px]">{typeLabel(c.type)}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {c.type !== 'holding' ? (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Estoque Próprio</span><span className="font-semibold">{fmt(c.ownStock)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Custodiado</span><span className="font-semibold">{fmt(c.custodiedStock)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Em Consignação</span><span className="font-semibold">{fmt(c.consignedStock)}</span></div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">SKUs Próprios</span><span>{c.ownSKUs.toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">SKUs de Terceiros</span><span>{c.thirdPartySKUs}</span></div>
                      {c.pendingPOs > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">POs Pendentes</span><Badge variant="secondary" className="text-[10px]">{c.pendingPOs}</Badge></div>}
                      {c.pendingFromCD > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground">A Receber do CD</span><span className="text-primary font-medium">{fmt(c.pendingFromCD)}</span></div>}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Holding — gestão patrimonial e locações para o grupo</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Transferências Ativas', value: intercompanyTransfers.filter(t => !['CONCLUIDO'].includes(t.status)).length, icon: ArrowRightLeft },
              { label: 'Consignações Ativas', value: consignments.filter(c => c.status !== 'ENCERRADA').length, icon: Handshake },
              { label: 'Comodatos Ativos', value: comodatoItems.filter(c => c.status !== 'DEVOLVIDO').length, icon: HandCoins },
              { label: 'Divergências Fiscais', value: divergentFiscal.length, icon: AlertTriangle },
              { label: 'NFs Pendentes', value: fiscalObligations.filter(f => f.senderStatus === 'PENDENTE' || f.receiverStatus === 'PENDENTE').length, icon: FileText },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== STOCK ===== */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant={stockView === 'posse' ? 'default' : 'outline'} onClick={() => setStockView('posse')}>
                <Eye className="h-4 w-4 mr-1" /> Posse Física
              </Button>
              <Button size="sm" variant={stockView === 'propriedade' ? 'default' : 'outline'} onClick={() => setStockView('propriedade')}>
                <ClipboardList className="h-4 w-4 mr-1" /> Propriedade Fiscal
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    {stockView === 'posse' ? (
                      <>
                        <TableHead className="text-right">Qtd Total</TableHead>
                        <TableHead className="text-right">Próprio</TableHead>
                        <TableHead className="text-right">Custodiado</TableHead>
                        <TableHead className="text-right">Consignado</TableHead>
                        <TableHead className="text-right">Em Trânsito</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>Localização Física</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status Fiscal</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockOwnership.map(s => {
                    const shared = s.ownerId !== s.custodyId;
                    return (
                      <TableRow key={s.id} className={shared ? 'bg-primary/5' : ''}>
                        <TableCell className="font-mono text-xs">{s.skuId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {shared && <Link2 className="h-3 w-3 text-primary" />}
                            <span className="text-sm">{s.skuName}</span>
                          </div>
                        </TableCell>
                        {stockView === 'posse' ? (
                          <>
                            <TableCell className="text-right font-semibold">{s.totalQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{s.ownQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{s.custodiedQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{s.consignedQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{s.inTransitQty > 0 ? <Badge variant="secondary" className="text-[10px]">{s.inTransitQty}</Badge> : '—'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-sm">{s.ownerName}</TableCell>
                            <TableCell className="text-sm">{s.custodyName}</TableCell>
                            <TableCell className="text-right">{s.totalQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold">{fmtFull(s.totalQty * s.unitCost)}</TableCell>
                            <TableCell>
                              <Badge variant={s.fiscalStatus === 'REGULAR' ? 'default' : s.fiscalStatus === 'PENDENTE' ? 'secondary' : 'destructive'}
                                className="text-[10px]">{s.fiscalStatus}</Badge>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {stockView === 'posse' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3 text-primary" /> Linhas destacadas indicam estoque com propriedade fiscal e posse física em CNPJs distintos</p>
          )}
        </TabsContent>

        {/* ===== TRANSFERS (Kanban) ===== */}
        <TabsContent value="transfers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pipeline de Transferências Intercompany</h2>
            <Dialog open={newTransferOpen} onOpenChange={setNewTransferOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Transferência</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Transferência Intercompany</DialogTitle>
                </DialogHeader>
                <NewTransferForm onClose={() => setNewTransferOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-6 gap-2 overflow-x-auto">
            {kanbanCols.map(col => {
              const items = intercompanyTransfers.filter(t => t.status === col);
              const cfg = transferStatusConfig[col];
              return (
                <div key={col} className="space-y-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {items.map(t => (
                      <Card key={t.id} className="cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => setSelectedTransfer(t)}>
                        <CardContent className="p-3 space-y-2">
                          <p className="font-mono text-xs font-semibold">{t.number}</p>
                          <div className="text-[11px] space-y-1">
                            <p className="text-muted-foreground">De: <span className="text-foreground">{t.fromName}</span></p>
                            <p className="text-muted-foreground">Para: <span className="text-foreground">{t.toName}</span></p>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-[11px]">
                            <span>{t.skuCount} SKUs</span>
                            <span className="font-semibold">{fmtFull(t.totalValue)}</span>
                          </div>
                          {t.nfNumber && <p className="text-[10px] text-muted-foreground">NF-e: {t.nfNumber}</p>}
                          <p className="text-[10px] text-muted-foreground">Prazo: {fmtDate(t.deadline)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transfer Detail Dialog */}
          <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedTransfer?.number}</DialogTitle>
              </DialogHeader>
              {selectedTransfer && <TransferDetail transfer={selectedTransfer} />}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== CONSIGNMENT ===== */}
        <TabsContent value="consignment" className="space-y-4">
          <h2 className="text-lg font-semibold">Consignações Ativas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {consignments.map(c => (
              <Card key={c.id} className={c.status === 'EM_ACERTO' ? 'border-warning/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={c.status === 'ATIVA' ? 'default' : c.status === 'EM_ACERTO' ? 'secondary' : 'outline'} className="text-[10px] gap-1">
                      <Handshake className="h-3 w-3" />{c.status.replace('_', ' ')}
                    </Badge>
                    {c.consignorExternal && <Badge variant="outline" className="text-[10px]">Fornecedor Externo</Badge>}
                  </div>
                  <CardTitle className="text-sm mt-2">Consignação #{c.id.split('-')[1]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Consignante</span><span className="font-medium">{c.consignorName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Consignatário</span><span className="font-medium">{c.consigneeName}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Itens</span><span>{c.skuCount} SKUs</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor Total</span><span className="font-semibold">{fmtFull(c.totalValue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Vendido (a pagar)</span><span className="text-chart-2 font-semibold">{fmtFull(c.soldValue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Devolução prevista</span><span>{fmtDate(c.returnDue)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Dias em aberto</span><span>{c.daysOpen}</span></div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setSelectedConsignment(c)}>Ver Itens</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Acertar Conta</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Devolver</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={!!selectedConsignment} onOpenChange={() => setSelectedConsignment(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Itens em Consignação — {selectedConsignment?.consignorName}</DialogTitle>
              </DialogHeader>
              {selectedConsignment && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Enviada</TableHead>
                      <TableHead className="text-right">Vendida</TableHead>
                      <TableHead className="text-right">A Devolver</TableHead>
                      <TableHead className="text-right">Valor Vendido</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedConsignment.items.map(i => (
                      <TableRow key={i.skuId}>
                        <TableCell className="font-mono text-xs">{i.skuId}</TableCell>
                        <TableCell className="text-sm">{i.skuName}</TableCell>
                        <TableCell className="text-right">{i.sentQty}</TableCell>
                        <TableCell className="text-right">{i.soldQty}</TableCell>
                        <TableCell className="text-right">{i.returnQty}</TableCell>
                        <TableCell className="text-right font-semibold">{fmtFull(i.soldQty * i.unitPrice)}</TableCell>
                        <TableCell>
                          <Badge variant={i.status === 'VENDIDO' ? 'default' : i.status === 'A_DEVOLVER' ? 'secondary' : i.status === 'AVARIADO' ? 'destructive' : 'outline'}
                            className="text-[10px]">{i.status.replace('_', ' ')}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== COMODATO ===== */}
        <TabsContent value="comodato" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gestão de Comodato</h2>
            <Button size="sm" onClick={() => setNewComodatoOpen(true)}><Plus className="h-4 w-4 mr-1" /> Registrar Comodato</Button>
          </div>

          {overdueCom.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{overdueCom.length} comodato(s) com prazo vencido</p>
                  <p className="text-xs text-muted-foreground">Regularize a devolução ou renove o termo de comodato</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Detentor</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Prazo Devolução</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead className="text-right">Valor do Bem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comodatoItems.map(c => (
                    <TableRow key={c.id} className={c.status === 'VENCIDO' ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium text-sm">{c.item}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.description}</TableCell>
                      <TableCell className="text-sm">{c.ownerName}</TableCell>
                      <TableCell className="text-sm">{c.holderName}</TableCell>
                      <TableCell className="text-xs">{fmtDate(c.exitDate)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(c.returnDue)}</TableCell>
                      <TableCell className="text-xs">{c.condition}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{fmtFull(c.assetValue)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'ATIVO' ? 'default' : c.status === 'VENCIDO' ? 'destructive' : 'secondary'}
                          className="text-[10px]">{c.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== INTERCOMPANY BALANCES ===== */}
        <TabsContent value="balances" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Posição Intercompany</h2>
            <Button size="sm" variant="outline"><ArrowRightLeft className="h-4 w-4 mr-1" /> Eliminar Intercompany</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Matriz de Saldos entre Empresas</CardTitle>
              <CardDescription className="text-xs">Valores positivos = a receber · Valores negativos = a pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <BalanceMatrix />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalhamento de Saldos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Direção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intercompanyBalances.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm font-medium">{b.fromName}</TableCell>
                      <TableCell><ArrowRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                      <TableCell className="text-sm font-medium">{b.toName}</TableCell>
                      <TableCell className={`text-right font-semibold ${b.balance >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                        {fmtFull(Math.abs(b.balance))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{b.balance >= 0 ? 'A Receber' : 'A Pagar'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== FISCAL ===== */}
        <TabsContent value="fiscal" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Controle Fiscal Intercompany</h2>
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" /> {fiscalObligations.length} NFs registradas
            </Badge>
          </div>

          {divergentFiscal.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">{divergentFiscal.length} NF(s) com status divergente entre remetente e destinatário</p>
                  <p className="text-xs text-muted-foreground">Verifique a escrituração contábil de cada CNPJ</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NF-e</TableHead>
                    <TableHead>Remetente</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>CFOP</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Status Remetente</TableHead>
                    <TableHead>Status Destinatário</TableHead>
                    <TableHead>Natureza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiscalObligations.map(f => {
                    const hasDivergence = f.senderStatus === 'DIVERGENTE' || f.receiverStatus === 'DIVERGENTE';
                    return (
                      <TableRow key={f.id} className={hasDivergence ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-mono text-xs font-semibold">{f.nfNumber}</TableCell>
                        <TableCell className="text-sm">{f.fromName}</TableCell>
                        <TableCell className="text-sm">{f.toName}</TableCell>
                        <TableCell className="text-right font-semibold text-sm">{fmtFull(f.value)}</TableCell>
                        <TableCell className="font-mono text-xs">{f.cfop}</TableCell>
                        <TableCell className="text-xs">{fmtDate(f.issuedAt)}</TableCell>
                        <TableCell>
                          <FiscalStatusBadge status={f.senderStatus} />
                        </TableCell>
                        <TableCell>
                          <FiscalStatusBadge status={f.receiverStatus} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{f.nature}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <NewComodatoModal open={newComodatoOpen} onOpenChange={setNewComodatoOpen} />
    </div>
  );
};

// ===== Sub-Components =====

const FiscalStatusBadge = ({ status }: { status: string }) => (
  <Badge variant={status === 'ESCRITURADO' ? 'default' : status === 'PENDENTE' ? 'secondary' : 'destructive'}
    className="text-[10px] gap-1">
    {status === 'ESCRITURADO' ? <Check className="h-3 w-3" /> : status === 'DIVERGENTE' ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
    {status}
  </Badge>
);

const TransferDetail = ({ transfer }: { transfer: IntercompanyTransfer }) => {
  const typeLabels: Record<string, string> = {
    TRANSFERENCIA_PROPRIEDADE: 'Transferência de Propriedade',
    REMESSA_DEPOSITO: 'Remessa para Depósito',
    CONSIGNACAO: 'Consignação',
    COMODATO: 'Comodato',
    DEVOLUCAO: 'Devolução Intercompany',
  };

  const steps = [
    { key: 'SOLICITADO', label: 'Solicitado', done: true, date: transfer.requestedAt },
    { key: 'APROVADO', label: 'Aprovado', done: ['APROVADO', 'NF_EMITIDA', 'EM_TRANSITO', 'RECEBIDO', 'CONCLUIDO'].includes(transfer.status) },
    { key: 'NF_EMITIDA', label: 'NF Emitida', done: ['NF_EMITIDA', 'EM_TRANSITO', 'RECEBIDO', 'CONCLUIDO'].includes(transfer.status) },
    { key: 'EM_TRANSITO', label: 'Em Trânsito', done: ['EM_TRANSITO', 'RECEBIDO', 'CONCLUIDO'].includes(transfer.status) },
    { key: 'RECEBIDO', label: 'Recebido', done: ['RECEBIDO', 'CONCLUIDO'].includes(transfer.status) },
    { key: 'CONCLUIDO', label: 'Concluído', done: transfer.status === 'CONCLUIDO', date: transfer.completedAt },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{typeLabels[transfer.type]}</span></div>
        <div><span className="text-muted-foreground">CFOP:</span> <span className="font-mono">{transfer.cfop}</span></div>
        <div><span className="text-muted-foreground">De:</span> <span className="font-medium">{transfer.fromName}</span></div>
        <div><span className="text-muted-foreground">Para:</span> <span className="font-medium">{transfer.toName}</span></div>
        <div><span className="text-muted-foreground">Valor:</span> <span className="font-semibold">{fmtFull(transfer.totalValue)}</span></div>
        <div><span className="text-muted-foreground">Markup:</span> <span>{transfer.markup}%</span></div>
        {transfer.nfNumber && <div><span className="text-muted-foreground">NF-e:</span> <span className="font-mono">{transfer.nfNumber}</span></div>}
        {transfer.nfKey && <div className="col-span-2"><span className="text-muted-foreground">Chave:</span> <span className="font-mono text-xs break-all">{transfer.nfKey}</span></div>}
      </div>

      <Separator />
      <p className="text-sm font-semibold">Fluxo da Transferência</p>
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${
              s.done ? 'bg-chart-2/15 text-chart-2' : transfer.status === s.key ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {s.done ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {s.label}
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>
    </div>
  );
};

const NewTransferForm = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const selectedType = type as keyof typeof cfopMap;
  const fiscal = cfopMap[selectedType];

  return (
    <div className="space-y-4">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground'
            }`}>{s}</div>
            {s < 4 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Etapa 1 — Partes Envolvidas</h3>
          <div className="space-y-3">
            <div><Label className="text-xs">CNPJ Remetente</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.cnpj})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">CNPJ Destinatário</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{companies.filter(c => c.id !== from).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.cnpj})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Tipo de Operação</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFERENCIA_PROPRIEDADE">Transferência de Propriedade</SelectItem>
                  <SelectItem value="REMESSA_DEPOSITO">Remessa para Depósito</SelectItem>
                  <SelectItem value="CONSIGNACAO">Consignação</SelectItem>
                  <SelectItem value="COMODATO">Comodato</SelectItem>
                  <SelectItem value="DEVOLUCAO">Devolução Intercompany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Etapa 2 — Itens</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Markup %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockOwnership.slice(0, 3).map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.skuId}</TableCell>
                  <TableCell className="text-sm">{s.skuName}</TableCell>
                  <TableCell className="text-right">{s.ownQty}</TableCell>
                  <TableCell className="text-right"><Input className="w-16 h-7 text-xs" defaultValue="0" /></TableCell>
                  <TableCell className="text-right">{fmtFull(s.unitCost)}</TableCell>
                  <TableCell className="text-right"><Input className="w-14 h-7 text-xs" defaultValue="4.5" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">Markup intercompany deve estar entre 2% e 8% para compliance com preço de transferência</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Etapa 3 — Fiscal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">CFOP</Label><Input value={fiscal?.cfop || ''} readOnly className="font-mono" /></div>
            <div><Label className="text-xs">Natureza da Operação</Label><Input value={fiscal?.nature || ''} readOnly /></div>
            <div><Label className="text-xs">CST/CSOSN</Label><Input defaultValue="000" /></div>
            <div><Label className="text-xs">ICMS %</Label><Input defaultValue="18" /></div>
            <div><Label className="text-xs">PIS %</Label><Input defaultValue="1.65" /></div>
            <div><Label className="text-xs">COFINS %</Label><Input defaultValue="7.60" /></div>
          </div>
          <div><Label className="text-xs">Observações Fiscais</Label><Input placeholder="Observações adicionais..." /></div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Etapa 4 — Confirmação</h3>
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Remetente:</span> {companies.find(c => c.id === from)?.name || '—'}</p>
              <p><span className="text-muted-foreground">Destinatário:</span> {companies.find(c => c.id === to)?.name || '—'}</p>
              <p><span className="text-muted-foreground">Tipo:</span> {type.replace(/_/g, ' ')}</p>
              <p><span className="text-muted-foreground">CFOP:</span> <span className="font-mono">{fiscal?.cfop}</span></p>
              <Separator />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto-nf" defaultChecked className="rounded" />
                <label htmlFor="auto-nf" className="text-xs">Gerar NF-e automaticamente</label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
          {step > 1 ? 'Voltar' : 'Cancelar'}
        </Button>
        <Button size="sm" onClick={() => step < 4 ? setStep(step + 1) : onClose()}>
          {step < 4 ? 'Próximo' : 'Confirmar Transferência'}
        </Button>
      </div>
    </div>
  );
};

const BalanceMatrix = () => {
  const ids = companies.map(c => c.id);
  const names = companies.map(c => c.name.split(' ').slice(0, 2).join(' '));

  const getBalance = (fromId: string, toId: string) => {
    if (fromId === toId) return null;
    const b = intercompanyBalances.find(b => b.fromId === fromId && b.toId === toId);
    if (b) return b.balance;
    const rev = intercompanyBalances.find(b => b.fromId === toId && b.toId === fromId);
    if (rev) return -rev.balance;
    return 0;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          {names.map((n, i) => <TableHead key={i} className="text-xs text-center">{n}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ids.map((rowId, ri) => (
          <TableRow key={rowId}>
            <TableCell className="font-medium text-xs">{names[ri]}</TableCell>
            {ids.map((colId, ci) => {
              const val = getBalance(rowId, colId);
              return (
                <TableCell key={colId} className={`text-center text-xs font-semibold ${
                  val === null ? 'text-muted-foreground' : val > 0 ? 'text-chart-2' : val < 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  {val === null ? '—' : val === 0 ? '—' : fmtFull(Math.abs(val))}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MultiCnpj;
