import { Invoice } from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/helpers";

// Export interfaces for reuse
export interface BusinessInfo {
  business_name: string;
  gstin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number | null;
  discount_percent: number | null;
  amount: number;
  unit?: string;
}

export function generateInvoiceHTML(
  invoice: Invoice,
  items: InvoiceItem[],
  business: BusinessInfo,
  gstEnabled: boolean = true
): string {
  const customerName = invoice.customer?.name || "Customer";
  const customerAddress = [
    invoice.customer?.billing_address,
    invoice.customer?.city,
    invoice.customer?.state,
    invoice.customer?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  // Determine if tax should be shown based on actual tax amount
  const hasTax = (invoice.tax_amount || 0) > 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20mm;
          font-size: 12px;
          color: #1e293b;
          width: 210mm; /* Force A4 width for consistency */
          background: white;
        }
        .header { 
          background: white;
          color: #1e293b;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 2px solid #0d9488;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .company-name { font-size: 22px; font-weight: bold; margin-bottom: 8px; color: #0d9488; }
        .company-details { font-size: 10px; opacity: 0.95; line-height: 1.5; }
        .invoice-title { font-size: 18px; font-weight: bold; text-align: right; color: #94a3b8; }
        .invoice-meta { text-align: right; margin-top: 10px; font-size: 11px; }
        .invoice-meta p { margin: 3px 0; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; margin-bottom: 10px; color: #0d9488; font-size: 13px; }
        .bill-to { background: #f8fafc; padding: 15px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { 
          background: #f1f5f9; 
          padding: 12px 8px; 
          text-align: left; 
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          font-size: 11px;
        }
        td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary { width: 300px; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 11px; }
        .summary-total { 
          background: white; 
          color: #0d9488; 
          padding: 12px 0; 
          font-size: 18px; 
          font-weight: bold;
          margin-top: 10px;
          text-align: right;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #64748b; 
          font-size: 11px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        @media print {
          body { padding: 10mm; width: auto; }
          .header { margin: 0 0 20px 0; }
          @page { size: A4; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div>
            <div class="company-name">${business.business_name}</div>
            <div class="company-details">
              ${business.address ? `${business.address}, ` : ""}${business.city ? `${business.city}, ${business.state} - ${business.pincode || ""}<br>` : ""}
              ${business.phone ? `${business.phone} | ` : ""}${business.email || ""}
            </div>
          </div>
          <div>
            ${business.gstin ? `<div style="font-size: 11px; margin-bottom: 10px;">GSTIN: ${business.gstin}</div>` : ""}
            <div class="invoice-title">${hasTax ? 'TAX INVOICE' : 'INVOICE'}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div class="section" style="flex: 1;">
          <div class="section-title">Invoice Details</div>
          <p style="margin: 3px 0;"><strong>Invoice No:</strong> ${invoice.invoice_number}</p>
          <p style="margin: 3px 0;"><strong>Date:</strong> ${formatDate(invoice.invoice_date)}</p>
          <p style="margin: 3px 0;"><strong>Due Date:</strong> ${invoice.due_date ? formatDate(invoice.due_date) : "On Receipt"}</p>
        </div>
        <div class="section bill-to" style="flex: 1; margin-left: 20px;">
          <div class="section-title">Bill To</div>
          <p style="font-weight: 600; margin-bottom: 5px;">${customerName}</p>
          <p style="font-size: 11px; color: #64748b;">${customerAddress}</p>
          ${invoice.customer?.gstin ? `<p style="font-size: 11px; margin-top: 5px;">GSTIN: ${invoice.customer.gstin}</p>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40%">Description</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Rate</th>
            ${hasTax ? '<th class="text-right">Tax%</th><th class="text-right">Tax Amt</th>' : ''}
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items
      .map(
        (item) => {
          const isTimeBased = item.unit && ['hrs', 'hr', 'hour', 'hours', 'days', 'day', 'months', 'month'].includes(item.unit.toLowerCase());
          const rateText = isTimeBased ? `${formatCurrency(item.unit_price)}/${item.unit}` : formatCurrency(item.unit_price);
          const qtyText = item.unit ? `${item.quantity} ${item.unit}` : item.quantity.toString();
          const taxAmount = ((item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)) * (item.tax_rate || 0)) / 100;

          return `
            <tr>
              <td>${item.description}</td>
              <td class="text-center">${qtyText}</td>
              <td class="text-right">${rateText}</td>
              ${hasTax ? `<td class="text-right">${item.tax_rate || 0}%</td><td class="text-right">${formatCurrency(taxAmount)}</td>` : ''}
              <td class="text-right">${formatCurrency(item.amount)}</td>
            </tr>
          `;
        }
      )
      .join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal || 0)}</span>
        </div>
        <div class="summary-row">
          <span>Discount:</span>
          <span>-${formatCurrency(invoice.discount_amount || 0)}</span>
        </div>
        ${hasTax ? `
        <div class="summary-row">
          <span>Tax (GST):</span>
          <span>${formatCurrency(invoice.tax_amount || 0)}</span>
        </div>
        ` : ''}
        <div class="summary-total">
          <div class="summary-row" style="margin: 0;">
            <span>Total:</span>
            <span>${formatCurrency(invoice.total_amount || 0)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `<div class="section"><div class="section-title">Notes:</div><p style="font-size: 11px; color: #64748b;">${invoice.notes}</p></div>` : ""}

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Qorb Billing</p>
      </div>
    </body>
    </html>
  `;
}

export function printInvoiceA4(
  invoice: Invoice,
  items: InvoiceItem[],
  business: BusinessInfo,
  gstEnabled: boolean = true
) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    alert("Please allow popups to print invoices");
    return;
  }

  const htmlContent = generateInvoiceHTML(invoice, items, business, gstEnabled);

  // Wrap with print script
  const fullHtml = htmlContent.replace('</body>', `
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
  `);

  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

export function printInvoiceLabel(
  invoice: Invoice,
  business: BusinessInfo
) {
  const printWindow = window.open("", "_blank", "width=400,height=300");
  if (!printWindow) {
    alert("Please allow popups to print labels");
    return;
  }

  const customerName = invoice.customer?.name || "Customer";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Label - ${invoice.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 5mm;
          font-size: 10px;
        }
        .label {
          width: 100mm;
          height: 50mm;
          border: 1px dashed #ccc;
          padding: 3mm;
        }
        .company { font-size: 12px; font-weight: bold; margin-bottom: 3mm; }
        .invoice-num { font-size: 14px; font-weight: bold; color: #0d9488; }
        .row { display: flex; justify-content: space-between; margin: 2mm 0; }
        .customer { font-weight: bold; margin: 3mm 0; }
        .amount { font-size: 16px; font-weight: bold; color: #0d9488; }
        @media print {
          body { padding: 0; }
          .label { border: none; }
          @page { size: 100mm 50mm; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="company">${business.business_name}</div>
        <div class="invoice-num">${invoice.invoice_number}</div>
        <div class="row">
          <span>Date: ${formatDate(invoice.invoice_date)}</span>
          <span>Due: ${invoice.due_date ? formatDate(invoice.due_date) : "On Receipt"}</span>
        </div>
        <div class="customer">${customerName}</div>
        <div class="row">
          <span>Amount:</span>
          <span class="amount">${formatCurrency(invoice.total_amount || 0)}</span>
        </div>
        <div class="row">
          <span>Status: ${(invoice.status || "draft").toUpperCase()}</span>
          <span>Balance: ${formatCurrency(invoice.balance_due || 0)}</span>
        </div>
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
