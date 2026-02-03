import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Printer, FileText, X, Check } from "lucide-react";
import { Invoice } from "@/hooks/useInvoices";
import { printInvoiceA4 } from "@/lib/invoicePrinter";
import { printThermalInvoice } from "@/lib/thermalPrinter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BusinessInfo {
  business_name: string;
  gstin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number | null;
  discount_percent: number | null;
  amount: number;
  unit?: string;
}

interface InvoiceActionsDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  items: InvoiceItem[];
  business: BusinessInfo;
  gstEnabled?: boolean;
}

type ThermalSize = "58mm" | "80mm" | "3inch";

export function InvoiceActionsDialog({
  open,
  onClose,
  invoice,
  items,
  business,
  gstEnabled = true,
}: InvoiceActionsDialogProps) {
  const [thermalSize, setThermalSize] = useState<ThermalSize>("80mm");
  const [sending, setSending] = useState(false);

  if (!invoice) return null;

  const handlePrintA4 = () => {
    printInvoiceA4(invoice, items, business, gstEnabled);
    toast.success("Printing A4 invoice...");
  };

  const handlePrintThermal = () => {
    printThermalInvoice(invoice, items, business, thermalSize);
    toast.success(`Printing ${thermalSize} thermal receipt...`);
  };

  const handleSendEmail = async () => {
    if (!invoice.customer?.email) {
      toast.error("Customer email not available");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoiceId: invoice.id },
      });

      if (error) throw error;
      toast.success(`Invoice sent to ${invoice.customer.email}`);
    } catch (error: any) {
      console.error("Email error:", error);
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = () => {
    const phone = invoice.customer?.phone?.replace(/\D/g, "");
    if (!phone) {
      toast.error("Customer phone number not available");
      return;
    }

    const message = encodeURIComponent(
      `Hello ${invoice.customer?.name || ""},\n\n` +
      `Your invoice ${invoice.invoice_number} for ₹${(invoice.total_amount || 0).toLocaleString()} is ready.\n\n` +
      `Thank you for your business!\n${business.business_name}`
    );

    const whatsappUrl = `https://wa.me/${phone.startsWith("91") ? phone : `91${phone}`}?text=${message}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp...");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            Invoice {invoice.invoice_number} Created
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Send Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Send Invoice</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={handleSendEmail}
                disabled={sending || !invoice.customer?.email}
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={handleSendWhatsApp}
                disabled={!invoice.customer?.phone}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Print Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Print Invoice</Label>

            {/* A4 Print */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handlePrintA4}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">A4 Format</div>
                <div className="text-xs text-muted-foreground">Full page invoice</div>
              </div>
            </Button>

            {/* Thermal Print */}
            <div className="flex gap-2">
              <Select value={thermalSize} onValueChange={(v) => setThermalSize(v as ThermalSize)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm</SelectItem>
                  <SelectItem value="80mm">80mm</SelectItem>
                  <SelectItem value="3inch">3 inch</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="flex-1 justify-start gap-3 h-10"
                onClick={handlePrintThermal}
              >
                <Printer className="h-5 w-5" />
                <div className="text-left">
                  <div className="text-sm font-medium">Thermal Receipt</div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t">
          <Button onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
