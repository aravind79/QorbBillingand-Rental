import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface RecurringInvoice {
  id: string;
  user_id: string;
  customer_id: string | null;
  title: string;
  template_data: Json;
  frequency: string;
  next_run_date: string | null;
  last_run_date: string | null;
  is_active: boolean;
  auto_send_email: boolean;
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringInvoiceInsert {
  customer_id?: string | null;
  title: string;
  template_data?: Json;
  frequency?: string;
  next_run_date?: string | null;
  is_active?: boolean;
  auto_send_email?: boolean;
  amount?: number;
  notes?: string | null;
}

export function useRecurringInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recurring-invoices", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("recurring_invoices")
        .select("*, customers(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (RecurringInvoice & { customers: { name: string } | null })[];
    },
    enabled: !!user,
  });
}

export function useRecurringInvoice(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recurring-invoice", id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from("recurring_invoices")
        .select("*, customers(name)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as RecurringInvoice & { customers: { name: string } | null };
    },
    enabled: !!user && !!id,
  });
}

export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RecurringInvoiceInsert) => {
      if (!user) throw new Error("User not authenticated");

      const { data: result, error } = await supabase
        .from("recurring_invoices")
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] });
      toast({ title: "Recurring invoice created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating recurring invoice", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Omit<RecurringInvoice, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("User not authenticated");

      const { data: result, error } = await supabase
        .from("recurring_invoices")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] });
      toast({ title: "Recurring invoice updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating recurring invoice", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("recurring_invoices")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-invoices"] });
      toast({ title: "Recurring invoice deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting recurring invoice", description: error.message, variant: "destructive" });
    },
  });
}
