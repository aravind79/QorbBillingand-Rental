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