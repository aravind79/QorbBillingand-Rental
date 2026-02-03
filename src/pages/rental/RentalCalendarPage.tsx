import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Package } from "lucide-react";
import { useRentals, type RentalInvoice } from "@/hooks/useRentals";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface RentalWithItems {
  id: string;
  rental_number: string;
  customer_id: string | null;
  rental_start_date: string;
  rental_end_date: string;
  rental_status: string | null;
  security_deposit: number | null;
  total_amount: number | null;
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
  } | null;
  rental_items?: {
    id: string;
    item_id: string | null;
    quantity: number | null;
    item?: {
      id: string;
      name: string;
    } | null;
  }[];
}

export default function RentalCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRental, setSelectedRental] = useState<RentalWithItems | null>(null);
  const [filterItem, setFilterItem] = useState<string>("all");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: rentals = [], isLoading } = useRentals();

  // Fetch all rentals with their items
  const { data: rentalsWithItems = [] } = useQuery({
    queryKey: ["rentals-with-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_invoices")
        .select(`
          *,
          customer:rental_customers(id, name, phone, email, city, state),
          rental_items(*, item:items(id, name))
        `)
        .order("rental_start_date", { ascending: true });

      if (error) throw error;
      return data as RentalWithItems[];
    },
    enabled: !!user,
  });

  // Get unique items for filter
  const uniqueItems = useMemo(() => {
    const itemMap = new Map<string, string>();
    rentalsWithItems.forEach((rental) => {
      rental.rental_items?.forEach((ri) => {
        if (ri.item) {
          itemMap.set(ri.item.id, ri.item.name);
        }
      });
    });
    return Array.from(itemMap.entries()).map(([id, name]) => ({ id, name }));
  }, [rentalsWithItems]);

  // Filter rentals by item
  const filteredRentals = useMemo(() => {
    if (filterItem === "all") return rentalsWithItems;
    return rentalsWithItems.filter((rental) =>
      rental.rental_items?.some((ri) => ri.item_id === filterItem)
    );
  }, [rentalsWithItems, filterItem]);

  // Get days in current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get rentals for a specific date
  const getRentalsForDate = (date: Date) => {
    return filteredRentals.filter((rental) => {
      const start = new Date(rental.rental_start_date);
      const end = new Date(rental.rental_end_date);
      return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
    });
  };

  // Get bookings for selected date
  const selectedDateRentals = selectedDate ? getRentalsForDate(selectedDate) : [];

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "booked": return "bg-blue-500";
      case "overdue": return "bg-red-500";
      case "completed": return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  return (
    <AppLayout title="Rental Calendar" subtitle="View bookings and availability">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterItem} onValueChange={setFilterItem}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {uniqueItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border border-border/50 bg-muted/20 rounded" />
              ))}
              {daysInMonth.map((day) => {
                const dayRentals = getRentalsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`h-24 border rounded p-1 cursor-pointer hover:bg-accent/50 transition-colors ${
                      isToday ? "border-primary" : "border-border/50"
                    } ${isSelected ? "bg-accent" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dayRentals.slice(0, 3).map((rental) => (
                        <div
                          key={rental.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${getStatusColor(rental.rental_status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRental(rental);
                          }}
                        >
                          {rental.customer?.name || "Walk-in"}
                        </div>
                      ))}
                      {dayRentals.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayRentals.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs text-muted-foreground">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-xs text-muted-foreground">Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Bookings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, "EEEE, MMM d, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">Click on a date to see bookings</p>
            ) : selectedDateRentals.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No bookings on this date</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/rentals/new")}>
                  Create Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateRentals.map((rental) => (
                  <div
                    key={rental.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRental(rental)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-mono text-sm font-medium">{rental.rental_number}</p>
                      <Badge variant={rental.rental_status === "active" ? "default" : rental.rental_status === "overdue" ? "destructive" : "secondary"}>
                        {rental.rental_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{rental.customer?.name || "Walk-in"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatDate(rental.rental_start_date)}</span>
                      <span>→</span>
                      <span>{formatDate(rental.rental_end_date)}</span>
                    </div>
                    <div className="mt-2">
                      {rental.rental_items?.slice(0, 2).map((ri) => (
                        <div key={ri.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{ri.item?.name} x{ri.quantity}</span>
                        </div>
                      ))}
                      {(rental.rental_items?.length || 0) > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{(rental.rental_items?.length || 0) - 2} more items
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rental Details Dialog */}
      <Dialog open={!!selectedRental} onOpenChange={() => setSelectedRental(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rental Details - {selectedRental?.rental_number}</DialogTitle>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedRental.customer?.name || "Walk-in"}</p>
                  {selectedRental.customer?.phone && (
                    <p className="text-sm text-muted-foreground">{selectedRental.customer.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedRental.rental_status === "active" ? "default" : selectedRental.rental_status === "overdue" ? "destructive" : "secondary"}>
                    {selectedRental.rental_status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(selectedRental.rental_start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(selectedRental.rental_end_date)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {selectedRental.rental_items?.map((ri) => (
                    <div key={ri.id} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                      <span>{ri.item?.name}</span>
                      <span className="text-muted-foreground">x{ri.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">{formatCurrency(selectedRental.total_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security Deposit</p>
                  <p className="font-semibold">{formatCurrency(selectedRental.security_deposit || 0)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/rentals/${selectedRental.id}/edit`)}>
                  Edit Rental
                </Button>
                <Button className="flex-1" onClick={() => setSelectedRental(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
