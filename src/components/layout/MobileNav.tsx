import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  CreditCard,
  Settings,
  ClipboardList,
  RotateCcw,
  Calendar,
  BarChart3,
  Store,
  Building2,
  ShoppingCart,
  MoreHorizontal,
  Receipt,
  Truck,
} from "lucide-react";
import { useUserPlan } from "@/hooks/useSubscription";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  requiresFeature?: string;
}

const billingNavigationBase: NavItem[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS", href: "/pos", icon: Store, requiresFeature: "showPOSMode" },
  { name: "Items", href: "/items", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Cash & Bank", href: "/cash-bank", icon: Building2 },
  { name: "Suppliers", href: "/suppliers", icon: Building2, requiresFeature: "showSuppliers" },
  { name: "Orders", href: "/purchase-orders", icon: ShoppingCart, requiresFeature: "showPurchaseOrders" },
  { name: "E-Way Bills", href: "/eway-bills", icon: Truck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const rentalNavigationBase: NavItem[] = [
  { name: "Home", href: "/rentals/dashboard", icon: LayoutDashboard },
  { name: "Items", href: "/rentals/items", icon: Package },
  { name: "Customers", href: "/rentals/customers", icon: Users },
  { name: "Bookings", href: "/rentals/bookings", icon: ClipboardList },
  { name: "Returns", href: "/rentals/returns", icon: RotateCcw },
  { name: "Calendar", href: "/rentals/calendar", icon: Calendar },
  { name: "Reports", href: "/rentals/reports", icon: BarChart3 },
  { name: "Settings", href: "/rentals/settings", icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessBilling, canAccessRental, selectedMode, updateSelectedMode } = useUserPlan();
  const { config } = useIndustryConfig();
  const [moreOpen, setMoreOpen] = useState(false);

  // Determine current module based on route
  const getCurrentModule = useCallback((): "billing" | "rental" => {
    if (location.pathname.startsWith("/rentals")) return "rental";
    if (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/items") ||
      location.pathname.startsWith("/customers") ||
      location.pathname.startsWith("/invoices") ||
      location.pathname.startsWith("/payments") ||
      location.pathname.startsWith("/inventory") ||
      location.pathname.startsWith("/reports") ||
      location.pathname.startsWith("/pos") ||
      location.pathname.startsWith("/suppliers") ||
      location.pathname.startsWith("/purchase-orders") ||
      location.pathname.startsWith("/quotations") ||
      location.pathname.startsWith("/recurring-invoices") ||
      location.pathname.startsWith("/eway-bills") ||
      location.pathname.startsWith("/cash-bank") ||
      location.pathname.startsWith("/tables") ||
      location.pathname === "/settings") return "billing";

    // For shared pages like /subscription, use the user's selected mode
    if (selectedMode === "rental" && canAccessRental) return "rental";
    if (selectedMode === "billing" && canAccessBilling) return "billing";

    // Fallback: prefer rental if only has rental access, else billing
    if (canAccessRental && !canAccessBilling) return "rental";
    return "billing";
  }, [location.pathname, selectedMode, canAccessRental, canAccessBilling]);

  const [activeModule, setActiveModule] = useState<"billing" | "rental">(getCurrentModule());

  // Sync activeModule when route or selectedMode changes
  useEffect(() => {
    const newModule = getCurrentModule();
    if (newModule !== activeModule) {
      setActiveModule(newModule);
    }
  }, [getCurrentModule, activeModule]);

  const canSwitchModules = canAccessBilling && canAccessRental;

  // Filter navigation based on industry config
  const billingNavigation = useMemo(() => {
    return billingNavigationBase.filter((item) => {
      if (!item.requiresFeature) return true;
      return config[item.requiresFeature as keyof typeof config] === true;
    });
  }, [config]);

  const navigation = activeModule === "rental" ? rentalNavigationBase : billingNavigation;

  // Show first 4 items in bottom bar, rest in "More" sheet
  const visibleItems = navigation.slice(0, 4);
  const moreItems = navigation.slice(4);

  const handleModuleSwitch = async (module: "billing" | "rental") => {
    await updateSelectedMode(module);
    const route = module === "rental" ? "/rentals/dashboard" : "/dashboard";
    navigate(route);
    setMoreOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2 safe-area-pb">
        {visibleItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/rentals/dashboard" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive && "text-primary"
                )}
              />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* More button with sheet */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center flex-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>

            {/* Module Switcher */}
            {canSwitchModules && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Switch Module</p>
                <div className="flex gap-2">
                  <Button
                    variant={activeModule === "billing" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleModuleSwitch("billing")}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Billing
                  </Button>
                  <Button
                    variant={activeModule === "rental" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleModuleSwitch("rental")}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Rental
                  </Button>
                </div>
              </div>
            )}

            {/* More Navigation Items */}
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.href ||
                  location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
