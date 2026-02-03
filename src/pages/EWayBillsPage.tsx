import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { Plus, Search, MoreHorizontal, Eye, FileText, Loader2, Truck } from "lucide-react";
import { format } from "date-fns";

export default function EWayBillsPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const [search, setSearch] = useState("");

  // Filter E-Way Bills and Delivery Challans
  const ewayBills = invoices.filter(
    (inv) => inv.document_type === "eway_bill" || inv.document_type === "delivery_challan"
  );

  const filteredBills = ewayBills.filter((bill) =>
    bill.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    bill.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (bill as any).eway_bill_number?.toLowerCase().includes(search.toLowerCase()) ||
    (bill as any).vehicle_number?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: "invoice_number",
      header: "E-Way Bill No.",
      cell: (item: Invoice) => (
        <Link
          to={`/invoices/${item.id}`}
          className="font-medium text-primary hover:underline"
        >
          {(item as any).eway_bill_number || item.invoice_number}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (item: Invoice) => item.customer?.name || "Walk-in",
    },
    {
      key: "vehicle_number",
      header: "Vehicle No.",
      cell: (item: Invoice) => (
        <span className="font-mono text-sm">{(item as any).vehicle_number || "-"}</span>
      ),
    },
    {
      key: "invoice_date",
      header: "Date",
      cell: (item: Invoice) => format(new Date(item.invoice_date), "dd MMM yyyy"),
    },
    {
      key: "valid_till",
      header: "Valid Till",
      cell: (item: Invoice) => {
        const validTill = (item as any).eway_valid_till;
        if (!validTill) return "-";
        const isExpired = new Date(validTill) < new Date();
        return (
          <Badge variant={isExpired ? "destructive" : "default"}>
            {format(new Date(validTill), "dd MMM yyyy")}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (item: Invoice) => {
        const status = item.status || "draft";
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          draft: "secondary",
          sent: "default",
          delivered: "default",
          in_transit: "outline",
        };
        return (
          <Badge variant={variants[status] || "secondary"} className="capitalize">
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      key: "subtotal",
      header: "Value",
      cell: (item: Invoice) => `₹${(item.subtotal || 0).toLocaleString()}`,
    },
    {
      key: "actions",
      header: "",
      cell: (item: Invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/invoices/${item.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/invoices/${item.id}/edit`}>
                <FileText className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <AppLayout title="E-Way Bills">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="E-Way Bills"
      subtitle="Manage e-way bills for goods transportation"
      actions={
        <Button asChild>
          <Link to="/invoices/new?type=eway_bill">
            <Plus className="mr-2 h-4 w-4" />
            New E-Way Bill
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by bill no., customer, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <DataTable columns={columns} data={filteredBills} />

        {filteredBills.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No E-Way Bills</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create e-way bills for transporting goods as per GST regulations
            </p>
            <Button asChild>
              <Link to="/invoices/new?type=eway_bill">
                <Plus className="mr-2 h-4 w-4" />
                Create First E-Way Bill
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
