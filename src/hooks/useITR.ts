import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { getCurrentFinancialYear } from '@/lib/helpers';

export interface IncomeEntry {
    id: string;
    user_id: string;
    entry_date: string;
    financial_year: string;
    description: string;
    amount: number;
    category: 'professional_fees' | 'interest' | 'rental_income' | 'capital_gains' | 'other';
    tds_deducted: number;
    client_name?: string;
    invoice_id?: string;
    pan_number?: string;
    notes?: string;
}

export interface ExpenseEntry {
    id: string;
    user_id: string;
    entry_date: string;
    financial_year: string;
    description: string;
    amount: number;
    category: 'rent' | 'electricity' | 'internet' | 'software' | 'travel' | 'professional_fees' | 'office_expenses' | 'depreciation' | 'insurance' | 'repairs' | 'other';
    is_deductible: boolean;
    receipt_url?: string;
    vendor_name?: string;
    gst_amount: number;
    notes?: string;
}

export interface ITRComputation {
    id: string;
    user_id: string;
    financial_year: string;
    gross_receipts: number;
    professional_income: number;
    other_income: number;
    total_income: number;
    total_expenses: number;
    presumptive_income: number;
    section_80c: number;
    section_80d: number;
    section_80g: number;
    other_deductions: number;
    total_deductions: number;
    taxable_income: number;
    tax_regime: 'old' | 'new';
    tax_computed: number;
    cess: number;
    total_tax_liability: number;
    tds_paid: number;
    advance_tax_paid: number;
    self_assessment_tax: number;
    tax_payable: number;
    refund_due: number;
}

/**
 * Fetch income entries for current financial year
 */
export function useIncomeEntries(financialYear?: string) {
    const { user } = useAuth();
    const fy = financialYear || getCurrentFinancialYear();

    return useQuery({
        queryKey: ['income-entries', user?.id, fy],
        queryFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('income_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('financial_year', fy)
                .order('entry_date', { ascending: false });

            if (error) throw error;
            return data as IncomeEntry[];
        },
        enabled: !!user,
    });
}

/**
 * Fetch expense entries for current financial year
 */
export function useExpenseEntries(financialYear?: string) {
    const { user } = useAuth();
    const fy = financialYear || getCurrentFinancialYear();

    return useQuery({
        queryKey: ['expense-entries', user?.id, fy],
        queryFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('expense_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('financial_year', fy)
                .order('entry_date', { ascending: false });

            if (error) throw error;
            return data as ExpenseEntry[];
        },
        enabled: !!user,
    });
}

/**
 * Fetch ITR computation for a financial year
 */
export function useITRComputation(financialYear?: string) {
    const { user } = useAuth();
    const fy = financialYear || getCurrentFinancialYear();

    return useQuery({
        queryKey: ['itr-computation', user?.id, fy],
        queryFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('itr_computations')
                .select('*')
                .eq('user_id', user.id)
                .eq('financial_year', fy)
                .maybeSingle();

            if (error) throw error;
            return data as ITRComputation | null;
        },
        enabled: !!user,
    });
}

/**
 * Create income entry
 */
export function useCreateIncome() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (income: Partial<IncomeEntry>) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('income_entries')
                .insert({
                    ...income,
                    user_id: user.id,
                    financial_year: income.financial_year || getCurrentFinancialYear(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['income-entries'] });
            toast.success('Income entry added');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add income');
        },
    });
}

/**
 * Create expense entry
 */
export function useCreateExpense() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (expense: Partial<ExpenseEntry>) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('expense_entries')
                .insert({
                    ...expense,
                    user_id: user.id,
                    financial_year: expense.financial_year || getCurrentFinancialYear(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
            toast.success('Expense entry added');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add expense');
        },
    });
}

/**
 * Compute or update ITR
 */
export function useComputeITR() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (computation: Partial<ITRComputation>) => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('itr_computations')
                .upsert({
                    ...computation,
                    user_id: user.id,
                    financial_year: computation.financial_year || getCurrentFinancialYear(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['itr-computation'] });
            toast.success('Tax computation updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to compute tax');
        },
    });
}

/**
 * Get ITR summary for dashboard
 */
export function useITRSummary(financialYear?: string) {
    const { data: incomeEntries } = useIncomeEntries(financialYear);
    const { data: expenseEntries } = useExpenseEntries(financialYear);
    const { data: computation } = useITRComputation(financialYear);

    const totalIncome = incomeEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const totalExpenses = expenseEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const totalTDS = incomeEntries?.reduce((sum, entry) => sum + entry.tds_deducted, 0) || 0;

    return {
        totalIncome,
        totalExpenses,
        totalTDS,
        netIncome: totalIncome - totalExpenses,
        taxLiability: computation?.total_tax_liability || 0,
        taxPayable: computation?.tax_payable || 0,
        refundDue: computation?.refund_due || 0,
    };
}
