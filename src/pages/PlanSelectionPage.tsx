import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Package, 
  Crown, 
  Check,
  ArrowRight,
  Loader2
} from "lucide-react";

const plans = [
  {
    id: "billing",
    name: "Billing",
    description: "For businesses focused on sales invoicing",
    icon: FileText,
    monthlyPrice: 999,
    yearlyPrice: 9590,
    popular: false,
    features: [
      "Sales POS System",
      "GST Compliance",
      "Inventory Management",
      "Sales Reports",
      "Customer Management",
      "Email Invoices"
    ]
  },
  {
    id: "rental",
    name: "Rental",
    description: "For rental and equipment hire businesses",
    icon: Package,
    monthlyPrice: 999,
    yearlyPrice: 9590,
    popular: false,
    features: [
      "Rental POS System",
      "Booking Calendar",
      "Due Date Reminders",
      "Customer Management",
      "Security Deposits",
      "Return Tracking"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    description: "Complete solution for both billing & rental",
    icon: Crown,
    monthlyPrice: 1499,
    yearlyPrice: 14390,
    popular: true,
    features: [
      "Everything in Billing",
      "Everything in Rental",
      "Priority Support",
      "Custom Branding",
      "Advanced Analytics",
      "API Access"
    ]
  }
];

export default function PlanSelectionPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout?plan=${planId}&billing=${isYearly ? "yearly" : "monthly"}&newuser=true`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
              <span className="text-2xl font-bold text-white">q</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Welcome! Select the plan that best fits your business needs. You can always upgrade later.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <Label className={!isYearly ? "font-semibold" : "text-slate-500"}>Monthly</Label>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <Label className={isYearly ? "font-semibold" : "text-slate-500"}>
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Save 20%
            </Badge>
          </Label>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const monthlyEquivalent = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={`relative transition-all hover:shadow-lg ${
                  plan.popular 
                    ? "border-indigo-500 shadow-lg ring-2 ring-indigo-500/20" 
                    : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${
                    plan.popular 
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-slate-900">₹{monthlyEquivalent}</span>
                    <span className="text-slate-500">/month</span>
                    {isYearly && (
                      <p className="text-sm text-slate-500 mt-1">
                        Billed ₹{price} yearly
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className={`h-4 w-4 ${plan.popular ? "text-indigo-600" : "text-green-600"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Select {plan.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-10">
          All plans include a 30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </div>
  );
}
