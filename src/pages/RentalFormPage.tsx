import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarIcon, Plus, Trash2, Save, Loader2, UserPlus, Package } from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { format, differenceInDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate, Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StartRentalDialog } from "@/components/rental/StartRentalDialog";

interface RentalLineItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate_type: "daily" | "weekly" | "monthly";
  rate_amount: number;
  rental_days: number;
  amount: number;
}

interface RentalItem {
  id: string;
  name: string;
  rental_rate_daily: number | null;
  rental_rate_weekly: number | null;
  rental_rate_monthly: number | null;
  security_deposit_amount: number | null;
  quantity_available_for_rent: number | null;
  availability_type: string | null;
}

interface CustomerFromDB {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
}

export default function RentalFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();

  const [customerId, setCustomerId] = useState<string>("");
  const [rentalStartDate, setRentalStartDate] = useState<Date>(new Date());
  const [rentalEndDate, setRentalEndDate] = useState<Date | undefined>();
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [lateFeePerDay, setLateFeePerDay] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [rentalNumber, setRentalNumber] = useState("");
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [savedRentalData, setSavedRentalData] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<{ business_name: string; phone: string | null } | null>(null);
  const [customers, setCustomers] = useState<CustomerFromDB[]>([]);
  const [items, setItems] = useState<RentalItem[]>([]);
  const [rentalCounter, setRentalCounter] = useState(1);
  const [rentalPrefix, setRentalPrefix] = useState("RNT");
  const [loading, setLoading] = useState(true);
  const [gstEnabled, setGstEnabled] = useState(true);

  // Inline customer creation
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerState, setNewCustomerState] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  // Inline product creation
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDailyRate, setNewProductDailyRate] = useState<number>(0);
  const [newProductWeeklyRate, setNewProductWeeklyRate] = useState<number>(0);
  const [newProductMonthlyRate, setNewProductMonthlyRate] = useState<number>(0);
  const [newProductDeposit, setNewProductDeposit] = useState<number>(0);
  const [newProductQuantity, setNewProductQuantity] = useState<number>(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const [lineItems, setLineItems] = useState<RentalLineItem[]>([
    {
      id: "1",
      item_id: "",
      item_name: "",
      quantity: 1,
      rate_type: "daily",
      rate_amount: 0,
      rental_days: 1,
      amount: 0,
    },
  ]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      // Load rental customers (separate from billing customers)
      const { data: customersData } = await supabase
        .from("rental_customers")
        .select("id, name, phone, email, city, state")
        .order("name");

      if (customersData) {
        setCustomers(customersData);
      }

      // Load rental items (hybrid or rental_only)
      const { data: itemsData } = await supabase
        .from("items")
        .select("id, name, rental_rate_daily, rental_rate_weekly, rental_rate_monthly, security_deposit_amount, quantity_available_for_rent, availability_type")
        .eq("is_active", true)
        .in("availability_type", ["rental_only", "hybrid"])
        .order("name");

      if (itemsData) {
        setItems(itemsData);
      }

      // Load business settings
      const { data: settingsData } = await supabase
        .from("business_settings")
        .select("rental_prefix, rental_counter, business_name, phone")
        .maybeSingle();

      if (settingsData) {
        setRentalPrefix(settingsData.rental_prefix || "RNT");
        setRentalCounter(settingsData.rental_counter || 1);
        setBusinessSettings({
          business_name: settingsData.business_name,
          phone: settingsData.phone,
        });
        if (!isEditing) {
          setRentalNumber(`${settingsData.rental_prefix || "RNT"}-${String(settingsData.rental_counter || 1).padStart(5, "0")}`);
        }
      }

      // If editing, load rental data
      if (id) {
        const { data: rentalData, error } = await supabase
          .from("rental_invoices")
          .select(`*, rental_items(*, item:items(id, name))`)
          .eq("id", id)
          .single();

        if (error) throw error;

        if (rentalData) {
          setCustomerId(rentalData.customer_id || "");
          setRentalStartDate(new Date(rentalData.rental_start_date));
          setRentalEndDate(rentalData.rental_end_date ? new Date(rentalData.rental_end_date) : undefined);
          setSecurityDeposit(rentalData.security_deposit || 0);
          setLateFeePerDay(rentalData.late_fee_per_day || 0);
          setNotes(rentalData.notes || "");
          setRentalNumber(rentalData.rental_number);

          if (rentalData.rental_items && rentalData.rental_items.length > 0) {
            setLineItems(
              rentalData.rental_items.map((item: any) => ({
                id: item.id,
                item_id: item.item_id || "",
                item_name: item.item?.name || "",
                quantity: item.quantity || 1,
                rate_type: item.rate_type || "daily",
                rate_amount: item.rate_amount,
                rental_days: item.rental_days,
                amount: item.amount,
              }))
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const rentalDays = rentalEndDate
    ? Math.max(1, differenceInDays(startOfDay(rentalEndDate), startOfDay(rentalStartDate)) + 1)
    : 1;

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        item_id: "",
        item_name: "",
        quantity: 1,
        rate_type: "daily",
        rate_amount: 0,
        rental_days: rentalDays,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (lineId: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== lineId));
  };

  const updateLineItem = (lineId: string, field: keyof RentalLineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== lineId) return item;

        const updated = { ...item, [field]: value };

        if (field === "item_id" && value) {
          const catalogItem = items.find((i) => i.id === value);
          if (catalogItem) {
            updated.item_name = catalogItem.name;
            // Set rate based on type
            if (updated.rate_type === "daily") {
              updated.rate_amount = catalogItem.rental_rate_daily || 0;
            } else if (updated.rate_type === "weekly") {
              updated.rate_amount = catalogItem.rental_rate_weekly || 0;
            } else {
              updated.rate_amount = catalogItem.rental_rate_monthly || 0;
            }
          }
        }

        if (field === "rate_type" && item.item_id) {
          const catalogItem = items.find((i) => i.id === item.item_id);
          if (catalogItem) {
            if (value === "daily") {
              updated.rate_amount = catalogItem.rental_rate_daily || 0;
            } else if (value === "weekly") {
              updated.rate_amount = catalogItem.rental_rate_weekly || 0;
            } else {
              updated.rate_amount = catalogItem.rental_rate_monthly || 0;
            }
          }
        }

        // Calculate amount
        updated.rental_days = rentalDays;
        let multiplier = rentalDays;
        if (updated.rate_type === "weekly") {
          multiplier = Math.ceil(rentalDays / 7);
        } else if (updated.rate_type === "monthly") {
          multiplier = Math.ceil(rentalDays / 30);
        }
        updated.amount = updated.quantity * updated.rate_amount * multiplier;

        return updated;
      })
    );
  };

  // Recalculate amounts when dates change
  useEffect(() => {
    setLineItems((prev) =>
      prev.map((item) => {
        let multiplier = rentalDays;
        if (item.rate_type === "weekly") {
          multiplier = Math.ceil(rentalDays / 7);
        } else if (item.rate_type === "monthly") {
          multiplier = Math.ceil(rentalDays / 30);
        }
        return {
          ...item,
          rental_days: rentalDays,
          amount: item.quantity * item.rate_amount * multiplier,
        };
      })
    );
  }, [rentalDays]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = gstEnabled ? 18 : 0;
  const taxAmount = gstEnabled ? (subtotal * taxRate) / 100 : 0;
  const grandTotal = subtotal + taxAmount;

  // Handle inline customer creation
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setIsAddingCustomer(true);
    try {
      const { data, error } = await supabase
        .from("rental_customers")
        .insert({
          user_id: user?.id,
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
          email: newCustomerEmail.trim() || null,
          city: newCustomerCity.trim() || null,
          state: newCustomerState.trim() || null,
          outstanding_balance: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local list and select it
      setCustomers((prev) => [...prev, data]);
      setCustomerId(data.id);

      // Reset form
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setNewCustomerCity("");
      setNewCustomerState("");
      setShowAddCustomer(false);

      toast.success("Customer created successfully");
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Failed to create customer");
    } finally {
      setIsAddingCustomer(false);
    }
  };

  // Handle inline product creation
  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      toast.error("Product name is required");
      return;
    }

    setIsAddingProduct(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: user?.id,
          name: newProductName.trim(),
          sale_price: 0,
          rental_rate_daily: newProductDailyRate || null,
          rental_rate_weekly: newProductWeeklyRate || null,
          rental_rate_monthly: newProductMonthlyRate || null,
          security_deposit_amount: newProductDeposit || null,
          quantity_available_for_rent: newProductQuantity || 1,
          availability_type: "rental_only",
          is_active: true,
          item_type: "product",
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local items list
      setItems((prev) => [...prev, {
        id: data.id,
        name: data.name,
        rental_rate_daily: data.rental_rate_daily,
        rental_rate_weekly: data.rental_rate_weekly,
        rental_rate_monthly: data.rental_rate_monthly,
        security_deposit_amount: data.security_deposit_amount,
        quantity_available_for_rent: data.quantity_available_for_rent,
        availability_type: data.availability_type,
      }]);

      // Reset form
      setNewProductName("");
      setNewProductDailyRate(0);
      setNewProductWeeklyRate(0);
      setNewProductMonthlyRate(0);
      setNewProductDeposit(0);
      setNewProductQuantity(1);
      setShowAddProduct(false);

      toast.success("Product created successfully");
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleSave = async (status: "booked" | "active") => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!rentalEndDate) {
      toast.error("Please select an end date");
      return;
    }

    if (lineItems.every((item) => !item.item_id)) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSaving(true);

    try {
      const rentalPayload = {
        user_id: user?.id,
        rental_number: rentalNumber,
        customer_id: customerId,
        rental_start_date: format(rentalStartDate, "yyyy-MM-dd"),
        rental_end_date: format(rentalEndDate, "yyyy-MM-dd"),
        expected_return_date: format(rentalEndDate, "yyyy-MM-dd"),
        rental_status: status,
        security_deposit: securityDeposit,
        deposit_collected: status === "active",
        late_fee_per_day: lateFeePerDay,
        subtotal,
        tax_amount: taxAmount,
        total_amount: grandTotal,
        balance_due: grandTotal,
        notes: notes || null,
      };

      let rentalId = id;

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("rental_invoices")
          .update(rentalPayload)
          .eq("id", id);

        if (updateError) throw updateError;

        // Delete existing items
        await supabase.from("rental_items").delete().eq("rental_invoice_id", id);
      } else {
        const { data: rental, error: createError } = await supabase
          .from("rental_invoices")
          .insert(rentalPayload)
          .select()
          .single();

        if (createError) throw createError;
        rentalId = rental.id;

        // Update counter
        await supabase
          .from("business_settings")
          .update({ rental_counter: rentalCounter + 1 })
          .eq("user_id", user?.id);
      }

      // Create rental items
      const validItems = lineItems.filter((li) => li.item_id);
      const rentalItems = validItems.map((li) => ({
        rental_invoice_id: rentalId,
        item_id: li.item_id,
        quantity: li.quantity,
        rate_type: li.rate_type,
        rate_amount: li.rate_amount,
        rental_days: li.rental_days,
        amount: li.amount,
      }));

      const { error: itemsError } = await supabase.from("rental_items").insert(rentalItems);

      if (itemsError) throw itemsError;

      // If starting rental, show the dialog
      if (status === "active") {
        const customer = customers.find((c) => c.id === customerId);
        setSavedRentalData({
          id: rentalId,
          rental_number: rentalNumber,
          customer_name: customer?.name || "Customer",
          customer_phone: customer?.phone || undefined,
          rental_start_date: format(rentalStartDate, "yyyy-MM-dd"),
          rental_end_date: format(rentalEndDate, "yyyy-MM-dd"),
          total_amount: grandTotal,
          security_deposit: securityDeposit,
          items: validItems.map((li) => ({
            name: li.item_name,
            quantity: li.quantity,
            rate_amount: li.rate_amount,
            rental_days: li.rental_days,
          })),
          business_name: businessSettings?.business_name || "Business",
          business_phone: businessSettings?.phone || undefined,
        });
        setShowStartDialog(true);
        toast.success(`Rental ${rentalNumber} started`);
      } else {
        toast.success(
          isEditing
            ? `Rental ${rentalNumber} updated`
            : `Rental ${rentalNumber} saved as booking`
        );
        navigate("/rentals");
      }
    } catch (error: any) {
      console.error("Error saving rental:", error);
      toast.error(error.message || "Failed to save rental");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout
        title={isEditing ? "Edit Rental" : "Create Rental"}
        subtitle="Manage rental booking"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isEditing ? "Edit Rental" : "Create Rental"}
      subtitle={isEditing ? `Editing ${rentalNumber}` : "Book a new rental"}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Customer Details</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddCustomer(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Select Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search or select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No customers found.
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {customer.phone || customer.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCustomer && (
                  <div className="sm:col-span-2 p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.phone} • {selectedCustomer.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.city}, {selectedCustomer.state}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rental Items */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Rental Items</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddProduct(true)}>
                  <Package className="mr-2 h-4 w-4" />
                  New Product
                </Button>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No rental items available.</p>
                  <p className="text-sm mt-1">
                    Configure items with rental rates in the{" "}
                    <Link to="/items" className="text-primary underline">
                      Items page
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="min-w-[200px]">Item</TableHead>
                        <TableHead className="w-[70px] text-center">Qty</TableHead>
                        <TableHead className="w-[100px]">Rate Type</TableHead>
                        <TableHead className="w-[100px] text-right">Rate</TableHead>
                        <TableHead className="w-[100px] text-right">Amount</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.item_id}
                              onValueChange={(value) => updateLineItem(item.id, "item_id", value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((catalogItem) => (
                                  <SelectItem key={catalogItem.id} value={catalogItem.id}>
                                    {catalogItem.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)
                              }
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.rate_type}
                              onValueChange={(value) =>
                                updateLineItem(item.id, "rate_type", value as "daily" | "weekly" | "monthly")
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.rate_amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                              disabled={lineItems.length === 1}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="deposit">Security Deposit</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="0"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="lateFee">Late Fee (per day)</Label>
                  <Input
                    id="lateFee"
                    type="number"
                    min="0"
                    value={lateFeePerDay}
                    onChange={(e) => setLateFeePerDay(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Rental terms, special conditions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Rental Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Rental Number</Label>
                <p className="text-lg font-semibold font-mono">{rentalNumber}</p>
              </div>

              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !rentalStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rentalStartDate ? format(rentalStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rentalStartDate}
                      onSelect={(date) => date && setRentalStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !rentalEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rentalEndDate ? format(rentalEndDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rentalEndDate}
                      onSelect={setRentalEndDate}
                      disabled={(date) => date < rentalStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Rental Duration</p>
                <p className="text-lg font-semibold">{rentalDays} day{rentalDays > 1 ? "s" : ""}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18% GST)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
              {securityDeposit > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Security Deposit</span>
                  <span className="font-medium">{formatCurrency(securityDeposit)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => handleSave("active")}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isEditing ? "Update Rental" : "Start Rental"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSave("booked")}
              disabled={isSaving}
            >
              Save as Booking
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/rentals")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Start Rental Dialog */}
      {savedRentalData && (
        <StartRentalDialog
          open={showStartDialog}
          onClose={() => setShowStartDialog(false)}
          rental={savedRentalData}
          onComplete={() => navigate("/rentals")}
        />
      )}

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCity">City</Label>
                <Input
                  id="customerCity"
                  value={newCustomerCity}
                  onChange={(e) => setNewCustomerCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerState">State</Label>
                <Input
                  id="customerState"
                  value={newCustomerState}
                  onChange={(e) => setNewCustomerState(e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer} disabled={isAddingCustomer}>
              {isAddingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Rental Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Product name"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  min="0"
                  value={newProductDailyRate}
                  onChange={(e) => setNewProductDailyRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyRate">Weekly Rate</Label>
                <Input
                  id="weeklyRate"
                  type="number"
                  min="0"
                  value={newProductWeeklyRate}
                  onChange={(e) => setNewProductWeeklyRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRate">Monthly Rate</Label>
                <Input
                  id="monthlyRate"
                  type="number"
                  min="0"
                  value={newProductMonthlyRate}
                  onChange={(e) => setNewProductMonthlyRate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">Security Deposit</Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  value={newProductDeposit}
                  onChange={(e) => setNewProductDeposit(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Available Qty</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isAddingProduct}>
              {isAddingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
