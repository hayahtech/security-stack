import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomer, useCustomerAddresses, useCustomerSales, useCreateAddress, useDeleteAddress, useUpdateCustomer, getCustomerLevel } from '@/hooks/useCustomers';
import { useCustomerPoints, useCustomerBalance, useFamilyBalance, useFamilyMembers, useCustomerCoupons, useFamilyGroups, useCreateFamilyGroup, useAddFamilyMember, type LoyaltyPoint } from '@/hooks/useLoyalty';
import { useCustomerReviews, useCustomerOccurrences } from '@/hooks/useReviews';
import { useLoyaltyPrograms } from '@/hooks/useLoyalty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, MapPin, ShoppingBag, Gift, Phone, Star, Ticket, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: addresses } = useCustomerAddresses(id);
  const { data: sales } = useCustomerSales(id);
  const updateCustomer = useUpdateCustomer();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();

  // Loyalty
  const { data: points } = useCustomerPoints(id);
  const { data: individualBalance } = useCustomerBalance(id);
  const { data: familyBalance } = useFamilyBalance(customer?.family_group_id || undefined);
  const { data: familyMembers } = useFamilyMembers(customer?.family_group_id || undefined);
  const { data: coupons } = useCustomerCoupons(id);
  const { data: customerReviews } = useCustomerReviews(id);
  const { data: customerOccurrences } = useCustomerOccurrences(id);
  const { data: programs } = useLoyaltyPrograms();
  const { data: familyGroups } = useFamilyGroups();
  const createFamilyGroup = useCreateFamilyGroup();
  const addFamilyMember = useAddFamilyMember();

  const [addrOpen, setAddrOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState('casa');
  const [addrZip, setAddrZip] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [addrComp, setAddrComp] = useState('');
  const [addrNeighborhood, setAddrNeighborhood] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [notesEdit, setNotesEdit] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const activeSales = useMemo(() => (sales || []).filter((s: any) => s.status !== 'cancelado'), [sales]);
  const totalSpent = activeSales.reduce((s: number, sale: any) => s + Number(sale.total_amount), 0);
  const totalOrders = activeSales.length;
  const ticketMedio = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const lastSale = activeSales.length > 0 ? activeSales[0] : null;

  const favoriteItem = useMemo(() => {
    const itemCount: Record<string, { name: string; qty: number }> = {};
    activeSales.forEach((sale: any) => {
      (sale.sale_items || []).forEach((si: any) => {
        const name = si.menu_items?.name || 'Desconhecido';
        if (!itemCount[name]) itemCount[name] = { name, qty: 0 };
        itemCount[name].qty += si.quantity;
      });
    });
    const sorted = Object.values(itemCount).sort((a, b) => b.qty - a.qty);
    return sorted[0]?.name || '—';
  }, [activeSales]);

  const monthlyChart = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }
    activeSales.forEach((s: any) => {
      const key = s.date?.substring(0, 7);
      if (key && months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([key]) => {
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'short' });
      return { month: label, pedidos: months[key] };
    });
  }, [activeSales]);

  // Next reward
  const activeProgram = (programs || []).find(p => p.active);
  const pointsToNext = activeProgram ? Math.max(0, activeProgram.points_required - (individualBalance || 0)) : 0;
  const progressPct = activeProgram && activeProgram.points_required > 0 ? Math.min(100, ((individualBalance || 0) / activeProgram.points_required) * 100) : 0;

  const lookupCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) { setAddrStreet(data.logradouro || ''); setAddrNeighborhood(data.bairro || ''); setAddrCity(`${data.localidade}/${data.uf}`); }
    } catch { /* ignore */ }
  };

  const handleAddAddress = () => {
    if (!id) return;
    createAddress.mutate({ customer_id: id, label: addrLabel, street: addrStreet || null, number: addrNumber || null, complement: addrComp || null, neighborhood: addrNeighborhood || null, city: addrCity || null, zipcode: addrZip || null, is_default: false });
    setAddrOpen(false);
    setAddrZip(''); setAddrStreet(''); setAddrNumber(''); setAddrComp(''); setAddrNeighborhood(''); setAddrCity('');
  };

  const handleLinkFamily = () => {
    if (!id) return;
    if (newGroupName) {
      createFamilyGroup.mutate({ name: newGroupName, titularCustomerId: id });
    } else if (selectedGroupId) {
      addFamilyMember.mutate({ family_group_id: selectedGroupId, customer_id: id });
    }
    setFamilyOpen(false);
    setNewGroupName('');
    setSelectedGroupId('');
  };

  if (isLoading || !customer) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const level = getCustomerLevel(totalOrders);
  const birthday = new Date(customer.birth_date + 'T12:00:00');

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">{level.emoji}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{customer.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
            <Badge variant="outline">{level.emoji} {level.label}</Badge>
            <span className="flex items-center gap-1"><Gift className="h-3 w-3" />{birthday.toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pedidos</p><p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{totalOrders}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Gasto</p><p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(totalSpent)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(ticketMedio)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Última Visita</p><p className="text-sm font-bold">{lastSale ? new Date(lastSale.created_at).toLocaleDateString('pt-BR') : '—'}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Favorito</p><p className="text-sm font-bold truncate">{favoriteItem}</p></CardContent></Card>
        {customerOccurrences && customerOccurrences.filter(o => o.status !== 'resolvido').length > 0 && (
          <Card className="border-destructive"><CardContent className="p-3 text-center"><AlertCircle className="h-5 w-5 text-destructive mx-auto mb-1" /><p className="text-xs text-muted-foreground">Ocorrências Abertas</p><p className="text-xl font-bold text-destructive">{customerOccurrences.filter(o => o.status !== 'resolvido').length}</p></CardContent></Card>
        )}
      </div>

      {/* Loyalty Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="font-semibold">Programa de Fidelidade</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Pontos Individuais</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{individualBalance || 0}</p>
            </div>
            {customer.family_group_id && (
              <div>
                <p className="text-xs text-muted-foreground">Pontos Família</p>
                <p className="text-2xl font-bold text-secondary" style={{ fontFamily: 'Nunito' }}>{familyBalance || 0}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Cupons Ativos</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{(coupons || []).filter(c => c.active && !c.used_at).length}</p>
            </div>
          </div>
          {activeProgram && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Faltam <strong>{pointsToNext}</strong> pontos para a próxima recompensa</span>
                <span className="font-bold">{progressPct.toFixed(0)}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="history">
        <TabsList className="flex-wrap">
          <TabsTrigger value="history"><ShoppingBag className="h-4 w-4 mr-1" /> Histórico</TabsTrigger>
          <TabsTrigger value="points"><Star className="h-4 w-4 mr-1" /> Pontos</TabsTrigger>
          <TabsTrigger value="coupons"><Ticket className="h-4 w-4 mr-1" /> Cupons</TabsTrigger>
          <TabsTrigger value="family"><Users className="h-4 w-4 mr-1" /> Família</TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="h-4 w-4 mr-1" /> Endereços</TabsTrigger>
          <TabsTrigger value="reviews"><MessageSquare className="h-4 w-4 mr-1" /> Avaliações</TabsTrigger>
          <TabsTrigger value="notes">Obs.</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {monthlyChart.some(d => d.pedidos > 0) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Frequência de Compras</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip />
                    <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <div className="rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Itens</TableHead><TableHead>Canal</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {activeSales.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum pedido</TableCell></TableRow>
                ) : activeSales.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{new Date(s.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-sm">{(s.sale_items || []).map((si: any) => `${si.quantity}x ${si.menu_items?.name}`).join(', ')}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{s.channel}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(s.total_amount))}</TableCell>
                    <TableCell><Badge variant={s.status === 'fechado' ? 'default' : 'secondary'} className="text-xs capitalize">{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Extrato de Pontos</CardTitle></CardHeader>
            <CardContent>
              {(points || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum ponto registrado</p>
              ) : (
                <div className="space-y-2">
                  {(points || []).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm">{p.description || (p.type === 'credito' ? 'Pontos ganhos' : 'Pontos usados')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${p.type === 'credito' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                          {p.type === 'credito' ? '+' : '-'}{p.points} pts
                        </p>
                        <p className="text-xs text-muted-foreground">Saldo: {p.balance_after}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          {(coupons || []).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum cupom</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {(coupons || []).map(c => {
                const isUsed = !!c.used_at;
                const isExpired = c.valid_until < new Date().toISOString().split('T')[0];
                return (
                  <Card key={c.id} className={isUsed || isExpired ? 'opacity-50' : ''}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-lg">{c.code}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.discount_type === 'fixo' ? formatCurrency(c.discount_value) : c.discount_type === 'percentual' ? `${c.discount_value}% off` : 'Item grátis'}
                          {' · até '}{new Date(c.valid_until + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={isUsed ? 'secondary' : isExpired ? 'destructive' : 'default'}>
                        {isUsed ? 'Usado' : isExpired ? 'Expirado' : 'Ativo'}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          {customer.family_group_id ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Grupo Familiar</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(familyMembers || []).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 border rounded">
                      <span className="text-sm font-medium">{m.customers?.name || '?'}</span>
                      <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{m.customers?.phone}</span>
                    </div>
                  ))}
                </div>
                {familyBalance !== undefined && (
                  <div className="mt-4 p-3 bg-secondary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Saldo Coletivo</p>
                    <p className="text-2xl font-bold text-secondary" style={{ fontFamily: 'Nunito' }}>{familyBalance} pts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">Este cliente não pertence a um grupo familiar</p>
                <Button onClick={() => setFamilyOpen(true)} className="gap-1"><Users className="h-4 w-4" /> Vincular à Família</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAddrOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Novo Endereço</Button>
          </div>
          {(addresses || []).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum endereço cadastrado</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {(addresses || []).map(a => (
                <Card key={a.id}>
                  <CardContent className="p-4 flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-xs capitalize mb-1">{a.label}</Badge>
                      <p className="text-sm">{[a.street, a.number, a.complement].filter(Boolean).join(', ')}</p>
                      <p className="text-xs text-muted-foreground">{[a.neighborhood, a.city, a.zipcode].filter(Boolean).join(' — ')}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteAddress.mutate(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea value={notesEdit} onChange={e => setNotesEdit(e.target.value)} rows={4} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { updateCustomer.mutate({ id: customer.id, notes: notesEdit }); setEditingNotes(false); }}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">{customer.notes || 'Sem observações.'}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => { setNotesEdit(customer.notes || ''); setEditingNotes(true); }}>Editar</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Avaliações ({(customerReviews || []).length})</h3>
            {(customerReviews || []).length === 0 ? (
              <Card><CardContent className="p-4 text-center text-muted-foreground text-sm">Nenhuma avaliação</CardContent></Card>
            ) : (customerReviews || []).map((r: any) => (
              <Card key={r.id} className={r.rating <= 2 ? 'border-l-4 border-l-destructive' : r.rating >= 4 ? 'border-l-4 border-l-[hsl(var(--success))]' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} className={`h-3 w-3 ${n <= r.rating ? 'fill-[hsl(var(--warning))] text-[hsl(var(--warning))]' : 'text-muted-foreground'}`} />)}</div>
                    <Badge variant="outline" className="text-xs">{r.category}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mt-1">"{r.comment}"</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Ocorrências ({(customerOccurrences || []).length})</h3>
            {(customerOccurrences || []).length === 0 ? (
              <Card><CardContent className="p-4 text-center text-muted-foreground text-sm">Nenhuma ocorrência</CardContent></Card>
            ) : (customerOccurrences || []).map((o: any) => (
              <Card key={o.id} className={o.status !== 'resolvido' ? 'border-l-4 border-l-destructive' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={o.type === 'reclamacao' ? 'destructive' : o.type === 'elogio' ? 'default' : 'secondary'} className="text-xs">{o.type}</Badge>
                    <Badge variant="outline" className="text-xs">{o.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-sm mt-1">{o.description}</p>
                  {o.resolution && <p className="text-sm text-muted-foreground mt-1">Resolução: {o.resolution}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Address Dialog */}
      <Dialog open={addrOpen} onOpenChange={setAddrOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Endereço</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Tipo</Label><Select value={addrLabel} onValueChange={setAddrLabel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="casa">Casa</SelectItem><SelectItem value="trabalho">Trabalho</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>CEP</Label><Input value={addrZip} onChange={e => setAddrZip(e.target.value)} onBlur={e => lookupCep(e.target.value)} /></div>
              <div className="col-span-2"><Label>Rua</Label><Input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Número</Label><Input value={addrNumber} onChange={e => setAddrNumber(e.target.value)} /></div>
              <div><Label>Complemento</Label><Input value={addrComp} onChange={e => setAddrComp(e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={addrNeighborhood} onChange={e => setAddrNeighborhood(e.target.value)} /></div>
            </div>
            <div><Label>Cidade</Label><Input value={addrCity} onChange={e => setAddrCity(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddrOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddAddress}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Family Link Dialog */}
      <Dialog open={familyOpen} onOpenChange={setFamilyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vincular à Família</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {(familyGroups || []).length > 0 && (
              <div>
                <Label>Grupo existente</Label>
                <Select value={selectedGroupId} onValueChange={v => { setSelectedGroupId(v); setNewGroupName(''); }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar grupo" /></SelectTrigger>
                  <SelectContent>
                    {(familyGroups || []).map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">ou</div>
            <div>
              <Label>Criar novo grupo</Label>
              <Input value={newGroupName} onChange={e => { setNewGroupName(e.target.value); setSelectedGroupId(''); }} placeholder="Ex: Família Silva" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamilyOpen(false)}>Cancelar</Button>
            <Button onClick={handleLinkFamily} disabled={!newGroupName && !selectedGroupId}>Vincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
