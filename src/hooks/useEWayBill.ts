import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEWayBillValidityDate, validateHSNCode } from "@/lib/helpers";

export interface EWayBillFormData {
    invoice_id: string;
    transport_mode: "road" | "rail" | "air" | "ship";
    vehicle_number?: string;
    transporter_name?: string;
    transporter_id?: string;
    distance_km: number;
}

export function useGenerateEWayBill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: EWayBillFormData) => {
            // 1. Fetch invoice with items
            const { data: invoice, error: invoiceError } = await supabase
                .from("invoices")
                .select(`
          *,
          invoice_items(*),
          customer:customers(*)
        `)
                .eq("id", data.invoice_id)
                .single();

            if (invoiceError) throw invoiceError;
            if (!invoice) throw new Error("Invoice not found");

            // 2. Validate e-way bill requirements
            if (invoice.total_amount < 50000) {
                throw new Error("E-way bill is only required for invoices ≥ ₹50,000");
            }

            // 3. Check for HSN codes (e-way bill cannot be generated with only SAC codes)
            const hasHSN = invoice.invoice_items?.some((item: any) =>
                item.hsn_sac_code && validateHSNCode(item.hsn_sac_code)
            );

            if (!hasHSN) {
                throw new Error("E-way bill requires at least one item with HSN code (goods). Cannot generate for services only.");
            }

            // 4. Calculate validity date
            const validityDate = getEWayBillValidityDate(data.distance_km);

            // 5. Generate e-way bill number (in production, this would come from GST portal)
            const ewayBillNumber = `EWB${Date.now().toString().slice(-10)}`;

            // 6. Update invoice with e-way bill details
            const { error: updateError } = await supabase
                .from("invoices")
                .update({
                    eway_bill_number: ewayBillNumber,
                    vehicle_number: data.vehicle_number,
                    transporter_name: data.transporter_name,
                    transporter_id: data.transporter_id,
                    distance_km: data.distance_km,
                    eway_valid_till: validityDate.toISOString(),
                    transport_mode: data.transport_mode,
                    consignment_value: invoice.total_amount,
                    eway_bill_status: "generated",
                })
                .eq("id", data.invoice_id);

            if (updateError) throw updateError;

            return { invoice, ewayBillNumber, validityDate };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            toast.success("E-Way Bill generated successfully");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to generate E-Way Bill");
        },
    });
}

export function useEWayBills(invoiceId?: string) {
    return useQuery({
        queryKey: ["eway-bills", invoiceId],
        queryFn: async () => {
            let query = supabase
                .from("invoices")
                .select("*")
                .not("eway_bill_number", "is", null);

            if (invoiceId) {
                query = query.eq("id", invoiceId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        enabled: !!invoiceId,
    });
}

export function useCancelEWayBill() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invoiceId: string) => {
            const { error } = await supabase
                .from("invoices")
                .update({
                    eway_bill_status: "cancelled",
                })
                .eq("id", invoiceId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["eway-bills"] });
            toast.success("E-Way Bill cancelled");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to cancel E-Way Bill");
        },
    });
}
