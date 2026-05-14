DO $$ BEGIN
  CREATE TYPE public.employment_regime AS ENUM ('clt', 'pj', 'socio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS employment_regime public.employment_regime;