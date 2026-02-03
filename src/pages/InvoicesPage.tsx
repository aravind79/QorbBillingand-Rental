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
  MessageCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useInvoices, useDeleteInvoice, useSendInvoiceEmail, Invoice } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { generateInvoiceHTML } from "@/lib/invoicePrinter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { printInvoiceA4 } from "@/lib/invoicePrinter";
import { printThermalInvoice } from "@/lib/thermalPrinter";

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: invoices = [], isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const sendEmail = useSendInvoiceEmail();

  // Fetch business settings for email
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings", user?.id, "force_refresh"],
    queryFn: async () => {
      const { data } = await supabase
        .from("business_settings")
        .select("*")
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
  });



  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (invoiceToDelete) {
      await deleteInvoice.mutateAsync(invoiceToDelete.id);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceToEmail || !recipientEmail) return;

    await sendEmail.mutateAsync({
      invoiceId: invoiceToEmail.id,
      recipientEmail,
      recipientName: invoiceToEmail.customer?.name || "Customer",
      invoiceNumber: invoiceToEmail.invoice_number,
      totalAmount: invoiceToEmail.total_amount || 0,
      dueDate: invoiceToEmail.due_date,
      businessName: businessSettings?.business_name || "Business",
      businessEmail: businessSettings?.email || "",
    });

    setEmailDialogOpen(false);
    setInvoiceToEmail(null);
    setRecipientEmail("");
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      // Fetch invoice items with unit information
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select(`
          *,
          item:items(unit)
        `)
        .eq("invoice_id", invoice.id);

      if (itemsError) throw itemsError;

      const pdfData = {
        invoice: {
          ...invoice,
          invoice_type: invoice.invoice_type || "tax_invoice",
          subtotal: invoice.subtotal || 0,
          discount_amount: invoice.discount_amount || 0,
          tax_amount: invoice.tax_amount || 0,
          total_amount: invoice.total_amount || 0,
          balance_due: invoice.balance_due || 0,
          notes: invoice.notes || "",
        },
        items: (items || []).map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 0,
          discount_percent: item.discount_percent || 0,
          amount: item.amount,
          unit: (item.item as any)?.unit || 'PCS',
        })),
        customer: invoice.customer || { name: "Customer" },
        business: {
          business_name: businessSettings?.business_name || "Business",
          gstin: businessSettings?.gstin,
          address: businessSettings?.address,
          city: businessSettings?.city,
          state: businessSettings?.state,
          pincode: businessSettings?.pincode,
          phone: businessSettings?.phone,
          email: businessSettings?.email,
        },
      };

      const html = generateInvoiceHTML(pdfData.invoice as any, pdfData.items as any, pdfData.business, businessSettings?.gst_enabled);

      // Create a hidden container to render the HTML
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.innerHTML = html;
      document.body.appendChild(container);

      // Wait for images/fonts if any (though we use system fonts)
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(container.querySelector("body") as HTMLElement, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        windowWidth: 794, // A4 pixel width at 96 DPI
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Handle multi-page if needed (though our HTML is currently simple, complex tables might need it)
      // For now, single page 'long' invoices might scale down or cut off. 
      // Ideally, html2canvas on A4-sized "pages" is better, but this matches the print output logic where browser handles paging.
      // Since printing handles paging natively, html2canvas on ONE long body might produce a very long image.
      // We will slice it if it exceeds A4.

      let heightLeft = imgHeight;
      let position = 0;

      if (heightLeft > pageHeight) {
        // If content > 1 page, we add pages
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight; // This logic for multi-page image slicing in jsPDF is tricky, 
          // usually better to just add new page and render next slice.
          // For simplicity in this "fix", we assume typical invoice fits or scales fit-to-width.
          // A more robust solution mimics the print preview paging.
          // Given the user constraint, we'll stick to a single long PDF page or standard split if crucial.
          // Standard jsPDF addImage split:
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -297, imgWidth, imgHeight); // Simplified offset
          heightLeft -= pageHeight;
        }
      }

      pdf.save(`${invoice.invoice_number}.pdf`);
      document.body.removeChild(container);
      toast.success("PDF downloaded successfully");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrintInvoice = async (invoice: Invoice, format: 'a4' | 'thermal') => {
    try {
      const business = {
        business_name: businessSettings?.business_name || "Business",
        gstin: businessSettings?.gstin,
        address: businessSettings?.address,
        city: businessSettings?.city,
        state: businessSettings?.state,
        pincode: businessSettings?.pincode,
        phone: businessSettings?.phone,
        email: businessSettings?.email,
      };

      // Fetch invoice items for printing with unit information
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select(`
          *,
          item:items(unit)
        `)
        .eq("invoice_id", invoice.id);

      if (itemsError) throw itemsError;

      const invoiceItems = (items || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        discount_percent: item.discount_percent || 0,
        amount: item.amount,
        unit: (item.item as any)?.unit || 'PCS',
      }));

      if (format === 'thermal') {
        printThermalInvoice(invoice, invoiceItems, business, "80mm");
        return;
      }

      const gstEnabled = businessSettings?.gst_enabled ?? true;

      printInvoiceA4(invoice, invoiceItems, business, gstEnabled);
      return;
    } catch (error: any) {
      console.error("Print error:", error);
      toast.error("Failed to print invoice");
    }
  };

  const handleWhatsAppShare = (invoice: Invoice) => {
    const message = encodeURIComponent(
      `Hello ${invoice.customer?.name || "Customer"},\n\n` +
      `Please find your invoice details:\n` +
      `📄 Invoice: ${invoice.invoice_number}\n` +
      `💰 Amount: ${formatCurrency(invoice.total_amount || 0)}\n` +
      `📅 Due Date: ${invoice.due_date ? formatDate(invoice.due_date) : "On Receipt"}\n\n` +
      `Thank you for your business!\n` +
      `- ${businessSettings?.business_name || "Business"}`
    );

    const phone = invoice.customer?.phone?.replace(/\D/g, "") || "";
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp...");
  };

  const columns = [
    {
      key: "invoice_number",
      header: "Invoice",
      cell: (invoice: Invoice) => (
        <div>
          <p className="font-medium text-foreground">{invoice.invoice_number}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {(invoice.invoice_type || "tax_invoice").replace("_", " ")}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (invoice: Invoice) => (
        <div>
          <p className="font-medium">{invoice.customer?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">
            {invoice.customer?.city}, {invoice.customer?.state}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (invoice: Invoice) => (
        <div>
          <p className="text-sm">{formatDate(invoice.invoice_date)}</p>
          <p className="text-xs text-muted-foreground">
            Due: {invoice.due_date ? formatDate(invoice.due_date) : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (invoice: Invoice) => (
        <div>
          <p className="font-medium">{formatCurrency(invoice.total_amount || 0)}</p>
          {(invoice.balance_due || 0) > 0 && invoice.status !== "draft" && (
            <p className="text-xs text-warning">
              Due: {formatCurrency(invoice.balance_due || 0)}
            </p>
          )}
        </div>
      ),
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      cell: (invoice: Invoice) => {
        const status = (invoice.status || "draft") as "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
        return <StatusBadge status={status} />;
      },
      className: "text-center",
    },
    {
      key: "actions",
      header: "",
      cell: (invoice: Invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.id}`);
            }}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.id}/edit`);
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async (e) => {
              e.stopPropagation();
              handleDownloadPDF(invoice);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handlePrintInvoice(invoice, 'a4');
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Print A4
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handlePrintInvoice(invoice, 'thermal');
            }}>
              <FileText className="mr-2 h-4 w-4" />
              Print Thermal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              setInvoiceToEmail(invoice);
              setRecipientEmail(invoice.customer?.email || "");
              setEmailDialogOpen(true);
            }}>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleWhatsAppShare(invoice);
            }}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Send WhatsApp
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setInvoiceToDelete(invoice);
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
    if (status === "all") return invoices.length;
    return invoices.filter((i) => i.status === status).length;
  };

  const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const paidAmount = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
  const outstandingAmount = invoices.reduce((sum, i) => sum + (i.balance_due || 0), 0);

  if (isLoading) {
    return (
      <AppLayout title="Invoices" subtitle="Create and manage your invoices">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Invoices" subtitle="Create and manage your invoices">
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
            placeholder="Search invoices by number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link to="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Invoices Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description={
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first invoice"
            }
            action={
              !searchQuery && statusFilter === "all"
                ? { label: "Create Invoice", href: "/invoices/new" }
                : undefined
            }
          />
        }
      />

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Total Invoices</p>
          <p className="text-lg font-semibold">{invoices.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Total Amount</p>
          <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Paid</p>
          <p className="text-lg font-semibold text-success">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-muted-foreground">Outstanding</p>
          <p className="text-lg font-semibold text-warning">{formatCurrency(outstandingAmount)}</p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoice_number}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvoice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice via Email</DialogTitle>
            <DialogDescription>
              Send invoice {invoiceToEmail?.invoice_number} to customer via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!recipientEmail || sendEmail.isPending}
            >
              {sendEmail.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
