-- Create entities table
CREATE TABLE public.indi_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('client', 'supplier', 'employee')),
  current_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluations table
CREATE TABLE public.indi_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.indi_entities(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create score history table
CREATE TABLE public.indi_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.indi_entities(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE public.indi_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.indi_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indi_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indi_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indi_settings ENABLE ROW LEVEL SECURITY;

-- Allow public access (no auth required per plan)
CREATE POLICY "Allow all access to indi_entities" ON public.indi_entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to indi_evaluations" ON public.indi_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to indi_score_history" ON public.indi_score_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to indi_settings" ON public.indi_settings FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_indi_entities_type ON public.indi_entities(type);
CREATE INDEX idx_indi_evaluations_entity ON public.indi_evaluations(entity_id);
CREATE INDEX idx_indi_score_history_entity ON public.indi_score_history(entity_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_indi_entities_updated_at
  BEFORE UPDATE ON public.indi_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_indi_settings_updated_at
  BEFORE UPDATE ON public.indi_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();