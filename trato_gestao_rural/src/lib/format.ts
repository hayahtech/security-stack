export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getGrowthEmoji(value: number): string {
  if (value >= 10) return '🌳';
  if (value >= 0) return '🌿';
  return '🌱';
}

export function getMonthName(month: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[month] || '';
}
