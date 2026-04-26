import { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Logout automático após 30 min de inatividade
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const INACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = useCallback(async () => {
    // Limpar timer antes de sair
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    // Sinalizar logout em outras abas (broadcast via Supabase)
    await supabase.auth.signOut({ scope: "global" });
    // Garantir limpeza completa de storage
    sessionStorage.clear();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      signOut();
    }, INACTIVITY_TIMEOUT_MS);
  }, [signOut]);

  // Registrar/remover listeners de atividade do usuário
  useEffect(() => {
    const handleActivity = () => resetInactivityTimer();

    INACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      INACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        // Iniciar timer de inatividade ao autenticar
        if (session) resetInactivityTimer();
        else if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) resetInactivityTimer();
    });

    return () => subscription.unsubscribe();
  }, [resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
