import { useState, useMemo } from 'react';
import { useReviews, useCreateReview, useRespondReview, useOccurrences, useCreateOccurrence, useUpdateOccurrence } from '@/hooks/useReviews';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Star, MessageSquare, AlertCircle, Plus, CheckCircle, Clock, Search } from 'lucide-react';

const channelLabels: Record<string, string> = { balcao: 'Balcão', whatsapp: 'WhatsApp', ifood: 'iFood', google: 'Google' };
const categoryLabels: Record<string, string> = { sabor: 'Sabor', entrega: 'Entrega', atendimento: 'Atendimento', preco: 'Preço' };
const typeLabels: Record<string, string> = { reclamacao: '😡 Reclamação', elogio: '😊 Elogio', sugestao: '💡 Sugestão' };
const statusLabels: Record<string, string> = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido' };

function Stars({ rating, size = 'sm', onClick }: { rating: number; size?: string; onClick?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} ${n <= rating ? 'fill-[hsl(var(--warning))] text-[hsl(var(--warning))]' : 'text-muted-foreground'} ${onClick ? 'cursor-pointer' : ''}`}
          onClick={() => onClick?.(n)}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [occStatus, setOccStatus] = useState('all');

  const { data: reviews, isLoading: revLoading } = useReviews(dateFrom, dateTo);
  const { data: occurrences, isLoading: occLoading } = useOccurrences(occStatus);
  const { data: customers } = useCustomers();
  const createReview = useCreateReview();
  const respondReview = useRespondReview();
  const createOccurrence = useCreateOccurrence();
  const updateOccurrence = useUpdateOccurrence();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [occOpen, setOccOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  // Review form
  const [rChannel, setRChannel] = useState('balcao');
  const [rRating, setRRating] = useState(5);
  const [rCategory, setRCategory] = useState('sabor');
  const [rComment, setRComment] = useState('');
  const [rCustomerSearch, setRCustomerSearch] = useState('');
  const [rCustomerId, setRCustomerId] = useState<string | null>(null);

  // Occurrence form
  const [oType, setOType] = useState('reclamacao');
  const [oDesc, setODesc] = useState('');
  const [oCustomerSearch, setOCustomerSearch] = useState('');
  const [oCustomerId, setOCustomerId] = useState<string | null>(null);

  // Response/resolution
  const [responseText, setResponseText] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  // NPS & stats
  const stats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { avg: 0, total: 0, positive: 0, negative: 0, nps: 0, byCategory: {} as Record<string, { sum: number; count: number }> };
    const total = reviews.length;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const promoters = reviews.filter(r => r.rating >= 4).length;
    const detractors = reviews.filter(r => r.rating <= 2).length;
    const nps = ((promoters - detractors) / total) * 100;
    const byCategory: Record<string, { sum: number; count: number }> = {};
    reviews.forEach(r => {
      if (!byCategory[r.category]) byCategory[r.category] = { sum: 0, count: 0 };
      byCategory[r.category].sum += r.rating;
      byCategory[r.category].count++;
    });
    return { avg: sum / total, total, positive, negative, nps, byCategory };
  }, [reviews]);

  const openOccurrences = (occurrences || []).filter(o => o.status !== 'resolvido').length;

  const filteredCustomers = (q: string) => {
    if (!customers || !q) return [];
    const lower = q.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower) || c.phone.includes(q)).slice(0, 5);
  };

  const handleCreateReview = () => {
    createReview.mutate({ channel: rChannel, rating: rRating, category: rCategory, comment: rComment || undefined, customer_id: rCustomerId || undefined });
    setReviewOpen(false);
    setRComment(''); setRRating(5); setRCustomerId(null); setRCustomerSearch('');
  };

  const handleCreateOccurrence = () => {
    createOccurrence.mutate({ type: oType, description: oDesc, customer_id: oCustomerId || undefined });
    setOccOpen(false);
    setODesc(''); setOCustomerId(null); setOCustomerSearch('');
  };

  const handleRespond = () => {
    respondReview.mutate({ id: selectedId, response_text: responseText });
    setRespondOpen(false); setResponseText('');
  };

  const handleResolve = () => {
    updateOccurrence.mutate({ id: selectedId, status: 'resolvido', resolution: resolutionText });
    setResolveOpen(false); setResolutionText('');
  };

  if (revLoading || occLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Avaliações e Ocorrências</h1>
          <p className="text-sm text-muted-foreground">Feedback dos clientes e gestão de ocorrências</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOccOpen(true)} className="gap-1"><AlertCircle className="h-4 w-4" /> Nova Ocorrência</Button>
          <Button onClick={() => setReviewOpen(true)} className="gap-1"><Star className="h-4 w-4" /> Nova Avaliação</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="h-5 w-5 text-[hsl(var(--warning))] mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Nota Média</p>
            <p className="text-2xl font-bold">{stats.avg.toFixed(1)}</p>
            <Stars rating={Math.round(stats.avg)} />
          </CardContent>
        </Card>
        <Card className={stats.nps >= 50 ? 'border-l-4 border-l-[hsl(var(--success))]' : stats.nps >= 0 ? 'border-l-4 border-l-[hsl(var(--warning))]' : 'border-l-4 border-l-destructive'}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">NPS</p>
            <p className={`text-2xl font-bold ${stats.nps >= 50 ? 'text-[hsl(var(--success))]' : stats.nps >= 0 ? 'text-[hsl(var(--warning))]' : 'text-destructive'}`}>
              {stats.nps.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Positivas (4-5⭐)</p>
            <p className="text-xl font-bold text-[hsl(var(--success))]">{stats.positive}</p>
            <p className="text-xs text-muted-foreground">{stats.total > 0 ? ((stats.positive / stats.total) * 100).toFixed(0) : 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Negativas (1-2⭐)</p>
            <p className="text-xl font-bold text-destructive">{stats.negative}</p>
          </CardContent>
        </Card>
        <Card className={openOccurrences > 0 ? 'border-destructive' : ''}>
          <CardContent className="p-3 text-center">
            <AlertCircle className={`h-5 w-5 mx-auto mb-1 ${openOccurrences > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-xs text-muted-foreground">Ocorrências Abertas</p>
            <p className="text-xl font-bold">{openOccurrences}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stats.byCategory).map(([cat, { sum, count }]) => {
            const avg = sum / count;
            return (
              <Card key={cat}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{categoryLabels[cat] || cat}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold">{avg.toFixed(1)}</p>
                    <Stars rating={Math.round(avg)} />
                  </div>
                  <p className="text-xs text-muted-foreground">{count} avaliações</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Date filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div><Label className="text-xs">De</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" /></div>
      </div>

      <Tabs defaultValue="avaliacoes">
        <TabsList>
          <TabsTrigger value="avaliacoes" className="gap-1"><Star className="h-4 w-4" /> Avaliações</TabsTrigger>
          <TabsTrigger value="ocorrencias" className="gap-1"><AlertCircle className="h-4 w-4" /> Ocorrências {openOccurrences > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5">{openOccurrences}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="avaliacoes" className="space-y-4">
          <div className="space-y-3">
            {(reviews || []).length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma avaliação no período</CardContent></Card>
            ) : (reviews || []).map(r => (
              <Card key={r.id} className={r.rating <= 2 ? 'border-l-4 border-l-destructive' : r.rating >= 4 ? 'border-l-4 border-l-[hsl(var(--success))]' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Stars rating={r.rating} />
                      <Badge variant="outline" className="text-xs">{channelLabels[r.channel] || r.channel}</Badge>
                      <Badge variant="secondary" className="text-xs">{categoryLabels[r.category] || r.category}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  {(r as any).customers?.name && <p className="text-sm font-medium mt-1">{(r as any).customers.name}</p>}
                  {r.comment && <p className="text-sm text-muted-foreground mt-1">"{r.comment}"</p>}
                  {r.response_text ? (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm"><span className="font-medium">Resposta:</span> {r.response_text}</div>
                  ) : (
                    <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => { setSelectedId(r.id); setResponseText(''); setRespondOpen(true); }}>
                      <MessageSquare className="h-3 w-3 mr-1" /> Responder
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ocorrencias" className="space-y-4">
          <div className="flex gap-2 mb-2">
            <Select value={occStatus} onValueChange={setOccStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aberto">Abertos</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(occurrences || []).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhuma ocorrência</TableCell></TableRow>
              ) : (occurrences || []).map(o => (
                <TableRow key={o.id}>
                  <TableCell className="text-sm">{new Date(o.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant={o.type === 'elogio' ? 'default' : o.type === 'reclamacao' ? 'destructive' : 'secondary'} className="text-xs">{typeLabels[o.type] || o.type}</Badge></TableCell>
                  <TableCell className="text-sm">{(o as any).customers?.name || '—'}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{o.description}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === 'resolvido' ? 'default' : o.status === 'em_andamento' ? 'secondary' : 'destructive'} className="text-xs gap-1">
                      {o.status === 'resolvido' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {statusLabels[o.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {o.status !== 'resolvido' && (
                      <div className="flex gap-1">
                        {o.status === 'aberto' && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateOccurrence.mutate({ id: o.id, status: 'em_andamento' })}>Atender</Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setSelectedId(o.id); setResolutionText(''); setResolveOpen(true); }}>Resolver</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* New Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Avaliação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente (opcional)</Label>
              <Input value={rCustomerSearch} onChange={e => { setRCustomerSearch(e.target.value); setRCustomerId(null); }} placeholder="Buscar por nome ou telefone..." />
              {rCustomerSearch && !rCustomerId && filteredCustomers(rCustomerSearch).length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-y-auto">
                  {filteredCustomers(rCustomerSearch).map(c => (
                    <div key={c.id} className="px-3 py-1.5 hover:bg-accent cursor-pointer text-sm" onClick={() => { setRCustomerId(c.id); setRCustomerSearch(c.name); }}>
                      {c.name} — {c.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div><Label>Canal</Label>
              <Select value={rChannel} onValueChange={setRChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(channelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label>
              <Select value={rCategory} onValueChange={setRCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota</Label>
              <div className="mt-1"><Stars rating={rRating} size="lg" onClick={setRRating} /></div>
            </div>
            <div><Label>Comentário</Label><Textarea value={rComment} onChange={e => setRComment(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateReview}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Occurrence Dialog */}
      <Dialog open={occOpen} onOpenChange={setOccOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente (opcional)</Label>
              <Input value={oCustomerSearch} onChange={e => { setOCustomerSearch(e.target.value); setOCustomerId(null); }} placeholder="Buscar por nome ou telefone..." />
              {oCustomerSearch && !oCustomerId && filteredCustomers(oCustomerSearch).length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-y-auto">
                  {filteredCustomers(oCustomerSearch).map(c => (
                    <div key={c.id} className="px-3 py-1.5 hover:bg-accent cursor-pointer text-sm" onClick={() => { setOCustomerId(c.id); setOCustomerSearch(c.name); }}>
                      {c.name} — {c.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div><Label>Tipo</Label>
              <Select value={oType} onValueChange={setOType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reclamacao">😡 Reclamação</SelectItem>
                  <SelectItem value="elogio">😊 Elogio</SelectItem>
                  <SelectItem value="sugestao">💡 Sugestão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={oDesc} onChange={e => setODesc(e.target.value)} rows={4} placeholder="Descreva a ocorrência..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOccOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOccurrence} disabled={!oDesc}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Responder Avaliação</DialogTitle></DialogHeader>
          <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={4} placeholder="Digite sua resposta..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondOpen(false)}>Cancelar</Button>
            <Button onClick={handleRespond} disabled={!responseText}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolver Ocorrência</DialogTitle></DialogHeader>
          <Textarea value={resolutionText} onChange={e => setResolutionText(e.target.value)} rows={4} placeholder="Descreva a resolução..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancelar</Button>
            <Button onClick={handleResolve} disabled={!resolutionText}>Resolver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
