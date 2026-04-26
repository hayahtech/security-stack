import type { Account, CreditCard, Invoice, Property, Activity, CostCenter, Category, Transaction, Budget, Alert } from '@/types';

export const mockAccounts: Account[] = [
  { id: 'acc-1', name: 'Conta Rural Sicoob', bank: 'Sicoob', type: 'cooperativa', balance: 85420.50, initialBalance: 50000, color: '#2F5E49', active: true },
  { id: 'acc-2', name: 'Conta Corrente BB', bank: 'Banco do Brasil', type: 'corrente', balance: 32150.00, initialBalance: 20000, color: '#2563EB', active: true },
  { id: 'acc-3', name: 'Caixa da Fazenda', bank: '-', type: 'caixa', balance: 4800.00, initialBalance: 2000, color: '#8C5E3C', active: true },
];

export const mockCards: CreditCard[] = [
  { id: 'card-1', name: 'Visa Rural', brand: 'Visa', limit: 25000, closingDay: 15, dueDay: 25, linkedAccountId: 'acc-1', invoices: [] },
  { id: 'card-2', name: 'Master BB', brand: 'Mastercard', limit: 15000, closingDay: 10, dueDay: 20, linkedAccountId: 'acc-2', invoices: [] },
];

export const mockProperties: Property[] = [
  { id: 'prop-1', name: 'Fazenda Santa Luzia', area: 320, location: 'Uberaba - MG', type: 'propria', notes: 'Propriedade principal, foco em soja e gado' },
  { id: 'prop-2', name: 'Sítio Recanto Verde', area: 48, location: 'Sacramento - MG', type: 'arrendada', notes: 'Arrendamento para leite e hortaliças' },
];

export const mockActivities: Activity[] = [
  { id: 'act-1', name: 'Soja Safra 2026', type: 'Agricultura', propertyId: 'prop-1', startDate: '2025-10-01', endDate: '2026-04-30', revenueGoal: 480000, status: 'em_andamento' },
  { id: 'act-2', name: 'Gado de Corte', type: 'Pecuária', propertyId: 'prop-1', startDate: '2025-01-01', endDate: '2025-12-31', revenueGoal: 320000, status: 'em_andamento' },
  { id: 'act-3', name: 'Produção de Leite', type: 'Pecuária', propertyId: 'prop-2', startDate: '2025-01-01', endDate: '2025-12-31', revenueGoal: 96000, status: 'em_andamento' },
  { id: 'act-4', name: 'Arrendamento', type: 'Outros', propertyId: 'prop-2', startDate: '2025-01-01', endDate: '2025-12-31', revenueGoal: 36000, status: 'em_andamento' },
];

export const mockCostCenters: CostCenter[] = [
  { id: 'cc-1', name: 'Insumos', description: 'Sementes, fertilizantes, defensivos' },
  { id: 'cc-2', name: 'Combustível', description: 'Diesel, gasolina, lubrificantes' },
  { id: 'cc-3', name: 'Funcionários', description: 'Salários, encargos, benefícios' },
  { id: 'cc-4', name: 'Manutenção', description: 'Reparos em máquinas e estruturas' },
  { id: 'cc-5', name: 'Máquinas', description: 'Aquisição e aluguel de equipamentos' },
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Venda de Produção', type: 'receita', subcategories: [
    { id: 'sub-1', name: 'Venda de Grãos', categoryId: 'cat-1' },
    { id: 'sub-2', name: 'Venda de Gado', categoryId: 'cat-1' },
    { id: 'sub-3', name: 'Venda de Leite', categoryId: 'cat-1' },
  ]},
  { id: 'cat-2', name: 'Arrendamento', type: 'receita', subcategories: [
    { id: 'sub-4', name: 'Aluguel de Terra', categoryId: 'cat-2' },
  ]},
  { id: 'cat-3', name: 'Insumos', type: 'despesa', subcategories: [
    { id: 'sub-5', name: 'Sementes', categoryId: 'cat-3' },
    { id: 'sub-6', name: 'Fertilizantes', categoryId: 'cat-3' },
    { id: 'sub-7', name: 'Defensivos', categoryId: 'cat-3' },
  ]},
  { id: 'cat-4', name: 'Operacional', type: 'despesa', subcategories: [
    { id: 'sub-8', name: 'Combustível', categoryId: 'cat-4' },
    { id: 'sub-9', name: 'Manutenção', categoryId: 'cat-4' },
  ]},
  { id: 'cat-5', name: 'Pessoal', type: 'despesa', subcategories: [
    { id: 'sub-10', name: 'Salários', categoryId: 'cat-5' },
    { id: 'sub-11', name: 'Encargos', categoryId: 'cat-5' },
  ]},
  { id: 'cat-6', name: 'Investimento', type: 'despesa', subcategories: [
    { id: 'sub-12', name: 'Máquinas', categoryId: 'cat-6' },
    { id: 'sub-13', name: 'Infraestrutura', categoryId: 'cat-6' },
  ]},
];

