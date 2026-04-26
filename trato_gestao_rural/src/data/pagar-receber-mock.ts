import { Payable, InstallmentPlan, RecurringRule } from "./types";

export const mockPayables: Payable[] = [
  // A PAGAR
  { id: "pay-1", type: "pagar", due_date: "2026-03-08", description: "Energia elétrica — Fazenda Boa Vista", person_id: "p-6", category_id: "cat-8", amount: 1520, status: "pendente" },
  { id: "pay-2", type: "pagar", due_date: "2026-03-05", description: "Funrural — competência fevereiro", person_id: "p-5", category_id: "cat-7", amount: 2400, status: "vencido" },
  { id: "pay-3", type: "pagar", due_date: "2026-03-10", description: "Ração — Nutrifarm 8 ton", person_id: "p-3", category_id: "cat-3", amount: 10200, installment_label: "3/6", status: "pendente" },
  { id: "pay-4", type: "pagar", due_date: "2026-03-15", description: "Sal mineral — 500kg", person_id: "p-5", category_id: "cat-3", amount: 2100, status: "pendente" },
  { id: "pay-5", type: "pagar", due_date: "2026-03-20", description: "Salários — Março", person_id: "p-1", category_id: "cat-6", amount: 15000, status: "pendente" },
  { id: "pay-6", type: "pagar", due_date: "2026-03-12", description: "Combustível — diesel", person_id: "p-6", category_id: "cat-8", amount: 4500, status: "pendente" },
  { id: "pay-7", type: "pagar", due_date: "2026-02-28", description: "Manutenção de cercas", person_id: "p-5", category_id: "cat-5", amount: 1800, status: "vencido" },
  { id: "pay-8", type: "pagar", due_date: "2026-02-20", description: "Veterinário — consulta", person_id: "p-4", category_id: "cat-4", amount: 850, status: "pago", paid_date: "2026-02-20", paid_instrument_id: "pi-1" },
  { id: "pay-9", type: "pagar", due_date: "2026-03-25", description: "Seguro do trator", person_id: "p-5", category_id: "cat-5", amount: 3200, status: "pendente" },
  { id: "pay-10", type: "pagar", due_date: "2026-03-30", description: "Telefone / Internet", person_id: "p-6", category_id: "cat-8", amount: 380, status: "pendente" },

  // A RECEBER
  { id: "rec-1", type: "receber", due_date: "2026-03-10", description: "Venda de 10 bezerros — Lote #145", person_id: "p-1", category_id: "cat-1", amount: 30000, status: "pendente" },
  { id: "rec-2", type: "receber", due_date: "2026-03-05", description: "Leite — quinzena 1/mar", person_id: "p-2", category_id: "cat-2", amount: 8500, status: "vencido" },
  { id: "rec-3", type: "receber", due_date: "2026-03-15", description: "Aluguel de pasto — março", person_id: "p-1", category_id: "cat-9", amount: 3000, status: "pendente" },
  { id: "rec-4", type: "receber", due_date: "2026-03-20", description: "Leite — quinzena 2/mar", person_id: "p-2", category_id: "cat-2", amount: 8200, status: "pendente" },
  { id: "rec-5", type: "receber", due_date: "2026-03-25", description: "Venda de 5 novilhos", person_id: "p-1", category_id: "cat-1", amount: 22000, installment_label: "2/3", status: "pendente" },
  { id: "rec-6", type: "receber", due_date: "2026-02-28", description: "Serviço de inseminação", person_id: "p-4", category_id: "cat-9", amount: 4500, status: "pago", paid_date: "2026-03-01", paid_instrument_id: "pi-1" },
  { id: "rec-7", type: "receber", due_date: "2026-03-08", description: "Venda de feno excedente", person_id: "p-5", category_id: "cat-9", amount: 2800, status: "pendente" },
  { id: "rec-8", type: "receber", due_date: "2026-04-05", description: "Venda de 20 bezerros desmamados", person_id: "p-1", category_id: "cat-1", amount: 52000, installment_label: "1/3", status: "pendente" },
];

export const mockInstallmentPlans: InstallmentPlan[] = [
  { id: "ip-1", description: "Financiamento Trator John Deere", total: 180000, num_installments: 36, paid_count: 12, next_due: "2026-03-15", type: "pagar" },
  { id: "ip-2", description: "Compra de ração — contrato anual Nutrifarm", total: 61200, num_installments: 6, paid_count: 2, next_due: "2026-03-10", type: "pagar" },
  { id: "ip-3", description: "Venda de 60 novilhos — Fazenda Esperança", total: 66000, num_installments: 3, paid_count: 1, next_due: "2026-03-25", type: "receber" },
  { id: "ip-4", description: "Reforma do curral — Empreiteira Rural", total: 45000, num_installments: 5, paid_count: 3, next_due: "2026-04-01", type: "pagar" },
];

export const mockRecurringRules: RecurringRule[] = [
  { id: "rr-1", description: "Salários — Folha de Pagamento", amount: 15000, frequency: "mensal", next_date: "2026-03-20", category_id: "cat-6", person_id: "p-1", type: "pagar", active: true },
  { id: "rr-2", description: "Energia elétrica — CEMIG", amount: 1500, frequency: "mensal", next_date: "2026-04-08", category_id: "cat-8", person_id: "p-6", type: "pagar", active: true },
  { id: "rr-3", description: "Combustível — diesel mensal", amount: 4500, frequency: "mensal", next_date: "2026-04-10", category_id: "cat-8", person_id: "p-6", type: "pagar", active: true },
  { id: "rr-4", description: "Recebimento de leite — quinzenal", amount: 8200, frequency: "quinzenal", next_date: "2026-03-15", category_id: "cat-2", person_id: "p-2", type: "receber", active: true },
  { id: "rr-5", description: "Aluguel de pasto — mensal", amount: 3000, frequency: "mensal", next_date: "2026-04-01", category_id: "cat-9", person_id: "p-1", type: "receber", active: true },
  { id: "rr-6", description: "Manutenção preventiva trator", amount: 980, frequency: "trimestral", next_date: "2026-05-02", category_id: "cat-5", person_id: "p-5", type: "pagar", active: false },
];
