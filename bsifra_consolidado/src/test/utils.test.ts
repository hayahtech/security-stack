import { describe, it, expect } from "vitest";
import { getDbErrorMessage } from "@/lib/utils";

describe("getDbErrorMessage", () => {
  it("retorna mensagem genérica para erros desconhecidos", () => {
    expect(getDbErrorMessage({ message: "some random db error" })).toBe(
      "Ocorreu um erro. Tente novamente."
    );
  });

  it("oculta detalhes de RLS", () => {
    expect(getDbErrorMessage({ message: "row level security policy violation" })).toBe(
      "Você não tem permissão para realizar esta ação."
    );
    expect(getDbErrorMessage({ message: "RLS check failed" })).toBe(
      "Você não tem permissão para realizar esta ação."
    );
  });

  it("trata chave duplicada", () => {
    expect(getDbErrorMessage({ message: "duplicate key value violates unique constraint" })).toBe(
      "Este registro já existe."
    );
    expect(getDbErrorMessage({ message: "unique constraint violation" })).toBe(
      "Este registro já existe."
    );
  });

  it("trata violação de foreign key", () => {
    expect(getDbErrorMessage({ message: "violates foreign key constraint" })).toBe(
      "Não é possível remover este item pois há registros relacionados."
    );
  });

  it("trata campos obrigatórios nulos", () => {
    expect(getDbErrorMessage({ message: "null value in column" })).toBe(
      "Preencha todos os campos obrigatórios."
    );
    expect(getDbErrorMessage({ message: "not null constraint" })).toBe(
      "Preencha todos os campos obrigatórios."
    );
  });

  it("trata erros de rede", () => {
    expect(getDbErrorMessage({ message: "failed to fetch" })).toBe(
      "Erro de conexão. Verifique sua internet e tente novamente."
    );
    expect(getDbErrorMessage({ message: "network error" })).toBe(
      "Erro de conexão. Verifique sua internet e tente novamente."
    );
  });

  it("trata erros de autenticação/JWT", () => {
    expect(getDbErrorMessage({ message: "JWT expired" })).toBe(
      "Sessão expirada. Faça login novamente."
    );
    expect(getDbErrorMessage({ message: "unauthorized access" })).toBe(
      "Sessão expirada. Faça login novamente."
    );
  });

  it("trata rate limiting", () => {
    expect(getDbErrorMessage({ message: "too many requests" })).toBe(
      "Muitas requisições. Aguarde alguns instantes."
    );
    expect(getDbErrorMessage({ message: "rate limit exceeded" })).toBe(
      "Muitas requisições. Aguarde alguns instantes."
    );
  });

  it("trata input sem message", () => {
    expect(getDbErrorMessage({})).toBe("Ocorreu um erro. Tente novamente.");
    expect(getDbErrorMessage(null)).toBe("Ocorreu um erro. Tente novamente.");
    expect(getDbErrorMessage(undefined)).toBe("Ocorreu um erro. Tente novamente.");
  });
});
