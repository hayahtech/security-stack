export interface Transaction {
  id: string;
  type: "receita" | "despesa" | "transferencia";
  txn_date: string;
  competence_month: string;
  description: string;
  merchant: string;
  amount: number;
  instrument_id: string;
  category_id: string;
  subcategory: string;
  cost_center_id: string;
  tags: string[];
  status: "confirmado" | "pendente" | "cancelado";
  payer_person_id: string | null;
  beneficiary_person_id: string | null;
  notes: string;
  has_attachment?: boolean;
}

export interface PaymentInstrument {
  id: string;
  name: string;
  type: "conta_corrente" | "poupanca" | "cartao_credito" | "caixa" | "outro";
  bank?: string;
  last4?: string;
  holder_person_id?: string;
  closing_day?: number;
  due_day?: number;
  balance: number;
  credit_limit?: number;
  active: boolean;
}

export interface CardStatement {
  id: string;
  instrument_id: string;
  month: string;
  closing_date: string;
  due_date: string;
  total: number;
  status: "aberta" | "fechada" | "paga";
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export interface CostCenter {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  name: string;
}
export interface Payable {
  id: string;
  type: "pagar" | "receber";
  due_date: string;
  description: string;
  person_id: string;
  category_id: string;
  amount: number;
  installment_label?: string;
  status: "pendente" | "vencido" | "pago";
  paid_date?: string;
  paid_instrument_id?: string;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  total: number;
  num_installments: number;
  paid_count: number;
  next_due: string;
  type: "pagar" | "receber";
}

export interface RecurringRule {
  id: string;
  description: string;
  amount: number;
  frequency: "semanal" | "quinzenal" | "mensal" | "trimestral" | "anual";
  next_date: string;
  category_id: string;
  person_id: string;
  type: "pagar" | "receber";
  active: boolean;
}
