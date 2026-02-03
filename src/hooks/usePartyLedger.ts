import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LedgerEntry {
  id: string;
  date: string;
  particulars: string;
  voucher_type: string;
  voucher_no: string;
  debit: number;
  credit: number;
  balance: number;
}

export function usePartyLedger(partyId: string | null, partyType: "customer" | "supplier", startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["party-ledger", user?.id, partyId, partyType, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!user || !partyId) return [];

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];
      const entries: LedgerEntry[] = [];

      if (partyType === "customer") {
        // Fetch invoices for customer
        const { data: invoices } = await supabase
          .from("invoices")
          .select("id, invoice_number, invoice_date, total_amount")
          .eq("user_id", user.id)
          .eq("customer_id", partyId)
          .gte("invoice_date", startStr)
          .lte("invoice_date", endStr)
          .order("invoice_date", { ascending: true });

        // Fetch payments for customer's invoices
        const { data: payments } = await supabase
          .from("payments")
          .select("id, reference_number, payment_date, amount, invoice_id, invoices!inner(customer_id)")
          .eq("user_id", user.id)
          .gte("payment_date", startStr)
          .lte("payment_date", endStr);

        const customerPayments = payments?.filter(
          (p) => (p.invoices as any)?.customer_id === partyId
        );

        invoices?.forEach((inv) => {
          entries.push({
            id: inv.id,
            date: inv.invoice_date,
            particulars: "Sales Invoice",
            voucher_type: "Invoice",
            voucher_no: inv.invoice_number,
            debit: inv.total_amount || 0,
            credit: 0,
            balance: 0,
          });
        });

        customerPayments?.forEach((pay) => {
          entries.push({
            id: pay.id,
            date: pay.payment_date,
            particulars: "Payment Received",
            voucher_type: "Receipt",
            voucher_no: pay.reference_number || pay.id.slice(0, 8),
            debit: 0,
            credit: pay.amount,
            balance: 0,
          });
        });
      } else {
        // Fetch purchase orders for supplier
        const { data: purchases } = await supabase
          .from("purchase_orders")
          .select("id, po_number, po_date, total_amount, paid_amount")
          .eq("user_id", user.id)
          .eq("supplier_id", partyId)
          .gte("po_date", startStr)
          .lte("po_date", endStr)
          .order("po_date", { ascending: true });

        purchases?.forEach((po) => {
          entries.push({
            id: po.id,
            date: po.po_date,
            particulars: "Purchase Order",
            voucher_type: "Purchase",
            voucher_no: po.po_number,
            debit: 0,
            credit: po.total_amount || 0,
            balance: 0,
          });
          if ((po.paid_amount || 0) > 0) {
            entries.push({
              id: `${po.id}-payment`,
              date: po.po_date,
              particulars: "Payment Made",
              voucher_type: "Payment",
              voucher_no: po.po_number,
              debit: po.paid_amount || 0,
              credit: 0,
              balance: 0,
            });
          }
        });
      }

      // Sort by date and calculate running balance
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let balance = 0;
      entries.forEach((entry) => {
        balance += entry.debit - entry.credit;
        entry.balance = balance;
      });

      return entries;
    },
    enabled: !!user && !!partyId,
  });
}

export function usePartyOutstanding(partyType: "customer" | "supplier") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["party-outstanding", user?.id, partyType],
    queryFn: async () => {
      if (!user) return [];

      if (partyType === "customer") {
        const { data } = await supabase
          .from("customers")
          .select("id, name, phone, outstanding_balance")
          .eq("user_id", user.id)
          .gt("outstanding_balance", 0)
          .order("outstanding_balance", { ascending: false });

        return data || [];
      } else {
        const { data } = await supabase
          .from("suppliers")
          .select("id, name, phone, outstanding_balance")
          .eq("user_id", user.id)
          .gt("outstanding_balance", 0)
          .order("outstanding_balance", { ascending: false });

        return data || [];
      }
    },
    enabled: !!user,
  });
}
