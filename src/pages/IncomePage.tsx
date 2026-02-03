import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator } from "lucide-react";
import { useIncomeEntries, useCreateIncome } from "@/hooks/useITR";
import { formatCurrency, formatDate, getCurrentFinancialYear } from "@/lib/helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";


const TDS_RATES: Record<string, number> = {
    professional_fees: 10,
    interest: 10,
    rental_income: 10,
    capital_gains: 0,
    other: 0,
};

export default function IncomePage() {
    const financialYear = getCurrentFinancialYear();
    const { data: incomeEntries, isLoading } = useIncomeEntries(financialYear);
    const createIncome = useCreateIncome();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAutoTds, setIsAutoTds] = useState(true);
    const [formData, setFormData] = useState({
        entry_date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        category: "professional_fees" as const,
        tds_deducted: "",
        client_name: "",
        pan_number: "",
        notes: "",
    });

    // Auto-calculate TDS when Amount or Category changes
    useEffect(() => {
        if (isAutoTds && formData.amount) {
            const amount = parseFloat(formData.amount);
            if (!isNaN(amount)) {
                const rate = TDS_RATES[formData.category] || 0;
                const calculatedTds = (amount * rate) / 100;
                setFormData(prev => ({
                    ...prev,
                    tds_deducted: calculatedTds > 0 ? calculatedTds.toString() : ""
                }));
            }
        }
    }, [formData.amount, formData.category, isAutoTds]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, amount: e.target.value });
    };

    const handleCategoryChange = (value: any) => {
        setFormData({ ...formData, category: value });
    };

    const handleTdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, tds_deducted: e.target.value });
        setIsAutoTds(false); // Disable auto-calc if user manually edits
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createIncome.mutateAsync({
            ...formData,
            amount: parseFloat(formData.amount),
            tds_deducted: parseFloat(formData.tds_deducted || "0"),
        });
        setIsDialogOpen(false);
        setFormData({
            entry_date: new Date().toISOString().split('T')[0],
            description: "",
            amount: "",
            category: "professional_fees",
            tds_deducted: "",
            client_name: "",
            pan_number: "",
            notes: "",
        });
        setIsAutoTds(true);
    };

    const totalIncome = incomeEntries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const totalTDS = incomeEntries?.reduce((sum, entry) => sum + entry.tds_deducted, 0) || 0;

    return (
        <AppLayout title="Income" subtitle={`Track income for FY ${financialYear}`}>
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total TDS</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalTDS)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalIncome - totalTDS)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Income List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Income Entries</CardTitle>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Income
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add Income Entry</DialogTitle>
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
                                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional_fees">Professional Fees</SelectItem>
                                                    <SelectItem value="interest">Interest Income</SelectItem>
                                                    <SelectItem value="rental_income">Rental Income</SelectItem>
                                                    <SelectItem value="capital_gains">Capital Gains</SelectItem>
                                                    <SelectItem value="other">Other Income</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="e.g., Web development project for ABC Corp"
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
                                                onChange={handleAmountChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label>TDS Deducted (₹)</Label>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={isAutoTds}
                                                        onCheckedChange={setIsAutoTds}
                                                        id="auto-tds"
                                                    />
                                                    <Label htmlFor="auto-tds" className="text-xs text-muted-foreground font-normal cursor-pointer flex items-center gap-1">
                                                        <Calculator className="h-3 w-3" />
                                                        Auto ({TDS_RATES[formData.category]}%)
                                                    </Label>
                                                </div>
                                            </div>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.tds_deducted}
                                                onChange={handleTdsChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Client Name</Label>
                                            <Input
                                                value={formData.client_name}
                                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Client PAN</Label>
                                            <Input
                                                value={formData.pan_number}
                                                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                                                placeholder="AAAAA0000A"
                                            />
                                        </div>
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
                                        <Button type="submit" disabled={createIncome.isPending}>
                                            {createIncome.isPending ? "Adding..." : "Add Income"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : incomeEntries && incomeEntries.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">TDS</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomeEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{formatDate(entry.entry_date)}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {entry.category.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{entry.client_name || "-"}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {formatCurrency(entry.amount)}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(entry.tds_deducted)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(entry.amount - entry.tds_deducted)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">No income entries yet</p>
                                <Button onClick={() => setIsDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Income Entry
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
