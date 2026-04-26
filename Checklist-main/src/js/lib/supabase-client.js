// ═══════════════════════════════════════════════════════════════
// CheckFlow Pro — Supabase Client
// Usa a variável global injetada via index.html (window.__CFG)
// A anon key é segura para expor no client — segurança = RLS
// ═══════════════════════════════════════════════════════════════

(function () {
  const cfg = window.__CFG || {};
  const url  = cfg.SUPABASE_URL  || '';
  const anonKey = cfg.SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    console.error('[CheckFlow] Supabase não configurado. Verifique window.__CFG.');
    return;
  }

  // O CDN UMD do supabase-js expõe window.supabase
  const { createClient } = window.supabase;
  window.supabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });
})();
