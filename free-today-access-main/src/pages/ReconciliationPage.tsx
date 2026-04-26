import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Check, X, Link2, FileText, Plus, Building2, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  useBankAccounts, useCreateBankAccount, useBankStatements,
  useImportStatements, useConciliateStatement, parseOFX, parseCSV,
  type BankStatement
} from '@/hooks/useBankReconciliation';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from '@/hooks/use-toast';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ReconciliationPage() {
  const { data: accounts = [], isLoading: loadingAccounts } = useBankAccounts();
  const createAccount = useCreateBankAccount();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const accountId = selectedAccount || accounts[0]?.id || '';
  const { data: statements = [] } = useBankStatements(accountId, startDate, endDate);
  const { data: transactions = [] } = useTransactions();
  const conciliate = useConciliateStatement();

  // Auto-match suggestions
  const suggestions = useMemo(() => {
    const map: Record<string, string> = {};
    const pending = statements.filter(s => s.status === 'nao_conciliado');
    
    pending.forEach(s => {
      const sDate = new Date(s.date).getTime();
      const match = (transactions || []).find((t: any) => {
        const tDate = new Date(t.date).getTime();
        const daysDiff = Math.abs(sDate - tDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 3 && Math.abs(Number(t.amount) - s.amount) < 0.01;
      });
      if (match) map[s.id] = (match as any).id;
    });
    return map;
  }, [statements, transactions]);

  // Stats
  const conciliated = statements.filter(s => s.status === 'conciliado');
  const notConciliated = statements.filter(s => s.status === 'nao_conciliado');
  const totalConciliated = conciliated.reduce((s, st) => s + Number(st.amount), 0);
  const totalNotConciliated = notConciliated.reduce((s, st) => s + Number(st.amount), 0);
  const systemTotal = (transactions || [])
    .filter((t: any) => t.date >= startDate && t.date <= endDate)
    .reduce((s, t: any) => s + (t.type === 'revenue' ? Number(t.amount) : -Number(t.amount)), 0);
  const bankTotal = statements.reduce((s, st) => s + (st.type === 'credito' ? Number(st.amount) : -Number(st.amount)), 0);

  const handleConciliate = (statementId: string, transactionId: string) => {
    conciliate.mutate({ statementId, transactionId, status: 'conciliado' }, {
      onSuccess: () => toast({ title: 'Lançamento conciliado!' }),
    });
  };

  const handleIgnore = (statementId: string) => {
    conciliate.mutate({ statementId, status: 'ignorado' }, {
      onSuccess: () => toast({ title: 'Lançamento ignorado' }),
    });
  };

  const exportPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Relatório de Conciliação Bancária', 14, 20);
        doc.setFontSize(10);
        doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, 14, 28);
        doc.text(`Conciliados: ${fmt(totalConciliated)} | Pendentes: ${fmt(totalNotConciliated)}`, 14, 34);

        const rows = statements.map(s => [
          new Date(s.date).toLocaleDateString('pt-BR'),
          s.description,
          s.type === 'credito' ? fmt(s.amount) : '',
          s.type === 'debito' ? fmt(s.amount) : '',
          s.status === 'conciliado' ? '✓ Conciliado' : s.status === 'ignorado' ? '— Ignorado' : '✗ Pendente',
        ]);

        (doc as any).autoTable({
          startY: 40,
          head: [['Data', 'Descrição', 'Crédito', 'Débito', 'Status']],
          body: rows,
        });

        doc.save('conciliacao-bancaria.pdf');
      });
    });
  };

  if (loadingAccounts) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conciliação Bancária</h1>
          <p className="text-muted-foreground">Importe extratos e concilie com transações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewAccount(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Conta
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <FileText className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Conta Bancária</Label>
          <Select value={accountId} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="flex items-center gap-2"><Building2 className="h-3 w-3" /> {a.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[160px]" />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[160px]" />
        </div>
        <Button onClick={() => setShowImport(true)} disabled={!accountId}>
          <Upload className="h-4 w-4 mr-1" /> Importar Extrato
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-green-600" /> Conciliado</div>
            <div className="text-2xl font-bold">{fmt(totalConciliated)}</div>
            <div className="text-xs text-muted-foreground">{conciliated.length} lançamentos</div>
          </CardContent>
        </Card>
        <Card className={notConciliated.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertCircle className="h-4 w-4 text-destructive" /> Pendente</div>
            <div className="text-2xl font-bold">{fmt(totalNotConciliated)}</div>
            <div className="text-xs text-muted-foreground">{notConciliated.length} lançamentos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Saldo Extrato</div>
            <div className="text-2xl font-bold">{fmt(bankTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Saldo Sistema</div>
            <div className="text-2xl font-bold">{fmt(systemTotal)}</div>
            <div className={`text-xs font-medium ${Math.abs(bankTotal - systemTotal) < 0.01 ? 'text-green-600' : 'text-destructive'}`}>
              Diferença: {fmt(bankTotal - systemTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation */}
      {accountId ? (
        <Tabs defaultValue="conciliar">
          <TabsList>
            <TabsTrigger value="conciliar"><ArrowLeftRight className="h-4 w-4 mr-1" /> Conciliar</TabsTrigger>
            <TabsTrigger value="todos">Todos os Lançamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="conciliar" className="space-y-4">
            {notConciliated.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">Todos os lançamentos estão conciliados!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notConciliated.map(s => {
                  const suggestedTxId = suggestions[s.id];
                  const suggestedTx = suggestedTxId
                    ? (transactions || []).find((t: any) => t.id === suggestedTxId)
                    : null;

                  return (
                    <Card key={s.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Statement side */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={s.type === 'credito' ? 'default' : 'destructive'} className="text-xs">
                                {s.type === 'credito' ? 'Crédito' : 'Débito'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <p className="font-medium text-sm">{s.description}</p>
                            <p className="text-lg font-bold">{fmt(s.amount)}</p>
                          </div>

                          {/* Match arrow */}
                          <div className="flex items-center">
                            <Link2 className="h-5 w-5 text-muted-foreground" />
                          </div>

                          {/* Suggested match */}
                          <div className="flex-1">
                            {suggestedTx ? (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">Sugestão encontrada:</p>
                                <p className="font-medium text-sm">{(suggestedTx as any).description}</p>
                                <p className="text-sm">{fmt(Number((suggestedTx as any).amount))} — {new Date((suggestedTx as any).date).toLocaleDateString('pt-BR')}</p>
                              </div>
                            ) : (
                              <div className="bg-muted/30 rounded-lg p-3 text-center text-sm text-muted-foreground">
                                Nenhuma correspondência encontrada
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {suggestedTx && (
                              <Button size="sm" onClick={() => handleConciliate(s.id, (suggestedTx as any).id)}>
                                <Check className="h-3 w-3 mr-1" /> Confirmar
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleIgnore(s.id)}>
                              <X className="h-3 w-3 mr-1" /> Ignorar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="todos">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statements.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{new Date(s.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm font-medium">{s.description}</TableCell>
                        <TableCell>
                          <Badge variant={s.type === 'credito' ? 'default' : 'destructive'} className="text-xs">
                            {s.type === 'credito' ? 'Crédito' : 'Débito'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(s.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'conciliado' ? 'default' : s.status === 'ignorado' ? 'secondary' : 'outline'}>
                            {s.status === 'conciliado' ? '✓ Conciliado' : s.status === 'ignorado' ? 'Ignorado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {statements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento importado para este período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">Cadastre uma conta bancária para começar</p>
          </CardContent>
        </Card>
      )}

      {/* New Account Dialog */}
      <NewAccountDialog open={showNewAccount} onOpenChange={setShowNewAccount} onCreate={createAccount} />

      {/* Import Dialog */}
      <ImportDialog open={showImport} onOpenChange={setShowImport} accountId={accountId} existingStatements={statements} />
    </div>
  );
}

function NewAccountDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: any }) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [type, setType] = useState('corrente');

  const handleSave = () => {
    onCreate.mutate({ name, bank, agency, account, type }, { onSuccess: () => {
      onOpenChange(false);
      setName(''); setBank(''); setAgency(''); setAccount('');
    }});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome da Conta</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bradesco PJ" /></div>
          <div><Label>Banco</Label><Input value={bank} onChange={e => setBank(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Agência</Label><Input value={agency} onChange={e => setAgency(e.target.value)} /></div>
            <div><Label>Conta</Label><Input value={account} onChange={e => setAccount(e.target.value)} /></div>
          </div>
          <div><Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ open, onOpenChange, accountId, existingStatements }: {
  open: boolean; onOpenChange: (v: boolean) => void; accountId: string; existingStatements: BankStatement[];
}) {
  const importMutation = useImportStatements();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ date: string; description: string; amount: number; type: string }[]>([]);
  const [duplicates, setDuplicates] = useState<Set<number>>(new Set());

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const ext = file.name.toLowerCase();
    let parsed: typeof preview = [];

    if (ext.endsWith('.ofx') || ext.endsWith('.qfx')) {
      parsed = parseOFX(text);
    } else if (ext.endsWith('.csv') || ext.endsWith('.txt')) {
      parsed = parseCSV(text);
    } else {
      toast({ title: 'Formato não suportado', description: 'Use arquivos OFX ou CSV', variant: 'destructive' });
      return;
    }

    // Check duplicates
    const dupes = new Set<number>();
    parsed.forEach((p, i) => {
      const isDupe = existingStatements.some(
        s => s.date === p.date && Math.abs(s.amount - p.amount) < 0.01 && s.description === p.description
      );
      if (isDupe) dupes.add(i);
    });

    setDuplicates(dupes);
    setPreview(parsed);
  };

  const handleImport = () => {
    const items = preview
      .filter((_, i) => !duplicates.has(i))
      .map(p => ({
        bank_account_id: accountId,
        date: p.date,
        description: p.description,
        amount: p.amount,
        type: p.type,
        status: 'nao_conciliado' as const,
        transaction_id: null,
        user_id: '',
      }));

    importMutation.mutate(items, {
      onSuccess: () => {
        onOpenChange(false);
        setPreview([]);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Importar Extrato Bancário</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Arquivo OFX ou CSV</Label>
            <Input ref={fileRef} type="file" accept=".ofx,.qfx,.csv,.txt" onChange={handleFile} />
            <p className="text-xs text-muted-foreground mt-1">OFX (padrão bancário) ou CSV com colunas: data, descrição, valor</p>
          </div>

          {preview.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{preview.length} lançamentos encontrados</p>
                {duplicates.size > 0 && (
                  <Badge variant="secondary">{duplicates.size} duplicata(s) detectada(s)</Badge>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((p, i) => (
                      <TableRow key={i} className={duplicates.has(i) ? 'opacity-40 line-through' : ''}>
                        <TableCell className="text-sm">{new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm">{p.description}</TableCell>
                        <TableCell>
                          <Badge variant={p.type === 'credito' ? 'default' : 'destructive'} className="text-xs">
                            {p.type === 'credito' ? 'C' : 'D'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                        <TableCell>{duplicates.has(i) && <span className="text-xs text-muted-foreground">Duplicata</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setPreview([]); }}>Cancelar</Button>
          <Button onClick={handleImport} disabled={preview.length === 0 || importMutation.isPending}>
            {importMutation.isPending ? 'Importando...' : `Importar ${preview.length - duplicates.size} lançamentos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
