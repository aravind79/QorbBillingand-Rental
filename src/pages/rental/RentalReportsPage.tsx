import { useState, useMemo } from "react";
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
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { useRentals, useRentalStats } from "@/hooks/useRentals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))"];

export default function RentalReportsPage() {
  const [period, setPeriod] = useState("all");
  const { data: rentals = [], isLoading } = useRentals();
  const { data: stats } = useRentalStats();
  const { user } = useAuth();

  // Fetch rental items with item details
  const { data: rentalItemsData = [] } = useQuery({
    queryKey: ["rental-items-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_items")
        .select(`
          *,
          item:items(id, name),
          rental_invoice:rental_invoices(id, rental_status, total_amount, security_deposit)
        `);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate NET revenue (excluding deposits - only rental fees)
  const netRevenue = useMemo(() => {
    return rentals
      .filter(r => r.rental_status === "completed" || r.rental_status === "active")
      .reduce((sum, r) => sum + ((r.total_amount || 0) - (r.security_deposit || 0)), 0);
  }, [rentals]);

  // Total revenue (including deposits for active rentals)
  const totalRevenue = rentals.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalDeposits = rentals.reduce((sum, r) => sum + (r.security_deposit || 0), 0);

  // Most rented items
  const mostRentedItems = useMemo(() => {
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    rentalItemsData.forEach((ri: any) => {
      if (ri.item) {
        const id = ri.item.id;
        if (!itemCounts[id]) {
          itemCounts[id] = { name: ri.item.name, count: 0, revenue: 0 };
        }
        itemCounts[id].count += ri.quantity || 1;
        itemCounts[id].revenue += ri.amount || 0;
      }
    });
    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rentalItemsData]);

  // Most rented customers
  const mostRentedCustomers = useMemo(() => {
    const customerData: Record<string, { name: string; count: number; revenue: number }> = {};
    rentals.forEach((rental) => {
      const id = rental.customer_id || "walk-in";
      const name = rental.customer?.name || "Walk-in Customer";
      if (!customerData[id]) {
        customerData[id] = { name, count: 0, revenue: 0 };
      }
      customerData[id].count += 1;
      customerData[id].revenue += (rental.total_amount || 0) - (rental.security_deposit || 0);
    });
    return Object.values(customerData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rentals]);

  // Status distribution
  const statusData = [
    { name: "Booked", value: rentals.filter((r) => r.rental_status === "booked").length },
    { name: "Active", value: rentals.filter((r) => r.rental_status === "active").length },
    { name: "Completed", value: rentals.filter((r) => r.rental_status === "completed").length },
    { name: "Overdue", value: rentals.filter((r) => r.rental_status === "overdue").length },
    { name: "Cancelled", value: rentals.filter((r) => r.rental_status === "cancelled").length },
  ].filter((d) => d.value > 0);

  const completedRentals = rentals.filter((r) => r.rental_status === "completed").length;

  return (
    <AppLayout title="Rental Reports" subtitle="Analytics and insights for your rental business">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Most Rented Items</TabsTrigger>
            <TabsTrigger value="customers">Top Customers</TabsTrigger>
            <TabsTrigger value="history">Rental History</TabsTrigger>
          </TabsList>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  Total Rentals
                </div>
                <p className="text-2xl font-bold">{rentals.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  Net Revenue (Rent Only)
                </div>
                <p className="text-2xl font-bold text-success">{formatCurrency(netRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Deposits Collected
                </div>
                <p className="text-2xl font-bold">{formatCurrency(totalDeposits)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  Completion Rate
                </div>
                <p className="text-2xl font-bold">
                  {rentals.length > 0 ? Math.round((completedRentals / rentals.length) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Rental Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="w-full h-[280px]" />
                ) : statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    No rental data
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Product-wise Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {mostRentedItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={mostRentedItems.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => `₹${value / 1000}K`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        width={100}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Most Rented Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Most Rented Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Times Rented</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mostRentedItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Most Frequent Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Rentals</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mostRentedCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell className="text-right">{customer.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(customer.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rental History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Rental History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rental #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rent Fee</TableHead>
                    <TableHead className="text-right">Deposit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentals.slice(0, 20).map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell className="font-mono">{rental.rental_number}</TableCell>
                      <TableCell>{rental.customer?.name || "Walk-in"}</TableCell>
                      <TableCell>{formatDate(rental.rental_start_date)}</TableCell>
                      <TableCell>{formatDate(rental.rental_end_date)}</TableCell>
                      <TableCell>
                        <span className={`capitalize ${
                          rental.rental_status === "completed" ? "text-success" :
                          rental.rental_status === "active" ? "text-primary" :
                          rental.rental_status === "overdue" ? "text-destructive" :
                          "text-muted-foreground"
                        }`}>
                          {rental.rental_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency((rental.total_amount || 0) - (rental.security_deposit || 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(rental.security_deposit || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
