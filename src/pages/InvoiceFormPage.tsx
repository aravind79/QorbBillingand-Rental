import { useState, useEffect, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Save,
  Send,
  ScanBarcode,
  Loader2,
  UserPlus,
  Package,
  Percent,
  IndianRupee,
  Truck,
} from "lucide-react";
import { formatCurrency, calculateLineItemAmount, generateInvoiceNumber } from "@/lib/helpers";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InvoiceActionsDialog } from "@/components/invoice/InvoiceActionsDialog";
import { Invoice } from "@/hooks/useInvoices";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";

interface LineItem {
  id: string;
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  amount: number;
  unit: string;
}

interface ItemFromDB {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sale_price: number;
  tax_rate: number | null;
  unit: string;
}

interface CustomerFromDB {
  id: string;
  name: string;
  gstin: string | null;
  billing_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
}

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const { config: industryConfig } = useIndustryConfig();

  // Determine document type from route
  const isQuotation = location.pathname.includes("/quotations");
  const documentType = isQuotation ? "quotation" : "invoice";

  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [quotationValidityDate, setQuotationValidityDate] = useState<Date | undefined>(
    isQuotation ? addDays(new Date(), 15) : undefined
  );
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [gstEnabled, setGstEnabled] = useState(true);

  // Shipping & Invoice-level discount
  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<"percent" | "fixed">("percent");

  const [customers, setCustomers] = useState<CustomerFromDB[]>([]);
  const [items, setItems] = useState<ItemFromDB[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [loading, setLoading] = useState(true);

  // Quick add dialogs
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", city: "" });
  const [newProduct, setNewProduct] = useState({ name: "", sale_price: "", sku: "" });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  // Invoice actions dialog state
  const [showActionsDialog, setShowActionsDialog] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{
    business_name: string;
    gstin?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    email?: string | null;
  }>({ business_name: "" });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      item_id: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_rate: 18,
      amount: 0,
      unit: "PCS",
    },
  ]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      // Load customers
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name, gstin, billing_address, city, state, pincode, phone, email")
        .order("name");

      if (customersData) {
        setCustomers(customersData);
      }

      // Load items
      const { data: itemsData } = await supabase
        .from("items")
        .select("id, name, sku, barcode, sale_price, tax_rate, unit")
        .eq("is_active", true)
        .order("name");

      if (itemsData) {
        setItems(itemsData);
      }

      // Load business settings for invoice counter and GST
      const { data: settingsData } = await supabase
        .from("business_settings")
        .select("business_name, gstin, address, city, state, pincode, phone, email, invoice_prefix, invoice_counter, gst_enabled")
        .maybeSingle();

      if (settingsData) {
        setInvoicePrefix(settingsData.invoice_prefix || "INV");
        setInvoiceCounter(settingsData.invoice_counter || 1);
        setGstEnabled(settingsData.gst_enabled ?? true);
        setBusinessInfo({
          business_name: settingsData.business_name || "",
          gstin: settingsData.gstin,
          address: settingsData.address,
          city: settingsData.city,
          state: settingsData.state,
          pincode: settingsData.pincode,
          phone: settingsData.phone,
          email: settingsData.email,
        });

        if (!isEditing) {
          setInvoiceNumber(generateInvoiceNumber(settingsData.invoice_prefix || "INV", settingsData.invoice_counter || 1));
        }
      }

      // If editing, load invoice data
      if (id) {
        const { data: invoiceData, error: invoiceError } = await supabase
          .from("invoices")
          .select(`*, invoice_items(*)`)
          .eq("id", id)
          .single();

        if (invoiceError) throw invoiceError;

        if (invoiceData) {
          setCustomerId(invoiceData.customer_id || "");
          setInvoiceDate(new Date(invoiceData.invoice_date));
          setDueDate(invoiceData.due_date ? new Date(invoiceData.due_date) : undefined);
          setQuotationValidityDate(invoiceData.quotation_validity_date ? new Date(invoiceData.quotation_validity_date) : undefined);
          setNotes(invoiceData.notes || "");
          setTerms(invoiceData.terms || "");
          setInvoiceNumber(invoiceData.invoice_number);
          setShippingCharges(invoiceData.shipping_charges || 0);
          setInvoiceDiscount(invoiceData.invoice_discount || 0);
          setInvoiceDiscountType((invoiceData.invoice_discount_type as "percent" | "fixed") || "percent");

          if (invoiceData.invoice_items && invoiceData.invoice_items.length > 0) {
            setLineItems(
              invoiceData.invoice_items.map((item: any) => ({
                id: item.id,
                item_id: item.item_id || "",
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent || 0,
                tax_rate: item.tax_rate || 18,
                amount: item.amount,
                unit: item.unit || "PCS",
              }))
            );
          }
        }
      } else {
        // Set default terms from settings
        setTermsAndConditions("Goods once sold will not be taken back. Subject to local jurisdiction.");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Helper function to get quantity label based on unit
  const getQuantityLabel = (unit: string): string => {
    if (unit === 'HRS') return 'Hrs';
    if (unit === 'DAYS') return 'Days';
    return 'Qty';
  };


  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        item_id: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_rate: gstEnabled ? 18 : 0,
        amount: 0,
        unit: "PCS",
      },
    ]);
  };

  const removeLineItem = (lineId: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((item) => item.id !== lineId));
  };

  const updateLineItem = (lineId: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== lineId) return item;

        const updated = { ...item, [field]: value };

        if (field === "item_id" && value) {
          const catalogItem = items.find((i) => i.id === value);
          if (catalogItem) {
            updated.description = catalogItem.name;
            updated.unit_price = catalogItem.sale_price;
            updated.tax_rate = gstEnabled ? (catalogItem.tax_rate || 18) : 0;
            updated.unit = catalogItem.unit || "PCS";
          }
        }

        const calc = calculateLineItemAmount(
          updated.quantity,
          updated.unit_price,
          updated.discount_percent,
          gstEnabled ? updated.tax_rate : 0
        );
        // Show taxable amount (excluding tax)
        updated.amount = calc.subtotal - calc.discount;

        return updated;
      })
    );
  };

  const handleBarcodeScan = (barcode: string) => {
    const foundItem = items.find((item) => item.barcode === barcode || item.sku === barcode);

    if (foundItem) {
      const emptyLineIndex = lineItems.findIndex((li) => !li.item_id);

      if (emptyLineIndex >= 0) {
        updateLineItem(lineItems[emptyLineIndex].id, "item_id", foundItem.id);
      } else {
        const newLineId = Date.now().toString();
        const taxRate = gstEnabled ? (foundItem.tax_rate || 18) : 0;
        const calc = calculateLineItemAmount(1, foundItem.sale_price, 0, taxRate);
        setLineItems([
          ...lineItems,
          {
            id: newLineId,
            item_id: foundItem.id,
            description: foundItem.name,
            quantity: 1,
            unit_price: foundItem.sale_price,
            discount_percent: 0,
            tax_rate: taxRate,
            amount: calc.subtotal, // Tax exclusive
            unit: foundItem.unit || "PCS",
          },
        ]);
      }
      toast.success(`Added: ${foundItem.name}`);
    } else {
      toast.error(`Item not found for barcode: ${barcode}`);
    }
  };

  // Quick add customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name) {
      toast.error("Customer name is required");
      return;
    }
    setAddingCustomer(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          user_id: user?.id,
          name: newCustomer.name,
          phone: newCustomer.phone || null,
          email: newCustomer.email || null,
          city: newCustomer.city || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomers([...customers, data]);
      setCustomerId(data.id);
      setShowAddCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "", city: "" });
      toast.success("Customer added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add customer");
    } finally {
      setAddingCustomer(false);
    }
  };

  // Quick add product
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sale_price) {
      toast.error("Name and price are required");
      return;
    }
    setAddingProduct(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          user_id: user?.id,
          name: newProduct.name,
          sale_price: parseFloat(newProduct.sale_price),
          sku: newProduct.sku || null,
          tax_rate: gstEnabled ? 18 : 0,
        })
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
      // Add to current line item
      const emptyLine = lineItems.find((li) => !li.item_id);
      if (emptyLine) {
        updateLineItem(emptyLine.id, "item_id", data.id);
      }
      setShowAddProduct(false);
      setNewProduct({ name: "", sale_price: "", sku: "" });
      toast.success("Product added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setAddingProduct(false);
    }
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const totalDiscount = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    return sum + (itemSubtotal * item.discount_percent) / 100;
  }, 0);

  const totalTax = gstEnabled ? lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const afterDiscount = itemSubtotal - (itemSubtotal * item.discount_percent) / 100;
    return sum + (afterDiscount * item.tax_rate) / 100;
  }, 0) : 0;

  // Calculate invoice-level discount amount
  const invoiceDiscountAmount = useMemo(() => {
    const afterLineDiscounts = subtotal - totalDiscount;
    if (invoiceDiscountType === "percent") {
      return (afterLineDiscounts * invoiceDiscount) / 100;
    }
    return invoiceDiscount;
  }, [subtotal, totalDiscount, invoiceDiscount, invoiceDiscountType]);

  const grandTotal = subtotal - totalDiscount + totalTax + shippingCharges - invoiceDiscountAmount;

  const handleSave = async (asDraft: boolean) => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (lineItems.every((item) => !item.item_id)) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSaving(true);

    try {
      const invoicePayload = {
        user_id: user?.id,
        invoice_number: invoiceNumber,
        invoice_type: "tax_invoice",
        document_type: documentType,
        customer_id: customerId,
        invoice_date: format(invoiceDate, "yyyy-MM-dd"),
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        quotation_validity_date: isQuotation && quotationValidityDate ? format(quotationValidityDate, "yyyy-MM-dd") : null,
        status: asDraft ? "draft" : "sent",
        subtotal,
        discount_amount: totalDiscount + invoiceDiscountAmount,
        tax_amount: totalTax,
        shipping_charges: shippingCharges,
        invoice_discount: invoiceDiscount,
        invoice_discount_type: invoiceDiscountType,
        total_amount: grandTotal,
        notes: `${notes}${termsAndConditions ? `\n\nTerms & Conditions:\n${termsAndConditions}` : ""}`,
        terms: terms || null,
      };

      let invoiceId = id;

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            ...invoicePayload,
            balance_due: grandTotal - (await getCurrentPaidAmount(id!)),
          })
          .eq("id", id);

        if (updateError) throw updateError;

        await supabase.from("invoice_items").delete().eq("invoice_id", id);
      } else {
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            ...invoicePayload,
            paid_amount: 0,
            balance_due: grandTotal,
          })
          .select(`
            *,
            customer:customers(*)
          `)
          .single();

        if (invoiceError) throw invoiceError;
        invoiceId = invoice.id;

        await supabase
          .from("business_settings")
          .update({ invoice_counter: invoiceCounter + 1 })
          .eq("user_id", user?.id);

        // Set the created invoice for the actions dialog
        setCreatedInvoice(invoice as Invoice);
      }

      const validLineItems = lineItems.filter((li) => li.item_id);
      const invoiceItems = validLineItems.map((li) => ({
        invoice_id: invoiceId,
        item_id: li.item_id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        discount_percent: li.discount_percent,
        tax_rate: gstEnabled ? li.tax_rate : 0,
        amount: li.amount,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      if (isEditing) {
        toast.success(`${isQuotation ? "Quotation" : "Invoice"} ${invoiceNumber} updated successfully`);
        navigate(isQuotation ? "/quotations" : "/invoices");
      } else if (asDraft) {
        toast.success(`${isQuotation ? "Quotation" : "Invoice"} ${invoiceNumber} saved as draft`);
        navigate(isQuotation ? "/quotations" : "/invoices");
      } else {
        // Show actions dialog for new invoices/quotations
        setShowActionsDialog(true);
      }
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast.error(error.message || "Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentPaidAmount = async (invoiceId: string): Promise<number> => {
    const { data } = await supabase
      .from("invoices")
      .select("paid_amount")
      .eq("id", invoiceId)
      .single();
    return data?.paid_amount || 0;
  };

  const pageTitle = isQuotation
    ? (isEditing ? "Edit Quotation" : "Create Quotation")
    : (isEditing ? "Edit Invoice" : "Create Invoice");

  const pageSubtitle = isQuotation
    ? (isEditing ? `Editing ${invoiceNumber}` : "Generate a new quotation/estimate")
    : (isEditing ? `Editing ${invoiceNumber}` : "Generate a new tax invoice");

  if (loading) {
    return (
      <AppLayout title={pageTitle} subtitle={pageSubtitle}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={pageTitle} subtitle={pageSubtitle}>
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
                          No customers found.{" "}
                          <button onClick={() => setShowAddCustomer(true)} className="text-primary underline">
                            Create one
                          </button>
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {customer.phone || customer.gstin || customer.city}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCustomer && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Billing Address</Label>
                      <p className="text-sm mt-1">
                        {selectedCustomer.billing_address || "Not provided"}
                        <br />
                        {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact</Label>
                      <p className="text-sm mt-1">
                        {selectedCustomer.phone || selectedCustomer.email || "Not provided"}
                      </p>
                      {selectedCustomer.gstin && (
                        <p className="text-sm font-mono mt-1">GSTIN: {selectedCustomer.gstin}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">{isQuotation ? "Quotation Items" : "Invoice Items"}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
                  <ScanBarcode className="mr-2 h-4 w-4" />
                  Scan
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddProduct(true)}>
                  <Package className="mr-2 h-4 w-4" />
                  New Product
                </Button>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="min-w-[200px]">Item</TableHead>
                      <TableHead className="w-[100px] text-center">Qty</TableHead>
                      <TableHead className="w-[120px] text-right">Rate</TableHead>
                      <TableHead className="w-[90px] text-center">Disc%</TableHead>
                      {gstEnabled && <TableHead className="w-[90px] text-center">Tax%</TableHead>}
                      <TableHead className="w-[120px] text-right">Amount</TableHead>
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
                            <SelectTrigger className="w-full text-left h-auto min-h-[40px] py-2">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[400px]">
                              {items.map((catalogItem) => (
                                <SelectItem key={catalogItem.id} value={catalogItem.id} className="py-2.5">
                                  <div className="grid grid-cols-[1fr,auto] gap-3 w-full items-center">
                                    <span className="truncate font-medium">{catalogItem.name}</span>
                                    <div className="flex gap-1.5 text-muted-foreground whitespace-nowrap text-xs">
                                      <span>({catalogItem.unit})</span>
                                      <span>{formatCurrency(catalogItem.sale_price)}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            {item.item_id && (
                              <span className="text-xs text-muted-foreground">
                                {getQuantityLabel(item.unit)}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                                }
                                className="text-center min-w-[80px]"
                                placeholder={item.item_id ? getQuantityLabel(item.unit) : "Qty"}
                              />
                              {item.unit && ['hrs', 'hr', 'hour', 'hours', 'days', 'day', 'months', 'month'].includes(item.unit.toLowerCase()) && (
                                <div className="flex flex-col gap-0.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-5 w-5 p-0"
                                    onClick={() => updateLineItem(item.id, "quantity", item.quantity + 1)}
                                  >
                                    <span className="text-xs">+</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-5 w-5 p-0"
                                    onClick={() => updateLineItem(item.id, "quantity", Math.max(0.01, item.quantity - 1))}
                                  >
                                    <span className="text-xs">−</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)
                            }
                            className="text-right min-w-[100px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent}
                            onChange={(e) =>
                              updateLineItem(item.id, "discount_percent", parseFloat(e.target.value) || 0)
                            }
                            className="text-center min-w-[70px]"
                          />
                        </TableCell>
                        {gstEnabled && (
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.tax_rate}
                              onChange={(e) =>
                                updateLineItem(item.id, "tax_rate", parseFloat(e.target.value) || 0)
                              }
                              className="text-center min-w-[70px]"
                            />
                          </TableCell>
                        )}
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
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes for this invoice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="terms">Payment Terms</Label>
                <Input
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g., Net 30, Due on Receipt"
                />
              </div>
              <div>
                <Label htmlFor="termsAndConditions">Terms & Conditions (Printed on Invoice)</Label>
                <Textarea
                  id="termsAndConditions"
                  placeholder="Enter terms and conditions that will appear on the invoice..."
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Invoice/Quotation Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">{isQuotation ? "Quotation Details" : "Invoice Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">{isQuotation ? "Quotation Number" : "Invoice Number"}</Label>
                <p className="text-lg font-semibold font-mono">{invoiceNumber}</p>
              </div>

              <div>
                <Label>{isQuotation ? "Quotation Date" : "Invoice Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {isQuotation ? (
                <div>
                  <Label>Valid Until</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !quotationValidityDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {quotationValidityDate ? format(quotationValidityDate, "PPP") : "Pick validity date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={quotationValidityDate}
                        onSelect={setQuotationValidityDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="font-medium">Apply GST</p>
                  <p className="text-sm text-muted-foreground">Include tax in {isQuotation ? "quotation" : "invoice"}</p>
                </div>
                <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Discount */}
          {(industryConfig.showShippingCharges || !isQuotation) && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">Additional Charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {industryConfig.showShippingCharges && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Charges
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={shippingCharges || ""}
                      onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label className="flex items-center gap-2">
                    {invoiceDiscountType === "percent" ? <Percent className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
                    {isQuotation ? "Quotation" : "Invoice"} Discount
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      type="number"
                      min="0"
                      value={invoiceDiscount || ""}
                      onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1"
                    />
                    <Select value={invoiceDiscountType} onValueChange={(v: "percent" | "fixed") => setInvoiceDiscountType(v)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="fixed">₹</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Line Discounts</span>
                  <span className="text-destructive">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              {gstEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>{formatCurrency(totalTax)}</span>
                </div>
              )}
              {shippingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>+{formatCurrency(shippingCharges)}</span>
                </div>
              )}
              {invoiceDiscountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isQuotation ? "Quotation" : "Invoice"} Discount
                    {invoiceDiscountType === "percent" && ` (${invoiceDiscount}%)`}
                  </span>
                  <span className="text-destructive">-{formatCurrency(invoiceDiscountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isEditing
                ? `Update ${isQuotation ? "Quotation" : "Invoice"}`
                : `Create & Send`}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(isQuotation ? "/quotations" : "/invoices")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Enter customer name"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                placeholder="City"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={addingCustomer}>
              {addingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Enter product name"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sale Price (₹) *</Label>
                <Input
                  type="number"
                  value={newProduct.sale_price}
                  onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value })}
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="SKU-001"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={addingProduct}>
              {addingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Actions Dialog */}
      <InvoiceActionsDialog
        open={showActionsDialog}
        onClose={() => {
          setShowActionsDialog(false);
          navigate("/invoices");
        }}
        invoice={createdInvoice}
        items={lineItems.filter(li => li.item_id).map(li => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          tax_rate: li.tax_rate,
          discount_percent: li.discount_percent,
          amount: li.amount,
          unit: li.unit,
        }))}
        business={businessInfo}
        gstEnabled={gstEnabled}
      />
    </AppLayout>
  );
}
