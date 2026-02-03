import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Send,
  Trash2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
import { useQuotations, useDeleteQuotation, useConvertToInvoice, Quotation } from "@/hooks/useQuotations";

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "converted", label: "Converted" },
  { value: "expired", label: "Expired" },
];

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null);
  const navigate = useNavigate();

  const { data: quotations = [], isLoading } = useQuotations();
  const deleteQuotation = useDeleteQuotation();
  const convertToInvoice = useConvertToInvoice();

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quotation.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (quotationToDelete) {
      await deleteQuotation.mutateAsync(quotationToDelete.id);
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  const handleConvert = async () => {
    if (quotationToConvert) {
      const result = await convertToInvoice.mutateAsync(quotationToConvert.id);
      setConvertDialogOpen(false);
      setQuotationToConvert(null);
      if (result) {
        navigate(`/invoices/${result.id}`);
      }
    }
  };

  const columns = [
    {
      key: "invoice_number",
      header: "Quotation",
      cell: (quotation: Quotation) => (
        <div>
          <p className="font-medium text-foreground">{quotation.invoice_number}</p>
          <p className="text-xs text-muted-foreground">
            Valid till: {quotation.quotation_validity_date ? formatDate(quotation.quotation_validity_date) : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (quotation: Quotation) => (
        <div>
          <p className="font-medium">{quotation.customer?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">
            {quotation.customer?.city}, {quotation.customer?.state}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (quotation: Quotation) => (
        <div>
          <p className="text-sm">{formatDate(quotation.invoice_date)}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (quotation: Quotation) => (
        <div>
          <p className="font-medium">{formatCurrency(quotation.total_amount || 0)}</p>
        </div>
      ),
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      cell: (quotation: Quotation) => {
        const status = (quotation.status || "draft") as "draft" | "sent" | "converted" | "expired";
        return <StatusBadge status={status} />;
      },
      className: "text-center",
    },
    {
      key: "actions",
      header: "",
      cell: (quotation: Quotation) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              navigate(`/quotations/${quotation.id}`);
            }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            {quotation.status !== "converted" && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setQuotationToConvert(quotation);
                setConvertDialogOpen(true);
              }}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Convert to Invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setQuotationToDelete(quotation);
                setDeleteDialogOpen(true);
              }}
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

  const getStatusCount = (status: string) => {
    if (status === "all") return quotations.length;
    return quotations.filter((q) => q.status === status).length;
  };

  const totalAmount = quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);

  if (isLoading) {
    return (
      <AppLayout title="Quotations" subtitle="Create and manage estimates">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Quotations" subtitle="Create and manage estimates">
      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="mb-6"
      >
        <TabsList className="bg-secondary/50 h-auto p-1 flex-wrap">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-4"
            >
              {tab.label}
              <Badge
                variant="secondary"
                className="ml-2 h-5 px-1.5 text-xs bg-secondary"
              >
                {getStatusCount(tab.value)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotations by number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link to="/quotations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      {/* Quotations Table */}
      <DataTable
        columns={columns}
        data={filteredQuotations}
        onRowClick={(quotation) => navigate(`/quotations/${quotation.id}`)}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No quotations found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first quotation"
            }
            action={
              !searchQuery && statusFilter === "all"
                ? { label: "Create Quotation", href: "/quotations/new" }
                : undefined
            }
          />
        }
      />

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Total Quotations</p>
          <p className="text-lg font-semibold">{quotations.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Total Value</p>
          <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Converted</p>
          <p className="text-lg font-semibold text-success">{getStatusCount("converted")}</p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation {quotationToDelete?.invoice_number}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteQuotation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Confirmation Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Convert quotation {quotationToConvert?.invoice_number} to an invoice? 
              A new invoice will be created with the same items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              {convertToInvoice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Convert"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
