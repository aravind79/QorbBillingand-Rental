import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DayBookEntry {
  id: string;
  date: string;
  particulars: string;
  voucher_type: string;
  voucher_no: string;
  debit: number;
  credit: number;
}

export function useDayBookReport(startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["day-book", user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // Fetch invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, invoice_date, total_amount, customer_id, customers(name)")
        .eq("user_id", user.id)
        .gte("invoice_date", startStr)
        .lte("invoice_date", endStr)
        .order("invoice_date", { ascending: true });

      // Fetch payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, reference_number, payment_date, amount, payment_method, invoice_id, invoices(invoice_number)")
        .eq("user_id", user.id)
        .gte("payment_date", startStr)
        .lte("payment_date", endStr)
        .order("payment_date", { ascending: true });

      // Fetch purchase orders
      const { data: purchases } = await supabase
        .from("purchase_orders")
        .select("id, po_number, po_date, total_amount, supplier_id, suppliers(name)")
        .eq("user_id", user.id)
        .gte("po_date", startStr)
        .lte("po_date", endStr)
        .order("po_date", { ascending: true });

      const entries: DayBookEntry[] = [];

      // Add invoice entries (Sales)
      invoices?.forEach((inv) => {
        entries.push({
          id: inv.id,
          date: inv.invoice_date,
          particulars: (inv.customers as any)?.name || "Walk-in Customer",
          voucher_type: "Sales",
          voucher_no: inv.invoice_number,
          debit: inv.total_amount || 0,
          credit: 0,
        });
      });

      // Add payment entries (Receipt)
      payments?.forEach((pay) => {
        entries.push({
          id: pay.id,
          date: pay.payment_date,
          particulars: `Payment for ${(pay.invoices as any)?.invoice_number || "N/A"} (${pay.payment_method})`,
          voucher_type: "Receipt",
          voucher_no: pay.reference_number || pay.id.slice(0, 8),
          debit: 0,
          credit: pay.amount,
        });
      });

      // Add purchase entries
      purchases?.forEach((po) => {
        entries.push({
          id: po.id,
          date: po.po_date,
          particulars: (po.suppliers as any)?.name || "Unknown Supplier",
          voucher_type: "Purchase",
          voucher_no: po.po_number,
          debit: 0,
          credit: po.total_amount || 0,
        });
      });

      // Sort by date
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return entries;
    },
    enabled: !!user,
  });
}
