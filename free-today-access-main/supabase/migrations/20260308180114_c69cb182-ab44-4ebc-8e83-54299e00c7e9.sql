
-- temperature_logs
CREATE TABLE public.temperature_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  equipment TEXT NOT NULL DEFAULT 'geladeira',
  temperature NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES public.employees(id),
  status TEXT NOT NULL DEFAULT 'ok',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.temperature_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own temperature logs" ON public.temperature_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cleaning_logs
CREATE TABLE public.cleaning_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  area TEXT NOT NULL,
  cleaned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  employee_id UUID REFERENCES public.employees(id),
  checklist JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cleaning logs" ON public.cleaning_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
