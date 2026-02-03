import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency, getCurrentFinancialYear } from "@/lib/helpers";
import { useITRComputation } from "@/hooks/useITR";

interface AdvanceTaxInstallment {
    quarter: string;
    dueDate: string;
    percentage: number;
    amount: number;
    paid: number;
    status: 'pending' | 'partial' | 'paid' | 'overdue';
}

export default function AdvanceTaxPage() {
    const financialYear = getCurrentFinancialYear();
    const { data: computation } = useITRComputation(financialYear);

    const [payments, setPayments] = useState({
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
    });

    // Calculate advance tax installments
    const totalTax = computation?.total_tax_liability || 0;
    const year = parseInt(financialYear.split('-')[0]);

    const installments: AdvanceTaxInstallment[] = [
        {
            quarter: "Q1 (Apr-Jun)",
            dueDate: `15-Jun-${year}`,
            percentage: 15,
            amount: totalTax * 0.15,
            paid: payments.q1,
            status: payments.q1 >= totalTax * 0.15 ? 'paid' : payments.q1 > 0 ? 'partial' : 'pending',
        },
        {
            quarter: "Q2 (Jul-Sep)",
            dueDate: `15-Sep-${year}`,
            percentage: 45,
            amount: totalTax * 0.45,
            paid: payments.q2,
            status: payments.q2 >= totalTax * 0.45 ? 'paid' : payments.q2 > 0 ? 'partial' : 'pending',
        },
        {
            quarter: "Q3 (Oct-Dec)",
            dueDate: `15-Dec-${year}`,
            percentage: 75,
            amount: totalTax * 0.75,
            paid: payments.q3,
            status: payments.q3 >= totalTax * 0.75 ? 'paid' : payments.q3 > 0 ? 'partial' : 'pending',
        },
        {
            quarter: "Q4 (Jan-Mar)",
            dueDate: `15-Mar-${year + 1}`,
            percentage: 100,
            amount: totalTax,
            paid: payments.q4,
            status: payments.q4 >= totalTax ? 'paid' : payments.q4 > 0 ? 'partial' : 'pending',
        },
    ];

    const totalPaid = payments.q1 + payments.q2 + payments.q3 + payments.q4;
    const remainingTax = Math.max(0, totalTax - totalPaid);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge variant="default" className="bg-green-600">Paid</Badge>;
            case 'partial':
                return <Badge variant="secondary">Partial</Badge>;
            case 'overdue':
                return <Badge variant="destructive">Overdue</Badge>;
            default:
                return <Badge variant="outline">Pending</Badge>;
        }
    };

    return (
        <AppLayout title="Advance Tax" subtitle={`Quarterly tax payments for FY ${financialYear}`}>
            <div className="space-y-6">
                {/* Tax Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax Liability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalTax)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{formatCurrency(remainingTax)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalTax > 0 ? Math.round((totalPaid / totalTax) * 100) : 0}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Important Note */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-medium text-blue-900">Advance Tax Payment Schedule</p>
                                <p className="text-sm text-blue-700">
                                    Advance tax must be paid in installments if your tax liability exceeds ₹10,000.
                                    Each installment is cumulative - pay the difference from previous quarters.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Installments */}
                <div className="grid gap-4 md:grid-cols-2">
                    {installments.map((installment, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle className="text-lg">{installment.quarter}</CardTitle>
                                    </div>
                                    {getStatusBadge(installment.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">Due: {installment.dueDate}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Cumulative Tax ({installment.percentage}%):</span>
                                        <span className="font-medium">{formatCurrency(installment.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Already Paid:</span>
                                        <span className="font-medium text-green-600">{formatCurrency(installment.paid)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-2 border-t">
                                        <span>To Pay:</span>
                                        <span className="text-orange-600">
                                            {formatCurrency(Math.max(0, installment.amount - installment.paid))}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Label>Payment Amount</Label>
                                    <Input
                                        type="number"
                                        value={installment.paid}
                                        onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setPayments({
                                                ...payments,
                                                [`q${index + 1}`]: value,
                                            });
                                        }}
                                        placeholder="Enter amount paid"
                                    />
                                </div>

                                {installment.status === 'paid' && (
                                    <div className="flex items-center gap-2 text-green-600 text-sm">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Installment completed</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Payment Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>How to Pay Advance Tax</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <h4 className="font-medium">Online Payment:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Visit the Income Tax e-filing portal</li>
                                <li>Go to e-Pay Tax section</li>
                                <li>Select "Advance Tax (100)" as the payment type</li>
                                <li>Enter the amount and complete payment</li>
                                <li>Save the challan (BSR Code and Date)</li>
                            </ol>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-medium">Important Dates:</h4>
                            <div className="grid gap-2 md:grid-cols-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Q1 (15% of tax):</span>
                                    <span className="font-medium">15th June</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Q2 (45% of tax):</span>
                                    <span className="font-medium">15th September</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Q3 (75% of tax):</span>
                                    <span className="font-medium">15th December</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Q4 (100% of tax):</span>
                                    <span className="font-medium">15th March</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Interest is charged at 1% per month for late payment of advance tax.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
