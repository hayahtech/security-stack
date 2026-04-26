
-- reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  sale_id UUID REFERENCES public.sales(id),
  channel TEXT NOT NULL DEFAULT 'balcao',
  rating INTEGER NOT NULL,
  comment TEXT,
  category TEXT NOT NULL DEFAULT 'sabor',
  responded_at TIMESTAMPTZ,
  response_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reviews" ON public.reviews
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- occurrences
CREATE TABLE public.occurrences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  sale_id UUID REFERENCES public.sales(id),
  type TEXT NOT NULL DEFAULT 'reclamacao',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own occurrences" ON public.occurrences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
