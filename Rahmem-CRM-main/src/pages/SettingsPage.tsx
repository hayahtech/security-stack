import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { mockUsers as initialUsers, mockDeals } from '@/data/mock-data';
import { User, DEAL_STAGE_LABELS } from '@/types/crm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const STAGE_COLORS: Record<string, string> = {
  novo_lead: 'bg-info',
  contactado: 'bg-warning',
  proposta: 'bg-accent',
  ganho: 'bg-success',
  perdido: 'bg-destructive',
};

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showUserForm, setShowUserForm] = useState(false);
  const [companyName, setCompanyName] = useState('Rahmem');
  const [currency, setCurrency] = useState('BRL');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [goals, setGoals] = useState<Record<string, number>>(() => {
    const g: Record<string, number> = {};
    initialUsers.forEach(u => { g[u.id] = 200000; });
    return g;
  });

  const [newUser, setNewUser] = useState({ name: '', email: '', role: '' });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers([...users, { id: `u${Date.now()}`, name: newUser.name, email: newUser.email, role: newUser.role }]);
    setNewUser({ name: '', email: '', role: '' });
    setShowUserForm(false);
    toast.success('Membro adicionado com sucesso!');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua equipe, pipelines e preferências</p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="equipe" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>

          {/* Equipe */}
          <TabsContent value="equipe" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Membros da Equipe</h2>
              <button onClick={() => setShowUserForm(true)} className="gradient-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Adicionar membro
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">{user.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{user.role}</div>
                    </div>
                    <span className="badge-status text-[10px] bg-success/15 text-success">Ativo</span>
                  </div>
                </div>
              ))}
            </div>

            <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Membro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome</label>
                    <input type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="input-search" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="input-search" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Cargo</label>
                    <input type="text" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="input-search" required />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-2.5 rounded-lg gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Salvar</button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Pipeline */}
          <TabsContent value="pipeline" className="space-y-4">
            <h2 className="text-lg font-semibold">Estágios do Pipeline</h2>
            <div className="glass-card rounded-xl p-6 space-y-3">
              {Object.entries(DEAL_STAGE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                  <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[key] || 'bg-muted'}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">Chave: {key}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Metas */}
          <TabsContent value="metas" className="space-y-4">
            <h2 className="text-lg font-semibold">Metas Mensais de Receita</h2>
            <div className="glass-card rounded-xl p-6 space-y-4">
              {users.map(user => {
                const userWon = mockDeals.filter(d => d.responsible_id === user.id && d.stage === 'ganho');
                const realized = userWon.reduce((s, d) => s + d.value, 0);
                const goal = goals[user.id] || 200000;
                const pct = Math.round((realized / goal) * 100);
                return (
                  <div key={user.id} className="p-4 rounded-lg bg-secondary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Meta R$</span>
                        <input
                          type="number"
                          value={goal}
                          onChange={e => setGoals({ ...goals, [user.id]: Number(e.target.value) })}
                          className="input-search w-28 text-right text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-12 text-right">{pct}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Realizado: R$ {realized.toLocaleString('pt-BR')}</span>
                      <span>Meta: R$ {goal.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Geral */}
          <TabsContent value="geral" className="space-y-4">
            <h2 className="text-lg font-semibold">Configurações Gerais</h2>
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome da Empresa</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-search max-w-sm" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Moeda</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-search max-w-sm">
                  <option value="BRL">BRL - Real Brasileiro</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div className="flex items-center justify-between max-w-sm">
                <label className="text-sm font-medium">Notificações ativas</label>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
              <div className="flex items-center justify-between max-w-sm">
                <label className="text-sm font-medium">Tema</label>
                <ThemeToggle />
              </div>
              <button
                onClick={() => toast.success('Configurações salvas com sucesso!')}
                className="gradient-accent text-accent-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Salvar configurações
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
