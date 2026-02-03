import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, MessageCircle, X, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { generateLabelPDF, downloadLabelPDF } from "@/lib/labelPdfGenerator";
import { toast } from "sonner";

interface RentalData {
  id: string;
  rental_number: string;
  customer_name: string;
  customer_phone?: string;
  rental_start_date: string;
  rental_end_date: string;
  total_amount: number;
  security_deposit: number;
  items: Array<{
    name: string;
    quantity: number;
    rate_amount: number;
    rental_days: number;
  }>;
  business_name: string;
  business_phone?: string;
}

interface StartRentalDialogProps {
  open: boolean;
  onClose: () => void;
  rental: RentalData;
  onComplete?: () => void;
}

export function StartRentalDialog({
  open,
  onClose,
  rental,
  onComplete,
}: StartRentalDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const blob = await generateLabelPDF(rental);
      downloadLabelPDF(blob, `${rental.rental_number}-label.pdf`);
      toast.success("Label PDF downloaded");
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to generate label");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWhatsApp = () => {
    if (!rental.customer_phone) {
      toast.error("Customer phone number not available");
      return;
    }

    const phone = rental.customer_phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `*Rental Receipt*\n\n` +
      `Rental #: ${rental.rental_number}\n` +
      `Customer: ${rental.customer_name}\n\n` +
      `*Items:*\n` +
      rental.items.map(item => 
        `- ${item.name} x${item.quantity} @ ${formatCurrency(item.rate_amount)}/day × ${item.rental_days} days`
      ).join("\n") +
      `\n\n*Period:* ${formatDate(rental.rental_start_date)} to ${formatDate(rental.rental_end_date)}\n` +
      `*Total Rent:* ${formatCurrency(rental.total_amount)}\n` +
      `*Security Deposit:* ${formatCurrency(rental.security_deposit)}\n` +
      `*Total Paid:* ${formatCurrency(rental.total_amount + rental.security_deposit)}\n\n` +
      `Thank you for choosing ${rental.business_name}!\n` +
      (rental.business_phone ? `Contact: ${rental.business_phone}` : "")
    );

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    toast.success("WhatsApp opened");
  };

  const handleClose = () => {
    onClose();
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            ✓ Rental Started Successfully
          </DialogTitle>
          <DialogDescription>
            Rental {rental.rental_number} is now active
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <p className="font-medium">{rental.customer_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(rental.rental_start_date)} → {formatDate(rental.rental_end_date)}
            </p>
            <div className="flex justify-between text-sm">
              <span>Total Rent:</span>
              <span className="font-medium">{formatCurrency(rental.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Security Deposit:</span>
              <span className="font-medium">{formatCurrency(rental.security_deposit)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Printer className="h-6 w-6" />
              )}
              <span className="text-xs">Print Label</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">Send WhatsApp</span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
