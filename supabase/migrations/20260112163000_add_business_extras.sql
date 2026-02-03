-- Add PAN and website columns to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS pan TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;
