import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Usa sessionStorage em vez de localStorage para reduzir exposição do JWT a ataques XSS:
// - sessionStorage é limpo ao fechar a aba (sem sessão persistente entre abas/janelas)
// - localStorage persiste indefinidamente e é acessível por qualquer script na mesma origem
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Canal para sincronizar logout entre abas da mesma origem.
// BroadcastChannel funciona com sessionStorage (diferente do storage event,
// que só dispara para localStorage e apenas em outras abas).
const authChannel = new BroadcastChannel('auth');

// Ao receber sinal de logout de outra aba, encerra a sessão local.
authChannel.addEventListener('message', (e: MessageEvent) => {
  if (e.data === 'signout') {
    supabase.auth.signOut().catch(() => null);
  }
});

/** Chame após supabase.auth.signOut() para propagar para todas as abas. */
export function broadcastSignOut() {
  authChannel.postMessage('signout');
}