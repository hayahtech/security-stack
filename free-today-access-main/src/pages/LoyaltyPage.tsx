import { useState, useMemo } from 'react';
import { useLoyaltyPrograms, useCreateLoyaltyProgram, useToggleLoyaltyProgram, useDeleteLoyaltyProgram, useCoupons, useCreateCoupon, generateCouponCode } from '@/hooks/useLoyalty';
import { useCustomersWithStats, getCustomerLevel } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Ticket, Trophy, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const ruleTypeLabel: Record<string, string> = { por_pedido: 'Por Pedido', por_valor: 'Por Valor (R$)', por_item: 'Por Item' };
const rewardTypeLabel: Record<string, string> = { desconto_fixo: 'Desconto Fixo', desconto_percentual: 'Desconto %', item_gratis: 'Item Grátis' };
const couponTypeLabel: Record<string, string> = { fidelidade: 'Fidelidade', aniversario: 'Aniversário', familia: 'Família', manual: 'Manual', resgate: 'Resgate' };

export default function LoyaltyPage() {
  const { user } = useAuth();
  const { data: programs, isLoading } = useLoyaltyPrograms();
  const createProgram = useCreateLoyaltyProgram();
  const toggleProgram = useToggleLoyaltyProgram();
  const deleteProgram = useDeleteLoyaltyProgram();

  const [couponTypeFilter, setCouponTypeFilter] = useState('all');
  const { data: coupons } = useCoupons({ type: couponTypeFilter });
  const createCoupon = useCreateCoupon();
  const { data: customersWithStats } = useCustomersWithStats();

  // Points ranking
  const { data: allPoints } = useQuery({
    queryKey: ['all_loyalty_points', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_points').select('customer_id, points, type, family_group_id');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const pointsRanking = useMemo(() => {
    if (!allPoints || !customersWithStats) return [];
    const balances: Record<string, number> = {};
    allPoints.forEach(p => {
      if (!balances[p.customer_id]) balances[p.customer_id] = 0;
      balances[p.customer_id] += p.type === 'credito' ? p.points : -p.points;
    });
    return Object.entries(balances)
      .map(([cid, bal]) => {
        const c = customersWithStats.find(cu => cu.id === cid);
        return { customerId: cid, name: c?.name || '?', phone: c?.phone || '', balance: bal };
      })
      .filter(r => r.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 20);
  }, [allPoints, customersWithStats]);

  // Program form
  const [progOpen, setProgOpen] = useState(false);
  const [progName, setProgName] = useState('');
  const [progType, setProgType] = useState('individual');
  const [progRuleType, setProgRuleType] = useState('por_pedido');
  const [progPointsPerUnit, setProgPointsPerUnit] = useState('1');
  const [progRewardType, setProgRewardType] = useState('desconto_fixo');
  const [progRewardValue, setProgRewardValue] = useState('');
  const [progPointsRequired, setProgPointsRequired] = useState('10');
  const [progScope, setProgScope] = useState('individual');
  const [progExpDays, setProgExpDays] = useState('');

  // Coupon form
  const [cupOpen, setCupOpen] = useState(false);
  const [cupCode, setCupCode] = useState('');
  const [cupDiscountType, setCupDiscountType] = useState('fixo');
  const [cupDiscountValue, setCupDiscountValue] = useState('');
  const [cupMinOrder, setCupMinOrder] = useState('0');
  const [cupValidUntil, setCupValidUntil] = useState('');

  const handleCreateProgram = () => {
    createProgram.mutate({
      name: progName, type: progType, rule_type: progRuleType,
      points_per_unit: Number(progPointsPerUnit), reward_type: progRewardType,
      reward_value: Number(progRewardValue), points_required: Number(progPointsRequired),
      scope: progScope, active: true, expiration_days: progExpDays ? Number(progExpDays) : null,
    });
    setProgOpen(false);
    setProgName(''); setProgRewardValue('');
  };

  const handleCreateCoupon = () => {
    const code = cupCode || generateCouponCode('PROMO');
    const validUntil = cupValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    createCoupon.mutate({
      code, type: 'manual', discount_type: cupDiscountType,
      discount_value: Number(cupDiscountValue), min_order_value: Number(cupMinOrder),
      valid_from: new Date().toISOString().split('T')[0], valid_until: validUntil,
    });
    setCupOpen(false);
    setCupCode(''); setCupDiscountValue('');
  };

  // Presets
  const presets = [
    { name: 'A cada 10 pizzas, ganhe 1 grátis', type: 'individual', rule_type: 'por_item', points_per_unit: 1, reward_type: 'item_gratis', reward_value: 1, points_required: 10, scope: 'individual' },
    { name: 'Acumule R$200 e ganhe R$20 de desconto', type: 'individual', rule_type: 'por_valor', points_per_unit: 1, reward_type: 'desconto_fixo', reward_value: 20, points_required: 200, scope: 'individual' },
    { name: 'Família: 50 pedidos = rodízio grátis', type: 'familia', rule_type: 'por_pedido', points_per_unit: 1, reward_type: 'item_gratis', reward_value: 1, points_required: 50, scope: 'familia' },
  ];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Fidelidade & Cupons</h1>
        <p className="text-sm text-muted-foreground">Programas de fidelidade, pontos e cupons</p>
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs"><Star className="h-4 w-4 mr-1" /> Programas</TabsTrigger>
          <TabsTrigger value="coupons"><Ticket className="h-4 w-4 mr-1" /> Cupons</TabsTrigger>
          <TabsTrigger value="ranking"><Trophy className="h-4 w-4 mr-1" /> Ranking de Pontos</TabsTrigger>
        </TabsList>

        {/* PROGRAMS TAB */}
        <TabsContent value="programs" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Programas de pontuação e recompensas</p>
            <Button onClick={() => setProgOpen(true)} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo Programa</Button>
          </div>

          {/* Presets */}
          <Card>
            <CardHeader><CardTitle className="text-base">Modelos Prontos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {presets.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm">{p.name}</span>
                  <Button size="sm" variant="outline" onClick={() => {
                    createProgram.mutate({ ...p, active: true, expiration_days: null });
                  }}>Usar</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {(programs || []).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum programa ativo</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {(programs || []).map(p => (
                <Card key={p.id} className={!p.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{p.name}</span>
                        <Badge variant="outline" className="text-xs">{p.type === 'familia' ? 'Família' : 'Individual'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ruleTypeLabel[p.rule_type]} · {p.points_per_unit} pt/un · Meta: {p.points_required} pts → {rewardTypeLabel[p.reward_type]} {p.reward_type === 'desconto_percentual' ? `${p.reward_value}%` : p.reward_type === 'desconto_fixo' ? formatCurrency(p.reward_value) : `${p.reward_value} item`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={p.active} onCheckedChange={v => toggleProgram.mutate({ id: p.id, active: v })} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm('Remover programa?')) deleteProgram.mutate(p.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COUPONS TAB */}
        <TabsContent value="coupons" className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <Select value={couponTypeFilter} onValueChange={setCouponTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="fidelidade">Fidelidade</SelectItem>
                <SelectItem value="aniversario">Aniversário</SelectItem>
                <SelectItem value="familia">Família</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="resgate">Resgate</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setCupCode(generateCouponCode('PROMO')); setCupOpen(true); }} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Gerar Cupom</Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(coupons || []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum cupom</TableCell></TableRow>
                ) : (
                  (coupons || []).map((c: any) => {
                    const today = new Date().toISOString().split('T')[0];
                    const isExpired = c.valid_until < today;
                    const isUsed = !!c.used_at;
                    const status = isUsed ? 'Usado' : isExpired ? 'Expirado' : 'Ativo';
                    const statusVariant = isUsed ? 'secondary' : isExpired ? 'destructive' : 'default';
                    return (
                      <TableRow key={c.id} className={isUsed || isExpired ? 'opacity-60' : ''}>
                        <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{couponTypeLabel[c.type] || c.type}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {c.discount_type === 'fixo' ? formatCurrency(c.discount_value) : c.discount_type === 'percentual' ? `${c.discount_value}%` : 'Item grátis'}
                        </TableCell>
                        <TableCell className="text-sm">{c.customers?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(c.valid_until + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell><Badge variant={statusVariant as any} className="text-xs">{status}</Badge></TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* RANKING TAB */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Ranking de Pontos — Clientes</CardTitle></CardHeader>
            <CardContent>
              {pointsRanking.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum ponto acumulado ainda</p>
              ) : (
                <div className="space-y-2">
                  {pointsRanking.map((r, i) => (
                    <div key={r.customerId} className={`flex items-center gap-3 p-3 rounded-lg border ${i === 0 ? 'border-primary bg-primary/5' : ''}`}>
                      <span className="text-xl w-8 text-center">{i === 0 ? '🏆' : `#${i + 1}`}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                      </div>
                      <Badge className="text-sm">{r.balance} pts</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Program Dialog */}
      <Dialog open={progOpen} onOpenChange={setProgOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Programa de Fidelidade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={progName} onChange={e => setProgName(e.target.value)} placeholder="Ex: Pizza Fidelidade" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo</Label>
                <Select value={progType} onValueChange={setProgType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="familia">Família</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Regra</Label>
                <Select value={progRuleType} onValueChange={setProgRuleType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="por_pedido">Por Pedido</SelectItem><SelectItem value="por_valor">Por Valor (R$)</SelectItem><SelectItem value="por_item">Por Item</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Pontos por unidade</Label><Input type="number" value={progPointsPerUnit} onChange={e => setProgPointsPerUnit(e.target.value)} /></div>
              <div><Label>Pontos para resgatar</Label><Input type="number" value={progPointsRequired} onChange={e => setProgPointsRequired(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo de Recompensa</Label>
                <Select value={progRewardType} onValueChange={setProgRewardType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="desconto_fixo">Desconto (R$)</SelectItem><SelectItem value="desconto_percentual">Desconto (%)</SelectItem><SelectItem value="item_gratis">Item Grátis</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Valor da Recompensa</Label><Input type="number" value={progRewardValue} onChange={e => setProgRewardValue(e.target.value)} placeholder={progRewardType === 'desconto_percentual' ? 'Ex: 15' : 'Ex: 20'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Escopo</Label>
                <Select value={progScope} onValueChange={setProgScope}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="familia">Família</SelectItem><SelectItem value="ambos">Ambos</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Expiração (dias, vazio = nunca)</Label><Input type="number" value={progExpDays} onChange={e => setProgExpDays(e.target.value)} placeholder="Ex: 365" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProgram} disabled={!progName || !progRewardValue}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Coupon Dialog */}
      <Dialog open={cupOpen} onOpenChange={setCupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerar Cupom Manual</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Código</Label><Input value={cupCode} onChange={e => setCupCode(e.target.value.toUpperCase())} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipo de Desconto</Label>
                <Select value={cupDiscountType} onValueChange={setCupDiscountType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="fixo">Fixo (R$)</SelectItem><SelectItem value="percentual">Percentual (%)</SelectItem><SelectItem value="item_gratis">Item Grátis</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Valor</Label><Input type="number" value={cupDiscountValue} onChange={e => setCupDiscountValue(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Pedido Mínimo (R$)</Label><Input type="number" value={cupMinOrder} onChange={e => setCupMinOrder(e.target.value)} /></div>
              <div><Label>Válido até</Label><Input type="date" value={cupValidUntil} onChange={e => setCupValidUntil(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCupOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCoupon} disabled={!cupCode || !cupDiscountValue}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
