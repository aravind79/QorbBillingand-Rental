import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Quotation = Tables<"invoices"> & {
  customer?: Tables<"customers"> | null;
  invoice_items?: Tables<"invoice_items">[];
};

export function useQuotations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quotations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*)
        `)
        .eq("document_type", "quotation")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Quotation[];
    },
    enabled: !!user,
  });
}

export function useQuotation(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quotation", id],
    queryFn: async () => {
      if (!id) throw new Error("Quotation ID required");

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*),
          invoice_items(*)
        `)
        .eq("id", id)
        .eq("document_type", "quotation")
        .single();

      if (error) throw error;
      return data as Quotation;
    },
    enabled: !!user && !!id,
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete invoice items
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", id);

      if (itemsError) throw itemsError;

      // Then delete the quotation
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete quotation");
    },
  });
}

export function useConvertToInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Get quotation data
      const { data: quotation, error: quotationError } = await supabase
        .from("invoices")
        .select(`*, invoice_items(*)`)
        .eq("id", quotationId)
        .single();

      if (quotationError) throw quotationError;

      // Get invoice counter
      const { data: settings } = await supabase
        .from("business_settings")
        .select("invoice_prefix, invoice_counter")
        .eq("user_id", user?.id)
        .maybeSingle();

      const prefix = settings?.invoice_prefix || "INV";
      const counter = settings?.invoice_counter || 1;
      const year = new Date().getFullYear();
      const invoiceNumber = `${prefix}-${year}-${counter.toString().padStart(4, "0")}`;

      // Create new invoice from quotation
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user?.id,
          customer_id: quotation.customer_id,
          invoice_number: invoiceNumber,
          invoice_type: quotation.invoice_type,
          document_type: "invoice",
          invoice_date: new Date().toISOString().split("T")[0],
          due_date: quotation.due_date,
          status: "draft",
          subtotal: quotation.subtotal,
          discount_amount: quotation.discount_amount,
          tax_amount: quotation.tax_amount,
          total_amount: quotation.total_amount,
          shipping_charges: quotation.shipping_charges,
          invoice_discount: quotation.invoice_discount,
          invoice_discount_type: quotation.invoice_discount_type,
          notes: quotation.notes,
          terms: quotation.terms,
          paid_amount: 0,
          balance_due: quotation.total_amount,
          converted_from_quotation_id: quotationId,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Copy invoice items
      if (quotation.invoice_items && quotation.invoice_items.length > 0) {
        const newItems = quotation.invoice_items.map((item: any) => ({
          invoice_id: newInvoice.id,
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          tax_rate: item.tax_rate,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(newItems);

        if (itemsError) throw itemsError;
      }

      // Update invoice counter
      await supabase
        .from("business_settings")
        .update({ invoice_counter: counter + 1 })
        .eq("user_id", user?.id);

      // Update quotation status
      await supabase
        .from("invoices")
        .update({ status: "converted" })
        .eq("id", quotationId);

      return newInvoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Quotation converted to invoice successfully");
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to convert quotation");
    },
  });
}
