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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRecurringInvoices, useDeleteRecurringInvoice, useUpdateRecurringInvoice, RecurringInvoice } from "@/hooks/useRecurringInvoices";
import { Plus, Search, MoreHorizontal, Edit, Trash2, PlayCircle, PauseCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

type RecurringInvoiceWithCustomer = RecurringInvoice & { customers: { name: string } | null };

export default function RecurringInvoicesPage() {
  const { data: invoices = [], isLoading } = useRecurringInvoices();
  const deleteInvoice = useDeleteRecurringInvoice();
  const updateInvoice = useUpdateRecurringInvoice();

  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) =>
    inv.title.toLowerCase().includes(search.toLowerCase()) ||
    inv.customers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    updateInvoice.mutate({ id, is_active: !currentStatus });
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      cell: (item: RecurringInvoiceWithCustomer) => (
        <div className="font-medium">{item.title}</div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (item: RecurringInvoiceWithCustomer) => item.customers?.name || "—",
    },
    {
      key: "frequency",
      header: "Frequency",
      cell: (item: RecurringInvoiceWithCustomer) => (
        <Badge variant="outline" className="capitalize">
          {item.frequency}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (item: RecurringInvoiceWithCustomer) => `₹${(item.amount || 0).toLocaleString()}`,
    },
    {
      key: "next_run_date",
      header: "Next Run",
      cell: (item: RecurringInvoiceWithCustomer) => item.next_run_date
        ? format(new Date(item.next_run_date), "dd MMM yyyy")
        : "—",
    },
    {
      key: "is_active",
      header: "Status",
      cell: (item: RecurringInvoiceWithCustomer) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Active" : "Paused"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (item: RecurringInvoiceWithCustomer) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/recurring-invoices/${item.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleActive(item.id, item.is_active)}>
              {item.is_active ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Recurring Invoices">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Recurring Invoices"
      subtitle="Automate your billing with recurring invoices"
      actions={
        <Button asChild>
          <Link to="/recurring-invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Recurring Invoice
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recurring invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <DataTable columns={columns} data={filteredInvoices} />
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteInvoice.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
