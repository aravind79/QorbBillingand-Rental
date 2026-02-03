import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentFinancialYear } from "@/lib/helpers";

// Hook for existing ReportsPage.tsx compatibility
export function useGSTReports(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["gst-reports", startDate, endDate],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(name, gstin)
        `)
        .gte("invoice_date", startDate.toISOString().split('T')[0])
        .lte("invoice_date", endDate.toISOString().split('T')[0])
        .neq("status", "cancelled");

      if (error) throw error;

      // Process for GSTR-1 format
      const b2b = invoices
        ?.filter((inv: any) => inv.customer?.gstin)
        .map((inv: any) => ({
          gstin: inv.customer?.gstin || "",
          customer_name: inv.customer?.name || "",
          taxable_value: inv.total_amount - inv.tax_amount,
          cgst: inv.cgst_amount || 0,
          sgst: inv.sgst_amount || 0,
          igst: inv.igst_amount || 0,
          total_tax: inv.tax_amount || 0,
        })) || [];

      const b2cInvoices = invoices?.filter((inv: any) => !inv.customer?.gstin) || [];
      const b2c = {
        invoice_count: b2cInvoices.length,
        taxable_value: b2cInvoices.reduce((sum: number, inv: any) => sum + (inv.total_amount - inv.tax_amount), 0),
        cgst: b2cInvoices.reduce((sum: number, inv: any) => sum + (inv.cgst_amount || 0), 0),
        sgst: b2cInvoices.reduce((sum: number, inv: any) => sum + (inv.sgst_amount || 0), 0),
        igst: b2cInvoices.reduce((sum: number, inv: any) => sum + (inv.igst_amount || 0), 0),
        total_tax: b2cInvoices.reduce((sum: number, inv: any) => sum + (inv.tax_amount || 0), 0),
      };

      const summary = {
        total_invoices: invoices?.length || 0,
        total_taxable: invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount - inv.tax_amount), 0) || 0,
        total_cgst: invoices?.reduce((sum: number, inv: any) => sum + (inv.cgst_amount || 0), 0) || 0,
        total_sgst: invoices?.reduce((sum: number, inv: any) => sum + (inv.sgst_amount || 0), 0) || 0,
        total_igst: invoices?.reduce((sum: number, inv: any) => sum + (inv.igst_amount || 0), 0) || 0,
        total_tax: invoices?.reduce((sum: number, inv: any) => sum + (inv.tax_amount || 0), 0) || 0,
      };

      const salesRegister = invoices?.map((inv: any) => ({
        id: inv.id,
        invoice_date: inv.invoice_date,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer?.name || "",
        gstin: inv.customer?.gstin || "",
        taxable_value: inv.total_amount - inv.tax_amount,
        cgst: inv.cgst_amount || 0,
        sgst: inv.sgst_amount || 0,
        igst: inv.igst_amount || 0,
        total_amount: inv.total_amount,
      })) || [];

      // Tax summary by rate (simplified - would need item-level data for accuracy)
      const taxSummary: any[] = [];

      return {
        gstr1: { b2b, b2c, summary },
        salesRegister,
        taxSummary,
      };
    },
  });
}

// Hook for monthly GST summary
export function useMonthlyGSTSummary() {
  return useQuery({
    queryKey: ["monthly-gst-summary"],
    queryFn: async () => {
      const monthsData = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const { data: invoices } = await supabase
          .from("invoices")
          .select("total_amount, tax_amount")
          .gte("invoice_date", month.toISOString().split('T')[0])
          .lt("invoice_date", nextMonth.toISOString().split('T')[0])
          .neq("status", "cancelled");

        monthsData.push({
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          taxable: invoices?.reduce((sum, inv) => sum + (inv.total_amount - inv.tax_amount), 0) || 0,
          tax: invoices?.reduce((sum, inv) => sum + inv.tax_amount, 0) || 0,
        });
      }

      return monthsData;
    },
  });
}

export interface GSTR1Data {
  b2b: Array<{
    invoiceNumber: string;
    invoiceDate: string;
    customerName: string;
    customerGSTIN: string;
    placeOfSupply: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalValue: number;
  }>;
  b2c: Array<{
    state: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalValue: number;
  }>;
  summary: {
    totalInvoices: number;
    totalTaxableValue: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalTax: number;
  };
}

export interface GSTR3BData {
  outwardSupplies: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  itc: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  };
  netTaxLiability: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
}

export function useGSTR1Data(month: number, year: number) {
  return useQuery({
    queryKey: ["gstr1", month, year],
    queryFn: async () => {
      // Calculate date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Fetch invoices for the period
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(name, gstin, state),
          invoice_items(*)
        `)
        .gte("invoice_date", startDate.toISOString().split('T')[0])
        .lte("invoice_date", endDate.toISOString().split('T')[0])
        .neq("status", "cancelled")
        .order("invoice_date");

      if (error) throw error;

      // Process B2B invoices (with customer GSTIN)
      const b2b = invoices
        ?.filter((inv: any) => inv.customer?.gstin)
        .map((inv: any) => ({
          invoiceNumber: inv.invoice_number,
          invoiceDate: inv.invoice_date,
          customerName: inv.customer?.name || "",
          customerGSTIN: inv.customer?.gstin || "",
          placeOfSupply: inv.place_of_supply || "",
          taxableValue: inv.total_amount - inv.tax_amount,
          cgst: inv.cgst_amount || 0,
          sgst: inv.sgst_amount || 0,
          igst: inv.igst_amount || 0,
          totalValue: inv.total_amount,
        })) || [];

      // Process B2C invoices (without customer GSTIN) - group by state
      const b2cInvoices = invoices?.filter((inv: any) => !inv.customer?.gstin) || [];
      const b2cByState = b2cInvoices.reduce((acc: any, inv: any) => {
        const state = inv.customer?.state || "Unknown";
        if (!acc[state]) {
          acc[state] = {
            state,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalValue: 0,
          };
        }
        acc[state].taxableValue += inv.total_amount - inv.tax_amount;
        acc[state].cgst += inv.cgst_amount || 0;
        acc[state].sgst += inv.sgst_amount || 0;
        acc[state].igst += inv.igst_amount || 0;
        acc[state].totalValue += inv.total_amount;
        return acc;
      }, {});

      const b2c = Object.values(b2cByState);

      // Calculate summary
      const summary = {
        totalInvoices: invoices?.length || 0,
        totalTaxableValue: invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount - inv.tax_amount), 0) || 0,
        totalCGST: invoices?.reduce((sum: number, inv: any) => sum + (inv.cgst_amount || 0), 0) || 0,
        totalSGST: invoices?.reduce((sum: number, inv: any) => sum + (inv.sgst_amount || 0), 0) || 0,
        totalIGST: invoices?.reduce((sum: number, inv: any) => sum + (inv.igst_amount || 0), 0) || 0,
        totalTax: invoices?.reduce((sum: number, inv: any) => sum + (inv.tax_amount || 0), 0) || 0,
      };

      return { b2b, b2c, summary } as GSTR1Data;
    },
  });
}

