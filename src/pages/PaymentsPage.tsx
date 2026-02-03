import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentMethodBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CreditCard, Plus, Search, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { usePayments, useDeletePayment } from "@/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletePayment, setDeletePayment] = useState<{
    id: string;
    invoice_id: string | null;
    amount: number;
  } | null>(null);

  const { data: payments = [], isLoading } = usePayments();
  const deletePaymentMutation = useDeletePayment();

  const filteredPayments = payments.filter((payment: any) => {
    return (
      payment.invoice?.invoice_number
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDelete = async () => {
    if (deletePayment) {
      await deletePaymentMutation.mutateAsync(deletePayment);
      setDeletePayment(null);
    }
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (payment: any) => (
        <p className="font-medium">{formatDate(payment.payment_date)}</p>
      ),
    },
    {
      key: "invoice",
      header: "Invoice",
      cell: (payment: any) => (
        <div>
          <p className="font-medium text-foreground">
            {payment.invoice?.invoice_number || "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {payment.invoice?.customers?.name}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (payment: any) => (
        <p className="font-medium text-success">{formatCurrency(payment.amount)}</p>
      ),
      className: "text-right",
    },
    {
      key: "method",
      header: "Method",
      cell: (payment: any) => (
        <PaymentMethodBadge method={payment.payment_method} />
      ),
    },
    {
      key: "reference",
      header: "Reference",
      cell: (payment: any) => (
        <span className="text-sm font-mono">
          {payment.reference_number || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (payment: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Receipt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() =>
                setDeletePayment({
                  id: payment.id,
                  invoice_id: payment.invoice_id,
                  amount: payment.amount,
                })
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  const totalReceived = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <AppLayout title="Payments" subtitle="Track and record payments">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link to="/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description={
              searchQuery
                ? "Try adjusting your search"
                : "Payment records will appear here"
            }
            action={
              !searchQuery
                ? { label: "Record Payment", href: "/payments/new" }
                : undefined
            }
          />
        }
      />

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>Showing {filteredPayments.length} payments</p>
        <p>
          Total Received:{" "}
          <span className="font-medium text-success">
            {formatCurrency(totalReceived)}
          </span>
        </p>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePayment} onOpenChange={() => setDeletePayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? The invoice balance will be updated accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
