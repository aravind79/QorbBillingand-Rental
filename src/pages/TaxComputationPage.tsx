import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Save } from "lucide-react";
import { useITRSummary, useComputeITR } from "@/hooks/useITR";
import { formatCurrency, getCurrentFinancialYear } from "@/lib/helpers";
import { calculateTaxOldRegime, calculateTaxNewRegime } from "@/lib/itrHelpers";

export default function TaxComputationPage() {
    const financialYear = getCurrentFinancialYear();
    const summary = useITRSummary(financialYear);
    const computeITR = useComputeITR();

    const [deductions, setDeductions] = useState({
        section_80c: 0,
        section_80d: 0,
        section_80g: 0,
        other_deductions: 0,
    });

    const [selectedRegime, setSelectedRegime] = useState<'old' | 'new'>('new');

    // Calculate taxable income
    const grossIncome = summary.totalIncome;
    const totalExpenses = summary.totalExpenses;
    const netIncome = grossIncome - totalExpenses;
    const totalDeductions = deductions.section_80c + deductions.section_80d + deductions.section_80g + deductions.other_deductions;
    const taxableIncomeOld = Math.max(0, netIncome - totalDeductions);
    const taxableIncomeNew = Math.max(0, netIncome); // No deductions in new regime

    // Calculate tax for both regimes
    const taxOld = calculateTaxOldRegime(taxableIncomeOld);
    const taxNew = calculateTaxNewRegime(taxableIncomeNew);

    // Add cess (4%)
    const cessOld = taxOld * 0.04;
    const cessNew = taxNew * 0.04;
    const totalTaxOld = taxOld + cessOld;
    const totalTaxNew = taxNew + cessNew;

    // Net payable after TDS
    const netPayableOld = totalTaxOld - summary.totalTDS;
    const netPayableNew = totalTaxNew - summary.totalTDS;

    const handleSaveComputation = async () => {
        const selectedTax = selectedRegime === 'old' ? totalTaxOld : totalTaxNew;
        const selectedTaxable = selectedRegime === 'old' ? taxableIncomeOld : taxableIncomeNew;
        const selectedNetPayable = selectedRegime === 'old' ? netPayableOld : netPayableNew;

        await computeITR.mutateAsync({
            financial_year: financialYear,
            gross_receipts: grossIncome,
            professional_income: grossIncome,
            other_income: 0,
            total_income: grossIncome,
            total_expenses: totalExpenses,
            presumptive_income: 0,
            section_80c: deductions.section_80c,
            section_80d: deductions.section_80d,
            section_80g: deductions.section_80g,
            other_deductions: deductions.other_deductions,
            total_deductions: totalDeductions,
            taxable_income: selectedTaxable,
            tax_regime: selectedRegime,
            tax_computed: selectedTax,
            cess: selectedRegime === 'old' ? cessOld : cessNew,
            total_tax_liability: selectedTax,
            tds_paid: summary.totalTDS,
            advance_tax_paid: 0,
            self_assessment_tax: 0,
            tax_payable: Math.max(0, selectedNetPayable),
            refund_due: Math.max(0, -selectedNetPayable),
        });
    };

    return (
        <AppLayout title="Tax Computation" subtitle={`Calculate tax liability for FY ${financialYear}`}>
            <div className="space-y-6">
                {/* Income Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Income Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Gross Professional Income:</span>
                            <span className="font-medium">{formatCurrency(grossIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Business Expenses:</span>
                            <span className="font-medium text-red-600">- {formatCurrency(totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Net Income:</span>
                            <span>{formatCurrency(netIncome)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Deductions (Old Regime Only) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Deductions (Old Regime Only)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Section 80C (Max ₹1,50,000)</Label>
                                <Input
                                    type="number"
                                    value={deductions.section_80c}
                                    onChange={(e) => setDeductions({ ...deductions, section_80c: Math.min(150000, parseFloat(e.target.value) || 0) })}
                                    placeholder="PPF, ELSS, Life Insurance"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    PPF, ELSS, Life Insurance, etc.
                                </p>
                            </div>
                            <div>
                                <Label>Section 80D (Max ₹25,000)</Label>
                                <Input
                                    type="number"
                                    value={deductions.section_80d}
                                    onChange={(e) => setDeductions({ ...deductions, section_80d: Math.min(25000, parseFloat(e.target.value) || 0) })}
                                    placeholder="Health Insurance"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Health Insurance Premium
                                </p>
                            </div>
                            <div>
                                <Label>Section 80G</Label>
                                <Input
                                    type="number"
                                    value={deductions.section_80g}
                                    onChange={(e) => setDeductions({ ...deductions, section_80g: parseFloat(e.target.value) || 0 })}
                                    placeholder="Donations"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Donations to Charitable Trusts
                                </p>
                            </div>
                            <div>
                                <Label>Other Deductions</Label>
                                <Input
                                    type="number"
                                    value={deductions.other_deductions}
                                    onChange={(e) => setDeductions({ ...deductions, other_deductions: parseFloat(e.target.value) || 0 })}
                                    placeholder="Other deductions"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 pt-4 border-t font-medium">
                            <span>Total Deductions:</span>
                            <span>{formatCurrency(totalDeductions)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Tax Comparison */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tax Regime Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={selectedRegime} onValueChange={(value: any) => setSelectedRegime(value)}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="old">Old Regime</TabsTrigger>
                                <TabsTrigger value="new">New Regime</TabsTrigger>
                            </TabsList>

                            <TabsContent value="old" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Net Income:</span>
                                        <span>{formatCurrency(netIncome)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Less: Deductions:</span>
                                        <span>- {formatCurrency(totalDeductions)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 border-t">
                                        <span>Taxable Income:</span>
                                        <span>{formatCurrency(taxableIncomeOld)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Income Tax:</span>
                                        <span>{formatCurrency(taxOld)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cess (4%):</span>
                                        <span>{formatCurrency(cessOld)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Total Tax:</span>
                                        <span>{formatCurrency(totalTaxOld)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600">
                                        <span>Less: TDS Paid:</span>
                                        <span>- {formatCurrency(summary.totalTDS)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                        <span>{netPayableOld >= 0 ? 'Tax Payable:' : 'Refund Due:'}</span>
                                        <span className={netPayableOld >= 0 ? 'text-red-600' : 'text-green-600'}>
                                            {formatCurrency(Math.abs(netPayableOld))}
                                        </span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="new" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Net Income:</span>
                                        <span>{formatCurrency(netIncome)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 border-t">
                                        <span>Taxable Income:</span>
                                        <span>{formatCurrency(taxableIncomeNew)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Income Tax:</span>
                                        <span>{formatCurrency(taxNew)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cess (4%):</span>
                                        <span>{formatCurrency(cessNew)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Total Tax:</span>
                                        <span>{formatCurrency(totalTaxNew)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600">
                                        <span>Less: TDS Paid:</span>
                                        <span>- {formatCurrency(summary.totalTDS)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                        <span>{netPayableNew >= 0 ? 'Tax Payable:' : 'Refund Due:'}</span>
                                        <span className={netPayableNew >= 0 ? 'text-red-600' : 'text-green-600'}>
                                            {formatCurrency(Math.abs(netPayableNew))}
                                        </span>
                                    </div>
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> New regime doesn't allow deductions under 80C, 80D, etc.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Recommendation */}
                        <div className="mt-6 p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">Recommendation:</span>
                            </div>
                            <p className="text-sm text-green-700">
                                {totalTaxOld < totalTaxNew ? (
                                    <>
                                        <Badge variant="default" className="mr-2">Old Regime</Badge>
                                        You'll save {formatCurrency(totalTaxNew - totalTaxOld)} by choosing the old regime.
                                    </>
                                ) : totalTaxNew < totalTaxOld ? (
                                    <>
                                        <Badge variant="default" className="mr-2">New Regime</Badge>
                                        You'll save {formatCurrency(totalTaxOld - totalTaxNew)} by choosing the new regime.
                                    </>
                                ) : (
                                    <>Both regimes result in the same tax liability.</>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSaveComputation} disabled={computeITR.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {computeITR.isPending ? "Saving..." : "Save Computation"}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
