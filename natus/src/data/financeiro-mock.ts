export interface PaymentInstrument {
  id: string;
  label: string;
  name: string;
  type: "conta_corrente" | "cartao_credito" | "caixa" | "digital";
  bank: string;
  active: boolean;
}

export const paymentInstruments: PaymentInstrument[] = [
  { id: "1", label: "Conta Corrente — Nubank", name: "Conta Corrente — Nubank", type: "conta_corrente", bank: "Nubank", active: true },
  { id: "2", label: "Conta Corrente — Itaú", name: "Conta Corrente — Itaú", type: "conta_corrente", bank: "Itaú", active: true },
  { id: "3", label: "Cartão de Crédito — Nubank", name: "Cartão de Crédito — Nubank", type: "cartao_credito", bank: "Nubank", active: true },
  { id: "4", label: "Dinheiro / Caixa", name: "Dinheiro / Caixa", type: "caixa", bank: "", active: true },
];
