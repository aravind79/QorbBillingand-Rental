export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ============================================================================
// GST Calculation Functions
// ============================================================================

export function calculateGST(
  amount: number,
  taxRate: number,
  isInterState: boolean
): { cgst: number; sgst: number; igst: number; total: number } {
  const taxAmount = (amount * taxRate) / 100;

  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      total: taxAmount,
    };
  }

  return {
    cgst: taxAmount / 2,
    sgst: taxAmount / 2,
    igst: 0,
    total: taxAmount,
  };
}

export interface InvoiceGSTBreakdown {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateInvoiceGST(
  lineItems: Array<{
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxRate: number;
  }>,
  isInterState: boolean,
  shippingCharges: number = 0,
  invoiceDiscount: number = 0
): InvoiceGSTBreakdown {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  lineItems.forEach((item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemSubtotal * item.discountPercent) / 100;
    const taxableAmount = itemSubtotal - itemDiscount;
    const gst = calculateGST(taxableAmount, item.taxRate, isInterState);

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    totalCGST += gst.cgst;
    totalSGST += gst.sgst;
    totalIGST += gst.igst;
  });

  const taxableAmount = subtotal - totalDiscount - invoiceDiscount + shippingCharges;
  const totalTax = totalCGST + totalSGST + totalIGST;
  const grandTotal = taxableAmount + totalTax;

  return {
    subtotal,
    discount: totalDiscount + invoiceDiscount,
    taxableAmount,
    cgst: totalCGST,
    sgst: totalSGST,
    igst: totalIGST,
    totalTax,
    grandTotal,
  };
}

// ============================================================================
// GSTIN Validation and Utilities
// ============================================================================

export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim().toUpperCase());
}

export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!validateGSTIN(gstin)) return null;
  return gstin.substring(0, 2);
}

export function formatGSTNumber(gstin: string): string {
  if (!gstin) return "";
  // Format: 27 AABCT 1234 F 1Z 5
  const cleaned = gstin.replace(/\s/g, "");
  if (cleaned.length !== 15) return gstin;
  return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 7)} ${cleaned.substring(7, 11)} ${cleaned.substring(11, 12)} ${cleaned.substring(12, 14)} ${cleaned.substring(14)}`;
}

export function determineInterState(
  businessGSTIN: string | null,
  customerGSTIN: string | null
): boolean {
  if (!businessGSTIN || !customerGSTIN) return false;
  const businessState = getStateCodeFromGSTIN(businessGSTIN);
  const customerState = getStateCodeFromGSTIN(customerGSTIN);
  if (!businessState || !customerState) return false;
  return businessState !== customerState;
}

// Indian state codes for GST
const STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "25": "Daman and Diu", "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
  "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh",
  "38": "Ladakh", "97": "Other Territory",
};

export function getStateName(stateCode: string): string {
  return STATE_CODES[stateCode] || stateCode;
}

export function getPlaceOfSupply(stateCode: string): string {
  const stateName = getStateName(stateCode);
  return `${stateCode}-${stateName}`;
}

export function getAllStates(): Array<{ code: string; name: string }> {
  return Object.entries(STATE_CODES).map(([code, name]) => ({ code, name }));
}

// ============================================================================
// HSN/SAC Code Validation
// ============================================================================

export function validateHSNCode(hsn: string): boolean {
  if (!hsn) return false;
  const hsnRegex = /^[0-9]{4}([0-9]{2})?([0-9]{2})?$/;
  return hsnRegex.test(hsn.trim());
}

export function validateSACCode(sac: string): boolean {
  if (!sac) return false;
  const sacRegex = /^[0-9]{6}$/;
  return sacRegex.test(sac.trim());
}

export function validateHSNSACCode(code: string): boolean {
  if (!code) return false;
  return validateHSNCode(code) || validateSACCode(code);
}

// ============================================================================
// E-Way Bill Utilities
// ============================================================================

export function isEWayBillRequired(totalAmount: number): boolean {
  return totalAmount >= 50000;
}

export function calculateEWayBillValidity(distanceKm: number): number {
  if (distanceKm <= 100) return 1;
  return Math.ceil(distanceKm / 100);
}

export function getEWayBillValidityDate(distanceKm: number): Date {
  const days = calculateEWayBillValidity(distanceKm);
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + days);
  return validityDate;
}

// ============================================================================
// Invoice Number Generation
// ============================================================================

export function generateInvoiceNumber(prefix: string, counter: number): string {
  const year = new Date().getFullYear();
  const paddedCounter = counter.toString().padStart(4, "0");
  return `${prefix}-${year}-${paddedCounter}`;
}

export function generateInvoiceNumberWithFY(prefix: string, counter: number): string {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  const fyEndYear = fyStartYear + 1;
  const fy = `${fyStartYear.toString().slice(-2)}-${fyEndYear.toString().slice(-2)}`;

  const paddedCounter = counter.toString().padStart(4, "0");
  return `${prefix}-${fy}/${paddedCounter}`;
}

// ============================================================================
// Line Item Calculations
// ============================================================================

export function calculateLineItemAmount(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
  taxRate: number = 0
): { subtotal: number; discount: number; tax: number; total: number } {
  const subtotal = quantity * unitPrice;
  const discount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discount;
  const tax = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + tax;

  return { subtotal, discount, tax, total };
}

// ============================================================================
// Number to Words Conversion (for Indian Rupees)
// ============================================================================

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

function convertLessThanThousand(num: number): string {
  if (num === 0) return "";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? " " + ones[one] : "");
  }
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  return ones[hundred] + " Hundred" + (remainder > 0 ? " " + convertLessThanThousand(remainder) : "");
}

export function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";

  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = "";

  if (rupees >= 10000000) {
    const crores = Math.floor(rupees / 10000000);
    result += convertLessThanThousand(crores) + " Crore ";
    rupees %= 10000000;
  }
  if (rupees >= 100000) {
    const lakhs = Math.floor(rupees / 100000);
    result += convertLessThanThousand(lakhs) + " Lakh ";
    rupees %= 100000;
  }
  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000);
    result += convertLessThanThousand(thousands) + " Thousand ";
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertLessThanThousand(rupees);
  }

  result = result.trim() + " Rupees";
  if (paise > 0) {
    result += " and " + convertLessThanThousand(paise) + " Paise";
  }
  return result + " Only";
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// ============================================================================
// Financial Year Utilities
// ============================================================================

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  const fyEndYear = fyStartYear + 1;
  return `${fyStartYear}-${fyEndYear}`;
}

export function getFinancialYearMonths(financialYear: string): Array<{ month: number; year: number; label: string }> {
  const [startYear] = financialYear.split("-").map(Number);
  const months = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 12; i++) {
    const month = ((i + 3) % 12) + 1;
    const year = month >= 4 ? startYear : startYear + 1;
    months.push({ month, year, label: `${monthNames[month - 1]} ${year}` });
  }
  return months;
}
