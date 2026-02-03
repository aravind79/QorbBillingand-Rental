import { Plus, Receipt, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/helpers";
import { useUserPlan } from "@/hooks/useSubscription";

interface MobileHeaderProps {
  title: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { canAccessBilling, canAccessRental, selectedMode } = useUserPlan();

  // Determine which mode we're in based on route or selected mode
  const isRentalRoute = location.pathname.startsWith("/rentals");
  const isBillingRoute = location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/items") ||
    location.pathname.startsWith("/customers") ||
    location.pathname.startsWith("/invoices") ||
    location.pathname.startsWith("/payments") ||
    location.pathname.startsWith("/inventory") ||
    location.pathname.startsWith("/reports") ||
    location.pathname === "/settings";

  let isRentalMode = false;
  
  if (isRentalRoute) {
    isRentalMode = true;
  } else if (isBillingRoute) {
    isRentalMode = false;
  } else if (selectedMode === "rental" && canAccessRental) {
    isRentalMode = true;
  } else if (selectedMode === "billing" && canAccessBilling) {
    isRentalMode = false;
  } else if (canAccessRental && !canAccessBilling) {
    isRentalMode = true;
  }

  const ModuleIcon = isRentalMode ? Truck : Receipt;
  const settingsPath = isRentalMode ? "/rentals/settings" : "/settings";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <ModuleIcon className="h-4 w-4 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isRentalMode ? (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/rentals/bookings/new">New Booking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/rentals/customers/new">New Customer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/rentals/items/new">New Item</Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/invoices/new">New Invoice</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/customers/new">New Customer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/items/new">New Item</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.email ? getInitials(user.email) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={settingsPath}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
