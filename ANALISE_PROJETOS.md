# 📋 Análise Detalhada de Todos os Projetos

**Data**: 2026-04-06
**Objetivo**: Estabelecer Supabase como banco de dados central para todos projetos

---

## 🎯 Resumo Executivo

| Projeto | Status | Tipo | Tabelas Necessárias | Ação |
|---------|--------|------|---------------------|------|
| **trato_gestao_rural** | ✅ COMPLETO | React/Vite | 88 (trato_*) | Funcionando |
| **bsifra_consolidado** | ✅ COMPLETO | React/Vite | 11 (bsifra_*) | Funcionando |
| **tsena_consolidado** | 🔧 PENDENTE | React/Vite | 12 (tsena_*) | Criar migrations |
| **tsena_recepcao-main** | 🔧 PENDENTE | React/Vite | 12 (tsena_*) | Criar migrations |
| **fiodeprata** | 🔧 PENDENTE | Python/Node | ~30 (fiodeprata_*) | Análise profunda |

---

## 📝 TSENA: Estrutura de Dados Identificada

### Dados Encontrados em VisitorsPage.tsx:

```typescript
type Visitor = {
  id: string;
  name: string;
  cpf: string;
  company: string;
  host: string;
  reason: string;
  status: 'pre_agendado' | 'aguardando' | 'dentro' | 'saiu';
  checkIn: string | null;
  badge: string | null;
}
```

### Dados Encontrados em VehiclesPage.tsx:

```typescript
type Vehicle = {
  id: string;
  plate: string;
  model: string;
  color: string;
  driver: string;
  entry: string;
  exit: string | null;
  spot: string;
}
```

### Estrutura de Banco de Dados Proposta (prefixo `tsena_`):

#### 1. **tsena_visitors** (Visitantes)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
name TEXT NOT NULL
cpf TEXT NOT NULL
company TEXT
host TEXT
reason TEXT
status TEXT ('pre_agendado', 'aguardando', 'dentro', 'saiu')
check_in TIMESTAMPTZ
badge_number TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 2. **tsena_vehicles** (Veículos)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
plate TEXT NOT NULL UNIQUE
model TEXT
color TEXT
driver TEXT
entry_time TIMESTAMPTZ NOT NULL
exit_time TIMESTAMPTZ
parking_spot TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 3. **tsena_blacklist** (Blacklist)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
cpf TEXT NOT NULL
name TEXT
reason TEXT
added_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 4. **tsena_deliveries** (Entregas)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
tracking_number TEXT
company TEXT
sender TEXT
receiver TEXT
status TEXT
entry_time TIMESTAMPTZ
exit_time TIMESTAMPTZ
notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 5. **tsena_nfe_documents** (Documentos NFe)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
nfe_number TEXT NOT NULL UNIQUE
issuer TEXT
recipient TEXT
value NUMERIC
issue_date DATE
received_at TIMESTAMPTZ
status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 6. **tsena_scales** (Balança)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
vehicle_id UUID (FK tsena_vehicles)
weight_kg NUMERIC NOT NULL
measurement_time TIMESTAMPTZ NOT NULL
operator TEXT
notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 7. **tsena_yard_records** (Registros Pátio)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
vehicle_id UUID (FK tsena_vehicles)
location TEXT
status TEXT
recorded_at TIMESTAMPTZ NOT NULL
notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 8. **tsena_sst_records** (Registros SST)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
description TEXT
status TEXT
risk_level TEXT ('baixo', 'médio', 'alto')
recorded_at TIMESTAMPTZ NOT NULL
notes TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 9. **tsena_lottery_records** (Registros Sorteio)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
participant_name TEXT
participant_cpf TEXT
draw_date TIMESTAMPTZ
prize TEXT
status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 10. **tsena_refectory_logs** (Logs Refeitório)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
person_name TEXT
meal_type TEXT ('café', 'almoço', 'lanche', 'jantar')
meal_date DATE NOT NULL
time TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 11. **tsena_masterdata** (Dados Mestres/Cadastros)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
entity_type TEXT ('host', 'department', 'supplier')
name TEXT NOT NULL
description TEXT
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 12. **tsena_reports** (Relatórios)
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
title TEXT NOT NULL
description TEXT
report_type TEXT
generated_at TIMESTAMPTZ
data JSONB
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

## 🔧 FIODEPRATA: Análise Necessária

### Estrutura Encontrada:
- `/backend` — Backend Python (FastAPI/Django?)
- `/ai-worker` — Worker de IA
- `/frontend` — Frontend Node/React

### Próximos Passos:
1. Analisar `/backend/models` para entender schema
2. Verificar se há `requirements.txt` ou `pyproject.toml`
3. Decidir: Supabase + Backend coexistem ou migração?
4. Mapeamento de tabelas fiodeprata_*

---

## 📊 Tabelas por Projeto (Total: 99+ tabelas)

```
trato_gestao_rural:    88 tabelas (✅ completo)
bsifra_consolidado:    11 tabelas (✅ completo)
tsena_*:               12 tabelas (🔧 planejado)
fiodeprata_*:          ~30 tabelas (🔧 por analisar)
────────────────────────────────
TOTAL:                 ~141 tabelas
```

---

## 🚀 Plano de Ação

### Fase 1: TSENA (Esta semana)
- [ ] Criar 5 migrations para tsena_*
- [ ] Aplicar ao Supabase projeto `rad`
- [ ] Integrar em tsena_consolidado
- [ ] Integrar em tsena_recepcao-main
- [ ] Testes E2E para ambos

### Fase 2: FIODEPRATA (Próxima)
- [ ] Análise profunda do /backend
- [ ] Mapeamento de tabelas
- [ ] Criar migrations fiodeprata_*
- [ ] Decidir estratégia (Supabase + Backend ou migração)

---

**Status**: Aguardando aprovação para Fase 1 (TSENA)
