import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Package,
  AlertTriangle,
  IndianRupee,
  Plus,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useRentalStats, useRentals } from "@/hooks/useRentals";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function RentalDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useRentalStats();
  const { data: rentals = [], isLoading: rentalsLoading } = useRentals();

  const activeRentals = rentals.filter((r) => r.rental_status === "active");
  const overdueRentals = rentals.filter((r) => r.rental_status === "overdue");

  return (
    <AppLayout 
      title="Rental Dashboard" 
      subtitle="Overview of your rental business"
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsLoading ? (
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
            <StatCard
              title="Active Rentals"
              value={stats?.active || 0}
              icon={Calendar}
              variant="primary"
            />
            <StatCard
              title="Overdue Returns"
              value={stats?.overdue || 0}
              icon={AlertTriangle}
              variant={stats?.overdue ? "warning" : "default"}
            />
            <StatCard
              title="This Month Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={IndianRupee}
              variant="success"
            />
            <StatCard
              title="Deposits Held"
              value={formatCurrency(stats?.depositsHeld || 0)}
              icon={Package}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <Button asChild>
          <Link to="/rentals/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/rentals/returns">
            <CheckCircle className="mr-2 h-4 w-4" />
            Process Return
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Rentals */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Rentals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rentals/bookings">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {rentalsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activeRentals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active rentals
              </div>
            ) : (
              <div className="space-y-3">
                {activeRentals.slice(0, 5).map((rental) => (
                  <div
                    key={rental.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/rentals/bookings/${rental.id}/edit`)}
                  >
                    <div>
                      <p className="font-medium">{rental.rental_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {rental.customer?.name || "Walk-in Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Due: {formatDate(rental.rental_end_date)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(rental.total_amount || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Rentals */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rentalsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : overdueRentals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                No overdue rentals
              </div>
            ) : (
              <div className="space-y-3">
                {overdueRentals.slice(0, 5).map((rental) => (
                  <div
                    key={rental.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 cursor-pointer transition-colors"
                    onClick={() => navigate(`/rentals/bookings/${rental.id}/edit`)}
                  >
                    <div>
                      <p className="font-medium">{rental.rental_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {rental.customer?.name || "Walk-in Customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                      <p className="text-xs text-destructive mt-1">
                        Was due: {formatDate(rental.rental_end_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
