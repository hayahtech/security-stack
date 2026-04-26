// Mock data for visual preview when database is empty

export const mockCustomers = [
  { id: "c1", name: "TechNova Soluções", email: "contato@technova.com.br", phone: "(11) 3456-7890", document: "12.345.678/0001-90", type: "customer", status: "active", notes: "Cliente enterprise", created_at: "2025-11-15T10:00:00Z" },
  { id: "c2", name: "Grupo Meridian", email: "comercial@meridian.com.br", phone: "(21) 2345-6789", document: "98.765.432/0001-10", type: "customer", status: "active", notes: "", created_at: "2025-12-01T14:00:00Z" },
  { id: "c3", name: "StartUp Flow", email: "hello@startupflow.io", phone: "(11) 91234-5678", document: "11.222.333/0001-44", type: "lead", status: "active", notes: "Interessado no plano Pro", created_at: "2026-01-10T09:00:00Z" },
  { id: "c4", name: "Construtora Horizonte", email: "projetos@horizonte.com.br", phone: "(31) 3456-1234", document: "44.555.666/0001-77", type: "partner", status: "active", notes: "Parceiro de integração", created_at: "2026-02-05T11:00:00Z" },
  { id: "c5", name: "Farmácia Vida+", email: "adm@vidamais.com.br", phone: "(41) 3987-6543", document: "77.888.999/0001-00", type: "lead", status: "active", notes: "", created_at: "2026-03-20T16:00:00Z" },
  { id: "c6", name: "Logística Express", email: "ops@logexpress.com.br", phone: "(51) 3222-4455", document: "33.444.555/0001-88", type: "customer", status: "active", notes: "Contrato anual", created_at: "2026-03-28T08:00:00Z" },
];

export const mockContacts = [
  { id: "ct1", name: "Ana Paula Silva", email: "ana.silva@technova.com.br", phone: "(11) 91234-0001", role: "Diretora Comercial", is_primary: true, customer_id: "c1", customers: { name: "TechNova Soluções" }, created_at: "2025-11-15T10:00:00Z" },
  { id: "ct2", name: "Ricardo Mendes", email: "ricardo@meridian.com.br", phone: "(21) 98765-4321", role: "CTO", is_primary: true, customer_id: "c2", customers: { name: "Grupo Meridian" }, created_at: "2025-12-01T14:00:00Z" },
  { id: "ct3", name: "Camila Torres", email: "camila@startupflow.io", phone: "(11) 97654-3210", role: "CEO", is_primary: true, customer_id: "c3", customers: { name: "StartUp Flow" }, created_at: "2026-01-10T09:00:00Z" },
  { id: "ct4", name: "João Ferreira", email: "joao@technova.com.br", phone: "(11) 91234-0002", role: "Gerente de TI", is_primary: false, customer_id: "c1", customers: { name: "TechNova Soluções" }, created_at: "2026-01-20T11:00:00Z" },
  { id: "ct5", name: "Marina Costa", email: "marina@horizonte.com.br", phone: "(31) 99876-5432", role: "Diretora de Projetos", is_primary: true, customer_id: "c4", customers: { name: "Construtora Horizonte" }, created_at: "2026-02-10T15:00:00Z" },
];

export const mockOpportunities = [
  { id: "o1", title: "Implantação ERP Completo", customer_id: "c1", customers: { name: "TechNova Soluções" }, contacts: { name: "Ana Paula Silva" }, value: 185000, stage: "negotiation", probability: 75, expected_close_date: "2026-05-15", notes: "", created_at: "2026-01-15T10:00:00Z" },
  { id: "o2", title: "Módulo Financeiro", customer_id: "c2", customers: { name: "Grupo Meridian" }, contacts: { name: "Ricardo Mendes" }, value: 45000, stage: "proposal", probability: 60, expected_close_date: "2026-04-30", notes: "", created_at: "2026-02-01T14:00:00Z" },
  { id: "o3", title: "CRM + Automação", customer_id: "c3", customers: { name: "StartUp Flow" }, contacts: { name: "Camila Torres" }, value: 32000, stage: "qualification", probability: 40, expected_close_date: "2026-06-01", notes: "", created_at: "2026-02-20T09:00:00Z" },
  { id: "o4", title: "Consultoria de Processos", customer_id: "c4", customers: { name: "Construtora Horizonte" }, contacts: { name: "Marina Costa" }, value: 28000, stage: "closed_won", probability: 100, expected_close_date: "2026-03-10", notes: "Fechado!", created_at: "2026-03-01T11:00:00Z" },
  { id: "o5", title: "Licenciamento Anual", customer_id: "c6", customers: { name: "Logística Express" }, contacts: null, value: 96000, stage: "lead", probability: 20, expected_close_date: "2026-07-01", notes: "", created_at: "2026-03-28T08:00:00Z" },
  { id: "o6", title: "Migração de Dados", customer_id: "c1", customers: { name: "TechNova Soluções" }, contacts: { name: "João Ferreira" }, value: 15000, stage: "closed_lost", probability: 0, expected_close_date: "2026-03-01", notes: "Optaram por solução interna", created_at: "2026-02-10T16:00:00Z" },
];

