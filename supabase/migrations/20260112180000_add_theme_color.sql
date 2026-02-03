ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0d9488';
