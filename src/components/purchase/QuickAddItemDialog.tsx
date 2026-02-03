import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { useCreateItem } from "@/hooks/useItems";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const quickItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  purchase_price: z.coerce.number().min(0, "Purchase price must be positive"),
  sale_price: z.coerce.number().min(0, "Sale price must be positive"),
  tax_rate: z.coerce.number().min(0).max(100).default(18),
  unit: z.string().default("PCS"),
});

type QuickItemFormValues = z.infer<typeof quickItemSchema>;

interface QuickAddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onItemCreated: (itemId: string, item: { name: string; purchase_price: number; tax_rate: number }) => void;
}

const UNITS = ["PCS", "KG", "G", "L", "ML", "M", "CM", "BOX", "SET", "PACK"];

export function QuickAddItemDialog({ open, onClose, onItemCreated }: QuickAddItemDialogProps) {
  const createItem = useCreateItem();
  const { toast } = useToast();

  const form = useForm<QuickItemFormValues>({
    resolver: zodResolver(quickItemSchema),
    defaultValues: {
      name: "",
      sku: "",
      purchase_price: 0,
      sale_price: 0,
      tax_rate: 18,
      unit: "PCS",
    },
  });

  const onSubmit = async (values: QuickItemFormValues) => {
    try {
      const result = await createItem.mutateAsync({
        name: values.name,
        sku: values.sku || null,
        purchase_price: values.purchase_price,
        sale_price: values.sale_price,
        tax_rate: values.tax_rate,
        unit: values.unit,
        item_type: "product",
        is_active: true,
      });

      toast({ title: "Item created successfully" });
      
      // Call callback with new item details
      onItemCreated(result.id, {
        name: values.name,
        purchase_price: values.purchase_price,
        tax_rate: values.tax_rate,
      });

      form.reset();
      onClose();
    } catch (error) {
      toast({ title: "Failed to create item", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Item</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tax_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" max="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createItem.isPending}>
                {createItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
