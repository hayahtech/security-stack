import { Category, Transaction, Loan, LoanInstallment } from '@/types';

export const categories: Category[] = [
  // Revenue
  { id: 'rev-balcao', name: 'Balcão', type: 'revenue', scope: 'business', icon: 'Store', group: 'Vendas' },
  { id: 'rev-delivery', name: 'Delivery', type: 'revenue', scope: 'business', icon: 'Truck', group: 'Vendas' },
  { id: 'rev-ifood', name: 'iFood', type: 'revenue', scope: 'business', icon: 'Smartphone', group: 'Vendas' },
  { id: 'rev-rappi', name: 'Rappi', type: 'revenue', scope: 'business', icon: 'Smartphone', group: 'Vendas' },
  { id: 'rev-whatsapp', name: 'WhatsApp', type: 'revenue', scope: 'business', icon: 'MessageCircle', group: 'Vendas' },
  { id: 'rev-events', name: 'Eventos/Encomendas', type: 'revenue', scope: 'business', icon: 'Calendar', group: 'Eventos' },
  { id: 'rev-other', name: 'Outros Recebimentos', type: 'revenue', scope: 'business', icon: 'Plus', group: 'Outros' },
  // Operational Expenses
  { id: 'exp-ingredients', name: 'Ingredientes/Insumos', type: 'expense', scope: 'business', icon: 'ChefHat', group: 'Operacional' },
  { id: 'exp-supermarket', name: 'Supermercado', type: 'expense', scope: 'business', icon: 'ShoppingCart', group: 'Operacional' },
  { id: 'exp-gas', name: 'Gás/Combustível', type: 'expense', scope: 'business', icon: 'Fuel', group: 'Operacional' },
  { id: 'exp-maintenance', name: 'Manutenção', type: 'expense', scope: 'business', icon: 'Wrench', group: 'Operacional' },
  // Fixed Expenses
  { id: 'exp-rent', name: 'Aluguel', type: 'expense', scope: 'business', icon: 'Home', group: 'Fixas' },
  { id: 'exp-energy', name: 'Energia Elétrica', type: 'expense', scope: 'business', icon: 'Zap', group: 'Fixas' },
  { id: 'exp-water', name: 'Água', type: 'expense', scope: 'business', icon: 'Droplets', group: 'Fixas' },
  { id: 'exp-internet', name: 'Internet/Telefone', type: 'expense', scope: 'business', icon: 'Wifi', group: 'Fixas' },
  { id: 'exp-software', name: 'Sistemas/Software', type: 'expense', scope: 'business', icon: 'Monitor', group: 'Fixas' },
  { id: 'exp-salary', name: 'Salários/Pró-labore', type: 'expense', scope: 'business', icon: 'Users', group: 'Fixas' },
  { id: 'exp-accountant', name: 'Contador', type: 'expense', scope: 'business', icon: 'Calculator', group: 'Fixas' },
  // Taxes
  { id: 'tax-marketplace', name: 'Taxa Marketplace', type: 'expense', scope: 'business', icon: 'Percent', group: 'Taxas' },
  { id: 'tax-card', name: 'Taxa Maquininha', type: 'expense', scope: 'business', icon: 'CreditCard', group: 'Taxas' },
  { id: 'tax-taxes', name: 'Impostos', type: 'expense', scope: 'business', icon: 'FileText', group: 'Taxas' },
  { id: 'tax-fines', name: 'Multas/Juros', type: 'expense', scope: 'business', icon: 'AlertTriangle', group: 'Taxas' },
  // Marketing
  { id: 'mkt-ads', name: 'Anúncios', type: 'expense', scope: 'business', icon: 'Megaphone', group: 'Marketing' },
  { id: 'mkt-print', name: 'Material Impresso', type: 'expense', scope: 'business', icon: 'Printer', group: 'Marketing' },
  { id: 'mkt-promo', name: 'Promoções/Descontos', type: 'expense', scope: 'business', icon: 'Tag', group: 'Marketing' },
  { id: 'mkt-influencer', name: 'Influenciadores', type: 'expense', scope: 'business', icon: 'Star', group: 'Marketing' },
  // Personal
  { id: 'per-food', name: 'Alimentação', type: 'expense', scope: 'personal', icon: 'UtensilsCrossed', group: 'Pessoal' },
  { id: 'per-transport', name: 'Transporte', type: 'expense', scope: 'personal', icon: 'Car', group: 'Pessoal' },
  { id: 'per-health', name: 'Saúde/Lazer', type: 'expense', scope: 'personal', icon: 'Heart', group: 'Pessoal' },
  { id: 'per-bills', name: 'Contas Pessoais', type: 'expense', scope: 'personal', icon: 'Receipt', group: 'Pessoal' },
  { id: 'per-savings', name: 'Economia/Metas', type: 'expense', scope: 'personal', icon: 'PiggyBank', group: 'Pessoal' },
];

const today = new Date();
const thisMonth = today.getMonth();
const thisYear = today.getFullYear();

function d(day: number, month = thisMonth, year = thisYear) {
  return new Date(year, month, day).toISOString().split('T')[0];
}

