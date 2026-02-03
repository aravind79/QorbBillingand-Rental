import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RentalCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  customer_group: string | null;
  outstanding_balance: number;
  credit_limit: number | null;
  created_at: string;
}

// Rental module uses separate rental_customers table
export function useRentalCustomers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rental-customers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_customers")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");

      if (error) throw error;
      return data as RentalCustomer[];
    },
    enabled: !!user,
  });
}

export function useRentalCustomer(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rental-customer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("rental_customers")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data as RentalCustomer;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateRentalCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (customer: Omit<RentalCustomer, "id" | "created_at" | "outstanding_balance">) => {
      const { data, error } = await supabase
        .from("rental_customers")
        .insert({
          ...customer,
          user_id: user!.id,
          outstanding_balance: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-customers"] });
    },
  });
}

export function useUpdateRentalCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RentalCustomer> & { id: string }) => {
      const { data, error } = await supabase
        .from("rental_customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-customers"] });
    },
  });
}

export function useDeleteRentalCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rental_customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-customers"] });
    },
  });
}
