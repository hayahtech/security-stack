import { useState, useMemo } from 'react';
import { useCustomersWithStats, useCreateCustomer, useDeleteCustomer, getCustomerLevel } from '@/hooks/useCustomers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomersWithStats();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    if (!customers) return [];
    let list = [...customers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    if (levelFilter !== 'all') {
      list = list.filter(c => {
        const lvl = getCustomerLevel(c.totalOrders);
        return lvl.label.toLowerCase() === levelFilter;
      });
    }
    if (sortBy === 'orders') list.sort((a, b) => b.totalOrders - a.totalOrders);
    else if (sortBy === 'spent') list.sort((a, b) => b.totalSpent - a.totalSpent);
    else if (sortBy === 'recent') list.sort((a, b) => (b.lastSale || '').localeCompare(a.lastSale || ''));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [customers, search, levelFilter, sortBy]);

  const lookupCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(`${data.localidade}/${data.uf}`);
      }
    } catch { /* ignore */ }
  };

  const handleCreate = () => {
    if (!name || !phone || !birthDate) return;
    createCustomer.mutate({
      name, phone, birth_date: birthDate, notes: notes || null, active: true, family_group_id: null,
      address_street: street || null, address_number: number || null,
      address_complement: complement || null, address_neighborhood: neighborhood || null,
      address_city: city || null, address_zipcode: zipcode || null,
    });
    setFormOpen(false);
    resetForm();
  };

  const resetForm = () => { setName(''); setPhone(''); setBirthDate(''); setZipcode(''); setStreet(''); setNumber(''); setComplement(''); setNeighborhood(''); setCity(''); setNotes(''); };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Clientes</h1>
          <p className="text-sm text-muted-foreground">CRM e gestão de clientes</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Novo Cliente</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{customers?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">👑 Top</p><p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{(customers || []).filter(c => getCustomerLevel(c.totalOrders).label === 'Top').length}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">🥇 VIP</p><p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{(customers || []).filter(c => getCustomerLevel(c.totalOrders).label === 'VIP').length}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">🥈 Frequente</p><p className="text-xl font-bold" style={{ fontFamily: 'Nunito' }}>{(customers || []).filter(c => getCustomerLevel(c.totalOrders).label === 'Frequente').length}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="top">👑 Top</SelectItem>
            <SelectItem value="vip">🥇 VIP</SelectItem>
            <SelectItem value="frequente">🥈 Frequente</SelectItem>
            <SelectItem value="novo">🥉 Novo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="orders">Mais pedidos</SelectItem>
            <SelectItem value="spent">Maior valor</SelectItem>
            <SelectItem value="recent">Mais recente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
            ) : (
              filtered.map(c => {
                const level = getCustomerLevel(c.totalOrders);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{level.emoji} {level.label}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{c.totalOrders}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(c.totalSpent)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.lastSale ? new Date(c.lastSale).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/clientes/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                          if (confirm(`Remover cliente ${c.name}?`)) deleteCustomer.mutate(c.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" /></div>
              <div><Label>Telefone *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
            </div>
            <div><Label>Data de Nascimento *</Label><Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>CEP</Label>
                <Input value={zipcode} onChange={e => { setZipcode(e.target.value); }} onBlur={e => lookupCep(e.target.value)} placeholder="00000-000" />
              </div>
              <div className="col-span-2"><Label>Rua</Label><Input value={street} onChange={e => setStreet(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Número</Label><Input value={number} onChange={e => setNumber(e.target.value)} /></div>
              <div><Label>Complemento</Label><Input value={complement} onChange={e => setComplement(e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} /></div>
            </div>
            <div><Label>Cidade</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
            <div><Label>Observações</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name || !phone || !birthDate || createCustomer.isPending}>
              {createCustomer.isPending ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
