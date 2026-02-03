-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Business settings table
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_counter INTEGER DEFAULT 1,
  currency TEXT DEFAULT 'INR',
  financial_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own business settings"
  ON public.business_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  hsn_code TEXT,
  category TEXT,
  unit TEXT DEFAULT 'PCS',
  item_type TEXT DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(12, 2),
  tax_rate DECIMAL(5, 2) DEFAULT 18,
  current_stock INTEGER DEFAULT 0,
  reorder_level INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own items"
  ON public.items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index on barcode for quick lookups
CREATE INDEX idx_items_barcode ON public.items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_items_sku ON public.items(sku) WHERE sku IS NOT NULL;

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gstin TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  customer_group TEXT,
  credit_limit DECIMAL(12, 2),
  outstanding_balance DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customers"
  ON public.customers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT DEFAULT 'tax_invoice' CHECK (invoice_type IN ('tax_invoice', 'proforma', 'credit_note', 'debit_note')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  subtotal DECIMAL(12, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  balance_due DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, invoice_number)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 18,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS for invoice items - users can manage items for their own invoices
CREATE POLICY "Users can manage own invoice items"
  ON public.invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'cheque', 'credit')),
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payments"
  ON public.payments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Stock movements table
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity DECIMAL(12, 2) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stock movements"
  ON public.stock_movements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  
  -- Create default business settings
  INSERT INTO public.business_settings (user_id, business_name)
  VALUES (NEW.id, 'My Business');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Fix the search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
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
-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_step integer DEFAULT 1,
  business_profile_completed boolean DEFAULT false,
  mode_selected text, -- 'billing', 'rental', 'both'
  quick_setup_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  razorpay_subscription_id text,
  status text DEFAULT 'active',
  billing_cycle text DEFAULT 'monthly',
  amount numeric DEFAULT 0,
  current_period_start date,
  current_period_end date,
  auto_renew boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id text,
  razorpay_order_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  plan_name text,
  billing_cycle text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date UNIQUE NOT NULL,
  total_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  new_signups integer DEFAULT 0,
  churned_users integer DEFAULT 0,
  mrr numeric DEFAULT 0,
  arr numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_progress
CREATE POLICY "Users can manage own onboarding progress"
ON public.onboarding_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all transactions"
ON public.transactions
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for admin_logs
CREATE POLICY "Super admins can manage admin logs"
ON public.admin_logs
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for system_metrics
CREATE POLICY "Super admins can view system metrics"
ON public.system_metrics
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage system metrics"
ON public.system_metrics
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
-- Allow users to insert their own transactions (for checkout)
CREATE POLICY "Users can insert own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert/update their own subscriptions
CREATE POLICY "Users can insert own subscriptions" 
ON public.subscriptions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);
-- Add unique constraint on user_id for business_settings to prevent duplicates
ALTER TABLE public.business_settings 
ADD CONSTRAINT business_settings_user_id_key UNIQUE (user_id);
-- Add GST enabled toggle to business settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS gst_enabled boolean DEFAULT true;

-- Add column comment
COMMENT ON COLUMN public.business_settings.gst_enabled IS 'Whether GST is enabled for invoices and rentals';
-- Create separate rental_customers table for rental module
CREATE TABLE public.rental_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  customer_group TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  emergency_contact TEXT,
  notes TEXT,
  outstanding_balance NUMERIC DEFAULT 0,
  credit_limit NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own rental customers"
ON public.rental_customers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_rental_customers_updated_at
BEFORE UPDATE ON public.rental_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Copy existing customers used in rentals to rental_customers (preserving IDs)
INSERT INTO public.rental_customers (id, user_id, name, email, phone, billing_address, city, state, pincode, gstin, customer_group, outstanding_balance, credit_limit, created_at)
SELECT c.id, c.user_id, c.name, c.email, c.phone, c.billing_address, c.city, c.state, c.pincode, c.gstin, c.customer_group, c.outstanding_balance, c.credit_limit, c.created_at
FROM public.customers c
WHERE c.id IN (SELECT DISTINCT customer_id FROM public.rental_invoices WHERE customer_id IS NOT NULL);

-- Drop existing FK constraint
ALTER TABLE public.rental_invoices 
DROP CONSTRAINT IF EXISTS rental_invoices_customer_id_fkey;

-- Add new FK constraint to rental_customers
ALTER TABLE public.rental_invoices
ADD CONSTRAINT rental_invoices_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.rental_customers(id) ON DELETE SET NULL;
-- Add industry column to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN industry text DEFAULT 'general';

