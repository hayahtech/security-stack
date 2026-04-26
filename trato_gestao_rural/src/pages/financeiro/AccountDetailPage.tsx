import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, getMonthName } from '@/lib/format';
import { HideValuesToggle } from '@/components/shared/HideValuesToggle';
import { ArrowLeft, Landmark } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

export default function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accounts, transactions, hideValues } = useAppStore();
  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v);
  const account = accounts.find(a => a.id === id);

  const evolutionData = useMemo(() => {
    if (!account) return [];
    const data = [];
    const now = new Date();
    let balance = account.initialBalance;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth(), y = d.getFullYear();
      const monthTx = transactions.filter(t => {
        const td = new Date(t.date);
        return t.accountId === id && td.getMonth() === m && td.getFullYear() === y && t.status !== 'cancelado';
      });
      const rev = monthTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
      const exp = monthTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
      balance += rev - exp;
      data.push({ name: getMonthName(m), saldo: balance });
    }
    return data;
  }, [transactions, id, account]);

  const accountTx = useMemo(() => {
    return transactions.filter(t => t.accountId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, id]);

  if (!account) return <div className="page-container"><p className="text-muted-foreground">Conta não encontrada</p></div>;

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/app/contas')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <HideValuesToggle />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: account.color + '20' }}>
            <Landmark className="h-6 w-6" style={{ color: account.color }} />
          </div>
          <div>
            <h2>{account.name}</h2>
            <p className="text-sm text-muted-foreground">{account.bank} • {account.type}</p>
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground">{mask(account.balance)}</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h3 className="section-title">Evolução do Saldo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => mask(v)} />
            <Line type="monotone" dataKey="saldo" stroke={account.color} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="section-title">Últimos Movimentos</h3>
        <div className="space-y-2">
          {accountTx.slice(0, 15).map(tx => (
            <div key={tx.id} onClick={() => navigate(`/app/financeiro/lancamentos/${tx.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
              </div>
              <p className={`text-sm font-semibold ${tx.type === 'receita' ? 'text-success' : 'text-danger'}`}>
                {tx.type === 'receita' ? '+' : '-'}{mask(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