export function useGSTR3BData(month: number, year: number) {
  return useQuery({
    queryKey: ["gstr3b", month, year],
    queryFn: async () => {
      // Calculate date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Fetch invoices for the period
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .gte("invoice_date", startDate.toISOString().split('T')[0])
        .lte("invoice_date", endDate.toISOString().split('T')[0])
        .neq("status", "cancelled");

      if (error) throw error;

      // Fetch purchases for ITC
      const { data: purchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .gte("purchase_date", startDate.toISOString().split('T')[0])
        .lte("purchase_date", endDate.toISOString().split('T')[0])
        .eq("itc_eligible", true);

      // Calculate outward supplies
      const outwardSupplies = {
        taxableValue: invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount - inv.tax_amount), 0) || 0,
        igst: invoices?.reduce((sum: number, inv: any) => sum + (inv.igst_amount || 0), 0) || 0,
        cgst: invoices?.reduce((sum: number, inv: any) => sum + (inv.cgst_amount || 0), 0) || 0,
        sgst: invoices?.reduce((sum: number, inv: any) => sum + (inv.sgst_amount || 0), 0) || 0,
        cess: 0,
      };

      // Calculate ITC from purchases
      const itc = {
        igst: purchases?.reduce((sum: number, p: any) => sum + (p.igst_amount || 0) - (p.itc_reversed || 0), 0) || 0,
        cgst: purchases?.reduce((sum: number, p: any) => sum + (p.cgst_amount || 0) - ((p.itc_reversed || 0) / 2), 0) || 0,
        sgst: purchases?.reduce((sum: number, p: any) => sum + (p.sgst_amount || 0) - ((p.itc_reversed || 0) / 2), 0) || 0,
        cess: 0,
      };

      // Net tax liability = Tax collected - ITC
      const netTaxLiability = {
        igst: outwardSupplies.igst - itc.igst,
        cgst: outwardSupplies.cgst - itc.cgst,
        sgst: outwardSupplies.sgst - itc.sgst,
        cess: outwardSupplies.cess - itc.cess,
        total: (outwardSupplies.igst + outwardSupplies.cgst + outwardSupplies.sgst + outwardSupplies.cess) -
          (itc.igst + itc.cgst + itc.sgst + itc.cess),
      };

      return { outwardSupplies, itc, netTaxLiability } as GSTR3BData;
    },
  });
}

