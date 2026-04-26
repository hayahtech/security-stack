import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useCreateStockEntry, StockEntryItem } from '@/hooks/useStockEntries';
import { parseNFeXML, NFeData, NFeItem } from '@/lib/nfe-parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, ArrowLeft, CheckCircle2, Loader2, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/export-utils';

type Step = 'upload' | 'review';

interface ReviewItem extends NFeItem {
  included: boolean;
  matchedProductId: string | null;
}

export function XMLImportTab() {
  const { user } = useAuth();
  const createEntry = useCreateStockEntry();
  const [step, setStep] = useState<Step>('upload');
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [xmlRaw, setXmlRaw] = useState('');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: products } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, unit, cost_price').eq('user_id', user!.id).order('name');
      return data || [];
    },
    enabled: !!user,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('suppliers').select('id, name').eq('user_id', user!.id).order('name');
      return data || [];
    },
    enabled: !!user,
  });

  // Fuzzy match product name
  const findBestMatch = useCallback((nfeName: string): string | null => {
    if (!products || products.length === 0) return null;
    const normalizedName = nfeName.toLowerCase().trim();

    // Exact match
    const exact = products.find(p => p.name.toLowerCase().trim() === normalizedName);
    if (exact) return exact.id;

    // Contains match
    const contains = products.find(p =>
      normalizedName.includes(p.name.toLowerCase().trim()) ||
      p.name.toLowerCase().trim().includes(normalizedName)
    );
    if (contains) return contains.id;

    // Word overlap
    const nfeWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
    let bestMatch: { id: string; score: number } | null = null;

    for (const p of products) {
      const pWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const overlap = nfeWords.filter(w => pWords.some(pw => pw.includes(w) || w.includes(pw))).length;
      const score = overlap / Math.max(nfeWords.length, 1);
      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: p.id, score };
      }
    }

    return bestMatch?.id || null;
  }, [products]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setProgress(10);

    try {
      const file = files[0];
      const text = await file.text();
      setProgress(40);
      setXmlRaw(text);

      const data = parseNFeXML(text);
      setProgress(70);
      setNfeData(data);

      // Auto-match products
      const matched: ReviewItem[] = data.items.map(item => ({
        ...item,
        included: true,
        matchedProductId: findBestMatch(item.name),
      }));
      setReviewItems(matched);
      setProgress(100);

      setTimeout(() => {
        setStep('review');
        setLoading(false);
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar XML.');
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [findBestMatch]);

  const updateReviewItem = (index: number, field: keyof ReviewItem, value: any) => {
    setReviewItems(items => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const matchedCount = reviewItems.filter(i => i.included && i.matchedProductId).length;
  const unmatchedCount = reviewItems.filter(i => i.included && !i.matchedProductId).length;

  const handleConfirmImport = async () => {
    if (!nfeData || !user) return;

    const includedItems = reviewItems.filter(i => i.included);
    if (includedItems.length === 0) {
      toast.error('Selecione pelo menos um item.');
      return;
    }

    try {
      // Check/create supplier
      let supplierId: string | null = null;
      if (nfeData.supplier.cnpj) {
        // Check if supplier exists
        const { data: existingSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', `%${nfeData.supplier.name}%`)
          .limit(1);

        if (existingSupplier && existingSupplier.length > 0) {
          supplierId = existingSupplier[0].id;
        } else {
          // Create supplier
          const { data: newSupplier } = await supabase
            .from('suppliers')
            .insert({
              user_id: user.id,
              name: nfeData.supplier.fantasyName || nfeData.supplier.name,
              contact: nfeData.supplier.cnpj,
              category: 'ingredientes',
            })
            .select()
            .single();
          if (newSupplier) supplierId = newSupplier.id;
        }
      }

      const entryItems: StockEntryItem[] = includedItems.map(item => ({
        product_id: item.matchedProductId,
        nfe_product_code: item.code,
        nfe_product_name: item.name,
        ncm: item.ncm,
        cfop: item.cfop,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        discount: item.discount,
        taxes: item.taxes,
        matched_product_id: item.matchedProductId,
        included: true,
      }));

      await createEntry.mutateAsync({
        supplier_id: supplierId,
        entry_type: 'xml_nfe',
        nfe_number: nfeData.number,
        nfe_key: nfeData.key,
        nfe_date: nfeData.date,
        total_value: nfeData.totalValue,
        xml_raw: xmlRaw,
        status: 'confirmado',
        items: entryItems,
      });

      const newProducts = includedItems.filter(i => !i.matchedProductId).length;
      toast.success(`✅ NF-e importada! ${matchedCount} itens atualizados${newProducts > 0 ? `, ${newProducts} sem vínculo` : ''}.`);

      // Reset
      setStep('upload');
      setNfeData(null);
      setReviewItems([]);
      setXmlRaw('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao importar NF-e.');
    }
  };

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div
          className="border-2 border-dashed rounded-xl p-12 text-center transition-colors hover:border-primary/50 cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('xml-file-input')?.click()}
        >
          {loading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
              <p className="text-muted-foreground">Processando XML...</p>
              <Progress value={progress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Arraste o arquivo XML aqui</h3>
              <p className="text-muted-foreground mb-4">ou clique para selecionar</p>
              <Badge variant="outline">Aceita arquivos .xml de NF-e</Badge>
            </>
          )}
          <input
            id="xml-file-input"
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-6">
      {/* Header info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            NF-e {nfeData?.number} {nfeData?.series ? `Série ${nfeData.series}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Fornecedor</p>
              <p className="font-medium">{nfeData?.supplier.fantasyName || nfeData?.supplier.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CNPJ</p>
              <p className="font-medium">{nfeData?.supplier.cnpj}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium">{nfeData?.date ? new Date(nfeData.date).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-lg">{formatCurrency(nfeData?.totalValue || 0)}</p>
            </div>
          </div>
          {nfeData?.key && (
            <p className="text-xs text-muted-foreground mt-3 font-mono break-all">Chave: {nfeData.key}</p>
          )}
        </CardContent>
      </Card>

      {/* Items review */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Itens da Nota ({reviewItems.length})</h3>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
              {matchedCount} vinculados
            </Badge>
            {unmatchedCount > 0 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                {unmatchedCount} para vincular
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {reviewItems.map((item, idx) => (
            <Card key={idx} className={`${!item.included ? 'opacity-50' : ''}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.included}
                    onCheckedChange={(v) => updateReviewItem(idx, 'included', !!v)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{item.name}</p>
                      {!item.matchedProductId && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Novo
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Qtd:</span> {item.quantity} {item.unit}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit:</span> {formatCurrency(item.unitPrice)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span> {formatCurrency(item.totalPrice)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">NCM:</span> {item.ncm || '-'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">CFOP:</span> {item.cfop || '-'}
                      </div>
                    </div>
                    <div>
                      <Select
                        value={item.matchedProductId || '_none'}
                        onValueChange={(v) => updateReviewItem(idx, 'matchedProductId', v === '_none' ? null : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Vincular a produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">— Não vincular —</SelectItem>
                          {(products || []).map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" /> {p.name} ({p.unit})
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => { setStep('upload'); setNfeData(null); }}>
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
