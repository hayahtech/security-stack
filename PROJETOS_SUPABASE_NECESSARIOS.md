# 📊 Projetos que Precisam de Supabase

**Data**: 2026-04-06
**Projeto Supabase Central**: `rad`

---

## ✅ JÁ IMPLEMENTADOS (111 tabelas)

| Projeto | Tabelas | Status |
|---------|---------|--------|
| trato_gestao_rural | 88 | ✅ Pronto |
| bsifra_consolidado | 11 | ✅ Pronto |
| tsena_consolidado | 12 | ✅ Pronto |

---

## 🔧 PROJETOS EM .ZIP (Não extraídos)

### **Categoria A: Já têm Supabase Client (precisam de migrations)**

Esses projetos já têm `src/integrations/supabase/client.ts`, então só faltam as **migrations**:

1. **CoreFundation-main** 🔧
   - Tipo: React/Vite + Supabase
   - Prefixo: `corefoundation_` (sugerido)
   - Tamanho: 316 KB
   - Ação: Analisar schema, criar migrations

2. **checkpoint-flow-main** 🔧
   - Tipo: React/Vite + Supabase
   - Prefixo: `checkpoint_` (sugerido)
   - Tamanho: 408 KB
   - Ação: Analisar schema, criar migrations

3. **free-today-access-main** 🔧
   - Tipo: React/Vite + Supabase
   - Prefixo: `freetodayaccess_` (sugerido)
   - Tamanho: 1.4 MB
   - Ação: Analisar schema, criar migrations

4. **scoring-classifica-todos-main** 🔧
   - Tipo: React/Vite + Supabase
   - Prefixo: `scoring_` (sugerido)
   - Tamanho: 301 KB
   - Ação: Analisar schema, criar migrations

### **Categoria B: Têm Supabase Client (ancestral-nexus)**

5. **ancestral-nexus-main** 🔧
   - Tipo: React/Vite + Supabase
   - Cliente: `src/lib/supabaseClient.ts`
   - Prefixo: `ancestralnexus_` (sugerido)
   - Tamanho: 305 KB
   - Ação: Analisar schema, criar migrations

### **Categoria C: Sem Supabase (precisam integração completa)**

Esses projetos NÃO têm Supabase, precisam de **integração + migrations**:

6. **Rahmem-CRM-main** ❌ Sem Supabase
   - Tipo: React/Vite
   - Prefixo: `rahmemcrm_` (sugerido)
   - Tamanho: 324 KB
   - Ação: Extrair, analisar, integrar Supabase, criar migrations

7. **deuboa-api-main** ❌ Sem Supabase (Backend Python + Frontend)
   - Tipo: Python backend + Node frontend
   - Prefixo: `deuboa_` (sugerido)
   - Tamanho: 1.2 MB
   - Ação: Análise backend Python, decidir estratégia

8. **finance-navigator-main** ❌ Sem Supabase
   - Tipo: React/Vite
   - Prefixo: `financenavigator_` (sugerido)
   - Tamanho: 509 KB
   - Ação: Extrair, analisar, integrar Supabase, criar migrations

9. **kepha-gestao-de-estoque-main** ❌ Sem Supabase
   - Tipo: React/Vite
   - Prefixo: `kepha_` (sugerido)
   - Tamanho: 551 KB
   - Ação: Extrair, analisar, integrar Supabase, criar migrations

10. **kevar-departamento-pessoal-main** ❌ Sem Supabase
    - Tipo: React/Vite
    - Prefixo: `kevar_` (sugerido)
    - Tamanho: 937 KB
    - Ação: Extrair, analisar, integrar Supabase, criar migrations

11. **scan-trust-main** ❌ Sem Supabase
    - Tipo: React/Vite
    - Prefixo: `scantrust_` (sugerido)
    - Tamanho: 266 KB
    - Ação: Extrair, analisar, integrar Supabase, criar migrations

### **Categoria D: Backend Python (requer análise especial)**

12. **expense-bot-main** 🐍
    - Tipo: Python Bot
    - Prefixo: `expensebot_` (sugerido)
    - Tamanho: 4.6 KB
    - Ação: Analisar backend Python, decidir estratégia

13. **cronometro-main** (pulse-main)
    - Tipo: Unknown (precisa extrair)
    - Prefixo: `cronometro_` ou `pulse_` (sugerido)
    - Tamanho: 281 KB
    - Ação: Extrair, analisar, definir escopo

---

## 📋 Resumo por Esforço

### **Baixo Esforço** (Já têm Supabase Client - só faltam migrations)
- CoreFundation-main
- checkpoint-flow-main
- free-today-access-main
- scoring-classifica-todos-main
- ancestral-nexus-main
**Total: 5 projetos**

### **Médio Esforço** (Sem Supabase - precisam integração + migrations)
- Rahmem-CRM-main
- finance-navigator-main
- kepha-gestao-de-estoque-main
- kevar-departamento-pessoal-main
- scan-trust-main
**Total: 5 projetos**

### **Alto Esforço** (Backend Python ou desconhecido)
- deuboa-api-main
- expense-bot-main
- cronometro-main
**Total: 3 projetos**

---

## 🎯 Recomendação

### **Prioridade 1: Baixo Esforço** (Esta semana)
Extrair e analisar os 5 projetos com Supabase Client já integrado, criar migrations

### **Prioridade 2: Médio Esforço** (Próxima semana)
Extrair, integrar Supabase (adicionar client.ts), criar migrations

### **Prioridade 3: Alto Esforço** (Depois)
Decidir estratégia para backends Python (deuboa-api-main, expense-bot-main)

---

## 📊 Projeção Final (Se todos implementados)

```
Categoria A (5 projetos): ~50 tabelas
Categoria B (5 projetos): ~50 tabelas
Categoria C (3 projetos): ~30 tabelas
────────────────────────────
Projeto `rad`: ~240 tabelas totais
```

---

**Qual categoria você quer que eu comece?**
- A (Baixo esforço - Supabase client já existe)
- B (Médio esforço - Sem Supabase)
- C (Alto esforço - Backend Python)
