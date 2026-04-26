# 📊 Categoria A: Análise de Tabelas Necessárias

---

## 1. **CoreFoundation-main** → Prefixo: `corefoundation_`

**Tabelas Identificadas** (do código):
- `customers` (leads, clients, partners)
  - name, email, phone, document, type, notes, tenant_id
- `contacts` (mencionado em páginas)
- `companies`
- `opportunities` (vendas/oportunidades)
- `roles` (perfis/funções)
- `audit_logs` (logs de auditoria)
- `users` (com tenant_id, roles)

**Total: ~7 tabelas**

---

## 2. **checkpoint-flow-main** → Prefixo: `checkpoint_`

**Tabelas Identificadas** (do código):
- `profiles` (com role, status, full_name, email)
  - Roles: operacional, supervisor, inspector
  - Status: pending, active, blocked
- `users` (base)

**Total: ~2 tabelas base** (precisa expandir análise)

---

## 3. **free-today-access-main** → Prefixo: `freetodayaccess_`

**Tabelas Identificadas** (do código):
- `customers`
  - name, phone, birth_date, notes, active
  - family_group_id (relacionamento)
  - address: street, number, complement, neighborhood, city, zipcode
  - stats: totalOrders, totalSpent, lastSale
- `family_groups` (agrupamento de clientes)
- `orders` (histórico de pedidos)

**Total: ~3 tabelas**

---

## 4. **scoring-classifica-todos-main** → Prefixo: `scoring_`

**Páginas encontradas**: 50+ páginas (grande escopo)
- Dashboard, Balance Sheet, Bills, Budgets, CMV
- Cash Register, Cost Center, Customer Loyalty
- Delivery, Employees, etc.

**Presumido**: Sistema financeiro/ERP com múltiplas tabelas
**Estimado: ~20-30 tabelas**

**Precisa análise detalhada**

---

## 5. **ancestral-nexus-main** → Prefixo: `ancestralnexus_`

**Precisa análise profunda** (poucas páginas encontradas)

---

## 🎯 Estratégia

### **Tabelas Imediatas** (alta confiança):
1. **corefoundation_customers**
2. **corefoundation_companies**
3. **corefoundation_contacts**
4. **corefoundation_opportunities**
5. **corefoundation_roles**
6. **corefoundation_audit_logs**
7. **checkpoint_profiles**
8. **freetodayaccess_customers**
9. **freetodayaccess_family_groups**
10. **freetodayaccess_orders**

### **Tabelas Que Precisam Análise Profunda**:
- scoring_classifica_todos (muitas páginas, precisa ler cada uma)
- ancestral_nexus (desconhecido)

---

**Próximo passo**: Começar criando as 10 tabelas de alta confiança

