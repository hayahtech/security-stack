/**
 * CNPJ Alfanumérico — Validação e cálculo de DV
 * Conforme Anexo XV da IN RFB nº 2.119/2022.
 *
 * Regras:
 *  - 14 posições; 12 primeiras alfanuméricas (A-Z, 0-9), 2 últimas numéricas (DV).
 *  - Módulo 11 com valor = (ASCII do caractere) - 48.
 *  - Função única: funciona para CNPJ numérico legado E alfanumérico novo.
 */

// -------- Brand Type (tipo opaco) --------
declare const CnpjBrand: unique symbol;
export type Cnpj = string & { readonly [CnpjBrand]: true };

// -------- Regex --------
const CNPJ_BODY_REGEX = /^[A-Z0-9]{12}[0-9]{2}$/;
const CLEAN_REGEX = /[^A-Z0-9]/g;
const ALL_SAME_REGEX = /^(.)\1{13}$/;

const WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** Remove máscara e normaliza para maiúsculas. */
export function cleanCnpj(input: string): string {
  return String(input ?? '').toUpperCase().replace(CLEAN_REGEX, '');
}

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

/** Valida um CNPJ (numérico legado ou alfanumérico novo). */
export function isValidCnpj(input: string): input is Cnpj {
  const cnpj = cleanCnpj(input);
  if (cnpj.length !== 14) return false;
  if (!CNPJ_BODY_REGEX.test(cnpj)) return false;
  if (ALL_SAME_REGEX.test(cnpj)) return false;

  const body12 = cnpj.slice(0, 12);
  const dv1 = calcDv(body12, WEIGHTS_DV1);
  if (dv1 !== Number(cnpj[12])) return false;

  const body13 = cnpj.slice(0, 13);
  const dv2 = calcDv(body13, WEIGHTS_DV2);
  if (dv2 !== Number(cnpj[13])) return false;

  return true;
}

/** Gera os dois dígitos verificadores para uma raiz+ordem de 12 posições. */
export function calcCnpjDv(body12: string): string {
  const clean = cleanCnpj(body12);
  if (clean.length !== 12 || !/^[A-Z0-9]{12}$/.test(clean)) {
    throw new Error('Corpo do CNPJ deve ter 12 caracteres alfanuméricos (A-Z, 0-9).');
  }
  const dv1 = calcDv(clean, WEIGHTS_DV1);
  const dv2 = calcDv(clean + String(dv1), WEIGHTS_DV2);
  return `${dv1}${dv2}`;
}

/**
 * Constrói um Cnpj (Brand Type) a partir de uma string, ou lança erro.
 * Use como único ponto de entrada antes de persistir no banco.
 */
export function parseCnpj(input: string): Cnpj {
  const clean = cleanCnpj(input);
  if (!isValidCnpj(clean)) {
    throw new Error(`CNPJ inválido: ${input}`);
  }
  return clean as Cnpj;
}

/** Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX. */
export function formatCnpj(input: string): string {
  const c = cleanCnpj(input);
  if (c.length !== 14) throw new Error('CNPJ deve ter 14 caracteres.');
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

/** Aplica máscara progressiva enquanto o usuário digita. */
export function maskCnpj(input: string): string {
  const c = cleanCnpj(input).slice(0, 14);
  if (c.length <= 2) return c;
  if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
  if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
  if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}
