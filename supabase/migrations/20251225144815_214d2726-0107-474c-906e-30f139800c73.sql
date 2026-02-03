-- Add industry column to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN industry text DEFAULT 'general';

-- Add comment to explain the column
COMMENT ON COLUMN public.business_settings.industry IS 'Industry type for feature customization: it_services, retail, wholesale, healthcare, manufacturing, consulting, general';