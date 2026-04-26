import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, Building, DollarSign, Calendar, Briefcase, Clock, Edit } from 'lucide-react';
import { getCustomerById, getUserById, getDealsByCustomerId, getInteractionsByCustomerId, getActivitiesByCustomerId, mockUsers } from '@/data/mock-data';
import { INTERACTION_TYPE_LABELS, DEAL_STAGE_LABELS, DEAL_STAGE_COLORS, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customer = getCustomerById(id || '');

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Cliente não encontrado</p>
        <button onClick={() => navigate('/clientes')} className="mt-4 text-sm text-accent hover:underline">Voltar para Clientes</button>
      </div>
    );
  }

  const deals = getDealsByCustomerId(customer.id);
  const activeDeals = deals.filter(d => d.stage !== 'ganho' && d.stage !== 'perdido');
  const closedDeals = deals.filter(d => d.stage === 'ganho' || d.stage === 'perdido');
  const interactions = getInteractionsByCustomerId(customer.id);
  const activities = getActivitiesByCustomerId(customer.id);
  const pendingActivities = activities.filter(a => a.status === 'pendente' || a.status === 'atrasada');

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <button onClick={() => navigate('/clientes')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">{customer.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="w-3.5 h-3.5" />{customer.company}
                <span className={`badge-status text-[10px] ${customer.status === 'ativo' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {customer.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                {customer.segment && <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{customer.segment}</span>}
              </div>
            </div>
          </div>
        </div>
        <button className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors">
          <Edit className="w-4 h-4" />Editar
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Receita Gerada</div>
          <div className="text-lg font-bold">R$ {customer.total_revenue.toLocaleString('pt-BR')}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Total de Negócios</div>
          <div className="text-lg font-bold">{customer.deals_count}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Último Contato</div>
          <div className="text-lg font-bold">{customer.last_contact ? format(new Date(customer.last_contact), 'dd/MM/yy', { locale: ptBR }) : '—'}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Relacionamento</div>
          <div className="text-lg font-bold">{customer.status === 'ativo' ? '🟢 Saudável' : '🟡 Atenção'}</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Dados do Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{customer.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Telefone</div>
                <div className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{customer.phone}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Segmento</div>
                <div className="text-sm">{customer.segment || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cliente desde</div>
                <div className="text-sm">{format(new Date(customer.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</div>
              </div>
            </div>
            {customer.tags.length > 0 && (
              <div className="flex gap-1 mt-4">
                {customer.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">{tag}</span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Notes */}
          {customer.notes && (
            <motion.div variants={item} className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3">Observações Internas</h3>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">{customer.notes}</p>
            </motion.div>
          )}

          {/* Active Deals */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Negócios Ativos ({activeDeals.length})</h3>
            {activeDeals.length > 0 ? (
              <div className="space-y-3">
                {activeDeals.map(deal => (
                  <div key={deal.id} onClick={() => navigate(`/negocios/${deal.id}`)} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-medium">{deal.name}</div>
                      <span className={`badge-status text-[10px] mt-1 ${DEAL_STAGE_COLORS[deal.stage]}`}>{DEAL_STAGE_LABELS[deal.stage]}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">R$ {deal.value.toLocaleString('pt-BR')}</div>
                      <div className="text-xs text-muted-foreground">{deal.probability}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum negócio ativo</p>
            )}
          </motion.div>

          {/* Closed Deals */}
          {closedDeals.length > 0 && (
            <motion.div variants={item} className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4">Negócios Fechados ({closedDeals.length})</h3>
              <div className="space-y-3">
                {closedDeals.map(deal => (
                  <div key={deal.id} onClick={() => navigate(`/negocios/${deal.id}`)} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-medium">{deal.name}</div>
                      <span className={`badge-status text-[10px] mt-1 ${DEAL_STAGE_COLORS[deal.stage]}`}>{DEAL_STAGE_LABELS[deal.stage]}</span>
                    </div>
                    <div className="text-sm font-semibold">R$ {deal.value.toLocaleString('pt-BR')}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Histórico de Interações</h3>
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map(i => {
                  const user = getUserById(i.user_id || '');
                  return (
                    <div key={i.id} className="border-l-2 border-accent/30 pl-4 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-status bg-secondary text-muted-foreground text-[10px]">{INTERACTION_TYPE_LABELS[i.type]}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(i.date), "dd/MM/yy 'às' HH:mm")}</span>
                        {user && <span className="text-[10px] text-muted-foreground">por {user.name.split(' ')[0]}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{i.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma interação registrada</p>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Activities */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Tarefas Pendentes ({pendingActivities.length})</h3>
            {pendingActivities.length > 0 ? (
              <div className="space-y-3">
                {pendingActivities.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge-status text-[10px] ${ACTIVITY_STATUS_COLORS[a.status]}`}>{ACTIVITY_STATUS_LABELS[a.status]}</span>
                      <span className={`badge-status text-[10px] ${PRIORITY_COLORS[a.priority]}`}>{PRIORITY_LABELS[a.priority]}</span>
                    </div>
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(a.due_date), "dd/MM/yy 'às' HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
