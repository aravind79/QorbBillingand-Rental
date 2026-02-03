import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useExpenseEntries, useCreateExpense } from "@/hooks/useITR";
import { formatCurrency, formatDate, getCurrentFinancialYear } from "@/lib/helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ExpensesPage() {
    const financialYear = getCurrentFinancialYear();
    const { data: expenseEntries, isLoading } = useExpenseEntries(financialYear);
    const createExpense = useCreateExpense();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        category: "office_expenses" as const,
        is_deductible: true,
        vendor_name: "",
        gst_amount: "",
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createExpense.mutateAsync({
            ...formData,
            amount: parseFloat(formData.amount),
            gst_amount: parseFloat(formData.gst_amount || "0"),
        });
        setIsDialogOpen(false);
        setFormData({
            entry_date: new Date().toISOString().split('T')[0],
            description: "",
            amount: "",
            category: "office_expenses",
            is_deductible: true,
            vendor_name: "",
            gst_amount: "",
            notes: "",
        });
    };

    const totalExpenses = expenseEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const deductibleExpenses = expenseEntries?.filter(e => e.is_deductible).reduce((sum, entry) => sum + entry.amount, 0) || 0;

    return (
        <AppLayout title="Expenses" subtitle={`Track expenses for FY ${financialYear}`}>
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Deductible</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(deductibleExpenses)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Non-Deductible</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalExpenses - deductibleExpenses)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expense List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Expense Entries</CardTitle>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Expense
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add Expense Entry</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Date</Label>
                                            <Input
                                                type="date"
                                                value={formData.entry_date}
                                                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Category</Label>
                                            <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="rent">Rent</SelectItem>
                                                    <SelectItem value="electricity">Electricity</SelectItem>
                                                    <SelectItem value="internet">Internet</SelectItem>
                                                    <SelectItem value="software">Software & Subscriptions</SelectItem>
                                                    <SelectItem value="travel">Travel</SelectItem>
                                                    <SelectItem value="professional_fees">Professional Fees</SelectItem>
                                                    <SelectItem value="office_expenses">Office Expenses</SelectItem>
                                                    <SelectItem value="depreciation">Depreciation</SelectItem>
                                                    <SelectItem value="insurance">Insurance</SelectItem>
                                                    <SelectItem value="repairs">Repairs & Maintenance</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="e.g., Office rent for January 2026"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>GST Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.gst_amount}
                                                onChange={(e) => setFormData({ ...formData, gst_amount: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Vendor Name</Label>
                                        <Input
                                            value={formData.vendor_name}
                                            onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.is_deductible}
                                            onCheckedChange={(checked) => setFormData({ ...formData, is_deductible: checked })}
                                        />
                                        <Label>Tax Deductible</Label>
                                    </div>

                                    <div>
                                        <Label>Notes</Label>
                                        <Input
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createExpense.isPending}>
                                            {createExpense.isPending ? "Adding..." : "Add Expense"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : expenseEntries && expenseEntries.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">GST</TableHead>
                                        <TableHead>Deductible</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{formatDate(entry.entry_date)}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {entry.category.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{entry.vendor_name || "-"}</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                {formatCurrency(entry.amount)}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(entry.gst_amount)}</TableCell>
                                            <TableCell>
                                                {entry.is_deductible ? (
                                                    <Badge variant="default">Yes</Badge>
                                                ) : (
                                                    <Badge variant="secondary">No</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">No expense entries yet</p>
                                <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Expense
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
