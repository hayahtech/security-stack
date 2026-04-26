-- =============================================================================
-- Migration: Função server-side para aprovar/bloquear usuários
-- Corrige: reviewed_by sendo definido no cliente (privilege escalation)
-- =============================================================================

BEGIN;

-- Função SECURITY DEFINER — executa com privilégios do owner, não do caller.
-- Valida que quem chama é inspector ativo ANTES de gravar reviewed_by = auth.uid().
-- Isso impede que um usuário falsifique quem aprovou a conta.
CREATE OR REPLACE FUNCTION public.review_user(
  p_target_id UUID,
  p_new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role   TEXT;
  v_caller_status TEXT;
BEGIN
  -- 1) Valida status do chamador
  SELECT role, status
    INTO v_caller_role, v_caller_status
    FROM public.profiles
   WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  IF v_caller_role <> 'inspector' OR v_caller_status <> 'active' THEN
    RAISE EXCEPTION 'Permissão negada: apenas inspetores ativos podem revisar usuários.';
  END IF;

  -- 2) Valida status alvo
  IF p_new_status NOT IN ('active', 'blocked') THEN
    RAISE EXCEPTION 'Status inválido: %', p_new_status;
  END IF;

  -- 3) Impede auto-bloqueio
  IF p_target_id = auth.uid() THEN
    RAISE EXCEPTION 'Não é permitido alterar o próprio status.';
  END IF;

  -- 4) Aplica alteração com reviewed_by = auth.uid() — definido server-side
  UPDATE public.profiles
     SET status      = p_new_status,
         reviewed_at = now(),
         reviewed_by = auth.uid()
   WHERE id = p_target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário alvo não encontrado.';
  END IF;
END;
$$;

-- Revoga execução pública; apenas usuários autenticados podem chamar
REVOKE EXECUTE ON FUNCTION public.review_user(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.review_user(UUID, TEXT) TO authenticated;

COMMIT;
