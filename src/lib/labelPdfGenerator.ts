import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/helpers";

interface LabelData {
  rental_number: string;
  customer_name: string;
  customer_phone?: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  security_deposit: number;
  items: Array<{
    name: string;
    quantity: number;
    rate_amount: number;
    rental_days: number;
  }>;
  business_name: string;
  business_phone?: string;
}

// Generate label for thermal/label printer (common sizes: 4x6, 4x4, 2x4 inches)
export async function generateLabelPDF(data: LabelData): Promise<Blob> {
  // Use 4x6 inch label size (common thermal label)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [100, 150], // 4x6 inch approximately
  });

  const pageWidth = 100;
  const margin = 5;
  let y = 10;

  // Business Name (Header)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.business_name, pageWidth / 2, y, { align: "center" });
  y += 6;

  if (data.business_phone) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(data.business_phone, pageWidth / 2, y, { align: "center" });
    y += 4;
  }

  // Divider
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Rental Number (Large)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`RENTAL: ${data.rental_number}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // Customer Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Customer:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.customer_name, margin + 22, y);
  y += 5;

  if (data.customer_phone) {
    doc.setFont("helvetica", "bold");
    doc.text("Phone:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.customer_phone, margin + 22, y);
    y += 5;
  }

  // Divider
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Rental Period
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Rental Period:", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`From: ${formatDate(data.rental_start_date)}`, margin, y);
  y += 4;
  doc.text(`To:   ${formatDate(data.rental_end_date)}`, margin, y);
  y += 6;

  // Items
  doc.setFont("helvetica", "bold");
  doc.text("Items:", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  data.items.forEach((item) => {
    const itemLine = `${item.name} x${item.quantity}`;
    const amountLine = `${formatCurrency(item.rate_amount)}/day × ${item.rental_days}d = ${formatCurrency(item.rate_amount * item.quantity * item.rental_days)}`;
    
    doc.text(`• ${itemLine}`, margin, y);
    y += 4;
    doc.text(`  ${amountLine}`, margin, y);
    y += 5;
  });

  // Divider
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Totals
  doc.setFontSize(9);
  
  doc.setFont("helvetica", "normal");
  doc.text("Rent Fee:", margin, y);
  doc.text(formatCurrency(data.total_amount), pageWidth - margin, y, { align: "right" });
  y += 5;

  doc.text("Security Deposit:", margin, y);
  doc.text(formatCurrency(data.security_deposit), pageWidth - margin, y, { align: "right" });
  y += 5;

  // Total Box
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 1, pageWidth - 2 * margin, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL PAID:", margin + 2, y + 5);
  doc.text(formatCurrency(data.total_amount + data.security_deposit), pageWidth - margin - 2, y + 5, { align: "right" });
  y += 12;

  // Return Date Highlight
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`RETURN BY: ${formatDate(data.rental_end_date)}`, pageWidth / 2, y + 7, { align: "center" });
  y += 14;

  // Footer
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Please return items in good condition.", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text("Late fees may apply for overdue returns.", pageWidth / 2, y, { align: "center" });

  return doc.output("blob");
}

export function downloadLabelPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