export const mockTransactions: Transaction[] = [
  { id: '1', user_id: 'u1', category_id: 'rev-balcao', amount: 4500, date: d(1), description: 'Vendas balcão semana 1', type: 'revenue', scope: 'business', status: 'paid', created_at: d(1) },
  { id: '2', user_id: 'u1', category_id: 'rev-ifood', amount: 3200, date: d(3), description: 'Recebimento iFood', type: 'revenue', scope: 'business', status: 'paid', created_at: d(3) },
  { id: '3', user_id: 'u1', category_id: 'rev-delivery', amount: 1800, date: d(5), description: 'Delivery próprio', type: 'revenue', scope: 'business', status: 'paid', created_at: d(5) },
  { id: '4', user_id: 'u1', category_id: 'rev-whatsapp', amount: 950, date: d(7), description: 'Pedidos WhatsApp', type: 'revenue', scope: 'business', status: 'paid', created_at: d(7) },
  { id: '5', user_id: 'u1', category_id: 'rev-events', amount: 2500, date: d(10), description: 'Encomenda festa aniversário', type: 'revenue', scope: 'business', status: 'paid', created_at: d(10) },
  { id: '6', user_id: 'u1', category_id: 'rev-rappi', amount: 1100, date: d(12), description: 'Recebimento Rappi', type: 'revenue', scope: 'business', status: 'pending', due_date: d(20), created_at: d(12) },
  { id: '7', user_id: 'u1', category_id: 'rev-balcao', amount: 5200, date: d(15), description: 'Vendas balcão semana 2', type: 'revenue', scope: 'business', status: 'paid', created_at: d(15) },
  // Expenses
  { id: '10', user_id: 'u1', category_id: 'exp-ingredients', amount: 3200, date: d(2), description: 'Farinha, queijo, molho', type: 'expense', scope: 'business', status: 'paid', created_at: d(2) },
  { id: '11', user_id: 'u1', category_id: 'exp-gas', amount: 450, date: d(4), description: 'Gás para forno', type: 'expense', scope: 'business', status: 'paid', created_at: d(4) },
  { id: '12', user_id: 'u1', category_id: 'exp-rent', amount: 3500, date: d(5), description: 'Aluguel do mês', type: 'expense', scope: 'business', status: 'paid', created_at: d(5) },
  { id: '13', user_id: 'u1', category_id: 'exp-energy', amount: 890, date: d(10), description: 'Conta de luz', type: 'expense', scope: 'business', status: 'pending', due_date: d(15), created_at: d(10) },
  { id: '14', user_id: 'u1', category_id: 'exp-salary', amount: 4500, date: d(5), description: 'Salários funcionários', type: 'expense', scope: 'business', status: 'paid', created_at: d(5) },
  { id: '15', user_id: 'u1', category_id: 'tax-marketplace', amount: 680, date: d(8), description: 'Taxa iFood março', type: 'expense', scope: 'business', status: 'paid', created_at: d(8) },
  { id: '16', user_id: 'u1', category_id: 'mkt-ads', amount: 350, date: d(6), description: 'Anúncio Instagram', type: 'expense', scope: 'business', status: 'paid', created_at: d(6) },
  { id: '17', user_id: 'u1', category_id: 'exp-supermarket', amount: 520, date: d(9), description: 'Compras gerais', type: 'expense', scope: 'business', status: 'paid', created_at: d(9) },
  { id: '18', user_id: 'u1', category_id: 'exp-water', amount: 180, date: d(12), description: 'Conta de água', type: 'expense', scope: 'business', status: 'pending', due_date: d(18), created_at: d(12) },
  // Personal
  { id: '20', user_id: 'u1', category_id: 'per-food', amount: 800, date: d(3), description: 'Alimentação pessoal', type: 'expense', scope: 'personal', status: 'paid', created_at: d(3) },
  { id: '21', user_id: 'u1', category_id: 'per-transport', amount: 350, date: d(5), description: 'Uber/combustível pessoal', type: 'expense', scope: 'personal', status: 'paid', created_at: d(5) },
  { id: '22', user_id: 'u1', category_id: 'per-health', amount: 200, date: d(8), description: 'Academia', type: 'expense', scope: 'personal', status: 'paid', created_at: d(8) },
  { id: '23', user_id: 'u1', category_id: 'per-bills', amount: 1500, date: d(10), description: 'Cartão de crédito pessoal', type: 'expense', scope: 'personal', status: 'pending', due_date: d(15), created_at: d(10) },
];

export const mockLoans: Loan[] = [
  { id: 'l1', user_id: 'u1', name: 'Forno Industrial', total_amount: 15000, installments: 12, interest_rate: 2.5, start_date: '2025-01-15', created_at: '2025-01-15' },
  { id: 'l2', user_id: 'u1', name: 'Reforma do salão', total_amount: 30000, installments: 24, interest_rate: 1.8, start_date: '2025-06-01', created_at: '2025-06-01' },
];

export function getMockInstallments(loan: Loan): LoanInstallment[] {
  const installments: LoanInstallment[] = [];
  const startDate = new Date(loan.start_date);
  const monthlyAmount = loan.total_amount * (1 + loan.interest_rate / 100) / loan.installments;
  
  for (let i = 0; i < loan.installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    const isPast = dueDate < today;
    installments.push({
      id: `${loan.id}-inst-${i + 1}`,
      loan_id: loan.id,
      number: i + 1,
      amount: Math.round(monthlyAmount * 100) / 100,
      due_date: dueDate.toISOString().split('T')[0],
      paid: isPast && i < 8,
      paid_date: isPast && i < 8 ? dueDate.toISOString().split('T')[0] : undefined,
    });
  }
  return installments;
}
