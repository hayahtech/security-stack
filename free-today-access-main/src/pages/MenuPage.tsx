import { useState } from 'react';
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useMenuItems';
import { useStoreSlug, useUpdateStoreSlug, useDailyPromotions, useCreatePromotion, useTogglePromotion, useDeletePromotion } from '@/hooks/usePublicMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil, QrCode, Link2, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/hooks/use-toast';

type MenuCategory = 'pizza' | 'bebida' | 'sobremesa' | 'outro';

const categoryLabels: Record<string, string> = {
  pizza: '🍕 Pizza',
  bebida: '🥤 Bebida',
  sobremesa: '🍰 Sobremesa',
  outro: '📦 Outro',
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MenuPage() {
  const { data: items, isLoading } = useMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const { data: storeSlug } = useStoreSlug();
  const updateSlug = useUpdateStoreSlug();
  const { data: promotions } = useDailyPromotions();
  const createPromotion = useCreatePromotion();
  const togglePromotion = useTogglePromotion();
  const deletePromotion = useDeletePromotion();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('pizza');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);

  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const publicUrl = storeSlug ? `${window.location.origin}/menu/${storeSlug}` : '';

  const openEdit = (item: any) => {
    setEditId(item.id);
    setName(item.name);
    setCategory(item.category);
    setSalePrice(String(item.sale_price));
    setCostPrice(String(item.cost_price));
    setDescription(item.description || '');
    setImageUrl(item.image_url || '');
    setFormOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setName(''); setCategory('pizza'); setSalePrice(''); setCostPrice('');
    setDescription(''); setImageUrl('');
    setFormOpen(true);
  };

  const handleSave = () => {
    const data = {
      name, category,
      sale_price: parseFloat(salePrice) || 0,
      cost_price: parseFloat(costPrice) || 0,
      description: description || null,
      image_url: imageUrl || null,
    };
    if (editId) {
      updateItem.mutate({ id: editId, ...data });
    } else {
      createItem.mutate(data);
    }
    setFormOpen(false);
  };

  const handleSaveSlug = () => {
    if (slugInput.trim()) {
      updateSlug.mutate(slugInput.trim());
      setSlugEditing(false);
    }
  };

  const handleAddPromotion = () => {
    if (!promoTitle.trim()) return;
    createPromotion.mutate({ title: promoTitle, description: promoDesc || undefined });
    setPromoTitle('');
    setPromoDesc('');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Link copiado!' });
  };

  const grouped = (items || []).reduce((acc: Record<string, any[]>, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Cardápio</h1>
          <p className="text-sm text-muted-foreground">Gerencie os itens do seu cardápio</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="public">Cardápio Digital</TabsTrigger>
          <TabsTrigger value="promotions">Promoções</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items || []).length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum item cadastrado</TableCell></TableRow>
                ) : (
                  Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
                    catItems.map((item) => {
                      const margin = Number(item.sale_price) > 0
                        ? ((Number(item.sale_price) - Number(item.cost_price)) / Number(item.sale_price) * 100)
                        : 0;
                      return (
                        <TableRow key={item.id} className={!item.active ? 'opacity-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.image_url && <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                              <div>
                                <span className="font-medium">{item.name}</span>
                                {item.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{categoryLabels[item.category] || item.category}</Badge></TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(item.sale_price))}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(Number(item.cost_price))}</TableCell>
                          <TableCell className={`text-right font-medium ${margin >= 60 ? 'text-[hsl(var(--success))]' : margin >= 40 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>
                            {margin.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Switch checked={item.active} onCheckedChange={(active) => updateItem.mutate({ id: item.id, active })} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                                if (confirm('Excluir este item?')) deleteItem.mutate(item.id);
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="public" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Slug Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5" /> Link do Cardápio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {storeSlug && !slugEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm font-mono truncate flex-1">{publicUrl}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyLink}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setSlugInput(storeSlug); setSlugEditing(true); }}>
                      Alterar slug
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Slug do cardápio</Label>
                    <div className="flex gap-2">
                      <Input
                        value={slugInput}
                        onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="minha-pizzaria"
                      />
                      <Button onClick={handleSaveSlug} disabled={!slugInput.trim()}>Salvar</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">URL: {window.location.origin}/menu/{slugInput || '...'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><QrCode className="h-5 w-5" /> QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {storeSlug ? (
                  <>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                      <QRCodeSVG value={publicUrl} size={180} level="H" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Imprima e coloque nas mesas para os clientes acessarem o cardápio
                    </p>
                    <Button variant="outline" size="sm" onClick={() => {
                      const svg = document.querySelector('.qr-container svg');
                      // Simple print approach
                      const w = window.open('', '_blank');
                      if (w) {
                        w.document.write(`<html><head><title>QR Code - ${storeSlug}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}</style></head><body>`);
                        w.document.write(`<h2>${storeSlug}</h2>`);
                        const svgEl = document.querySelector('[data-qr] svg');
                        if (svgEl) w.document.write(svgEl.outerHTML);
                        w.document.write(`<p style="margin-top:16px;color:#666;font-size:14px;">Escaneie para ver o cardápio</p>`);
                        w.document.write('</body></html>');
                        w.document.close();
                        w.print();
                      }
                    }}>
                      Imprimir QR Code
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Configure o slug do cardápio primeiro para gerar o QR Code
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5" /> Promoções do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Input value={promoTitle} onChange={e => setPromoTitle(e.target.value)} placeholder="Título da promoção" />
                  <Input value={promoDesc} onChange={e => setPromoDesc(e.target.value)} placeholder="Descrição (opcional)" />
                </div>
                <Button onClick={handleAddPromotion} disabled={!promoTitle.trim()} className="self-start">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {(promotions || []).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Switch checked={p.active} onCheckedChange={(active) => togglePromotion.mutate({ id: p.id, active })} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!p.active ? 'line-through text-muted-foreground' : ''}`}>{p.title}</p>
                      {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deletePromotion.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(promotions || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma promoção cadastrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar Item' : 'Novo Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pizza Margherita" /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição para o cardápio digital" rows={2} /></div>
            <div><Label>URL da Imagem</Label><Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." /></div>
            <div><Label>Categoria</Label>
              <Select value={category} onValueChange={v => setCategory(v as MenuCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pizza">Pizza</SelectItem>
                  <SelectItem value="bebida">Bebida</SelectItem>
                  <SelectItem value="sobremesa">Sobremesa</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço de Venda (R$)</Label><Input type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} /></div>
              <div><Label>Preço de Custo (R$)</Label><Input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} /></div>
            </div>
            {salePrice && costPrice && (
              <p className="text-sm text-muted-foreground">
                Margem: {((parseFloat(salePrice) - parseFloat(costPrice)) / parseFloat(salePrice) * 100).toFixed(1)}%
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editId ? 'Atualizar' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
