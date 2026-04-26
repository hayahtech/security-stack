import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Kanban, Search, Menu, X, ChevronLeft, CalendarCheck, BarChart3, Settings, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { mockLeads, mockCustomers, mockDeals, mockActivities } from '@/data/mock-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: UserPlus, label: 'Leads' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/atividades', icon: CalendarCheck, label: 'Atividades' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

interface Notification {
  id: string;
  title: string;
  description: string;
  emoji: string;
  date: string;
  read: boolean;
}

function generateNotifications(): Notification[] {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const notifs: Notification[] = [];

  mockActivities.forEach(a => {
    const dueDate = a.due_date.split('T')[0];
    if (a.status === 'atrasada') {
      notifs.push({ id: `n-${a.id}-late`, title: 'Atividade atrasada', description: a.title, emoji: '⚠️', date: a.due_date, read: false });
    } else if (a.status === 'pendente' && dueDate === today) {
      notifs.push({ id: `n-${a.id}-today`, title: 'Vence hoje', description: a.title, emoji: '📅', date: a.due_date, read: false });
    } else if (a.status === 'pendente' && dueDate === tomorrow) {
      notifs.push({ id: `n-${a.id}-tmrw`, title: 'Vence amanhã', description: a.title, emoji: '🔔', date: a.due_date, read: false });
    }
  });

  return notifs;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Global search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>(() => generateNotifications());
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  // Search results
  const searchResults = searchQuery.length >= 2 ? {
    leads: mockLeads.filter(l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    customers: mockCustomers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    deals: mockDeals.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
  } : null;

  const hasResults = searchResults && (searchResults.leads.length > 0 || searchResults.customers.length > 0 || searchResults.deals.length > 0);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close search on navigate
  useEffect(() => { setSearchOpen(false); setSearchQuery(''); }, [location.pathname]);

  const navigateToResult = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col text-sidebar-foreground transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, hsl(210 60% 11%) 0%, hsl(210 50% 18%) 50%, hsl(205 55% 28%) 100%)' }}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            {sidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-semibold tracking-tight text-sidebar-foreground">Rahmem</motion.span>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-sidebar-accent transition-colors">
            <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={isActive ? 'sidebar-item-active' : 'sidebar-item'}>
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 pb-2">
          <NavLink
            to="/configuracoes"
            onClick={() => setMobileOpen(false)}
            className={location.pathname.startsWith('/configuracoes') ? 'sidebar-item-active' : 'sidebar-item'}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Configurações</span>}
          </NavLink>
        </div>

        {sidebarOpen && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="glass-card rounded-lg p-3 bg-sidebar-accent/50">
              <p className="text-xs text-sidebar-foreground/60">Módulo CRM</p>
              <p className="text-xs font-medium text-sidebar-primary">Rahmem v2.0</p>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"><Menu className="w-5 h-5" /></button>
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar leads, clientes, negócios..."
                className="input-search pl-10 w-64 lg:w-96"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => { if (searchQuery.length >= 2) setSearchOpen(true); }}
              />
              {/* Search dropdown */}
              {searchOpen && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-[400px] overflow-y-auto">
                  {!hasResults ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      Nenhum resultado para "{searchQuery}"
                    </div>
                  ) : (
                    <div className="p-2">
                      {searchResults!.leads.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <UserPlus className="w-3 h-3" /> Leads
                          </div>
                          {searchResults!.leads.map(l => (
                            <button key={l.id} onClick={() => navigateToResult(`/leads/${l.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-info/15 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-info">{l.name.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{l.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{l.company || l.email}</div>
                              </div>
                              <span className="ml-auto badge-status text-[9px] bg-info/15 text-info shrink-0">Lead</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults!.customers.length > 0 && (
                        <div className="mb-2">
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3 h-3" /> Clientes
                          </div>
                          {searchResults!.customers.map(c => (
                            <button key={c.id} onClick={() => navigateToResult(`/clientes/${c.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-success">{c.name.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{c.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{c.company}</div>
                              </div>
                              <span className="ml-auto badge-status text-[9px] bg-success/15 text-success shrink-0">Cliente</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults!.deals.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Kanban className="w-3 h-3" /> Negócios
                          </div>
                          {searchResults!.deals.map(d => (
                            <button key={d.id} onClick={() => navigateToResult(`/negocios/${d.id}`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-accent">{d.name.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{d.name}</div>
                                <div className="text-xs text-muted-foreground truncate">R$ {d.value.toLocaleString('pt-BR')}</div>
                              </div>
                              <span className="ml-auto badge-status text-[9px] bg-accent/15 text-accent shrink-0">Negócio</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h4 className="text-sm font-semibold">Notificações</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent hover:underline">Marcar tudo como lido</button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">Sem notificações</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-border/50 last:border-0 ${n.read ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className="text-base">{n.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{n.description}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(n.date), { addSuffix: true, locale: ptBR })}
                            </div>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center">
              <span className="text-xs font-bold text-white">U</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
