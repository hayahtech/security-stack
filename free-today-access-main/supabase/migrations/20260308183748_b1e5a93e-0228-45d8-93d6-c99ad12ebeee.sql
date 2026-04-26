
-- Stock entries header table
CREATE TABLE public.stock_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL DEFAULT 'manual' CHECK (entry_type IN ('manual', 'xml_nfe', 'compra_avulsa')),
  nfe_number TEXT,
  nfe_key TEXT,
  nfe_date DATE,
  total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  xml_raw TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'confirmado', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock entry items table
CREATE TABLE public.stock_entry_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.stock_entries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  nfe_product_code TEXT,
  nfe_product_name TEXT,
  ncm TEXT,
  cfop TEXT,
  unit TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  taxes JSONB DEFAULT '{}'::jsonb,
  matched_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  included BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entry_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_entries
CREATE POLICY "Users can manage own stock entries"
  ON public.stock_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for stock_entry_items (via stock_entries)
CREATE POLICY "Users can manage own stock entry items"
  ON public.stock_entry_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stock_entries se
    WHERE se.id = stock_entry_items.entry_id AND se.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stock_entries se
    WHERE se.id = stock_entry_items.entry_id AND se.user_id = auth.uid()
  ));
