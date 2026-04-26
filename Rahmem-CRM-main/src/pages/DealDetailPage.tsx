import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Calendar, Clock, Edit, CheckCircle, XCircle, ChevronRight, User, MapPin } from 'lucide-react';
import { getDealById, getUserById, getLeadById, getCustomerById, getInteractionsByDealId, getActivitiesByDealId } from '@/data/mock-data';
import { DEAL_STAGE_LABELS, DEAL_STAGE_COLORS, INTERACTION_TYPE_LABELS, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, PIPELINE_LABELS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const STAGES_ORDER = ['novo_lead', 'contactado', 'proposta', 'ganho', 'perdido'] as const;

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deal = getDealById(id || '');

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Negócio não encontrado</p>
        <button onClick={() => navigate('/pipeline')} className="mt-4 text-sm text-accent hover:underline">Voltar para Pipeline</button>
      </div>
    );
  }

  const responsible = getUserById(deal.responsible_id);
  const lead = deal.lead_id ? getLeadById(deal.lead_id) : null;
  const customer = deal.customer_id ? getCustomerById(deal.customer_id) : null;
  const interactions = getInteractionsByDealId(deal.id);
  const activities = getActivitiesByDealId(deal.id);
  const contactName = lead?.name || customer?.name || '—';
  const currentStageIdx = STAGES_ORDER.indexOf(deal.stage);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <button onClick={() => navigate('/pipeline')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{deal.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span className={`badge-status ${DEAL_STAGE_COLORS[deal.stage]}`}>{DEAL_STAGE_LABELS[deal.stage]}</span>
            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{PIPELINE_LABELS[deal.pipeline]}</span>
            <span className={`badge-status text-[10px] ${PRIORITY_COLORS[deal.priority]}`}>{PRIORITY_LABELS[deal.priority]}</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        <button className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors">
          <Edit className="w-4 h-4" />Editar
        </button>
        {deal.stage !== 'ganho' && deal.stage !== 'perdido' && (
          <>
            <button className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors">
              <ChevronRight className="w-4 h-4" />Avançar Etapa
            </button>
            <button className="px-3 py-2 rounded-lg bg-success/15 text-success text-sm font-medium flex items-center gap-2 hover:bg-success/25 transition-colors">
              <CheckCircle className="w-4 h-4" />Marcar como Ganho
            </button>
            <button className="px-3 py-2 rounded-lg bg-destructive/15 text-destructive text-sm font-medium flex items-center gap-2 hover:bg-destructive/25 transition-colors">
              <XCircle className="w-4 h-4" />Marcar como Perdido
            </button>
          </>
        )}
      </motion.div>

      {/* Stage Progress */}
      <motion.div variants={item} className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4">Progresso no Pipeline</h3>
        <div className="flex items-center gap-1">
          {STAGES_ORDER.map((stage, idx) => {
            const isCompleted = idx <= currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-full h-2 rounded-full transition-colors ${isCompleted ? (deal.stage === 'perdido' ? 'bg-destructive' : 'bg-accent') : 'bg-secondary'}`} />
                <span className={`text-[10px] font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {DEAL_STAGE_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Valor</div>
          <div className="text-lg font-bold">R$ {deal.value.toLocaleString('pt-BR')}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Probabilidade</div>
          <div className="text-lg font-bold">{deal.probability}%</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Previsão</div>
          <div className="text-lg font-bold">{deal.forecast_date ? format(new Date(deal.forecast_date), 'dd/MM/yy') : '—'}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Responsável</div>
          <div className="text-lg font-bold">{responsible?.name.split(' ')[0] || '—'}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Contato</div>
          <div className="text-lg font-bold truncate">{contactName}</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Detalhes do Negócio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Origem</div>
                <div className="text-sm font-medium">{deal.source || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pipeline</div>
                <div className="text-sm font-medium">{PIPELINE_LABELS[deal.pipeline]}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Criado em</div>
                <div className="text-sm">{format(new Date(deal.created_at), "dd/MM/yyyy", { locale: ptBR })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Última Interação</div>
                <div className="text-sm">{deal.last_interaction || '—'}</div>
              </div>
            </div>
          </motion.div>

          {/* Stage History */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Histórico de Movimentações</h3>
            <div className="space-y-3">
              {deal.stage_history.map((sh, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${DEAL_STAGE_COLORS[sh.stage].includes('success') ? 'bg-success' : DEAL_STAGE_COLORS[sh.stage].includes('destructive') ? 'bg-destructive' : 'bg-accent'}`} />
                  <span className="font-medium">{DEAL_STAGE_LABELS[sh.stage]}</span>
                  <span className="text-muted-foreground text-xs">{sh.date}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interactions */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Interações ({interactions.length})</h3>
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
          {/* Activities */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Atividades ({activities.length})</h3>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge-status text-[10px] ${ACTIVITY_STATUS_COLORS[a.status]}`}>{ACTIVITY_STATUS_LABELS[a.status]}</span>
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
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            )}
          </motion.div>

          {/* Contact Card */}
          {(lead || customer) && (
            <motion.div variants={item} className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4">{lead ? 'Lead Vinculado' : 'Cliente Vinculado'}</h3>
              <div
                className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => lead ? navigate(`/leads/${lead.id}`) : navigate(`/clientes/${customer!.id}`)}
              >
                <div className="text-sm font-medium">{contactName}</div>
                <div className="text-xs text-muted-foreground mt-1">{lead?.email || customer?.email}</div>
                <div className="text-xs text-muted-foreground">{lead?.phone || customer?.phone}</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
