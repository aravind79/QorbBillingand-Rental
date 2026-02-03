import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Boxes,
  Plus,
  Search,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { useStockMovements, useCreateStockMovement } from "@/hooks/useStockMovements";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/helpers";

const adjustmentSchema = z.object({
  item_id: z.string().min(1, "Please select an item"),
  movement_type: z.enum(["purchase", "sale", "adjustment", "return"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reference_type: z.string().optional().or(z.literal("")),
  reference_id: z.string().optional().or(z.literal("")),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

const MOVEMENT_TYPES = [
  { value: "purchase", label: "Stock In (Purchase)", icon: ArrowUpRight, color: "text-success" },
  { value: "adjustment", label: "Adjustment (Add)", icon: ArrowUpRight, color: "text-info" },
  { value: "sale", label: "Stock Out (Sale)", icon: ArrowDownRight, color: "text-warning" },
  { value: "return", label: "Return/Damage", icon: ArrowDownRight, color: "text-destructive" },
];

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements();
  const createMovement = useCreateStockMovement();

  const productItems = items.filter((item) => item.item_type === "product");

  const filteredItems = productItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (stockFilter === "low") {
      return matchesSearch && (item.current_stock || 0) <= (item.reorder_level || 0) && (item.current_stock || 0) > 0;
    }
    if (stockFilter === "out") {
      return matchesSearch && (item.current_stock || 0) === 0;
    }
    if (stockFilter === "in") {
      return matchesSearch && (item.current_stock || 0) > (item.reorder_level || 0);
    }

    return matchesSearch;
  });

  const totalItems = productItems.length;
  const totalValue = productItems.reduce(
    (sum, item) => sum + (item.current_stock || 0) * (item.sale_price || 0),
    0
  );
  const lowStockCount = productItems.filter(
    (item) => (item.current_stock || 0) <= (item.reorder_level || 0) && (item.current_stock || 0) > 0
  ).length;
  const outOfStockCount = productItems.filter((item) => (item.current_stock || 0) === 0).length;

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      item_id: "",
      movement_type: "purchase",
      quantity: 1,
      reference_type: "",
      reference_id: "",
    },
  });

  const onSubmitAdjustment = async (data: AdjustmentFormData) => {
    try {
      await createMovement.mutateAsync({
        item_id: data.item_id,
        movement_type: data.movement_type,
        quantity: data.quantity,
        reference_type: data.reference_type || null,
        reference_id: data.reference_id || null,
      });
      setAdjustDialogOpen(false);
      form.reset();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const itemColumns = [
    {
      key: "item",
      header: "Item",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (item: any) => (
        <Badge variant="secondary" className="font-normal">
          {item.category || "Uncategorized"}
        </Badge>
      ),
    },
    {
      key: "stock",
      header: "Current Stock",
      cell: (item: any) => {
        const isLowStock = (item.current_stock || 0) <= (item.reorder_level || 0) && (item.current_stock || 0) > 0;
        const isOutOfStock = (item.current_stock || 0) === 0;

        return (
          <div className="flex items-center gap-2">
            <p
              className={
                isOutOfStock
                  ? "font-medium text-destructive"
                  : isLowStock
                  ? "font-medium text-warning"
                  : "font-medium"
              }
            >
              {formatNumber(item.current_stock || 0)} {item.unit}
            </p>
            {isLowStock && <AlertTriangle className="h-4 w-4 text-warning" />}
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
        );
      },
      className: "text-right",
    },
    {
      key: "reorder",
      header: "Reorder Level",
      cell: (item: any) => (
        <p className="text-muted-foreground">
          {item.reorder_level ? `${formatNumber(item.reorder_level)} ${item.unit}` : "—"}
        </p>
      ),
      className: "text-right",
    },
    {
      key: "value",
      header: "Stock Value",
      cell: (item: any) => (
        <p className="font-medium">
          {formatCurrency((item.current_stock || 0) * (item.sale_price || 0))}
        </p>
      ),
      className: "text-right",
    },
  ];

  const movementColumns = [
    {
      key: "date",
      header: "Date",
      cell: (m: any) => <span className="text-sm">{formatDateTime(m.created_at)}</span>,
    },
    {
      key: "item",
      header: "Item",
      cell: (m: any) => (
        <div>
          <p className="font-medium">{m.item?.name}</p>
          <p className="text-xs text-muted-foreground">{m.item?.sku}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (m: any) => {
        const type = MOVEMENT_TYPES.find((t) => t.value === m.movement_type);
        const Icon = type?.icon || ArrowUpRight;
        return (
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${type?.color}`} />
            <span className="capitalize">{m.movement_type}</span>
          </div>
        );
      },
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (m: any) => {
        const isOut = m.movement_type === "sale" || m.movement_type === "return";
        return (
          <span className={isOut ? "text-destructive" : "text-success"}>
            {isOut ? "-" : "+"}{formatNumber(m.quantity)} {m.item?.unit}
          </span>
        );
      },
      className: "text-right",
    },
  ];

  return (
    <AppLayout title="Inventory" subtitle="Track and manage stock levels">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Boxes className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <Package className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
              </div>
              <Package className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitAdjustment)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="item_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} ({item.current_stock} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="movement_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Movement Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOVEMENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Purchase Order, Adjustment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMovement.isPending}>
                      {createMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Adjustment
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Inventory Table */}
      <DataTable columns={itemColumns} data={filteredItems} isLoading={itemsLoading} />

      {/* Stock Movement History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Stock Movements</h2>
        <DataTable columns={movementColumns} data={movements.slice(0, 10)} isLoading={movementsLoading} />
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredItems.length} of {productItems.length} products
      </div>
    </AppLayout>
  );
}
