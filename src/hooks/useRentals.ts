import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface RentalInvoice {
  id: string;
  user_id: string;
  rental_number: string;
  customer_id: string | null;
  rental_start_date: string;
  rental_end_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  rental_status: string | null;
  security_deposit: number | null;
  deposit_collected: boolean | null;
  deposit_refunded: number | null;
  late_fee_per_day: number | null;
  late_fees: number | null;
  damage_charges: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  balance_due: number | null;
  notes: string | null;
  return_condition: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
  } | null;
  rental_items?: RentalItem[];
}

export interface RentalItem {
  id: string;
  rental_invoice_id: string;
  item_id: string | null;
  quantity: number | null;
  rate_type: string | null;
  rate_amount: number;
  rental_days: number;
  amount: number;
  return_condition: string | null;
  damage_notes: string | null;
  item?: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

export function useRentals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rentals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_invoices")
        .select(`
          *,
          customer:rental_customers(id, name, phone, email, city, state)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RentalInvoice[];
    },
    enabled: !!user,
  });
}

export function useRental(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rental", id],
    queryFn: async () => {
      if (!id) throw new Error("Rental ID required");

      const { data, error } = await supabase
        .from("rental_invoices")
        .select(`
          *,
          customer:rental_customers(id, name, phone, email, city, state),
          rental_items(*, item:items(id, name, sku))
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as RentalInvoice;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (rental: Omit<RentalInvoice, "id" | "created_at" | "updated_at" | "customer" | "rental_items">) => {
      const { data, error } = await supabase
        .from("rental_invoices")
        .insert({ ...rental, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Rental created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create rental");
    },
  });
}

export function useUpdateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<RentalInvoice> & { id: string }) => {
      const { error } = await supabase
        .from("rental_invoices")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Rental updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update rental");
    },
  });
}

export function useDeleteRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rental_invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Rental deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete rental");
    },
  });
}

export function useRentalStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rental-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_invoices")
        .select("rental_status, total_amount, security_deposit");

      if (error) throw error;

      const stats = {
        active: 0,
        overdue: 0,
        totalRevenue: 0,
        depositsHeld: 0,
        totalRentals: data?.length || 0,
      };

      data?.forEach((rental) => {
        if (rental.rental_status === "active") stats.active++;
        if (rental.rental_status === "overdue") stats.overdue++;
        stats.totalRevenue += rental.total_amount || 0;
        if (rental.rental_status === "active" || rental.rental_status === "booked") {
          stats.depositsHeld += rental.security_deposit || 0;
        }
      });

      return stats;
    },
    enabled: !!user,
  });
}
