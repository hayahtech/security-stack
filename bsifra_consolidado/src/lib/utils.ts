import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte erros do Supabase/internos em mensagens seguras para o usuário.
 * Nunca expõe detalhes de implementação (RLS, schema, stack trace).
 */
export function getDbErrorMessage(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? "";

  if (msg.includes("row level security") || msg.includes("rls")) {
    return "Você não tem permissão para realizar esta ação.";
  }
  if (msg.includes("duplicate key") || msg.includes("unique constraint") || msg.includes("already exists")) {
    return "Este registro já existe.";
  }
  if (msg.includes("foreign key") || msg.includes("violates")) {
    return "Não é possível remover este item pois há registros relacionados.";
  }
  if (msg.includes("not null") || msg.includes("null value")) {
    return "Preencha todos os campos obrigatórios.";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }
  if (msg.includes("jwt") || msg.includes("auth") || msg.includes("unauthorized")) {
    return "Sessão expirada. Faça login novamente.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Muitas requisições. Aguarde alguns instantes.";
  }
  return "Ocorreu um erro. Tente novamente.";
}
