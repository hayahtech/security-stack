
CREATE TABLE public.saved_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  client_document text,
  client_phone text,
  client_email text,
  hourly_rate numeric NOT NULL,
  hours numeric NOT NULL,
  complexity_label text NOT NULL,
  complexity_value numeric NOT NULL,
  base_price numeric NOT NULL,
  margin_percent numeric NOT NULL,
  margin_value numeric NOT NULL,
  extra_costs numeric NOT NULL DEFAULT 0,
  extra_costs_description text,
  suggested_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quotes" ON public.saved_quotes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
