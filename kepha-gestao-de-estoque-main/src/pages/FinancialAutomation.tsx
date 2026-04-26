import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { ProcessedDocument, BankTransaction, ExceptionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Upload, FileText, Sparkles, CheckCircle2, AlertTriangle, X, Eye,
  Link2, Plus, Ban, Copy, ChevronDown, ChevronRight, Clock,
  Building2, CreditCard, TrendingUp, Search, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
} from 'recharts';

// ==================== TYPES ====================

type ProcessingStep = 'CARREGANDO' | 'LENDO_OCR' | 'EXTRAINDO' | 'CLASSIFICANDO' | 'CONCLUIDO';

interface QueueItem {
  id: string;
  fileName: string;
  step: ProcessingStep;
  progress: number;
}

const stepLabels: Record<ProcessingStep, string> = {
  CARREGANDO: 'Carregando...',
  LENDO_OCR: 'Lendo com OCR...',
  EXTRAINDO: 'Extraindo dados...',
  CLASSIFICANDO: 'Classificando...',
  CONCLUIDO: 'Concluído',
};

const stepProgress: Record<ProcessingStep, number> = {
  CARREGANDO: 20,
  LENDO_OCR: 40,
  EXTRAINDO: 65,
  CLASSIFICANDO: 85,
  CONCLUIDO: 100,
};

const steps: ProcessingStep[] = ['CARREGANDO', 'LENDO_OCR', 'EXTRAINDO', 'CLASSIFICANDO', 'CONCLUIDO'];

function confidenceBadge(conf: number) {
  if (conf >= 90) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1">🟢 {conf}%</Badge>;
  if (conf >= 70) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] px-1">🟡 {conf}%</Badge>;
  return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[9px] px-1">🔴 {conf}%</Badge>;
}

