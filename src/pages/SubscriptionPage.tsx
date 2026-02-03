import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, useUserPlan } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { 
  generateSubscriptionInvoicePDF, 
  downloadSubscriptionInvoicePDF 
} from "@/lib/subscriptionPdfGenerator";
import { 
  CreditCard, 
  Calendar, 
  Check, 
  ArrowUpRight, 
  Shield,
  Zap,
  Star,
  AlertTriangle,
  Download,
  RefreshCw,
  XCircle,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const plans = [
  {
    id: "rental",
    name: "Rental",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    description: "Complete rental business solution",
    features: ["Rental POS System", "Booking Calendar", "Due Date Reminders", "Customer Management"],
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 1499,
    yearlyPrice: 14390,
    description: "Everything you need in one package",
    features: ["All Rental Features", "Billing Features", "Priority Support", "Custom Branding"],
    color: "from-purple-500 to-pink-500",
    popular: true
  },
  {
    id: "billing",
    name: "Billing",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    description: "Complete retail & GST solution",
    features: ["Sales POS System", "GST Compliance", "Inventory Management", "Sales Reports"],
    color: "from-green-500 to-emerald-500"
  }
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { updateSelectedMode } = useUserPlan();
  const userPlan = useUserPlan();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  // Fetch business settings for invoice
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user
  });

  const handleDownloadInvoice = async (tx: any) => {
    if (!user) return;
    setDownloadingInvoice(tx.id);
    try {
      const blob = await generateSubscriptionInvoicePDF({
        transactionId: tx.id,
        planName: tx.plan_name || "Subscription",
        amount: tx.amount,
        billingCycle: tx.billing_cycle || "monthly",
        status: tx.status || "completed",
        createdAt: tx.created_at,
        razorpayPaymentId: tx.razorpay_payment_id,
        businessName: businessSettings?.business_name || "",
        businessEmail: businessSettings?.email || "",
        businessAddress: businessSettings?.address,
        businessGstin: businessSettings?.gstin,
        customerName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
        customerEmail: user.email || ""
      });
      downloadSubscriptionInvoicePDF(blob, `subscription-invoice-${tx.id.slice(0, 8)}.pdf`);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const currentPlan = plans.find(p => p.id === subscription?.plan_name) || plans[1];

  const handleUpgrade = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan || !user) return;
    setIsProcessing(true);

    try {
      // Step 1: Cancel any existing active subscriptions first
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("status", "active");

      // Step 2: Create new subscription
      const currentDate = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_name: selectedPlan.id,
          status: "active",
          billing_cycle: "monthly",
          amount: selectedPlan.monthlyPrice,
          current_period_start: currentDate.toISOString(),
          current_period_end: periodEnd.toISOString(),
          auto_renew: true
        });

      if (subError) throw subError;

      // Step 3: Create transaction record
      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: selectedPlan.monthlyPrice,
          currency: "INR",
          status: "completed",
          plan_name: selectedPlan.id,
          billing_cycle: "monthly",
          razorpay_payment_id: `pay_upgrade_${Date.now()}`
        });

      // Step 4: Update profile
      await supabase
        .from("profiles")
        .update({
          subscription_plan: selectedPlan.id === "premium" ? "professional" : "starter",
          subscription_status: "active"
        })
        .eq("user_id", user.id);

      // Step 5: Update mode_selected based on the new plan
      let newMode = selectedPlan.id;
      if (selectedPlan.id === "premium") {
        newMode = "both";
      }
      await updateSelectedMode(newMode);

      // Step 6: Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });

      toast.success(`Successfully upgraded to ${selectedPlan.name} plan!`);
      setShowUpgradeDialog(false);
      
      // Navigate to appropriate dashboard based on new plan
      if (selectedPlan.id === "rental") {
        navigate("/rentals/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade plan");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", auto_renew: false })
        .eq("user_id", user.id);

      await supabase
        .from("profiles")
        .update({ subscription_status: "cancelled" })
        .eq("user_id", user.id);

      toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
      setShowCancelDialog(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "trial":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Trial</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout title="Subscription" subtitle="Manage your plan and billing">
      <div className="space-y-6">
        {/* Current Plan Card */}
        <Card className="overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${currentPlan.color}`} />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {currentPlan.name} Plan
                  {getStatusBadge(userPlan.status)}
                </CardTitle>
                <CardDescription>{currentPlan.description}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(subscription?.amount || currentPlan.monthlyPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  /{subscription?.billing_cycle === "yearly" ? "year" : "month"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trial Progress */}

            {/* Billing Info */}
            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Next Billing</span>
                  </div>
                  <p className="font-semibold">
                    {subscription.current_period_end 
                      ? formatDate(subscription.current_period_end)
                      : "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">Auto-Renew</span>
                  </div>
                  <p className="font-semibold">
                    {subscription.auto_renew ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">Billing Cycle</span>
                  </div>
                  <p className="font-semibold capitalize">
                    {subscription.billing_cycle || "Monthly"}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/checkout?plan=premium&billing=yearly")}
              >
                <Zap className="mr-2 h-4 w-4" />
                Switch to Yearly (Save 20%)
              </Button>
              {subscription?.status === "active" && (
                <Button 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan_name === plan.id;
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all ${
                    isCurrentPlan ? "ring-2 ring-primary" : "hover:shadow-lg"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-orange-400 to-pink-500 text-white border-0">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pt-6">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{formatCurrency(plan.monthlyPrice)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full"
                      variant={isCurrentPlan ? "secondary" : "default"}
                      disabled={isCurrentPlan}
                      onClick={() => handleUpgrade(plan)}
                    >
                      {isCurrentPlan ? "Current Plan" : "Upgrade"}
                      {!isCurrentPlan && <ArrowUpRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing History</CardTitle>
            <CardDescription>View your past transactions and download invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                      }`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.plan_name} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.created_at && formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                        <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDownloadInvoice(tx)}
                        disabled={downloadingInvoice === tx.id}
                      >
                        {downloadingInvoice === tx.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Your payment information is securely processed. We never store your card details.
          </p>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={isProcessing}
            >
              {isProcessing ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              You'll be charged {formatCurrency(selectedPlan?.monthlyPrice || 0)}/month starting today.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="space-y-2">
              {selectedPlan?.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade} disabled={isProcessing}>
              {isProcessing ? "Processing..." : `Pay ${formatCurrency(selectedPlan?.monthlyPrice || 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}