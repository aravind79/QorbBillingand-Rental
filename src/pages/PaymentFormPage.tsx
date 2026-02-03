import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft, CreditCard } from "lucide-react";
import { useCreatePayment, useUnpaidInvoices } from "@/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/helpers";

const paymentSchema = z.object({
  invoice_id: z.string().min(1, "Please select an invoice"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum(["cash", "upi", "card", "bank_transfer", "cheque", "credit"]),
  reference_number: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "credit", label: "Credit" },
];

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const { data: unpaidInvoices = [], isLoading: invoicesLoading } = useUnpaidInvoices();
  const createPayment = useCreatePayment();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: "",
      amount: 0,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "bank_transfer",
      reference_number: "",
      notes: "",
    },
  });

  const selectedInvoiceId = form.watch("invoice_id");
  const selectedInvoice = unpaidInvoices.find((inv) => inv.id === selectedInvoiceId);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await createPayment.mutateAsync({
        invoice_id: data.invoice_id,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method,
        reference_number: data.reference_number || null,
        notes: data.notes || null,
      });
      navigate("/payments");
    } catch (error) {
      // Error handled in mutation
    }
  };

  const setFullAmount = () => {
    if (selectedInvoice) {
      form.setValue("amount", selectedInvoice.balance_due || 0);
    }
  };

  return (
    <AppLayout title="Record Payment" subtitle="Record a payment against an invoice">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {invoicesLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                        ) : unpaidInvoices.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No unpaid invoices</div>
                        ) : (
                          unpaidInvoices.map((inv) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span>{inv.invoice_number}</span>
                                <span className="text-muted-foreground">
                                  {inv.customers?.name} - Due: {formatCurrency(inv.balance_due || 0)}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedInvoice && (
                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{selectedInvoice.customers?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice Total</span>
                    <span>{formatCurrency(selectedInvoice.total_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span className="font-medium text-warning">
                      {formatCurrency(selectedInvoice.balance_due || 0)}
                    </span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹) *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      {selectedInvoice && (
                        <Button type="button" variant="outline" onClick={setFullAmount}>
                          Full Amount
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction ID, Cheque No., etc." {...field} />
                    </FormControl>
                    <FormDescription>Optional reference for this payment</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/payments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </form>
      </Form>
    </AppLayout>
  );
}
