
CREATE TABLE public.product_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT
);

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price history"
  ON public.product_price_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-record price changes on products
CREATE OR REPLACE FUNCTION public.track_product_price_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.cost_price IS DISTINCT FROM NEW.cost_price THEN
    INSERT INTO public.product_price_history (user_id, product_id, price, supplier_id, source)
    VALUES (NEW.user_id, NEW.id, NEW.cost_price, NEW.supplier_id, 'auto');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_product_price_change
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.track_product_price_change();
