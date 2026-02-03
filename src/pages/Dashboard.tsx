import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IndianRupee,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { Link } from "react-router-dom";
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
} from "recharts";

const invoiceColumns = [
  {
    key: "invoice_number",
    header: "Invoice",
    cell: (invoice: any) => (
      <div>
        <p className="font-medium text-foreground">{invoice.invoice_number}</p>
        <p className="text-xs text-muted-foreground">{formatDate(invoice.invoice_date)}</p>
      </div>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    cell: (invoice: any) => (
      <span className="text-sm">{invoice.customer?.name || "—"}</span>
    ),
  },
  {
    key: "total",
    header: "Amount",
    cell: (invoice: any) => (
      <span className="font-medium">{formatCurrency(invoice.total_amount || 0)}</span>
    ),
    className: "text-right",
  },
  {
    key: "status",
    header: "Status",
    cell: (invoice: any) => <StatusBadge status={invoice.status} />,
    className: "text-right",
  },
];

const lowStockColumns = [
  {
    key: "name",
    header: "Item",
    cell: (item: any) => (
      <div>
        <p className="font-medium text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.sku}</p>
      </div>
    ),
  },
  {
    key: "stock",
    header: "Stock",
    cell: (item: any) => (
      <div className="flex items-center gap-2">
        <span className="text-destructive font-medium">{item.current_stock}</span>
        <span className="text-muted-foreground">/ {item.reorder_level}</span>
      </div>
    ),
    className: "text-right",
  },
];

export default function Dashboard() {
  const { stats, recentInvoices, lowStockItems, revenueChartData, topCustomersData, isLoading } =
    useDashboardData();

  return (
    <AppLayout title="Dashboard" subtitle="Welcome back! Here's your business overview">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={IndianRupee}
              variant="primary"
            />
            <StatCard
              title="Total Invoices"
              value={stats?.totalInvoices || 0}
              icon={FileText}
              variant="info"
            />
            <StatCard
              title="Pending Amount"
              value={formatCurrency(stats?.pendingAmount || 0)}
              icon={Clock}
              variant="warning"
            />
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              icon={Users}
              variant="success"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Last 6 months
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-[280px]" />
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `₹${value / 1000}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-[280px]" />
            ) : topCustomersData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topCustomersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(value) => `₹${value / 1000}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No customer data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/invoices" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <DataTable
            columns={invoiceColumns}
            data={recentInvoices}
            isLoading={isLoading}
            emptyState={
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No invoices yet</p>
                </CardContent>
              </Card>
            }
          />
        </div>

        {/* Low Stock Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Low Stock Items</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inventory" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <Card className="shadow-card">
              <CardContent className="py-8">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : lowStockItems.length > 0 ? (
            <DataTable columns={lowStockColumns} data={lowStockItems} />
          ) : (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">All items are well stocked</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto py-4 justify-start gap-3">
            <Link to="/invoices/new">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">New Invoice</p>
                <p className="text-xs text-muted-foreground">Create tax invoice</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 justify-start gap-3">
            <Link to="/customers/new">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div className="text-left">
                <p className="font-medium">Add Customer</p>
                <p className="text-xs text-muted-foreground">New customer profile</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 justify-start gap-3">
            <Link to="/items/new">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium">Add Item</p>
                <p className="text-xs text-muted-foreground">Product or service</p>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 justify-start gap-3">
            <Link to="/reports">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div className="text-left">
                <p className="font-medium">View Reports</p>
                <p className="text-xs text-muted-foreground">Sales & GST reports</p>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
