import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield,
  DollarSign,
  TrendingUp,
  Users,
  PieChart
} from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

interface RevenueStats {
  mrr: number;
  arr: number;
  arpu: number;
  ltv: number;
  planBreakdown: { name: string; count: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

const COLORS = ['hsl(168, 80%, 28%)', 'hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)'];

export default function RevenueAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdminAccess();
  }, [user]);

  const checkSuperAdminAccess = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      if (error) throw error;

      if (!data) {
        toast.error("Access denied. Super admin privileges required.");
        navigate("/");
        return;
      }

      setIsSuperAdmin(true);
      fetchRevenueStats();
    } catch (error: any) {
      toast.error("Failed to verify admin access");
      navigate("/");
    }
  };

  const fetchRevenueStats = async () => {
    try {
      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*");

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Calculate metrics
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
      
      const mrr = activeSubscriptions.reduce((sum, s) => {
        return sum + (s.billing_cycle === 'yearly' ? (s.amount || 0) / 12 : (s.amount || 0));
      }, 0);

      const arr = mrr * 12;
      const arpu = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;
      const ltv = arpu * 24; // Assuming 24 month average lifetime

      // Plan breakdown
      const planCounts: Record<string, { count: number; revenue: number }> = {};
      activeSubscriptions.forEach(s => {
        const plan = s.plan_name || 'unknown';
        if (!planCounts[plan]) {
          planCounts[plan] = { count: 0, revenue: 0 };
        }
        planCounts[plan].count++;
        planCounts[plan].revenue += s.billing_cycle === 'yearly' ? (s.amount || 0) / 12 : (s.amount || 0);
      });

      const planBreakdown = Object.entries(planCounts).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: data.count,
        revenue: data.revenue
      }));

      // Mock monthly revenue data (in real app, aggregate from transactions)
      const monthlyRevenue = [
        { month: 'Jul', revenue: mrr * 0.7 },
        { month: 'Aug', revenue: mrr * 0.75 },
        { month: 'Sep', revenue: mrr * 0.8 },
        { month: 'Oct', revenue: mrr * 0.85 },
        { month: 'Nov', revenue: mrr * 0.9 },
        { month: 'Dec', revenue: mrr },
      ];

      setStats({
        mrr,
        arr,
        arpu,
        ltv,
        planBreakdown,
        monthlyRevenue
      });
    } catch (error: any) {
      toast.error("Failed to fetch revenue stats");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
                <p className="text-sm text-muted-foreground">Revenue Analytics</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button 
              onClick={() => navigate("/super-admin")}
              className="py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate("/super-admin/users")}
              className="py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            >
              Users
            </button>
            <button className="py-4 border-b-2 border-primary text-primary font-medium">
              Revenue
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue (MRR)</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.mrr || 0)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Revenue (ARR)</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.arr || 0)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Revenue Per User</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.arpu || 0)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Value (LTV)</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.ltv || 0)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.monthlyRevenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(168, 80%, 28%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : stats?.planBreakdown && stats.planBreakdown.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={stats.planBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.planBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No subscription data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plan Breakdown Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Plan Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.planBreakdown?.map((plan, index) => (
                  <div key={plan.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      <div>
                        <p className="font-medium text-foreground">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.count} subscribers</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(plan.revenue)}/mo</p>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">No subscription data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}