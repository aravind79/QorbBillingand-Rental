import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Purchase {
    id: string;
    user_id: string;
    supplier_id?: string;
    purchase_number: string;
    purchase_date: string;
    due_date?: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    place_of_supply?: string;
    is_interstate: boolean;
    itc_eligible: boolean;
    itc_claimed: number;
    itc_reversed: number;
    reversal_reason?: string;
    notes?: string;
    status: 'draft' | 'received' | 'paid' | 'partial' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface PurchaseItem {
    id: string;
    purchase_id: string;
    item_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    hsn_code?: string;
    amount: number;
}

/**
 * Fetch all purchases for the current user
 */
export function usePurchases() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['purchases', user?.id],
        queryFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .eq('user_id', user.id)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return data as Purchase[];
        },
        enabled: !!user,
    });
}

/**
 * Fetch a single purchase by ID
 */
export function usePurchase(id: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['purchase', id],
        queryFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('purchases')
                .select('*, purchase_items(*)')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user && !!id,
    });
}

/**
 * Create a new purchase
 */
export function useCreatePurchase() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (purchase: Partial<Purchase> & { items: Partial<PurchaseItem>[] }) => {
            if (!user) throw new Error('User not authenticated');

            const { items, ...purchaseData } = purchase;

            // Create purchase
            const { data: newPurchase, error: purchaseError } = await supabase
                .from('purchases')
                .insert({
                    ...purchaseData,
                    user_id: user.id,
                })
                .select()
                .single();

            if (purchaseError) throw purchaseError;

            // Create purchase items
            if (items && items.length > 0) {
                const { error: itemsError } = await supabase
                    .from('purchase_items')
                    .insert(
                        items.map((item) => ({
                            ...item,
                            purchase_id: newPurchase.id,
                        }))
                    );

                if (itemsError) throw itemsError;
            }

            return newPurchase;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Purchase created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create purchase');
        },
    });
}

/**
 * Update an existing purchase
 */
export function useUpdatePurchase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...purchase }: Partial<Purchase> & { id: string }) => {
            const { error } = await supabase
                .from('purchases')
                .update(purchase)
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: (id) => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['purchase', id] });
            toast.success('Purchase updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update purchase');
        },
    });
}

/**
 * Delete a purchase
 */
export function useDeletePurchase() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('purchases')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Purchase deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete purchase');
        },
    });
}

/**
 * Get total ITC available for a period
 */
export function useITCAvailable(month: number, year: number) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['itc-available', user?.id, month, year],
        queryFn: async () => {
            if (!user) throw new Error('User not authenticated');

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const { data, error } = await supabase
                .from('purchases')
                .select('cgst_amount, sgst_amount, igst_amount, itc_eligible, itc_claimed, itc_reversed')
                .eq('user_id', user.id)
                .eq('itc_eligible', true)
                .gte('purchase_date', startDate.toISOString())
                .lte('purchase_date', endDate.toISOString());

            if (error) throw error;

            const totals = data.reduce(
                (acc, purchase) => ({
                    cgst: acc.cgst + (purchase.cgst_amount || 0) - (purchase.itc_reversed || 0) / 2,
                    sgst: acc.sgst + (purchase.sgst_amount || 0) - (purchase.itc_reversed || 0) / 2,
                    igst: acc.igst + (purchase.igst_amount || 0) - (purchase.itc_reversed || 0),
                }),
                { cgst: 0, sgst: 0, igst: 0 }
            );

            return totals;
        },
        enabled: !!user,
    });
}
