# Checkpoint Flow

Sistema de checklists operacionais para logística, com validação de CNPJ alfanumérico (IN RFB nº 2.119/2022), captura de fotos e gestão de usuários com aprovação de acesso.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript 5 + Vite 8 |
| UI | shadcn/ui + Tailwind CSS 3 |
| Backend | Supabase (Postgres + Auth + RLS) |
| Offline | IndexedDB via `idb` + PWA (Workbox) |
| Deploy | Vercel (Edge Middleware + SPA rewrite) |
| Monitoramento | Sentry (opcional) |

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Conta [Supabase](https://supabase.com) (free tier suporta o projeto inteiro)
- Conta [Vercel](https://vercel.com) para deploy (opcional para desenvolvimento local)

---

## Setup local

```bash
# 1. Clone e instale dependências
git clone <repo-url>
cd checkpoint-flow-main
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 3. Aplique as migrações no banco
# Via Supabase CLI:
npx supabase db push
# Ou cole os arquivos de supabase/migrations/ no SQL Editor do painel

# 4. Inicie o servidor de desenvolvimento
npm run dev
# Acesse http://localhost:8080
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave anon pública (segura para frontend) |
| `VITE_SUPABASE_PROJECT_ID` | Sim | ID do projeto (para CLI e tipos) |
| `VITE_SENTRY_DSN` | Não | DSN Sentry — desabilitado se ausente |

> **Nunca use `service_role` key no frontend.** Ela bypassa RLS e dá acesso irrestrito ao banco. Use apenas em scripts server-side ou Edge Functions.

---

## Estrutura de pastas

```
src/
├── components/
│   ├── checklist/      # ChecklistPage, CnpjInput, ItemCard, etc.
│   └── ui/             # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx # Auth + rate limiting + session timeout
├── hooks/
│   ├── useAuth.ts
│   ├── useFindEmpresa.ts
│   └── useSessionTimeout.ts
├── integrations/
│   └── supabase/       # client.ts + tipos gerados
├── lib/
│   ├── cnpj.ts         # Validação CNPJ alfanumérico (Brand Type)
│   ├── checklistDB.ts  # IndexedDB — rascunhos e fotos isoladas
│   └── sentry.ts       # Inicialização Sentry
├── pages/              # LoginPage, RegisterPage, UsersPage, etc.
└── types/
    └── checklist.ts

supabase/
└── migrations/
    ├── 20260410000001_empresas_cnpj.sql    # Tabela empresas + RLS
    ├── 20260410000002_review_user_fn.sql   # SECURITY DEFINER review_user()
    └── 20260410000003_fix_profiles_rls.sql # RLS profiles restrita

middleware.ts       # Vercel Edge Middleware — rate limiting por IP
vercel.json         # Headers de segurança + SPA rewrite
```

---

## Segurança

### Autenticação e sessão
- JWT armazenado em `sessionStorage` (não persiste entre abas/reinicializações)
- Session timeout automático após **30 minutos** de inatividade
- Rate limiting no frontend: **5 tentativas / 60 s** por browser (login e cadastro)
- Rate limiting por IP no Edge: **60 req / 60 s** via `middleware.ts`

### Banco de dados
- Row Level Security (RLS) ativo em todas as tabelas
- `review_user()` é `SECURITY DEFINER` — `reviewed_by` definido server-side via `auth.uid()`, impedindo falsificação pelo cliente
- Perfis: cliente só pode alterar `status`, `reviewed_at`, `reviewed_by` — não pode escalar próprio `role`
- CNPJ validado em PL/pgSQL via `fn_cnpj_valido()` (IMMUTABLE) antes de inserção

### Headers HTTP (via `vercel.json`)
- `Content-Security-Policy` — script-src `'self'` apenas, sem `unsafe-inline`
- `Strict-Transport-Security` — HSTS por 2 anos com preload
- `X-Frame-Options: DENY` — previne clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — câmera/microfone/geolocalização restritos

### Build
- `sourcemap: false` em produção — código TypeScript não exposto no DevTools
- `minify: 'terser'` — ofusca variáveis no bundle
- Cache do Service Worker via Workbox: `NetworkFirst` para JS/CSS, `NetworkOnly` para Supabase API

### IndexedDB (dados offline)
- Fotos armazenadas em store separado (`photos`) — não aparecem junto com metadados no DevTools
- `stripPhotos()` remove base64 do rascunho principal antes de persistir

---

## Roles de usuário

| Role | Permissões |
|------|-----------|
| `operacional` | Cria e preenche checklists próprios |
| `supervisor` | Visualiza todos os checklists da empresa |
| `inspector` | Gerencia usuários (aprovar/bloquear) |

Todo novo usuário começa com `status: 'pending'` e precisa ser aprovado por um `inspector` antes de acessar o sistema.

---

## Deploy na Vercel

```bash
# Via Vercel CLI
npm install -g vercel
vercel

# Variáveis de ambiente no painel Vercel:
# Project Settings > Environment Variables
# Adicione: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
# Opcional: VITE_SENTRY_DSN
```

O `vercel.json` já configura os headers de segurança e o rewrite para SPA.

---

## Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (porta 8080)
npm run build        # Build de produção (sem sourcemaps, minificado com terser)
npm run preview      # Preview do build de produção
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
```

---

## Backup

O Supabase realiza backups automáticos diários (plano Free: 7 dias, Pro: 30 dias). Para backups manuais:

```bash
# Via Supabase CLI
npx supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## Licença

Proprietário — HayaH Tech Systems. Todos os direitos reservados.
