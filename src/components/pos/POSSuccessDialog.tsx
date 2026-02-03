import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, MessageCircle, CheckCircle, Loader2 } from "lucide-react";
import type { ThermalPaperWidth } from "@/lib/thermalPrinter";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax_rate: number;
}

interface BusinessInfo {
  business_name: string;
  gstin?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  upi_id?: string | null;
}

interface POSSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  paymentMethod: string;
  cart: CartItem[];
  business: BusinessInfo | null;
  paperWidth?: ThermalPaperWidth;
}

export function POSSuccessDialog({
  open,
  onClose,
  invoiceNumber,
  total,
  subtotal,
  taxAmount,
  paymentMethod,
  cart,
  business,
  paperWidth = "80mm",
}: POSSuccessDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!business) return;
    setIsPrinting(true);

    try {
      // Dynamically import to avoid circular dependencies
      const { printThermalInvoice } = await import("@/lib/thermalPrinter");
      
      // Create invoice object for thermal printing
      const invoice = {
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split("T")[0],
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        paid_amount: total,
        balance_due: 0,
        notes: `Payment: ${paymentMethod.toUpperCase()}`,
        customer: null,
      };

      const items = cart.map((item) => ({
        description: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        tax_rate: item.tax_rate,
        discount_percent: 0,
        amount: item.price * item.quantity,
      }));

      const businessInfo = {
        business_name: business.business_name,
        gstin: business.gstin || undefined,
        address: business.address || undefined,
        city: business.city || undefined,
        state: business.state || undefined,
        pincode: business.pincode || undefined,
        phone: business.phone || undefined,
      };

      printThermalInvoice(invoice as any, items, businessInfo, paperWidth);
    } catch (error) {
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWhatsApp = () => {
    // Create message with invoice details
    const itemsList = cart
      .map((item) => `• ${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    const message = encodeURIComponent(
      `🧾 *Invoice: ${invoiceNumber}*\n\n` +
        `${itemsList}\n\n` +
        `Subtotal: ₹${subtotal.toFixed(2)}\n` +
        `Tax: ₹${taxAmount.toFixed(2)}\n` +
        `*Total: ₹${total.toFixed(2)}*\n\n` +
        `Payment: ${paymentMethod.toUpperCase()}\n` +
        `Thank you for your purchase!`
    );

    // Open WhatsApp with the message
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Sale Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="font-mono font-semibold">{invoiceNumber}</p>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="capitalize">{paymentMethod}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePrint}
              disabled={isPrinting || !business}
            >
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Print Receipt
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            New Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
