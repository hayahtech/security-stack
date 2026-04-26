import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      // Previne clickjacking
      "X-Frame-Options": "DENY",
      // Previne MIME sniffing
      "X-Content-Type-Options": "nosniff",
      // Habilita proteção XSS do browser (legado, mas ainda útil)
      "X-XSS-Protection": "1; mode=block",
      // Não envia referrer para outros domínios
      "Referrer-Policy": "strict-origin-when-cross-origin",
      // Desabilita funcionalidades sensíveis desnecessárias
      "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
      // CSP: restringe origens de conteúdo
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        // Permite WebSocket do Supabase (realtime) e requisições HTTP
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Nunca expor sourcemaps em produção (proteção de código)
    sourcemap: false,
    // Minificação com terser ofusca nomes de variáveis
    minify: "terser",
  },
}));
