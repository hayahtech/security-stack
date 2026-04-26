export interface PaymentInstrument {
  id: string;
  label: string;
  type: "conta_corrente" | "cartao_credito" | "caixa" | "digital";
  bank: string;
}

export const paymentInstruments: PaymentInstrument[] = [
  { id: "1", label: "Conta Corrente — Nubank", type: "conta_corrente", bank: "Nubank" },
  { id: "2", label: "Conta Corrente — Itaú", type: "conta_corrente", bank: "Itaú" },
  { id: "3", label: "Cartão de Crédito — Nubank", type: "cartao_credito", bank: "Nubank" },
  { id: "4", label: "Dinheiro / Caixa", type: "caixa", bank: "" },
];
