import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import {
  useRentalItem,
  useCreateRentalItem,
  useUpdateRentalItem,
} from "@/hooks/useRentalItems";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export default function RentalItemFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [showScanner, setShowScanner] = useState(false);

  const { data: existingItem, isLoading: loadingItem } = useRentalItem(id);
  const createItem = useCreateRentalItem();
  const updateItem = useUpdateRentalItem();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category: "",
    rental_rate_daily: "",
    rental_rate_weekly: "",
    rental_rate_monthly: "",
    security_deposit_amount: "",
    quantity_available_for_rent: "",
    rental_terms: "",
    is_active: true,
  });

  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name || "",
        sku: existingItem.sku || "",
        barcode: existingItem.barcode || "",
        description: existingItem.description || "",
        category: existingItem.category || "",
        rental_rate_daily: existingItem.rental_rate_daily?.toString() || "",
        rental_rate_weekly: existingItem.rental_rate_weekly?.toString() || "",
        rental_rate_monthly: existingItem.rental_rate_monthly?.toString() || "",
        security_deposit_amount: existingItem.security_deposit_amount?.toString() || "",
        quantity_available_for_rent: existingItem.quantity_available_for_rent?.toString() || "",
        rental_terms: existingItem.rental_terms || "",
        is_active: existingItem.is_active ?? true,
      });
    }
  }, [existingItem]);

  // Handle barcode scan - auto-fill SKU
  const handleBarcodeScan = (barcode: string) => {
    setFormData({ 
      ...formData, 
      barcode: barcode,
      sku: formData.sku || barcode // Auto-fill SKU if empty
    });
    setShowScanner(false);
    toast.success(`Barcode scanned: ${barcode}`);
  };

  // When barcode changes, auto-fill SKU if empty
  const handleBarcodeChange = (barcode: string) => {
    setFormData({ 
      ...formData, 
      barcode,
      sku: formData.sku || barcode 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Item name is required");
      return;
    }

    const itemData = {
      name: formData.name,
      sku: formData.sku || null,
      barcode: formData.barcode || null,
      description: formData.description || null,
      category: formData.category || null,
      rental_rate_daily: formData.rental_rate_daily ? Number(formData.rental_rate_daily) : null,
      rental_rate_weekly: formData.rental_rate_weekly ? Number(formData.rental_rate_weekly) : null,
      rental_rate_monthly: formData.rental_rate_monthly ? Number(formData.rental_rate_monthly) : null,
      security_deposit_amount: formData.security_deposit_amount
        ? Number(formData.security_deposit_amount)
        : null,
      quantity_available_for_rent: formData.quantity_available_for_rent
        ? Number(formData.quantity_available_for_rent)
        : 0,
      rental_terms: formData.rental_terms || null,
      is_active: formData.is_active,
    };

    try {
      if (isEditing) {
        await updateItem.mutateAsync({ id, ...itemData });
        toast.success("Item updated successfully");
      } else {
        await createItem.mutateAsync(itemData as any);
        toast.success("Item created successfully");
      }
      navigate("/rentals/items");
    } catch (error) {
      toast.error(isEditing ? "Failed to update item" : "Failed to create item");
    }
  };

  if (isEditing && loadingItem) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isEditing ? "Edit Rental Item" : "Add Rental Item"}
      subtitle={isEditing ? "Update item details" : "Add a new item for rent"}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/rentals/items")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            type="submit"
            disabled={createItem.isPending || updateItem.isPending}
          >
            {(createItem.isPending || updateItem.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Update Item" : "Save Item"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Barcode</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={formData.barcode}
                      onChange={(e) => handleBarcodeChange(e.target.value)}
                      placeholder="Scan or enter barcode"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowScanner(true)}
                    >
                      <ScanBarcode className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Barcode will auto-fill SKU if empty
                  </p>
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Auto-filled from barcode"
                    className="mt-1.5 font-mono"
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Equipment, Tools, etc."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-muted-foreground">Item available for rent</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rental Rates */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Rental Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Daily Rate (₹)</Label>
                <Input
                  type="number"
                  value={formData.rental_rate_daily}
                  onChange={(e) => setFormData({ ...formData, rental_rate_daily: e.target.value })}
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Weekly Rate (₹)</Label>
                <Input
                  type="number"
                  value={formData.rental_rate_weekly}
                  onChange={(e) => setFormData({ ...formData, rental_rate_weekly: e.target.value })}
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Monthly Rate (₹)</Label>
                <Input
                  type="number"
                  value={formData.rental_rate_monthly}
                  onChange={(e) => setFormData({ ...formData, rental_rate_monthly: e.target.value })}
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <Separator />
              <div>
                <Label>Security Deposit (₹)</Label>
                <Input
                  type="number"
                  value={formData.security_deposit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, security_deposit_amount: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Quantity Available</Label>
                <Input
                  type="number"
                  value={formData.quantity_available_for_rent}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity_available_for_rent: e.target.value })
                  }
                  placeholder="1"
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rental Terms */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Rental Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.rental_terms}
                onChange={(e) => setFormData({ ...formData, rental_terms: e.target.value })}
                placeholder="Enter specific rental terms for this item..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </AppLayout>
  );
}
