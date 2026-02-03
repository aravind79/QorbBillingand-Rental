import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  BookOpen,
  Users,
  Package,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { useGSTReports, useMonthlyGSTSummary } from "@/hooks/useGSTReports";
import { useDayBookReport } from "@/hooks/useDayBookReport";
import { useStockReport, useLowStockReport, useItemSalesReport } from "@/hooks/useStockReport";
import { useProfitLossReport } from "@/hooks/useProfitLossReport";
import { usePartyOutstanding } from "@/hooks/usePartyLedger";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))"];

export default function ReportsPage() {
  const [period, setPeriod] = useState("current");

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    if (period === "current") {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    } else if (period === "last") {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    } else if (period === "quarter") {
      return { start: subMonths(now, 3), end: now };
    }
    // FY
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return { start: new Date(year, 3, 1), end: new Date(year + 1, 2, 31) };
  };

  const { start, end } = getDateRange();
  const { data: reportData, isLoading } = useGSTReports(start, end);
  const { data: monthlyData = [], isLoading: monthlyLoading } = useMonthlyGSTSummary();
  const { data: dayBookData = [], isLoading: dayBookLoading } = useDayBookReport(start, end);
  const { data: stockData = [], isLoading: stockLoading } = useStockReport();
  const { data: lowStockData = [] } = useLowStockReport();
  const { data: itemSalesData = [], isLoading: itemSalesLoading } = useItemSalesReport(start, end);
  const { data: profitLossData, isLoading: plLoading } = useProfitLossReport(start, end);
  const { data: outstandingCustomers = [] } = usePartyOutstanding("customer");

  const gstr1 = reportData?.gstr1;
  const salesRegister = reportData?.salesRegister || [];
  const taxSummary = reportData?.taxSummary || [];

  const gstPieData = gstr1
    ? [
        { type: "CGST", amount: gstr1.summary.total_cgst },
        { type: "SGST", amount: gstr1.summary.total_sgst },
        { type: "IGST", amount: gstr1.summary.total_igst },
      ].filter((d) => d.amount > 0)
    : [];

  return (
    <AppLayout title="Reports" subtitle="Business analytics and GST reports">
      <Tabs defaultValue="gst" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
            <TabsTrigger value="gst">GST Summary</TabsTrigger>
            <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
            <TabsTrigger value="sales">Sales Register</TabsTrigger>
            <TabsTrigger value="daybook">Day Book</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
            <TabsTrigger value="profit">Profit & Loss</TabsTrigger>
            <TabsTrigger value="tax">Tax Breakdown</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="last">Last Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="fy">Current FY</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* GST Summary */}
        <TabsContent value="gst" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Taxable Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(gstr1?.summary.total_taxable || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total CGST</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(gstr1?.summary.total_cgst || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total SGST</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(gstr1?.summary.total_sgst || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Tax</p>
                    <p className="text-2xl font-bold text-warning">
                      {formatCurrency(gstr1?.summary.total_tax || 0)}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Monthly Tax Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyLoading ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => `₹${value / 1000}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar
                        dataKey="taxable"
                        name="Taxable Value"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="tax"
                        name="Tax Amount"
                        fill="hsl(var(--warning))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">GST Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : gstPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={gstPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="amount"
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      >
                        {gstPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    No tax data for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GSTR-1 */}
        <TabsContent value="gstr1" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">B2B Transactions (Large Taxpayers)</CardTitle>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : gstr1?.b2b.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Taxable</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstr1.b2b.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{row.gstin}</TableCell>
                          <TableCell>{row.customer_name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.taxable_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.total_tax)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No B2B transactions for this period
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">B2C Summary (Unregistered)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Invoice Count</span>
                      <span className="font-medium">{gstr1?.b2c.invoice_count || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Taxable Value</span>
                      <span className="font-medium">
                        {formatCurrency(gstr1?.b2c.taxable_value || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">CGST</span>
                      <span className="font-medium">{formatCurrency(gstr1?.b2c.cgst || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">SGST</span>
                      <span className="font-medium">{formatCurrency(gstr1?.b2c.sgst || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium">
                      <span>Total Tax</span>
                      <span className="text-warning">
                        {formatCurrency(gstr1?.b2c.total_tax || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">GSTR-1 Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">Total Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>B2B (Registered)</TableCell>
                    <TableCell className="text-right">{gstr1?.b2b.length || 0}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        gstr1?.b2b.reduce((s, r) => s + r.taxable_value, 0) || 0
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2b.reduce((s, r) => s + r.cgst, 0) || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2b.reduce((s, r) => s + r.sgst, 0) || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2b.reduce((s, r) => s + r.total_tax, 0) || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>B2C (Unregistered)</TableCell>
                    <TableCell className="text-right">{gstr1?.b2c.invoice_count || 0}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2c.taxable_value || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2c.cgst || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2c.sgst || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.b2c.total_tax || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-medium bg-secondary/30">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {gstr1?.summary.total_invoices || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.summary.total_taxable || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.summary.total_cgst || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.summary.total_sgst || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(gstr1?.summary.total_tax || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Register */}
        <TabsContent value="sales" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Sales Register</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-60 w-full" />
                </div>
              ) : salesRegister.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead className="text-right">Taxable</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesRegister.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{formatDate(entry.invoice_date)}</TableCell>
                          <TableCell className="font-medium">{entry.invoice_number}</TableCell>
                          <TableCell>{entry.customer_name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {entry.gstin || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.taxable_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.cgst)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.sgst)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(entry.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No sales data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Breakdown */}
        <TabsContent value="tax" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Tax Summary by Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : taxSummary.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GST Rate</TableHead>
                      <TableHead className="text-right">Taxable Value</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                      <TableHead className="text-right">Total Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxSummary.map((row) => (
                      <TableRow key={row.rate}>
                        <TableCell className="font-medium">{row.rate}%</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.taxable_value)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(row.cgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.sgst)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.total_tax)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium bg-secondary/30">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(taxSummary.reduce((s, r) => s + r.taxable_value, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(taxSummary.reduce((s, r) => s + r.cgst, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(taxSummary.reduce((s, r) => s + r.sgst, 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(taxSummary.reduce((s, r) => s + r.total_tax, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No tax data for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Day Book */}
        <TabsContent value="daybook" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Day Book
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {dayBookLoading ? (
                <div className="p-4"><Skeleton className="h-60 w-full" /></div>
              ) : dayBookData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Particulars</TableHead>
                      <TableHead>Voucher Type</TableHead>
                      <TableHead>Voucher No.</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayBookData.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell>{entry.particulars}</TableCell>
                        <TableCell>{entry.voucher_type}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.voucher_no}</TableCell>
                        <TableCell className="text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : "—"}</TableCell>
                        <TableCell className="text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No transactions for this period</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Report */}
        <TabsContent value="stock" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stockData.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-destructive">{lowStockData.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stockData.reduce((s, i) => s + i.stock_value, 0))}</p>
              </CardContent>
            </Card>
          </div>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stockLoading ? (
                <div className="p-4"><Skeleton className="h-60 w-full" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.slice(0, 20).map((item) => (
                      <TableRow key={item.id} className={item.is_low_stock ? "bg-destructive/10" : ""}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-xs">{item.sku || "—"}</TableCell>
                        <TableCell className="text-right">{item.current_stock}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.stock_value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding */}
        <TabsContent value="outstanding" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Party Wise Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {outstandingCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Party Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingCustomers.map((party) => (
                      <TableRow key={party.id}>
                        <TableCell className="font-medium">{party.name}</TableCell>
                        <TableCell>{party.phone || "—"}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(party.outstanding_balance || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No outstanding balances</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(profitLossData?.totalRevenue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Cost of Goods</p>
                <p className="text-2xl font-bold">{formatCurrency(profitLossData?.totalCost || 0)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(profitLossData?.grossProfit || 0)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Tax Collected</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(profitLossData?.totalTax || 0)}</p>
              </CardContent>
            </Card>
          </div>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {itemSalesLoading ? (
                <div className="p-4"><Skeleton className="h-40 w-full" /></div>
              ) : itemSalesData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemSalesData.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No sales data for this period</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
