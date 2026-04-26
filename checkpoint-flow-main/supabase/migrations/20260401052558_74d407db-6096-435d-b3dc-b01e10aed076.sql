
-- Profiles table first
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operacional', 'inspector', 'supervisor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS TABLE(role text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role, p.status
  FROM public.profiles p
  WHERE p.id = _user_id
$$;

-- User reads own profile
CREATE POLICY "users_read_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Active inspectors read all profiles
CREATE POLICY "inspector_reads_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT r.role FROM public.get_user_role(auth.uid()) r WHERE r.status = 'active' AND r.role = 'inspector') IS NOT NULL
  );

-- Active inspectors update other users' status
CREATE POLICY "inspector_updates_other_profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT r.role FROM public.get_user_role(auth.uid()) r WHERE r.status = 'active' AND r.role = 'inspector') IS NOT NULL
  )
  WITH CHECK (id != auth.uid());

-- Users can insert their own profile (for trigger/signup)
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'operacional')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
