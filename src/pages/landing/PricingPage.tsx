import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight, Star, Calendar, FileText } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Rental",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    description: "Complete rental business solution",
    icon: Calendar,
    features: {
      "Rental POS System": true,
      "Booking Calendar View": true,
      "Due Date Reminders": true,
      "WhatsApp Integration": true,
      "Rental Reports & Analytics": true,
      "Customer Management": true,
      "Billing Features": false,
      "Priority Support": false,
      "Custom Branding": false,
    },
    popular: false
  },
  {
    name: "Premium",
    monthlyPrice: 1499,
    yearlyPrice: 14390,
    description: "Everything you need in one package",
    icon: Star,
    features: {
      "Rental POS System": true,
      "Booking Calendar View": true,
      "Due Date Reminders": true,
      "WhatsApp Integration": true,
      "Rental Reports & Analytics": true,
      "Customer Management": true,
      "Billing Features": true,
      "Priority Support": true,
      "Custom Branding": true,
    },
    popular: true
  },
  {
    name: "Billing",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    description: "Complete retail & GST solution",
    icon: FileText,
    features: {
      "Sales POS System": true,
      "GST Compliance": true,
      "Purchase Entry": true,
      "Inventory Management": true,
      "Sales & GST Reports": true,
      "Supplier Management": true,
      "Rental Features": false,
      "Priority Support": false,
      "Custom Branding": false,
    },
    popular: false
  }
];

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, UPI, and net banking through Razorpay. For enterprise plans, we also support bank transfers."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All plans come with a 14-day free trial. No credit card required to start."
  },
  {
    question: "What happens when my trial ends?",
    answer: "You'll be prompted to choose a plan. Your data will be preserved for 30 days even if you don't subscribe immediately."
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund."
  },
  {
    question: "Do you offer discounts for NGOs or startups?",
    answer: "Yes! We offer special pricing for registered NGOs, educational institutions, and early-stage startups. Contact us to learn more."
  }
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-slate-900">qorb</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
              <Link to="/pricing" className="text-slate-900 font-medium">Pricing</Link>
              <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">About Us</Link>
              <Link to="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">Log In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Pricing</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mt-3 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 mb-10">
            Start with 14-day free trial. No credit card required.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-200 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                !isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yearly
              <span className="text-xs text-green-600 font-semibold">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative p-8 rounded-3xl transition-all ${
                  plan.popular 
                    ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white scale-105 shadow-2xl" 
                    : "bg-white border border-slate-200 shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${
                  plan.popular ? "bg-white/10" : "bg-slate-100"
                }`}>
                  <plan.icon className={`h-6 w-6 ${plan.popular ? "text-white" : "text-slate-700"}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.popular ? "text-slate-300" : "text-slate-500"}`}>
                  {plan.description}
                </p>
                <div className="mb-2">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                    ₹{isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                  </span>
                  <span className={plan.popular ? "text-slate-300" : "text-slate-500"}>/month</span>
                </div>
                {isYearly && (
                  <p className={`text-sm mb-6 ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>
                    ₹{plan.yearlyPrice} billed yearly
                  </p>
                )}
                <Link to={`/checkout?plan=${plan.name.toLowerCase()}&billing=${isYearly ? 'yearly' : 'monthly'}`}>
                  <Button 
                    className={`w-full rounded-full mb-6 ${
                      plan.popular 
                        ? "bg-white text-slate-900 hover:bg-slate-100" 
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                    }`}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {Object.entries(plan.features).map(([feature, available], fIndex) => (
                    <li key={fIndex} className={`flex items-center gap-3 text-sm ${
                      plan.popular 
                        ? (available ? "text-slate-300" : "text-slate-500") 
                        : (available ? "text-slate-600" : "text-slate-400")
                    }`}>
                      {available ? (
                        <Check className={`h-4 w-4 ${plan.popular ? "text-green-400" : "text-indigo-600"}`} />
                      ) : (
                        <X className={`h-4 w-4 ${plan.popular ? "text-slate-600" : "text-slate-300"}`} />
                      )}
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-10 py-6 text-lg font-semibold shadow-xl shadow-indigo-200">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <span className="text-white font-bold">qorb</span>
          </div>
          <p className="text-sm text-slate-500">© 2024 qorb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}