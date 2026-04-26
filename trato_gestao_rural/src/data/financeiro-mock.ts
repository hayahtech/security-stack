import { Transaction, PaymentInstrument, Category, CostCenter, Person, CardStatement } from "./types";

export const paymentInstruments: PaymentInstrument[] = [
  { id: "pi-1", name: "Conta Corrente Sicoob", type: "conta_corrente", bank: "Sicoob", balance: 87450, active: true, holder_person_id: "p-1" },
  { id: "pi-2", name: "Conta Poupança Sicoob", type: "poupanca", bank: "Sicoob", balance: 62000, active: true, holder_person_id: "p-1" },
  { id: "pi-3", name: "Cartão Visa Empresarial", type: "cartao_credito", bank: "Sicoob", last4: "4521", balance: -4200, credit_limit: 25000, closing_day: 20, due_day: 28, active: true, holder_person_id: "p-1" },
  { id: "pi-4", name: "Cartão Mastercard Pessoal", type: "cartao_credito", bank: "Nubank", last4: "8832", balance: -1850, credit_limit: 15000, closing_day: 5, due_day: 12, active: true, holder_person_id: "p-1" },
  { id: "pi-5", name: "Caixa — Fazenda", type: "caixa", balance: 38000, active: true },
];

export const cardStatements: CardStatement[] = [
  { id: "cs-1", instrument_id: "pi-3", month: "Mar/2026", closing_date: "2026-03-20", due_date: "2026-03-28", total: 4200, status: "aberta" },
  { id: "cs-2", instrument_id: "pi-3", month: "Fev/2026", closing_date: "2026-02-20", due_date: "2026-02-28", total: 6800, status: "paga" },
  { id: "cs-3", instrument_id: "pi-3", month: "Jan/2026", closing_date: "2026-01-20", due_date: "2026-01-28", total: 5300, status: "paga" },
  { id: "cs-4", instrument_id: "pi-4", month: "Mar/2026", closing_date: "2026-03-05", due_date: "2026-03-12", total: 1850, status: "fechada" },
  { id: "cs-5", instrument_id: "pi-4", month: "Fev/2026", closing_date: "2026-02-05", due_date: "2026-02-12", total: 2100, status: "paga" },
  { id: "cs-6", instrument_id: "pi-4", month: "Jan/2026", closing_date: "2026-01-05", due_date: "2026-01-12", total: 1750, status: "paga" },
];

export const categories: Category[] = [
  { id: "cat-1", name: "Venda de Animais", subcategories: ["Bezerros", "Novilhos", "Vacas de Descarte"] },
  { id: "cat-2", name: "Venda de Leite", subcategories: ["Laticínio", "Venda Direta"] },
  { id: "cat-3", name: "Alimentação Animal", subcategories: ["Ração", "Sal Mineral", "Silagem", "Feno"] },
  { id: "cat-4", name: "Veterinário", subcategories: ["Vacinas", "Medicamentos", "Consultas"] },
  { id: "cat-5", name: "Manutenção", subcategories: ["Cercas", "Pastagem", "Equipamentos", "Veículos"] },
  { id: "cat-6", name: "Mão de Obra", subcategories: ["Salários", "Encargos", "Diaristas"] },
  { id: "cat-7", name: "Impostos", subcategories: ["ITR", "ICMS", "IRPJ", "Funrural"] },
  { id: "cat-8", name: "Outros Custos", subcategories: ["Combustível", "Energia", "Água", "Telefone"] },
  { id: "cat-9", name: "Receitas Diversas", subcategories: ["Aluguel de Pasto", "Serviços", "Outros"] },
];

export const costCenters: CostCenter[] = [
  { id: "cc-1", name: "Fazenda Boa Vista" },
  { id: "cc-2", name: "Fazenda Santa Maria" },
  { id: "cc-3", name: "Sede / Administrativo" },
  { id: "cc-4", name: "Confinamento" },
];

export const people: Person[] = [
  { id: "p-1", name: "João Silva (Comprador)" },
  { id: "p-2", name: "Laticínio São José" },
  { id: "p-3", name: "Nutrifarm Rações" },
  { id: "p-4", name: "Vet. Dr. Carlos" },
  { id: "p-5", name: "Cooperativa Agro Sul" },
  { id: "p-6", name: "Posto Fazendeiro" },
];

export const brazilianBanks = [
  "Banco do Brasil", "Bradesco", "Caixa Econômica", "Itaú", "Santander",
  "Nubank", "Inter", "C6 Bank", "Sicoob", "Sicredi", "BTG Pactual",
  "Safra", "Banrisul", "Original", "PagBank", "Stone", "Outro",
];

