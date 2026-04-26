-- =============================================================================
-- Migration: CNPJ Alfanumérico + Tabela Empresas
-- Conforme IN RFB nº 2.119/2022
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Função de validação de CNPJ alfanumérico em PL/pgSQL
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
  IF p_cnpj IS NULL THEN RETURN FALSE; END IF;

  v_cnpj := UPPER(REGEXP_REPLACE(p_cnpj, '[^A-Za-z0-9]', '', 'g'));

  IF v_cnpj !~ '^[A-Z0-9]{12}[0-9]{2}$' THEN RETURN FALSE; END IF;
  IF v_cnpj ~ '^(.)\1{13}$' THEN RETURN FALSE; END IF;

  -- 1º DV
  v_sum := 0;
  FOR i IN 1..12 LOOP
    v_val := ASCII(SUBSTRING(v_cnpj, i, 1)) - 48;
    v_sum := v_sum + v_val * v_w1[i];
  END LOOP;
  v_rest := v_sum % 11;
  v_dv1  := CASE WHEN v_rest < 2 THEN 0 ELSE 11 - v_rest END;
  IF v_dv1 <> (SUBSTRING(v_cnpj, 13, 1))::INT THEN RETURN FALSE; END IF;

  -- 2º DV
  v_sum := 0;
  FOR i IN 1..13 LOOP
    v_val := ASCII(SUBSTRING(v_cnpj, i, 1)) - 48;
    v_sum := v_sum + v_val * v_w2[i];
  END LOOP;
  v_rest := v_sum % 11;
  v_dv2  := CASE WHEN v_rest < 2 THEN 0 ELSE 11 - v_rest END;
  IF v_dv2 <> (SUBSTRING(v_cnpj, 14, 1))::INT THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- 2) Tabela de empresas/filiais
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.empresas (
  cnpj         CHAR(14)     NOT NULL,
  nome         TEXT         NOT NULL,
  nome_fantasia TEXT,
  logradouro   TEXT,
  municipio    TEXT,
  uf           CHAR(2),
  ativo        BOOLEAN      NOT NULL DEFAULT true,
  criado_em    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT empresas_pkey PRIMARY KEY (cnpj),
  CONSTRAINT empresas_cnpj_formato_chk
    CHECK (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  CONSTRAINT empresas_cnpj_dv_chk
    CHECK (fn_cnpj_valido(cnpj))
);

-- Índice para buscas por nome
CREATE INDEX IF NOT EXISTS idx_empresas_nome ON public.empresas (nome);
CREATE INDEX IF NOT EXISTS idx_empresas_uf   ON public.empresas (uf);

-- -----------------------------------------------------------------------------
-- 3) RLS para empresas
-- -----------------------------------------------------------------------------
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem consultar empresas ativas
CREATE POLICY "usuarios_leem_empresas_ativas"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (ativo = true);

-- Apenas supervisores ativos podem inserir/atualizar empresas
CREATE POLICY "supervisores_gerenciam_empresas"
  ON public.empresas FOR ALL
  TO authenticated
  USING (
    (SELECT r.role FROM public.get_user_role(auth.uid()) r
     WHERE r.status = 'active' AND r.role = 'supervisor') IS NOT NULL
  );

-- -----------------------------------------------------------------------------
-- 4) Tabela de checklists persistidos
--    (complementa o IndexedDB local, armazena o registro final aprovado)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checklists (
  id              UUID         NOT NULL DEFAULT gen_random_uuid(),
  cnpj_empresa    CHAR(14)     NOT NULL,
  tipo            TEXT         NOT NULL CHECK (tipo IN ('inbound', 'outbound', 'audit')),
  status_final    TEXT         NOT NULL CHECK (status_final IN ('approved', 'rejected', 'pending')),
  inspector_id    UUID         NOT NULL REFERENCES auth.users(id),
  supervisor_id   UUID         REFERENCES auth.users(id),
  dados_json      JSONB        NOT NULL,
  geo_lat         NUMERIC(10,7),
  geo_lng         NUMERIC(10,7),
  geo_accuracy_m  NUMERIC,
  criado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  finalizado_em   TIMESTAMPTZ,

  CONSTRAINT checklists_pkey PRIMARY KEY (id),
  CONSTRAINT checklists_cnpj_fk
    FOREIGN KEY (cnpj_empresa) REFERENCES public.empresas(cnpj),
  CONSTRAINT checklists_cnpj_formato_chk
    CHECK (cnpj_empresa ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  CONSTRAINT checklists_cnpj_dv_chk
    CHECK (fn_cnpj_valido(cnpj_empresa))
);

CREATE INDEX IF NOT EXISTS idx_checklists_cnpj       ON public.checklists (cnpj_empresa);
CREATE INDEX IF NOT EXISTS idx_checklists_inspector  ON public.checklists (inspector_id);
CREATE INDEX IF NOT EXISTS idx_checklists_criado_em  ON public.checklists (criado_em DESC);

-- -----------------------------------------------------------------------------
-- 5) RLS para checklists
-- -----------------------------------------------------------------------------
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Inspector vê apenas seus próprios checklists
CREATE POLICY "inspector_ve_proprios_checklists"
  ON public.checklists FOR SELECT
  TO authenticated
  USING (inspector_id = auth.uid());

-- Supervisor vê todos os checklists
CREATE POLICY "supervisor_ve_todos_checklists"
  ON public.checklists FOR SELECT
  TO authenticated
  USING (
    (SELECT r.role FROM public.get_user_role(auth.uid()) r
     WHERE r.status = 'active' AND r.role = 'supervisor') IS NOT NULL
  );

-- Inspector pode inserir checklists como ele mesmo
CREATE POLICY "inspector_insere_checklist"
  ON public.checklists FOR INSERT
  TO authenticated
  WITH CHECK (inspector_id = auth.uid());

-- Supervisor pode atualizar (aprovar/devolver) checklists
CREATE POLICY "supervisor_atualiza_checklist"
  ON public.checklists FOR UPDATE
  TO authenticated
  USING (
    (SELECT r.role FROM public.get_user_role(auth.uid()) r
     WHERE r.status = 'active' AND r.role = 'supervisor') IS NOT NULL
  );

-- -----------------------------------------------------------------------------
-- 6) View: resumo de auditorias por empresa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_resumo_por_empresa AS
SELECT
  e.cnpj,
  e.nome,
  e.municipio,
  e.uf,
  COUNT(c.id)                                                        AS total_checklists,
  COUNT(c.id) FILTER (WHERE c.status_final = 'approved')            AS aprovados,
  COUNT(c.id) FILTER (WHERE c.status_final = 'rejected')            AS rejeitados,
  COUNT(c.id) FILTER (WHERE c.status_final = 'pending')             AS pendentes,
  MAX(c.criado_em)                                                   AS ultima_auditoria
FROM public.empresas e
LEFT JOIN public.checklists c ON c.cnpj_empresa = e.cnpj
GROUP BY e.cnpj, e.nome, e.municipio, e.uf;

COMMIT;
