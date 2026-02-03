import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  FileText, 
  Package, 
  ArrowRight, 
  ArrowLeft, 
  Check,
  Sparkles,
  Rocket,
  Loader2
} from "lucide-react";

const steps = [
  { id: 1, title: "Business Profile", icon: Building2 },
  { id: 2, title: "Choose Mode", icon: FileText },
  { id: 3, title: "Quick Setup", icon: Package },
  { id: 4, title: "Get Started", icon: Rocket }
];

const industries = [
  "IT Services",
  "Retail",
  "Event Management",
  "Equipment Rental",
  "Photography",
  "Construction",
  "Healthcare",
  "Consulting",
  "Manufacturing",
  "Other"
];

const states = [
  "Andhra Pradesh", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu",
  "Telangana", "Gujarat", "Rajasthan", "Delhi", "Uttar Pradesh", "Other"
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  
  const [businessData, setBusinessData] = useState({
    business_name: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    industry: "",
    financial_year_start: "4"
  });

  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [skipQuickSetup, setSkipQuickSetup] = useState(false);

  // Load saved onboarding progress and business settings
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        // Load onboarding progress
        const { data: progress } = await supabase
          .from("onboarding_progress")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // Load business settings
        const { data: settings } = await supabase
          .from("business_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // Restore business data
        if (settings) {
          setBusinessData({
            business_name: settings.business_name || "",
            gstin: settings.gstin || "",
            address: settings.address || "",
            city: settings.city || "",
            state: settings.state || "",
            pincode: settings.pincode || "",
            phone: settings.phone || "",
            email: settings.email || user.email || "",
            industry: "",
            financial_year_start: String(settings.financial_year_start || 4)
          });
        } else {
          setBusinessData(prev => ({ ...prev, email: user.email || "" }));
        }

        // Restore progress
        if (progress) {
          if (progress.mode_selected) {
            setSelectedMode(progress.mode_selected);
          }
          if (progress.quick_setup_completed) {
            setSkipQuickSetup(true);
          }
          
          // Jump to the appropriate step
          if (progress.completed_at) {
            // Already completed, redirect
            if (progress.mode_selected === 'rental') {
              navigate("/rentals/dashboard");
            } else {
              navigate("/dashboard");
            }
            return;
          }
          
          // Determine which step to resume from
          if (progress.quick_setup_completed) {
            setCurrentStep(4);
          } else if (progress.mode_selected) {
            setCurrentStep(3);
          } else if (progress.business_profile_completed) {
            setCurrentStep(2);
          } else if (progress.current_step && progress.current_step > 1) {
            setCurrentStep(progress.current_step);
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding progress:", error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadSavedProgress();
  }, [user, navigate]);

  const handleBusinessDataChange = (field: string, value: string) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  // Save progress after each step
  const saveProgress = async (step: number, updates: Record<string, any> = {}) => {
    if (!user) return;
    
    try {
      await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: user.id,
          current_step: step,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!businessData.business_name) {
        toast.error("Please enter your business name");
        return;
      }
      // Save business profile progress
      await saveProgress(2, { business_profile_completed: true });
    }
    
    if (currentStep === 2) {
      if (!selectedMode) {
        toast.error("Please select a mode");
        return;
      }
      // Save mode selection
      await saveProgress(3, { mode_selected: selectedMode });
    }

    if (currentStep === 3) {
      // Save quick setup progress
      await saveProgress(4, { quick_setup_completed: true });
    }

    if (currentStep === 4) {
      await completeOnboarding();
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Save business settings
      const settingsPayload = {
        business_name: businessData.business_name,
        gstin: businessData.gstin || null,
        address: businessData.address || null,
        city: businessData.city || null,
        state: businessData.state || null,
        pincode: businessData.pincode || null,
        phone: businessData.phone || null,
        email: businessData.email || null,
        financial_year_start: parseInt(businessData.financial_year_start)
      };

      const { data: existingSettings, error: existingSettingsError } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (existingSettingsError) throw existingSettingsError;

      if (existingSettings?.id) {
        const { error: settingsError } = await supabase
          .from("business_settings")
          .update(settingsPayload)
          .eq("user_id", user.id);

        if (settingsError) throw settingsError;
      } else {
        const { error: settingsError } = await supabase
          .from("business_settings")
          .insert({ user_id: user.id, ...settingsPayload });

        if (settingsError) throw settingsError;
      }

      // Save onboarding progress
      const { error: onboardingError } = await supabase
        .from("onboarding_progress")
        .upsert({
          user_id: user.id,
          current_step: 4,
          business_profile_completed: true,
          mode_selected: selectedMode,
          quick_setup_completed: skipQuickSetup,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (onboardingError) throw onboardingError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          subscription_plan: selectedMode === 'both' ? 'professional' : 'starter'
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Welcome to qorb!");
      
      // Redirect based on selected mode
      if (selectedMode === 'rental') {
        navigate("/rentals/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${currentStep >= step.id 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-border text-muted-foreground'}
              `}>
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-elevated border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "How will you use qorb?"}
              {currentStep === 3 && "Add some initial data (optional)"}
              {currentStep === 4 && "You're all set!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Profile */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      value={businessData.business_name}
                      onChange={(e) => handleBusinessDataChange("business_name", e.target.value)}
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN (Optional)</Label>
                    <Input
                      id="gstin"
                      value={businessData.gstin}
                      onChange={(e) => handleBusinessDataChange("gstin", e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={businessData.industry}
                      onValueChange={(value) => handleBusinessDataChange("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={businessData.address}
                      onChange={(e) => handleBusinessDataChange("address", e.target.value)}
                      placeholder="Business address"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={businessData.city}
                      onChange={(e) => handleBusinessDataChange("city", e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={businessData.state}
                      onValueChange={(value) => handleBusinessDataChange("state", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={businessData.phone}
                      onChange={(e) => handleBusinessDataChange("phone", e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financial_year">Financial Year Start</Label>
                    <Select
                      value={businessData.financial_year_start}
                      onValueChange={(value) => handleBusinessDataChange("financial_year_start", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Choose Mode */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedMode("billing")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedMode === "billing" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <FileText className={`h-8 w-8 mb-3 ${selectedMode === "billing" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-foreground mb-1">Billing Only</h3>
                  <p className="text-sm text-muted-foreground">
                    GST invoicing, customers, payments, and reports
                  </p>
                </button>
                
                <button
                  onClick={() => setSelectedMode("rental")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedMode === "rental" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Package className={`h-8 w-8 mb-3 ${selectedMode === "rental" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-foreground mb-1">Rental Only</h3>
                  <p className="text-sm text-muted-foreground">
                    Equipment rental, deposits, returns, and tracking
                  </p>
                </button>
                
                <button
                  onClick={() => setSelectedMode("both")}
                  className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                    selectedMode === "both" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Popular
                  </div>
                  <Sparkles className={`h-8 w-8 mb-3 ${selectedMode === "both" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-foreground mb-1">Both</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete solution with billing and rental features
                  </p>
                </button>
              </div>
            )}

            {/* Step 3: Quick Setup */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Quick Setup (Optional)
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    You can add sample data to explore the features, or skip and add your own data later.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" onClick={() => setSkipQuickSetup(true)}>
                      Skip for Now
                    </Button>
                    <Button onClick={() => {
                      setSkipQuickSetup(true);
                      toast.info("You can add items and customers from the dashboard");
                    }}>
                      I'll Add My Own Data
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Get Started */}
            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Rocket className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  You're All Set!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your account is ready. Explore all features and grow your business.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Let's get started!
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading ? "Setting up..." : currentStep === 4 ? "Go to Dashboard" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}