-- Add comment to explain the column
COMMENT ON COLUMN public.business_settings.industry IS 'Industry type for feature customization: it_services, retail, wholesale, healthcare, manufacturing, consulting, general';
-- Add new columns to invoices table for quotations and invoice enhancements
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS quotation_validity_date date,
  ADD COLUMN IF NOT EXISTS converted_from_quotation_id uuid REFERENCES public.invoices(id),
  ADD COLUMN IF NOT EXISTS shipping_charges numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_discount_type text DEFAULT 'percent';

-- Add UPI details to business_settings for QR code generation
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS upi_id text;

-- Create index for document_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON public.invoices(document_type);

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.document_type IS 'Type of document: invoice, quotation, proforma';
COMMENT ON COLUMN public.invoices.quotation_validity_date IS 'Validity date for quotations';
COMMENT ON COLUMN public.invoices.converted_from_quotation_id IS 'Reference to original quotation if converted';
COMMENT ON COLUMN public.invoices.shipping_charges IS 'Shipping/delivery charges';
COMMENT ON COLUMN public.invoices.invoice_discount IS 'Invoice-level discount value';
COMMENT ON COLUMN public.invoices.invoice_discount_type IS 'Type of discount: percent or fixed';
-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  credit_period_days INTEGER DEFAULT 30,
  outstanding_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 18,
  discount_percent NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  received_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers
CREATE POLICY "Users can manage own suppliers"
ON public.suppliers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for purchase_orders
CREATE POLICY "Users can manage own purchase orders"
ON public.purchase_orders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for purchase_order_items
CREATE POLICY "Users can manage own purchase order items"
ON public.purchase_order_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.purchase_orders
  WHERE purchase_orders.id = purchase_order_items.purchase_order_id
  AND purchase_orders.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.purchase_orders
  WHERE purchase_orders.id = purchase_order_items.purchase_order_id
  AND purchase_orders.user_id = auth.uid()
));

-- Add updated_at triggers
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
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
-- Step 1: Mark all but the most recent active subscription per user as cancelled
WITH ranked AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM public.subscriptions
  WHERE status = 'active'
)
UPDATE public.subscriptions SET status = 'cancelled', updated_at = now()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 2: Create unique partial index to prevent future duplicate active subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_active_unique 
ON public.subscriptions(user_id) 
WHERE status = 'active';
-- Phase 6: Add print_settings to business_settings
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS print_settings JSONB DEFAULT '{
  "thermal_paper_width": "3inch",
  "auto_print_pos": false,
  "barcode_label_size": "50x25",
  "thermal_logo_url": null,
  "invoice_paper_size": "A4",
  "print_density": 5,
  "footer_text": "Thank you for your business!"
}'::jsonb;

-- Phase 8: Add invoice_template to business_settings
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS invoice_template JSONB DEFAULT '{
  "show_logo": true,
  "show_signature": true,
  "show_terms": true,
  "show_bank_details": true,
  "template_style": "classic",
  "custom_fields": [],
  "signature_url": null,
  "bank_details": null
}'::jsonb;

-- Phase 8: Add custom_fields to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- Phase 4: Add E-Way Bill fields to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS eway_bill_number TEXT;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS vehicle_number TEXT;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS transporter_name TEXT;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS transporter_id TEXT;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS distance_km NUMERIC;

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS eway_valid_till TIMESTAMPTZ;

-- Phase 7: Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'savings',
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  opening_balance DECIMAL DEFAULT 0,
  current_balance DECIMAL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 7: Create account_transactions table
CREATE TABLE IF NOT EXISTS account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  counterparty_account_id UUID,
  description TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policy for bank_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bank_accounts' AND policyname = 'Users can manage own bank accounts'
  ) THEN
    CREATE POLICY "Users can manage own bank accounts" ON bank_accounts
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Enable RLS on account_transactions
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for account_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'account_transactions' AND policyname = 'Users can manage own account transactions'
  ) THEN
    CREATE POLICY "Users can manage own account transactions" ON account_transactions
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
-- GST Compliance, E-Way Bill & Common Inventory Implementation
-- Migration Date: 2026-01-11

-- ============================================================================
-- PART 1: GST Fields for Invoices
-- ============================================================================

-- Add GST breakdown fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS place_of_supply TEXT,
ADD COLUMN IF NOT EXISTS is_interstate BOOLEAN DEFAULT false;

-- Add GST breakdown fields to invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT;

-- ============================================================================
-- PART 2: GST Fields for Rental Invoices
-- ============================================================================

-- Add GST breakdown fields to rental_invoices table
ALTER TABLE rental_invoices 
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS place_of_supply TEXT,
ADD COLUMN IF NOT EXISTS is_interstate BOOLEAN DEFAULT false;

-- Add GST breakdown fields to rental_items table
ALTER TABLE rental_items 
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT;

-- ============================================================================
-- PART 3: E-Way Bill Fields (Complete existing partial implementation)
-- ============================================================================

