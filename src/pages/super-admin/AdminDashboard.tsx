import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  UserPlus,
  UserMinus,
  BarChart3,
  Settings,
  FileText,
  Shield
} from "lucide-react";
import { formatCurrency } from "@/lib/helpers";

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  mrr: number;
  newSignupsThisMonth: number;
  churnedThisMonth: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
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
      fetchStats();
    } catch (error: any) {
      toast.error("Failed to verify admin access");
      navigate("/");
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch profiles count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*");

      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
      const mrr = subscriptions?.reduce((sum, s) => {
        if (s.status === 'active') {
          return sum + (s.billing_cycle === 'yearly' ? (s.amount || 0) / 12 : (s.amount || 0));
        }
        return sum;
      }, 0) || 0;

      // Fetch trial users (profiles with subscription_status = 'trial')
      const { count: trialUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "trial");

      // Get signups this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newSignups } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions,
        trialUsers: trialUsers || 0,
        mrr,
        newSignupsThisMonth: newSignups || 0,
        churnedThisMonth: 0 // Would need cancellation tracking
      });
    } catch (error: any) {
      toast.error("Failed to fetch stats");
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
                <p className="text-sm text-muted-foreground">qorb Administration</p>
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
            <button className="py-4 border-b-2 border-primary text-primary font-medium">
              Dashboard
            </button>
            <button 
              onClick={() => navigate("/super-admin/users")}
              className="py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            >
              Users
            </button>
            <button 
              onClick={() => navigate("/super-admin/revenue")}
              className="py-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            >
              Revenue
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats?.totalUsers}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats?.activeSubscriptions}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.mrr || 0)}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trial Users</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats?.trialUsers}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Signups (This Month)</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <p className="text-xl font-semibold text-foreground">{stats?.newSignupsThisMonth}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <UserMinus className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Churned (This Month)</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <p className="text-xl font-semibold text-foreground">{stats?.churnedThisMonth}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <p className="text-xl font-semibold text-foreground">
                      {stats?.totalUsers ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100) : 0}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/super-admin/users")}>
                <Users className="h-5 w-5" />
                Manage Users
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/super-admin/revenue")}>
                <BarChart3 className="h-5 w-5" />
                Revenue Analytics
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <FileText className="h-5 w-5" />
                Generate Reports
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}