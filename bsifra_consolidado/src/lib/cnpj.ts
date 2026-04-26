/**
 * CNPJ Alfanumérico + CPF — Validação, formatação e cálculo de DV.
 *
 * CNPJ: conforme Anexo XV da IN RFB nº 2.119/2022.
 *   A partir de julho/2026 a RFB emite CNPJs com letras nas 8 primeiras
 *   posições da raiz (ex.: 12.ABC.345/01DE-35). A mesma função valida
 *   o formato legado numérico (retrocompatível via ASCII-48).
 *
 * CPF: Módulo 11 padrão da Receita Federal.
 */

// ─── Brand Types ──────────────────────────────────────────────────────────────
declare const CnpjBrand: unique symbol;
declare const CpfBrand: unique symbol;
export type Cnpj = string & { readonly [CnpjBrand]: true };
export type Cpf = string & { readonly [CpfBrand]: true };

// ─── Constantes CNPJ ─────────────────────────────────────────────────────────
// 12 primeiras posições: A-Z e 0-9. 2 últimas (DV): apenas 0-9.
const CNPJ_BODY_REGEX = /^[A-Z0-9]{12}[0-9]{2}$/;
const CLEAN_CNPJ_REGEX = /[^A-Z0-9]/g;
const ALL_SAME_REGEX = /^(.)\1{13}$/;

const WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

// ─── Helpers CNPJ ────────────────────────────────────────────────────────────
/** Remove máscara e normaliza para maiúsculas. */
export function cleanCnpj(input: string): string {
  return String(input ?? "").toUpperCase().replace(CLEAN_CNPJ_REGEX, "");
}

/** Valor numérico de um caractere: ASCII(ch) - 48. */
function charValue(ch: string): number {
  return ch.charCodeAt(0) - 48;
}

function calcDv(chars: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < chars.length; i++) {
    sum += charValue(chars[i]) * weights[i];
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

// ─── CNPJ Público ────────────────────────────────────────────────────────────
/** Valida CNPJ numérico legado ou alfanumérico novo (julho/2026+). */
export function isValidCnpj(input: string): input is Cnpj {
  const cnpj = cleanCnpj(input);
  if (cnpj.length !== 14) return false;
  if (!CNPJ_BODY_REGEX.test(cnpj)) return false;
  if (ALL_SAME_REGEX.test(cnpj)) return false;

  const dv1 = calcDv(cnpj.slice(0, 12), WEIGHTS_DV1);
  if (dv1 !== Number(cnpj[12])) return false;

  const dv2 = calcDv(cnpj.slice(0, 13), WEIGHTS_DV2);
  if (dv2 !== Number(cnpj[13])) return false;

  return true;
}

/** Gera os dois DVs para uma raiz+ordem de 12 posições alfanuméricas. */
export function calcCnpjDv(body12: string): string {
  const clean = cleanCnpj(body12);
  if (clean.length !== 12 || !/^[A-Z0-9]{12}$/.test(clean)) {
    throw new Error("Corpo do CNPJ deve ter 12 caracteres alfanuméricos (A-Z, 0-9).");
  }
  const dv1 = calcDv(clean, WEIGHTS_DV1);
  const dv2 = calcDv(clean + String(dv1), WEIGHTS_DV2);
  return `${dv1}${dv2}`;
}

/** Constrói um `Cnpj` (Brand Type) validado, ou lança erro. */
export function parseCnpj(input: string): Cnpj {
  const clean = cleanCnpj(input);
  if (!isValidCnpj(clean)) throw new Error(`CNPJ inválido: ${input}`);
  return clean as Cnpj;
}

/** Formata no padrão XX.XXX.XXX/XXXX-XX. */
export function formatCnpj(input: string): string {
  const c = cleanCnpj(input);
  if (c.length !== 14) throw new Error("CNPJ deve ter 14 caracteres.");
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

// ─── CPF ─────────────────────────────────────────────────────────────────────
const CLEAN_CPF_REGEX = /\D/g;
const ALL_SAME_CPF_REGEX = /^(.)\1{10}$/;

export function cleanCpf(input: string): string {
  return String(input ?? "").replace(CLEAN_CPF_REGEX, "");
}

export function isValidCpf(input: string): input is Cpf {
  const cpf = cleanCpf(input);
  if (cpf.length !== 11) return false;
  if (ALL_SAME_CPF_REGEX.test(cpf)) return false;

  const calcCpfDv = (digits: string, len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };

  const dv1 = calcCpfDv(cpf, 9);
  if (dv1 !== Number(cpf[9])) return false;

  const dv2 = calcCpfDv(cpf, 10);
  if (dv2 !== Number(cpf[10])) return false;

  return true;
}

/** Formata no padrão XXX.XXX.XXX-XX. */
export function formatCpf(input: string): string {
  const c = cleanCpf(input);
  if (c.length !== 11) throw new Error("CPF deve ter 11 dígitos.");
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9, 11)}`;
}

// ─── Documento combinado (CNPJ ou CPF) ───────────────────────────────────────
export type DocumentType = "cnpj" | "cpf" | "unknown";

/** Detecta se o input (limpo) parece CNPJ (14) ou CPF (11). */
export function detectDocumentType(input: string): DocumentType {
  const cleanedCnpj = cleanCnpj(input);
  const cleanedCpf = cleanCpf(input);
  if (cleanedCnpj.length === 14) return "cnpj";
  if (cleanedCpf.length === 11) return "cpf";
  return "unknown";
}

/** Valida CNPJ ou CPF — escolhe automaticamente pelo tamanho. */
export function isValidDocument(input: string): boolean {
  const type = detectDocumentType(input);
  if (type === "cnpj") return isValidCnpj(input);
  if (type === "cpf") return isValidCpf(input);
  return false;
}

/**
 * Formata e retorna o documento com máscara adequada.
 * Retorna o input original se não reconhecer o tipo.
 */
export function formatDocument(input: string): string {
  const type = detectDocumentType(input);
  try {
    if (type === "cnpj") return formatCnpj(input);
    if (type === "cpf") return formatCpf(input);
  } catch {
    // input inválido — retorna como está
  }
  return input;
}

/**
 * Retorna mensagem de erro para o campo documento, ou null se válido/vazio.
 * Aceita string vazia (campo opcional).
 */
export function validateDocument(input: string): string | null {
  if (!input || input.trim() === "") return null;
  const type = detectDocumentType(input);
  if (type === "unknown") return "Informe um CNPJ (14 pos.) ou CPF (11 dígitos) válido.";
  if (type === "cnpj" && !isValidCnpj(input)) return "CNPJ inválido. Verifique os dígitos verificadores.";
  if (type === "cpf" && !isValidCpf(input)) return "CPF inválido. Verifique os dígitos verificadores.";
  return null;
}