export function useExportGSTR1JSON() {
  return useMutation({
    mutationFn: async ({ data, month, year, gstin }: { data: GSTR1Data; month: number; year: number; gstin: string }) => {
      // Format period as MMYYYY
      const period = `${month.toString().padStart(2, '0')}${year}`;

      // Create GSTR-1 JSON format
      const gstr1JSON = {
        gstin: gstin,
        fp: period,
        gt: data.summary.totalTax,
        cur_gt: data.summary.totalTax,

        // B2B invoices
        b2b: data.b2b.map(inv => ({
          ctin: inv.customerGSTIN,
          inv: [{
            inum: inv.invoiceNumber,
            idt: inv.invoiceDate,
            val: inv.totalValue,
            pos: inv.placeOfSupply.split('-')[0], // State code
            rchrg: "N",
            inv_typ: "R",
            itms: [{
              num: 1,
              itm_det: {
                txval: inv.taxableValue,
                rt: inv.igst > 0 ? (inv.igst / inv.taxableValue * 100) : (inv.cgst / inv.taxableValue * 100 * 2),
                iamt: inv.igst,
                camt: inv.cgst,
                samt: inv.sgst,
                csamt: 0
              }
            }]
          }]
        })),

        // B2C large invoices (> 2.5 lakh)
        b2cl: data.b2c
          .filter(b2c => b2c.totalValue > 250000)
          .map(b2c => ({
            pos: b2c.state,
            inv: [{
              inum: "Consolidated",
              idt: new Date().toISOString().split('T')[0],
              val: b2c.totalValue,
              itms: [{
                num: 1,
                itm_det: {
                  txval: b2c.taxableValue,
                  rt: b2c.igst > 0 ? (b2c.igst / b2c.taxableValue * 100) : (b2c.cgst / b2c.taxableValue * 100 * 2),
                  iamt: b2c.igst,
                  camt: b2c.cgst,
                  samt: b2c.sgst,
                  csamt: 0
                }
              }]
            }]
          })),

        // B2C small invoices (state-wise summary)
        b2cs: data.b2c
          .filter(b2c => b2c.totalValue <= 250000)
          .map(b2c => ({
            pos: b2c.state,
            typ: "OE",
            txval: b2c.taxableValue,
            rt: b2c.igst > 0 ? (b2c.igst / b2c.taxableValue * 100) : (b2c.cgst / b2c.taxableValue * 100 * 2),
            iamt: b2c.igst,
            camt: b2c.cgst,
            samt: b2c.sgst,
            csamt: 0
          }))
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(gstr1JSON, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR1_${period}_${gstin}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return gstr1JSON;
    },
    onSuccess: () => {
      toast.success("GSTR-1 JSON exported successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to export GSTR-1");
    },
  });
}

export function useExportGSTR3BJSON() {
  return useMutation({
    mutationFn: async ({ data, month, year, gstin }: { data: GSTR3BData; month: number; year: number; gstin: string }) => {
      const period = `${month.toString().padStart(2, '0')}${year}`;

      // Create GSTR-3B JSON format
      const gstr3bJSON = {
        gstin: gstin,
        ret_period: period,

        // Table 3.1 - Outward taxable supplies
        sup_details: {
          osup_det: {
            txval: data.outwardSupplies.taxableValue,
            iamt: data.outwardSupplies.igst,
            camt: data.outwardSupplies.cgst,
            samt: data.outwardSupplies.sgst,
            csamt: data.outwardSupplies.cess
          }
        },

        // Table 4 - ITC
        itc_elg: {
          itc_avl: [{
            ty: "IMPG",
            iamt: data.itc.igst,
            camt: data.itc.cgst,
            samt: data.itc.sgst,
            csamt: data.itc.cess
          }]
        },

        // Table 5.1 - Tax payable
        intr_details: {
          intr_det: {
            iamt: data.netTaxLiability.igst,
            camt: data.netTaxLiability.cgst,
            samt: data.netTaxLiability.sgst,
            csamt: data.netTaxLiability.cess
          }
        }
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(gstr3bJSON, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR3B_${period}_${gstin}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return gstr3bJSON;
    },
    onSuccess: () => {
      toast.success("GSTR-3B JSON exported successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to export GSTR-3B");
    },
  });
}
