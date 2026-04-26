# 🗄️ Estratégia Supabase para Todos os Projetos

**Data**: 2026-04-06
**Projeto Supabase**: `rad`
**Status**: Planejamento

---

## 📊 Mapeamento de Projetos

### 1. ✅ **trato_gestao_rural** (IMPLEMENTADO)
- **Tipo**: React/Vite + Supabase
- **Tabelas**: 88 prefixo `trato_`
- **Status**: ✅ 100% completo
- **Migrations**: 5 aplicadas
- **RLS**: ✅ 100% ativado
- **Features**: Auth, offline-first, E2E tests
- **Prefixo**: `trato_`

### 2. ✅ **bsifra_consolidado** (IMPLEMENTADO)
- **Tipo**: React/Vite + Supabase
- **Tabelas**: 11 prefixo `bsifra_`
- **Status**: ✅ 100% completo
- **Migrations**: 5 aplicadas
- **RLS**: ✅ 100% ativado
- **Features**: Projetos, clients, prompts, scripts, kanban, notas
- **Prefixo**: `bsifra_`

### 3. 🔧 **tsena_consolidado** (PENDENTE)
- **Tipo**: React/Vite (sem Supabase)
- **Stack**: React 19, TypeScript, Vite
- **Dependências**: @tanstack/react-query, UI components
- **Rotas**: Dashboard, Visitantes, Veículos, Blacklist, Entregas, NFe, Balança, Pátio, SST, Sorteio, Refeitório, Cadastros, Relatórios
- **Análise Necessária**: Qual banco de dados usar?
  - **Opção A**: Criar tabelas `tsena_*` no Supabase
  - **Opção B**: Integrar com backend existente

### 4. 🔧 **tsena_recepcao-main** (PENDENTE)
- **Tipo**: React/Vite (sem Supabase)
- **Stack**: Idêntico a tsena_consolidado
- **Rotas**: Idênticas a tsena_consolidado (parece ser duplicado ou branch)
- **Análise Necessária**: Mesmo cenário que tsena_consolidado

### 5. 🔧 **fiodeprata** (PENDENTE)
- **Tipo**: Backend + Frontend (Python + Node)
- **Stack**: Contém `/backend` e `/ai-worker`
- **Status**: Projeto complexo com múltiplas camadas
- **Arquivos**: DEPLOYMENT.md, FRONTEND_INTEGRATION.md, etc.
- **Análise Necessária**: Usar Supabase ou banco backend existente?

---

## 🎯 Próximos Passos

### A. Para tsena_consolidado e tsena_recepcao-main

**Decisão necessária:**
1. Qual a origem dos dados? (simulado, localStorage, backend existente?)
2. Que tabelas são necessárias para persistir?

**Tabelas Propostas** (prefixo `tsena_`):
```
tsena_visitors        — Visitantes
tsena_vehicles        — Veículos
tsena_blacklist       — Blacklist
tsena_deliveries      — Entregas
tsena_nfe_documents   — Documentos NFe
tsena_scales          — Registros de Balança
tsena_yard_records    — Registros de Pátio
tsena_sst_records     — Registros SST
tsena_lottery_records — Registros Sorteio
tsena_refectory_logs  — Logs Refeitório
tsena_masterdata      — Dados Mestres (Cadastros)
tsena_reports         — Relatórios salvos
```

### B. Para fiodeprata

**Decisão necessária:**
1. Migrando de backend Python para Supabase?
2. Mantendo backend e integrando Supabase?

**Tabelas Propostas** (prefixo `fiodeprata_`):
```
fiodeprata_users
fiodeprata_projects
fiodeprata_tasks
fiodeprata_ai_jobs
fiodeprata_workflows
... (após análise completa)
```

---

## 📋 Checklist de Ação

- [ ] Analisar tsena_consolidado - definir escopo DB
- [ ] Analisar tsena_recepcao-main - confirmar se duplicado
- [ ] Analisar fiodeprata - backend ou Supabase?
- [ ] Criar migrations para tsena_* (se Supabase)
- [ ] Criar migrations para fiodeprata_* (se Supabase)
- [ ] Implementar auth/RLS em todos os projetos
- [ ] Testar integração E2E

---

## 🔐 Regra de Nomenclatura

**Padrão confirmado**:
- `trato_*` — Trato (Rural)
- `bsifra_*` — BSIFRA (Consolidação)
- `tsena_*` — TSENA (Receção/Consolidação)
- `fiodeprata_*` — Fio de Prata (Workflow)
- Todas com RLS: `WHERE user_id = auth.uid()`

---

**Aguardando decisões do usuário para os próximos passos!**
