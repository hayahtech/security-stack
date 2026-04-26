/**
 * CPF and CNPJ Validation Utilities
 * SECURITY FIX: Input validation to prevent invalid document numbers.
 *
 * CNPJ: suporta formato numérico legado E alfanumérico (IN RFB nº 2.119/2022,
 * vigente a partir de julho/2026). Módulo 11 com valor = ASCII(char) - 48.
 */

/** Remove non-digit characters from a string (CPF only). */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

// ── CNPJ helpers ──────────────────────────────────────────────────────────────
/** Remove máscara do CNPJ e normaliza para maiúsculas (mantém A-Z e 0-9). */
export function cleanCnpj(value: string): string {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Valor numérico de um caractere: ASCII(ch) - 48. '0'-'9' => 0-9 | 'A'-'Z' => 17-42. */
function cnpjCharValue(ch: string): number {
  return ch.charCodeAt(0) - 48;
}

const CNPJ_WEIGHTS1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcCnpjDv(chars: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < chars.length; i++) {
    sum += cnpjCharValue(chars[i]) * weights[i];
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/**
 * Validate a Brazilian CPF (Cadastro de Pessoas Físicas).
 * Checks format (11 digits) and both check digits.
 */
export function isValidCPF(cpf: string): boolean {
  const digits = digitsOnly(cpf);
  if (digits.length !== 11) return false;

  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10], 10)) return false;

  return true;
}

/**
 * Validate a Brazilian CNPJ — numeric legacy OR alphanumeric (July 2026+).
 * Uses Módulo 11 with ASCII-48 so the same function handles both formats.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const c = cleanCnpj(cnpj);
  if (c.length !== 14) return false;
  // 12 first positions: A-Z or 0-9; last 2 (DV): digits only
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(c)) return false;
  // Reject all-same sequences (e.g. 00000000000000, AAAAAAAAAAAAAA)
  if (/^(.)\1{13}$/.test(c)) return false;

  const dv1 = calcCnpjDv(c.slice(0, 12), CNPJ_WEIGHTS1);
  if (dv1 !== Number(c[12])) return false;

  const dv2 = calcCnpjDv(c.slice(0, 13), CNPJ_WEIGHTS2);
  if (dv2 !== Number(c[13])) return false;

  return true;
}

/**
 * Validate either CPF or CNPJ based on input length.
 * CNPJ detection uses cleaned alphanumeric length (14 chars A-Z/0-9).
 */
export function isValidDocument(doc: string): boolean {
  const cleanedCnpj = cleanCnpj(doc);
  const cleanedCpf = digitsOnly(doc);
  if (cleanedCpf.length === 11) return isValidCPF(doc);
  if (cleanedCnpj.length === 14) return isValidCNPJ(doc);
  return false;
}

// ── Máscaras progressivas (uso em onChange) ───────────────────────────────────

/**
 * Máscara progressiva para CNPJ — suporta numérico legado e alfanumérico (jul/2026).
 * Usar no onChange do input para formatar enquanto o usuário digita.
 */
export function maskCnpj(raw: string): string {
  const c = cleanCnpj(raw).slice(0, 14);
  if (c.length <= 2) return c;
  if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
  if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
  if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

/**
 * Máscara progressiva para CPF.
 */
export function maskCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Máscara automática: detecta CPF (≤11 dígitos, sem letras) ou CNPJ (demais casos).
 * Usar em campos que aceitam ambos os documentos.
 */
export function maskDocument(raw: string): string {
  const hasLetters = /[A-Z]/i.test(raw.replace(/[^A-Za-z]/g, ""));
  const digits = raw.replace(/\D/g, "");
  if (!hasLetters && digits.length <= 11) return maskCpf(raw);
  return maskCnpj(raw);
}

/**
 * Format a CPF string: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const d = digitsOnly(cpf).padStart(11, "0").slice(0, 11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/**
 * Format a CNPJ string: XX.XXX.XXX/XXXX-XX
 * Works for numeric legacy and alphanumeric (July 2026+).
 */
export function formatCNPJ(cnpj: string): string {
  const c = cleanCnpj(cnpj);
  if (c.length !== 14) return cnpj;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}