-- Add remaining e-way bill fields to invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS transport_mode TEXT CHECK (transport_mode IN ('road', 'rail', 'air', 'ship')),
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'tax_invoice',
ADD COLUMN IF NOT EXISTS consignment_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS eway_bill_status TEXT CHECK (eway_bill_status IN ('pending', 'generated', 'cancelled', 'expired'));

-- Add remaining e-way bill fields to rental_invoices
ALTER TABLE rental_invoices 
ADD COLUMN IF NOT EXISTS eway_bill_number TEXT,
ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
ADD COLUMN IF NOT EXISTS transporter_name TEXT,
ADD COLUMN IF NOT EXISTS transporter_id TEXT,
ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
ADD COLUMN IF NOT EXISTS eway_valid_till TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transport_mode TEXT CHECK (transport_mode IN ('road', 'rail', 'air', 'ship')),
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'rental_invoice',
ADD COLUMN IF NOT EXISTS consignment_value DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS eway_bill_status TEXT CHECK (eway_bill_status IN ('pending', 'generated', 'cancelled', 'expired'));

-- ============================================================================
-- PART 4: GST Reports Cache Table
-- ============================================================================

-- Create table to cache GST report data for faster exports
CREATE TABLE IF NOT EXISTS gst_reports_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('gstr1', 'gstr3b')),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  financial_year TEXT NOT NULL,
  report_data JSONB NOT NULL,
  total_invoices INTEGER DEFAULT 0,
  total_taxable_value DECIMAL(12, 2) DEFAULT 0,
  total_cgst DECIMAL(12, 2) DEFAULT 0,
  total_sgst DECIMAL(12, 2) DEFAULT 0,
  total_igst DECIMAL(12, 2) DEFAULT 0,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, report_type, period_month, period_year)
);

-- Enable RLS on gst_reports_cache
ALTER TABLE gst_reports_cache ENABLE ROW LEVEL SECURITY;

-- RLS policy for gst_reports_cache
CREATE POLICY "Users can manage own GST reports cache"
ON gst_reports_cache
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PART 5: Indexes for Performance
-- ============================================================================

-- Indexes for faster GST report generation
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_place_of_supply ON invoices(place_of_supply);
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_rental_invoices_user_date ON rental_invoices(user_id, rental_start_date);

-- Indexes for customer GSTIN lookups
CREATE INDEX IF NOT EXISTS idx_customers_gstin ON customers(gstin) WHERE gstin IS NOT NULL;

-- Indexes for e-way bill queries
CREATE INDEX IF NOT EXISTS idx_invoices_eway_status ON invoices(eway_bill_status) WHERE eway_bill_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rental_invoices_eway_status ON rental_invoices(eway_bill_status) WHERE eway_bill_status IS NOT NULL;

-- ============================================================================
-- PART 6: Update Items Table for HSN/SAC Codes
-- ============================================================================

-- Ensure items table has HSN code field (may already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'hsn_sac_code'
  ) THEN
    ALTER TABLE items ADD COLUMN hsn_sac_code TEXT;
  END IF;
END $$;

-- ============================================================================
-- PART 7: Add GST Settings to Business Settings
-- ============================================================================

-- Add GST filing frequency to business_settings
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS gst_filing_frequency TEXT DEFAULT 'monthly' CHECK (gst_filing_frequency IN ('monthly', 'quarterly')),
ADD COLUMN IF NOT EXISTS default_place_of_supply TEXT,
ADD COLUMN IF NOT EXISTS einvoice_threshold DECIMAL(12, 2) DEFAULT 5000000; -- 50 lakh

-- ============================================================================
-- PART 8: Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN invoices.cgst_amount IS 'Central GST amount for intra-state transactions';
COMMENT ON COLUMN invoices.sgst_amount IS 'State GST amount for intra-state transactions';
COMMENT ON COLUMN invoices.igst_amount IS 'Integrated GST amount for inter-state transactions';
COMMENT ON COLUMN invoices.place_of_supply IS 'State code and name where supply is made (e.g., "27-Maharashtra")';
COMMENT ON COLUMN invoices.is_interstate IS 'True if transaction is inter-state (different state codes in GSTINs)';
COMMENT ON COLUMN invoices.eway_bill_status IS 'Status of e-way bill generation';
COMMENT ON COLUMN invoices.consignment_value IS 'Total value of consignment for e-way bill (typically same as total_amount)';

COMMENT ON TABLE gst_reports_cache IS 'Cached GST report data for GSTR-1 and GSTR-3B to improve export performance';
COMMENT ON COLUMN gst_reports_cache.report_data IS 'Complete JSON data for the GST report in portal-compatible format';
COMMENT ON COLUMN gst_reports_cache.validation_errors IS 'Array of validation errors found in the report data';
