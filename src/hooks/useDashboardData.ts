import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, subMonths, format } from "date-fns";

export function useDashboardData() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total_amount, balance_due, status")
        .eq("user_id", user.id);

      // Get customers count
      const { count: customerCount } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const pendingAmount = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;

      return {
        totalRevenue,
        totalInvoices: invoices?.length || 0,
        pendingAmount,
        totalCustomers: customerCount || 0,
      };
    },
    enabled: !!user,
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["recent-invoices", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          invoice_date,
          total_amount,
          status,
          customer_id,
          customers (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map((inv) => ({
        ...inv,
        customer: inv.customers,
      }));
    },
    enabled: !!user,
  });

  const { data: lowStockItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["low-stock-items", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("items")
        .select("id, name, sku, current_stock, reorder_level")
        .eq("user_id", user.id)
        .eq("item_type", "product")
        .not("reorder_level", "is", null);

      if (error) throw error;

      return data.filter((item) => (item.current_stock || 0) <= (item.reorder_level || 0));
    },
    enabled: !!user,
  });

  const { data: revenueChartData, isLoading: chartLoading } = useQuery({
    queryKey: ["revenue-chart", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          start: startOfMonth(date).toISOString(),
          end: startOfMonth(subMonths(date, -1)).toISOString(),
          month: format(date, "MMM"),
        });
      }

      const results = await Promise.all(
        months.map(async ({ start, end, month }) => {
          const { data } = await supabase
            .from("invoices")
            .select("total_amount")
            .eq("user_id", user.id)
            .gte("invoice_date", start.split("T")[0])
            .lt("invoice_date", end.split("T")[0]);

          const revenue = data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
          return { month, revenue, invoices: data?.length || 0 };
        })
      );

      return results;
    },
    enabled: !!user,
  });

  const { data: topCustomersData, isLoading: topCustomersLoading } = useQuery({
    queryKey: ["top-customers", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          total_amount,
          customers (id, name)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const customerRevenue: Record<string, { name: string; revenue: number }> = {};

      data.forEach((inv) => {
        if (inv.customers) {
          const customerId = inv.customers.id;
          if (!customerRevenue[customerId]) {
            customerRevenue[customerId] = { name: inv.customers.name, revenue: 0 };
          }
          customerRevenue[customerId].revenue += inv.total_amount || 0;
        }
      });

      return Object.values(customerRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
    enabled: !!user,
  });

  return {
    stats,
    recentInvoices: recentInvoices || [],
    lowStockItems: lowStockItems || [],
    revenueChartData: revenueChartData || [],
    topCustomersData: topCustomersData || [],
    isLoading: statsLoading || invoicesLoading || itemsLoading || chartLoading || topCustomersLoading,
  };
}
