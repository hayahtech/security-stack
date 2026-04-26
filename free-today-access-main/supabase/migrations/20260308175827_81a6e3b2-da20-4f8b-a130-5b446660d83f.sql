
-- cash_sessions (turnos de caixa)
CREATE TABLE public.cash_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID REFERENCES public.employees(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  expected_balance NUMERIC NOT NULL DEFAULT 0,
  actual_balance NUMERIC,
  difference NUMERIC,
  status TEXT NOT NULL DEFAULT 'aberto',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cash sessions" ON public.cash_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- cash_movements (sangrias e suprimentos)
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cash movements" ON public.cash_movements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM cash_sessions cs WHERE cs.id = cash_movements.session_id AND cs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cash_sessions cs WHERE cs.id = cash_movements.session_id AND cs.user_id = auth.uid()));
