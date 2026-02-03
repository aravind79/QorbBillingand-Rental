import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  ClipboardList,
  RotateCcw,
  ChevronsUpDown,
  Receipt,
  Truck,
  Building2,
  ShoppingCart,
  Store,
  Repeat,
  FileBox,
  UtensilsCrossed,
  Wallet,
  FileCheck,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useUserPlan } from "@/hooks/useSubscription";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppModule = "billing" | "rental";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  requiresFeature?: string;
}

const billingNavigationBase: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "POS", href: "/pos", icon: Store, requiresFeature: "showPOSMode" },
  { name: "Items", href: "/items", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Building2, requiresFeature: "showSuppliers" },
  { name: "Quotations", href: "/quotations", icon: ClipboardList, requiresFeature: "showQuotations" },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Recurring", href: "/recurring-invoices", icon: Repeat, requiresFeature: "showRecurringInvoices" },
  { name: "E-Way Bills", href: "/eway-bills", icon: FileBox, requiresFeature: "showDeliveryChallan" },
  { name: "Tables", href: "/tables", icon: UtensilsCrossed, requiresFeature: "showTableBilling" },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, requiresFeature: "showPurchaseOrders" },
  { name: "Cash & Bank", href: "/cash-bank", icon: Wallet },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Inventory", href: "/inventory", icon: Boxes, requiresFeature: "showInventory" },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "GST Reports", href: "/gst-reports", icon: FileCheck },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Subscription", href: "/subscription", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

const rentalNavigation = [
  { name: "Dashboard", href: "/rentals/dashboard", icon: LayoutDashboard },
  { name: "Items", href: "/rentals/items", icon: Package },
  { name: "Customers", href: "/rentals/customers", icon: Users },
  { name: "Bookings", href: "/rentals/bookings", icon: ClipboardList },
  { name: "Calendar", href: "/rentals/calendar", icon: Calendar },
  { name: "Returns", href: "/rentals/returns", icon: RotateCcw },
  { name: "Reports", href: "/rentals/reports", icon: BarChart3 },
  { name: "Subscription", href: "/subscription", icon: CreditCard },
  { name: "Settings", href: "/rentals/settings", icon: Settings },
];

// appModules is now defined inside the component to use filtered navigation

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { canAccessBilling, canAccessRental, selectedMode, updateSelectedMode } = useUserPlan();
  const { config } = useIndustryConfig();

  // Filter billing navigation based on industry config
  const billingNavigation = useMemo(() => {
    const filtered = billingNavigationBase.filter((item) => {
      if (!item.requiresFeature) return true;
      return config[item.requiresFeature as keyof typeof config] === true;
    });

    // Add ITR Dashboard for freelancers (after GST Reports, before Purchases)
    if (config.industry === 'freelancer') {
      const gstIndex = filtered.findIndex(item => item.href === '/gst-reports');
      if (gstIndex !== -1) {
        filtered.splice(gstIndex + 1, 0, {
          name: "ITR Dashboard",
          href: "/itr-dashboard",
          icon: Calculator,
        });
      }
    }

    return filtered;
  }, [config]);

  // Determine current module based on route or user's selected mode
  const getCurrentModule = useCallback((): AppModule => {
    if (location.pathname.startsWith("/rentals")) return "rental";
    if (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/items") ||
      location.pathname.startsWith("/customers") ||
      location.pathname.startsWith("/invoices") ||
      location.pathname.startsWith("/payments") ||
      location.pathname.startsWith("/inventory") ||
      location.pathname.startsWith("/reports") ||
      location.pathname.startsWith("/gst-reports") ||
      location.pathname.startsWith("/purchases") ||
      location.pathname.startsWith("/itr-dashboard") ||
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

  const [activeModule, setActiveModule] = useState<AppModule>(getCurrentModule());

  // Sync activeModule when route or selectedMode changes
  useEffect(() => {
    const newModule = getCurrentModule();
    if (newModule !== activeModule) {
      setActiveModule(newModule);
    }
  }, [getCurrentModule, activeModule]);

  // Create dynamic appModules with filtered navigation
  const appModules = useMemo(() => ({
    billing: {
      name: "Billing",
      icon: Receipt,
      navigation: billingNavigation,
      defaultRoute: "/dashboard",
    },
    rental: {
      name: "Rental",
      icon: Truck,
      navigation: rentalNavigation,
      defaultRoute: "/rentals/dashboard",
    },
  }), [billingNavigation]);

  const currentApp = appModules[activeModule];
  const availableModules = [
    ...(canAccessBilling ? [{ id: "billing" as AppModule, ...appModules.billing }] : []),
    ...(canAccessRental ? [{ id: "rental" as AppModule, ...appModules.rental }] : []),
  ];

  const handleModuleSwitch = async (moduleId: AppModule) => {
    setActiveModule(moduleId);
    // Persist the selection to database
    await updateSelectedMode(moduleId);
    navigate(appModules[moduleId].defaultRoute);
  };

  const NavItem = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const isActive = location.pathname === item.href ||
      (item.href !== "/dashboard" && item.href !== "/rentals/dashboard" && location.pathname.startsWith(item.href));

    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out hidden lg:block",
        "bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo & App Switcher */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-sidebar-border">
        {availableModules.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-2 hover:bg-sidebar-accent",
                  collapsed && "justify-center w-10"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                  <currentApp.icon className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                {!collapsed && (
                  <>
                    <span className="text-sm font-semibold text-sidebar-foreground">
                      {currentApp.name}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-sidebar-muted ml-auto" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {availableModules.map((module) => (
                <DropdownMenuItem
                  key={module.id}
                  onClick={() => handleModuleSwitch(module.id)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    activeModule === module.id && "bg-accent"
                  )}
                >
                  <module.icon className="h-4 w-4" />
                  <span>{module.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to={currentApp.defaultRoute} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <currentApp.icon className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground">
                {currentApp.name}
              </span>
            )}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
        {currentApp.navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}

