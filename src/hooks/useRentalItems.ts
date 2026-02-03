import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RentalItem {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  category: string | null;
  rental_rate_daily: number | null;
  rental_rate_weekly: number | null;
  rental_rate_monthly: number | null;
  security_deposit_amount: number | null;
  quantity_available_for_rent: number;
  rental_terms: string | null;
  is_active: boolean;
  created_at: string;
}

export function useRentalItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rental-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user!.id)
        .or("availability_type.eq.rental_only,availability_type.eq.both")
        .order("name");

      if (error) throw error;
      return data as RentalItem[];
    },
    enabled: !!user,
  });
}

export function useRentalItem(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rental-item", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data as RentalItem;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateRentalItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<RentalItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("items")
        .insert({
          ...item,
          user_id: user!.id,
          item_type: "product",
          availability_type: "rental_only",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-items"] });
    },
  });
}

export function useUpdateRentalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RentalItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-items"] });
    },
  });
}

export function useDeleteRentalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-items"] });
    },
  });
}
