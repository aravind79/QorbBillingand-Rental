import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useRecurringInvoice, useCreateRecurringInvoice, useUpdateRecurringInvoice } from "@/hooks/useRecurringInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { format, addMonths, addDays } from "date-fns";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customer_id: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  next_run_date: z.string().min(1, "Next run date is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  is_active: z.boolean().default(true),
  auto_send_email: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RecurringInvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: invoice, isLoading: invoiceLoading } = useRecurringInvoice(id);
  const { data: customers = [] } = useCustomers();
  const createInvoice = useCreateRecurringInvoice();
  const updateInvoice = useUpdateRecurringInvoice();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_id: "",
      frequency: "monthly",
      next_run_date: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
      amount: 0,
      is_active: true,
      auto_send_email: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        title: invoice.title,
        customer_id: invoice.customer_id || "",
        frequency: invoice.frequency as FormData["frequency"],
        next_run_date: invoice.next_run_date || format(addMonths(new Date(), 1), "yyyy-MM-dd"),
        amount: invoice.amount || 0,
        is_active: invoice.is_active,
        auto_send_email: invoice.auto_send_email,
        notes: invoice.notes || "",
      });
    }
  }, [invoice, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && id) {
        await updateInvoice.mutateAsync({ 
          id, 
          ...data,
          customer_id: data.customer_id || null,
        });
      } else {
        await createInvoice.mutateAsync({
          title: data.title,
          customer_id: data.customer_id || null,
          frequency: data.frequency,
          next_run_date: data.next_run_date,
          amount: data.amount,
          is_active: data.is_active,
          auto_send_email: data.auto_send_email,
          notes: data.notes,
        });
      }
      navigate("/recurring-invoices");
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (invoiceLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <AppLayout
      title={isEditing ? "Edit Recurring Invoice" : "New Recurring Invoice"}
      subtitle={isEditing ? `Update ${invoice?.title}` : "Set up automated billing"}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Monthly Retainer - Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_run_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Run Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Base amount for the recurring invoice</FormDescription>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>Enable automatic invoice generation</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auto_send_email"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-send Email</FormLabel>
                      <FormDescription>Automatically email invoice to customer</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate("/recurring-invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update" : "Create"} Recurring Invoice
            </Button>
          </div>
        </form>
      </Form>
    </AppLayout>
  );
}
