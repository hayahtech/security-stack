
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS qr_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_qr_token ON public.customers(qr_token);
