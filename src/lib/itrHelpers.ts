import {
    getCurrentFinancialYear,
} from './helpers';

/**
 * Indian Income Tax Slabs for FY 2025-26
 */

// Old Tax Regime Slabs
export const OLD_TAX_SLABS = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

// New Tax Regime Slabs (FY 2025-26)
export const NEW_TAX_SLABS = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 5 },
    { min: 700000, max: 1000000, rate: 10 },
    { min: 1000000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 },
];

// Standard Deduction
export const STANDARD_DEDUCTION = 50000;

// Section 80C Limit
export const SECTION_80C_LIMIT = 150000;

// Section 80D Limits
export const SECTION_80D_SELF = 25000;
export const SECTION_80D_SENIOR = 50000;

/**
 * Calculate income tax based on regime and taxable income
 */
export function calculateIncomeTax(
    taxableIncome: number,
    regime: 'old' | 'new' = 'new'
): { tax: number; cess: number; total: number } {
    const slabs = regime === 'old' ? OLD_TAX_SLABS : NEW_TAX_SLABS;
    let tax = 0;

    for (const slab of slabs) {
        if (taxableIncome > slab.min) {
            const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
            tax += (taxableInSlab * slab.rate) / 100;
        }
    }

    // Add 4% Health & Education Cess
    const cess = tax * 0.04;
    const total = tax + cess;

    return { tax, cess, total };
}

/**
 * Calculate tax using old regime (convenience function)
 */
export function calculateTaxOldRegime(taxableIncome: number): number {
    return calculateIncomeTax(taxableIncome, 'old').total;
}

/**
 * Calculate tax using new regime (convenience function)
 */
export function calculateTaxNewRegime(taxableIncome: number): number {
    return calculateIncomeTax(taxableIncome, 'new').total;
}

/**
 * Calculate presumptive income for professionals (Section 44ADA)
 * 50% of gross receipts (max ₹50 lakhs)
 */
export function calculatePresumptiveIncome(grossReceipts: number): number {
    if (grossReceipts > 5000000) {
        throw new Error('Gross receipts exceed ₹50 lakhs. Cannot use presumptive taxation.');
    }
    return grossReceipts * 0.5;
}

/**
 * Calculate total deductions under old regime
 */
export function calculateDeductions(deductions: {
    section80C?: number;
    section80D?: number;
    section80G?: number;
    otherDeductions?: number;
}): number {
    const {
        section80C = 0,
        section80D = 0,
        section80G = 0,
        otherDeductions = 0,
    } = deductions;

    // Cap 80C at limit
    const capped80C = Math.min(section80C, SECTION_80C_LIMIT);

    return capped80C + section80D + section80G + otherDeductions;
}

/**
 * Calculate advance tax installments
 * Q1 (Jun 15): 15%
 * Q2 (Sep 15): 45% (cumulative)
 * Q3 (Dec 15): 75% (cumulative)
 * Q4 (Mar 15): 100% (cumulative)
 */
export function calculateAdvanceTaxInstallments(totalTaxLiability: number): {
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
} {
    return {
        Q1: totalTaxLiability * 0.15,
        Q2: totalTaxLiability * 0.45 - totalTaxLiability * 0.15,
        Q3: totalTaxLiability * 0.75 - totalTaxLiability * 0.45,
        Q4: totalTaxLiability - totalTaxLiability * 0.75,
    };
}

/**
 * Get advance tax due dates for a financial year
 */
export function getAdvanceTaxDueDates(financialYear: string): {
    Q1: Date;
    Q2: Date;
    Q3: Date;
    Q4: Date;
} {
    const [startYear] = financialYear.split('-');
    const year = parseInt(startYear);

    return {
        Q1: new Date(year, 5, 15), // June 15
        Q2: new Date(year, 8, 15), // September 15
        Q3: new Date(year, 11, 15), // December 15
        Q4: new Date(year + 1, 2, 15), // March 15
    };
}

/**
 * Compare old vs new tax regime
 */
