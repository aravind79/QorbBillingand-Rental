import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Loader2, Plus, Trash2, PlusCircle } from "lucide-react";
import { usePurchaseOrder, usePurchaseOrderItems, useCreatePurchaseOrder, useUpdatePurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useItems } from "@/hooks/useItems";
import { QuickAddItemDialog } from "@/components/purchase/QuickAddItemDialog";
import { format } from "date-fns";

const purchaseOrderSchema = z.object({
  po_number: z.string().min(1, "PO number is required"),
  supplier_id: z.string().optional(),
  po_date: z.string(),
  expected_date: z.string().optional(),
  status: z.string().default("draft"),
  notes: z.string().optional(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface LineItem {
  id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  amount: number;
}

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: purchaseOrder, isLoading: isLoadingPO } = usePurchaseOrder(id);
  const { data: existingItems } = usePurchaseOrderItems(id);
  const { data: suppliers } = useSuppliers();
  const { data: items } = useItems();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder();

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [pendingLineItemId, setPendingLineItemId] = useState<string | null>(null);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      po_number: `PO-${Date.now()}`,
      supplier_id: "",
      po_date: format(new Date(), "yyyy-MM-dd"),
      expected_date: "",
      status: "draft",
      notes: "",
    },
  });

  useEffect(() => {
    if (purchaseOrder) {
      form.reset({
        po_number: purchaseOrder.po_number,
        supplier_id: purchaseOrder.supplier_id || "",
        po_date: purchaseOrder.po_date,
        expected_date: purchaseOrder.expected_date || "",
        status: purchaseOrder.status || "draft",
        notes: purchaseOrder.notes || "",
      });
    }
  }, [purchaseOrder, form]);

  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      setLineItems(
        existingItems.map((item) => ({
          id: item.id,
          item_id: item.item_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 18,
          discount_percent: item.discount_percent || 0,
          amount: item.amount,
        }))
      );
    }
  }, [existingItems]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        item_id: null,
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 18,
        discount_percent: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    // Handle "create_new" special value
    if (field === "item_id" && value === "create_new") {
      setPendingLineItemId(id);
      setShowQuickAdd(true);
      return;
    }

    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // If item selected, populate description and price
          if (field === "item_id" && value) {
            const selectedItem = items?.find((i) => i.id === value);
            if (selectedItem) {
              updated.description = selectedItem.name;
              updated.unit_price = selectedItem.purchase_price || selectedItem.sale_price;
              updated.tax_rate = selectedItem.tax_rate || 18;
            }
          }
          
          // Calculate amount
          const baseAmount = updated.quantity * updated.unit_price;
          const discountAmount = baseAmount * (updated.discount_percent / 100);
          const taxableAmount = baseAmount - discountAmount;
          const taxAmount = taxableAmount * (updated.tax_rate / 100);
          updated.amount = taxableAmount + taxAmount;
          
          return updated;
        }
        return item;
      })
    );
  };

  const handleItemCreated = (itemId: string, item: { name: string; purchase_price: number; tax_rate: number }) => {
    if (pendingLineItemId) {
      setLineItems(
        lineItems.map((lineItem) => {
          if (lineItem.id === pendingLineItemId) {
            const baseAmount = lineItem.quantity * item.purchase_price;
            const taxableAmount = baseAmount;
            const taxAmt = taxableAmount * (item.tax_rate / 100);
            return {
              ...lineItem,
              item_id: itemId,
              description: item.name,
              unit_price: item.purchase_price,
              tax_rate: item.tax_rate,
              amount: taxableAmount + taxAmt,
            };
          }
          return lineItem;
        })
      );
      setPendingLineItemId(null);
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unit_price;
      const discountAmount = baseAmount * (item.discount_percent / 100);
      return sum + (baseAmount - discountAmount);
    }, 0);

    const taxAmount = lineItems.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unit_price;
      const discountAmount = baseAmount * (item.discount_percent / 100);
      const taxableAmount = baseAmount - discountAmount;
      return sum + taxableAmount * (item.tax_rate / 100);
    }, 0);

    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    try {
      const purchaseOrderData = {
        po_number: values.po_number,
        po_date: values.po_date,
        supplier_id: values.supplier_id || null,
        expected_date: values.expected_date || null,
        status: values.status,
        notes: values.notes || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        balance_due: total,
        paid_amount: 0,
      };

      const itemsData = lineItems.map(({ id, ...item }) => ({
        ...item,
        received_quantity: 0,
      }));

      if (isEditing) {
        await updatePurchaseOrder.mutateAsync({
          id,
          purchaseOrder: purchaseOrderData,
          items: itemsData,
        });
      } else {
        await createPurchaseOrder.mutateAsync({
          purchaseOrder: purchaseOrderData,
          items: itemsData,
        });
      }
      navigate("/purchase-orders");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSubmitting = createPurchaseOrder.isPending || updatePurchaseOrder.isPending;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isEditing && isLoadingPO) {
    return (
      <AppLayout title={isEditing ? "Edit Purchase Order" : "New Purchase Order"}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditing ? "Edit Purchase Order" : "New Purchase Order"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Purchase Order" : "New Purchase Order"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update purchase order details" : "Create a new purchase order"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="po_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PO Number *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplier_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers?.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="po_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PO Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expected_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="ordered">Ordered</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                      <TableHead className="w-[80px]">Tax %</TableHead>
                      <TableHead className="w-[80px]">Disc %</TableHead>
                      <TableHead className="w-[100px] text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No items added. Click "Add Item" to add line items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.item_id || ""}
                              onValueChange={(value) => updateLineItem(item.id, "item_id", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="create_new">
                                  <span className="flex items-center gap-2 text-primary">
                                    <PlusCircle className="h-4 w-4" />
                                    Create New Item
                                  </span>
                                </SelectItem>
                                {items?.map((i) => (
                                  <SelectItem key={i.id} value={i.id}>
                                    {i.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                              placeholder="Description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.tax_rate}
                              onChange={(e) => updateLineItem(item.id, "tax_rate", parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.discount_percent}
                              onChange={(e) => updateLineItem(item.id, "discount_percent", parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/purchase-orders")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update Order" : "Save Order"}
              </Button>
            </div>
          </form>
        </Form>

        <QuickAddItemDialog
          open={showQuickAdd}
          onClose={() => {
            setShowQuickAdd(false);
            setPendingLineItemId(null);
          }}
          onItemCreated={handleItemCreated}
        />
      </div>
    </AppLayout>
  );
}
