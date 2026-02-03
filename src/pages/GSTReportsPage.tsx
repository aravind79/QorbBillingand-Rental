import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet } from "lucide-react";
import { useGSTR1Data, useGSTR3BData, useExportGSTR1JSON, useExportGSTR3BJSON } from "@/hooks/useGSTReports";
import { formatCurrency } from "@/lib/helpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportGSTR1ToExcel, exportGSTR3BToExcel } from "@/lib/excelExport";

export default function GSTReportsPage() {
    const { user } = useAuth();
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    // Fetch business GSTIN
    const { data: businessSettings } = useQuery({
        queryKey: ["business-settings"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("business_settings")
                .select("gstin, gst_enabled, business_name")
                .maybeSingle();
            if (error) throw error;
            return data;
        },
    });

    const { data: gstr1Data, isLoading: gstr1Loading } = useGSTR1Data(selectedMonth, selectedYear);
    const { data: gstr3bData, isLoading: gstr3bLoading } = useGSTR3BData(selectedMonth, selectedYear);

    const exportGSTR1 = useExportGSTR1JSON();
    const exportGSTR3B = useExportGSTR3BJSON();

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    const handleExportGSTR1 = () => {
        if (!gstr1Data || !businessSettings?.gstin) return;
        exportGSTR1.mutate({
            data: gstr1Data,
            month: selectedMonth,
            year: selectedYear,
            gstin: businessSettings.gstin,
        });
    };

    const handleExportGSTR3B = () => {
        if (!gstr3bData || !businessSettings?.gstin) return;
        exportGSTR3B.mutate({
            data: gstr3bData,
            month: selectedMonth,
            year: selectedYear,
            gstin: businessSettings.gstin,
        });
    };

    if (!businessSettings?.gst_enabled) {
        return (
            <AppLayout title="GST Reports" subtitle="Generate GSTR-1 and GSTR-3B reports">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        GST is not enabled in your business settings. Please enable GST from Settings to access GST reports.
                    </AlertDescription>
                </Alert>
            </AppLayout>
        );
    }

    if (!businessSettings?.gstin) {
        return (
            <AppLayout title="GST Reports" subtitle="Generate GSTR-1 and GSTR-3B reports">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        GSTIN is not configured. Please add your GSTIN in Settings to generate GST reports.
                    </AlertDescription>
                </Alert>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GST Reports" subtitle="Generate GSTR-1 and GSTR-3B reports for filing">
            <div className="space-y-6">
                {/* Period Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Select Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Month</label>
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((month) => (
                                            <SelectItem key={month.value} value={month.value.toString()}>
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Year</label>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    GSTIN: <span className="font-mono font-medium">{businessSettings.gstin}</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                {gstr1Data && (
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{gstr1Data.summary.totalInvoices}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Taxable Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(gstr1Data.summary.totalTaxableValue)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(gstr1Data.summary.totalTax)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium">Ready to Export</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="gstr1" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
                        <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
                    </TabsList>

                    {/* GSTR-1 Tab */}
                    <TabsContent value="gstr1" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>GSTR-1 - Outward Supplies</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Details of outward supplies of goods or services
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => gstr1Data && exportGSTR1ToExcel(gstr1Data, selectedMonth, selectedYear, businessSettings?.business_name || 'Business')}
                                        disabled={!gstr1Data}
                                    >
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Export Excel
                                    </Button>
                                    <Button onClick={handleExportGSTR1} disabled={!gstr1Data || exportGSTR1.isPending}>
                                        {exportGSTR1.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="mr-2 h-4 w-4" />
                                        )}
                                        Export JSON
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {gstr1Loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : gstr1Data ? (
                                    <div className="space-y-6">
                                        {/* B2B Invoices */}
                                        <div>
                                            <h3 className="font-semibold mb-3">B2B Invoices (With GSTIN)</h3>
                                            {gstr1Data.b2b.length > 0 ? (
                                                <div className="border rounded-lg overflow-hidden">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-muted/50">
                                                                <TableHead>Invoice No</TableHead>
                                                                <TableHead>Date</TableHead>
                                                                <TableHead>Customer</TableHead>
                                                                <TableHead>GSTIN</TableHead>
                                                                <TableHead className="text-right">Taxable Value</TableHead>
                                                                <TableHead className="text-right">CGST</TableHead>
                                                                <TableHead className="text-right">SGST</TableHead>
                                                                <TableHead className="text-right">IGST</TableHead>
                                                                <TableHead className="text-right">Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {gstr1Data.b2b.map((inv, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                                                                    <TableCell>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</TableCell>
                                                                    <TableCell>{inv.customerName}</TableCell>
                                                                    <TableCell className="font-mono text-xs">{inv.customerGSTIN}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(inv.taxableValue)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(inv.cgst)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(inv.sgst)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(inv.igst)}</TableCell>
                                                                    <TableCell className="text-right font-medium">{formatCurrency(inv.totalValue)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground py-4">No B2B invoices for this period</p>
                                            )}
                                        </div>

                                        {/* B2C Summary */}
                                        <div>
                                            <h3 className="font-semibold mb-3">B2C Summary (Without GSTIN)</h3>
                                            {gstr1Data.b2c.length > 0 ? (
                                                <div className="border rounded-lg overflow-hidden">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-muted/50">
                                                                <TableHead>State</TableHead>
                                                                <TableHead className="text-right">Taxable Value</TableHead>
                                                                <TableHead className="text-right">CGST</TableHead>
                                                                <TableHead className="text-right">SGST</TableHead>
                                                                <TableHead className="text-right">IGST</TableHead>
                                                                <TableHead className="text-right">Total</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {gstr1Data.b2c.map((b2c: any, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-medium">{b2c.state}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(b2c.taxableValue)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(b2c.cgst)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(b2c.sgst)}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(b2c.igst)}</TableCell>
                                                                    <TableCell className="text-right font-medium">{formatCurrency(b2c.totalValue)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground py-4">No B2C invoices for this period</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* GSTR-3B Tab */}
                    <TabsContent value="gstr3b" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>GSTR-3B - Monthly Return</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Summary of outward supplies and tax liability
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => gstr3bData && exportGSTR3BToExcel(gstr3bData, selectedMonth, selectedYear, businessSettings?.business_name || 'Business')}
                                        disabled={!gstr3bData}
                                    >
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Export Excel
                                    </Button>
                                    <Button onClick={handleExportGSTR3B} disabled={!gstr3bData || exportGSTR3B.isPending}>
                                        {exportGSTR3B.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="mr-2 h-4 w-4" />
                                        )}
                                        Export JSON
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {gstr3bLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : gstr3bData ? (
                                    <div className="space-y-6">
                                        {/* Outward Supplies */}
                                        <div>
                                            <h3 className="font-semibold mb-3">3.1 - Outward Taxable Supplies</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">Taxable Value</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-semibold">{formatCurrency(gstr3bData.outwardSupplies.taxableValue)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">IGST</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-semibold">{formatCurrency(gstr3bData.outwardSupplies.igst)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">CGST</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-semibold">{formatCurrency(gstr3bData.outwardSupplies.cgst)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">SGST</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-semibold">{formatCurrency(gstr3bData.outwardSupplies.sgst)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">Cess</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-semibold">{formatCurrency(gstr3bData.outwardSupplies.cess)}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        {/* ITC */}
                                        <div>
                                            <h3 className="font-semibold mb-3">4 - Input Tax Credit (ITC)</h3>
                                            <Alert>
                                                <FileText className="h-4 w-4" />
                                                <AlertDescription>
                                                    ITC is currently not tracked. This will show zero until purchase/expense module is implemented.
                                                </AlertDescription>
                                            </Alert>
                                        </div>

                                        {/* Net Tax Liability */}
                                        <div>
                                            <h3 className="font-semibold mb-3">5.1 - Net Tax Liability</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                <Card className="bg-primary/5">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">IGST</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-bold text-primary">{formatCurrency(gstr3bData.netTaxLiability.igst)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-primary/5">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">CGST</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-bold text-primary">{formatCurrency(gstr3bData.netTaxLiability.cgst)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-primary/5">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">SGST</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-bold text-primary">{formatCurrency(gstr3bData.netTaxLiability.sgst)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-primary/5">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">Cess</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-bold text-primary">{formatCurrency(gstr3bData.netTaxLiability.cess)}</p>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-primary/10">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xs text-muted-foreground">Total Tax Payable</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-xl font-bold text-primary">{formatCurrency(gstr3bData.netTaxLiability.total)}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">No data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
