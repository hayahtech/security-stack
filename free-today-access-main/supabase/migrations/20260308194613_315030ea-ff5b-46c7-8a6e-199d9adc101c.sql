
ALTER TABLE public.sales
  ADD COLUMN delivery_status TEXT DEFAULT 'recebido',
  ADD COLUMN delivery_started_at TIMESTAMPTZ,
  ADD COLUMN delivery_departed_at TIMESTAMPTZ,
  ADD COLUMN delivery_delivered_at TIMESTAMPTZ,
  ADD COLUMN estimated_delivery_minutes INT DEFAULT 45,
  ADD COLUMN delivery_employee_id UUID REFERENCES public.employees(id),
  ADD COLUMN delivery_notes TEXT;
