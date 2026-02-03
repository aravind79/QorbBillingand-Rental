import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StockSummary {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  current_stock: number;
  reorder_level: number | null;
  purchase_price: number | null;
  sale_price: number;
  stock_value: number;
  is_low_stock: boolean;
}

export function useStockReport() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stock-report", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: items } = await supabase
        .from("items")
        .select("id, name, sku, category, current_stock, reorder_level, purchase_price, sale_price")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("item_type", "product")
        .order("name");

      if (!items) return [];

      const summary: StockSummary[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        current_stock: item.current_stock || 0,
        reorder_level: item.reorder_level,
        purchase_price: item.purchase_price,
        sale_price: item.sale_price,
        stock_value: (item.current_stock || 0) * (item.purchase_price || item.sale_price),
        is_low_stock: item.reorder_level ? (item.current_stock || 0) <= item.reorder_level : false,
      }));

      return summary;
    },
    enabled: !!user,
  });
}

export function useLowStockReport() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["low-stock-report", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: items } = await supabase
        .from("items")
        .select("id, name, sku, category, current_stock, reorder_level, purchase_price, sale_price")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("item_type", "product")
        .not("reorder_level", "is", null)
        .order("current_stock", { ascending: true });

      if (!items) return [];

      return items.filter((item) => (item.current_stock || 0) <= (item.reorder_level || 0));
    },
    enabled: !!user,
  });
}

export function useItemSalesReport(startDate: Date, endDate: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["item-sales-report", user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!user) return [];

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const { data: invoiceItems } = await supabase
        .from("invoice_items")
        .select(`
          id, description, quantity, unit_price, amount, item_id,
          invoices!inner(invoice_date, user_id, status)
        `)
        .eq("invoices.user_id", user.id)
        .neq("invoices.status", "draft")
        .gte("invoices.invoice_date", startStr)
        .lte("invoices.invoice_date", endStr);

      if (!invoiceItems) return [];

      // Aggregate by item
      const itemMap = new Map<string, { name: string; quantity: number; amount: number }>();

      invoiceItems.forEach((item) => {
        const key = item.item_id || item.description;
        const existing = itemMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.amount += item.amount;
        } else {
          itemMap.set(key, {
            name: item.description,
            quantity: item.quantity,
            amount: item.amount,
          });
        }
      });

      return Array.from(itemMap.entries()).map(([id, data]) => ({
        id,
        ...data,
      })).sort((a, b) => b.amount - a.amount);
    },
    enabled: !!user,
  });
}
