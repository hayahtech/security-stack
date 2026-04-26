import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  category_id: string | null;
  amount: number;
  type: string;
  status: string;
  recurrent?: boolean;
  categories?: Category | null;
  [key: string]: any;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onDelete?: (id: string) => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function TransactionTable({ transactions, categories, onDelete }: Props) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            {onDelete && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onDelete ? 6 : 5} className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.map(t => {
              const cat = t.categories || categories.find(c => c.id === t.category_id);
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {t.description}
                    {t.recurrent && <Badge variant="outline" className="ml-2 text-xs">Recorrente</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{cat?.name || '—'}</Badge>
                  </TableCell>
                  <TableCell className={`text-right text-sm font-semibold ${t.type === 'revenue' ? 'text-[hsl(var(--success))]' : 'text-primary'}`}>
                    {t.type === 'revenue' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                      {t.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  {onDelete && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
