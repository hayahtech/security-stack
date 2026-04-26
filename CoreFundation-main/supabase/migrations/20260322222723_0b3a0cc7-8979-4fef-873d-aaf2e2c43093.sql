
-- ============================================
-- ERP CORE: Multi-Tenant Foundation Schema
-- ============================================

-- 1. ENUM TYPES
CREATE TYPE public.tenant_plan AS ENUM ('basic', 'pro', 'enterprise');
CREATE TYPE public.tenant_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive');
CREATE TYPE public.audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS');

-- 2. TENANTS TABLE
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  plan tenant_plan NOT NULL DEFAULT 'basic',
  status tenant_status NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES TABLE (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. ROLES TABLE
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 5. PERMISSIONS TABLE (global, not per-tenant)
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL DEFAULT 'core'
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 6. USER_ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. ROLE_PERMISSIONS TABLE
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 8. AUDIT_LOGS TABLE
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    JOIN public.roles r ON r.id = ur.role_id
    WHERE p.user_id = auth.uid()
      AND r.name = _role_name
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(_permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions perm ON perm.id = rp.permission_id
    WHERE p.user_id = auth.uid()
      AND perm.name = _permission_name
  );
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.get_user_tenant_id());

CREATE POLICY "Admins can update own tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id = public.get_user_tenant_id() AND public.user_has_role('admin'));

CREATE POLICY "Users can view tenant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.user_has_role('admin'));

CREATE POLICY "Admins can update tenant profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_role('admin'));

CREATE POLICY "Users can view tenant roles" ON public.roles
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.user_has_role('admin'));

CREATE POLICY "Authenticated can view permissions" ON public.permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view user_roles in tenant" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.user_has_role('admin') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id
        AND p.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "Users can view role_permissions in tenant" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (
    public.user_has_role('admin') AND
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "Users can view tenant audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED: Default Permissions
-- ============================================
INSERT INTO public.permissions (name, description, module) VALUES
  ('manage_users', 'Criar, editar e remover usuários', 'iam'),
  ('view_users', 'Visualizar usuários', 'iam'),
  ('manage_roles', 'Criar e editar roles e permissões', 'iam'),
  ('view_roles', 'Visualizar roles', 'iam'),
  ('manage_tenant', 'Configurar empresa/tenant', 'core'),
  ('view_audit_logs', 'Visualizar logs de auditoria', 'core'),
  ('manage_crm', 'Acesso completo ao CRM', 'crm'),
  ('view_crm', 'Visualizar dados do CRM', 'crm'),
  ('manage_finance', 'Acesso completo ao financeiro', 'finance'),
  ('view_finance', 'Visualizar dados financeiros', 'finance'),
  ('manage_inventory', 'Acesso completo ao estoque', 'inventory'),
  ('view_inventory', 'Visualizar estoque', 'inventory');

-- ============================================
-- HANDLE NEW USER (auto-creates tenant + profile + admin role)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
  _profile_id UUID;
  _admin_role_id UUID;
BEGIN
  INSERT INTO public.tenants (name, document, plan, status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    '',
    'basic',
    'active'
  )
  RETURNING id INTO _tenant_id;

  INSERT INTO public.profiles (user_id, tenant_id, name, email, status)
  VALUES (
    NEW.id,
    _tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'active'
  )
  RETURNING id INTO _profile_id;

  INSERT INTO public.roles (tenant_id, name, description, is_system)
  VALUES (_tenant_id, 'admin', 'Administrador com acesso total', true)
  RETURNING id INTO _admin_role_id;

  INSERT INTO public.roles (tenant_id, name, description, is_system) VALUES
    (_tenant_id, 'manager', 'Gerente com acesso intermediário', true),
    (_tenant_id, 'operator', 'Operador com acesso básico', true);

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (_profile_id, _admin_role_id);

  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT _admin_role_id, id FROM public.permissions;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
