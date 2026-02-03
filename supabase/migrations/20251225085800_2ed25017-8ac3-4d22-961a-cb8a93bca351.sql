-- Add unique constraint on user_id for business_settings to prevent duplicates
ALTER TABLE public.business_settings 
ADD CONSTRAINT business_settings_user_id_key UNIQUE (user_id);