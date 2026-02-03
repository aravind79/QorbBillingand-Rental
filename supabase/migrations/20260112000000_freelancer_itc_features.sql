-- Migration: Freelancer, ITC, and ITR Features (Fixed)
-- Date: 2026-01-12
-- This version uses IF NOT EXISTS and DROP IF EXISTS to avoid conflicts

-- ============================================
-- 1. UPDATE BUSINESS SETTINGS FOR INDUSTRY TYPE
-- ============================================

ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'general' 
  CHECK (industry_type IN ('general', 'retail', 'restaurant', 'freelancer', 'manufacturing', 'services'));

-- ============================================
-- 2. PURCHASES TABLE (for ITC tracking)
-- ============================================

DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_number TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  place_of_supply TEXT,
  is_interstate BOOLEAN DEFAULT false,
  itc_eligible BOOLEAN DEFAULT true,
  itc_claimed DECIMAL(12,2) DEFAULT 0,
  itc_reversed DECIMAL(12,2) DEFAULT 0,
  reversal_reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'received', 'paid', 'partial', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, purchase_number)
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own purchases"
  ON purchases FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_purchases_user_date ON purchases(user_id, purchase_date DESC);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id) WHERE supplier_id IS NOT NULL;

-- ============================================
-- 3. PURCHASE ITEMS TABLE
-- ============================================

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  hsn_code TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own purchase items"
  ON purchase_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = purchase_items.purchase_id 
      AND purchases.user_id = auth.uid()
    )
  );

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);

-- ============================================
-- 4. INCOME ENTRIES TABLE (for ITR)
-- ============================================

DROP TABLE IF EXISTS income_entries CASCADE;

CREATE TABLE income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  financial_year TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'professional_fees' 
    CHECK (category IN ('professional_fees', 'interest', 'rental_income', 'capital_gains', 'other')),
  tds_deducted DECIMAL(12,2) DEFAULT 0,
  client_name TEXT,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  pan_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own income entries"
  ON income_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_income_entries_user_fy ON income_entries(user_id, financial_year);
CREATE INDEX idx_income_entries_date ON income_entries(entry_date DESC);

-- ============================================
-- 5. EXPENSE ENTRIES TABLE (for ITR)
-- ============================================

DROP TABLE IF EXISTS expense_entries CASCADE;

CREATE TABLE expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  financial_year TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'office_expenses'
    CHECK (category IN (
      'rent', 'electricity', 'internet', 'software', 'travel', 
      'professional_fees', 'office_expenses', 'depreciation', 
      'insurance', 'repairs', 'other'
    )),
  is_deductible BOOLEAN DEFAULT true,
  receipt_url TEXT,
  vendor_name TEXT,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expense entries"
  ON expense_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_expense_entries_user_fy ON expense_entries(user_id, financial_year);
CREATE INDEX idx_expense_entries_date ON expense_entries(entry_date DESC);
CREATE INDEX idx_expense_entries_category ON expense_entries(category);

-- ============================================
-- 6. ITR COMPUTATIONS TABLE
-- ============================================

DROP TABLE IF EXISTS itr_computations CASCADE;

CREATE TABLE itr_computations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  
  gross_receipts DECIMAL(12,2) DEFAULT 0,
  professional_income DECIMAL(12,2) DEFAULT 0,
  other_income DECIMAL(12,2) DEFAULT 0,
  total_income DECIMAL(12,2) DEFAULT 0,
  
  total_expenses DECIMAL(12,2) DEFAULT 0,
  presumptive_income DECIMAL(12,2) DEFAULT 0,
  
  section_80c DECIMAL(12,2) DEFAULT 0,
  section_80d DECIMAL(12,2) DEFAULT 0,
  section_80g DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  
  taxable_income DECIMAL(12,2) DEFAULT 0,
  tax_regime TEXT DEFAULT 'new' CHECK (tax_regime IN ('old', 'new')),
  tax_computed DECIMAL(12,2) DEFAULT 0,
  cess DECIMAL(12,2) DEFAULT 0,
  total_tax_liability DECIMAL(12,2) DEFAULT 0,
  
  tds_paid DECIMAL(12,2) DEFAULT 0,
  advance_tax_paid DECIMAL(12,2) DEFAULT 0,
  self_assessment_tax DECIMAL(12,2) DEFAULT 0,
  
  tax_payable DECIMAL(12,2) DEFAULT 0,
  refund_due DECIMAL(12,2) DEFAULT 0,
  
  computation_date TIMESTAMPTZ DEFAULT now(),
  is_final BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, financial_year)
);

ALTER TABLE itr_computations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ITR computations"
  ON itr_computations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_itr_computations_user_fy ON itr_computations(user_id, financial_year);

-- ============================================
-- 7. ADVANCE TAX PAYMENTS TABLE
-- ============================================

DROP TABLE IF EXISTS advance_tax_payments CASCADE;

CREATE TABLE advance_tax_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  installment TEXT NOT NULL CHECK (installment IN ('Q1', 'Q2', 'Q3', 'Q4')),
  due_date DATE NOT NULL,
  amount_due DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  payment_date DATE,
  challan_number TEXT,
  bsr_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE advance_tax_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own advance tax payments"
  ON advance_tax_payments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_advance_tax_user_fy ON advance_tax_payments(user_id, financial_year);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_current_financial_year()
RETURNS TEXT AS $$
DECLARE
  current_month INT;
  current_year INT;
  fy_start_year INT;
  fy_end_year INT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  IF current_month >= 4 THEN
    fy_start_year := current_year;
    fy_end_year := current_year + 1;
  ELSE
    fy_start_year := current_year - 1;
    fy_end_year := current_year;
  END IF;
  
  RETURN fy_start_year || '-' || SUBSTRING(fy_end_year::TEXT FROM 3);
END;
$$ LANGUAGE plpgsql;
