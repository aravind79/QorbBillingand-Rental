import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Invoice = Tables<"invoices"> & {
  customer?: Tables<"customers"> | null;
  invoice_items?: Tables<"invoice_items">[];
};

export type InvoiceInsert = TablesInsert<"invoices">;
export type InvoiceUpdate = TablesUpdate<"invoices">;

export function useInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) throw new Error("Invoice ID required");

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*),
          invoice_items(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!user && !!id,
  });
}

interface InvoiceItemInsert {
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount_percent?: number;
  amount: number;
}

interface CreateInvoiceData extends Omit<InvoiceInsert, "user_id"> {
  items?: InvoiceItemInsert[];
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      if (!user) throw new Error("User not authenticated");

      const { items, ...invoiceData } = data;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({ ...invoiceData, user_id: user.id })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items if provided
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(items.map((item) => ({ ...item, invoice_id: invoice.id })));

        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete invoice items
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", id);

      if (itemsError) throw itemsError;

      // Then delete the invoice
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: async (params: {
      invoiceId: string;
      recipientEmail: string;
      recipientName: string;
      invoiceNumber: string;
      totalAmount: number;
      dueDate: string | null;
      businessName: string;
      businessEmail: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Invoice sent via email successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send email");
    },
  });
}
