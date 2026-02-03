import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PurchaseOrder {
  id: string;
  user_id: string;
  supplier_id: string | null;
  po_number: string;
  po_date: string;
  expected_date: string | null;
  status: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  balance_due: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  supplier?: {
    id: string;
    name: string;
  };
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number | null;
  discount_percent: number | null;
  amount: number;
  received_quantity: number | null;
  created_at: string | null;
  item?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export type PurchaseOrderInsert = Partial<Omit<PurchaseOrder, "id" | "user_id" | "created_at" | "updated_at" | "supplier">> & {
  po_number: string;
  po_date: string;
};
export type PurchaseOrderUpdate = Partial<PurchaseOrderInsert> & { id: string };

export type PurchaseOrderItemInsert = Omit<PurchaseOrderItem, "id" | "purchase_order_id" | "created_at" | "item"> & {
  received_quantity?: number | null;
};

export function usePurchaseOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchase-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
    enabled: !!user,
  });
}

export function usePurchaseOrder(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!id && !!user,
  });
}

export function usePurchaseOrderItems(purchaseOrderId: string | undefined) {
  return useQuery({
    queryKey: ["purchase-order-items", purchaseOrderId],
    queryFn: async () => {
      if (!purchaseOrderId) return [];
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select(`
          *,
          item:items(id, name, sku)
        `)
        .eq("purchase_order_id", purchaseOrderId);

      if (error) throw error;
      return data as PurchaseOrderItem[];
    },
    enabled: !!purchaseOrderId,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      purchaseOrder, 
      items 
    }: { 
      purchaseOrder: PurchaseOrderInsert; 
      items: PurchaseOrderItemInsert[] 
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Create purchase order
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert({ ...purchaseOrder, user_id: user.id })
        .select()
        .single();

      if (poError) throw poError;

      // Create purchase order items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from("purchase_order_items")
          .insert(items.map(item => ({ ...item, purchase_order_id: poData.id })));

        if (itemsError) throw itemsError;
      }

      return poData as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create purchase order: " + error.message);
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      purchaseOrder, 
      items 
    }: { 
      id: string;
      purchaseOrder: Partial<PurchaseOrderInsert>; 
      items?: PurchaseOrderItemInsert[] 
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Update purchase order
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .update(purchaseOrder)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (poError) throw poError;

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase
          .from("purchase_order_items")
          .delete()
          .eq("purchase_order_id", id);

        // Insert new items
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from("purchase_order_items")
            .insert(items.map(item => ({ ...item, purchase_order_id: id })));

          if (itemsError) throw itemsError;
        }
      }

      return poData as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items"] });
      toast.success("Purchase order updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update purchase order: " + error.message);
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("purchase_orders")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete purchase order: " + error.message);
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      purchaseOrderId, 
      receivedItems 
    }: { 
      purchaseOrderId: string; 
      receivedItems: { itemId: string; quantity: number }[] 
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Update stock for each item
      for (const received of receivedItems) {
        // Get current stock
        const { data: item, error: itemError } = await supabase
          .from("items")
          .select("current_stock")
          .eq("id", received.itemId)
          .single();

        if (itemError) throw itemError;

        // Update stock
        const newStock = (item.current_stock || 0) + received.quantity;
        const { error: updateError } = await supabase
          .from("items")
          .update({ current_stock: newStock })
          .eq("id", received.itemId);

        if (updateError) throw updateError;

        // Create stock movement
        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert({
            item_id: received.itemId,
            user_id: user.id,
            movement_type: "purchase",
            quantity: received.quantity,
            reference_type: "purchase_order",
            reference_id: purchaseOrderId,
          });

        if (movementError) throw movementError;
      }

      // Update purchase order status
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({ status: "received" })
        .eq("id", purchaseOrderId);

      if (poError) throw poError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast.success("Stock received successfully");
    },
    onError: (error) => {
      toast.error("Failed to receive stock: " + error.message);
    },
  });
}
