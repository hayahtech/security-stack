
-- Create marketing_campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT 'branding',
  channel TEXT NOT NULL DEFAULT 'instagram',
  status TEXT NOT NULL DEFAULT 'planejada',
  budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  target_audience TEXT,
  expected_reach INT,
  actual_reach INT,
  expected_conversions INT,
  actual_conversions INT,
  cost_center TEXT DEFAULT 'geral',
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage own campaigns"
ON public.marketing_campaigns
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add campaign_id to transactions
ALTER TABLE public.transactions ADD COLUMN campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
