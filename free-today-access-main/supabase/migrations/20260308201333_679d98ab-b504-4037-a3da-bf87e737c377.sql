
-- Add cost_center column to sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cost_center TEXT DEFAULT 'geral';

-- Add cost_center column to bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS cost_center TEXT DEFAULT 'geral';

-- Create cost_center_allocations table for shared expense ratios
CREATE TABLE IF NOT EXISTS public.cost_center_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  salao NUMERIC NOT NULL DEFAULT 0,
  delivery NUMERIC NOT NULL DEFAULT 0,
  ifood NUMERIC NOT NULL DEFAULT 0,
  rappi NUMERIC NOT NULL DEFAULT 0,
  whatsapp NUMERIC NOT NULL DEFAULT 0,
  eventos NUMERIC NOT NULL DEFAULT 0,
  geral NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_center_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own allocations" ON public.cost_center_allocations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
