import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Phone, Mail, Edit, Trash2, X, DollarSign, Clock, User } from 'lucide-react';
import { mockLeads as initialLeads, mockInteractions, mockUsers, getUserById, getDealsByLeadId } from '@/data/mock-data';
import { Lead, LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, INTERACTION_TYPE_LABELS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SOURCES = ['Website', 'LinkedIn', 'Google Ads', 'Indicação', 'Evento'];

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'todos'>('todos');
  const [sourceFilter, setSourceFilter] = useState<string>('todos');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchStatus = statusFilter === 'todos' || l.status === statusFilter;
    const matchSource = sourceFilter === 'todos' || l.source === sourceFilter;
    const matchResponsible = responsibleFilter === 'todos' || l.responsible_id === responsibleFilter;
    return matchSearch && matchStatus && matchSource && matchResponsible;
  });

  const handleDelete = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
  };

  const handleSave = (lead: Lead) => {
    if (editingLead) {
      setLeads(leads.map(l => l.id === lead.id ? lead : l));
    } else {
      setLeads([{ ...lead, id: `l${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...leads]);
    }
    setShowForm(false);
    setEditingLead(null);
  };

  const getLastInteraction = (leadId: string) => {
    const interactions = mockInteractions.filter(i => i.lead_id === leadId);
    if (interactions.length === 0) return null;
    return interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} de {leads.length} leads</p>
        </div>
        <button
          onClick={() => { setEditingLead(null); setShowForm(true); }}
          className="gradient-accent text-accent-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Novo Lead
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="input-search pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'novo', 'contactado', 'qualificado', 'perdido'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'gradient-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'todos' ? 'Todos' : LEAD_STATUS_LABELS[s]}
            </button>
          ))}
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="input-search w-auto text-xs">
            <option value="todos">Todas origens</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={responsibleFilter} onChange={e => setResponsibleFilter(e.target.value)} className="input-search w-auto text-xs">
            <option value="todos">Todos responsáveis</option>
            {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contato</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Responsável</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Valor Pot.</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Última Interação</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Origem</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const responsible = getUserById(lead.responsible_id);
                const lastInteraction = getLastInteraction(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm">{lead.name}</div>
                      {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                      <div className="flex gap-1 mt-1">
                        {lead.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{lead.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge-status ${LEAD_STATUS_COLORS[lead.status]}`}>{LEAD_STATUS_LABELS[lead.status]}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-[10px] font-bold">{responsible?.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{responsible?.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">R$ {(lead.potential_value / 1000).toFixed(0)}k</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      {lastInteraction ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(lastInteraction.date), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground hidden lg:table-cell">{lead.source}</td>
                    <td className="px-3 py-4">
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditingLead(lead); setShowForm(true); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(lead.id); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Nenhum lead encontrado</p>
              <p className="text-xs mt-1">Tente ajustar os filtros ou adicione um novo lead</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <LeadForm lead={editingLead} onSave={handleSave} onClose={() => { setShowForm(false); setEditingLead(null); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LeadForm({ lead, onSave, onClose }: { lead: Lead | null; onSave: (l: Lead) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Lead>>(lead || { name: '', phone: '', email: '', source: '', status: 'novo', notes: '', tags: [], responsible_id: 'u2', potential_value: 0, company: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: lead?.id || '',
      name: form.name || '',
      phone: form.phone || '',
      email: form.email || '',
      source: form.source || '',
      status: (form.status as LeadStatus) || 'novo',
      notes: form.notes || '',
      tags: form.tags || [],
      responsible_id: form.responsible_id || 'u2',
      potential_value: form.potential_value || 0,
      company: form.company || '',
      created_at: lead?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-card rounded-xl p-6 w-full max-w-lg bg-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Origem</label>
              <select value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })} className="input-search">
                <option value="">Selecione</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select value={form.status || 'novo'} onChange={e => setForm({ ...form, status: e.target.value as LeadStatus })} className="input-search">
                {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Responsável</label>
              <select value={form.responsible_id || ''} onChange={e => setForm({ ...form, responsible_id: e.target.value })} className="input-search">
                {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Valor Potencial (R$)</label>
            <input type="number" value={form.potential_value || 0} onChange={e => setForm({ ...form, potential_value: Number(e.target.value) })} className="input-search" />
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
