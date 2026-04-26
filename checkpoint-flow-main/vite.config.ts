import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    },
  },
  build: {
    // Nunca expor sourcemaps em produção — evita que código TypeScript
    // original seja legível via DevTools > Sources
    sourcemap: false,
    // Ofusca nomes de variáveis no bundle para dificultar engenharia reversa
    minify: 'terser',
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'placeholder.svg'],
      manifest: {
        name: 'Checklist Operacional',
        short_name: 'Checklist',
        description: 'Sistema universal de controle e validação operacional',
        theme_color: '#0284c7',
        background_color: '#f0f4f8',
        display: 'standalone',
        icons: [
          { src: 'favicon.ico', sizes: '64x64', type: 'image/x-icon' },
        ],
      },
      workbox: {
        // Garante que o service worker use o hash do build para invalidar cache
        // quando o código muda — previne cache poisoning de assets antigos
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Fontes externas: imutáveis por natureza, CacheFirst seguro
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Imagens estáticas: CacheFirst com expiração curta
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          // JS/CSS da aplicação: NetworkFirst — busca versão atualizada da rede primeiro.
          // Fallback para cache apenas se offline. Impede execução de código comprometido em cache.
          // timeout 10s: janela maior evita fallback para código desatualizado em redes lentas.
          // maxAge 6h: reduz risco de servir bundle antigo com vulnerabilidades conhecidas.
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-code-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 6 },
            },
          },
          // Chamadas à API Supabase: NetworkOnly — nunca cacheia dados sensíveis
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
