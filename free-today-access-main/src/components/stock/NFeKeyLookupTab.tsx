import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateStockEntry, StockEntryItem } from '@/hooks/useStockEntries';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Loader2, FileText, Building2, Calendar, DollarSign, AlertCircle, Copy, Package, CheckCircle2, ArrowLeft, Ban, Camera, RefreshCw, History, ExternalLink, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/export-utils';
import { useNavigate } from 'react-router-dom';

// NF-e key validation: check digit (mod 11)
function validateNFeKeyCheckDigit(key: string): boolean {
  if (key.length !== 44) return false;
  const digits = key.split('').map(Number);
  const base = digits.slice(0, 43);
  const expected = digits[43];
  let weight = 2;
  let sum = 0;
  for (let i = base.length - 1; i >= 0; i--) {
    sum += base[i] * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  const calculated = remainder < 2 ? 0 : 11 - remainder;
  return calculated === expected;
}

function formatNFeKey(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 44);
  const groups = [2, 4, 8, 6, 2, 3, 9, 1, 8, 1];
  const parts: string[] = [];
  let pos = 0;
  for (const len of groups) {
    if (pos >= digits.length) break;
    parts.push(digits.slice(pos, pos + len));
    pos += len;
  }
  return parts.join(' ');
}

// Extract NF-e key from QR code URL
function extractKeyFromQR(text: string): string | null {
  // QR code formats: URL with chNFe= parameter, or raw 44-digit key
  const digits = text.replace(/\D/g, '');
  if (digits.length === 44) return digits;

  // Try URL parameter
  const match = text.match(/chNFe=(\d{44})/i) || text.match(/p=(\d{44})/i);
  if (match) return match[1];

  // Try extracting from any URL that contains 44 consecutive digits
  const longMatch = text.match(/(\d{44})/);
  if (longMatch) return longMatch[1];

  return null;
}

const UF_CODES: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
  '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
  '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
  '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
  '52': 'GO', '53': 'DF',
};

interface NFeResult {
  chave: string;
  numero: string;
  serie: string;
  data_emissao: string;
  valor_total: number;
  emitente: { cnpj: string; nome: string; fantasia: string; uf: string; };
  destinatario: { cnpj: string; nome: string; };
  itens: { codigo: string; descricao: string; ncm: string; cfop: string; unidade: string; quantidade: number; valor_unitario: number; valor_total: number; }[];
  situacao: string;
}

interface ReviewItem {
  descricao: string; codigo: string; ncm: string; cfop: string; unidade: string;
  quantidade: number; valor_unitario: number; valor_total: number;
  included: boolean; matchedProductId: string | null;
}

type Step = 'search' | 'review';

