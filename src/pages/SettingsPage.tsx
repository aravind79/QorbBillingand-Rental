import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  FileText,
  Bell,
  Shield,
  Upload,
  Save,
  Trash2,
  Loader2,
  Factory,
  Check,
  X,
  Printer
} from "lucide-react";
import { INDIAN_STATES } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useIndustry,
  useUpdateIndustry,
  INDUSTRY_CONFIGS,
  IndustryType
} from "@/hooks/useIndustryConfig";
import { PrintSettings } from "@/components/settings/PrintSettings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Industry settings
  const { data: currentIndustry, isLoading: isLoadingIndustry } = useIndustry();
  const updateIndustry = useUpdateIndustry();
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("general");
  const [isSavingIndustry, setIsSavingIndustry] = useState(false);

  useEffect(() => {
    if (currentIndustry) {
      setSelectedIndustry(currentIndustry);
    }
  }, [currentIndustry]);

  // Business settings state
  const [isSaving, setIsSaving] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    business_name: "",
    gstin: "",
    pan: "", // Assuming we want to store PAN even if not in original migration, or just keep in local state if UI needs it
    address: "",
    city: "",
    state: "29", // Default to Karnataka
    pincode: "",
    phone: "",
    email: "",
    website: "",
    primary_color: "#0d9488", // Default teal
  });

  // Load business settings
  useEffect(() => {
    async function loadBusinessSettings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("business_settings")
          .select("*")
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error loading settings:", error);
          return;
        }

        if (data) {
          setBusinessForm({
            business_name: data.business_name || "",
            gstin: data.gstin || "",
            pan: "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "29",
            pincode: data.pincode || "",
            phone: data.phone || "",
            email: data.email || "",
            website: "",
            primary_color: data.primary_color || "#0d9488",
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    loadBusinessSettings();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Upsert business settings
      // Get existing record ID first to ensure we update instead of erroring on duplicate
      const { data: existingSettings } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const payload: any = {
        user_id: user.id,
        business_name: businessForm.business_name,
        gstin: businessForm.gstin,
        // pan: businessForm.pan, // Column doesn't exist in DB yet
        address: businessForm.address,
        city: businessForm.city,
        state: businessForm.state,
        pincode: businessForm.pincode,
        phone: businessForm.phone,
        email: businessForm.email,
        primary_color: businessForm.primary_color,
        // website: businessForm.website, // Column doesn't exist in DB yet
        updated_at: new Date().toISOString(),
      };

      if (existingSettings?.id) {
        payload.id = existingSettings.id;
      }

      const { error } = await supabase
        .from("business_settings")
        .upsert(payload);

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIndustry = async () => {
    setIsSavingIndustry(true);
    try {
      await updateIndustry.mutateAsync(selectedIndustry);
      toast.success("Industry settings updated! Navigation will reflect the changes.");
    } catch (error: any) {
      toast.error(error.message || "Failed to update industry");
    } finally {
      setIsSavingIndustry(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    if (!user) return;

    setIsDeleting(true);
    try {
      // Delete user data from various tables (order matters due to foreign keys)
      // First get invoice IDs to delete invoice_items
      const { data: invoices } = await supabase.from("invoices").select("id").eq("user_id", user.id);
      const invoiceIds = invoices?.map(r => r.id) || [];
      if (invoiceIds.length > 0) {
        await supabase.from("invoice_items").delete().in("invoice_id", invoiceIds);
      }

      // Get rental invoice IDs to delete rental_items
      const { data: rentalInvoices } = await supabase.from("rental_invoices").select("id").eq("user_id", user.id);
      const rentalInvoiceIds = rentalInvoices?.map(r => r.id) || [];
      if (rentalInvoiceIds.length > 0) {
        await supabase.from("rental_items").delete().in("rental_invoice_id", rentalInvoiceIds);
      }

      await supabase.from("rental_invoices").delete().eq("user_id", user.id);
      await supabase.from("rental_customers").delete().eq("user_id", user.id);
      await supabase.from("payments").delete().eq("user_id", user.id);
      await supabase.from("invoices").delete().eq("user_id", user.id);
      await supabase.from("stock_movements").delete().eq("user_id", user.id);
      await supabase.from("items").delete().eq("user_id", user.id);
      await supabase.from("customers").delete().eq("user_id", user.id);
      await supabase.from("subscriptions").delete().eq("user_id", user.id);
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await supabase.from("onboarding_progress").delete().eq("user_id", user.id);
      await supabase.from("business_settings").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await supabase.from("user_roles").delete().eq("user_id", user.id);

      // Sign out the user
      await signOut();

      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout title="Settings" subtitle="Manage your business and application settings">
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="industry" className="gap-2">
            <Factory className="h-4 w-4" />
            Industry
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-2">
            <FileText className="h-4 w-4" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="print" className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  This information appears on your invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Business Name *</Label>
                    <Input
                      placeholder="Your Business Name"
                      name="business_name"
                      value={businessForm.business_name}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input
                      placeholder="22AAAAA0000A1Z5"
                      name="gstin"
                      value={businessForm.gstin}
                      onChange={handleInputChange}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input
                      placeholder="AAAAA0000A"
                      name="pan"
                      value={businessForm.pan} // Note: PAN might not be in the earlier schema, checking schema... it wasn't in the migration I saw, let's treat it as a custom field if needed or omit if not in DB
                      onChange={handleInputChange}
                      className="mt-1.5 font-mono"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Address</Label>
                    <Textarea
                      placeholder="Business address"
                      name="address"
                      value={businessForm.address}
                      onChange={handleInputChange}
                      className="mt-1.5 resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      name="city"
                      value={businessForm.city}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select
                      value={businessForm.state}
                      onValueChange={(val) => setBusinessForm(prev => ({ ...prev, state: val }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      placeholder="560001"
                      name="pincode"
                      value={businessForm.pincode}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      placeholder="+91 9876543210"
                      name="phone"
                      value={businessForm.phone}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="business@email.com"
                      name="email"
                      value={businessForm.email}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      name="website"
                      value={businessForm.website}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card className="shadow-card h-fit">
              <CardHeader>
                <CardTitle>Business Logo</CardTitle>
                <CardDescription>
                  Upload your logo for invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {businessForm.business_name ? businessForm.business_name.substring(0, 2).toUpperCase() : "BN"}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG up to 2MB
                    <br />
                    Recommended: 200x200px
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Industry Settings */}
        <TabsContent value="industry">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Industry Type</CardTitle>
                <CardDescription>
                  Select your industry to customize the app interface and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Select Your Industry</Label>
                  <Select
                    value={selectedIndustry}
                    onValueChange={(value) => setSelectedIndustry(value as IndustryType)}
                    disabled={isLoadingIndustry}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(INDUSTRY_CONFIGS).map((config) => (
                        <SelectItem key={config.industry} value={config.industry}>
                          <div className="flex flex-col">
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedIndustry && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {INDUSTRY_CONFIGS[selectedIndustry].description}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveIndustry}
                    disabled={isSavingIndustry || selectedIndustry === currentIndustry}
                  >
                    {isSavingIndustry ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Industry
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feature Preview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Feature Preview</CardTitle>
                <CardDescription>
                  Features enabled/disabled for {INDUSTRY_CONFIGS[selectedIndustry]?.label || "your industry"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: "showInventory", label: "Inventory Management", desc: "Track stock levels and movements" },
                    { key: "showStockTracking", label: "Stock Tracking", desc: "Monitor inventory in real-time" },
                    { key: "showHSNCodes", label: "HSN Codes", desc: "For goods classification" },
                    { key: "showSACCodes", label: "SAC Codes", desc: "For services classification" },
                    { key: "showBarcode", label: "Barcode Support", desc: "Scan and print barcodes" },
                    { key: "showCreditManagement", label: "Credit Management", desc: "Manage customer credit limits" },
                    { key: "showBulkPricing", label: "Bulk Pricing", desc: "Wholesale pricing tiers" },
                    { key: "showReorderLevel", label: "Reorder Alerts", desc: "Low stock notifications" },
                    { key: "showPurchasePrice", label: "Purchase Price", desc: "Track cost prices" },
                  ].map((feature) => {
                    const config = INDUSTRY_CONFIGS[selectedIndustry];
                    const isEnabled = config?.[feature.key as keyof typeof config] === true;
                    return (
                      <div
                        key={feature.key}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div>
                          <p className="font-medium text-sm">{feature.label}</p>
                          <p className="text-xs text-muted-foreground">{feature.desc}</p>
                        </div>
                        <Badge variant={isEnabled ? "default" : "secondary"} className="gap-1">
                          {isEnabled ? (
                            <>
                              <Check className="h-3 w-3" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              Hidden
                            </>
                          )}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Invoice Customization</CardTitle>
                <CardDescription>
                  Customize how your invoices look
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Invoice Prefix</Label>
                    <Input
                      placeholder="INV"
                      defaultValue="INV"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Starting Number</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      defaultValue="1"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Branding Color</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        type="color"
                        name="primary_color"
                        value={businessForm.primary_color}
                        onChange={handleInputChange}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        name="primary_color"
                        value={businessForm.primary_color}
                        onChange={handleInputChange}
                        placeholder="#000000"
                        className="uppercase font-mono"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This color will be used for invoice headers
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Invoice Settings
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <Label>Default Payment Terms</Label>
                  <Select defaultValue="net30">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Default Notes</Label>
                  <Textarea
                    placeholder="Thank you for your business!"
                    defaultValue="Thank you for your business! Payment is due within 30 days."
                    className="mt-1.5 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Default Terms & Conditions</Label>
                  <Textarea
                    placeholder="Terms and conditions..."
                    defaultValue="Goods once sold will not be taken back. Subject to Bangalore jurisdiction."
                    className="mt-1.5 resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>
                  Configure GST and tax preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Default Tax Rate</Label>
                  <Select defaultValue="18">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exempt)</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Financial Year Start</Label>
                  <Select defaultValue="4">
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable GST</p>
                      <p className="text-sm text-muted-foreground">
                        Include GST/Tax in invoices and rentals
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Composition Scheme</p>
                      <p className="text-sm text-muted-foreground">
                        Enable if registered under composition scheme
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show HSN/SAC Codes</p>
                      <p className="text-sm text-muted-foreground">
                        Display codes on invoices
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-calculate Tax</p>
                      <p className="text-sm text-muted-foreground">
                        Calculate CGST/SGST/IGST automatically
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Print Settings */}
        <TabsContent value="print">
          <PrintSettings />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="shadow-card max-w-2xl">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Invoice Paid</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a customer pays an invoice
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Overdue Invoices</p>
                    <p className="text-sm text-muted-foreground">
                      Remind about overdue invoices
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when items reach reorder level
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly business summary via email
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      defaultValue="John Doe"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      defaultValue="john@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      defaultValue="+91 9876543210"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input
                      defaultValue="Admin"
                      disabled
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone - Delete Account */}
            <Card className="shadow-card border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, all your data will be permanently removed. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>
                            This will permanently delete your account and all associated data including:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>All invoices and payments</li>
                            <li>All customers and items</li>
                            <li>All rental records</li>
                            <li>Business settings and subscription</li>
                          </ul>
                          <div className="mt-4">
                            <Label>Type DELETE to confirm</Label>
                            <Input
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder="DELETE"
                              className="mt-1.5"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== "DELETE" || isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Account"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout >
  );
}
