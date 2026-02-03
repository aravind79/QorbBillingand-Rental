import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface RestaurantTable {
  id: string;
  user_id: string;
  table_number: string;
  capacity: number;
  status: string;
  current_order_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TableInsert {
  table_number: string;
  capacity?: number;
  status?: string;
  notes?: string | null;
}

export function useTables() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-tables", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("user_id", user.id)
        .order("table_number", { ascending: true });

      if (error) throw error;
      return data as RestaurantTable[];
    },
    enabled: !!user,
  });
}

export function useTable(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["restaurant-table", id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as RestaurantTable;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TableInsert) => {
      if (!user) throw new Error("User not authenticated");

      const { data: result, error } = await supabase
        .from("tables")
        .insert({ ...data, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast({ title: "Table created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating table", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RestaurantTable> & { id: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data: result, error } = await supabase
        .from("tables")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast({ title: "Table updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating table", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast({ title: "Table deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting table", description: error.message, variant: "destructive" });
    },
  });
}
