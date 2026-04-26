import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, UserCheck, UserMinus, Eye, Filter } from 'lucide-react';
import NewVisitorModal from '@/components/NewVisitorModal';

type VisitorStatus = 'todos' | 'pre_agendado' | 'aguardando' | 'dentro' | 'saiu';

const statusMap: Record<string, { label: string; style: string }> = {
  pre_agendado: { label: 'Pré-agendado', style: 'bg-primary/10 text-primary' },
  aguardando: { label: 'Aguardando', style: 'bg-warning/10 text-warning' },
  dentro: { label: 'Dentro', style: 'bg-success/10 text-success' },
  saiu: { label: 'Saiu', style: 'bg-muted text-muted-foreground' },
};

const mockVisitors = [
  { id: '1', name: 'Carlos Silva', cpf: '123.456.789-00', company: 'TechCorp', host: 'João Diretor', reason: 'Reunião', status: 'dentro', checkIn: '09:15', badge: '042' },
  { id: '2', name: 'Ana Santos', cpf: '987.654.321-00', company: 'LogisBR', host: 'Maria RH', reason: 'Entrevista', status: 'aguardando', checkIn: null, badge: null },
  { id: '3', name: 'Pedro Oliveira', cpf: '456.789.123-00', company: 'Manutenção Rápida', host: 'Paulo Manutenção', reason: 'Manutenção', status: 'dentro', checkIn: '08:30', badge: '015' },
  { id: '4', name: 'Fernanda Lima', cpf: '789.123.456-00', company: 'ConsultPRO', host: 'Ana Financeiro', reason: 'Comercial', status: 'pre_agendado', checkIn: null, badge: null },
  { id: '5', name: 'Ricardo Gomes', cpf: '321.654.987-00', company: 'AgroSul', host: 'Carlos Logística', reason: 'Entrega', status: 'saiu', checkIn: '07:00', badge: '008' },
];

const VisitorsPage = () => {
  const [filter, setFilter] = useState<VisitorStatus>('todos');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = mockVisitors.filter(v => {
    if (filter !== 'todos' && v.status !== filter) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.cpf.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gestão de Visitantes</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} registros</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110">
          <Plus className="h-3.5 w-3.5" />
          Novo Visitante
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-secondary pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          {(['todos', 'pre_agendado', 'aguardando', 'dentro', 'saiu'] as VisitorStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-ros ${
                filter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-muted'
              }`}
            >
              {s === 'todos' ? 'Todos' : statusMap[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">CPF</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Empresa</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Anfitrião</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Motivo</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Crachá</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <motion.tr
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 transition-ros hover:bg-secondary/50"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">{v.name}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.cpf}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.company}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.host}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.reason}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusMap[v.status].style}`}>
                    {statusMap[v.status].label}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.badge || '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {v.status === 'aguardando' && (
                      <button className="rounded p-1 text-success transition-ros hover:bg-success/10" title="Check-in">
                        <UserCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {v.status === 'dentro' && (
                      <button className="rounded p-1 text-warning transition-ros hover:bg-warning/10" title="Check-out">
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button className="rounded p-1 text-muted-foreground transition-ros hover:bg-secondary" title="Ver ficha">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <NewVisitorModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default VisitorsPage;
