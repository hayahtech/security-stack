
-- Create tables first without cross-referencing policies
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID,
  role TEXT NOT NULL DEFAULT 'caixa',
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(restaurant_id, user_id)
);

ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- Now create all policies (both tables exist)
CREATE POLICY "Owner can manage own restaurant"
  ON public.restaurants FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members can read their restaurant"
  ON public.restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members rm
      WHERE rm.restaurant_id = restaurants.id
        AND rm.user_id = auth.uid()
        AND rm.status = 'ativo'
    )
  );

CREATE POLICY "Users can see own memberships"
  ON public.restaurant_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Restaurant owner can manage members"
  ON public.restaurant_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_members.restaurant_id
        AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_members.restaurant_id
        AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can see invites by email"
  ON public.restaurant_members FOR SELECT
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pendente'
  );

CREATE POLICY "Users can accept own invite"
  ON public.restaurant_members FOR UPDATE
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pendente'
  )
  WITH CHECK (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
