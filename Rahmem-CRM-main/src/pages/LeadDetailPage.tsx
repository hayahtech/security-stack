import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, DollarSign, Clock, Edit, UserPlus, Briefcase, MapPin, ExternalLink } from 'lucide-react';
import { getLeadById, getUserById, getDealsByLeadId, getInteractionsByLeadId, getActivitiesByLeadId } from '@/data/mock-data';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, INTERACTION_TYPE_LABELS, DEAL_STAGE_LABELS, DEAL_STAGE_COLORS, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = getLeadById(id || '');

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Lead não encontrado</p>
        <button onClick={() => navigate('/leads')} className="mt-4 text-sm text-accent hover:underline">Voltar para Leads</button>
      </div>
    );
  }

  const responsible = getUserById(lead.responsible_id);
  const deals = getDealsByLeadId(lead.id);
  const interactions = getInteractionsByLeadId(lead.id);
  const activities = getActivitiesByLeadId(lead.id);
  const pendingActivities = activities.filter(a => a.status === 'pendente' || a.status === 'atrasada');

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Back + Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <button onClick={() => navigate('/leads')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <span className={`badge-status ${LEAD_STATUS_COLORS[lead.status]}`}>{LEAD_STATUS_LABELS[lead.status]}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
            {lead.company && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{lead.company}</span>}
            <span>Origem: {lead.source}</span>
            {lead.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {[
          { icon: Edit, label: 'Editar' },
          { icon: Phone, label: 'Ligar' },
          { icon: MessageSquare, label: 'WhatsApp' },
          { icon: Calendar, label: 'Agendar Atividade' },
          { icon: Briefcase, label: 'Criar Negócio' },
          { icon: UserPlus, label: 'Converter em Cliente' },
        ].map(action => (
          <button key={action.label} className="px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors">
            <action.icon className="w-4 h-4" />{action.label}
          </button>
        ))}
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Valor Potencial</div>
          <div className="text-lg font-bold">R$ {lead.potential_value.toLocaleString('pt-BR')}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Última Interação</div>
          <div className="text-lg font-bold">
            {interactions.length > 0 ? format(new Date(interactions[0].date), 'dd/MM/yy', { locale: ptBR }) : '—'}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Origem</div>
          <div className="text-lg font-bold">{lead.source}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Responsável</div>
          <div className="text-lg font-bold">{responsible?.name.split(' ')[0] || '—'}</div>
          <div className="text-xs text-muted-foreground">{responsible?.role}</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Informações Principais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{lead.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Telefone</div>
                <div className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{lead.phone}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Criado em</div>
                <div className="text-sm">{format(new Date(lead.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Atualizado em</div>
                <div className="text-sm">{format(new Date(lead.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          {lead.notes && (
            <motion.div variants={item} className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3">Observações</h3>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">{lead.notes}</p>
            </motion.div>
          )}

          {/* Deals */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Negócios Vinculados ({deals.length})</h3>
            {deals.length > 0 ? (
              <div className="space-y-3">
                {deals.map(deal => (
                  <div key={deal.id} onClick={() => navigate(`/negocios/${deal.id}`)} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-medium">{deal.name}</div>
                      <span className={`badge-status text-[10px] mt-1 ${DEAL_STAGE_COLORS[deal.stage]}`}>{DEAL_STAGE_LABELS[deal.stage]}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">R$ {deal.value.toLocaleString('pt-BR')}</div>
                      <div className="text-xs text-muted-foreground">{deal.probability}% prob.</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum negócio vinculado</p>
            )}
          </motion.div>

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
          {/* Upcoming Activities */}
          <motion.div variants={item} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Atividades Futuras ({pendingActivities.length})</h3>
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
              <p className="text-sm text-muted-foreground">Nenhuma atividade pendente</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
