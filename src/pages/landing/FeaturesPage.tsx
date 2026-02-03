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
  Scan,
  Package,
  Printer,
  ShoppingCart,
  Cloud,
  Lock
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Create invoices in seconds with barcode scanning support. Optimized for speed.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Bank-level encryption for your data. 99.9% uptime guarantee with automatic backups.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integration",
    description: "Send invoices, reminders, and receipts directly via WhatsApp to your customers.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Real-time insights, revenue tracking, and comprehensive business reports.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Works perfectly on any device. Manage your business on the go.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: IndianRupee,
    title: "GST Compliant",
    description: "Auto GST calculation, GSTR-1, GSTR-3B reports. E-invoicing ready.",
    color: "from-red-500 to-orange-500"
  },
  {
    icon: Calendar,
    title: "Booking Calendar",
    description: "Visual calendar to track all rentals, bookings, and availability at a glance.",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Automated payment and return reminders via SMS, Email, and WhatsApp.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: MapPin,
    title: "Real-time Tracking",
    description: "Track rental status, deliveries, and returns in real-time.",
    color: "from-teal-500 to-green-500"
  },
  {
    icon: Users,
    title: "Customer Profiles",
    description: "Complete customer history, preferences, and credit management.",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: Package,
    title: "Inventory Control",
    description: "Real-time stock tracking with low stock alerts and batch management.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Printer,
    title: "Thermal Printing",
    description: "Support for 80mm thermal printers and A4 invoice printing.",
    color: "from-slate-500 to-gray-600"
  }
];

export default function FeaturesPage() {
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
              <Link to="/features" className="text-slate-900 font-medium">Features</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
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
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Features</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mt-3 mb-6">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Modern Businesses
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10">
            Everything you need to manage your rental or retail business efficiently
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-10 py-6 text-lg font-semibold shadow-xl shadow-indigo-200">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join 1000+ businesses already using qorb
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 rounded-full px-10 py-6 text-lg font-semibold shadow-xl">
              Get Started Now
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