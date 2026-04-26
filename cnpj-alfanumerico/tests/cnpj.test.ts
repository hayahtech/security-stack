import { describe, it, expect } from "vitest";
import {
  isValidCnpj,
  calcCnpjDv,
  parseCnpj,
  cleanCnpj,
  formatCnpj,
} from "../src/cnpj";

describe("CNPJ alfanumérico — cálculo de DV", () => {
  it("Exemplo oficial RFB: 12ABC34501DE -> DV 35", () => {
    expect(calcCnpjDv("12ABC34501DE")).toBe("35");
    expect(isValidCnpj("12ABC34501DE35")).toBe(true);
    expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
  });

  it("Aceita CNPJ numérico legado (retrocompatibilidade)", () => {
    // CNPJ real válido de exemplo: 11.222.333/0001-81
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });
});

describe("CNPJ — formatos inválidos", () => {
  it("Rejeita tamanho errado", () => {
    expect(isValidCnpj("123")).toBe(false);
    expect(isValidCnpj("12ABC34501DE3")).toBe(false);
    expect(isValidCnpj("12ABC34501DE355")).toBe(false);
  });

  it("Rejeita sequências repetidas", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("AAAAAAAAAAAAAA")).toBe(false);
  });

  it("Rejeita caracteres especiais (ex.: cedilha, acento)", () => {
    expect(isValidCnpj("12ÇBC34501DE35")).toBe(false);
    expect(isValidCnpj("12ÁBC34501DE35")).toBe(false);
  });

  it("Rejeita letras nos 2 últimos dígitos (DV é sempre numérico)", () => {
    expect(isValidCnpj("12ABC34501DEAB")).toBe(false);
  });

  it("Rejeita DV incorreto", () => {
    expect(isValidCnpj("12ABC34501DE00")).toBe(false);
    expect(isValidCnpj("12ABC34501DE34")).toBe(false);
  });

  it("Rejeita input null/undefined/vazio", () => {
    expect(isValidCnpj("")).toBe(false);
    // @ts-expect-error teste de runtime
    expect(isValidCnpj(null)).toBe(false);
    // @ts-expect-error teste de runtime
    expect(isValidCnpj(undefined)).toBe(false);
  });
});

describe("Helpers", () => {
  it("cleanCnpj remove máscara e normaliza maiúsculas", () => {
    expect(cleanCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
  });

  it("formatCnpj aplica máscara padrão", () => {
    expect(formatCnpj("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
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
