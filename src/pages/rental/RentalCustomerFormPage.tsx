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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STATES } from "@/types";
import {
  useRentalCustomer,
  useCreateRentalCustomer,
  useUpdateRentalCustomer,
} from "@/hooks/useRentalCustomers";

export default function RentalCustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: existingCustomer, isLoading: loadingCustomer } = useRentalCustomer(id);
  const createCustomer = useCreateRentalCustomer();
  const updateCustomer = useUpdateRentalCustomer();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    billing_address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    customer_group: "",
    credit_limit: "",
  });

  useEffect(() => {
    if (existingCustomer) {
      setFormData({
        name: existingCustomer.name || "",
        email: existingCustomer.email || "",
        phone: existingCustomer.phone || "",
        billing_address: existingCustomer.billing_address || "",
        city: existingCustomer.city || "",
        state: existingCustomer.state || "",
        pincode: existingCustomer.pincode || "",
        gstin: existingCustomer.gstin || "",
        customer_group: existingCustomer.customer_group || "",
        credit_limit: existingCustomer.credit_limit?.toString() || "",
      });
    }
  }, [existingCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Customer name is required");
      return;
    }

    const customerData = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      billing_address: formData.billing_address || null,
      city: formData.city || null,
      state: formData.state || null,
      pincode: formData.pincode || null,
      gstin: formData.gstin || null,
      customer_group: formData.customer_group || null,
      credit_limit: formData.credit_limit ? Number(formData.credit_limit) : null,
    };

    try {
      if (isEditing) {
        await updateCustomer.mutateAsync({ id, ...customerData });
        toast.success("Customer updated successfully");
      } else {
        await createCustomer.mutateAsync(customerData as any);
        toast.success("Customer created successfully");
      }
      navigate("/rentals/customers");
    } catch (error) {
      toast.error(isEditing ? "Failed to update customer" : "Failed to create customer");
    }
  };

  if (isEditing && loadingCustomer) {
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
      title={isEditing ? "Edit Customer" : "Add Customer"}
      subtitle={isEditing ? "Update customer details" : "Add a new rental customer"}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/rentals/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            type="submit"
            disabled={createCustomer.isPending || updateCustomer.isPending}
          >
            {(createCustomer.isPending || updateCustomer.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Update Customer" : "Save Customer"}
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
                <Label>Customer Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@email.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Group</Label>
                  <Input
                    value={formData.customer_group}
                    onChange={(e) => setFormData({ ...formData, customer_group: e.target.value })}
                    placeholder="VIP, Regular, etc."
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Credit Limit (₹)</Label>
                  <Input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    placeholder="0"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Street address"
                  className="mt-1.5"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="560001"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label>State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
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
                <Label>GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="mt-1.5 font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </AppLayout>
  );
}
