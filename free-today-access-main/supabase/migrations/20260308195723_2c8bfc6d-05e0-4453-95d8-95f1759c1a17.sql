
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  table_name text,
  record_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check ownership/manager role
CREATE OR REPLACE FUNCTION public.is_owner_or_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants WHERE owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.restaurant_members 
    WHERE user_id = _user_id AND role IN ('dono', 'gerente') AND status = 'ativo'
  );
$$;

-- Only owner/manager can read
CREATE POLICY "Owner and manager can read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_owner_or_manager(auth.uid()));

-- No direct insert/update/delete for users (only via triggers with SECURITY DEFINER)
-- We won't create INSERT/UPDATE/DELETE policies

-- Create the audit trigger function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _email text;
  _action text;
  _old jsonb;
  _new jsonb;
  _record_id text;
BEGIN
  _user_id := auth.uid();
  
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  
  IF TG_OP = 'INSERT' THEN
    _action := 'INSERT';
    _old := NULL;
    _new := to_jsonb(NEW);
    _record_id := NEW.id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'UPDATE';
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _record_id := NEW.id::text;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'DELETE';
    _old := to_jsonb(OLD);
    _new := NULL;
    _record_id := OLD.id::text;
  END IF;

  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_value, new_value)
  VALUES (_user_id, _email, _action, TG_TABLE_NAME, _record_id, _old, _new);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers on critical tables
CREATE TRIGGER audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_cash_sessions AFTER INSERT OR UPDATE OR DELETE ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_cash_movements AFTER INSERT OR UPDATE OR DELETE ON public.cash_movements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_loans AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_menu_items AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_coupons AFTER INSERT OR UPDATE OR DELETE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_loyalty_points AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_bills AFTER INSERT OR UPDATE OR DELETE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Index for common queries
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
