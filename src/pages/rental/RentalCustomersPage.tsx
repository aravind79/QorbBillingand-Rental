import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";
import { useRentalCustomers, useDeleteRentalCustomer, type RentalCustomer } from "@/hooks/useRentalCustomers";
import { formatCurrency, getInitials } from "@/lib/helpers";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RentalCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: customers = [], isLoading } = useRentalCustomers();
  const deleteCustomer = useDeleteRentalCustomer();

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);

    const matchesGroup = groupFilter === "all" || customer.customer_group === groupFilter;

    return matchesSearch && matchesGroup;
  });

  const groups = [...new Set(customers.map((c) => c.customer_group).filter(Boolean))];

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCustomer.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Customer",
      cell: (customer: RentalCustomer) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {customer.city}, {customer.state}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (customer: RentalCustomer) => (
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center gap-1.5 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "group",
      header: "Group",
      cell: (customer: RentalCustomer) => (
        <Badge variant="secondary" className="font-normal">
          {customer.customer_group || "General"}
        </Badge>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      cell: (customer: RentalCustomer) => (
        <div>
          <p
            className={
              (customer.outstanding_balance || 0) > 0
                ? "font-medium text-warning"
                : "font-medium text-success"
            }
          >
            {formatCurrency(customer.outstanding_balance || 0)}
          </p>
        </div>
      ),
      className: "text-right",
    },
    {
      key: "actions",
      header: "",
      cell: (customer: RentalCustomer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/rentals/customers/${customer.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(customer.id)}
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

  return (
    <AppLayout title="Rental Customers" subtitle="Manage your rental customers">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group} value={group!}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/rentals/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        isLoading={isLoading}
        onRowClick={(customer) => navigate(`/rentals/customers/${customer.id}/edit`)}
        emptyState={
          <EmptyState
            icon={Users}
            title="No customers found"
            description={
              searchQuery || groupFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first rental customer"
            }
            action={
              !searchQuery && groupFilter === "all"
                ? { label: "Add Customer", href: "/rentals/customers/new" }
                : undefined
            }
          />
        }
      />

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
        <p>
          Total Outstanding:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(
              customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0)
            )}
          </span>
        </p>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
