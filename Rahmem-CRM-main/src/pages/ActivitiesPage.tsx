import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, Filter, CheckCircle } from 'lucide-react';
import { mockActivities as initialActivities, mockUsers, getUserById, getLeadById, getCustomerById } from '@/data/mock-data';
import { Activity, ActivityType, ActivityStatus, Priority, ACTIVITY_TYPE_LABELS, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities] = useState<Activity[]>(initialActivities);
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'todos'>('todos');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('todos');

  const filtered = activities.filter(a => {
    const matchType = typeFilter === 'todos' || a.type === typeFilter;
    const matchStatus = statusFilter === 'todos' || a.status === statusFilter;
    const matchResponsible = responsibleFilter === 'todos' || a.responsible_id === responsibleFilter;
    return matchType && matchStatus && matchResponsible;
  }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const getRelatedName = (activity: Activity) => {
    if (activity.lead_id) return getLeadById(activity.lead_id)?.name;
    if (activity.customer_id) return getCustomerById(activity.customer_id)?.name;
    return undefined;
  };

  const todayCount = filtered.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.due_date.startsWith(today) && a.status !== 'concluida';
  }).length;

  const overdueCount = filtered.filter(a => a.status === 'atrasada').length;
  const pendingCount = filtered.filter(a => a.status === 'pendente').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Atividades</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} atividades · {pendingCount} pendentes · {overdueCount} atrasadas</p>
        </div>
        <button className="gradient-accent text-accent-foreground px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nova Atividade
        </button>
      </motion.div>

      {/* Summary */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Hoje</div>
          <div className="text-lg font-bold">{todayCount}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Pendentes</div>
          <div className="text-lg font-bold text-warning">{pendingCount}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Atrasadas</div>
          <div className="text-lg font-bold text-destructive">{overdueCount}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Concluídas</div>
          <div className="text-lg font-bold text-success">{filtered.filter(a => a.status === 'concluida').length}</div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ActivityType | 'todos')} className="input-search w-auto text-xs">
          <option value="todos">Todos tipos</option>
          {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ActivityStatus | 'todos')} className="input-search w-auto text-xs">
          <option value="todos">Todos status</option>
          {Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={responsibleFilter} onChange={e => setResponsibleFilter(e.target.value)} className="input-search w-auto text-xs">
          <option value="todos">Todos responsáveis</option>
          {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </motion.div>

      {/* Activities List */}
      <motion.div variants={item} className="space-y-3">
        {filtered.map(activity => {
          const responsible = getUserById(activity.responsible_id);
          const relatedName = getRelatedName(activity);
          return (
            <div key={activity.id} className="glass-card-hover rounded-xl p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activity.status === 'concluida' ? 'bg-success/15' : activity.status === 'atrasada' ? 'bg-destructive/15' : 'bg-accent/15'}`}>
                {activity.status === 'concluida' ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <Calendar className="w-5 h-5 text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`badge-status text-[10px] ${ACTIVITY_STATUS_COLORS[activity.status]}`}>{ACTIVITY_STATUS_LABELS[activity.status]}</span>
                  <span className={`badge-status text-[10px] ${PRIORITY_COLORS[activity.priority]}`}>{PRIORITY_LABELS[activity.priority]}</span>
                  <span className="badge-status bg-secondary text-muted-foreground text-[10px]">{ACTIVITY_TYPE_LABELS[activity.type]}</span>
                </div>
                <h4 className="text-sm font-medium">{activity.title}</h4>
                {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(activity.due_date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {responsible && (
                    <span className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-[8px] font-bold">{responsible.name.charAt(0)}</span>
                      </div>
                      {responsible.name.split(' ')[0]}
                    </span>
                  )}
                  {relatedName && (
                    <span className="text-accent cursor-pointer hover:underline" onClick={() => {
                      if (activity.lead_id) navigate(`/leads/${activity.lead_id}`);
                      else if (activity.customer_id) navigate(`/clientes/${activity.customer_id}`);
                    }}>
                      {relatedName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma atividade encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
