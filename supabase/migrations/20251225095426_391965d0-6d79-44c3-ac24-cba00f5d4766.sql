-- Add GST enabled toggle to business settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS gst_enabled boolean DEFAULT true;

-- Add column comment
COMMENT ON COLUMN public.business_settings.gst_enabled IS 'Whether GST is enabled for invoices and rentals';