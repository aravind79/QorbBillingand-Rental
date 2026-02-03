import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Check, 
  ArrowLeft,
  Shield,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";

const plans = {
  rental: {
    name: "Rental",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    features: ["Rental POS System", "Booking Calendar", "Due Date Reminders", "Customer Management"]
  },
  premium: {
    name: "Premium",
    monthlyPrice: 1499,
    yearlyPrice: 14390,
    features: ["Everything in Rental", "Billing Features", "Priority Support", "Custom Branding"]
  },
  billing: {
    name: "Billing",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    features: ["Sales POS System", "GST Compliance", "Inventory Management", "Sales Reports"]
  }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const planKey = (searchParams.get("plan") || "premium") as keyof typeof plans;
  const billingCycle = searchParams.get("billing") || "monthly";
  const isNewUser = searchParams.get("newuser") === "true";
  const plan = plans[planKey] || plans.premium;
  
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");

  const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const monthlyEquivalent = billingCycle === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handlePayment = async (simulateFailure: boolean = false) => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/auth");
      return;
    }

    // Validate payment details
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) {
        toast.error("Please enter a valid card number");
        return;
      }
      if (cardExpiry.length < 5) {
        toast.error("Please enter a valid expiry date");
        return;
      }
      if (cardCvv.length < 3) {
        toast.error("Please enter a valid CVV");
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId.includes("@")) {
        toast.error("Please enter a valid UPI ID");
        return;
      }
    }

    setIsProcessing(true);
    setPaymentFailed(false);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate failure if requested (for testing)
    if (simulateFailure) {
      setIsProcessing(false);
      setPaymentFailed(true);
      toast.error("Payment failed! Please try again.");
      return;
    }

    try {
      // Create dummy transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: price,
          currency: "INR",
          status: "completed",
          plan_name: planKey,
          billing_cycle: billingCycle,
          razorpay_payment_id: `pay_dummy_${Date.now()}`,
          razorpay_order_id: `order_dummy_${Date.now()}`
        });

      if (transactionError) throw transactionError;

      // Create/update subscription
      const currentDate = new Date();
      const periodEnd = new Date();
      if (billingCycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_name: planKey,
          status: "active",
          billing_cycle: billingCycle,
          amount: price,
          current_period_start: currentDate.toISOString(),
          current_period_end: periodEnd.toISOString(),
          auto_renew: true
        });

      if (subscriptionError) throw subscriptionError;

      // Update profile
      const subscriptionPlan = planKey === "premium" ? "professional" : "starter";
      await supabase
        .from("profiles")
        .update({
          subscription_plan: subscriptionPlan,
          subscription_status: "active"
        })
        .eq("user_id", user.id);

      toast.success("Payment successful! Welcome to qorb.");
      
      // Only redirect to onboarding for new users on successful payment
      if (isNewUser) {
        navigate("/onboarding");
      } else {
        navigate("/subscription");
      }
    } catch (error: any) {
      setPaymentFailed(true);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/pricing" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Pricing
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{plan.name} Plan</h3>
                      <p className="text-sm text-slate-500 capitalize">{billingCycle} billing</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">₹{monthlyEquivalent}</p>
                      <p className="text-sm text-slate-500">/month</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-indigo-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Subtotal</span>
                    <span>₹{price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>GST (18%)</span>
                    <span>₹{Math.round(price * 0.18)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>₹{Math.round(price * 1.18)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Shield className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-700">30-day money-back guarantee</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">Payment Details</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "card" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <RadioGroupItem value="card" id="card" />
                    <CreditCard className="h-5 w-5 text-slate-600" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">Credit / Debit Card</Label>
                  </div>
                  <div className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "upi" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <RadioGroupItem value="upi" id="upi" />
                    <Smartphone className="h-5 w-5 text-slate-600" />
                    <Label htmlFor="upi" className="flex-1 cursor-pointer">UPI</Label>
                  </div>
                  <div className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "netbanking" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                    <RadioGroupItem value="netbanking" id="netbanking" />
                    <Building2 className="h-5 w-5 text-slate-600" />
                    <Label htmlFor="netbanking" className="flex-1 cursor-pointer">Net Banking</Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <p className="text-sm text-slate-600">
                      You will be redirected to your bank's website to complete the payment.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={() => handlePayment()} 
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg font-semibold rounded-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay ₹{Math.round(price * 1.18)}</>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                  This is a demo payment - no real charges will be made.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}