import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useITRSummary, useIncomeEntries, useExpenseEntries } from "@/hooks/useITR";
import { formatCurrency } from "@/lib/helpers";
import {
    TrendingUp,
    TrendingDown,
    Calculator,
    FileText,
    DollarSign,
    Plus,
    ArrowRight
} from "lucide-react";
import { getCurrentFinancialYear } from "@/lib/helpers";

export default function ITRDashboardPage() {
    const navigate = useNavigate();
    const financialYear = getCurrentFinancialYear();
    const summary = useITRSummary(financialYear);
    const { data: incomeEntries } = useIncomeEntries(financialYear);
    const { data: expenseEntries } = useExpenseEntries(financialYear);

    const stats = [
        {
            title: "Total Income",
            value: formatCurrency(summary.totalIncome),
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Total Expenses",
            value: formatCurrency(summary.totalExpenses),
            icon: TrendingDown,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
        {
            title: "Net Income",
            value: formatCurrency(summary.netIncome),
            icon: DollarSign,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Tax Liability",
            value: formatCurrency(summary.taxLiability),
            icon: Calculator,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ];

    const quickActions = [
        {
            title: "Add Income",
            description: "Record professional fees or other income",
            icon: Plus,
            onClick: () => navigate("/income"),
            color: "bg-green-600",
        },
        {
            title: "Add Expense",
            description: "Track business expenses",
            icon: Plus,
            onClick: () => navigate("/expenses"),
            color: "bg-red-600",
        },
        {
            title: "Compute Tax",
            description: "Calculate your tax liability",
            icon: Calculator,
            onClick: () => navigate("/tax-computation"),
            color: "bg-blue-600",
        },
        {
            title: "Advance Tax",
            description: "Track quarterly payments",
            icon: FileText,
            onClick: () => navigate("/advance-tax"),
            color: "bg-orange-600",
        },
    ];

    return (
        <AppLayout
            title="ITR Dashboard"
            subtitle={`Income Tax Return for FY ${financialYear}`}
        >
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => (
                                <button
                                    key={action.title}
                                    onClick={action.onClick}
                                    className="flex flex-col items-start p-4 rounded-lg border hover:border-primary transition-colors text-left"
                                >
                                    <div className={`p-2 rounded-lg ${action.color} mb-3`}>
                                        <action.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="font-medium mb-1">{action.title}</h3>
                                    <p className="text-sm text-muted-foreground">{action.description}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Income */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Income</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/income")}>
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {incomeEntries && incomeEntries.length > 0 ? (
                                <div className="space-y-3">
                                    {incomeEntries.slice(0, 5).map((entry) => (
                                        <div key={entry.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{entry.description}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.client_name || entry.category}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">
                                                    {formatCurrency(entry.amount)}
                                                </p>
                                                {entry.tds_deducted > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        TDS: {formatCurrency(entry.tds_deducted)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No income entries yet</p>
                                    <Button
                                        variant="link"
                                        onClick={() => navigate("/income")}
                                        className="mt-2"
                                    >
                                        Add your first income entry
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Expenses */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Expenses</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/expenses")}>
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {expenseEntries && expenseEntries.length > 0 ? (
                                <div className="space-y-3">
                                    {expenseEntries.slice(0, 5).map((entry) => (
                                        <div key={entry.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{entry.description}</p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {entry.category.replace('_', ' ')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-red-600">
                                                    {formatCurrency(entry.amount)}
                                                </p>
                                                {!entry.is_deductible && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Not deductible
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No expense entries yet</p>
                                    <Button
                                        variant="link"
                                        onClick={() => navigate("/expenses")}
                                        className="mt-2"
                                    >
                                        Add your first expense
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tax Summary */}
                {summary.taxLiability > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tax Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Tax Liability</p>
                                    <p className="text-2xl font-bold">{formatCurrency(summary.taxLiability)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">TDS Paid</p>
                                    <p className="text-2xl font-bold">{formatCurrency(summary.totalTDS)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {summary.taxPayable > 0 ? 'Tax Payable' : 'Refund Due'}
                                    </p>
                                    <p className={`text-2xl font-bold ${summary.taxPayable > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(Math.abs(summary.taxPayable || summary.refundDue))}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
