-- Demo Data for GST Features Testing
-- Run this in Supabase SQL Editor after logging in with qorb.india@gmail.com

-- Get the user ID (replace with your actual user ID from auth.users table)
-- You can find it by running: SELECT id FROM auth.users WHERE email = 'qorb.india@gmail.com';

-- For this script, we'll use a variable approach
DO $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'qorb.india@gmail.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please ensure you are logged in with qorb.india@gmail.com';
  END IF;

  -- Update business settings with GSTIN
  UPDATE business_settings 
  SET 
    business_name = 'Qorb India Pvt Ltd',
    gstin = '27AABCT1234F1Z5',
    address = '123 Business Park, Andheri East',
    city = 'Mumbai',
    state = 'Maharashtra',
    pincode = '400069',
    phone = '+91 9876543210',
    email = 'contact@qorb.in',
    gst_enabled = true,
    default_place_of_supply = '27-Maharashtra',
    gst_filing_frequency = 'monthly'
  WHERE user_id = v_user_id
  RETURNING id INTO v_business_id;

  -- If no business settings exist, create one
  IF v_business_id IS NULL THEN
    INSERT INTO business_settings (
      user_id, business_name, gstin, address, city, state, pincode, 
      phone, email, gst_enabled, default_place_of_supply, gst_filing_frequency
    ) VALUES (
      v_user_id, 'Qorb India Pvt Ltd', '27AABCT1234F1Z5', 
      '123 Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400069',
      '+91 9876543210', 'contact@qorb.in', true, '27-Maharashtra', 'monthly'
    ) RETURNING id INTO v_business_id;
  END IF;

  -- Create Items
  INSERT INTO items (user_id, name, description, sale_price, tax_rate, hsn_code, item_type, unit, current_stock)
  VALUES 
    (v_user_id, 'Laptop Dell Inspiron', 'Business Laptop', 45000, 18, '84713000', 'product', 'PCS', 50),
    (v_user_id, 'Software License', 'Annual Software License', 25000, 18, '998314', 'service', 'license', 100),
    (v_user_id, 'Office Chair', 'Ergonomic Office Chair', 8000, 12, '94013000', 'product', 'PCS', 30);

  -- Create B2B Customers (with GSTIN)
  INSERT INTO customers (user_id, name, email, phone, gstin, billing_address, city, state, pincode)
  VALUES 
    (v_user_id, 'Tech Solutions Pvt Ltd', 'contact@techsolutions.com', '+91 9876543211', 
     '29AABCT5432F1Z8', '456 Tech Park', 'Bangalore', 'Karnataka', '560001'),
    (v_user_id, 'Global Enterprises', 'info@globalent.com', '+91 9876543212', 
     '06AABCT9876F1Z3', '789 Business Center', 'Gurgaon', 'Haryana', '122001');

  -- Create B2C Customer (without GSTIN)
  INSERT INTO customers (user_id, name, email, phone, billing_address, city, state, pincode)
  VALUES 
    (v_user_id, 'Rajesh Kumar', 'rajesh@gmail.com', '+91 9876543213', 
     '321 Residential Area', 'Mumbai', 'Maharashtra', '400070');

  -- Create B2B Invoice 1 (Inter-state - IGST) - Amount > 50,000 for E-Way Bill
  INSERT INTO invoices (
    user_id, customer_id, invoice_number, invoice_date, due_date,
    subtotal, discount_amount, tax_amount, total_amount,
    cgst_amount, sgst_amount, igst_amount,
    place_of_supply, is_interstate, status
  ) VALUES (
    v_user_id, 
    (SELECT id FROM customers WHERE user_id = v_user_id AND name = 'Tech Solutions Pvt Ltd' LIMIT 1),
    'INV-25-26/0001', '2026-01-05', '2026-02-05',
    90000, 0, 16200, 106200,
    0, 0, 16200,
    '29-Karnataka', true, 'paid'
  );

  -- Create B2B Invoice 2 (Inter-state - IGST)
  INSERT INTO invoices (
    user_id, customer_id, invoice_number, invoice_date, due_date,
    subtotal, discount_amount, tax_amount, total_amount,
    cgst_amount, sgst_amount, igst_amount,
    place_of_supply, is_interstate, status
  ) VALUES (
    v_user_id,
    (SELECT id FROM customers WHERE user_id = v_user_id AND name = 'Global Enterprises' LIMIT 1),
    'INV-25-26/0002', '2026-01-08', '2026-02-08',
    50000, 0, 9000, 59000,
    0, 0, 9000,
    '06-Haryana', true, 'sent'
  );

  -- Create B2C Invoice (Intra-state - CGST+SGST)
  INSERT INTO invoices (
    user_id, customer_id, invoice_number, invoice_date, due_date,
    subtotal, discount_amount, tax_amount, total_amount,
    cgst_amount, sgst_amount, igst_amount,
    place_of_supply, is_interstate, status
  ) VALUES (
    v_user_id,
    (SELECT id FROM customers WHERE user_id = v_user_id AND name = 'Rajesh Kumar' LIMIT 1),
    'INV-25-26/0003', '2026-01-10', '2026-02-10',
    16000, 0, 1920, 17920,
    960, 960, 0,
    '27-Maharashtra', false, 'paid'
  );

  -- Create another B2B Invoice for current month (for GSTR reports)
  INSERT INTO invoices (
    user_id, customer_id, invoice_number, invoice_date, due_date,
    subtotal, discount_amount, tax_amount, total_amount,
    cgst_amount, sgst_amount, igst_amount,
    place_of_supply, is_interstate, status
  ) VALUES (
    v_user_id,
    (SELECT id FROM customers WHERE user_id = v_user_id AND name = 'Tech Solutions Pvt Ltd' LIMIT 1),
    'INV-25-26/0004', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
    75000, 0, 13500, 88500,
    0, 0, 13500,
    '29-Karnataka', true, 'sent'
  );

  RAISE NOTICE 'Demo data created successfully!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Business GSTIN: 27AABCT1234F1Z5';
  RAISE NOTICE 'Created 3 customers (2 B2B, 1 B2C)';
  RAISE NOTICE 'Created 4 invoices with GST breakdown';
  RAISE NOTICE 'Invoice INV-25-26/0001 is eligible for E-Way Bill (>50K)';
END $$;
