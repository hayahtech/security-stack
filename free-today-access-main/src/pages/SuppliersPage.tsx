import { useState } from 'react';
import { useSuppliers, useCreateSupplier, useDeleteSupplier } from '@/hooks/useSuppliers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Phone, Mail, Search } from 'lucide-react';

type SupplierCategory = 'ingredientes' | 'embalagens' | 'equipamentos' | 'outros';

const categoryLabels: Record<string, string> = {
  ingredientes: 'Ingredientes',
  embalagens: 'Embalagens',
  equipamentos: 'Equipamentos',
  outros: 'Outros',
};

export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<SupplierCategory>('ingredientes');
  const [paymentTerms, setPaymentTerms] = useState('');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const filtered = (suppliers || []).filter(s => {
    if (filterCat !== 'all' && s.category !== filterCat) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = () => {
    createSupplier.mutate({ name, contact, phone, email, category, payment_terms: paymentTerms });
    setFormOpen(false);
    setName(''); setContact(''); setPhone(''); setEmail(''); setPaymentTerms('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus fornecedores</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Fornecedor</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            <SelectItem value="ingredientes">Ingredientes</SelectItem>
            <SelectItem value="embalagens">Embalagens</SelectItem>
            <SelectItem value="equipamentos">Equipamentos</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">{categoryLabels[s.category] || s.category}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                  if (confirm('Excluir este fornecedor?')) deleteSupplier.mutate(s.id);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                {s.contact && <p>{s.contact}</p>}
                {s.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</p>}
                {s.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</p>}
                {s.payment_terms && <p>Pagamento: {s.payment_terms}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">Nenhum fornecedor encontrado</p>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><Label>Contato</Label><Input value={contact} onChange={e => setContact(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={category} onValueChange={v => setCategory(v as SupplierCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingredientes">Ingredientes</SelectItem>
                  <SelectItem value="embalagens">Embalagens</SelectItem>
                  <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Condições de Pagamento</Label><Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Ex: 30 dias" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
