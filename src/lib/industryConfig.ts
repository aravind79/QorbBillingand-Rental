/**
 * Industry-specific feature configuration
 * Controls which features are visible based on business industry type
 */

export interface IndustryFeatures {
    // Core Features
    showInventory: boolean;
    showPOS: boolean;
    showTableBilling: boolean;
    showRentalModule: boolean;

    // Purchase & Procurement
    showPurchaseOrders: boolean;
    showSuppliers: boolean;
    showPurchases: boolean; // For ITC tracking

    // Sales Features
    showQuotations: boolean;
    showRecurringInvoices: boolean;
    showDeliveryChallan: boolean;

    // Financial Features
    showGSTToggle: boolean; // Can turn GST on/off
    showITRModule: boolean; // Income Tax Return features
    showAdvanceTax: boolean;

    // UI Preferences
    simplifiedUI: boolean;
    defaultModule: string;
}

export const industryConfigurations: Record<string, IndustryFeatures> = {
    general: {
        showInventory: true,
        showPOS: true,
        showTableBilling: false,
        showRentalModule: true,
        showPurchaseOrders: true,
        showSuppliers: true,
        showPurchases: true,
        showQuotations: true,
        showRecurringInvoices: true,
        showDeliveryChallan: true,
        showGSTToggle: false,
        showITRModule: false,
        showAdvanceTax: false,
        simplifiedUI: false,
        defaultModule: '/dashboard',
    },

    retail: {
        showInventory: true,
        showPOS: true,
        showTableBilling: false,
        showRentalModule: false,
        showPurchaseOrders: true,
        showSuppliers: true,
        showPurchases: true,
        showQuotations: false,
        showRecurringInvoices: false,
        showDeliveryChallan: true,
        showGSTToggle: false,
        showITRModule: false,
        showAdvanceTax: false,
        simplifiedUI: false,
        defaultModule: '/pos',
    },

    restaurant: {
        showInventory: true,
        showPOS: true,
        showTableBilling: true,
        showRentalModule: false,
        showPurchaseOrders: true,
        showSuppliers: true,
        showPurchases: true,
        showQuotations: false,
        showRecurringInvoices: false,
        showDeliveryChallan: false,
        showGSTToggle: false,
        showITRModule: false,
        showAdvanceTax: false,
        simplifiedUI: false,
        defaultModule: '/tables',
    },

    freelancer: {
        showInventory: false,
        showPOS: false,
        showTableBilling: false,
        showRentalModule: false,
        showPurchaseOrders: false,
        showSuppliers: false,
        showPurchases: true, // For expense tracking
        showQuotations: true,
        showRecurringInvoices: true,
        showDeliveryChallan: false,
        showGSTToggle: true, // ✅ Can turn GST on/off
        showITRModule: true, // ✅ ITR features enabled
        showAdvanceTax: true, // ✅ Quarterly tax tracking
        simplifiedUI: true,
        defaultModule: '/dashboard',
    },

    manufacturing: {
        showInventory: true,
        showPOS: false,
        showTableBilling: false,
        showRentalModule: false,
        showPurchaseOrders: true,
        showSuppliers: true,
        showPurchases: true,
        showQuotations: true,
        showRecurringInvoices: false,
        showDeliveryChallan: true,
        showGSTToggle: false,
        showITRModule: false,
        showAdvanceTax: false,
        simplifiedUI: false,
        defaultModule: '/dashboard',
    },

    services: {
        showInventory: false,
        showPOS: false,
        showTableBilling: false,
        showRentalModule: false,
        showPurchaseOrders: false,
        showSuppliers: true,
        showPurchases: true,
        showQuotations: true,
        showRecurringInvoices: true,
        showDeliveryChallan: false,
        showGSTToggle: true,
        showITRModule: true,
        showAdvanceTax: true,
        simplifiedUI: true,
        defaultModule: '/dashboard',
    },
};

/**
 * Get features for a specific industry
 */
export function getIndustryFeatures(industryType: string): IndustryFeatures {
    return industryConfigurations[industryType] || industryConfigurations.general;
}

/**
 * Check if a feature is enabled for current industry
 */
export function isFeatureEnabled(
    industryType: string,
    feature: keyof IndustryFeatures
): boolean {
    const features = getIndustryFeatures(industryType);
    return features[feature] as boolean;
}

/**
 * Get industry display name
 */
export function getIndustryDisplayName(industryType: string): string {
    const names: Record<string, string> = {
        general: 'General Business',
        retail: 'Retail & E-commerce',
        restaurant: 'Restaurant & Food Service',
        freelancer: 'Freelancer & Professional Services',
        manufacturing: 'Manufacturing',
        services: 'Service Business',
    };
    return names[industryType] || 'General Business';
}

/**
 * Get all available industries
 */
export function getAvailableIndustries(): Array<{ value: string; label: string }> {
    return [
        { value: 'general', label: 'General Business' },
        { value: 'retail', label: 'Retail & E-commerce' },
        { value: 'restaurant', label: 'Restaurant & Food Service' },
        { value: 'freelancer', label: 'Freelancer & Professional Services' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'services', label: 'Service Business' },
    ];
}