const exceptionConfig: Record<ExceptionType, { label: string; color: string; icon: typeof AlertTriangle }> = {
  SEM_MATCH: { label: 'Sem Match', color: 'bg-destructive/20 text-destructive', icon: X },
  VALOR_DIVERGENTE: { label: 'Valor Divergente', color: 'bg-orange-500/20 text-orange-400', icon: AlertTriangle },
  DATA_DIVERGENTE: { label: 'Data Divergente', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  DUPLICATA_SUSPEITA: { label: 'Duplicata Suspeita', color: 'bg-primary/20 text-primary', icon: Copy },
};

const docStatusConfig: Record<string, { label: string; color: string }> = {
  APROVADO: { label: 'Aprovado', color: 'bg-emerald-500/20 text-emerald-400' },
  PENDENTE_REVISAO: { label: 'Pendente Revisão', color: 'bg-amber-500/20 text-amber-400' },
  REJEITADO: { label: 'Rejeitado', color: 'bg-destructive/20 text-destructive' },
  LANCADO: { label: 'Lançado', color: 'bg-primary/20 text-primary' },
};

// ==================== COMPONENT ====================

export default function FinancialAutomation() {
  const {
    processedDocuments, bankAccounts, bankTransactions, ledgerEntries, reconciliationHistory,
    addProcessedDocument, updateDocumentStatus, updateBankTransaction,
  } = useAppStore();
  const { toast } = useToast();

  // Upload & processing state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drawer state
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reconciliation state
  const [selectedAccount, setSelectedAccount] = useState(bankAccounts[0]?.id || '');
  const [showFullExtract, setShowFullExtract] = useState(false);
  const [exceptionActionModal, setExceptionActionModal] = useState<{ tx: BankTransaction; action: string } | null>(null);
  const [justification, setJustification] = useState('');
  const [highlightedTx, setHighlightedTx] = useState<string | null>(null);

  // Simulate processing
  const processFiles = useCallback((fileNames: string[]) => {
    const newItems: QueueItem[] = fileNames.map((fn, i) => ({
      id: `q-${Date.now()}-${i}`,
      fileName: fn,
      step: 'CARREGANDO' as ProcessingStep,
      progress: 0,
    }));
    setQueue(prev => [...prev, ...newItems]);

    newItems.forEach((item) => {
      let stepIdx = 0;
      const advance = () => {
        stepIdx++;
        if (stepIdx >= steps.length) return;
        setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, step: steps[stepIdx], progress: stepProgress[steps[stepIdx]] } : q
        ));
        if (stepIdx < steps.length - 1) {
          setTimeout(advance, 1500 + Math.random() * 1000);
        }
      };
      setTimeout(advance, 1500 + Math.random() * 1000);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).slice(0, 10);
    processFiles(files.map(f => f.name));
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    processFiles(files.map(f => f.name));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  // Computed
  const accountTx = useMemo(() =>
    bankTransactions.filter(t => t.accountId === selectedAccount)
  , [bankTransactions, selectedAccount]);

  const exceptions = useMemo(() =>
    accountTx.filter(t => t.status === 'EXCECAO')
  , [accountTx]);

  const conciliated = useMemo(() =>
    accountTx.filter(t => t.status === 'CONCILIADO')
  , [accountTx]);

  const pending = useMemo(() =>
    accountTx.filter(t => t.status === 'PENDENTE')
  , [accountTx]);

  const totalConciliated = conciliated.reduce((s, t) => s + Math.abs(t.value), 0);
  const totalPending = pending.reduce((s, t) => s + Math.abs(t.value), 0);
  const totalExceptions = exceptions.reduce((s, t) => s + Math.abs(t.value), 0);
  const concPercent = accountTx.length > 0 ? ((conciliated.length / accountTx.length) * 100).toFixed(1) : '0';

  const handleExceptionAction = useCallback((action: string) => {
    if (!exceptionActionModal) return;
    const { tx } = exceptionActionModal;

    if (action === 'ignore' && !justification.trim()) {
      toast({ title: 'Justificativa obrigatória', variant: 'destructive' });
      return;
    }

    updateBankTransaction(tx.id, {
      status: action === 'duplicate' ? 'PENDENTE' : 'CONCILIADO',
      exceptionType: undefined,
    });

    toast({ title: action === 'link' ? 'Vinculado com sucesso' : action === 'create' ? 'Lançamento criado' : action === 'duplicate' ? 'Marcado como duplicata' : 'Ignorado' });
    setExceptionActionModal(null);
    setJustification('');
  }, [exceptionActionModal, justification, updateBankTransaction, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Automação Financeira</h1>
          <p className="text-xs text-muted-foreground">Leitura inteligente de documentos e conciliação bancária</p>
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="documents" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Conciliação Bancária
          </TabsTrigger>
        </TabsList>

        {/* ============ MODULE 1: DOCUMENTS ============ */}
        <TabsContent value="documents" className="space-y-4">
          {/* Upload Zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
              dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50'
            )}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xml,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Upload className="h-10 w-10 text-muted-foreground animate-pulse" />
                <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Arraste NFs, recibos ou boletos aqui</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, XML, JPG, PNG — até 10 arquivos por vez</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Ou selecionar arquivos
                </Button>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" /> IA Ativada
                </Badge>
              </div>
            </div>
          </div>

          {/* Processing Queue */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fila de Processamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {queue.map(item => (
                  <Card key={item.id} className="bg-card border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs text-foreground truncate">{item.fileName}</span>
                        </div>
                        {item.step === 'CONCLUIDO' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                        )}
                      </div>
                      <Progress value={stepProgress[item.step]} className="h-1.5 mb-1" />
                      <p className="text-[10px] text-muted-foreground">{stepLabels[item.step]}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Processed Documents History */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Histórico de Documentos Processados</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-[10px] h-8">Data</TableHead>
                      <TableHead className="text-[10px] h-8">Arquivo</TableHead>
                      <TableHead className="text-[10px] h-8">Fornecedor</TableHead>
                      <TableHead className="text-[10px] h-8">Valor</TableHead>
                      <TableHead className="text-[10px] h-8">Categoria</TableHead>
                      <TableHead className="text-[10px] h-8">Centro Custo</TableHead>
                      <TableHead className="text-[10px] h-8">Processado por</TableHead>
                      <TableHead className="text-[10px] h-8">Status</TableHead>
                      <TableHead className="text-[10px] h-8 w-16">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedDocuments.map(doc => {
                      const sc = docStatusConfig[doc.status];
                      return (
                        <TableRow key={doc.id} className="border-border">
                          <TableCell className="text-xs py-1.5">{format(new Date(doc.uploadedAt), 'dd/MM/yy')}</TableCell>
                          <TableCell className="text-xs py-1.5 font-mono">{doc.fileName}</TableCell>
                          <TableCell className="text-xs py-1.5">{doc.supplier.value}</TableCell>
                          <TableCell className="text-xs py-1.5 font-mono">{doc.grossValue.value}</TableCell>
                          <TableCell className="text-xs py-1.5">{doc.category.value}</TableCell>
                          <TableCell className="text-xs py-1.5">{doc.costCenter.value}</TableCell>
                          <TableCell className="text-xs py-1.5">{doc.processedBy}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge className={cn('text-[9px] px-1.5', sc.color)}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => { setSelectedDoc(doc); setDrawerOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ MODULE 2: RECONCILIATION ============ */}
        <TabsContent value="reconciliation" className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[240px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                      {a.bank} · {a.account}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
              <CheckCircle2 className="h-3 w-3" /> Open Finance Conectado
            </Badge>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-mono font-bold text-foreground">{conciliated.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conciliados</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">R$ {(totalConciliated / 1000).toFixed(1)}K</p>
                <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 text-[9px]">{concPercent}% ✓</Badge>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-mono font-bold text-foreground">{pending.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pendentes</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">R$ {(totalPending / 1000).toFixed(1)}K</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-2xl font-mono font-bold text-foreground">{exceptions.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exceções</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">R$ {(totalExceptions / 1000).toFixed(1)}K</p>
                {exceptions.length > 0 && <Badge className="mt-1 bg-destructive/20 text-destructive text-[9px]">⚠ Revisar</Badge>}
              </CardContent>
            </Card>
          </div>

          {/* Exceptions Table */}
          {exceptions.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Itens que precisam de atenção ({exceptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[10px] h-8">Data</TableHead>
                        <TableHead className="text-[10px] h-8">Descrição Extrato</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Valor Extrato</TableHead>
                        <TableHead className="text-[10px] h-8">Lançamento Sistema</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Valor Sistema</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Diferença</TableHead>
                        <TableHead className="text-[10px] h-8">Tipo Exceção</TableHead>
                        <TableHead className="text-[10px] h-8">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exceptions.map(tx => {
                        const matched = tx.matchedLedgerId ? ledgerEntries.find(l => l.id === tx.matchedLedgerId) : null;
                        const diff = matched ? tx.value - matched.value : tx.value;
                        const exc = tx.exceptionType ? exceptionConfig[tx.exceptionType] : null;
                        return (
                          <TableRow key={tx.id} className="border-border">
                            <TableCell className="text-xs py-1.5">{format(new Date(tx.date), 'dd/MM')}</TableCell>
                            <TableCell className="text-xs py-1.5">{tx.description}</TableCell>
                            <TableCell className="text-xs py-1.5 text-right font-mono">
                              <span className={tx.value < 0 ? 'text-destructive' : 'text-emerald-500'}>
                                {tx.value < 0 ? '-' : ''}R$ {Math.abs(tx.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs py-1.5 text-muted-foreground">{matched?.description || '—'}</TableCell>
                            <TableCell className="text-xs py-1.5 text-right font-mono text-muted-foreground">
                              {matched ? `R$ ${Math.abs(matched.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                            </TableCell>
                            <TableCell className="text-xs py-1.5 text-right font-mono font-semibold text-destructive">
                              {diff !== 0 ? `R$ ${Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                            </TableCell>
                            <TableCell className="py-1.5">
                              {exc && <Badge className={cn('text-[9px] px-1.5', exc.color)}>{exc.label}</Badge>}
                            </TableCell>
                            <TableCell className="py-1.5">
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => setExceptionActionModal({ tx, action: 'link' })}>
                                      <Link2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Vincular</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => setExceptionActionModal({ tx, action: 'create' })}>
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Criar Lançamento</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => setExceptionActionModal({ tx, action: 'ignore' })}>
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ignorar</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => setExceptionActionModal({ tx, action: 'duplicate' })}>
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Marcar Duplicata</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Extract Toggle */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Extrato Lado a Lado</CardTitle>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setShowFullExtract(!showFullExtract)}>
                  {showFullExtract ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {showFullExtract ? 'Recolher' : 'Ver extrato completo'}
                </Button>
              </div>
            </CardHeader>
            {showFullExtract && (
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Bank Statement */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">Extrato Bancário</p>
                    <div className="space-y-0.5 max-h-[400px] overflow-auto">
                      {accountTx.map(tx => {
                        const isHighlighted = highlightedTx === tx.id || highlightedTx === tx.matchedLedgerId;
                        return (
                          <div
                            key={tx.id}
                            className={cn(
                              'flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all',
                              tx.status === 'CONCILIADO' ? 'bg-emerald-500/5 hover:bg-emerald-500/10' :
                              tx.status === 'EXCECAO' ? 'bg-destructive/5 hover:bg-destructive/10' :
                              'bg-amber-500/5 hover:bg-amber-500/10',
                              isHighlighted && 'ring-1 ring-primary'
                            )}
                            onClick={() => setHighlightedTx(tx.matchedLedgerId || tx.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {tx.status === 'CONCILIADO' && <Link2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                              <span className="text-muted-foreground w-12 shrink-0">{format(new Date(tx.date), 'dd/MM')}</span>
                              <span className="truncate">{tx.description}</span>
                            </div>
                            <span className={cn('font-mono shrink-0', tx.value < 0 ? 'text-destructive' : 'text-emerald-500')}>
                              {tx.value < 0 ? '-' : '+'}R$ {Math.abs(tx.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Ledger */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">Lançamentos do Sistema</p>
                    <div className="space-y-0.5 max-h-[400px] overflow-auto">
                      {ledgerEntries.map(le => {
                        const isHighlighted = highlightedTx === le.id || highlightedTx === le.matchedTransactionId;
                        return (
                          <div
                            key={le.id}
                            className={cn(
                              'flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all',
                              le.status === 'CONCILIADO' ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-amber-500/5 hover:bg-amber-500/10',
                              isHighlighted && 'ring-1 ring-primary'
                            )}
                            onClick={() => setHighlightedTx(le.matchedTransactionId || le.id)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {le.status === 'CONCILIADO' && <Link2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                              <span className="text-muted-foreground w-12 shrink-0">{format(new Date(le.date), 'dd/MM')}</span>
                              <span className="truncate">{le.description}</span>
                            </div>
                            <span className={cn('font-mono shrink-0', le.value < 0 ? 'text-destructive' : 'text-emerald-500')}>
                              R$ {Math.abs(le.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Reconciliation History */}
          <Card className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Histórico de Conciliações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reconciliationHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }}
                    formatter={(value: number, name: string) => [value, name === 'autoReconciled' ? 'Auto-conciliados' : 'Total']}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="totalTransactions" fill="hsl(var(--muted-foreground))" name="Total" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="autoReconciled" fill="hsl(var(--primary))" name="Auto-conciliados" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ DOCUMENT DETAIL DRAWER ============ */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-2xl overflow-auto">
          {selectedDoc && (
            <>
              <SheetHeader>
                <SheetTitle className="text-sm">Resultado da Extração — {selectedDoc.fileName}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Document preview placeholder */}
                <div className="rounded-lg border border-border bg-secondary/50 p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Preview do documento</p>
                  <p className="text-[10px] text-muted-foreground">{selectedDoc.fileType} · {selectedDoc.fileName}</p>
                  {/* Field highlight indicators */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge className="bg-primary/20 text-primary text-[9px]">Fornecedor</Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Valor</Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 text-[9px]">Data</Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 text-[9px]">CNPJ</Badge>
                  </div>
                </div>

                {/* Extracted Fields */}
                <div className="space-y-3">
                  {([
                    ['Fornecedor', selectedDoc.supplier],
                    ['CNPJ Emitente', selectedDoc.cnpj],
                    ['Número NF', selectedDoc.nfNumber],
                    ['Data Emissão', selectedDoc.issueDate],
                    ['Data Vencimento', selectedDoc.dueDate],
                    ['Valor Bruto', selectedDoc.grossValue],
                    ['Impostos', selectedDoc.taxes],
                    ['Valor Líquido', selectedDoc.netValue],
                    ['Categoria', selectedDoc.category],
                    ['Centro de Custo', selectedDoc.costCenter],
                    ['Observações', selectedDoc.notes],
                  ] as const).map(([label, field]) => (
                    <div key={label} className={cn(
                      'flex items-center justify-between p-2 rounded border',
                      field.confidence < 70 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'
                    )}>
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="text-xs font-medium text-foreground">{field.value || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {confidenceBadge(field.confidence)}
                        {field.confidence < 70 && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Verifique este campo</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <SheetFooter className="mt-6 flex gap-2">
                <Button variant="destructive" size="sm" className="text-xs" onClick={() => {
                  updateDocumentStatus(selectedDoc.id, 'REJEITADO');
                  setDrawerOpen(false);
                  toast({ title: 'Documento rejeitado' });
                }}>
                  Rejeitar
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                  updateDocumentStatus(selectedDoc.id, 'APROVADO');
                  setDrawerOpen(false);
                  toast({ title: 'Documento aprovado' });
                }}>
                  Editar e Aprovar
                </Button>
                <Button size="sm" className="text-xs" onClick={() => {
                  updateDocumentStatus(selectedDoc.id, 'LANCADO');
                  setDrawerOpen(false);
                  toast({ title: 'Documento aprovado e lançado' });
                }}>
                  Aprovar e Lançar
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ============ EXCEPTION ACTION MODAL ============ */}
      <Dialog open={!!exceptionActionModal} onOpenChange={() => { setExceptionActionModal(null); setJustification(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {exceptionActionModal?.action === 'link' && 'Vincular Transação'}
              {exceptionActionModal?.action === 'create' && 'Criar Lançamento'}
              {exceptionActionModal?.action === 'ignore' && 'Ignorar Exceção'}
              {exceptionActionModal?.action === 'duplicate' && 'Marcar como Duplicata'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {exceptionActionModal?.tx && (
              <div className="p-3 rounded bg-secondary border border-border">
                <p className="text-xs text-foreground">{exceptionActionModal.tx.description}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  R$ {Math.abs(exceptionActionModal.tx.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {' · '}{format(new Date(exceptionActionModal.tx.date), 'dd/MM/yyyy')}
                </p>
              </div>
            )}

            {exceptionActionModal?.action === 'link' && (
              <div className="space-y-2">
                <Label className="text-xs">Buscar lançamento correspondente</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="h-8 text-xs pl-7" placeholder="Buscar por descrição ou valor..." />
                </div>
                <p className="text-[10px] text-muted-foreground">Selecione um lançamento para vincular</p>
              </div>
            )}

            {exceptionActionModal?.action === 'ignore' && (
              <div className="space-y-2">
                <Label className="text-xs">Justificativa (obrigatória)</Label>
                <Textarea
                  className="text-xs min-h-[80px]"
                  placeholder="Informe o motivo..."
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                />
              </div>
            )}

            {exceptionActionModal?.action === 'create' && (
              <p className="text-xs text-muted-foreground">Um novo lançamento será criado com os dados do extrato bancário.</p>
            )}

            {exceptionActionModal?.action === 'duplicate' && (
              <p className="text-xs text-muted-foreground">Esta transação será marcada como duplicata e removida da conciliação.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setExceptionActionModal(null); setJustification(''); }}>
              Cancelar
            </Button>
            <Button size="sm" className="text-xs" onClick={() => handleExceptionAction(exceptionActionModal?.action || '')}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
