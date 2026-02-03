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
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, Save, ArrowLeft, ScanBarcode } from "lucide-react";
import { useItem, useCreateItem, useUpdateItem } from "@/hooks/useItems";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { GST_RATES, UNITS } from "@/types";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sku: z.string().max(50).optional().or(z.literal("")),
  barcode: z.string().max(50).optional().or(z.literal("")),
  hsn_code: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
  unit: z.string().default("PCS"),
  item_type: z.enum(["product", "service"]).default("product"),
  sale_price: z.coerce.number().min(0, "Sale price must be positive"),
  purchase_price: z.coerce.number().min(0).optional(),
  tax_rate: z.coerce.number().min(0).max(100).default(18),
  current_stock: z.coerce.number().min(0).optional(),
  reorder_level: z.coerce.number().min(0).optional(),
  is_active: z.boolean().default(true),
  // Healthcare fields
  batch_number: z.string().max(50).optional().or(z.literal("")),
  expiry_date: z.string().optional().or(z.literal("")),
  manufacturer: z.string().max(100).optional().or(z.literal("")),
});

type ItemFormData = z.infer<typeof itemSchema>;

const CATEGORIES = ["Electronics", "Accessories", "Services", "Software", "Hardware", "Other"];

export default function ItemFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [showScanner, setShowScanner] = useState(false);
  const { config } = useIndustryConfig();

  const { data: item, isLoading: itemLoading } = useItem(id);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  // Check if healthcare features should be shown
  const showBatchTracking = config.industry === "healthcare";

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      hsn_code: "",
      description: "",
      category: "",
      unit: "PCS",
      item_type: "product",
      sale_price: 0,
      purchase_price: 0,
      tax_rate: 18,
      current_stock: 0,
      reorder_level: 0,
      is_active: true,
      batch_number: "",
      expiry_date: "",
      manufacturer: "",
    },
  });

  const itemType = form.watch("item_type");

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        sku: item.sku || "",
        barcode: item.barcode || "",
        hsn_code: item.hsn_code || "",
        description: item.description || "",
        category: item.category || "",
        unit: item.unit || "PCS",
        item_type: (item.item_type as "product" | "service") || "product",
        sale_price: item.sale_price || 0,
        purchase_price: item.purchase_price || 0,
        tax_rate: item.tax_rate || 18,
        current_stock: item.current_stock || 0,
        reorder_level: item.reorder_level || 0,
        is_active: item.is_active ?? true,
        batch_number: (item as any).batch_number || "",
        expiry_date: (item as any).expiry_date || "",
        manufacturer: (item as any).manufacturer || "",
      });
    }
  }, [item, form]);

  const onSubmit = async (data: ItemFormData) => {
    try {
      // Convert empty strings to null for optional fields to avoid database errors
      const submitData = {
        ...data,
        name: data.name,
        sale_price: data.sale_price,
        expiry_date: data.expiry_date?.trim() || null,
        batch_number: data.batch_number?.trim() || null,
        manufacturer: data.manufacturer?.trim() || null,
        sku: data.sku?.trim() || null,
        barcode: data.barcode?.trim() || null,
        hsn_code: data.hsn_code?.trim() || null,
        description: data.description?.trim() || null,
        category: data.category?.trim() || null,
      };

      if (isEditing && id) {
        await updateItem.mutateAsync({ id, ...submitData });
      } else {
        await createItem.mutateAsync(submitData);
      }
      navigate("/items");
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    form.setValue("barcode", barcode);
    setShowScanner(false);
  };

  if (itemLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <AppLayout
      title={isEditing ? "Edit Item" : "New Item"}
      subtitle={isEditing ? `Update ${item?.name}` : "Add a new product or service"}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="item_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="WM-001" className="font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="8901234567890" className="font-mono" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowScanner(true)}
                          >
                            <ScanBarcode className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hsn_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HSN/SAC Code</FormLabel>
                      <FormControl>
                        <Input placeholder="8471" className="font-mono" {...field} />
                      </FormControl>
                      <FormDescription>
                        {itemType === "service" ? "SAC code for services" : "HSN code for products"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Item description" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
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
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                        <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing & Tax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (₹) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>Cost price for margin calculation</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Rate (%)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select GST rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GST_RATES.map((rate) => (
                            <SelectItem key={rate} value={String(rate)}>
                              {rate}%
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
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>This item is available for sale</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Inventory (only for products) */}
            {itemType === "product" && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="current_stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="0" {...field} />
                          </FormControl>
                          <FormDescription>Available quantity in inventory</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reorder_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reorder Level</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" placeholder="0" {...field} />
                          </FormControl>
                          <FormDescription>Alert when stock falls below this level</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Healthcare Batch Tracking (only for healthcare industry) */}
            {showBatchTracking && itemType === "product" && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Batch & Expiry Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="batch_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Number</FormLabel>
                          <FormControl>
                            <Input placeholder="BATCH001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input placeholder="Manufacturer name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/items")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </AppLayout>
  );
}
