// Demo data for dashboard visualization when no real data exists

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

function d(day: number, month = m, year = y) {
  return new Date(year, month, day).toISOString().split('T')[0];
}

export const demoTransactions = [
  // Receitas
  { id: 'd1', description: 'Vendas balcão semana 1', amount: 8500, date: d(2), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-balcao', due_date: null },
  { id: 'd2', description: 'Recebimento iFood', amount: 6200, date: d(4), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-ifood', due_date: null },
  { id: 'd3', description: 'Delivery próprio', amount: 3800, date: d(6), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-delivery', due_date: null },
  { id: 'd4', description: 'Pedidos WhatsApp', amount: 2950, date: d(8), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-whatsapp', due_date: null },
  { id: 'd5', description: 'Encomenda festa aniversário', amount: 4500, date: d(10), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-events', due_date: null },
  { id: 'd6', description: 'Recebimento Rappi', amount: 2100, date: d(12), type: 'revenue' as const, scope: 'business' as const, status: 'pending' as const, category_id: 'rev-rappi', due_date: d(20) },
  { id: 'd7', description: 'Vendas balcão semana 2', amount: 9200, date: d(15), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-balcao', due_date: null },
  { id: 'd8', description: 'Vendas balcão semana 3', amount: 7800, date: d(18), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-balcao', due_date: null },
  { id: 'd9', description: 'iFood semana 3', amount: 5400, date: d(19), type: 'revenue' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'rev-ifood', due_date: null },
  // Despesas
  { id: 'd10', description: 'Farinha, queijo, molho', amount: 5200, date: d(2), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-ingredients', due_date: null },
  { id: 'd11', description: 'Gás para forno', amount: 850, date: d(4), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-gas', due_date: null },
  { id: 'd12', description: 'Aluguel do mês', amount: 4500, date: d(5), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-rent', due_date: null },
  { id: 'd13', description: 'Conta de luz', amount: 1290, date: d(10), type: 'expense' as const, scope: 'business' as const, status: 'pending' as const, category_id: 'exp-energy', due_date: d(15) },
  { id: 'd14', description: 'Salários funcionários', amount: 7500, date: d(5), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-salary', due_date: null },
  { id: 'd15', description: 'Taxa iFood março', amount: 1480, date: d(8), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'tax-marketplace', due_date: null },
  { id: 'd16', description: 'Anúncio Instagram', amount: 650, date: d(6), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'mkt-ads', due_date: null },
  { id: 'd17', description: 'Compras gerais supermercado', amount: 920, date: d(9), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-supermarket', due_date: null },
  { id: 'd18', description: 'Conta de água', amount: 280, date: d(12), type: 'expense' as const, scope: 'business' as const, status: 'pending' as const, category_id: 'exp-water', due_date: d(18) },
  { id: 'd19', description: 'Manutenção forno', amount: 350, date: d(14), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-maintenance', due_date: null },
  { id: 'd20', description: 'Internet/Telefone', amount: 189, date: d(10), type: 'expense' as const, scope: 'business' as const, status: 'pending' as const, category_id: 'exp-internet', due_date: d(22) },
  { id: 'd21', description: 'Impostos DAS', amount: 1200, date: d(20), type: 'expense' as const, scope: 'business' as const, status: 'pending' as const, category_id: 'tax-taxes', due_date: d(25) },
  { id: 'd22', description: 'Embalagens delivery', amount: 480, date: d(7), type: 'expense' as const, scope: 'business' as const, status: 'paid' as const, category_id: 'exp-ingredients', due_date: null },
];

export const demoCategories = [
  { id: 'rev-balcao', name: 'Balcão', type: 'revenue' as const, scope: 'business' as const, icon: 'Store', group: 'Vendas' },
  { id: 'rev-delivery', name: 'Delivery', type: 'revenue' as const, scope: 'business' as const, icon: 'Truck', group: 'Vendas' },
  { id: 'rev-ifood', name: 'iFood', type: 'revenue' as const, scope: 'business' as const, icon: 'Smartphone', group: 'Vendas' },
  { id: 'rev-rappi', name: 'Rappi', type: 'revenue' as const, scope: 'business' as const, icon: 'Smartphone', group: 'Vendas' },
  { id: 'rev-whatsapp', name: 'WhatsApp', type: 'revenue' as const, scope: 'business' as const, icon: 'MessageCircle', group: 'Vendas' },
  { id: 'rev-events', name: 'Eventos/Encomendas', type: 'revenue' as const, scope: 'business' as const, icon: 'Calendar', group: 'Eventos' },
  { id: 'exp-ingredients', name: 'Ingredientes/Insumos', type: 'expense' as const, scope: 'business' as const, icon: 'ChefHat', group: 'Operacional' },
  { id: 'exp-supermarket', name: 'Supermercado', type: 'expense' as const, scope: 'business' as const, icon: 'ShoppingCart', group: 'Operacional' },
  { id: 'exp-gas', name: 'Gás/Combustível', type: 'expense' as const, scope: 'business' as const, icon: 'Fuel', group: 'Operacional' },
  { id: 'exp-maintenance', name: 'Manutenção', type: 'expense' as const, scope: 'business' as const, icon: 'Wrench', group: 'Operacional' },
  { id: 'exp-rent', name: 'Aluguel', type: 'expense' as const, scope: 'business' as const, icon: 'Home', group: 'Fixas' },
  { id: 'exp-energy', name: 'Energia Elétrica', type: 'expense' as const, scope: 'business' as const, icon: 'Zap', group: 'Fixas' },
  { id: 'exp-water', name: 'Água', type: 'expense' as const, scope: 'business' as const, icon: 'Droplets', group: 'Fixas' },
  { id: 'exp-internet', name: 'Internet/Telefone', type: 'expense' as const, scope: 'business' as const, icon: 'Wifi', group: 'Fixas' },
  { id: 'exp-salary', name: 'Salários/Pró-labore', type: 'expense' as const, scope: 'business' as const, icon: 'Users', group: 'Fixas' },
  { id: 'tax-marketplace', name: 'Taxa Marketplace', type: 'expense' as const, scope: 'business' as const, icon: 'Percent', group: 'Taxas' },
  { id: 'tax-taxes', name: 'Impostos', type: 'expense' as const, scope: 'business' as const, icon: 'FileText', group: 'Taxas' },
  { id: 'mkt-ads', name: 'Anúncios', type: 'expense' as const, scope: 'business' as const, icon: 'Megaphone', group: 'Marketing' },
];

export const demoChartData = [
  { name: 'Jan', receita: 38500, despesa: 22800 },
  { name: 'Fev', receita: 42300, despesa: 24100 },
  { name: 'Mar', receita: 50450, despesa: 24889 },
  { name: 'Abr', receita: 35200, despesa: 21500 },
  { name: 'Mai', receita: 47800, despesa: 26300 },
  { name: 'Jun', receita: 44100, despesa: 23900 },
];

export const demoPieData = [
  { name: 'Operacional', value: 7450 },
  { name: 'Fixas', value: 13479 },
  { name: 'Taxas', value: 2680 },
  { name: 'Marketing', value: 650 },
];

export const demoLowStock = [
  { name: 'Queijo Mussarela', quantity_current: 3, quantity_min: 5 },
  { name: 'Farinha de Trigo', quantity_current: 2, quantity_min: 10 },
  { name: 'Molho de Tomate', quantity_current: 4, quantity_min: 8 },
];

export const demoBirthdayCustomers = [
  { id: 'bc1', name: 'Maria Silva', birth_date: d(now.getDate() + 2), phone: '11999887766' },
  { id: 'bc2', name: 'João Santos', birth_date: d(now.getDate() + 5), phone: '11988776655' },
];
