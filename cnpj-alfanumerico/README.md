# CNPJ Alfanumérico

Implementação de referência para adequação ao **CNPJ alfanumérico** (Anexo XV da IN RFB nº 2.119/2022).

## Estrutura

```
src/cnpj.ts                          # Validador + cálculo de DV + Brand Type
tests/cnpj.test.ts                   # Testes (Vitest) — casos oficiais da RFB
migrations/001_cnpj_to_varchar.sql   # Migration Postgres: bigint -> CHAR(14)
```

## Regra principal (Módulo 11 com ASCII-48)

- 14 posições: 12 primeiras alfanuméricas (`A-Z`, `0-9`), 2 últimas numéricas (DV).
- Para cada caractere, valor = `ASCII(char) - 48`:
  - `'0'..'9'` → `0..9`
  - `'A'..'Z'` → `17..42`
- Pesos da direita para esquerda: `2..9`, reiniciando em `2` a partir do 8º caractere.
- Soma × pesos, `mod 11`. Se `resto < 2` → DV = 0, senão DV = `11 - resto`.

## Função única (sem `if` para legado)

Como `'0'..'9'` mantêm valor `0..9` mesmo após `ASCII - 48`, a **mesma função valida CNPJs numéricos antigos e alfanuméricos novos**. Não há ramificações por formato.

## Uso

```ts
import { parseCnpj, isValidCnpj, calcCnpjDv, formatCnpj } from "./src/cnpj";

isValidCnpj("12.ABC.345/01DE-35"); // true (exemplo oficial da RFB)
calcCnpjDv("12ABC34501DE");        // "35"
formatCnpj("12ABC34501DE35");      // "12.ABC.345/01DE-35"

// Brand Type: só aceita strings que passaram pela validação.
const cnpj = parseCnpj("12.ABC.345/01DE-35"); // tipo `Cnpj`
saveToDb(cnpj); // saveToDb(c: Cnpj) — TS recusa string comum
```

## Banco de dados

1. **Backup** antes de migrar.
2. Alterar colunas numéricas (`bigint`/`numeric`) para `CHAR(14)` — ver `migrations/001_cnpj_to_varchar.sql`.
3. **Revisar índices**: recriar como B-tree em texto; lookups exatos continuam O(log n).
4. Armazenar **sempre sem máscara e em maiúsculas** (`CLEAN_REGEX` + `toUpperCase`).
5. A migration inclui `fn_cnpj_valido()` em PL/pgSQL para validar o DV dentro do banco.

## Testes

```bash
npm install
npm test
```

Cobertura dos testes:
- Exemplo oficial da RFB (`12.ABC.345/01DE-35`).
- CNPJs numéricos legados (retrocompatibilidade).
- Tamanhos inválidos, sequências repetidas, caracteres especiais (cedilha/acento), DV incorreto, null/undefined.

Para gerar massa adicional, usar o **simulador da Receita Federal** (matrizes e filiais no novo formato alfanumérico).
