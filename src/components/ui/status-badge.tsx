import { cn } from "@/lib/utils";
import { InvoiceStatus, PaymentMethod } from "@/types";

export type ExtendedStatus = InvoiceStatus | "converted" | "expired" | "active" | "booked" | "returned";

interface StatusBadgeProps {
  status: ExtendedStatus;
}

const statusConfig: Record<ExtendedStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-secondary text-secondary-foreground",
  },
  sent: {
    label: "Sent",
    className: "bg-info/10 text-info border-info/20",
  },
  paid: {
    label: "Paid",
    className: "bg-success/10 text-success border-success/20",
  },
  partial: {
    label: "Partial",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
  converted: {
    label: "Converted",
    className: "bg-success/10 text-success border-success/20",
  },
  expired: {
    label: "Expired",
    className: "bg-muted text-muted-foreground",
  },
  active: {
    label: "Active",
    className: "bg-info/10 text-info border-info/20",
  },
  booked: {
    label: "Booked",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  returned: {
    label: "Returned",
    className: "bg-success/10 text-success border-success/20",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
}

const paymentMethodConfig: Record<PaymentMethod, { label: string; className: string }> = {
  cash: {
    label: "Cash",
    className: "bg-success/10 text-success border-success/20",
  },
  upi: {
    label: "UPI",
    className: "bg-info/10 text-info border-info/20",
  },
  card: {
    label: "Card",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  bank_transfer: {
    label: "Bank Transfer",
    className: "bg-secondary text-secondary-foreground",
  },
  cheque: {
    label: "Cheque",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  credit: {
    label: "Credit",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  const config = paymentMethodConfig[method];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
