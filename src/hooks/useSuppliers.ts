import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  credit_period_days: number | null;
  outstanding_balance: number | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type SupplierInsert = Partial<Omit<Supplier, "id" | "user_id" | "created_at" | "updated_at">> & {
  name: string;
};
export type SupplierUpdate = Partial<SupplierInsert> & { id: string };

export function useSuppliers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["suppliers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!user,
  });
}

export function useSupplier(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("suppliers")
        .insert({ ...supplier, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create supplier: " + error.message);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SupplierUpdate) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update supplier: " + error.message);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete supplier: " + error.message);
    },
  });
}
