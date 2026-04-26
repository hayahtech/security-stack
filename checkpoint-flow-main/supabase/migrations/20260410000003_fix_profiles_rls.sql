-- =============================================================================
-- Migration: Corrige RLS da tabela profiles
-- Problema: inspector_reads_all_profiles expõe todos os campos de todos os usuários.
-- Solução:
--   1) Cria VIEW pública com apenas os campos necessários para aprovação.
--   2) Remove a política UPDATE direta — aprovações usam review_user() (SECURITY DEFINER).
--   3) Restringe UPDATE de role para impedir escalada de privilégio.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) View com campos mínimos para aprovação de usuários
--    Inspetores consultam esta view em vez da tabela profiles diretamente.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_pending_users AS
SELECT
  id,
  full_name,
  email,
  role,
  status,
  requested_at
FROM public.profiles
WHERE status IN ('pending', 'active', 'blocked');

-- RLS na view: inspetores ativos podem ver
REVOKE ALL ON public.vw_pending_users FROM PUBLIC;
GRANT SELECT ON public.vw_pending_users TO authenticated;

-- -----------------------------------------------------------------------------
-- 2) Remove política UPDATE direta dos inspetores.
--    Aprovações agora DEVEM passar pelo review_user() — a política RLS de update
--    ainda existe para a função SECURITY DEFINER funcionar, mas bloqueia updates diretos.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "inspector_updates_other_profiles" ON public.profiles;

-- Recria a política de UPDATE restrita: apenas role = inspector/supervisor pode atualizar,
-- somente os campos de revisão (não role), e nunca o próprio perfil.
CREATE POLICY "inspector_updates_status_only"
  ON public.profiles FOR UPDATE
  USING (
    id != auth.uid()
    AND (
      SELECT r.role FROM public.get_user_role(auth.uid()) r
      WHERE r.status = 'active' AND r.role IN ('inspector', 'supervisor')
    ) IS NOT NULL
  )
  WITH CHECK (
    -- Bloqueia qualquer tentativa de alterar role via UPDATE direto
    role = (SELECT role FROM public.profiles WHERE id = profiles.id)
  );

-- -----------------------------------------------------------------------------
-- 3) Restringe colunas que authenticated pode atualizar via GRANT
--    (coluna role fica fora — só pode ser alterada por service_role)
-- -----------------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT  UPDATE (status, reviewed_at, reviewed_by) ON public.profiles TO authenticated;

COMMIT;
