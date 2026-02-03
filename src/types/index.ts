// Core Types for HybridERP

export type UserRole = 'super_admin' | 'admin' | 'user' | 'staff';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  invoice_prefix: string;
  invoice_counter: number;
  currency: string;
  financial_year_start: number;
}

export type ItemType = 'product' | 'service';

export interface Item {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  hsn_code: string | null;
  category: string | null;
  unit: string;
  item_type: ItemType;
  sale_price: number;
  purchase_price: number | null;
  tax_rate: number;
  current_stock: number;
  reorder_level: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  customer_group: string | null;
  credit_limit: number | null;
  outstanding_balance: number;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type InvoiceType = 'tax_invoice' | 'proforma' | 'credit_note' | 'debit_note';

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  customer_id: string;
  customer?: Customer;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  notes: string | null;
  terms: string | null;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string | null;
  item?: Item;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  amount: number;
  unit?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque' | 'credit';

export interface Payment {
  id: string;
  invoice_id: string;
  user_id: string;
  invoice?: Invoice;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export type MovementType = 'purchase' | 'sale' | 'adjustment' | 'return';

export interface StockMovement {
  id: string;
  item_id: string;
  user_id: string;
  item?: Item;
  movement_type: MovementType;
  quantity: number;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

// GST Related
export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GSTRate = typeof GST_RATES[number];

export const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
] as const;

export const UNITS = [
  'PCS', 'NOS', 'KGS', 'GMS', 'LTR', 'ML', 'MTR', 'CM', 'SQM', 'SQFT', 'BOX', 'PKT', 'SET', 'HRS', 'DAYS'
] as const;

export type Unit = typeof UNITS[number];

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export type ProposalDesignStyle = 'classic' | 'modern' | 'bold';

export interface ProposalContent {
  about_company?: string;
  services_overview?: string;
  why_choose_us?: string[];
  scope_of_work?: Array<{
    title: string;
    description: string;
    deliverables: string[];
  }>;
  packages?: Array<{
    name: string;
    deliverables: string[];
    price: number;
    is_popular?: boolean;
    unit?: string;
  }>;
  addons?: Array<{
    name: string;
    description?: string;
    price: number;
    unit?: string; // e.g., "per month", "one-time"
  }>;
  timeline?: Array<{
    phase: string;
    duration: string;
  }>;
  payment_terms?: {
    advance_percent: number;
    methods: string;
  };
  requirements?: string[];
  terms?: string;
}

export interface Proposal {
  id: string;
  user_id: string;
  proposal_number: string;
  title: string;
  logo_url?: string;
  status: ProposalStatus;
  client_id: string | null;
  client_snapshot: any | null;
  valid_until: string | null;
  design_style: ProposalDesignStyle;
  industry: string;
  content: ProposalContent;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

