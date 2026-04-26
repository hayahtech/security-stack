
-- CRM Enums
CREATE TYPE public.customer_type AS ENUM ('lead', 'customer', 'partner');
CREATE TYPE public.customer_status AS ENUM ('active', 'inactive');
CREATE TYPE public.opportunity_stage AS ENUM ('lead', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  type public.customer_type NOT NULL DEFAULT 'lead',
  status public.customer_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant customers" ON public.customers
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant customers" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant customers" ON public.customers
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant customers" ON public.customers
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant contacts" ON public.contacts
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant contacts" ON public.contacts
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Opportunities table
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC(15,2) NOT NULL DEFAULT 0,
  stage public.opportunity_stage NOT NULL DEFAULT 'lead',
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant opportunities" ON public.opportunities
  FOR SELECT TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant opportunities" ON public.opportunities
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant opportunities" ON public.opportunities
  FOR UPDATE TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant opportunities" ON public.opportunities
  FOR DELETE TO authenticated USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add CRM permissions
INSERT INTO public.permissions (name, module, description) VALUES
  ('view_customers', 'crm', 'Visualizar clientes'),
  ('create_customers', 'crm', 'Criar clientes'),
  ('edit_customers', 'crm', 'Editar clientes'),
  ('delete_customers', 'crm', 'Excluir clientes'),
  ('view_contacts', 'crm', 'Visualizar contatos'),
  ('create_contacts', 'crm', 'Criar contatos'),
  ('edit_contacts', 'crm', 'Editar contatos'),
  ('delete_contacts', 'crm', 'Excluir contatos'),
  ('view_opportunities', 'crm', 'Visualizar oportunidades'),
  ('create_opportunities', 'crm', 'Criar oportunidades'),
  ('edit_opportunities', 'crm', 'Editar oportunidades'),
  ('delete_opportunities', 'crm', 'Excluir oportunidades');
