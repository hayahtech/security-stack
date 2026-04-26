
-- Enums for sales module
CREATE TYPE public.menu_category AS ENUM ('pizza', 'bebida', 'sobremesa', 'outro');
CREATE TYPE public.sales_channel AS ENUM ('balcao', 'delivery', 'ifood', 'rappi', 'whatsapp');
CREATE TYPE public.session_status AS ENUM ('aberto', 'fechado');
CREATE TYPE public.sale_status AS ENUM ('aberto', 'fechado', 'cancelado');
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'cartao', 'app');

-- Menu items (cardápio)
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category menu_category NOT NULL DEFAULT 'pizza',
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own menu items" ON public.menu_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sales sessions (caixa)
CREATE TABLE public.sales_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  channel sales_channel NOT NULL DEFAULT 'balcao',
  status session_status NOT NULL DEFAULT 'aberto',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON public.sales_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sales (vendas/pedidos)
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sales_sessions(id) ON DELETE SET NULL,
  channel sales_channel NOT NULL DEFAULT 'balcao',
  customer_name TEXT,
  table_number TEXT,
  status sale_status NOT NULL DEFAULT 'aberto',
  payment_method payment_method NOT NULL DEFAULT 'dinheiro',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sales" ON public.sales FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sale items
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
-- sale_items needs user_id for RLS, but we use sale's user_id via join
-- Simpler: add user_id to sale_items
ALTER TABLE public.sale_items ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Update RLS
CREATE POLICY "Users can manage own sale items" ON public.sale_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
