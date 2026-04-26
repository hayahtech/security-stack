# 📊 Categoria B: Análise de Tabelas Necessárias

---

## 1. **Rahmem-CRM-main** → Prefixo: `rahmemcrm_`

**Tabelas Identificadas** (do código):
- `customers` (Clientes/Pessoas)
  - name, email, company, segment, status, created_at, updated_at
  - Segments: Tecnologia, SaaS, Varejo, Construção, Saúde
  - Status: active, inactive, prospect
- `interactions` (Interações/Atividades)
  - customer_id, type, description, date
- `deals` (Negócios/Oportunidades)
  - customer_id, title, value, status

**Total: 3 tabelas**

---

## 2. **finance-navigator-main** → Prefixo: `financenavigator_`

**Tabelas Identificadas** (do código):
- `receivables` (Contas a Receber)
  - amount, due_date, status, description
  - Status: on_time, due_today, overdue_1_30, overdue_31_60, overdue_60_plus
- `payables` (Contas a Pagar)
  - amount, due_date, status, description
- `accounts` (Contas Financeiras)
  - name, type, balance, status
- `financial_agenda` (Agenda/Timeline)
  - date, event, amount

**Total: 4 tabelas**

---

## 3. **kepha-gestao-de-estoque-main** → Prefixo: `kepha_`

**Tabelas Identificadas** (do código):
- `skus` (Produtos/SKU)
  - name, category, status, price, quantity
  - Status: active, discontinued, low_stock
  - Categories: Eletrônicos, Vestuário, Casa, Alimentos, Industrial
- `categories` (Categorias)
  - name, description
- `movements` (Movimentações de Estoque)
  - sku_id, type, quantity, date
- `stock_levels` (Níveis de Estoque)
  - sku_id, quantity, min_quantity, max_quantity

**Total: 4 tabelas**

---

## 4. **kevar-departamento-pessoal-main** → Prefixo: `kevar_`

**Tabelas Identificadas** (estrutura HR/Payroll):
- `employees` (Funcionários)
  - name, cpf, email, role, department, salary, admission_date
- `payrolls` (Folhas de Pagamento)
  - employee_id, month, gross_salary, deductions, net_salary
- `vacation_records` (Férias)
  - employee_id, start_date, end_date, days
- `attendance` (Assiduidade)
  - employee_id, date, status, hours
- `documents` (Documentos/Requisitos)
  - employee_id, type, file_path, upload_date

**Total: 5 tabelas**

---

## 5. **scan-trust-main** → Prefixo: `scantrust_`

**Páginas mínimas** (apenas Index + NotFound)
**Presumido**: Projeto em estágio inicial

**Estimado: ~2-3 tabelas base**

Sugiro começar com:
- `scans` (Registros de Scan)
- `results` (Resultados)
- `audit_logs` (Logs de Auditoria)

**Total: 3 tabelas (estimado)**

---

## 🎯 Resumo

| Projeto | Tabelas | Prefixo | Prioridade |
|---------|---------|---------|-----------|
| Rahmem-CRM | 3 | `rahmemcrm_` | 🔴 Alta |
| Finance Navigator | 4 | `financenavigator_` | 🔴 Alta |
| Kepha Estoque | 4 | `kepha_` | 🔴 Alta |
| Kevar HR | 5 | `kevar_` | 🔴 Alta |
| Scan Trust | 3 | `scantrust_` | 🟡 Média |
| **TOTAL** | **19 tabelas** | - | - |

---

**Próximo passo**: Criar as 19 migrations para Categoria B
