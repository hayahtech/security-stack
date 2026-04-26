/**
 * Vercel Edge Middleware — Rate Limiting por IP
 *
 * Intercepta requisições antes que cheguem ao servidor Vercel.
 * Rodando no Edge Runtime (V8 isolates), tem latência ~0ms.
 *
 * LIMITAÇÃO IMPORTANTE:
 * Edge Middleware é stateless entre requisições: o Map abaixo é local
 * ao isolate atual e pode ser destruído a qualquer momento pelo Vercel.
 * Para rate limiting persistente e distribuído, integre Upstash Redis:
 *   https://upstash.com/docs/redis/sdks/edge-middleware/overview
 *
 * Para este SPA, a defesa eficaz em camadas é:
 *   1. Supabase auth rate limiting (server-side, confiável)
 *   2. Frontend rate limiter em AuthContext (5 tentativas / 60 s por browser)
 *   3. Este middleware (melhor esforço por isolate, bloqueia DDoS simples)
 */

import { type NextRequest, NextResponse } from 'next/server';

// ── Configuração ────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000; // 1 minuto

// Rotas de autenticação: limite mais restrito para dificultar brute-force/credential stuffing.
// Rotas gerais: limite generoso para não prejudicar navegação normal.
const LIMITS: Array<{ paths: string[]; max: number }> = [
  { paths: ['/login', '/register'], max: 10 },  // 10 req/min por IP em auth
  { paths: ['/', '/pending', '/blocked'],        max: 60 },  // 60 req/min em rotas públicas gerais
];

// ── Store em memória (best-effort, stateless por isolate) ───────────────────

interface RateEntry {
  count: number;
  resetAt: number;
}

// Mapa vive enquanto o isolate estiver ativo no Vercel.
// Para rate limiting persistente e distribuído use Upstash Redis:
//   https://upstash.com/docs/redis/sdks/edge-middleware/overview
const ipStore = new Map<string, RateEntry>();

function getClientIp(req: NextRequest): string {
  // Vercel injeta o IP real neste header
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function checkLimit(key: string, maxRequests: number): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = ipStore.get(key);

  if (!entry || now > entry.resetAt) {
    ipStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfter: 0 };
}

// ── Middleware ───────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  for (const { paths, max } of LIMITS) {
    if (paths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      // Chave composta: IP + rota-base para contadores independentes por endpoint
      const key = `${ip}:${paths[0]}`;
      const { limited, retryAfter } = checkLimit(key, max);
      if (limited) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'Content-Type': 'text/plain',
          },
        });
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas as rotas exceto assets estáticos e arquivos internos Next/Vercel.
     * Para um SPA Vite, o rewrite no vercel.json direciona tudo para index.html,
     * então o middleware intercepta as navegações antes do rewrite.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)',
  ],
};
