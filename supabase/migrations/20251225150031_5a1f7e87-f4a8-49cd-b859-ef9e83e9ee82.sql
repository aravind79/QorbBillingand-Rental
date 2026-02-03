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