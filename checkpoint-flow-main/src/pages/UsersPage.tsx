import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ArrowLeft, Clock, CheckCircle2, XCircle, HardHat, Shield, Eye, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type FilterStatus = 'pending' | 'active' | 'blocked';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  requested_at: string | null;
}

const roleBadge: Record<string, { label: string; className: string; icon: typeof HardHat }> = {
  operacional: { label: 'Operacional', className: 'bg-muted text-muted-foreground', icon: HardHat },
  supervisor: { label: 'Supervisor', className: 'bg-primary/10 text-primary', icon: Shield },
  inspector: { label: 'Inspetor', className: 'bg-accent text-accent-foreground', icon: Eye },
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  active: 'bg-success/15 text-success border-success/30',
  blocked: 'bg-destructive/15 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  active: 'Ativo',
  blocked: 'Bloqueado',
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// Mascara o e-mail para exibição: "joao.silva@empresa.com" → "j***@empresa.com"
// Reduz exposição de PII (LGPD) sem perder contexto para o inspetor.
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length === 0) return email;
  return `${local[0]}***@${domain}`;
}

export default function UsersPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Protect route
  useEffect(() => {
    if (profile && (profile.role !== 'inspector' || profile.status !== 'active')) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, requested_at')
      .eq('status', filter)
      .order('requested_at', { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Usa RPC server-side — reviewed_by é definido pelo banco via auth.uid(),
  // impedindo que o cliente falsifique quem aprovou a conta.
  const updateStatus = async (userId: string, newStatus: 'active' | 'blocked', userName: string) => {
    const { error } = await supabase.rpc('review_user', {
      p_target_id: userId,
      p_new_status: newStatus,
    });

    if (error) {
      // Não expõe detalhes internos do Supabase (ex: nomes de tabelas, políticas RLS)
      toast.error('Não foi possível atualizar o status. Tente novamente.');
      return;
    }

    if (newStatus === 'active') toast.success(`Acesso liberado para ${userName}`);
    else toast.error(`Usuário ${userName} bloqueado`);
    fetchUsers();
  };

  const reactivate = async (userId: string, userName: string) => {
    const { error } = await supabase.rpc('review_user', {
      p_target_id: userId,
      p_new_status: 'active',
    });

    if (error) { toast.error('Não foi possível reativar o usuário. Tente novamente.'); return; }
    toast.success(`Acesso de ${userName} reativado`);
    fetchUsers();
  };

  if (!profile || profile.role !== 'inspector' || profile.status !== 'active') return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg border bg-muted/50 text-muted-foreground hover:text-foreground transition-fast">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-display font-bold text-base text-foreground leading-none">Gerenciar usuários</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Aprovações e controle de acesso</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'active', 'blocked'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-fast',
                filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'pending' && <Clock className="w-3.5 h-3.5" />}
              {s === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {s === 'blocked' && <XCircle className="w-3.5 h-3.5" />}
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>
        ) : (
          <div className="space-y-3">
            {users.map(u => {
              const rb = roleBadge[u.role] || roleBadge.operacional;
              const RoleIcon = rb.icon;
              return (
                <div key={u.id} className="rounded-xl border bg-card shadow-sm p-4 flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {getInitials(u.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{maskEmail(u.email)}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className={cn('text-[10px] gap-1', rb.className)}>
                        <RoleIcon className="w-3 h-3" /> {rb.label}
                      </Badge>
                      <Badge className={cn('text-[10px] border', statusColors[u.status])}>
                        {statusLabels[u.status]}
                      </Badge>
                      {u.requested_at && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(u.requested_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    {u.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(u.id, 'active', u.full_name)}
                          className="px-3 py-1.5 rounded-md bg-success/15 text-success text-xs font-semibold hover:bg-success/25 transition-fast"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => updateStatus(u.id, 'blocked', u.full_name)}
                          className="px-3 py-1.5 rounded-md bg-destructive/15 text-destructive text-xs font-semibold hover:bg-destructive/25 transition-fast"
                        >
                          Bloquear
                        </button>
                      </>
                    )}
                    {u.status === 'active' && u.id !== user?.id && (
                      <button
                        onClick={() => updateStatus(u.id, 'blocked', u.full_name)}
                        className="px-3 py-1.5 rounded-md bg-destructive/15 text-destructive text-xs font-semibold hover:bg-destructive/25 transition-fast"
                      >
                        Bloquear
                      </button>
                    )}
                    {u.status === 'blocked' && (
                      <button
                        onClick={() => reactivate(u.id, u.full_name)}
                        className="px-3 py-1.5 rounded-md bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-fast flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reativar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
