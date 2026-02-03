import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, ShoppingCart, Trash2, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax_rate: number;
}

interface HeldBill {
  id: string;
  cart: CartItem[];
  timestamp: Date;
  name?: string;
}

interface HeldBillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heldBills: HeldBill[];
  onRecall: (billId: string) => void;
  onDiscard: (billId: string) => void;
}

export function HeldBillsDialog({
  open,
  onOpenChange,
  heldBills,
  onRecall,
  onDiscard,
}: HeldBillsDialogProps) {
  const calculateTotal = (cart: CartItem[]) => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const tax = (itemTotal * item.tax_rate) / 100;
      return sum + itemTotal + tax;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Held Bills ({heldBills.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {heldBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No held bills</p>
            </div>
          ) : (
            <div className="space-y-3">
              {heldBills.map((bill) => (
                <div
                  key={bill.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{bill.name || `Bill #${bill.id.slice(-4)}`}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(bill.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {bill.cart.length} items
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1 border-t pt-2">
                    {bill.cart.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-muted-foreground">
                        <span className="truncate">{item.name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {bill.cart.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{bill.cart.length - 3} more items
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-primary">
                      ₹{calculateTotal(bill.cart).toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDiscard(bill.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          onRecall(bill.id);
                          onOpenChange(false);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recall
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
