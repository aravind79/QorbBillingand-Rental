import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  opening_balance: number;
  current_balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountTransaction {
  id: string;
  user_id: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  reference_type: string | null;
  reference_id: string | null;
  counterparty_account_id: string | null;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export function useBankAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bank-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("account_name");

      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (account: Omit<BankAccount, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({
          ...account,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Account created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create account");
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Account updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update account");
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Account deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}

export function useAccountTransactions(accountId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["account-transactions", user?.id, accountId],
    queryFn: async () => {
      let query = supabase
        .from("account_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("transaction_date", { ascending: false });

      if (accountId) {
        query = query.eq("account_id", accountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AccountTransaction[];
    },
    enabled: !!user,
  });
}

export function useCreateAccountTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Omit<AccountTransaction, "id" | "user_id" | "created_at">) => {
      // Insert transaction
      const { data, error } = await supabase
        .from("account_transactions")
        .insert({
          ...transaction,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update account balance
      const { data: account } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", transaction.account_id)
        .single();

      if (account) {
        const newBalance = transaction.transaction_type === "credit"
          ? account.current_balance + transaction.amount
          : account.current_balance - transaction.amount;

        await supabase
          .from("bank_accounts")
          .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", transaction.account_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Transaction recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record transaction");
    },
  });
}
