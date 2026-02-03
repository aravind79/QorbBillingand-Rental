import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useRentals, type RentalInvoice } from "@/hooks/useRentals";
import { formatCurrency, formatDate } from "@/lib/helpers";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function RentalReturnsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalInvoice | null>(null);
  const [returnCondition, setReturnCondition] = useState("good");
  const [damageNotes, setDamageNotes] = useState("");
  const [damageCharges, setDamageCharges] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const { data: rentals = [], isLoading } = useRentals();

  // Filter only active and overdue rentals
  const activeRentals = rentals.filter(
    (r) => r.rental_status === "active" || r.rental_status === "overdue"
  );

  const filteredRentals = activeRentals.filter((rental) => {
    const matchesSearch =
      rental.rental_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleProcessReturn = (rental: RentalInvoice) => {
    setSelectedRental(rental);
    setReturnCondition("good");
    setDamageNotes("");
    setDamageCharges(0);
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedRental) return;
    setIsProcessing(true);
    if (!selectedRental) return;

    const today = new Date().toISOString().split("T")[0];
    const daysLate = differenceInDays(new Date(), new Date(selectedRental.rental_end_date));
    const lateFees = daysLate > 0 ? daysLate * (selectedRental.late_fee_per_day || 0) : 0;
    const depositRefund = (selectedRental.security_deposit || 0) - damageCharges;

    try {
      // Update rental status
      const { error } = await supabase
        .from("rental_invoices")
        .update({
          rental_status: "returned",
          actual_return_date: today,
          return_condition: returnCondition,
          damage_charges: damageCharges,
          late_fees: lateFees,
          deposit_refunded: depositRefund > 0 ? depositRefund : 0,
        })
        .eq("id", selectedRental.id);

      if (error) throw error;

      // Restore inventory - get rental items and increase stock
      const { data: rentalItems } = await supabase
        .from("rental_items")
        .select("item_id, quantity")
        .eq("rental_invoice_id", selectedRental.id);

      if (rentalItems) {
        for (const item of rentalItems) {
          if (item.item_id) {
            // Get current stock
            const { data: itemData } = await supabase
              .from("items")
              .select("quantity_available_for_rent")
              .eq("id", item.item_id)
              .single();

            if (itemData) {
              await supabase
                .from("items")
                .update({ 
                  quantity_available_for_rent: (itemData.quantity_available_for_rent || 0) + (item.quantity || 1)
                })
                .eq("id", item.item_id);
            }
          }
        }
      }

      toast.success("Return processed successfully");
      setReturnDialogOpen(false);
      setSelectedRental(null);
      // Refresh the page data
      window.location.reload();
    } catch (error: any) {
      console.error("Return error:", error);
      toast.error(error.message || "Failed to process return");
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      key: "rental_number",
      header: "Rental #",
      cell: (rental: RentalInvoice) => (
        <div>
          <p className="font-mono font-medium">{rental.rental_number}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(rental.rental_start_date)}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (rental: RentalInvoice) => (
        <div>
          <p className="font-medium">{rental.customer?.name || "Walk-in Customer"}</p>
          <p className="text-xs text-muted-foreground">{rental.customer?.phone}</p>
        </div>
      ),
    },
    {
      key: "due_date",
      header: "Due Date",
      cell: (rental: RentalInvoice) => {
        const isOverdue = new Date(rental.rental_end_date) < new Date();
        const daysOverdue = isOverdue
          ? differenceInDays(new Date(), new Date(rental.rental_end_date))
          : 0;
        return (
          <div>
            <p className={isOverdue ? "text-destructive font-medium" : ""}>
              {formatDate(rental.rental_end_date)}
            </p>
            {isOverdue && (
              <p className="text-xs text-destructive">{daysOverdue} days overdue</p>
            )}
          </div>
        );
      },
    },
    {
      key: "deposit",
      header: "Deposit",
      cell: (rental: RentalInvoice) => (
        <span className="font-medium">
          {formatCurrency(rental.security_deposit || 0)}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "status",
      header: "Status",
      cell: (rental: RentalInvoice) => {
        const isOverdue = rental.rental_status === "overdue";
        return (
          <Badge variant={isOverdue ? "destructive" : "default"}>
            {isOverdue ? (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                Active
              </>
            )}
          </Badge>
        );
      },
      className: "text-center",
    },
    {
      key: "actions",
      header: "",
      cell: (rental: RentalInvoice) => (
        <Button size="sm" onClick={() => handleProcessReturn(rental)}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Process Return
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <AppLayout title="Rental Returns" subtitle="Process item returns and refunds">
      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by rental number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Returns Table */}
      <DataTable
        columns={columns}
        data={filteredRentals}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={RotateCcw}
            title="No pending returns"
            description="All items have been returned"
          />
        }
      />

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {filteredRentals.filter((r) => r.rental_status === "overdue").length} overdue,{" "}
          {filteredRentals.filter((r) => r.rental_status === "active").length} active
        </p>
        <p>
          Total deposits held:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(
              filteredRentals.reduce((sum, r) => sum + (r.security_deposit || 0), 0)
            )}
          </span>
        </p>
      </div>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              {selectedRental?.rental_number} - {selectedRental?.customer?.name || "Walk-in"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Return Condition</Label>
              <Select value={returnCondition} onValueChange={setReturnCondition}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - No issues</SelectItem>
                  <SelectItem value="good">Good - Minor wear</SelectItem>
                  <SelectItem value="fair">Fair - Normal wear</SelectItem>
                  <SelectItem value="damaged">Damaged - Requires repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {returnCondition === "damaged" && (
              <>
                <div>
                  <Label>Damage Notes</Label>
                  <Textarea
                    placeholder="Describe the damage..."
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Damage Charges</Label>
                  <Input
                    type="number"
                    value={damageCharges}
                    onChange={(e) => setDamageCharges(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>
              </>
            )}

            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Security Deposit</span>
                <span>{formatCurrency(selectedRental?.security_deposit || 0)}</span>
              </div>
              {damageCharges > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Damage Charges</span>
                  <span>-{formatCurrency(damageCharges)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Refund Amount</span>
                <span className="text-success">
                  {formatCurrency(
                    Math.max(0, (selectedRental?.security_deposit || 0) - damageCharges)
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn} disabled={isProcessing}>
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
