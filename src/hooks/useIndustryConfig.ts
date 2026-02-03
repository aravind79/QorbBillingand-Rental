import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type IndustryType =
  | "general"
  | "freelancer"
  | "it_services"
  | "retail"
  | "wholesale"
  | "healthcare"
  | "manufacturing"
  | "consulting"
  | "restaurant"
  | "construction"
  | "event_management"
  | "ecommerce"
  | "hotels";

export interface IndustryConfig {
  industry: IndustryType;
  label: string;
  description: string;
  // Feature flags
  showInventory: boolean;
  showStockTracking: boolean;
  showHSNCodes: boolean;
  showSACCodes: boolean;
  showBarcode: boolean;
  showCreditManagement: boolean;
  showBulkPricing: boolean;
  defaultItemType: "product" | "service";
  showReorderLevel: boolean;
  showPurchasePrice: boolean;
  // New feature flags
  showQuotations: boolean;
  showShippingCharges: boolean;
  showPOSMode: boolean;
  showRecurringInvoices: boolean;
  showTableBilling: boolean;
  showProjectBilling: boolean;
  showDeliveryChallan: boolean;
  showSuppliers: boolean;
  showPurchaseOrders: boolean;
}

export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  general: {
    industry: "general",
    label: "General Business",
    description: "All features enabled for flexibility",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: true,
    showBarcode: true,
    showCreditManagement: true,
    showBulkPricing: true,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: true,
    showShippingCharges: true,
    showPOSMode: false,
    showRecurringInvoices: true,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: true,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  freelancer: {
    industry: "freelancer",
    label: "Freelancer & Professional Services",
    description: "Optimized for freelancers with GST toggle and ITR features",
    showInventory: false,
    showStockTracking: false,
    showHSNCodes: false,
    showSACCodes: true,
    showBarcode: false,
    showCreditManagement: false,
    showBulkPricing: false,
    defaultItemType: "service",
    showReorderLevel: false,
    showPurchasePrice: false,
    showQuotations: true,
    showShippingCharges: false,
    showPOSMode: false,
    showRecurringInvoices: true,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: false,
    showSuppliers: false,
    showPurchaseOrders: false,
  },
  it_services: {
    industry: "it_services",
    label: "IT Services",
    description: "Optimized for software and IT consulting",
    showInventory: false,
    showStockTracking: false,
    showHSNCodes: false,
    showSACCodes: true,
    showBarcode: false,
    showCreditManagement: true,
    showBulkPricing: false,
    defaultItemType: "service",
    showReorderLevel: false,
    showPurchasePrice: false,
    showQuotations: true,
    showShippingCharges: false,
    showPOSMode: false,
    showRecurringInvoices: true,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: false,
    showSuppliers: false,
    showPurchaseOrders: false,
  },
  retail: {
    industry: "retail",
    label: "Retail",
    description: "For shops and retail stores",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: false,
    showBarcode: true,
    showCreditManagement: false,
    showBulkPricing: false,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: false,
    showShippingCharges: false,
    showPOSMode: true,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: false,
    showDeliveryChallan: false,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  wholesale: {
    industry: "wholesale",
    label: "Wholesale",
    description: "For distributors and bulk sellers",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: false,
    showBarcode: true,
    showCreditManagement: true,
    showBulkPricing: true,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: true,
    showShippingCharges: true,
    showPOSMode: false,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: false,
    showDeliveryChallan: true,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  healthcare: {
    industry: "healthcare",
    label: "Healthcare",
    description: "For clinics, pharmacies, and medical services",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: true,
    showBarcode: true,
    showCreditManagement: false,
    showBulkPricing: false,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: false,
    showShippingCharges: false,
    showPOSMode: true,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: false,
    showDeliveryChallan: false,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  manufacturing: {
    industry: "manufacturing",
    label: "Manufacturing",
    description: "For factories and production units",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: false,
    showBarcode: true,
    showCreditManagement: true,
    showBulkPricing: true,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: true,
    showShippingCharges: true,
    showPOSMode: false,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: true,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  consulting: {
    industry: "consulting",
    label: "Consulting",
    description: "For professional services and consultants",
    showInventory: false,
    showStockTracking: false,
    showHSNCodes: false,
    showSACCodes: true,
    showBarcode: false,
    showCreditManagement: true,
    showBulkPricing: false,
    defaultItemType: "service",
    showReorderLevel: false,
    showPurchasePrice: false,
    showQuotations: true,
    showShippingCharges: false,
    showPOSMode: false,
    showRecurringInvoices: true,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: false,
    showSuppliers: false,
    showPurchaseOrders: false,
  },
  restaurant: {
    industry: "restaurant",
    label: "Restaurant",
    description: "For restaurants and food services",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: false,
    showBarcode: false,
    showCreditManagement: false,
    showBulkPricing: false,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: false,
    showShippingCharges: false,
    showPOSMode: true,
    showRecurringInvoices: false,
    showTableBilling: true,
    showProjectBilling: false,
    showDeliveryChallan: false,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  construction: {
    industry: "construction",
    label: "Construction",
    description: "For contractors and construction services",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: true,
    showBarcode: false,
    showCreditManagement: true,
    showBulkPricing: false,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: true,
    showShippingCharges: true,
    showPOSMode: false,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: true,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  event_management: {
    industry: "event_management",
    label: "Event Management",
    description: "For event planners and organizers",
    showInventory: false,
    showStockTracking: false,
    showHSNCodes: false,
    showSACCodes: true,
    showBarcode: false,
    showCreditManagement: true,
    showBulkPricing: false,
    defaultItemType: "service",
    showReorderLevel: false,
    showPurchasePrice: false,
    showQuotations: true,
    showShippingCharges: false,
    showPOSMode: false,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: true,
    showDeliveryChallan: false,
    showSuppliers: false,
    showPurchaseOrders: false,
  },
  ecommerce: {
    industry: "ecommerce",
    label: "E-Commerce",
    description: "For online stores and marketplaces",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: false,
    showBarcode: true,
    showCreditManagement: false,
    showBulkPricing: true,
    defaultItemType: "product",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: false,
    showShippingCharges: true,
    showPOSMode: false,
    showRecurringInvoices: false,
    showTableBilling: false,
    showProjectBilling: false,
    showDeliveryChallan: true,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
  hotels: {
    industry: "hotels",
    label: "Hotels & Hospitality",
    description: "For hotels, resorts, and hospitality services",
    showInventory: true,
    showStockTracking: true,
    showHSNCodes: true,
    showSACCodes: true,
    showBarcode: false,
    showCreditManagement: true,
    showBulkPricing: false,
    defaultItemType: "service",
    showReorderLevel: true,
    showPurchasePrice: true,
    showQuotations: true,
    showShippingCharges: false,
    showPOSMode: true,
    showRecurringInvoices: false,
    showTableBilling: true,
    showProjectBilling: false,
    showDeliveryChallan: false,
    showSuppliers: true,
    showPurchaseOrders: true,
  },
};

export function useIndustry() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business-industry", user?.id],
    queryFn: async () => {
      if (!user) return "general" as IndustryType;

      const { data, error } = await supabase
        .from("business_settings")
        .select("industry")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.industry as IndustryType) || "general";
    },
    enabled: !!user,
  });
}

export function useUpdateIndustry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (industry: IndustryType) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("business_settings")
        .update({ industry })
        .eq("user_id", user.id);

      if (error) throw error;
      return industry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-industry"] });
    },
  });
}

export function useIndustryConfig() {
  const { data: industry, isLoading, error } = useIndustry();

  const config = INDUSTRY_CONFIGS[industry || "general"];

  return {
    industry: industry || "general",
    config,
    isLoading,
    error,
  };
}
