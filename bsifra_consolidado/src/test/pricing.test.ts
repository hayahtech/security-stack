import { describe, it, expect } from "vitest";

// Lógica extraída de CalculatorPage — testada isoladamente sem React
function calcularOrcamento(params: {
  hourlyRate: number;
  hours: number;
  complexityValue: number;
  marginPercent: number;
  extraCosts: number;
}) {
  const { hourlyRate, hours, complexityValue, marginPercent, extraCosts } = params;
  const basePrice = hourlyRate * hours * complexityValue;
  const marginValue = basePrice * (marginPercent / 100);
  const suggestedPrice = basePrice + marginValue + extraCosts;
  return { basePrice, marginValue, suggestedPrice };
}

describe("Calculadora de Orçamento", () => {
  it("calcula preço base corretamente", () => {
    const { basePrice } = calcularOrcamento({
      hourlyRate: 100,
      hours: 10,
      complexityValue: 1.0,
      marginPercent: 0,
      extraCosts: 0,
    });
    expect(basePrice).toBe(1000);
  });

  it("aplica multiplicador de complexidade", () => {
    const { basePrice } = calcularOrcamento({
      hourlyRate: 100,
      hours: 10,
      complexityValue: 1.5,
      marginPercent: 0,
      extraCosts: 0,
    });
    expect(basePrice).toBe(1500);
  });

  it("calcula margem de lucro corretamente", () => {
    const { basePrice, marginValue } = calcularOrcamento({
      hourlyRate: 100,
      hours: 10,
      complexityValue: 1.0,
      marginPercent: 20,
      extraCosts: 0,
    });
    expect(basePrice).toBe(1000);
    expect(marginValue).toBe(200);
  });

  it("inclui custos extras no total", () => {
    const { suggestedPrice } = calcularOrcamento({
      hourlyRate: 100,
      hours: 10,
      complexityValue: 1.0,
      marginPercent: 0,
      extraCosts: 500,
    });
    expect(suggestedPrice).toBe(1500);
  });

  it("calcula total completo (taxa + complexidade + margem + extras)", () => {
    const { suggestedPrice } = calcularOrcamento({
      hourlyRate: 150,
      hours: 20,
      complexityValue: 1.5,
      marginPercent: 25,
      extraCosts: 200,
    });
    // base = 150 * 20 * 1.5 = 4500
    // margem = 4500 * 0.25 = 1125
    // total = 4500 + 1125 + 200 = 5825
    expect(suggestedPrice).toBe(5825);
  });

  it("retorna zero para horas zero", () => {
    const { suggestedPrice } = calcularOrcamento({
      hourlyRate: 100,
      hours: 0,
      complexityValue: 1.0,
      marginPercent: 20,
      extraCosts: 0,
    });
    expect(suggestedPrice).toBe(0);
  });

  it("complexidade baixa (0.8) reduz o preço base", () => {
    const { basePrice } = calcularOrcamento({
      hourlyRate: 100,
      hours: 10,
      complexityValue: 0.8,
      marginPercent: 0,
      extraCosts: 0,
    });
    expect(basePrice).toBe(800);
  });
});

describe("Cálculo de total de fatura", () => {
  function calcularTotalFatura(items: { hours: number; rate: number }[], discount: number) {
    const subtotal = items.reduce((sum, i) => sum + i.hours * i.rate, 0);
    const total = subtotal - discount;
    const totalHours = items.reduce((sum, i) => sum + i.hours, 0);
    return { subtotal, total, totalHours };
  }

  it("calcula subtotal de itens", () => {
    const { subtotal } = calcularTotalFatura(
      [{ hours: 2, rate: 100 }, { hours: 3, rate: 150 }],
      0
    );
    expect(subtotal).toBe(650);
  });

  it("aplica desconto corretamente", () => {
    const { total } = calcularTotalFatura(
      [{ hours: 10, rate: 100 }],
      150
    );
    expect(total).toBe(850);
  });

  it("soma total de horas", () => {
    const { totalHours } = calcularTotalFatura(
      [{ hours: 2.5, rate: 100 }, { hours: 1.5, rate: 100 }],
      0
    );
    expect(totalHours).toBe(4);
  });

  it("retorna zero para lista vazia", () => {
    const { subtotal, total, totalHours } = calcularTotalFatura([], 0);
    expect(subtotal).toBe(0);
    expect(total).toBe(0);
    expect(totalHours).toBe(0);
  });
});
