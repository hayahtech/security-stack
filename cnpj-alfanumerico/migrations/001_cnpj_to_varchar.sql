-- =============================================================================
-- Migration: Adequação ao CNPJ Alfanumérico (IN RFB nº 2.119/2022)
-- =============================================================================
-- Converte colunas de CNPJ de tipos numéricos (bigint/numeric) para CHAR(14).
-- Armazena SEM máscara, SEMPRE em maiúsculas.
--
-- IMPORTANTE:
--   1) Fazer backup antes de rodar em produção.
--   2) Ajustar nomes de tabelas/colunas conforme o seu schema.
--   3) Rodar dentro de uma transação.
--   4) Revisar/recriar índices — o plano de execução muda com tipos textuais.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Exemplo para tabela "clientes" (repetir o bloco para cada tabela afetada)
-- -----------------------------------------------------------------------------

-- 1.1) Remover índice antigo (será recriado ao final com o novo tipo)
DROP INDEX IF EXISTS idx_clientes_cnpj;

-- 1.2) Alterar o tipo da coluna para CHAR(14)
--      LPAD garante que CNPJs numéricos curtos fiquem com 14 posições.
ALTER TABLE clientes
  ALTER COLUMN cnpj TYPE CHAR(14)
  USING LPAD(UPPER(REGEXP_REPLACE(cnpj::text, '[^A-Za-z0-9]', '', 'g')), 14, '0');

-- 1.3) Constraint de formato: 12 primeiras posições alfanuméricas, 2 últimas numéricas
ALTER TABLE clientes
  DROP CONSTRAINT IF EXISTS clientes_cnpj_formato_chk;
ALTER TABLE clientes
  ADD CONSTRAINT clientes_cnpj_formato_chk
  CHECK (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$');

-- 1.4) Recriar índice (B-tree único é ideal para lookups exatos de CNPJ)
CREATE UNIQUE INDEX idx_clientes_cnpj ON clientes (cnpj);

-- -----------------------------------------------------------------------------
-- 2) Função de validação do DV em PL/pgSQL (opcional, mas recomendada)
--    Permite usar CHECK constraints que validem o DV direto no banco.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_cnpj_valido(p_cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_cnpj  TEXT;
  v_sum   INT;
  v_rest  INT;
  v_dv1   INT;
  v_dv2   INT;
  v_w1    INT[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  v_w2    INT[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  v_val   INT;
  i       INT;
BEGIN
  IF p_cnpj IS NULL THEN
    RETURN FALSE;
  END IF;

  v_cnpj := UPPER(REGEXP_REPLACE(p_cnpj, '[^A-Za-z0-9]', '', 'g'));

  IF v_cnpj !~ '^[A-Z0-9]{12}[0-9]{2}$' THEN
    RETURN FALSE;
  END IF;

  -- Rejeita sequências totalmente repetidas
  IF v_cnpj ~ '^(.)\1{13}$' THEN
    RETURN FALSE;
  END IF;

  -- Cálculo do 1º DV
  v_sum := 0;
  FOR i IN 1..12 LOOP
    v_val := ASCII(SUBSTRING(v_cnpj, i, 1)) - 48;
    v_sum := v_sum + v_val * v_w1[i];
  END LOOP;
  v_rest := v_sum % 11;
  v_dv1  := CASE WHEN v_rest < 2 THEN 0 ELSE 11 - v_rest END;

  IF v_dv1 <> (SUBSTRING(v_cnpj, 13, 1))::INT THEN
    RETURN FALSE;
  END IF;

  -- Cálculo do 2º DV
  v_sum := 0;
  FOR i IN 1..13 LOOP
    v_val := ASCII(SUBSTRING(v_cnpj, i, 1)) - 48;
    v_sum := v_sum + v_val * v_w2[i];
  END LOOP;
  v_rest := v_sum % 11;
  v_dv2  := CASE WHEN v_rest < 2 THEN 0 ELSE 11 - v_rest END;

  IF v_dv2 <> (SUBSTRING(v_cnpj, 14, 1))::INT THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2.1) Constraint adicional validando o DV matematicamente
ALTER TABLE clientes
  DROP CONSTRAINT IF EXISTS clientes_cnpj_dv_chk;
ALTER TABLE clientes
  ADD CONSTRAINT clientes_cnpj_dv_chk
  CHECK (fn_cnpj_valido(cnpj));

COMMIT;

-- =============================================================================
-- ROLLBACK (manual, caso necessário):
--   ALTER TABLE clientes DROP CONSTRAINT clientes_cnpj_dv_chk;
--   ALTER TABLE clientes DROP CONSTRAINT clientes_cnpj_formato_chk;
--   ALTER TABLE clientes ALTER COLUMN cnpj TYPE BIGINT USING cnpj::BIGINT;
-- (só funcionará se nenhuma linha contiver letras)
-- =============================================================================
