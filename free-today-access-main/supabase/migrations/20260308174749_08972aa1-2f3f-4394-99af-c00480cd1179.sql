
-- family_groups
CREATE TABLE public.family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own family groups" ON public.family_groups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add family_group_id to customers
ALTER TABLE public.customers ADD COLUMN family_group_id uuid REFERENCES public.family_groups(id) ON DELETE SET NULL;

-- family_members
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'dependente' CHECK (role IN ('titular', 'dependente')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(family_group_id, customer_id)
);
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own family members" ON public.family_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.family_groups fg WHERE fg.id = family_group_id AND fg.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_groups fg WHERE fg.id = family_group_id AND fg.user_id = auth.uid()));

-- loyalty_programs
CREATE TABLE public.loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'familia')),
  rule_type text NOT NULL DEFAULT 'por_pedido' CHECK (rule_type IN ('por_pedido', 'por_valor', 'por_item')),
  points_per_unit numeric NOT NULL DEFAULT 1,
  reward_type text NOT NULL DEFAULT 'desconto_fixo' CHECK (reward_type IN ('desconto_fixo', 'desconto_percentual', 'item_gratis')),
  reward_value numeric NOT NULL DEFAULT 0,
  points_required int NOT NULL DEFAULT 10,
  scope text NOT NULL DEFAULT 'individual' CHECK (scope IN ('individual', 'familia', 'ambos')),
  active boolean NOT NULL DEFAULT true,
  expiration_days int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own loyalty programs" ON public.loyalty_programs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- loyalty_points
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  family_group_id uuid REFERENCES public.family_groups(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credito', 'debito', 'expiracao')),
  points int NOT NULL,
  balance_after int NOT NULL DEFAULT 0,
  description text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own loyalty points" ON public.loyalty_points FOR ALL
  USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.user_id = auth.uid()));

-- coupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'manual' CHECK (type IN ('fidelidade', 'aniversario', 'familia', 'manual', 'resgate')),
  discount_type text NOT NULL DEFAULT 'fixo' CHECK (discount_type IN ('fixo', 'percentual', 'item_gratis')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric NOT NULL DEFAULT 0,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  family_group_id uuid REFERENCES public.family_groups(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.loyalty_programs(id) ON DELETE SET NULL,
  used_at timestamptz,
  used_in_sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own coupons" ON public.coupons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add coupon_id to sales for tracking
ALTER TABLE public.sales ADD COLUMN coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;