export const mockTransactions: Transaction[] = [
  {
    id: "txn-1", type: "receita", txn_date: "2026-03-08", competence_month: "2026-03",
    description: "Venda de 15 bezerros", merchant: "João Silva", amount: 45000,
    instrument_id: "pi-1", category_id: "cat-1", subcategory: "Bezerros",
    cost_center_id: "cc-1", tags: ["lote-142", "nelore"], status: "confirmado",
    payer_person_id: "p-1", beneficiary_person_id: null, notes: "", has_attachment: true,
  },
  {
    id: "txn-2", type: "despesa", txn_date: "2026-03-07", competence_month: "2026-03",
    description: "Compra de ração — 10 toneladas", merchant: "Nutrifarm Rações", amount: 12800,
    instrument_id: "pi-1", category_id: "cat-3", subcategory: "Ração",
    cost_center_id: "cc-4", tags: ["confinamento"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-3", notes: "Entrega em 2 lotes", has_attachment: true,
  },
  {
    id: "txn-3", type: "receita", txn_date: "2026-03-05", competence_month: "2026-03",
    description: "Recebimento leite — quinzena 1", merchant: "Laticínio São José", amount: 8200,
    instrument_id: "pi-1", category_id: "cat-2", subcategory: "Laticínio",
    cost_center_id: "cc-2", tags: ["leite"], status: "confirmado",
    payer_person_id: "p-2", beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-4", type: "despesa", txn_date: "2026-03-04", competence_month: "2026-03",
    description: "Veterinário — vacinação rebanho", merchant: "Dr. Carlos", amount: 3500,
    instrument_id: "pi-3", category_id: "cat-4", subcategory: "Vacinas",
    cost_center_id: "cc-1", tags: ["saude-animal"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-4", notes: "", has_attachment: true,
  },
  {
    id: "txn-5", type: "despesa", txn_date: "2026-03-03", competence_month: "2026-03",
    description: "Sal mineral — 500kg", merchant: "Cooperativa Agro Sul", amount: 2100,
    instrument_id: "pi-1", category_id: "cat-3", subcategory: "Sal Mineral",
    cost_center_id: "cc-1", tags: [], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-5", notes: "",
  },
  {
    id: "txn-6", type: "despesa", txn_date: "2026-03-02", competence_month: "2026-03",
    description: "Combustível — diesel", merchant: "Posto Fazendeiro", amount: 4500,
    instrument_id: "pi-5", category_id: "cat-8", subcategory: "Combustível",
    cost_center_id: "cc-1", tags: ["frota"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-6", notes: "",
  },
  {
    id: "txn-7", type: "receita", txn_date: "2026-03-01", competence_month: "2026-03",
    description: "Aluguel de pasto — Lote Sul", merchant: "Fazenda Vizinha", amount: 3000,
    instrument_id: "pi-1", category_id: "cat-9", subcategory: "Aluguel de Pasto",
    cost_center_id: "cc-2", tags: [], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-8", type: "despesa", txn_date: "2026-02-28", competence_month: "2026-02",
    description: "Manutenção de cercas — Pasto Norte", merchant: "Mão de obra local", amount: 1800,
    instrument_id: "pi-5", category_id: "cat-5", subcategory: "Cercas",
    cost_center_id: "cc-1", tags: ["manutencao"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-9", type: "receita", txn_date: "2026-02-25", competence_month: "2026-02",
    description: "Venda de 8 novilhos — leilão", merchant: "Leilão Rural", amount: 32000,
    instrument_id: "pi-1", category_id: "cat-1", subcategory: "Novilhos",
    cost_center_id: "cc-1", tags: ["leilao"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-10", type: "despesa", txn_date: "2026-02-22", competence_month: "2026-02",
    description: "Energia elétrica — Fazenda Boa Vista", merchant: "CEMIG", amount: 1450,
    instrument_id: "pi-1", category_id: "cat-8", subcategory: "Energia",
    cost_center_id: "cc-1", tags: [], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-11", type: "despesa", txn_date: "2026-02-20", competence_month: "2026-02",
    description: "Salários — Fevereiro", merchant: "Folha de Pagamento", amount: 15000,
    instrument_id: "pi-1", category_id: "cat-6", subcategory: "Salários",
    cost_center_id: "cc-3", tags: ["rh"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-12", type: "receita", txn_date: "2026-02-18", competence_month: "2026-02",
    description: "Recebimento leite — quinzena 2/fev", merchant: "Laticínio São José", amount: 7800,
    instrument_id: "pi-1", category_id: "cat-2", subcategory: "Laticínio",
    cost_center_id: "cc-2", tags: ["leite"], status: "confirmado",
    payer_person_id: "p-2", beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-13", type: "despesa", txn_date: "2026-02-15", competence_month: "2026-02",
    description: "Compra de feno — 200 fardos", merchant: "Cooperativa Agro Sul", amount: 6000,
    instrument_id: "pi-1", category_id: "cat-3", subcategory: "Feno",
    cost_center_id: "cc-4", tags: ["confinamento"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-5", notes: "",
  },
  {
    id: "txn-14", type: "despesa", txn_date: "2026-02-10", competence_month: "2026-02",
    description: "Funrural — competência janeiro", merchant: "Receita Federal", amount: 2200,
    instrument_id: "pi-1", category_id: "cat-7", subcategory: "Funrural",
    cost_center_id: "cc-3", tags: ["impostos"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-15", type: "receita", txn_date: "2026-02-05", competence_month: "2026-02",
    description: "Venda de 5 vacas de descarte", merchant: "Frigorífico Central", amount: 18000,
    instrument_id: "pi-1", category_id: "cat-1", subcategory: "Vacas de Descarte",
    cost_center_id: "cc-1", tags: ["descarte"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-16", type: "despesa", txn_date: "2026-02-02", competence_month: "2026-02",
    description: "Manutenção trator — troca de óleo", merchant: "Oficina Mecânica Rural", amount: 980,
    instrument_id: "pi-5", category_id: "cat-5", subcategory: "Equipamentos",
    cost_center_id: "cc-1", tags: ["frota"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-17", type: "receita", txn_date: "2026-01-28", competence_month: "2026-01",
    description: "Recebimento leite — quinzena 2/jan", merchant: "Laticínio São José", amount: 7500,
    instrument_id: "pi-1", category_id: "cat-2", subcategory: "Laticínio",
    cost_center_id: "cc-2", tags: ["leite"], status: "confirmado",
    payer_person_id: "p-2", beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-18", type: "despesa", txn_date: "2026-01-25", competence_month: "2026-01",
    description: "Ração — 8 toneladas", merchant: "Nutrifarm Rações", amount: 10200,
    instrument_id: "pi-1", category_id: "cat-3", subcategory: "Ração",
    cost_center_id: "cc-4", tags: ["confinamento"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-3", notes: "",
  },
  {
    id: "txn-19", type: "despesa", txn_date: "2026-01-20", competence_month: "2026-01",
    description: "Salários — Janeiro", merchant: "Folha de Pagamento", amount: 15000,
    instrument_id: "pi-1", category_id: "cat-6", subcategory: "Salários",
    cost_center_id: "cc-3", tags: ["rh"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-20", type: "receita", txn_date: "2026-01-15", competence_month: "2026-01",
    description: "Venda de 20 bezerros desmamados", merchant: "Fazenda Esperança", amount: 52000,
    instrument_id: "pi-1", category_id: "cat-1", subcategory: "Bezerros",
    cost_center_id: "cc-1", tags: ["nelore", "desmama"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-21", type: "despesa", txn_date: "2026-01-10", competence_month: "2026-01",
    description: "Combustível — diesel janeiro", merchant: "Posto Fazendeiro", amount: 3800,
    instrument_id: "pi-5", category_id: "cat-8", subcategory: "Combustível",
    cost_center_id: "cc-1", tags: ["frota"], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: "p-6", notes: "",
  },
  {
    id: "txn-22", type: "despesa", txn_date: "2026-01-05", competence_month: "2026-01",
    description: "Energia elétrica — dezembro", merchant: "CEMIG", amount: 1380,
    instrument_id: "pi-1", category_id: "cat-8", subcategory: "Energia",
    cost_center_id: "cc-1", tags: [], status: "confirmado",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
  {
    id: "txn-23", type: "receita", txn_date: "2026-01-02", competence_month: "2026-01",
    description: "Aluguel de pasto — janeiro", merchant: "Fazenda Vizinha", amount: 3000,
    instrument_id: "pi-1", category_id: "cat-9", subcategory: "Aluguel de Pasto",
    cost_center_id: "cc-2", tags: [], status: "pendente",
    payer_person_id: null, beneficiary_person_id: null, notes: "",
  },
];

export const chartDataMonthly = [
  { period: "Out/25", entradas: 48000, saidas: 32000 },
  { period: "Nov/25", entradas: 52000, saidas: 38000 },
  { period: "Dez/25", entradas: 61000, saidas: 41000 },
  { period: "Jan/26", entradas: 62500, saidas: 30380 },
  { period: "Fev/26", entradas: 57800, saidas: 27430 },
  { period: "Mar/26", entradas: 56200, saidas: 22900 },
];
