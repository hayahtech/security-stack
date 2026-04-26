import { describe, it, expect } from "vitest";
import {
  isValidCnpj,
  calcCnpjDv,
  parseCnpj,
  cleanCnpj,
  formatCnpj,
  isValidCpf,
  cleanCpf,
  formatCpf,
  isValidDocument,
  validateDocument,
  formatDocument,
  detectDocumentType,
} from "@/lib/cnpj";

// ─── CNPJ Alfanumérico ────────────────────────────────────────────────────────

describe("CNPJ alfanumérico — cálculo de DV (novo formato julho/2026+)", () => {
  it("Exemplo oficial RFB: 12ABC34501DE -> DV 35", () => {
    expect(calcCnpjDv("12ABC34501DE")).toBe("35");
    expect(isValidCnpj("12ABC34501DE35")).toBe(true);
    expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
  });

  it("aceita CNPJ alfanumérico com letras em maiúsculas e minúsculas (normaliza)", () => {
    expect(isValidCnpj("12.abc.345/01de-35")).toBe(true);
  });

  it("aceita CNPJ numérico legado (retrocompatibilidade)", () => {
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });
});

describe("CNPJ — formatos inválidos", () => {
  it("rejeita tamanho errado", () => {
    expect(isValidCnpj("123")).toBe(false);
    expect(isValidCnpj("12ABC34501DE3")).toBe(false);
    expect(isValidCnpj("12ABC34501DE355")).toBe(false);
  });

  it("rejeita sequências totalmente repetidas", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("AAAAAAAAAAAAAA")).toBe(false);
  });

  it("rejeita caracteres especiais (cedilha, acento)", () => {
    expect(isValidCnpj("12ÇBC34501DE35")).toBe(false);
    expect(isValidCnpj("12ÁBC34501DE35")).toBe(false);
  });

  it("rejeita letras nos 2 últimos dígitos (DV é sempre numérico)", () => {
    expect(isValidCnpj("12ABC34501DEAB")).toBe(false);
  });

  it("rejeita DV incorreto", () => {
    expect(isValidCnpj("12ABC34501DE00")).toBe(false);
    expect(isValidCnpj("12ABC34501DE34")).toBe(false);
  });

  it("rejeita input null/undefined/vazio", () => {
    expect(isValidCnpj("")).toBe(false);
    // @ts-expect-error teste de runtime
    expect(isValidCnpj(null)).toBe(false);
    // @ts-expect-error teste de runtime
    expect(isValidCnpj(undefined)).toBe(false);
  });
});

describe("CNPJ — helpers", () => {
  it("cleanCnpj remove máscara e normaliza maiúsculas", () => {
    expect(cleanCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
  });

  it("formatCnpj aplica máscara padrão XX.XXX.XXX/XXXX-XX", () => {
    expect(formatCnpj("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("parseCnpj retorna Brand Type quando válido e lança quando inválido", () => {
    const cnpj = parseCnpj("12.ABC.345/01DE-35");
    expect(cnpj).toBe("12ABC34501DE35");
    expect(() => parseCnpj("invalido")).toThrow();
  });

  it("calcCnpjDv valida tamanho do corpo", () => {
    expect(() => calcCnpjDv("123")).toThrow();
    expect(() => calcCnpjDv("12ABC34501D")).toThrow();
  });
});

// ─── CPF ─────────────────────────────────────────────────────────────────────

describe("CPF — validação", () => {
  it("aceita CPF válido com e sem máscara", () => {
    // CPF de exemplo com DV válido
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita sequências repetidas", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });

  it("rejeita DV incorreto", () => {
    expect(isValidCpf("529.982.247-00")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidCpf("1234567890")).toBe(false);   // 10 dígitos
    expect(isValidCpf("123456789012")).toBe(false);  // 12 dígitos
  });

  it("cleanCpf remove máscara", () => {
    expect(cleanCpf("529.982.247-25")).toBe("52998224725");
  });

  it("formatCpf aplica máscara XXX.XXX.XXX-XX", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
});

// ─── Documento combinado ──────────────────────────────────────────────────────

describe("detectDocumentType", () => {
  it("detecta CNPJ por 14 posições", () => {
    expect(detectDocumentType("12ABC34501DE35")).toBe("cnpj");
    expect(detectDocumentType("11.222.333/0001-81")).toBe("cnpj");
  });

  it("detecta CPF por 11 dígitos", () => {
    expect(detectDocumentType("52998224725")).toBe("cpf");
    expect(detectDocumentType("529.982.247-25")).toBe("cpf");
  });

  it("retorna unknown para tamanhos ambíguos", () => {
    expect(detectDocumentType("123")).toBe("unknown");
    expect(detectDocumentType("")).toBe("unknown");
  });
});

describe("isValidDocument", () => {
  it("valida CNPJ alfanumérico", () => {
    expect(isValidDocument("12.ABC.345/01DE-35")).toBe(true);
  });

  it("valida CNPJ numérico legado", () => {
    expect(isValidDocument("11.222.333/0001-81")).toBe(true);
  });

  it("valida CPF", () => {
    expect(isValidDocument("529.982.247-25")).toBe(true);
  });

  it("rejeita documentos inválidos", () => {
    expect(isValidDocument("12.ABC.345/01DE-00")).toBe(false); // DV errado
    expect(isValidDocument("529.982.247-00")).toBe(false);     // DV errado
    expect(isValidDocument("123")).toBe(false);                // tamanho
    expect(isValidDocument("")).toBe(false);
  });
});

describe("validateDocument (para campo de formulário)", () => {
  it("retorna null para campo vazio (opcional)", () => {
    expect(validateDocument("")).toBeNull();
    expect(validateDocument("   ")).toBeNull();
  });

  it("retorna null para CNPJ alfanumérico válido", () => {
    expect(validateDocument("12.ABC.345/01DE-35")).toBeNull();
  });

  it("retorna null para CNPJ numérico válido", () => {
    expect(validateDocument("11.222.333/0001-81")).toBeNull();
  });

  it("retorna null para CPF válido", () => {
    expect(validateDocument("529.982.247-25")).toBeNull();
  });

  it("retorna erro para CNPJ com DV incorreto", () => {
    const err = validateDocument("12.ABC.345/01DE-00");
    expect(err).toContain("CNPJ inválido");
  });

  it("retorna erro para CPF com DV incorreto", () => {
    const err = validateDocument("529.982.247-00");
    expect(err).toContain("CPF inválido");
  });

  it("retorna orientação para tamanho ambíguo", () => {
    const err = validateDocument("12345");
    expect(err).toContain("CNPJ");
    expect(err).toContain("CPF");
  });
});

describe("formatDocument", () => {
  it("formata CNPJ alfanumérico com máscara", () => {
    expect(formatDocument("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
  });

  it("formata CPF com máscara", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
  });

  it("retorna input original quando não reconhece", () => {
    expect(formatDocument("123")).toBe("123");
  });
});
