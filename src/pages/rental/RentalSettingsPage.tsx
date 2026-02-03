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
  Building2,
  User,
  Calendar,
  Bell,
  Upload,
  Save,
} from "lucide-react";
import { INDIAN_STATES } from "@/types";
import { toast } from "sonner";

export default function RentalSettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <AppLayout title="Rental Settings" subtitle="Configure your rental business settings">
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="rental" className="gap-2">
            <Calendar className="h-4 w-4" />
            Rental
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
                  This information appears on your rental agreements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Business Name *</Label>
                    <Input
                      placeholder="Your Rental Business Name"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input
                      placeholder="22AAAAA0000A1Z5"
                      className="mt-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input
                      placeholder="AAAAA0000A"
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
                      className="mt-1.5 resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input placeholder="City" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Select>
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
                    <Input placeholder="560001" className="mt-1.5" />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Phone</Label>
                    <Input placeholder="+91 9876543210" className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="rentals@email.com" className="mt-1.5" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card className="shadow-card h-fit">
              <CardHeader>
                <CardTitle>Business Logo</CardTitle>
                <CardDescription>
                  Upload your logo for rental agreements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      RB
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rental Settings */}
        <TabsContent value="rental">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Rental Customization</CardTitle>
                <CardDescription>
                  Configure default rental settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Rental Prefix</Label>
                    <Input
                      placeholder="RNT"
                      defaultValue="RNT"
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
                </div>

                <div>
                  <Label>Default Late Fee (per day)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    defaultValue="100"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Default Rental Terms</Label>
                  <Textarea
                    placeholder="Default terms and conditions for rentals..."
                    defaultValue="1. Items must be returned in the same condition as rented.
2. Late returns will incur additional charges.
3. Damage to items will be charged to the security deposit."
                    className="mt-1.5 resize-none"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Deposit Settings</CardTitle>
                <CardDescription>
                  Configure security deposit preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Security Deposit</p>
                      <p className="text-sm text-muted-foreground">
                        Collect deposit on all rentals
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-calculate Deposit</p>
                      <p className="text-sm text-muted-foreground">
                        Calculate based on item values
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send Return Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Email customers before due date
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    <p className="font-medium">New Booking</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a new rental is booked
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Upcoming Returns</p>
                    <p className="text-sm text-muted-foreground">
                      Remind about upcoming item returns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Overdue Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when items are not returned on time
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Inventory</p>
                    <p className="text-sm text-muted-foreground">
                      Alert when rental items are running low
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <Card className="shadow-card max-w-2xl">
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
                  <Input className="mt-1.5" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" className="mt-1.5" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1.5" />
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
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
