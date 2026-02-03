import { Invoice } from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/helpers";

interface BusinessInfo {
  business_name: string;
  gstin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number | null;
  discount_percent: number | null;
  amount: number;
}

export type ThermalPaperWidth = "58mm" | "80mm" | "3inch";

const PAPER_WIDTHS: Record<ThermalPaperWidth, { width: string; charPerLine: number }> = {
  "58mm": { width: "58mm", charPerLine: 32 },
  "80mm": { width: "80mm", charPerLine: 48 },
  "3inch": { width: "76mm", charPerLine: 42 },
};

export function printThermalInvoice(
  invoice: Invoice,
  items: InvoiceItem[],
  business: BusinessInfo,
  paperWidth: ThermalPaperWidth = "80mm"
) {
  const config = PAPER_WIDTHS[paperWidth];
  const printWindow = window.open("", "_blank", "width=400,height=600");
  
  if (!printWindow) {
    alert("Please allow popups to print invoices");
    return;
  }

  const customerName = invoice.customer?.name || "Customer";
  const customerPhone = invoice.customer?.phone || "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${invoice.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace;
          width: ${config.width};
          padding: 2mm;
          font-size: 10px;
          line-height: 1.3;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { 
          border-bottom: 1px dashed #000; 
          margin: 3mm 0;
        }
        .company-name { 
          font-size: 14px; 
          font-weight: bold; 
          text-align: center;
          margin-bottom: 1mm;
        }
        .company-details {
          text-align: center;
          font-size: 9px;
          margin-bottom: 2mm;
        }
        .invoice-header {
          text-align: center;
          margin: 2mm 0;
        }
        .invoice-num {
          font-size: 12px;
          font-weight: bold;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
        }
        .item-row {
          margin: 2mm 0;
        }
        .item-name {
          font-weight: bold;
        }
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
        }
        .total-section {
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 1px solid #000;
        }
        .grand-total {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          margin: 3mm 0;
          padding: 2mm;
          border: 1px solid #000;
        }
        .footer {
          text-align: center;
          margin-top: 4mm;
          font-size: 9px;
        }
        .footer-thanks {
          font-weight: bold;
          margin-bottom: 1mm;
        }
        @media print {
          body { padding: 0; }
          @page { 
            size: ${config.width} auto; 
            margin: 0; 
          }
        }
      </style>
    </head>
    <body>
      <div class="company-name">${business.business_name}</div>
      <div class="company-details">
        ${business.address ? `${business.address}<br>` : ""}
        ${business.city ? `${business.city}${business.state ? `, ${business.state}` : ""}${business.pincode ? ` - ${business.pincode}` : ""}<br>` : ""}
        ${business.phone ? `Ph: ${business.phone}<br>` : ""}
        ${business.gstin ? `GSTIN: ${business.gstin}` : ""}
      </div>
      
      <div class="divider"></div>
      
      <div class="invoice-header">
        <div class="invoice-num">${invoice.invoice_number}</div>
        <div>${formatDate(invoice.invoice_date)}</div>
      </div>
      
      <div class="row">
        <span>Customer:</span>
        <span class="bold">${customerName}</span>
      </div>
      ${customerPhone ? `<div class="row"><span>Phone:</span><span>${customerPhone}</span></div>` : ""}
      
      <div class="divider"></div>
      
      ${items.map((item, idx) => `
        <div class="item-row">
          <div class="item-name">${idx + 1}. ${item.description}</div>
          <div class="item-details">
            <span>${item.quantity} x ${formatCurrency(item.unit_price)}</span>
            <span>${formatCurrency(item.amount)}</span>
          </div>
        </div>
      `).join("")}
      
      <div class="total-section">
        <div class="row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal || 0)}</span>
        </div>
        ${(invoice.discount_amount || 0) > 0 ? `
        <div class="row">
          <span>Discount:</span>
          <span>-${formatCurrency(invoice.discount_amount || 0)}</span>
        </div>
        ` : ""}
        ${(invoice.tax_amount || 0) > 0 ? `
        <div class="row">
          <span>Tax (GST):</span>
          <span>${formatCurrency(invoice.tax_amount || 0)}</span>
        </div>
        ` : ""}
      </div>
      
      <div class="grand-total">
        TOTAL: ${formatCurrency(invoice.total_amount || 0)}
      </div>
      
      ${invoice.balance_due && invoice.balance_due > 0 ? `
      <div class="row">
        <span>Paid:</span>
        <span>${formatCurrency((invoice.total_amount || 0) - (invoice.balance_due || 0))}</span>
      </div>
      <div class="row bold">
        <span>Balance Due:</span>
        <span>${formatCurrency(invoice.balance_due)}</span>
      </div>
      ` : ""}
      
      <div class="divider"></div>
      
      <div class="footer">
        <div class="footer-thanks">Thank You!</div>
        <div>Visit Again</div>
        ${business.email ? `<div>${business.email}</div>` : ""}
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// Utility to connect to network thermal printer via raw socket (browser-side is limited)
// For USB/Bluetooth, users typically need to set up as system default printer
export function getThermalPrinterInfo(): string {
  return `
Thermal Printer Setup:
- USB: Connect printer and set as default system printer
- Bluetooth: Pair printer in system settings, then set as default
- Network: Configure printer's IP in your system's printer settings

The browser will use your system's default printer when printing.
  `.trim();
}
