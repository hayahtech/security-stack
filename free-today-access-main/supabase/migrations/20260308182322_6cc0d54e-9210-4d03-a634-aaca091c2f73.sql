
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_email text;

ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS notified boolean NOT NULL DEFAULT false;
