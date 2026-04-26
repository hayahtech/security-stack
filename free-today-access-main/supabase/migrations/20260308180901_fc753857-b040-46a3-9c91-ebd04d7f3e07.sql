
-- Add store_slug to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_slug text UNIQUE;

-- Add description and image_url to menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url text;

-- Create daily_promotions table
CREATE TABLE IF NOT EXISTS public.daily_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_promotions ENABLE ROW LEVEL SECURITY;

-- Owner can manage own promotions
CREATE POLICY "Users can manage own promotions"
  ON public.daily_promotions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read access to active promotions via slug
CREATE POLICY "Public can read active promotions"
  ON public.daily_promotions FOR SELECT
  TO anon
  USING (active = true);

-- Public can read active menu items (for public menu page)
CREATE POLICY "Public can read active menu items"
  ON public.menu_items FOR SELECT
  TO anon
  USING (active = true);

-- Public can read profiles (slug lookup)
CREATE POLICY "Public can read profile slugs"
  ON public.profiles FOR SELECT
  TO anon
  USING (store_slug IS NOT NULL);

-- Public can read reviews (for avg rating)
CREATE POLICY "Public can read reviews"
  ON public.reviews FOR SELECT
  TO anon
  USING (true);