const now = new Date();
const month = (offset: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().split('T')[0];
};

export const mockTransactions: Transaction[] = [
  { id: 'tx-1', type: 'receita', description: 'Venda soja - lote 12', amount: 85000, date: month(0), dueDate: month(0), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: '', activityId: 'act-1', categoryId: 'cat-1', subcategoryId: 'sub-1', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }, { date: month(0), action: 'Pago', description: 'Recebimento confirmado' }] },
  { id: 'tx-2', type: 'receita', description: 'Venda 15 bezerros', amount: 45000, date: month(0), dueDate: month(0), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: '', activityId: 'act-2', categoryId: 'cat-1', subcategoryId: 'sub-2', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-3', type: 'receita', description: 'Leite - Janeiro', amount: 8200, date: month(0), dueDate: month(0), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: '', activityId: 'act-3', categoryId: 'cat-1', subcategoryId: 'sub-3', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-4', type: 'receita', description: 'Arrendamento - fev', amount: 3000, date: month(0), dueDate: month(0), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: '', activityId: 'act-4', categoryId: 'cat-2', subcategoryId: 'sub-4', paymentMethod: 'pix', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-5', type: 'despesa', description: 'Sementes de soja', amount: 32000, date: month(-1), dueDate: month(-1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-1', categoryId: 'cat-3', subcategoryId: 'sub-5', paymentMethod: 'boleto', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-6', type: 'despesa', description: 'Fertilizante NPK', amount: 18500, date: month(-1), dueDate: month(-1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-1', categoryId: 'cat-3', subcategoryId: 'sub-6', paymentMethod: 'boleto', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-7', type: 'despesa', description: 'Defensivos agrícolas', amount: 14200, date: month(0), dueDate: month(0), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-1', categoryId: 'cat-3', subcategoryId: 'sub-7', paymentMethod: 'boleto', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-8', type: 'despesa', description: 'Diesel - colheitadeira', amount: 5600, date: month(0), dueDate: month(0), accountId: 'acc-3', propertyId: 'prop-1', costCenterId: 'cc-2', activityId: 'act-1', categoryId: 'cat-4', subcategoryId: 'sub-8', paymentMethod: 'dinheiro', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-9', type: 'despesa', description: 'Salário - Peão João', amount: 3200, date: month(0), dueDate: month(0), accountId: 'acc-2', propertyId: 'prop-1', costCenterId: 'cc-3', activityId: 'act-2', categoryId: 'cat-5', subcategoryId: 'sub-10', paymentMethod: 'transferencia', status: 'pago', recurring: true, recurringFrequency: 'mensal', history: [{ date: month(0), action: 'Criado', description: 'Lançamento recorrente' }] },
  { id: 'tx-10', type: 'despesa', description: 'Salário - Vaqueiro Carlos', amount: 2800, date: month(0), dueDate: month(0), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: 'cc-3', activityId: 'act-3', categoryId: 'cat-5', subcategoryId: 'sub-10', paymentMethod: 'transferencia', status: 'pago', recurring: true, recurringFrequency: 'mensal', history: [{ date: month(0), action: 'Criado', description: 'Lançamento recorrente' }] },
  { id: 'tx-11', type: 'despesa', description: 'Manutenção trator', amount: 4500, date: month(0), dueDate: month(0), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-4', activityId: '', categoryId: 'cat-4', subcategoryId: 'sub-9', paymentMethod: 'pix', status: 'pendente', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-12', type: 'despesa', description: 'Ração gado - parcela 1/3', amount: 8000, date: month(0), dueDate: month(0), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-2', categoryId: 'cat-3', subcategoryId: 'sub-5', paymentMethod: 'boleto', status: 'pago', installments: 3, currentInstallment: 1, parentId: 'tx-12', history: [{ date: month(0), action: 'Criado', description: 'Parcela 1 de 3' }] },
  { id: 'tx-13', type: 'despesa', description: 'Ração gado - parcela 2/3', amount: 8000, date: month(1), dueDate: month(1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-2', categoryId: 'cat-3', subcategoryId: 'sub-5', paymentMethod: 'boleto', status: 'pendente', installments: 3, currentInstallment: 2, parentId: 'tx-12', history: [{ date: month(0), action: 'Criado', description: 'Parcela 2 de 3' }] },
  { id: 'tx-14', type: 'despesa', description: 'Ração gado - parcela 3/3', amount: 8000, date: month(2), dueDate: month(2), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-2', categoryId: 'cat-3', subcategoryId: 'sub-5', paymentMethod: 'boleto', status: 'pendente', installments: 3, currentInstallment: 3, parentId: 'tx-12', history: [{ date: month(0), action: 'Criado', description: 'Parcela 3 de 3' }] },
  { id: 'tx-15', type: 'receita', description: 'Venda soja - lote 8', amount: 62000, date: month(-1), dueDate: month(-1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: '', activityId: 'act-1', categoryId: 'cat-1', subcategoryId: 'sub-1', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-16', type: 'despesa', description: 'Vacinas rebanho', amount: 6500, date: month(-1), dueDate: month(-1), accountId: 'acc-2', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-2', categoryId: 'cat-3', subcategoryId: 'sub-7', paymentMethod: 'pix', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-17', type: 'receita', description: 'Leite - Dezembro', amount: 7800, date: month(-2), dueDate: month(-2), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: '', activityId: 'act-3', categoryId: 'cat-1', subcategoryId: 'sub-3', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(-2), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-18', type: 'despesa', description: 'Conta de energia - fazenda', amount: 1850, date: month(0), dueDate: month(0), accountId: 'acc-2', propertyId: 'prop-1', costCenterId: 'cc-4', activityId: '', categoryId: 'cat-4', subcategoryId: 'sub-9', paymentMethod: 'boleto', status: 'pago', recurring: true, recurringFrequency: 'mensal', history: [{ date: month(0), action: 'Criado', description: 'Despesa recorrente' }] },
  { id: 'tx-19', type: 'despesa', description: 'Compra bezerros confinamento', amount: 28000, date: month(-1), dueDate: month(-1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-2', categoryId: 'cat-3', subcategoryId: 'sub-5', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-20', type: 'receita', description: 'Arrendamento - jan', amount: 3000, date: month(-1), dueDate: month(-1), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: '', activityId: 'act-4', categoryId: 'cat-2', subcategoryId: 'sub-4', paymentMethod: 'pix', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-21', type: 'despesa', description: 'Frete transporte gado', amount: 3800, date: month(0), dueDate: month(1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-2', activityId: 'act-2', categoryId: 'cat-4', subcategoryId: 'sub-8', paymentMethod: 'boleto', status: 'pendente', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-22', type: 'despesa', description: 'Calcário para correção solo', amount: 12000, date: month(-2), dueDate: month(-2), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-1', categoryId: 'cat-3', subcategoryId: 'sub-6', paymentMethod: 'boleto', status: 'pago', history: [{ date: month(-2), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-23', type: 'receita', description: 'Venda 5 vacas descarte', amount: 22000, date: month(-2), dueDate: month(-2), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: '', activityId: 'act-2', categoryId: 'cat-1', subcategoryId: 'sub-2', paymentMethod: 'pix', status: 'pago', history: [{ date: month(-2), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-24', type: 'despesa', description: 'Cercas - manutenção', amount: 2200, date: month(0), dueDate: month(0), accountId: 'acc-3', propertyId: 'prop-2', costCenterId: 'cc-4', activityId: 'act-3', categoryId: 'cat-4', subcategoryId: 'sub-9', paymentMethod: 'dinheiro', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-25', type: 'despesa', description: 'Sal mineral rebanho', amount: 1500, date: month(0), dueDate: month(0), accountId: 'acc-3', propertyId: 'prop-1', costCenterId: 'cc-1', activityId: 'act-2', categoryId: 'cat-3', subcategoryId: 'sub-5', paymentMethod: 'dinheiro', status: 'pago', history: [{ date: month(0), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-26', type: 'receita', description: 'Venda leite - Novembro', amount: 7500, date: month(-3), dueDate: month(-3), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: '', activityId: 'act-3', categoryId: 'cat-1', subcategoryId: 'sub-3', paymentMethod: 'transferencia', status: 'pago', history: [{ date: month(-3), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-27', type: 'despesa', description: 'Seguro máquinas', amount: 4200, date: month(-2), dueDate: month(-2), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-5', activityId: '', categoryId: 'cat-6', subcategoryId: 'sub-12', paymentMethod: 'boleto', status: 'pago', history: [{ date: month(-2), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-28', type: 'despesa', description: 'Encargos trabalhistas', amount: 2100, date: month(0), dueDate: month(0), accountId: 'acc-2', propertyId: 'prop-1', costCenterId: 'cc-3', activityId: '', categoryId: 'cat-5', subcategoryId: 'sub-11', paymentMethod: 'boleto', status: 'pago', recurring: true, recurringFrequency: 'mensal', history: [{ date: month(0), action: 'Criado', description: 'Despesa recorrente' }] },
  { id: 'tx-29', type: 'receita', description: 'Arrendamento - dez', amount: 3000, date: month(-2), dueDate: month(-2), accountId: 'acc-2', propertyId: 'prop-2', costCenterId: '', activityId: 'act-4', categoryId: 'cat-2', subcategoryId: 'sub-4', paymentMethod: 'pix', status: 'pago', history: [{ date: month(-2), action: 'Criado', description: 'Lançamento criado' }] },
  { id: 'tx-30', type: 'despesa', description: 'Peças trator John Deere', amount: 7800, date: month(-1), dueDate: month(-1), accountId: 'acc-1', propertyId: 'prop-1', costCenterId: 'cc-5', activityId: '', categoryId: 'cat-6', subcategoryId: 'sub-12', paymentMethod: 'pix', status: 'pago', history: [{ date: month(-1), action: 'Criado', description: 'Lançamento criado' }] },
];

export const mockInvoices: Invoice[] = [
  { id: 'inv-1', cardId: 'card-1', month: 2, year: 2026, total: 4200, paid: false, transactions: ['Diesel posto BR - R$1.200', 'Peças filtro - R$800', 'Material escritório - R$350', 'Restaurante - R$250', 'Farmácia veterinária - R$1.600'] },
  { id: 'inv-2', cardId: 'card-1', month: 1, year: 2026, total: 3800, paid: true, transactions: ['Combustível - R$1.500', 'Veterinário - R$1.200', 'Farmácia - R$600', 'Mercado - R$500'] },
  { id: 'inv-3', cardId: 'card-2', month: 2, year: 2026, total: 2100, paid: false, transactions: ['Alimentação - R$800', 'Material limpeza - R$400', 'Assinatura software - R$900'] },
];

export const mockBudgets: Budget[] = [
  { id: 'bud-1', propertyId: 'prop-1', activityId: 'act-1', categoryId: 'cat-3', plannedAmount: 80000, spentAmount: 64700, period: '2026', status: 'proximo' },
  { id: 'bud-2', propertyId: 'prop-1', activityId: 'act-2', categoryId: 'cat-3', plannedAmount: 50000, spentAmount: 52300, period: '2026', status: 'estourado' },
  { id: 'bud-3', propertyId: 'prop-2', activityId: 'act-3', categoryId: 'cat-4', plannedAmount: 15000, spentAmount: 8050, period: '2026', status: 'dentro' },
  { id: 'bud-4', propertyId: 'prop-1', categoryId: 'cat-5', plannedAmount: 72000, spentAmount: 48600, period: '2026', status: 'dentro' },
  { id: 'bud-5', propertyId: 'prop-1', categoryId: 'cat-2', plannedAmount: 20000, spentAmount: 18500, period: '2026', status: 'proximo' },
];

export const mockAlerts: Alert[] = [
  { id: 'alert-1', type: 'vencimento', title: 'Conta a vencer', description: 'Manutenção do trator vence em 3 dias — R$ 4.500', severity: 'warning' },
  { id: 'alert-2', type: 'fatura', title: 'Fatura em aberto', description: 'Visa Rural — R$ 4.200 vence dia 25', severity: 'warning' },
  { id: 'alert-3', type: 'orcamento', title: 'Orçamento estourado', description: 'Gado de Corte - Insumos: R$ 52.300 de R$ 50.000', severity: 'danger' },
  { id: 'alert-4', type: 'safra', title: 'Receita prevista da safra', description: 'Soja 2026: R$ 480.000 estimado — 30% já recebido', severity: 'info' },
];

// Card invoices linking
mockCards[0].invoices = mockInvoices.filter(i => i.cardId === 'card-1');
mockCards[1].invoices = mockInvoices.filter(i => i.cardId === 'card-2');

export const paymentMethods = [
  { id: 'pm-1', name: 'Pix', value: 'pix' as const },
  { id: 'pm-2', name: 'Boleto', value: 'boleto' as const },
  { id: 'pm-3', name: 'Cartão', value: 'cartao' as const },
  { id: 'pm-4', name: 'Dinheiro', value: 'dinheiro' as const },
  { id: 'pm-5', name: 'Transferência', value: 'transferencia' as const },
];
