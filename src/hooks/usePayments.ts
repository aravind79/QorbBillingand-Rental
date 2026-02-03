import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Payment = Tables<"payments">;
export type PaymentInsert = TablesInsert<"payments">;

export function usePayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          invoices (
            id,
            invoice_number,
            total_amount,
            balance_due,
            customers (name)
          )
        `)
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data.map((p) => ({
        ...p,
        invoice: p.invoices,
      }));
    },
    enabled: !!user,
  });
}

export function useUnpaidInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unpaid-invoices", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          total_amount,
          balance_due,
          status,
          customers (name)
        `)
        .eq("user_id", user.id)
        .gt("balance_due", 0)
        .in("status", ["sent", "partial", "overdue"])
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreatePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<PaymentInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");

      // Create payment
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({ ...payment, user_id: user.id })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update invoice balance and status
      if (payment.invoice_id) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("total_amount, paid_amount, balance_due")
          .eq("id", payment.invoice_id)
          .single();

        if (invoice) {
          const newPaidAmount = (invoice.paid_amount || 0) + payment.amount;
          const newBalanceDue = (invoice.total_amount || 0) - newPaidAmount;
          const newStatus = newBalanceDue <= 0 ? "paid" : "partial";

          await supabase
            .from("invoices")
            .update({
              paid_amount: newPaidAmount,
              balance_due: Math.max(0, newBalanceDue),
              status: newStatus,
            })
            .eq("id", payment.invoice_id);
        }
      }

      return paymentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record payment: " + error.message);
    },
  });
}

export function useDeletePayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, invoice_id, amount }: { id: string; invoice_id: string | null; amount: number }) => {
      if (!user) throw new Error("Not authenticated");

      // Delete payment
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Revert invoice balance
      if (invoice_id) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("total_amount, paid_amount")
          .eq("id", invoice_id)
          .single();

        if (invoice) {
          const newPaidAmount = Math.max(0, (invoice.paid_amount || 0) - amount);
          const newBalanceDue = (invoice.total_amount || 0) - newPaidAmount;
          const newStatus = newPaidAmount === 0 ? "sent" : "partial";

          await supabase
            .from("invoices")
            .update({
              paid_amount: newPaidAmount,
              balance_due: newBalanceDue,
              status: newStatus,
            })
            .eq("id", invoice_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Payment deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete payment: " + error.message);
    },
  });
}