export const mockUsers = [
  { id: "u1", name: "Carlos Eduardo", email: "carlos@empresa.com.br", status: "active", created_at: "2025-10-01T08:00:00Z", user_roles: [{ role_id: "r1", roles: { name: "admin" } }] },
  { id: "u2", name: "Fernanda Lima", email: "fernanda@empresa.com.br", status: "active", created_at: "2025-11-15T09:00:00Z", user_roles: [{ role_id: "r2", roles: { name: "gerente" } }] },
  { id: "u3", name: "Rafael Santos", email: "rafael@empresa.com.br", status: "active", created_at: "2026-01-10T10:00:00Z", user_roles: [{ role_id: "r3", roles: { name: "vendedor" } }] },
  { id: "u4", name: "Juliana Oliveira", email: "juliana@empresa.com.br", status: "active", created_at: "2026-02-05T11:00:00Z", user_roles: [{ role_id: "r3", roles: { name: "vendedor" } }, { role_id: "r4", roles: { name: "financeiro" } }] },
  { id: "u5", name: "Diego Martins", email: "diego@empresa.com.br", status: "inactive", created_at: "2025-09-01T14:00:00Z", user_roles: [{ role_id: "r3", roles: { name: "vendedor" } }] },
];

export const mockAuditLogs = [
  { id: "l1", action: "LOGIN" as const, entity: "auth", entity_id: null, metadata: { ip: "189.44.12.33" }, created_at: "2026-04-04T08:15:00Z", user_id: "u1", profiles: { name: "Carlos Eduardo", email: "carlos@empresa.com.br" } },
  { id: "l2", action: "CREATE" as const, entity: "customers", entity_id: "c6", metadata: { name: "Logística Express" }, created_at: "2026-04-03T16:42:00Z", user_id: "u2", profiles: { name: "Fernanda Lima", email: "fernanda@empresa.com.br" } },
  { id: "l3", action: "UPDATE" as const, entity: "opportunities", entity_id: "o1", metadata: { field: "stage", from: "proposal", to: "negotiation" }, created_at: "2026-04-03T14:20:00Z", user_id: "u3", profiles: { name: "Rafael Santos", email: "rafael@empresa.com.br" } },
  { id: "l4", action: "CREATE" as const, entity: "contacts", entity_id: "ct5", metadata: { name: "Marina Costa" }, created_at: "2026-04-02T11:05:00Z", user_id: "u2", profiles: { name: "Fernanda Lima", email: "fernanda@empresa.com.br" } },
  { id: "l5", action: "DELETE" as const, entity: "contacts", entity_id: "ct99", metadata: { name: "Contato removido" }, created_at: "2026-04-02T09:30:00Z", user_id: "u1", profiles: { name: "Carlos Eduardo", email: "carlos@empresa.com.br" } },
  { id: "l6", action: "UPDATE" as const, entity: "customers", entity_id: "c2", metadata: { field: "phone", old: "(21) 0000-0000", new: "(21) 2345-6789" }, created_at: "2026-04-01T17:00:00Z", user_id: "u4", profiles: { name: "Juliana Oliveira", email: "juliana@empresa.com.br" } },
  { id: "l7", action: "LOGIN" as const, entity: "auth", entity_id: null, metadata: { ip: "200.155.32.11" }, created_at: "2026-04-01T08:00:00Z", user_id: "u3", profiles: { name: "Rafael Santos", email: "rafael@empresa.com.br" } },
  { id: "l8", action: "ACCESS" as const, entity: "reports", entity_id: null, metadata: { page: "dashboard" }, created_at: "2026-03-31T15:45:00Z", user_id: "u1", profiles: { name: "Carlos Eduardo", email: "carlos@empresa.com.br" } },
  { id: "l9", action: "LOGOUT" as const, entity: "auth", entity_id: null, metadata: null, created_at: "2026-03-31T12:00:00Z", user_id: "u2", profiles: { name: "Fernanda Lima", email: "fernanda@empresa.com.br" } },
  { id: "l10", action: "CREATE" as const, entity: "opportunities", entity_id: "o5", metadata: { title: "Licenciamento Anual" }, created_at: "2026-03-30T10:30:00Z", user_id: "u3", profiles: { name: "Rafael Santos", email: "rafael@empresa.com.br" } },
];
