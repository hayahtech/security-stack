
-- sales_goals table
CREATE TABLE public.sales_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL CHECK (period IN ('diario', 'semanal', 'mensal')),
  goal_type text NOT NULL CHECK (goal_type IN ('faturamento', 'pedidos', 'pizzas_vendidas')),
  target_value numeric NOT NULL,
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sales goals" ON public.sales_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_zipcode text,
  birth_date date NOT NULL,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- customer_addresses table
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'casa' CHECK (label IN ('casa', 'trabalho', 'outro')),
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  zipcode text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
-- RLS via join to customers
CREATE POLICY "Users can manage own customer addresses" ON public.customer_addresses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()));

-- Add customer_id to sales
ALTER TABLE public.sales ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
