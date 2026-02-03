import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "./helpers";

export interface SubscriptionInvoiceData {
  transactionId: string;
  planName: string;
  amount: number;
  billingCycle: string;
  status: string;
  createdAt: string;
  razorpayPaymentId?: string;
  businessName: string;
  businessEmail: string;
  businessAddress?: string;
  businessGstin?: string;
  customerName: string;
  customerEmail: string;
}

export async function generateSubscriptionInvoicePDF(data: SubscriptionInvoiceData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(79, 70, 229); // Primary color
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SUBSCRIPTION INVOICE", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${data.transactionId.slice(0, 8).toUpperCase()}`, 20, 35);

  y = 60;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Company details (left side)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("From:", 20, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  y += 8;
  doc.text("qorb", 20, y);
  y += 5;
  doc.text("Hybrid ERP Solutions", 20, y);
  y += 5;
  doc.text("support@qorb.app", 20, y);

  // Customer details (right side)
  let rightY = 60;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 120, rightY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  rightY += 8;
  doc.text(data.customerName || "Customer", 120, rightY);
  rightY += 5;
  doc.text(data.customerEmail || "", 120, rightY);
  if (data.businessName) {
    rightY += 5;
    doc.text(data.businessName, 120, rightY);
  }

  y = Math.max(y, rightY) + 20;

  // Invoice details box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, y, pageWidth - 40, 35, 3, 3, "F");

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date", 30, y);
  doc.text("Payment Status", 80, y);
  doc.text("Payment Method", 130, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(data.createdAt), 30, y);
  doc.text(data.status.toUpperCase(), 80, y);
  doc.text("Online", 130, y);

  y += 25;

  // Items table header
  doc.setFillColor(79, 70, 229);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, y, pageWidth - 40, 10, "F");
  
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, y);
  doc.text("Billing Cycle", 100, y);
  doc.text("Amount", 160, y);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Item row
  doc.setFont("helvetica", "normal");
  doc.text(`${data.planName} Plan Subscription`, 25, y);
  doc.text(data.billingCycle.charAt(0).toUpperCase() + data.billingCycle.slice(1), 100, y);
  doc.text(formatCurrency(data.amount), 160, y);

  y += 20;

  // Totals
  doc.setDrawColor(229, 231, 235);
  doc.line(120, y, pageWidth - 20, y);
  
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 120, y);
  doc.text(formatCurrency(data.amount), 160, y);

  y += 8;
  doc.text("GST (18%):", 120, y);
  const gst = data.amount * 0.18;
  doc.text(formatCurrency(gst), 160, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", 120, y);
  doc.text(formatCurrency(data.amount + gst), 160, y);

  y += 20;

  // Payment reference
  if (data.razorpayPaymentId) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(`Payment Reference: ${data.razorpayPaymentId}`, 20, y);
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, y, pageWidth - 20, y);
  
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Thank you for your subscription!", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("For support, contact support@qorb.app", pageWidth / 2, y, { align: "center" });

  return doc.output("blob");
}

export function downloadSubscriptionInvoicePDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