export function compareTaxRegimes(
    grossIncome: number,
    deductions: {
        section80C?: number;
        section80D?: number;
        section80G?: number;
        otherDeductions?: number;
    }
): {
    oldRegime: { taxableIncome: number; tax: number; cess: number; total: number };
    newRegime: { taxableIncome: number; tax: number; cess: number; total: number };
    recommendation: 'old' | 'new';
    savings: number;
} {
    // Old Regime: Income - Standard Deduction - All Deductions
    const totalDeductions = calculateDeductions(deductions);
    const oldTaxableIncome = Math.max(0, grossIncome - STANDARD_DEDUCTION - totalDeductions);
    const oldTax = calculateIncomeTax(oldTaxableIncome, 'old');

    // New Regime: Income - Standard Deduction only
    const newTaxableIncome = Math.max(0, grossIncome - STANDARD_DEDUCTION);
    const newTax = calculateIncomeTax(newTaxableIncome, 'new');

    const recommendation = oldTax.total < newTax.total ? 'old' : 'new';
    const savings = Math.abs(oldTax.total - newTax.total);

    return {
        oldRegime: {
            taxableIncome: oldTaxableIncome,
            ...oldTax,
        },
        newRegime: {
            taxableIncome: newTaxableIncome,
            ...newTax,
        },
        recommendation,
        savings,
    };
}

/**
 * Calculate TDS to be deducted (for freelancers receiving payments)
 * Section 194J: 10% for professional/technical services
 */
export function calculateTDS(amount: number, hasPAN: boolean = true): number {
    if (!hasPAN) {
        return amount * 0.2; // 20% if no PAN
    }
    return amount * 0.1; // 10% for professional services
}

/**
 * Validate if user is eligible for presumptive taxation (Section 44ADA)
 */
export function isEligibleForPresumptiveTaxation(
    grossReceipts: number,
    profession: string
): { eligible: boolean; reason?: string } {
    if (grossReceipts > 5000000) {
        return {
            eligible: false,
            reason: 'Gross receipts exceed ₹50 lakhs',
        };
    }

    const eligibleProfessions = [
        'legal',
        'medical',
        'engineering',
        'architecture',
        'accountancy',
        'technical_consultancy',
        'interior_decoration',
        'advertising',
        'freelancer',
        'consultant',
    ];

    if (!eligibleProfessions.includes(profession.toLowerCase())) {
        return {
            eligible: false,
            reason: 'Profession not eligible for presumptive taxation',
        };
    }

    return { eligible: true };
}

/**
 * Calculate rebate under Section 87A
 * Rebate of ₹12,500 if taxable income ≤ ₹7 lakhs (new regime)
 * Rebate of ₹12,500 if taxable income ≤ ₹5 lakhs (old regime)
 */
export function calculateRebate87A(
    taxableIncome: number,
    taxBeforeRebate: number,
    regime: 'old' | 'new'
): number {
    const limit = regime === 'new' ? 700000 : 500000;

    if (taxableIncome <= limit) {
        return Math.min(taxBeforeRebate, 12500);
    }

    return 0;
}

/**
 * Format amount in words (for Form 16)
 */
export function amountInWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (amount === 0) return 'Zero Rupees Only';

    const crores = Math.floor(amount / 10000000);
    const lakhs = Math.floor((amount % 10000000) / 100000);
    const thousands = Math.floor((amount % 100000) / 1000);
    const hundreds = Math.floor((amount % 1000) / 100);
    const remainder = Math.floor(amount % 100);

    let words = '';

    if (crores > 0) words += ones[crores] + ' Crore ';
    if (lakhs > 0) words += (lakhs < 20 && lakhs > 9 ? teens[lakhs - 10] : tens[Math.floor(lakhs / 10)] + ' ' + ones[lakhs % 10]) + ' Lakh ';
    if (thousands > 0) words += (thousands < 20 && thousands > 9 ? teens[thousands - 10] : tens[Math.floor(thousands / 10)] + ' ' + ones[thousands % 10]) + ' Thousand ';
    if (hundreds > 0) words += ones[hundreds] + ' Hundred ';
    if (remainder > 0) {
        if (remainder < 10) words += ones[remainder];
        else if (remainder < 20) words += teens[remainder - 10];
        else words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
    }

    return words.trim() + ' Rupees Only';
}