export function NFeKeyLookupTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createEntry = useCreateStockEntry();
  const [chave, setChave] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('search');
  const [result, setResult] = useState<NFeResult | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ icon: string; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<{ entryId: string; date: string } | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, unit, cost_price').eq('user_id', user!.id).order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: queryHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['nfe-queries', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('nfe_queries')
        .select('*')
        .eq('user_id', user!.id)
        .order('queried_at', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
  });

  const findBestMatch = useCallback((name: string): string | null => {
    if (!products || products.length === 0) return null;
    const norm = name.toLowerCase().trim();
    const exact = products.find(p => p.name.toLowerCase().trim() === norm);
    if (exact) return exact.id;
    const contains = products.find(p =>
      norm.includes(p.name.toLowerCase().trim()) || p.name.toLowerCase().trim().includes(norm)
    );
    if (contains) return contains.id;
    const words = norm.split(/\s+/).filter(w => w.length > 2);
    let best: { id: string; score: number } | null = null;
    for (const p of products) {
      const pWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const overlap = words.filter(w => pWords.some(pw => pw.includes(w) || w.includes(pw))).length;
      const score = overlap / Math.max(words.length, 1);
      if (score > 0.3 && (!best || score > best.score)) best = { id: p.id, score };
    }
    return best?.id || null;
  }, [products]);

  const handleKeyChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 44);
    setChave(formatNFeKey(digits));
  };

  // Log query to nfe_queries
  const logQuery = async (cleanKey: string, status: string, data?: NFeResult, entryId?: string) => {
    if (!user) return;
    await supabase.from('nfe_queries').insert({
      user_id: user.id,
      chave_nfe: cleanKey,
      status,
      uf: UF_CODES[cleanKey.substring(0, 2)] || null,
      cnpj_emitente: data?.emitente?.cnpj || null,
      numero_nf: data?.numero || null,
      nome_emitente: data?.emitente?.fantasia || data?.emitente?.nome || null,
      valor_total: data?.valor_total || null,
      data_emissao: data?.data_emissao || null,
      response_data: data ? (data as any) : null,
      entry_id: entryId || null,
    } as any);
    refetchHistory();
  };

  // Check if key was already imported
  const checkDuplicate = async (cleanKey: string): Promise<boolean> => {
    if (!user) return false;
    // Check stock_entries
    const { data: existing } = await supabase
      .from('stock_entries')
      .select('id, created_at')
      .eq('nfe_key', cleanKey)
      .eq('user_id', user.id)
      .neq('status', 'cancelado')
      .limit(1);

    if (existing && existing.length > 0) {
      setDuplicateDialog({
        entryId: existing[0].id,
        date: new Date(existing[0].created_at).toLocaleDateString('pt-BR'),
      });
      return true;
    }
    return false;
  };

  const handleSearch = async () => {
    const cleanKey = chave.replace(/\D/g, '');
    if (cleanKey.length !== 44) {
      toast.error('A chave de acesso deve ter 44 dígitos.');
      return;
    }
    if (!validateNFeKeyCheckDigit(cleanKey)) {
      toast.error('Dígito verificador inválido. Confira a chave de acesso.');
      return;
    }
    const ufCode = cleanKey.substring(0, 2);
    if (!UF_CODES[ufCode]) {
      toast.error('Código UF inválido na chave de acesso.');
      return;
    }

    // Check duplicate before querying
    const isDuplicate = await checkDuplicate(cleanKey);
    if (isDuplicate) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStatusMessage({ icon: '⏳', text: `Consultando SEFAZ ${UF_CODES[ufCode]}...` });

    try {
      const { data, error: fnError } = await supabase.functions.invoke('consulta-nfe', {
        body: { chave: cleanKey },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const sit = (data.situacao || '').toLowerCase();

      if (sit.includes('cancela') || sit === '101') {
        setStatusMessage({ icon: '⚠️', text: 'NF-e cancelada — não é possível usar esta nota.' });
        setResult(data);
        await logQuery(cleanKey, 'cancelada', data);
        setLoading(false);
        return;
      }

      setStatusMessage({ icon: '✅', text: 'NF-e encontrada! Carregando dados...' });
      setResult(data);
      await logQuery(cleanKey, 'encontrada', data);

      const items: ReviewItem[] = (data.itens || []).map((item: any) => ({
        descricao: item.descricao, codigo: item.codigo, ncm: item.ncm, cfop: item.cfop,
        unidade: item.unidade, quantidade: item.quantidade,
        valor_unitario: item.valor_unitario, valor_total: item.valor_total,
        included: true, matchedProductId: findBestMatch(item.descricao),
      }));
      setReviewItems(items);

      setTimeout(() => { setStep('review'); setStatusMessage(null); }, 800);
      toast.success('NF-e encontrada!');
    } catch (err: any) {
      const msg = err.message || 'Erro ao consultar NF-e.';
      if (msg.includes('não encontrada')) {
        setStatusMessage({ icon: '❌', text: 'NF-e não encontrada. Isso pode ocorrer pois a nota ainda está em processamento na SEFAZ (pode levar até 24h após a emissão).' });
        await logQuery(cleanKey, 'nao_encontrada');
      } else {
        setStatusMessage({ icon: '🔒', text: 'SEFAZ temporariamente indisponível. Você pode fazer upload do XML manualmente ou registrar entrada manual agora.' });
        await logQuery(cleanKey, 'erro_sefaz');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQRResult = (code: string) => {
    const key = extractKeyFromQR(code);
    if (key) {
      handleKeyChange(key);
      toast.success('Chave extraída do QR Code!');
    } else {
      toast.error('QR Code não contém uma chave de NF-e válida.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleDateString('pt-BR'); } catch { return dateStr; }
  };

  const situacaoBadge = (sit: string) => {
    const lower = (sit || '').toLowerCase();
    if (lower.includes('autoriza') || lower === '100')
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Autorizada</Badge>;
    if (lower.includes('cancela') || lower === '101')
      return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Cancelada</Badge>;
    return <Badge variant="secondary">{sit || 'Desconhecida'}</Badge>;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'encontrada': return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Encontrada</Badge>;
      case 'nao_encontrada': return <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">Não encontrada</Badge>;
      case 'cancelada': return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">Cancelada</Badge>;
      case 'erro_sefaz': return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">Erro SEFAZ</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const matchedCount = reviewItems.filter(i => i.included && i.matchedProductId).length;
  const unmatchedCount = reviewItems.filter(i => i.included && !i.matchedProductId).length;
  const isCancelled = result && ((result.situacao || '').toLowerCase().includes('cancela') || result.situacao === '101');
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);

  const handleConfirmImport = async () => {
    if (!result || !user || isCancelled) return;
    const includedItems = reviewItems.filter(i => i.included);
    if (includedItems.length === 0) { toast.error('Selecione pelo menos um item.'); return; }

    try {
      let supplierId: string | null = null;
      if (result.emitente.cnpj) {
        const { data: existing } = await supabase.from('suppliers').select('id')
          .eq('user_id', user.id)
          .or(`name.ilike.%${result.emitente.nome}%,contact.eq.${result.emitente.cnpj}`)
          .limit(1);
        if (existing && existing.length > 0) {
          supplierId = existing[0].id;
        } else {
          const { data: ns } = await supabase.from('suppliers')
            .insert({ user_id: user.id, name: result.emitente.fantasia || result.emitente.nome, contact: result.emitente.cnpj, category: 'ingredientes' })
            .select().single();
          if (ns) supplierId = ns.id;
        }
      }

      const entryItems: StockEntryItem[] = includedItems.map(item => ({
        product_id: item.matchedProductId, nfe_product_code: item.codigo,
        nfe_product_name: item.descricao, ncm: item.ncm, cfop: item.cfop,
        unit: item.unidade, quantity: item.quantidade, unit_price: item.valor_unitario,
        total_price: item.valor_total, discount: 0, taxes: {},
        matched_product_id: item.matchedProductId, included: true,
      }));

      const created = await createEntry.mutateAsync({
        supplier_id: supplierId, entry_type: 'xml_nfe', nfe_number: result.numero,
        nfe_key: result.chave, nfe_date: result.data_emissao?.substring(0, 10) || undefined,
        total_value: result.valor_total, status: 'confirmado', items: entryItems,
      });

      // Update the query log with entry_id
      if (created?.id) {
        await supabase.from('nfe_queries')
          .update({ entry_id: created.id } as any)
          .eq('user_id', user.id)
          .eq('chave_nfe', result.chave)
          .order('queried_at', { ascending: false })
          .limit(1);
      }

      toast.success(`✅ NF-e importada! ${matchedCount} itens atualizados${unmatchedCount > 0 ? `, ${unmatchedCount} sem vínculo` : ''}.`);
      setStep('search'); setResult(null); setReviewItems([]); setChave('');
      refetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar NF-e.');
    }
  };

  const handleRetryFromHistory = (histChave: string) => {
    handleKeyChange(histChave);
    setShowHistory(false);
  };

  // REVIEW STEP
  if (step === 'review' && result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                NF-e {result.numero} {result.serie ? `/ Série ${result.serie}` : ''}
              </CardTitle>
              {situacaoBadge(result.situacao)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Emitente</p>
                  <p className="text-sm font-medium">{result.emitente.fantasia || result.emitente.nome}</p>
                  <p className="text-xs text-muted-foreground">{result.emitente.cnpj}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Emissão</p>
                  <p className="text-sm font-medium">{formatDate(result.data_emissao)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-sm font-bold">{formatCurrency(result.valor_total)}</p>
                </div>
              </div>
              <div className="flex gap-2 text-sm items-start">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">{matchedCount} vinculados</Badge>
                {unmatchedCount > 0 && <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">{unmatchedCount} para vincular</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
              <p className="text-xs font-mono text-muted-foreground break-all flex-1">Chave: {result.chave}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(result.chave)}><Copy className="h-3 w-3" /></Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="font-semibold">Itens da Nota ({reviewItems.length})</h3>
          {reviewItems.map((item, idx) => (
            <Card key={idx} className={!item.included ? 'opacity-50' : ''}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={item.included} onCheckedChange={(v) => setReviewItems(items => items.map((it, i) => i === idx ? { ...it, included: !!v } : it))} className="mt-1" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{item.descricao}</p>
                      {!item.matchedProductId && <Badge variant="secondary" className="text-xs">Novo</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Qtd:</span> {item.quantidade} {item.unidade}</div>
                      <div><span className="text-muted-foreground">Unit:</span> {formatCurrency(item.valor_unitario)}</div>
                      <div><span className="text-muted-foreground">Total:</span> {formatCurrency(item.valor_total)}</div>
                      <div><span className="text-muted-foreground">NCM:</span> {item.ncm || '-'}</div>
                      <div><span className="text-muted-foreground">CFOP:</span> {item.cfop || '-'}</div>
                    </div>
                    <Select value={item.matchedProductId || '_none'} onValueChange={(v) => setReviewItems(items => items.map((it, i) => i === idx ? { ...it, matchedProductId: v === '_none' ? null : v } : it))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Vincular a produto..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">— Não vincular —</SelectItem>
                        {(products || []).map(p => (<SelectItem key={p.id} value={p.id}><div className="flex items-center gap-1"><Package className="h-3 w-3" /> {p.name} ({p.unit})</div></SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 justify-between">
          <Button variant="outline" onClick={() => { setStep('search'); setReviewItems([]); }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button onClick={handleConfirmImport} disabled={createEntry.isPending}>
            {createEntry.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Confirmar importação
          </Button>
        </div>
      </div>
    );
  }

  // SEARCH STEP
  return (
    <div className="space-y-6">
      {/* Duplicate dialog */}
      <Dialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-500" /> NF-e já importada</DialogTitle>
            <DialogDescription>
              Esta NF-e já foi importada em <strong>{duplicateDialog?.date}</strong>. Deseja visualizar a entrada existente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDuplicateDialog(null)}>Fechar</Button>
            <Button onClick={() => { setDuplicateDialog(null); /* Navigate to history tab */ }}>
              <ExternalLink className="h-4 w-4 mr-2" /> Ver entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Consultar NF-e pela Chave de Acesso
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-1" /> Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Digite, cole a chave de 44 dígitos{isMobile ? ' ou escaneie o QR Code do DANFE' : ''}.
          </p>

          <BarcodeScanner
            open={scannerOpen}
            onOpenChange={setScannerOpen}
            mode="qrcode"
            continuous={false}
            onResult={handleQRResult}
            placeholder="Cole a URL do QR Code do DANFE"
          />

          <div className="flex gap-2">
            <Input
              placeholder="00 0000 00000000 000000 00 000 000000000 0 00000000 0"
              value={chave}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="font-mono text-sm"
              maxLength={54}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" onClick={() => setScannerOpen(true)} className="shrink-0" title="Escanear QR Code">
              <Camera className="h-4 w-4" />
            </Button>
            <Button onClick={handleSearch} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline ml-2">Consultar</span>
            </Button>
          </div>

          {/* Key validation feedback */}
          {chave.replace(/\D/g, '').length > 0 && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted-foreground">{chave.replace(/\D/g, '').length}/44 dígitos</span>
              {chave.replace(/\D/g, '').length === 44 && (
                validateNFeKeyCheckDigit(chave.replace(/\D/g, ''))
                  ? <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Válida</Badge>
                  : <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"><AlertCircle className="h-3 w-3 mr-1" />Dígito verificador inválido</Badge>
              )}
              {chave.replace(/\D/g, '').length >= 2 && UF_CODES[chave.replace(/\D/g, '').substring(0, 2)] && (
                <Badge variant="outline">{UF_CODES[chave.replace(/\D/g, '').substring(0, 2)]}</Badge>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Consulta gratuita via BrasilAPI. Dados públicos da SEFAZ.</p>
        </CardContent>
      </Card>

      {/* Status message */}
      {statusMessage && (
        <Card className={error ? 'border-destructive/50' : ''}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{statusMessage.icon}</span>
              <p className="text-sm font-medium flex-1">{statusMessage.text}</p>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {/* Fallback actions for SEFAZ errors */}
            {error && !error.includes('não encontrada') && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleSearch}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const tabList = document.querySelector('[role="tablist"]');
                  const xmlTab = tabList?.querySelector('[value="xml"]') as HTMLButtonElement;
                  xmlTab?.click();
                }}>
                  <Upload className="h-3 w-3 mr-1" /> Upload XML manual
                </Button>
              </div>
            )}

            {/* Not found — retry suggestion */}
            {error?.includes('não encontrada') && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleSearch}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancelled NF-e preview */}
      {result && isCancelled && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-destructive" />
                NF-e {result.numero}
              </CardTitle>
              {situacaoBadge(result.situacao)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Emitente</p><p className="font-medium">{result.emitente.fantasia || result.emitente.nome}</p></div>
              <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{formatDate(result.data_emissao)}</p></div>
              <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">{formatCurrency(result.valor_total)}</p></div>
            </div>
            <div className="mt-3 p-3 rounded bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <Ban className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Esta NF-e foi cancelada e não pode ser importada.</p>
                <p className="text-xs mt-1">Solicite a nota correta ao fornecedor.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query History */}
      {showHistory && queryHistory && queryHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Últimas consultas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {queryHistory.map((q: any) => (
                <div key={q.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {q.nome_emitente || 'Emitente desconhecido'}
                        {q.numero_nf ? ` — NF ${q.numero_nf}` : ''}
                      </p>
                      {statusBadge(q.status)}
                      {q.entry_id && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Importada</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{q.uf}</span>
                      {q.valor_total && <span>{formatCurrency(q.valor_total)}</span>}
                      <span>{new Date(q.queried_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {q.status === 'erro_sefaz' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetryFromHistory(q.chave_nfe)} title="Reprocessar">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    {q.status === 'nao_encontrada' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetryFromHistory(q.chave_nfe)} title="Tentar novamente">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    {!q.entry_id && q.status === 'encontrada' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetryFromHistory(q.chave_nfe)} title="Consultar novamente">
                        <Search className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showHistory && (!queryHistory || queryHistory.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma consulta realizada ainda.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
