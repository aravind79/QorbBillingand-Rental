import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Heart, Users, Award, ArrowRight, Sparkles } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission",
    description: "To empower Indian businesses with simple, powerful tools that make daily operations effortless."
  },
  {
    icon: Heart,
    title: "Vision",
    description: "To become the most trusted business management platform for SMBs across India."
  },
  {
    icon: Users,
    title: "Community",
    description: "1000+ businesses trust us daily to manage their billing and rental operations."
  },
  {
    icon: Award,
    title: "Excellence",
    description: "99.9% uptime and 4.9★ rating from our customers speaks for our commitment."
  }
];

const team = [
  { name: "Rahul Sharma", role: "Founder & CEO", bio: "10+ years in SaaS & Enterprise Software" },
  { name: "Priya Patel", role: "CTO", bio: "Ex-Google, Cloud Architecture Expert" },
  { name: "Amit Kumar", role: "Head of Product", bio: "Building products for Indian SMBs" },
  { name: "Sneha Reddy", role: "Customer Success", bio: "Passionate about customer delight" }
];

const milestones = [
  { year: "2022", title: "Founded", description: "Started with a vision to simplify business management" },
  { year: "2023", title: "1000 Businesses", description: "Reached our first major milestone" },
  { year: "2024", title: "Premium Launch", description: "Launched combined Rental + Billing solution" },
  { year: "2024", title: "50K+ Invoices", description: "Processing 50,000+ invoices monthly" }
];

export default function AboutPage() {
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
              <Link to="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
              <Link to="/about" className="text-slate-900 font-medium">About Us</Link>
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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Building the future of
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              business management
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We started qorb with a simple mission: make business management accessible to every Indian entrepreneur, from the corner shop to the growing enterprise.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Our Journey</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">
              From idea to 1000+ businesses
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600 mb-2">{milestone.year}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{milestone.title}</h3>
                <p className="text-slate-600 text-sm">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Our Team</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">
              Meet the people behind qorb
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                <p className="text-indigo-600 text-sm font-medium mb-2">{member.role}</p>
                <p className="text-slate-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Join our growing family
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Start your journey with qorb today
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 rounded-full px-10 py-6 text-lg font-semibold">
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