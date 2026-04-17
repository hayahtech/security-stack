# Finance Navigator

Plataforma financeira corporativa com análises avançadas em tempo real, validação robusta e infraestrutura de produção pronta.

## Quick Start

### Pré-requisitos

- Node.js 18+ (veja .nvmrc)
- npm 9+ ou pnpm/yarn
- Git
- (Opcional) Docker & Docker Compose

### Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/finance-navigator.git
cd finance-navigator

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase reais

# 3. Instalar dependências
npm install

# 4. Rodar servidor de desenvolvimento
npm run dev
# Acesso em http://localhost:8080
```

### Docker

Produção (multi-stage build otimizado):

```bash
docker build -t finance-navigator:latest .
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
  -e VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx \
  finance-navigator:latest
```

Desenvolvimento (hot reload com docker-compose):

```bash
# Ambiente de produção
docker-compose up app

# Ambiente de desenvolvimento (com hot reload)
docker-compose --profile dev up dev
```

## Documentação

- **Security & Validation** — Input sanitization, CNPJ validation, XSS prevention
- **React Query Integration** — Async state management, caching, hooks patterns
- **Testing Guide** — Unit tests (Vitest), E2E tests (Playwright), coverage
- **CI/CD Pipeline** — GitHub Actions, automated testing, Docker deployment
- **CNPJ Validation** — Suporte a formatos legacy e alfanumérico
- **Pre-Deploy Checklist** — Refinamentos antes de deploy

## Testes

```bash
# Unit tests (Vitest)
npm run test              # Rodar uma vez
npm run test:watch       # Modo watch

# E2E tests (Playwright)
npm run e2e              # Modo headless
npm run e2e:ui           # Interface visual interativa
npm run e2e:debug        # Debug mode com inspetor

# Linting & Type checking
npm run lint              # ESLint
npm run lint -- --fix    # Fix automático
```

### Cobertura de Testes

- Validators: 31 testes
- Security: 20 testes
- CNPJ: 14 testes
- E2E Navigation: 9 testes
- E2E Forms: 5 testes
- E2E Accessibility: 7 testes

Total: 86 testes

## Tech Stack

| Aspecto | Tecnologia |
|---------|-----------|
| Runtime | Node.js 18+ |
| Frontend | React 18, TypeScript 5.8 |
| Build | Vite 8 |
| Styling | Tailwind CSS 3.4, Radix UI |
| State | React Query 5.83, Zustand |
| Database | Supabase (PostgreSQL) |
| Forms | React Hook Form, Zod 3.25 |
| Testing | Vitest, Playwright 1.40 |
| Validation | Custom CNPJ validator |
| Security | Input sanitization, XSS prevention |
| CI/CD | GitHub Actions, Docker |

## Segurança

✓ Strict TypeScript (noImplicitAny: true)
✓ Runtime Validation — Zod schemas
✓ CNPJ Validation — Duplo-formato support
✓ Input Sanitization — XSS prevention
✓ Rate Limiting — Sliding window
✓ Error Boundaries — React error handling
✓ Security Headers — Multiple HTTP headers
✓ Environment Secrets — Never committed

## Variáveis de Ambiente

Obrigatórias:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx

Opcionais (futuro):
VITE_SENTRY_DSN=https://seu-sentry-dsn@sentry.io/project-id
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENVIRONMENT=development

## Desenvolvimento

```bash
# Hot reload com Vite
npm run dev

# Build otimizado para produção
npm run build

# Preview do build local
npm run preview
```

## Deployment

GitHub Actions (Automático):
1. Lint — ESLint + TypeScript type check
2. Unit Tests — Vitest com coverage
3. Build — Vite build (max 5MB)
4. E2E Tests — Playwright
5. Status — Summary check

Vercel (Recomendado):
1. Conectar repositório no Vercel
2. Build command: npm run build
3. Output directory: dist
4. Configurar environment variables
5. Deploy automático

Docker (Auto-hospedagem):
```bash
docker build -t finance-navigator:latest .
docker run -d -p 3000:3000 finance-navigator:latest
```

## Pré-Deploy Checklist

- npm run lint passando
- npm run test passando
- npm run e2e passando
- npm run build passando
- .env.local configurado
- GitHub Secrets configurados
- Preview deploy testado
- Mock data preservado

## Contributing

1. Crie branch: git checkout -b feat/sua-feature
2. Siga o Code Style
3. Escreva testes
4. Push para GitHub
5. Abra Pull Request

## Code Style

- TypeScript: Strict mode (noImplicitAny: true)
- Formatting: Prettier (auto via hook)
- Linting: ESLint (auto via hook)
- No any: Use proper types
- Max line: 100 caracteres
- Tests: 100% cobertura em paths críticos

## License

MIT

---

Última atualização: 2026-04-17
Versão: 1.0.0-beta.1
