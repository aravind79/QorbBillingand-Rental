import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfitLossData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalTax: number;
  netProfit: number;
  invoiceCount: number;
  purchaseCount: number;
}

export function useProfitLossReport(startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profit-loss-report", user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<ProfitLossData> => {
      if (!user) {
        return {
          totalRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
          totalTax: 0,
          netProfit: 0,
          invoiceCount: 0,
          purchaseCount: 0,
        };
      }

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // Fetch invoices (revenue)
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, subtotal, tax_amount, total_amount")
        .eq("user_id", user.id)
        .neq("status", "draft")
        .eq("document_type", "invoice")
        .gte("invoice_date", startStr)
        .lte("invoice_date", endStr);

      // Fetch purchase orders (cost)
      const { data: purchases } = await supabase
        .from("purchase_orders")
        .select("id, subtotal, tax_amount, total_amount")
        .eq("user_id", user.id)
        .neq("status", "draft")
        .gte("po_date", startStr)
        .lte("po_date", endStr);

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0;
      const totalTax = invoices?.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0) || 0;
      const totalCost = purchases?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;
      const grossProfit = totalRevenue - totalCost;
      const netProfit = grossProfit; // In a real app, you'd subtract expenses here

      return {
        totalRevenue,
        totalCost,
        grossProfit,
        totalTax,
        netProfit,
        invoiceCount: invoices?.length || 0,
        purchaseCount: purchases?.length || 0,
      };
    },
    enabled: !!user,
  });
}

export function useBillWiseProfit(startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bill-wise-profit", user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // Fetch invoices with items
      const { data: invoices } = await supabase
        .from("invoices")
        .select(`
          id, invoice_number, invoice_date, subtotal, total_amount, 
          customer_id, customers(name),
          invoice_items(item_id, quantity, unit_price, amount, items(purchase_price))
        `)
        .eq("user_id", user.id)
        .neq("status", "draft")
        .eq("document_type", "invoice")
        .gte("invoice_date", startStr)
        .lte("invoice_date", endStr)
        .order("invoice_date", { ascending: false });

      if (!invoices) return [];

      return invoices.map((inv) => {
        const items = inv.invoice_items || [];
        const costOfGoods = items.reduce((sum: number, item: any) => {
          const purchasePrice = item.items?.purchase_price || item.unit_price * 0.7; // Fallback to 70% of sale price
          return sum + purchasePrice * item.quantity;
        }, 0);
        const profit = (inv.subtotal || 0) - costOfGoods;
        const profitMargin = inv.subtotal ? (profit / inv.subtotal) * 100 : 0;

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          customer_name: (inv.customers as any)?.name || "Walk-in",
          revenue: inv.subtotal || 0,
          cost: costOfGoods,
          profit,
          profit_margin: profitMargin,
        };
      });
    },
    enabled: !!user,
  });
}
