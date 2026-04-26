import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, GripVertical, Plus, Edit, Clock, X } from 'lucide-react';
import { mockDeals as initialDeals, mockUsers, getUserById, getLeadById, getCustomerById } from '@/data/mock-data';
import { Deal, DealStage, PipelineType, Priority, DEAL_STAGE_LABELS, PIPELINE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STAGES: DealStage[] = ['novo_lead', 'contactado', 'proposta', 'ganho', 'perdido'];

const STAGE_HEADER_COLORS: Record<DealStage, string> = {
  novo_lead: 'bg-info',
  contactado: 'bg-warning',
  proposta: 'bg-accent',
  ganho: 'bg-success',
  perdido: 'bg-destructive',
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SOURCES = ['Website', 'LinkedIn', 'Google Ads', 'Indicação', 'Evento', 'Inbound', 'Outbound', 'Upsell', 'Renovação', 'Portal'];

export default function PipelinePage() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [pipelineFilter, setPipelineFilter] = useState<PipelineType | 'todos'>('vendas');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('todos');
  const [sourceFilter, setSourceFilter] = useState<string>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const filteredDeals = deals.filter(d => {
    const matchPipeline = pipelineFilter === 'todos' || d.pipeline === pipelineFilter;
    const matchResponsible = responsibleFilter === 'todos' || d.responsible_id === responsibleFilter;
    const matchSource = sourceFilter === 'todos' || d.source === sourceFilter;
    return matchPipeline && matchResponsible && matchSource;
  });

  const handleDragStart = (dealId: string) => setDraggedDeal(dealId);
  const handleDragOver = (e: React.DragEvent, stage: DealStage) => { e.preventDefault(); setDragOverStage(stage); };
  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = (stage: DealStage) => {
    if (draggedDeal) {
      setDeals(deals.map(d => {
        if (d.id !== draggedDeal) return d;
        const newHistory = [...d.stage_history, { stage, date: new Date().toISOString().split('T')[0] }];
        return { ...d, stage, stage_history: newHistory, updated_at: new Date().toISOString() };
      }));
    }
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleSave = (deal: Deal) => {
    if (editingDeal) {
      setDeals(deals.map(d => d.id === deal.id ? deal : d));
    } else {
      setDeals([deal, ...deals]);
    }
    setShowForm(false);
    setEditingDeal(null);
  };

  const totalByStage = (stage: DealStage) => filteredDeals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0);

  const getContactName = (deal: Deal) => {
    if (deal.lead_id) { const l = getLeadById(deal.lead_id); return l?.name; }
    if (deal.customer_id) { const c = getCustomerById(deal.customer_id); return c?.name; }
    return undefined;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Arraste os cards entre as colunas para atualizar o estágio</p>
        </div>
        <button
          onClick={() => { setEditingDeal(null); setShowForm(true); }}
          className="gradient-accent text-accent-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Novo Negócio
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-wrap gap-2 items-center">
        <div className="flex bg-secondary rounded-lg p-1">
          {(['vendas', 'imobiliario', 'marketing'] as PipelineType[]).map(p => (
            <button
              key={p}
              onClick={() => setPipelineFilter(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pipelineFilter === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {PIPELINE_LABELS[p].replace('Pipeline ', '')}
            </button>
          ))}
          <button
            onClick={() => setPipelineFilter('todos')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pipelineFilter === 'todos' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Todos
          </button>
        </div>
        <select value={responsibleFilter} onChange={e => setResponsibleFilter(e.target.value)} className="input-search w-auto text-xs">
          <option value="todos">Todos responsáveis</option>
          {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="input-search w-auto text-xs">
          <option value="todos">Todas origens</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </motion.div>

      <motion.div variants={item} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STAGES.map(stage => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage);
          const isOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={`kanban-column bg-secondary/30 shrink-0 transition-all duration-200 ${isOver ? 'bg-accent/5 ring-2 ring-accent/20' : ''}`}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${STAGE_HEADER_COLORS[stage]}`} />
                  <h3 className="text-sm font-semibold">{DEAL_STAGE_LABELS[stage]}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{stageDeals.length}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                R$ {(totalByStage(stage) / 1000).toFixed(0)}k total
              </div>

              <div className="space-y-2.5 min-h-[100px]">
                {stageDeals.map(deal => {
                  const responsible = getUserById(deal.responsible_id);
                  const contactName = getContactName(deal);
                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onClick={() => navigate(`/negocios/${deal.id}`)}
                      className={`kanban-card transition-all duration-200 ${draggedDeal === deal.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium leading-tight flex-1">{deal.name}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingDeal(deal); setShowForm(true); }}
                            className="p-1 rounded-md hover:bg-secondary transition-colors"
                          >
                            <Edit className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      </div>
                      {contactName && (
                        <div className="text-xs text-muted-foreground mb-1.5">{contactName}</div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-semibold text-foreground">R$ {deal.value.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`badge-status text-[10px] ${PRIORITY_COLORS[deal.priority]}`}>
                          {PRIORITY_LABELS[deal.priority]}
                        </span>
                        {responsible && (
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center" title={responsible.name}>
                            <span className="text-[10px] font-bold">{responsible.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      {deal.next_activity && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                          <Clock className="w-3 h-3" />
                          <span>{deal.next_activity}</span>
                        </div>
                      )}
                      {deal.last_interaction && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Última: {deal.last_interaction}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>

      <DealFormDialog
        open={showForm}
        onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingDeal(null); } }}
        deal={editingDeal}
        onSave={handleSave}
        defaultPipeline={pipelineFilter !== 'todos' ? pipelineFilter : 'vendas'}
      />
    </motion.div>
  );
}

function DealFormDialog({ open, onOpenChange, deal, onSave, defaultPipeline }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  onSave: (d: Deal) => void;
  defaultPipeline: PipelineType;
}) {
  const [form, setForm] = useState<Partial<Deal>>({});

  useState(() => {
    if (deal) {
      setForm(deal);
    } else {
      setForm({
        name: '', value: 0, pipeline: defaultPipeline, stage: 'novo_lead',
        responsible_id: 'u2', probability: 20, priority: 'media', forecast_date: '', source: '',
      });
    }
  });

  // Reset form when deal changes
  const key = deal?.id || 'new';
  useState(() => {
    if (open) {
      setForm(deal || {
        name: '', value: 0, pipeline: defaultPipeline, stage: 'novo_lead',
        responsible_id: 'u2', probability: 20, priority: 'media', forecast_date: '', source: '',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    onSave({
      id: deal?.id || `d${Date.now()}`,
      name: form.name || '',
      value: form.value || 0,
      stage: (form.stage as DealStage) || 'novo_lead',
      pipeline: (form.pipeline as PipelineType) || defaultPipeline,
      priority: (form.priority as Priority) || 'media',
      probability: form.probability || 0,
      forecast_date: form.forecast_date,
      responsible_id: form.responsible_id || 'u2',
      source: form.source,
      stage_history: deal?.stage_history || [{ stage: (form.stage as DealStage) || 'novo_lead', date: now.split('T')[0] }],
      created_at: deal?.created_at || now,
      updated_at: now,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nome do negócio</label>
            <input type="text" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="input-search" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
              <input type="number" value={form.value || 0} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="input-search" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Probabilidade (%)</label>
              <input type="number" min={0} max={100} value={form.probability || 0} onChange={e => setForm({ ...form, probability: Number(e.target.value) })} className="input-search" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Pipeline</label>
              <select value={form.pipeline || defaultPipeline} onChange={e => setForm({ ...form, pipeline: e.target.value as PipelineType })} className="input-search">
                {Object.entries(PIPELINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estágio</label>
              <select value={form.stage || 'novo_lead'} onChange={e => setForm({ ...form, stage: e.target.value as DealStage })} className="input-search">
                {Object.entries(DEAL_STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Prioridade</label>
              <select value={form.priority || 'media'} onChange={e => setForm({ ...form, priority: e.target.value as Priority })} className="input-search">
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Responsável</label>
              <select value={form.responsible_id || ''} onChange={e => setForm({ ...form, responsible_id: e.target.value })} className="input-search">
                {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Data prevista</label>
              <input type="date" value={form.forecast_date || ''} onChange={e => setForm({ ...form, forecast_date: e.target.value })} className="input-search" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Origem</label>
            <select value={form.source || ''} onChange={e => setForm({ ...form, source: e.target.value })} className="input-search">
              <option value="">Selecione</option>
              {['Website', 'LinkedIn', 'Google Ads', 'Indicação', 'Evento', 'Inbound', 'Outbound', 'Upsell', 'Renovação', 'Portal'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Salvar</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
