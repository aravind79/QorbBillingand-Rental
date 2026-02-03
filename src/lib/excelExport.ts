import ExcelJS from 'exceljs';
import { formatCurrency } from './helpers';

/**
 * Simplified Excel export for GSTR-1
 */
export async function exportGSTR1ToExcel(
    data: any,
    month: number,
    year: number,
    businessName: string
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = businessName;
    workbook.created = new Date();

    // B2B Sheet
    const b2bSheet = workbook.addWorksheet('B2B Invoices');
    b2bSheet.columns = [
        { header: 'Invoice No', key: 'invoiceNumber', width: 16 },
        { header: 'Date', key: 'invoiceDate', width: 14 },
        { header: 'Customer', key: 'customerName', width: 30 },
        { header: 'GSTIN', key: 'customerGSTIN', width: 18 },
        { header: 'Place of Supply', key: 'placeOfSupply', width: 16 },
        { header: 'Taxable Value', key: 'taxableValue', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'Total', key: 'totalValue', width: 15 },
    ];

    // Style header
    b2bSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    b2bSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
    };

    // Add data
    data.b2b.forEach((invoice: any) => {
        b2bSheet.addRow(invoice);
    });

    // B2C Sheet
    const b2cSheet = workbook.addWorksheet('B2C Summary');
    b2cSheet.columns = [
        { header: 'State', key: 'state', width: 20 },
        { header: 'Taxable Value', key: 'taxableValue', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'Total', key: 'totalValue', width: 15 },
    ];

    b2cSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    b2cSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
    };

    data.b2c.forEach((entry: any) => {
        b2cSheet.addRow(entry);
    });

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.mergeCells('A1:B1');
    summarySheet.getCell('A1').value = `GSTR-1 Summary - ${month}/${year}`;
    summarySheet.getCell('A1').font = { bold: true, size: 14 };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.addRow([]);
    summarySheet.addRow(['Total Invoices', data.summary.totalInvoices]);
    summarySheet.addRow(['Total Taxable Value', formatCurrency(data.summary.totalTaxableValue)]);
    summarySheet.addRow(['Total CGST', formatCurrency(data.summary.totalCGST)]);
    summarySheet.addRow(['Total SGST', formatCurrency(data.summary.totalSGST)]);
    summarySheet.addRow(['Total IGST', formatCurrency(data.summary.totalIGST)]);
    summarySheet.addRow(['Total Tax', formatCurrency(data.summary.totalTax)]);

    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 20;

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${month}_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Simplified Excel export for GSTR-3B
 */
export async function exportGSTR3BToExcel(
    data: any,
    month: number,
    year: number,
    businessName: string
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = businessName;

    const sheet = workbook.addWorksheet('GSTR-3B');

    // Title
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = `GSTR-3B for ${month}/${year}`;
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.addRow([]);

    // Outward Supplies
    sheet.addRow(['3.1 - Outward Taxable Supplies']);
    sheet.getRow(sheet.lastRow.number).font = { bold: true };

    sheet.addRow(['Description', 'Taxable Value', 'IGST', 'CGST', 'SGST']);
    sheet.getRow(sheet.lastRow.number).font = { bold: true };
    sheet.getRow(sheet.lastRow.number).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
    };

    sheet.addRow([
        'Outward taxable supplies',
        data.outwardSupplies.taxableValue,
        data.outwardSupplies.igst,
        data.outwardSupplies.cgst,
        data.outwardSupplies.sgst,
    ]);

    sheet.addRow([]);

    // Net Tax Liability
    sheet.addRow(['5.1 - Net Tax Liability']);
    sheet.getRow(sheet.lastRow.number).font = { bold: true };

    sheet.addRow(['Tax Type', 'Amount']);
    sheet.getRow(sheet.lastRow.number).font = { bold: true };
    sheet.getRow(sheet.lastRow.number).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
    };

    sheet.addRow(['IGST', data.netTaxLiability.igst]);
    sheet.addRow(['CGST', data.netTaxLiability.cgst]);
    sheet.addRow(['SGST', data.netTaxLiability.sgst]);
    sheet.addRow(['Total Tax Payable', data.netTaxLiability.total]);

    // Set column widths
    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR3B_${month}_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
