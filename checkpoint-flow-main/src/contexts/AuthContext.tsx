import { createContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, broadcastSignOut } from '@/integrations/supabase/client';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Rate limiting para login e signup — proteção contra brute force
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000; // 1 minuto

function createRateLimiter() {
  const attempts: number[] = [];

  return {
    check(): { allowed: boolean; waitMs: number } {
      const now = Date.now();
      // Remove tentativas fora da janela
      while (attempts.length > 0 && now - attempts[0] > WINDOW_MS) {
        attempts.shift();
      }
      if (attempts.length >= MAX_ATTEMPTS) {
        const waitMs = WINDOW_MS - (now - attempts[0]);
        return { allowed: false, waitMs };
      }
      return { allowed: true, waitMs: 0 };
    },
    record() {
      attempts.push(Date.now());
    },
  };
}

export type ProfileRole = 'operacional' | 'inspector' | 'supervisor';
export type ProfileStatus = 'pending' | 'active' | 'blocked';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: ProfileRole;
  status: ProfileStatus;
  requested_at: string | null;
  // reviewed_at e reviewed_by são dados de auditoria server-side.
  // Não trafegam para o cliente — definidos via SECURITY DEFINER no banco.
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: ProfileRole) => Promise<{ error: string | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Rate limiters por tipo de operação (persistem enquanto o componente estiver montado)
  const loginLimiter  = useRef(createRateLimiter());
  const signupLimiter = useRef(createRateLimiter());

  // Session timeout: encerra sessão após 30 min de inatividade
  const handleSessionTimeout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate('/login', { replace: true });
    toast.warning('Sessão encerrada por inatividade. Faça login novamente.');
  }, [navigate]);

  useSessionTimeout({
    enabled: !!user,
    onTimeout: handleSessionTimeout,
    onWarning: () => toast.info('Sua sessão expira em 2 minutos por inatividade.'),
  });

  const fetchProfile = useCallback(async (userId: string) => {
    // Seleciona apenas os campos necessários — reviewed_by/reviewed_at
    // são dados administrativos de auditoria e não devem trafegar para o cliente.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, requested_at')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      role: data.role as ProfileRole,
      status: data.status as ProfileStatus,
      requested_at: data.requested_at,
    } satisfies Profile;
  }, []);

  const redirectByStatus = useCallback((status: ProfileStatus, emailConfirmed: boolean) => {
    const publicRoutes = ['/login', '/register', '/pending', '/blocked'];

    // Bloqueia acesso se email ainda não foi verificado
    if (!emailConfirmed && !publicRoutes.includes(location.pathname)) {
      navigate('/pending', { replace: true });
      return;
    }

    if (status === 'pending') {
      navigate('/pending', { replace: true });
    } else if (status === 'blocked') {
      navigate('/blocked', { replace: true });
    } else if (status === 'active' && publicRoutes.includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    let mounted = true;
    let initialised = false;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          // Verifica se o token já expirou antes de restaurar a sessão.
          // expires_at é Unix timestamp em segundos; margem de 30s para clock skew.
          const expiresAt = (session.expires_at ?? 0) * 1000;
          if (expiresAt > 0 && expiresAt < Date.now() - 30_000) {
            await supabase.auth.signOut();
            return; // sessão expirada, não restaura
          }
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (!mounted) return;
          setProfile(p);
          if (p) redirectByStatus(p.status, !!session.user.email_confirmed_at);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) {
          initialised = true;
          setLoading(false);
        }
      }
    };

    // Safety timeout — never stay loading forever
    const timeout = setTimeout(() => {
      if (mounted && !initialised) setLoading(false);
    }, 5000);

    init();

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        if (!mounted) return;
        setProfile(p);
        if (p) redirectByStatus(p.status, !!session.user.email_confirmed_at);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = useCallback(async (email: string, password: string) => {
    const { allowed, waitMs } = loginLimiter.current.check();
    if (!allowed) {
      const seconds = Math.ceil(waitMs / 1000);
      return { error: `Muitas tentativas. Aguarde ${seconds}s antes de tentar novamente.` };
    }
    loginLimiter.current.record();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    broadcastSignOut(); // notifica outras abas antes de encerrar localmente
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: ProfileRole) => {
    const { allowed, waitMs } = signupLimiter.current.check();
    if (!allowed) {
      const seconds = Math.ceil(waitMs / 1000);
      return { error: `Muitas tentativas de cadastro. Aguarde ${seconds}s.` };
    }
    signupLimiter.current.record();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth foi movido para src/hooks/useAuth.ts para compatibilidade com Fast Refresh do Vite.
// Reexporta para não quebrar imports existentes.
export { useAuth } from '@/hooks/useAuth';
