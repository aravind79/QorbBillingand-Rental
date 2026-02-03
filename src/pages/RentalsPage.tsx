import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Package,
  Clock,
  AlertTriangle,
  DollarSign,
  RotateCcw,
  Bell,
  MessageCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRentals, useDeleteRental, useRentalStats, RentalInvoice } from "@/hooks/useRentals";
import { useSendRentalReminder } from "@/hooks/useRentalReminders";

const statusTabs = [
  { value: "all", label: "All" },
  { value: "booked", label: "Booked" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
  { value: "cancelled", label: "Cancelled" },
];

type RentalStatus = "booked" | "active" | "overdue" | "returned" | "cancelled";

const rentalStatusConfig: Record<RentalStatus, { label: string; className: string }> = {
  booked: {
    label: "Booked",
    className: "bg-info/10 text-info border-info/20",
  },
  active: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  returned: {
    label: "Returned",
    className: "bg-secondary text-secondary-foreground",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

function RentalStatusBadge({ status }: { status: string }) {
  const config = rentalStatusConfig[(status as RentalStatus) || "booked"];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function RentalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<RentalInvoice | null>(null);
  const navigate = useNavigate();

  const { data: rentals = [], isLoading } = useRentals();
  const { data: stats } = useRentalStats();
  const deleteRental = useDeleteRental();
  const sendReminder = useSendRentalReminder();

  const handleSendReminder = (rental: RentalInvoice) => {
    if (!rental.customer?.email) {
      // Use WhatsApp if no email
      const phone = rental.customer?.phone?.replace(/\D/g, "") || "";
      if (phone) {
        const isOverdue = rental.rental_status === "overdue";
        const message = encodeURIComponent(
          `*${isOverdue ? "⚠️ Overdue" : "📅"} Return Reminder*\n\n` +
          `Rental: ${rental.rental_number}\n` +
          `Return Date: ${rental.expected_return_date || rental.rental_end_date}\n` +
          `${isOverdue ? "Please return the items immediately to avoid additional late fees." : "Please return the items today."}`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        toast.success("WhatsApp opened for reminder");
      } else {
        toast.error("No email or phone available for this customer");
      }
      return;
    }
    sendReminder.mutate({ rentalId: rental.id, type: "manual" });
  };

  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch =
      rental.rental_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || rental.rental_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (rentalToDelete) {
      await deleteRental.mutateAsync(rentalToDelete.id);
      setDeleteDialogOpen(false);
      setRentalToDelete(null);
    }
  };

  const columns = [
    {
      key: "rental_number",
      header: "Rental #",
      cell: (rental: RentalInvoice) => (
        <div>
          <p className="font-medium text-foreground">{rental.rental_number}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(rental.rental_start_date)}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (rental: RentalInvoice) => (
        <div>
          <p className="font-medium">{rental.customer?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">
            {rental.customer?.phone || rental.customer?.email}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Rental Period",
      cell: (rental: RentalInvoice) => (
        <div>
          <p className="text-sm">
            {formatDate(rental.rental_start_date)} - {formatDate(rental.rental_end_date)}
          </p>
          {rental.expected_return_date && (
            <p className="text-xs text-muted-foreground">
              Return: {formatDate(rental.expected_return_date)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (rental: RentalInvoice) => (
        <div>
          <p className="font-medium">{formatCurrency(rental.total_amount || 0)}</p>
          {(rental.security_deposit || 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              Deposit: {formatCurrency(rental.security_deposit || 0)}
            </p>
          )}
        </div>
      ),
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      cell: (rental: RentalInvoice) => (
        <RentalStatusBadge status={rental.rental_status || "booked"} />
      ),
      className: "text-center",
    },
    {
      key: "actions",
      header: "",
      cell: (rental: RentalInvoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/rentals/${rental.id}`);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {rental.rental_status === "booked" && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/rentals/${rental.id}/edit`);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Booking
              </DropdownMenuItem>
            )}
            {(rental.rental_status === "active" || rental.rental_status === "overdue") && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/rentals/${rental.id}/return`);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Process Return
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendReminder(rental);
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Reminder
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setRentalToDelete(rental);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  const getStatusCount = (status: string) => {
    if (status === "all") return rentals.length;
    return rentals.filter((r) => r.rental_status === status).length;
  };

  if (isLoading) {
    return (
      <AppLayout title="Rentals" subtitle="Manage rental bookings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Rentals" subtitle="Manage rental bookings and returns">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalRentals || 0}</p>
                <p className="text-xs text-muted-foreground">Total Rentals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
                <p className="text-xs text-muted-foreground">Active Rentals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.overdue || 0}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <DollarSign className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.depositsHeld || 0)}</p>
                <p className="text-xs text-muted-foreground">Deposits Held</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList className="bg-secondary/50 h-auto p-1 flex-wrap">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-4"
            >
              {tab.label}
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-secondary">
                {getStatusCount(tab.value)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by rental number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link to="/rentals/new">
            <Plus className="mr-2 h-4 w-4" />
            New Rental
          </Link>
        </Button>
      </div>

      {/* Rentals Table */}
      <DataTable
        columns={columns}
        data={filteredRentals}
        onRowClick={(rental) => navigate(`/rentals/${rental.id}`)}
        emptyState={
          <EmptyState
            icon={Calendar}
            title="No rentals found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first rental"
            }
            action={
              !searchQuery && statusFilter === "all"
                ? { label: "Create Rental", href: "/rentals/new" }
                : undefined
            }
          />
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rental</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete rental {rentalToDelete?.rental_number}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRental.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
