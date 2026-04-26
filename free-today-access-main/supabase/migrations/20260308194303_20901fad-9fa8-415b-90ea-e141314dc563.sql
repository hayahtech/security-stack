
-- Tables (mesas)
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number INT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'livre',
  current_session_id UUID,
  location TEXT NOT NULL DEFAULT 'salao',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tables"
  ON public.tables FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table Sessions
CREATE TABLE public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  customer_count INT NOT NULL DEFAULT 1,
  waiter_id UUID REFERENCES public.employees(id),
  status TEXT NOT NULL DEFAULT 'aberta',
  notes TEXT
);

ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own table sessions"
  ON public.table_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table Orders
CREATE TABLE public.table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  table_session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own table orders"
  ON public.table_orders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add FK back from tables to table_sessions
ALTER TABLE public.tables 
  ADD CONSTRAINT tables_current_session_id_fkey 
  FOREIGN KEY (current_session_id) REFERENCES public.table_sessions(id);
