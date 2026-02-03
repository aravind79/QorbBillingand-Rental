import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRentalItems, useDeleteRentalItem, type RentalItem } from "@/hooks/useRentalItems";
import { formatCurrency } from "@/lib/helpers";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RentalItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useRentalItems();
  const deleteItem = useDeleteRentalItem();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];

  const handleDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Item Details",
      cell: (item: RentalItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.sku || "No SKU"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: RentalItem) => (
        <Badge variant="secondary" className="font-normal">
          {item.category || "Uncategorized"}
        </Badge>
      ),
    },
    {
      key: "rates",
      header: "Rental Rates",
      cell: (item: RentalItem) => (
        <div className="text-sm">
          {item.rental_rate_daily && (
            <p>{formatCurrency(item.rental_rate_daily)}/day</p>
          )}
          {item.rental_rate_weekly && (
            <p className="text-muted-foreground">{formatCurrency(item.rental_rate_weekly)}/week</p>
          )}
          {item.rental_rate_monthly && (
            <p className="text-muted-foreground">{formatCurrency(item.rental_rate_monthly)}/month</p>
          )}
        </div>
      ),
    },
    {
      key: "deposit",
      header: "Deposit",
      cell: (item: RentalItem) => (
        <span className="font-medium">
          {item.security_deposit_amount ? formatCurrency(item.security_deposit_amount) : "—"}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "available",
      header: "Available",
      cell: (item: RentalItem) => (
        <div>
          <p className={item.quantity_available_for_rent <= 0 ? "text-destructive font-medium" : "font-medium"}>
            {item.quantity_available_for_rent}
          </p>
          {item.quantity_available_for_rent <= 0 && (
            <p className="text-xs text-destructive">Out of stock</p>
          )}
        </div>
      ),
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      cell: (item: RentalItem) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      className: "text-center",
    },
    {
      key: "actions",
      header: "",
      cell: (item: RentalItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/rentals/items/${item.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(item.id)}
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
    <AppLayout title="Rental Items" subtitle="Manage items available for rent">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category!}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/rentals/items/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        isLoading={isLoading}
        onRowClick={(item) => navigate(`/rentals/items/${item.id}/edit`)}
        emptyState={
          <EmptyState
            icon={Package}
            title="No rental items found"
            description={
              searchQuery || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding items for rent"
            }
            action={
              !searchQuery && categoryFilter === "all"
                ? { label: "Add Item", href: "/rentals/items/new" }
                : undefined
            }
          />
        }
      />

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredItems.length} of {items.length} items
        </p>
        <p>
          Total available: {items.reduce((sum, i) => sum + (i.quantity_available_for_rent || 0), 0)} units
        </p>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
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
