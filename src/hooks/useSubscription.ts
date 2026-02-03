import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  razorpay_subscription_id: string | null;
  status: string;
  billing_cycle: string;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  auto_renew: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserPlan {
  plan: string;
  status: string;
  canAccessBilling: boolean;
  canAccessRental: boolean;
  selectedMode: string | null;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Use order + limit to get the most recent active subscription safely
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });
}

export interface UserPlanResult extends UserPlan {
  updateSelectedMode: (mode: string) => Promise<void>;
  isUpdating: boolean;
}

export function useUserPlan(): UserPlanResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: subscription } = useSubscription();
  const [selectedMode, setSelectedMode] = useState<string | null>(() => {
    // Try to get from localStorage first for immediate access
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedMode');
    }
    return null;
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch onboarding mode from DB
  useEffect(() => {
    const fetchMode = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("onboarding_progress")
        .select("mode_selected")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.mode_selected) {
        setSelectedMode(data.mode_selected);
        localStorage.setItem('selectedMode', data.mode_selected);
      }
    };
    fetchMode();
  }, [user]);

  // Function to update selected mode (persists to DB and localStorage)
  const updateSelectedMode = useCallback(async (mode: string) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      // Update localStorage immediately for instant UI feedback
      localStorage.setItem('selectedMode', mode);
      setSelectedMode(mode);

      // Persist to database
      const { error } = await supabase
        .from("onboarding_progress")
        .upsert(
          {
            user_id: user.id,
            mode_selected: mode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
    } catch (error) {
      console.error("Failed to update selected mode:", error);
      // Revert on error
      const oldMode = localStorage.getItem('selectedMode');
      if (oldMode !== mode) {
        setSelectedMode(oldMode);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [user, queryClient]);

  // Default values for when user is not loaded
  if (!user) {
    return {
      plan: "free",
      status: "none",
      canAccessBilling: false,
      canAccessRental: false,
      selectedMode: null,
      updateSelectedMode: async () => {},
      isUpdating: false,
    };
  }

  // Get plan from subscription or default based on mode
  const plan = subscription?.plan_name || "starter";
  const status = subscription?.status || "active";

  // Determine access based on plan AND selected mode
  // Premium plans always get both modules
  const isPremiumPlan = plan === "premium" || plan === "professional" || plan === "enterprise";
  
  let canAccessBilling = false;
  let canAccessRental = false;

  if (isPremiumPlan || selectedMode === "both") {
    // Premium users or "both" mode selected = access to everything
    canAccessBilling = true;
    canAccessRental = true;
  } else if (selectedMode === "billing" || plan === "billing" || plan === "starter") {
    canAccessBilling = true;
    canAccessRental = false;
  } else if (selectedMode === "rental" || plan === "rental") {
    canAccessBilling = false;
    canAccessRental = true;
  } else {
    // Default fallback - give access to billing
    canAccessBilling = true;
  }

  return {
    plan,
    status,
    canAccessBilling,
    canAccessRental,
    selectedMode,
    updateSelectedMode,
    isUpdating,
  };
}

export function useSuperAdminCheck() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      if (error) return false;
      return data as boolean;
    },
    enabled: !!user,
  });
}
