import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import ItemsPage from "./pages/ItemsPage";
import ItemFormPage from "./pages/ItemFormPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerFormPage from "./pages/CustomerFormPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceFormPage from "./pages/InvoiceFormPage";
import QuotationsPage from "./pages/QuotationsPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentFormPage from "./pages/PaymentFormPage";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import SupplierFormPage from "./pages/SupplierFormPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import PurchaseOrderFormPage from "./pages/PurchaseOrderFormPage";
import POSPage from "./pages/POSPage";
import RecurringInvoicesPage from "./pages/RecurringInvoicesPage";
import RecurringInvoiceFormPage from "./pages/RecurringInvoiceFormPage";
import EWayBillsPage from "./pages/EWayBillsPage";
import CashBankPage from "./pages/CashBankPage";
import TableBillingPage from "./pages/TableBillingPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import RentalsPage from "./pages/RentalsPage";
import RentalFormPage from "./pages/RentalFormPage";
import RentalDashboard from "./pages/rental/RentalDashboard";
import RentalItemsPage from "./pages/rental/RentalItemsPage";
import RentalItemFormPage from "./pages/rental/RentalItemFormPage";
import RentalCustomersPage from "./pages/rental/RentalCustomersPage";
import RentalCustomerFormPage from "./pages/rental/RentalCustomerFormPage";
import RentalReturnsPage from "./pages/rental/RentalReturnsPage";
import RentalReportsPage from "./pages/rental/RentalReportsPage";
import RentalSettingsPage from "./pages/rental/RentalSettingsPage";
import RentalCalendarPage from "./pages/rental/RentalCalendarPage";
import GSTReportsPage from "./pages/GSTReportsPage";
import PurchasesPage from "./pages/PurchasesPage";
import ITRDashboardPage from "./pages/ITRDashboardPage";
import IncomePage from "./pages/IncomePage";
import ExpensesPage from "./pages/ExpensesPage";
import PurchaseFormPage from "./pages/PurchaseFormPage";
import TaxComputationPage from "./pages/TaxComputationPage";
import AdvanceTaxPage from "./pages/AdvanceTaxPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
// Landing pages
import HomePage from "./pages/landing/HomePage";
import PricingPage from "./pages/landing/PricingPage";
import FeaturesPage from "./pages/landing/FeaturesPage";
import ContactPage from "./pages/landing/ContactPage";
import AboutPage from "./pages/landing/AboutPage";
import CheckoutPage from "./pages/CheckoutPage";
import PlanSelectionPage from "./pages/PlanSelectionPage";
// Onboarding
import OnboardingPage from "./pages/onboarding/OnboardingPage";
// Super Admin
import AdminDashboard from "./pages/super-admin/AdminDashboard";
import UsersManagement from "./pages/super-admin/UsersManagement";
import RevenueAnalytics from "./pages/super-admin/RevenueAnalytics";
import ProposalsPage from "./pages/ProposalsPage";
import ProposalBuilderPage from "./pages/ProposalBuilderPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Auth */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/select-plan" element={<ProtectedRoute><PlanSelectionPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* Billing Module */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/items" element={<ProtectedRoute><ItemsPage /></ProtectedRoute>} />
      <Route path="/items/new" element={<ProtectedRoute><ItemFormPage /></ProtectedRoute>} />
      <Route path="/items/:id/edit" element={<ProtectedRoute><ItemFormPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/customers/new" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
      <Route path="/customers/:id/edit" element={<ProtectedRoute><CustomerFormPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/invoices/new" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
      <Route path="/quotations/new" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="/quotations/:id" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="/quotations/:id/edit" element={<ProtectedRoute><InvoiceFormPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="/payments/new" element={<ProtectedRoute><PaymentFormPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
      <Route path="/suppliers/new" element={<ProtectedRoute><SupplierFormPage /></ProtectedRoute>} />
      <Route path="/suppliers/:id/edit" element={<ProtectedRoute><SupplierFormPage /></ProtectedRoute>} />
      <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrdersPage /></ProtectedRoute>} />
      <Route path="/purchase-orders/new" element={<ProtectedRoute><PurchaseOrderFormPage /></ProtectedRoute>} />
      <Route path="/purchase-orders/:id" element={<ProtectedRoute><PurchaseOrderFormPage /></ProtectedRoute>} />
      <Route path="/purchase-orders/:id/edit" element={<ProtectedRoute><PurchaseOrderFormPage /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
      <Route path="/recurring-invoices" element={<ProtectedRoute><RecurringInvoicesPage /></ProtectedRoute>} />
      <Route path="/recurring-invoices/new" element={<ProtectedRoute><RecurringInvoiceFormPage /></ProtectedRoute>} />
      <Route path="/recurring-invoices/:id/edit" element={<ProtectedRoute><RecurringInvoiceFormPage /></ProtectedRoute>} />
      <Route path="/eway-bills" element={<ProtectedRoute><EWayBillsPage /></ProtectedRoute>} />
      <Route path="/delivery-challans" element={<ProtectedRoute><EWayBillsPage /></ProtectedRoute>} />
      <Route path="/cash-bank" element={<ProtectedRoute><CashBankPage /></ProtectedRoute>} />
      <Route path="/tables" element={<ProtectedRoute><TableBillingPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/gst-reports" element={<ProtectedRoute><GSTReportsPage /></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
      <Route path="/purchases/new" element={<ProtectedRoute><PurchaseFormPage /></ProtectedRoute>} />
      <Route path="/purchases/:id/edit" element={<ProtectedRoute><PurchaseFormPage /></ProtectedRoute>} />

      {/* Proposals Module */}
      <Route path="/proposals" element={<ProtectedRoute><ProposalsPage /></ProtectedRoute>} />
      <Route path="/proposals/new" element={<ProtectedRoute><ProposalBuilderPage /></ProtectedRoute>} />
      <Route path="/proposals/:id/edit" element={<ProtectedRoute><ProposalBuilderPage /></ProtectedRoute>} />

      <Route path="/itr-dashboard" element={<ProtectedRoute><ITRDashboardPage /></ProtectedRoute>} />
      <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      <Route path="/tax-computation" element={<ProtectedRoute><TaxComputationPage /></ProtectedRoute>} />
      <Route path="/advance-tax" element={<ProtectedRoute><AdvanceTaxPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />

      {/* Rental Module */}
      <Route path="/rentals" element={<ProtectedRoute><RentalsPage /></ProtectedRoute>} />
      <Route path="/rentals/bookings" element={<ProtectedRoute><RentalsPage /></ProtectedRoute>} />
      <Route path="/rentals/bookings/new" element={<ProtectedRoute><RentalFormPage /></ProtectedRoute>} />
      <Route path="/rentals/new" element={<ProtectedRoute><RentalFormPage /></ProtectedRoute>} />
      <Route path="/rentals/:id/edit" element={<ProtectedRoute><RentalFormPage /></ProtectedRoute>} />
      <Route path="/rentals/dashboard" element={<ProtectedRoute><RentalDashboard /></ProtectedRoute>} />
      <Route path="/rentals/items" element={<ProtectedRoute><RentalItemsPage /></ProtectedRoute>} />
      <Route path="/rentals/items/new" element={<ProtectedRoute><RentalItemFormPage /></ProtectedRoute>} />
      <Route path="/rentals/items/:id/edit" element={<ProtectedRoute><RentalItemFormPage /></ProtectedRoute>} />
      <Route path="/rentals/customers" element={<ProtectedRoute><RentalCustomersPage /></ProtectedRoute>} />
      <Route path="/rentals/customers/new" element={<ProtectedRoute><RentalCustomerFormPage /></ProtectedRoute>} />
      <Route path="/rentals/customers/:id/edit" element={<ProtectedRoute><RentalCustomerFormPage /></ProtectedRoute>} />
      <Route path="/rentals/returns" element={<ProtectedRoute><RentalReturnsPage /></ProtectedRoute>} />
      <Route path="/rentals/calendar" element={<ProtectedRoute><RentalCalendarPage /></ProtectedRoute>} />
      <Route path="/rentals/reports" element={<ProtectedRoute><RentalReportsPage /></ProtectedRoute>} />
      <Route path="/rentals/settings" element={<ProtectedRoute><RentalSettingsPage /></ProtectedRoute>} />

      {/* Super Admin */}
      <Route path="/super-admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/super-admin/users" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />
      <Route path="/super-admin/revenue" element={<ProtectedRoute><RevenueAnalytics /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;