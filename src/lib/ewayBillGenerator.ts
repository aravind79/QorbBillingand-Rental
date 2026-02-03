import jsPDF from "jspdf";
import { formatCurrency, formatDate, getStateName, formatGSTNumber } from "./helpers";

export interface EWayBillData {
    // Invoice Details
    invoiceNumber: string;
    invoiceDate: string;
    invoiceType: "tax_invoice" | "rental_invoice";

    // Supplier Details
    supplierName: string;
    supplierGSTIN: string;
    supplierAddress: string;
    supplierCity: string;
    supplierState: string;
    supplierPincode: string;

    // Recipient Details
    recipientName: string;
    recipientGSTIN: string;
    recipientAddress: string;
    recipientCity: string;
    recipientState: string;
    recipientPincode: string;

    // Consignment Details
    placeOfSupply: string;
    consignmentValue: number;
    hsnCodes: string[];
    items: Array<{
        description: string;
        hsnCode: string;
        quantity: number;
        taxableValue: number;
    }>;

    // Tax Details
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;

    // Transport Details
    transportMode: "road" | "rail" | "air" | "ship";
    vehicleNumber?: string;
    transporterName?: string;
    transporterId?: string;
    distanceKm: number;

    // E-Way Bill Details
    ewayBillNumber?: string;
    validityDate: Date;
}

export async function generateEWayBillPDF(data: EWayBillData): Promise<jsPDF> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, options?: any) => {
        doc.text(text, x, y, options);
    };

    // Helper function to draw line
    const drawLine = (y: number) => {
        doc.line(margin, y, pageWidth - margin, y);
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    addText("E-WAY BILL", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    addText("(As per GST Rules)", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    if (data.ewayBillNumber) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        addText(`E-Way Bill No: ${data.ewayBillNumber}`, pageWidth / 2, yPos, { align: "center" });
        yPos += 8;
    }

    drawLine(yPos);
    yPos += 8;

    // PART A - Transaction Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    addText("PART A - Transaction Details", margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Document Details
    addText(`Document No: ${data.invoiceNumber}`, margin, yPos);
    addText(`Document Date: ${formatDate(data.invoiceDate)}`, pageWidth / 2, yPos);
    yPos += 6;

    addText(`Document Type: ${data.invoiceType === "tax_invoice" ? "Tax Invoice" : "Rental Invoice"}`, margin, yPos);
    yPos += 6;

    addText(`Place of Supply: ${data.placeOfSupply}`, margin, yPos);
    yPos += 10;

    // Supplier Details
    doc.setFont("helvetica", "bold");
    addText("From (Supplier):", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    addText(data.supplierName, margin + 5, yPos);
    yPos += 5;
    addText(`GSTIN: ${formatGSTNumber(data.supplierGSTIN)}`, margin + 5, yPos);
    yPos += 5;
    addText(data.supplierAddress, margin + 5, yPos);
    yPos += 5;
    addText(`${data.supplierCity}, ${data.supplierState} - ${data.supplierPincode}`, margin + 5, yPos);
    yPos += 10;

    // Recipient Details
    doc.setFont("helvetica", "bold");
    addText("To (Recipient):", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    addText(data.recipientName, margin + 5, yPos);
    yPos += 5;
    addText(`GSTIN: ${formatGSTNumber(data.recipientGSTIN)}`, margin + 5, yPos);
    yPos += 5;
    addText(data.recipientAddress, margin + 5, yPos);
    yPos += 5;
    addText(`${data.recipientCity}, ${data.recipientState} - ${data.recipientPincode}`, margin + 5, yPos);
    yPos += 10;

    // Items Table
    doc.setFont("helvetica", "bold");
    addText("Consignment Details:", margin, yPos);
    yPos += 6;

    // Table Header
    const tableStartY = yPos;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    addText("Description", margin + 2, yPos + 5);
    addText("HSN", margin + 80, yPos + 5);
    addText("Qty", margin + 110, yPos + 5);
    addText("Value", margin + 140, yPos + 5);
    yPos += 10;

    // Table Rows
    doc.setFont("helvetica", "normal");
    data.items.forEach((item) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        addText(item.description.substring(0, 40), margin + 2, yPos);
        addText(item.hsnCode, margin + 80, yPos);
        addText(item.quantity.toString(), margin + 110, yPos);
        addText(formatCurrency(item.taxableValue), margin + 140, yPos);
        yPos += 6;
    });

    yPos += 5;
    drawLine(yPos);
    yPos += 8;

    // Tax Summary
    doc.setFont("helvetica", "bold");
    addText("Tax Summary:", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    addText(`Taxable Value:`, margin + 5, yPos);
    addText(formatCurrency(data.consignmentValue - data.totalTax), margin + 100, yPos);
    yPos += 5;

    if (data.cgst > 0) {
        addText(`CGST:`, margin + 5, yPos);
        addText(formatCurrency(data.cgst), margin + 100, yPos);
        yPos += 5;
        addText(`SGST:`, margin + 5, yPos);
        addText(formatCurrency(data.sgst), margin + 100, yPos);
        yPos += 5;
    }

    if (data.igst > 0) {
        addText(`IGST:`, margin + 5, yPos);
        addText(formatCurrency(data.igst), margin + 100, yPos);
        yPos += 5;
    }

    doc.setFont("helvetica", "bold");
    addText(`Total Consignment Value:`, margin + 5, yPos);
    addText(formatCurrency(data.consignmentValue), margin + 100, yPos);
    yPos += 10;

    drawLine(yPos);
    yPos += 8;

    // PART B - Transport Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    addText("PART B - Transport Details", margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    addText(`Transport Mode: ${data.transportMode.toUpperCase()}`, margin, yPos);
    yPos += 6;

    if (data.vehicleNumber) {
        addText(`Vehicle Number: ${data.vehicleNumber}`, margin, yPos);
        yPos += 6;
    }

    if (data.transporterName) {
        addText(`Transporter Name: ${data.transporterName}`, margin, yPos);
        yPos += 6;
    }

    if (data.transporterId) {
        addText(`Transporter ID: ${data.transporterId}`, margin, yPos);
        yPos += 6;
    }

    addText(`Approximate Distance: ${data.distanceKm} km`, margin, yPos);
    yPos += 6;

    addText(`E-Way Bill Valid Till: ${formatDate(data.validityDate)}`, margin, yPos);
    yPos += 15;

    // QR Code Placeholder
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, yPos, 40, 40, "F");
    doc.setFontSize(8);
    addText("QR Code", margin + 12, yPos + 22);
    addText("Placeholder", margin + 8, yPos + 27);

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    addText("This is a computer-generated E-Way Bill and does not require a signature.", pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
    addText("For queries, visit: https://ewaybillgst.gov.in", pageWidth / 2, yPos, { align: "center" });

    return doc;
}

export async function downloadEWayBillPDF(data: EWayBillData, filename?: string): Promise<void> {
    const doc = await generateEWayBillPDF(data);
    const fileName = filename || `EWayBill_${data.invoiceNumber}_${Date.now()}.pdf`;
    doc.save(fileName);
}
