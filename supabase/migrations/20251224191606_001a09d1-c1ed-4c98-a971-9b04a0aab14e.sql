-- Add rental fields to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS rental_rate_daily numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rental_rate_weekly numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rental_rate_monthly numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS security_deposit_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS availability_type text DEFAULT 'sale_only' CHECK (availability_type IN ('sale_only', 'rental_only', 'hybrid')),
ADD COLUMN IF NOT EXISTS rental_terms text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quantity_available_for_rent integer DEFAULT 0;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'staff', 'viewer');

-- Create user_roles table with manual assignment
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles (only admins/super_admins can manage)
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create rental_invoices table
CREATE TABLE public.rental_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rental_number text NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  rental_start_date date NOT NULL,
  rental_end_date date NOT NULL,
  expected_return_date date,
  actual_return_date date,
  rental_status text DEFAULT 'booked' CHECK (rental_status IN ('booked', 'active', 'returned', 'overdue', 'cancelled')),
  security_deposit numeric DEFAULT 0,
  deposit_collected boolean DEFAULT false,
  deposit_refunded numeric DEFAULT 0,
  late_fee_per_day numeric DEFAULT 0,
  late_fees numeric DEFAULT 0,
  damage_charges numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  balance_due numeric DEFAULT 0,
  notes text,
  return_condition text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, rental_number)
);

-- Enable RLS on rental_invoices
ALTER TABLE public.rental_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policy for rental_invoices
CREATE POLICY "Users can manage own rental invoices"
ON public.rental_invoices
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create rental_items table
CREATE TABLE public.rental_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_invoice_id uuid NOT NULL REFERENCES public.rental_invoices(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.items(id),
  quantity integer DEFAULT 1,
  rate_type text DEFAULT 'daily' CHECK (rate_type IN ('daily', 'weekly', 'monthly')),
  rate_amount numeric NOT NULL,
  rental_days integer NOT NULL,
  amount numeric NOT NULL,
  return_condition text,
  damage_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rental_items
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;

-- RLS policy for rental_items
CREATE POLICY "Users can manage own rental items"
ON public.rental_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rental_invoices
    WHERE rental_invoices.id = rental_items.rental_invoice_id
    AND rental_invoices.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rental_invoices
    WHERE rental_invoices.id = rental_items.rental_invoice_id
    AND rental_invoices.user_id = auth.uid()
  )
);

-- Add rental counter to business_settings
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS rental_prefix text DEFAULT 'RNT',
ADD COLUMN IF NOT EXISTS rental_counter integer DEFAULT 1;

-- Trigger for updating rental_invoices updated_at
CREATE TRIGGER update_rental_invoices_updated_at
BEFORE UPDATE ON public.rental_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();