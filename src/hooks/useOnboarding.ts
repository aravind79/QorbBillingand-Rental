import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: number;
  business_profile_completed: boolean;
  mode_selected: string | null;
  quick_setup_completed: boolean;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useOnboardingProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["onboarding-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as OnboardingProgress | null;
    },
    enabled: !!user,
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<OnboardingProgress>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("onboarding_progress")
        .upsert(
          {
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
    },
  });
}

export function useCheckOnboardingRequired() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["onboarding-required", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !data?.onboarding_completed;
    },
    enabled: !!user,
  });
}