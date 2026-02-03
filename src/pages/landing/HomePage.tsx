import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Shield, 
  MessageCircle, 
  BarChart3, 
  Smartphone, 
  IndianRupee,
  Calendar,
  Bell,
  MapPin,
  Users,
  FileText,
  ArrowRight,
  Play,
  Star,
  Check,
  Scan,
  Package,
  Printer,
  ShoppingCart
} from "lucide-react";
import { useState, useEffect } from "react";

const stats = [
  { value: "1000+", label: "Active Businesses" },
  { value: "50K+", label: "Invoices/Month" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9", label: "Rating", icon: Star },
];

const industries = [
  "IT Services", "Retail Stores", "Event Management", 
  "Equipment Rental", "Photography Studios", "Construction",
  "Healthcare", "Consulting Firms", "Manufacturing", "Logistics",
  "Furniture Rental", "Vehicle Rental"
];

const rentalFeatures = [
  { icon: Calendar, title: "Booking Calendar", description: "Visual calendar to track all rentals and availability" },
  { icon: Bell, title: "Due Reminders", description: "Automated WhatsApp reminders for due dates" },
  { icon: MessageCircle, title: "WhatsApp Integration", description: "Send invoices and reminders via WhatsApp" },
  { icon: MapPin, title: "Real-time Tracking", description: "Track rental status and returns in real-time" },
  { icon: Users, title: "Customer Profiles", description: "Complete customer history and preferences" },
  { icon: BarChart3, title: "Rental Reports", description: "Revenue, most rented items, and profit analysis" },
];

const billingFeatures = [
  { icon: Scan, title: "Fast POS Billing", description: "Quick billing with barcode scanning support" },
  { icon: IndianRupee, title: "GST Compliance", description: "Auto GST calculation based on business sector" },
  { icon: Package, title: "Inventory Control", description: "Real-time stock tracking with low stock alerts" },
  { icon: ShoppingCart, title: "Purchase Entry", description: "Track purchases and supplier management" },
  { icon: FileText, title: "GST Reports", description: "Sales, Purchase, Daybook, and GST reports" },
  { icon: Printer, title: "Thermal Printing", description: "80mm thermal and A4 invoice printing" },
];

const whyChooseFeatures = [
  { icon: Zap, title: "Lightning Fast", description: "Create invoices in seconds with barcode scanning", color: "text-orange-500" },
  { icon: Shield, title: "Secure & Reliable", description: "Bank-level encryption for your data", color: "text-blue-500" },
  { icon: MessageCircle, title: "WhatsApp Ready", description: "Send invoices directly via WhatsApp", color: "text-green-500" },
  { icon: BarChart3, title: "Smart Analytics", description: "Real-time insights and reports", color: "text-purple-500" },
  { icon: Smartphone, title: "Mobile First", description: "Works perfectly on any device", color: "text-cyan-500" },
  { icon: IndianRupee, title: "GST Compliant", description: "Auto GST calculation & filing ready", color: "text-red-500" },
];

const plans = [
  {
    name: "Rental",
    price: "999",
    description: "Complete rental business solution",
    features: ["Rental POS System", "Booking Calendar View", "Due Date Reminders", "WhatsApp Integration", "Rental Reports & Analytics", "Customer Management"],
    popular: false,
    icon: Calendar
  },
  {
    name: "Premium",
    price: "1,499",
    description: "Everything you need in one package",
    features: ["All Rental Features", "All Billing Features", "Priority 24/7 Support", "Advanced Analytics", "Multi-user Access", "Custom Branding"],
    popular: true,
    icon: Star
  },
  {
    name: "Billing",
    price: "999",
    description: "Complete retail & GST solution",
    features: ["Sales POS System", "GST Compliance", "Purchase Entry", "Inventory Management", "Sales & GST Reports", "Supplier Management"],
    popular: false,
    icon: FileText
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"rental" | "billing">("rental");
  const [animatedStats, setAnimatedStats] = useState<Record<string, string>>({});

  useEffect(() => {
    // Animate stats on mount
    stats.forEach((stat, index) => {
      setTimeout(() => {
        setAnimatedStats(prev => ({ ...prev, [stat.label]: stat.value }));
      }, index * 200);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-slate-900">qorb</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
              <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">About Us</Link>
              <Link to="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Log In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-6 shadow-lg shadow-indigo-200">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float-slow" />
          
          {/* Floating Shapes */}
          <div className="absolute top-32 left-[15%] w-4 h-4 bg-indigo-500 rounded-full animate-float opacity-60" />
          <div className="absolute top-48 right-[20%] w-3 h-3 bg-purple-500 rounded-full animate-float-delayed opacity-60" />
          <div className="absolute top-64 left-[25%] w-2 h-2 bg-pink-500 rounded-full animate-float-slow opacity-60" />
          <div className="absolute bottom-40 right-[30%] w-3 h-3 bg-orange-500 rounded-full animate-float opacity-60" />
          <div className="absolute bottom-32 left-[10%] w-4 h-4 bg-cyan-500 rounded-full animate-float-delayed opacity-60" />
          
          {/* Animated Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-pulse" />
          
          {/* Sparkles */}
          <div className="absolute top-40 left-[40%] w-1 h-1 bg-white rounded-full animate-sparkle" />
          <div className="absolute top-60 right-[35%] w-1 h-1 bg-white rounded-full animate-sparkle-delayed" />
          <div className="absolute bottom-48 left-[55%] w-1 h-1 bg-white rounded-full animate-sparkle-slow" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 animate-slide-down shadow-lg shadow-indigo-100/50">
            <Star className="h-4 w-4 fill-indigo-500 text-indigo-500 animate-pulse" />
            Trusted by 1000+ businesses
          </div>
          
          {/* Headline with animation */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            <span className="inline-block animate-slide-up">Business Management</span>
            <br />
            <span className="inline-block animate-gradient-text bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-500 to-indigo-600 bg-[length:200%_auto] bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Complete rental and billing solution with GST compliance, WhatsApp integration, and powerful analytics. Built for Indian businesses.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <Link to="/auth">
              <Button size="lg" className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 py-6 text-lg shadow-xl shadow-indigo-300/50 group overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-slate-200 hover:bg-slate-50 group bg-white/80 backdrop-blur-sm shadow-lg">
              <Play className="mr-2 h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Stats with enhanced animations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in group"
                style={{ animationDelay: `${0.6 + index * 0.1}s` }}
              >
                <div className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-1 group-hover:scale-110 transition-transform">
                  {animatedStats[stat.label] || "0"}
                  {stat.icon && <stat.icon className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-pulse" />}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 bg-slate-900 overflow-hidden">
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...industries, ...industries].map((industry, index) => (
              <span key={index} className="mx-8 text-slate-400 text-lg font-medium">
                {industry}
              </span>
            ))}
          </div>
        </div>
        <p className="text-center text-slate-500 mt-8 text-sm">
          Businesses of all sizes trust qorb to manage their operations
        </p>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-4">
              Built for Modern Business
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your rental or retail business efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300 group"
              >
                <div className={`h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${feature.color}`}>{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Solution */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Two Solutions</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-8">
              Choose Your Solution
            </h2>
            
            {/* Tabs */}
            <div className="inline-flex items-center p-1 bg-slate-200 rounded-full">
              <button
                onClick={() => setActiveTab("rental")}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === "rental" 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Rental Management
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === "billing" 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Billing Management
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(activeTab === "rental" ? rentalFeatures : billingFeatures).map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600">
              Start with 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                    ₹{plan.price}
                  </span>
                  <span className={plan.popular ? "text-slate-300" : "text-slate-500"}>/month</span>
                </div>
                <Link to="/auth">
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
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className={`flex items-center gap-3 text-sm ${plan.popular ? "text-slate-300" : "text-slate-600"}`}>
                      <Check className={`h-4 w-4 ${plan.popular ? "text-green-400" : "text-indigo-600"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join 1000+ businesses already using qorb
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 rounded-full px-10 py-6 text-lg font-semibold shadow-xl">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-slate-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Updates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="#" className="text-slate-400 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <span className="font-bold">qorb</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2024 qorb. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}