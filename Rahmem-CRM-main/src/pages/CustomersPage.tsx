import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Phone, Mail, Building, X, Edit, Trash2, LayoutGrid, List, DollarSign, Clock, Briefcase, Table, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockCustomers as initialCustomers, mockInteractions, getDealsByCustomerId } from '@/data/mock-data';
import { Customer, INTERACTION_TYPE_LABELS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SEGMENTS = ['Tecnologia', 'SaaS', 'Varejo', 'Construção', 'Saúde'];

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [segmentFilter, setSegmentFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'nome' | 'empresa' | 'data'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segmentFilter === 'todos' || c.segment === segmentFilter;
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchSearch && matchSegment && matchStatus;
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'nome') return a.name.localeCompare(b.name) * dir;
    if (sortBy === 'empresa') return a.company.localeCompare(b.company) * dir;
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  const ITEMS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, segmentFilter, statusFilter, sortBy, sortDir]);

  const handleDelete = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  const handleSave = (customer: Customer) => {
    if (editing) {
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
    } else {
      setCustomers([{ ...customer, id: `c${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...customers]);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} de {customers.length} clientes</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="gradient-accent text-accent-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </motion.div>

      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="input-search pl-10" />
          </div>
          <div className="flex bg-secondary rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} className="input-search w-auto text-xs">
            <option value="todos">Todos segmentos</option>
            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-search w-auto text-xs">
            <option value="todos">Todos status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'nome' | 'empresa' | 'data')} className="input-search w-auto text-xs">
            <option value="nome">Ordenar por nome</option>
            <option value="empresa">Ordenar por empresa</option>
            <option value="data">Ordenar por data</option>
          </select>
          <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowUpDown className="w-3 h-3" />
            {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
          </button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(customer => (
              <div
                key={customer.id}
                className="glass-card-hover rounded-xl p-5 cursor-pointer"
                onClick={() => navigate(`/clientes/${customer.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">{customer.name.charAt(0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge-status text-[10px] ${customer.status === 'ativo' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {customer.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); setEditing(customer); setShowForm(true); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(customer.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1">{customer.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <Building className="w-3 h-3" />{customer.company}
                  {customer.segment && <span className="ml-2 px-1.5 py-0.5 rounded bg-secondary text-[10px]">{customer.segment}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Receita</div>
                    <div className="text-sm font-semibold">R$ {(customer.total_revenue / 1000).toFixed(0)}k</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Negócios</div>
                    <div className="text-sm font-semibold">{customer.deals_count}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Contato</div>
                    <div className="text-sm font-semibold">{customer.last_contact ? format(new Date(customer.last_contact), 'dd/MM', { locale: ptBR }) : '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="flex flex-col gap-2">
            {paginated.map(customer => (
              <div
                key={customer.id}
                className="glass-card-hover rounded-xl px-5 py-3 cursor-pointer flex items-center gap-4"
                onClick={() => navigate(`/clientes/${customer.id}`)}
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">{customer.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building className="w-3 h-3 shrink-0" /><span className="truncate">{customer.company}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="w-3 h-3" />R$ {(customer.total_revenue / 1000).toFixed(0)}k
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="w-3 h-3" />{customer.deals_count} negócios
                </div>
                <span className={`hidden lg:inline-flex badge-status text-[10px] ${customer.status === 'ativo' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {customer.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditing(customer); setShowForm(true); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(customer.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contato</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Negócios</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Último Contato</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(customer => (
                    <tr key={customer.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/clientes/${customer.id}`)}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-sm">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.company}</div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-sm">R$ {customer.total_revenue.toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-sm">{customer.deals_count}</td>
                      <td className="px-5 py-4 hidden lg:table-cell text-sm text-muted-foreground">
                        {customer.last_contact ? format(new Date(customer.last_contact), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge-status text-[10px] ${customer.status === 'ativo' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {customer.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); setEditing(customer); setShowForm(true); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(customer.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum cliente encontrado</p>
            <p className="text-xs mt-1">Tente ajustar os filtros</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <CustomerForm customer={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CustomerForm({ customer, onSave, onClose }: { customer: Customer | null; onSave: (c: Customer) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Customer>>(customer || { name: '', phone: '', email: '', company: '', tags: [], notes: '', segment: '', total_revenue: 0, deals_count: 0, status: 'ativo' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: customer?.id || '',
      name: form.name || '',
      phone: form.phone || '',
      email: form.email || '',
      company: form.company || '',
      tags: form.tags || [],
      notes: form.notes || '',
      segment: form.segment || '',
      total_revenue: form.total_revenue || 0,
      deals_count: form.deals_count || 0,
      status: form.status || 'ativo',
      last_contact: form.last_contact,
      created_at: customer?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-card rounded-xl p-6 w-full max-w-lg bg-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{customer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome</label>
              <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input-search" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Empresa</label>
              <input type="text" value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} className="input-search" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="input-search" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telefone</label>
              <input type="text" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-search" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Segmento</label>
              <select value={form.segment || ''} onChange={e => setForm({ ...form, segment: e.target.value })} className="input-search">
                <option value="">Selecione</option>
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select value={form.status || 'ativo'} onChange={e => setForm({ ...form, status: e.target.value as 'ativo' | 'inativo' })} className="input-search">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Observações</label>
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-search min-h-[80px] resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Salvar</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
