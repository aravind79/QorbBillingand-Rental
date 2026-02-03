import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Invoice, InvoiceItem, Customer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/helpers";

// PDF-safe currency formatter (jsPDF doesn't handle ₹ symbol well)
function formatCurrencyForPDF(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs.${formatted}`;
}

interface BusinessInfo {
  business_name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  primary_color?: string;
}

interface InvoicePDFData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer;
  business: BusinessInfo;
  upiId?: string;
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [13, 148, 136]; // Default Teal
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Blob> {
  const { invoice, items, customer, business, upiId } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Colors
  const primaryColor = business.primary_color ? hexToRgb(business.primary_color) : [13, 148, 136]; // Teal default
  const textColor = [0, 0, 0]; // Black for clear visibility
  const mutedColor = [40, 40, 40]; // Dark Grey (previously faded)

  // Header background - REMOVED for cleaner print
  // doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  // doc.rect(0, 0, pageWidth, 45, "F");

  // Company Name
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(business.business_name, margin, y);
  y += 8;

  // Company Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  // Address details in muted color
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  if (business.address) {
    doc.text(`${business.address}, ${business.city}, ${business.state} - ${business.pincode}`, margin, y);
    y += 5;
  }
  if (business.phone || business.email) {
    doc.text(`${business.phone || ""} | ${business.email || ""}`, margin, y);
  }

  // GSTIN on right
  if (business.gstin) {
    doc.setFontSize(10);
    doc.text(`GSTIN: ${business.gstin}`, pageWidth - margin - 50, 20);
  }

  // Invoice Type Label - show "TAX INVOICE" only if explicitly GST invoice type or tax > 0
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  // Check invoice type AND amount to be sure
  const isTaxInvoice = invoice.invoice_type === 'tax_invoice' && invoice.tax_amount > 0;
  const invoiceTypeLabel = isTaxInvoice
    ? "TAX INVOICE"
    : "INVOICE";

  // Invoice Title Color - Light Gray but visible
  doc.setTextColor(150, 150, 150);
  doc.text(invoiceTypeLabel, pageWidth - margin - doc.getTextWidth(invoiceTypeLabel), 35);

  y = 55;

  // Invoice Details Box
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  // Use darker color for details keys
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

  const detailsLeft = [
    ["Invoice No:", invoice.invoice_number],
    ["Date:", formatDate(invoice.invoice_date)],
    ["Due Date:", invoice.due_date ? formatDate(invoice.due_date) : "On Receipt"],
  ];

  detailsLeft.forEach(([label, value]) => {
    doc.text(label, margin, y);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(value, margin + 25, y);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    y += 5;
  });

  // Bill To
  y = 55;
  const billToX = pageWidth / 2;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", billToX, y);
  y += 7;

  doc.setFontSize(10);
  doc.text(customer.name, billToX, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

  if (customer.billing_address) {
    doc.text(customer.billing_address, billToX, y);
    y += 5;
  }
  if (customer.city) {
    doc.text(`${customer.city}, ${customer.state} - ${customer.pincode || ""}`, billToX, y);
    y += 5;
  }
  if (customer.gstin) {
    doc.text(`GSTIN: ${customer.gstin}`, billToX, y);
    y += 5;
  }

  y = 95;

  // Items Table Header
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  // Conditional column widths and headers based on tax
  const hasTax = invoice.tax_amount > 0;
  // Adjusted widths to fit 180mm available width (210mm - 2*15mm margin)
  // Total: 60+15+25+15+25+30 = 170mm
  const colWidths = hasTax ? [60, 15, 25, 15, 25, 30] : [70, 20, 35, 45];
  const headers = hasTax
    ? ["Description", "Qty", "Rate", "Tax%", "Tax Amt", "Amount"]
    : ["Description", "Qty", "Rate", "Amount"];
  let x = margin + 2;

  headers.forEach((header, i) => {
    doc.text(header, x, y + 7);
    x += colWidths[i];
  });

  y += 12;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    const subtotal = item.quantity * item.unit_price;
    const discount = (subtotal * item.discount_percent) / 100;
    const taxableAmount = subtotal - discount;
    const taxAmount = (taxableAmount * item.tax_rate) / 100;

    x = margin + 2;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Description (truncate if too long)
    const desc = item.description.length > 30 ? item.description.substring(0, 30) + "..." : item.description;
    doc.text(desc, x, y);
    x += colWidths[0];

    // Quantity with unit label
    const qtyText = item.unit ? `${item.quantity} ${item.unit}` : item.quantity.toString();
    doc.text(qtyText, x, y);
    x += colWidths[1];

    // Rate with unit suffix for hourly/time-based items
    const isTimeBased = item.unit && ['hrs', 'hr', 'hour', 'hours', 'days', 'day', 'months', 'month'].includes(item.unit.toLowerCase());
    const rateText = isTimeBased
      ? `${formatCurrencyForPDF(item.unit_price)}/${item.unit}`
      : formatCurrencyForPDF(item.unit_price);
    doc.text(rateText, x, y);
    x += colWidths[2];

    // Conditionally render tax columns
    if (hasTax) {
      doc.text(`${item.tax_rate}%`, x, y);
      x += colWidths[3];

      doc.text(formatCurrencyForPDF(taxAmount), x, y);
      x += colWidths[4];
    }

    doc.text(formatCurrencyForPDF(item.amount), x, y);

    y += 7;

    // Separator line
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  y += 5;

  // Summary
  const summaryX = pageWidth - margin - 70;
  doc.setFontSize(9);

  const summaryItems = [
    ["Subtotal:", formatCurrencyForPDF(invoice.subtotal)],
    ["Discount:", `-${formatCurrencyForPDF(invoice.discount_amount)}`],
  ];

  // Only add tax line if tax exists
  if (hasTax) {
    summaryItems.push(["Tax (GST):", formatCurrencyForPDF(invoice.tax_amount)]);
  }

  summaryItems.forEach(([label, value]) => {
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(label, summaryX, y);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(value, summaryX + 40, y);
    y += 6;
  });

  // Total
  // doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  // doc.rect(summaryX - 5, y - 3, 75, 12, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14); // Slightly larger
  doc.setFont("helvetica", "bold");
  doc.text("Total:", summaryX, y + 5);
  doc.text(formatCurrencyForPDF(invoice.total_amount), summaryX + 40, y + 5);

  y += 20;

  // QR Code for payment (only if UPI ID is configured and there's balance due)
  if (upiId && invoice.balance_due && invoice.balance_due > 0) {
    try {
      const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(business.business_name)}&am=${invoice.balance_due}&tn=${encodeURIComponent(`Invoice ${invoice.invoice_number}`)}`;

      const qrDataUrl = await QRCode.toDataURL(upiString, {
        width: 80,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      doc.addImage(qrDataUrl, "PNG", margin, y, 30, 30);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Scan to Pay via UPI", margin, y + 34);
    } catch (err) {
      console.error("QR generation error:", err);
    }
  }

  // Notes
  if (invoice.notes) {
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", margin + 45, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.notes, margin + 45, y + 10);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFontSize(8);
  doc.text("Thank you for your business!", pageWidth / 2, footerY, { align: "center" });
  doc.text("Qorb Billing", pageWidth / 2, footerY + 5, { align: "center" });

  return doc.output("blob");
}

export function downloadInvoicePDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
