-- Add batch tracking fields to items table
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS batch_number text;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS manufacturer text;

-- Create recurring_invoices table for IT services
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  title text NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}',
  frequency text NOT NULL DEFAULT 'monthly',
  next_run_date date,
  last_run_date date,
  is_active boolean DEFAULT true,
  auto_send_email boolean DEFAULT false,
  amount numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for recurring_invoices
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policy for recurring_invoices
CREATE POLICY "Users can manage own recurring invoices"
  ON public.recurring_invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create tables table for restaurant
CREATE TABLE IF NOT EXISTS public.tables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  table_number text NOT NULL,
  capacity integer DEFAULT 4,
  status text DEFAULT 'available',
  current_order_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for tables
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- RLS policy for tables
CREATE POLICY "Users can manage own tables"
  ON public.tables
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();