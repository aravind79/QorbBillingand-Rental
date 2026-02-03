import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReminderParams {
  rentalId?: string;
  type: "overdue" | "due_today" | "manual";
}

export function useSendRentalReminder() {
  return useMutation({
    mutationFn: async (params: ReminderParams) => {
      const { data, error } = await supabase.functions.invoke("send-rental-reminder", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.results?.length > 0) {
        const successful = data.results.filter((r: any) => r.success).length;
        toast.success(`Sent ${successful} reminder(s) successfully`);
      } else {
        toast.info("No reminders to send");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send reminder");
    },
  });
}
