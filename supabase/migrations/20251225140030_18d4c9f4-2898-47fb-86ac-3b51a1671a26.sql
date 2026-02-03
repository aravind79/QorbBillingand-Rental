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