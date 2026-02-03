import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type StockMovement = Tables<"stock_movements">;
export type StockMovementInsert = TablesInsert<"stock_movements">;

export function useStockMovements(itemId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["stock-movements", user?.id, itemId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          items (name, sku, unit)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data.map((m) => ({
        ...m,
        item: m.items,
      }));
    },
    enabled: !!user,
  });
}

export function useCreateStockMovement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: Omit<StockMovementInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");

      // Create stock movement
      const { data: movementData, error: movementError } = await supabase
        .from("stock_movements")
        .insert({ ...movement, user_id: user.id })
        .select()
        .single();

      if (movementError) throw movementError;

      // Update item stock
      const { data: item } = await supabase
        .from("items")
        .select("current_stock")
        .eq("id", movement.item_id)
        .single();

      if (item) {
        let newStock = item.current_stock || 0;

        if (movement.movement_type === "purchase" || movement.movement_type === "adjustment") {
          newStock += Number(movement.quantity);
        } else if (movement.movement_type === "sale" || movement.movement_type === "return") {
          newStock -= Number(movement.quantity);
        }

        await supabase
          .from("items")
          .update({ current_stock: Math.max(0, newStock) })
          .eq("id", movement.item_id);
      }

      return movementData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      toast.success("Stock adjusted successfully");
    },
    onError: (error) => {
      toast.error("Failed to adjust stock: " + error.message);
    },
  });
}
