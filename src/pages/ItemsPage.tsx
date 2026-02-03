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
import { useItems, useDeleteItem, type Item } from "@/hooks/useItems";
import { formatCurrency } from "@/lib/helpers";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useItems();
  const deleteItem = useDeleteItem();

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hsn_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesType = typeFilter === "all" || item.item_type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
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
      cell: (item: Item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.sku} • HSN: {item.hsn_code || "N/A"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: Item) => (
        <div>
          <Badge variant="secondary" className="font-normal">
            {item.category || "Uncategorized"}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{item.item_type}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (item: Item) => (
        <div>
          <p className="font-medium">{formatCurrency(item.sale_price || 0)}</p>
          <p className="text-xs text-muted-foreground">GST: {item.tax_rate}%</p>
        </div>
      ),
      className: "text-right",
    },
    {
      key: "stock",
      header: "Stock",
      cell: (item: Item) => {
        if (item.item_type === "service") {
          return <span className="text-muted-foreground">—</span>;
        }
        const isLowStock = (item.current_stock || 0) <= (item.reorder_level || 0);
        return (
          <div>
            <p className={isLowStock ? "text-destructive font-medium" : "font-medium"}>
              {item.current_stock} {item.unit}
            </p>
            {isLowStock && (
              <p className="text-xs text-destructive">Low stock</p>
            )}
          </div>
        );
      },
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      cell: (item: Item) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      className: "text-center",
    },
    {
      key: "actions",
      header: "",
      cell: (item: Item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/items/${item.id}/edit`)}>
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
    <AppLayout title="Items" subtitle="Manage your products and services">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items by name, SKU, or HSN code..."
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="service">Services</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/items/new">
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
        onRowClick={(item) => navigate(`/items/${item.id}/edit`)}
        emptyState={
          <EmptyState
            icon={Package}
            title="No items found"
            description={
              searchQuery || categoryFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product or service"
            }
            action={
              !searchQuery && categoryFilter === "all" && typeFilter === "all"
                ? { label: "Add Item", href: "/items/new" }
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
        <div className="flex gap-4">
          <span>{items.filter((i) => i.item_type === "product").length} Products</span>
          <span>{items.filter((i) => i.item_type === "service").length} Services</span>
        </div>
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
