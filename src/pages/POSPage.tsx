import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useItems } from "@/hooks/useItems";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { POSSuccessDialog } from "@/components/pos/POSSuccessDialog";
import { HeldBillsDialog } from "@/components/pos/HeldBillsDialog";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  Receipt,
  Loader2,
  Pause,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

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

const CATEGORIES = ["All", "Electronics", "Accessories", "Services", "Software", "Hardware", "Other"];

export default function POSPage() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useItems();
  const createInvoice = useCreateInvoice();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [showPayment, setShowPayment] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState("");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<string | null>(null);

  // Fetch business settings for thermal printing
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Filter active products only
  const activeItems = useMemo(() => {
    return items.filter((item) => item.is_active && item.item_type === "product");
  }, [items]);

  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||
        item.barcode?.includes(search);
      const matchesCategory = category === "All" || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [activeItems, search, category]);

  const addToCart = (item: typeof items[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.sale_price,
        quantity: 1,
        tax_rate: item.tax_rate || 0,
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartItemPrice = (id: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, price: newPrice } : item
      )
    );
  };

  const updateCartItemQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
  };

  const holdBill = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    const newHeld: HeldBill = {
      id: Date.now().toString(),
      cart: [...cart],
      timestamp: new Date(),
      name: `Bill ${heldBills.length + 1}`,
    };
    setHeldBills([...heldBills, newHeld]);
    setCart([]);
    toast({ title: "Bill held", description: `${newHeld.name} saved` });
  };

  const recallBill = (billId: string) => {
    const bill = heldBills.find((b) => b.id === billId);
    if (bill) {
      if (cart.length > 0) {
        holdBill();
      }
      setCart(bill.cart);
      setHeldBills(heldBills.filter((b) => b.id !== billId));
    }
  };

  const discardBill = (billId: string) => {
    setHeldBills(heldBills.filter((b) => b.id !== billId));
    toast({ title: "Bill discarded" });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    return sum + (itemTotal * item.tax_rate) / 100;
  }, 0);
  const total = subtotal + taxAmount;
  const change = parseFloat(amountReceived || "0") - total;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    setShowPayment(true);
    setAmountReceived(total.toFixed(2));
  };

  const processPayment = async () => {
    try {
      const invoiceNumber = `POS-${format(new Date(), "yyyyMMdd-HHmmss")}`;
      
      await createInvoice.mutateAsync({
        invoice_number: invoiceNumber,
        invoice_date: format(new Date(), "yyyy-MM-dd"),
        status: "paid",
        document_type: "invoice",
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        paid_amount: total,
        balance_due: 0,
        notes: `POS Sale - Payment: ${paymentMethod.toUpperCase()}`,
        items: cart.map((item) => ({
          item_id: item.id,
          description: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          tax_rate: item.tax_rate,
          discount_percent: 0,
          amount: item.price * item.quantity,
        })),
      });

      setLastInvoiceNumber(invoiceNumber);
      setShowPayment(false);
      setShowSuccess(true);
    } catch (error) {
      toast({ title: "Error processing sale", variant: "destructive" });
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCart([]);
    setAmountReceived("");
  };

  if (isLoading) {
    return (
      <AppLayout title="Point of Sale">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Point of Sale" subtitle="Fast checkout for retail sales">
      <div className="grid h-[calc(100vh-180px)] gap-4 lg:grid-cols-3">
        {/* Products Grid */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-3">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.sku || "No SKU"}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-primary">₹{item.sale_price}</span>
                      {(item.current_stock || 0) <= 5 && (
                        <Badge variant="secondary" className="text-xs">Low</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No items found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Cart */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHeldBills(true)}
                  className="relative"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Held
                  {heldBills.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {heldBills.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={holdBill}
                  disabled={cart.length === 0}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Hold
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 -mx-4 px-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cart is empty
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {editingPrice === item.id ? (
                            <Input
                              type="number"
                              className="h-6 w-16 text-xs"
                              defaultValue={item.price}
                              autoFocus
                              onBlur={(e) => {
                                updateCartItemPrice(item.id, parseFloat(e.target.value) || item.price);
                                setEditingPrice(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateCartItemPrice(item.id, parseFloat((e.target as HTMLInputElement).value) || item.price);
                                  setEditingPrice(null);
                                }
                              }}
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-primary"
                              onClick={() => setEditingPrice(item.id)}
                            >
                              ₹{item.price}
                            </span>
                          )}
                          <span>×</span>
                          {editingQty === item.id ? (
                            <Input
                              type="number"
                              className="h-6 w-12 text-xs"
                              defaultValue={item.quantity}
                              autoFocus
                              onBlur={(e) => {
                                updateCartItemQty(item.id, parseInt(e.target.value) || 1);
                                setEditingQty(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateCartItemQty(item.id, parseInt((e.target as HTMLInputElement).value) || 1);
                                  setEditingQty(null);
                                }
                              }}
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-primary"
                              onClick={() => setEditingQty(item.id)}
                            >
                              {item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              <Receipt className="mr-2 h-5 w-5" />
              Checkout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-3xl font-bold text-primary">₹{total.toFixed(2)}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="flex flex-col h-16 gap-1"
              >
                <Banknote className="h-5 w-5" />
                <span className="text-xs">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex flex-col h-16 gap-1"
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-xs">Card</span>
              </Button>
              <Button
                variant={paymentMethod === "upi" ? "default" : "outline"}
                onClick={() => setPaymentMethod("upi")}
                className="flex flex-col h-16 gap-1"
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-xs">UPI</span>
              </Button>
            </div>

            {paymentMethod === "cash" && (
              <>
                <div>
                  <label className="text-sm font-medium">Amount Received</label>
                  <Input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="text-lg"
                  />
                </div>
                {change >= 0 && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Change</div>
                    <div className="text-xl font-semibold">₹{change.toFixed(2)}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              disabled={createInvoice.isPending || (paymentMethod === "cash" && change < 0)}
            >
              {createInvoice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Print/WhatsApp */}
      <POSSuccessDialog
        open={showSuccess}
        onClose={handleSuccessClose}
        invoiceNumber={lastInvoiceNumber}
        total={total}
        subtotal={subtotal}
        taxAmount={taxAmount}
        paymentMethod={paymentMethod}
        cart={cart}
        business={businessSettings}
      />

      {/* Held Bills Dialog */}
      <HeldBillsDialog
        open={showHeldBills}
        onOpenChange={setShowHeldBills}
        heldBills={heldBills}
        onRecall={recallBill}
        onDiscard={discardBill}
      />
    </AppLayout>
  );
}
