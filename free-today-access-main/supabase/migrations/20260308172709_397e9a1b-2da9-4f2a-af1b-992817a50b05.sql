
-- Create enums
CREATE TYPE public.transaction_type AS ENUM ('revenue', 'expense');
CREATE TYPE public.transaction_scope AS ENUM ('business', 'personal');
CREATE TYPE public.transaction_status AS ENUM ('paid', 'pending');
CREATE TYPE public.loan_status AS ENUM ('ativo', 'quitado');
CREATE TYPE public.installment_status AS ENUM ('pendente', 'pago', 'vencido');
CREATE TYPE public.supplier_category AS ENUM ('ingredientes', 'embalagens', 'equipamentos', 'outros');
CREATE TYPE public.product_unit AS ENUM ('kg', 'l', 'un', 'cx', 'g');
CREATE TYPE public.product_category AS ENUM ('ingrediente', 'embalagem', 'limpeza', 'outros');
CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida', 'ajuste');
CREATE TYPE public.employee_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.bill_type AS ENUM ('pagar', 'receber');
CREATE TYPE public.recurrence_type AS ENUM ('mensal', 'semanal', 'quinzenal');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type transaction_type NOT NULL,
  scope transaction_scope NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Circle',
  "group" TEXT NOT NULL DEFAULT 'Outros',
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type transaction_type NOT NULL,
  scope transaction_scope NOT NULL,
  status transaction_status NOT NULL DEFAULT 'paid',
  payment_method TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  recurrent BOOLEAN NOT NULL DEFAULT false,
  recurrence recurrence_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  creditor TEXT,
  total_amount NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  installments_total INTEGER NOT NULL,
  installments_paid INTEGER NOT NULL DEFAULT 0,
  installment_amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 1,
  scope transaction_scope NOT NULL DEFAULT 'business',
  status loan_status NOT NULL DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own loans" ON public.loans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Loan installments
CREATE TABLE public.loan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at DATE,
  status installment_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own installments" ON public.loan_installments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  category supplier_category NOT NULL DEFAULT 'outros',
  payment_terms TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products (stock)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit product_unit NOT NULL DEFAULT 'un',
  quantity_current NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_max NUMERIC(10,2),
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category product_category NOT NULL DEFAULT 'outros',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stock movements
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type stock_movement_type NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  reason TEXT,
  reference_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stock movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status employee_status NOT NULL DEFAULT 'ativo',
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own employees" ON public.employees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bills (recurring)
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type bill_type NOT NULL DEFAULT 'pagar',
  due_date DATE NOT NULL,
  paid_at DATE,
  status transaction_status NOT NULL DEFAULT 'pending',
  recurrent BOOLEAN NOT NULL DEFAULT false,
  recurrence recurrence_type,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own bills" ON public.bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to seed default categories for new user
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type, scope, icon, "group") VALUES
    (NEW.id, 'Balcão', 'revenue', 'business', 'Store', 'Vendas'),
    (NEW.id, 'Delivery', 'revenue', 'business', 'Truck', 'Vendas'),
    (NEW.id, 'iFood', 'revenue', 'business', 'Smartphone', 'Vendas'),
    (NEW.id, 'Rappi', 'revenue', 'business', 'Smartphone', 'Vendas'),
    (NEW.id, 'WhatsApp', 'revenue', 'business', 'MessageCircle', 'Vendas'),
    (NEW.id, 'Eventos/Encomendas', 'revenue', 'business', 'Calendar', 'Eventos'),
    (NEW.id, 'Outros Recebimentos', 'revenue', 'business', 'Plus', 'Outros'),
    (NEW.id, 'Ingredientes/Insumos', 'expense', 'business', 'ChefHat', 'Operacional'),
    (NEW.id, 'Supermercado', 'expense', 'business', 'ShoppingCart', 'Operacional'),
    (NEW.id, 'Gás/Combustível', 'expense', 'business', 'Fuel', 'Operacional'),
    (NEW.id, 'Manutenção', 'expense', 'business', 'Wrench', 'Operacional'),
    (NEW.id, 'Aluguel', 'expense', 'business', 'Home', 'Fixas'),
    (NEW.id, 'Energia Elétrica', 'expense', 'business', 'Zap', 'Fixas'),
    (NEW.id, 'Água', 'expense', 'business', 'Droplets', 'Fixas'),
    (NEW.id, 'Internet/Telefone', 'expense', 'business', 'Wifi', 'Fixas'),
    (NEW.id, 'Sistemas/Software', 'expense', 'business', 'Monitor', 'Fixas'),
    (NEW.id, 'Salários/Pró-labore', 'expense', 'business', 'Users', 'Fixas'),
    (NEW.id, 'Contador', 'expense', 'business', 'Calculator', 'Fixas'),
    (NEW.id, 'Taxa Marketplace', 'expense', 'business', 'Percent', 'Taxas'),
    (NEW.id, 'Taxa Maquininha', 'expense', 'business', 'CreditCard', 'Taxas'),
    (NEW.id, 'Impostos', 'expense', 'business', 'FileText', 'Taxas'),
    (NEW.id, 'Multas/Juros', 'expense', 'business', 'AlertTriangle', 'Taxas'),
    (NEW.id, 'Anúncios', 'expense', 'business', 'Megaphone', 'Marketing'),
    (NEW.id, 'Material Impresso', 'expense', 'business', 'Printer', 'Marketing'),
    (NEW.id, 'Promoções/Descontos', 'expense', 'business', 'Tag', 'Marketing'),
    (NEW.id, 'Influenciadores', 'expense', 'business', 'Star', 'Marketing'),
    (NEW.id, 'Alimentação', 'expense', 'personal', 'UtensilsCrossed', 'Pessoal'),
    (NEW.id, 'Transporte', 'expense', 'personal', 'Car', 'Pessoal'),
    (NEW.id, 'Saúde/Lazer', 'expense', 'personal', 'Heart', 'Pessoal'),
    (NEW.id, 'Contas Pessoais', 'expense', 'personal', 'Receipt', 'Pessoal'),
    (NEW.id, 'Economia/Metas', 'expense', 'personal', 'PiggyBank', 'Pessoal');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();
