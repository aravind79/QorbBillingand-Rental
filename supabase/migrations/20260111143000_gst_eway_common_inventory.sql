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

-- RLS policy for gst_reports_cache (drop if exists first)
DROP POLICY IF EXISTS "Users can manage own GST reports cache" ON gst_reports_cache;

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
