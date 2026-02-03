import jsPDF from "jspdf";
import { format } from "date-fns";

interface ChallanItem {
  description: string;
  quantity: number;
  unit?: string;
}

interface ChallanData {
  challanNumber: string;
  challanDate: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerGSTIN?: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessGSTIN?: string;
  items: ChallanItem[];
  notes?: string;
  vehicleNumber?: string;
  driverName?: string;
}

export function generateChallanPDF(data: ChallanData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Helper function for centered text
  const centerText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  centerText("DELIVERY CHALLAN", yPos, 18);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  centerText("(Not for Tax Purpose)", yPos, 10);
  yPos += 15;

  // Business Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessName, margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (data.businessAddress) {
    doc.text(data.businessAddress, margin, yPos);
    yPos += 5;
  }
  if (data.businessPhone) {
    doc.text(`Phone: ${data.businessPhone}`, margin, yPos);
    yPos += 5;
  }
  if (data.businessGSTIN) {
    doc.text(`GSTIN: ${data.businessGSTIN}`, margin, yPos);
    yPos += 5;
  }
  yPos += 5;

  // Challan Details Box
  doc.setDrawColor(200);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25);
  
  doc.setFontSize(10);
  doc.text(`Challan No: ${data.challanNumber}`, margin + 5, yPos + 8);
  doc.text(`Date: ${format(new Date(data.challanDate), "dd/MM/yyyy")}`, margin + 5, yPos + 16);
  
  if (data.vehicleNumber) {
    doc.text(`Vehicle No: ${data.vehicleNumber}`, pageWidth / 2, yPos + 8);
  }
  if (data.driverName) {
    doc.text(`Driver: ${data.driverName}`, pageWidth / 2, yPos + 16);
  }
  yPos += 35;

  // Ship To
  doc.setFont("helvetica", "bold");
  doc.text("Ship To:", margin, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, margin, yPos);
  yPos += 5;
  if (data.customerAddress) {
    const addressLines = doc.splitTextToSize(data.customerAddress, pageWidth - 2 * margin);
    addressLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  }
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, margin, yPos);
    yPos += 5;
  }
  if (data.customerGSTIN) {
    doc.text(`GSTIN: ${data.customerGSTIN}`, margin, yPos);
    yPos += 5;
  }
  yPos += 10;

  // Items Table Header
  const tableStartY = yPos;
  const colWidths = [15, 100, 35, 30];
  
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, "F");
  doc.setFont("helvetica", "bold");
  
  let xPos = margin + 5;
  doc.text("S.No", xPos, yPos + 7);
  xPos += colWidths[0];
  doc.text("Description", xPos, yPos + 7);
  xPos += colWidths[1];
  doc.text("Quantity", xPos, yPos + 7);
  xPos += colWidths[2];
  doc.text("Unit", xPos, yPos + 7);
  
  yPos += 12;
  doc.setFont("helvetica", "normal");

  // Items
  data.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    xPos = margin + 5;
    doc.text(String(index + 1), xPos, yPos);
    xPos += colWidths[0];
    
    const descLines = doc.splitTextToSize(item.description, colWidths[1] - 5);
    doc.text(descLines, xPos, yPos);
    xPos += colWidths[1];
    
    doc.text(String(item.quantity), xPos, yPos);
    xPos += colWidths[2];
    doc.text(item.unit || "PCS", xPos, yPos);
    
    yPos += Math.max(descLines.length * 5, 8);
  });

  // Draw table border
  doc.setDrawColor(200);
  doc.rect(margin, tableStartY, pageWidth - 2 * margin, yPos - tableStartY + 5);

  yPos += 15;

  // Notes
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", margin, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
    doc.text(noteLines, margin, yPos);
    yPos += noteLines.length * 5 + 10;
  }

  // Signatures
  yPos = Math.max(yPos, 230);
  doc.setDrawColor(150);
  
  doc.text("Received By:", margin, yPos);
  doc.line(margin + 30, yPos + 2, margin + 80, yPos + 2);
  
  doc.text("Authorized Signature:", pageWidth - margin - 80, yPos);
  doc.line(pageWidth - margin - 50, yPos + 2, pageWidth - margin, yPos + 2);

  yPos += 15;
  doc.text("Date:", margin, yPos);
  doc.line(margin + 15, yPos + 2, margin + 50, yPos + 2);

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(128);
  centerText("This is a delivery challan and not a tax invoice", yPos, 8);

  return doc;
}
