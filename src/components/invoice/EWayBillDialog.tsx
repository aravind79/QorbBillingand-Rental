import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateEWayBill } from "@/hooks/useEWayBill";
import { downloadEWayBillPDF, EWayBillData } from "@/lib/ewayBillGenerator";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { calculateEWayBillValidity, getPlaceOfSupply } from "@/lib/helpers";

interface EWayBillDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any;
    businessInfo: any;
}

export function EWayBillDialog({ open, onOpenChange, invoice, businessInfo }: EWayBillDialogProps) {
    const [transportMode, setTransportMode] = useState<"road" | "rail" | "air" | "ship">("road");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [transporterName, setTransporterName] = useState("");
    const [transporterId, setTransporterId] = useState("");
    const [distanceKm, setDistanceKm] = useState<number>(100);

    const generateMutation = useGenerateEWayBill();

    const handleGenerate = async () => {
        if (!invoice) return;

        // Validate inputs
        if (transportMode === "road" && !vehicleNumber) {
            toast.error("Vehicle number is required for road transport");
            return;
        }

        if (distanceKm <= 0) {
            toast.error("Distance must be greater than 0");
            return;
        }

        try {
            // Generate e-way bill in database
            const result = await generateMutation.mutateAsync({
                invoice_id: invoice.id,
                transport_mode: transportMode,
                vehicle_number: vehicleNumber || undefined,
                transporter_name: transporterName || undefined,
                transporter_id: transporterId || undefined,
                distance_km: distanceKm,
            });

            // Prepare data for PDF
            const ewayBillData: EWayBillData = {
                invoiceNumber: invoice.invoice_number,
                invoiceDate: invoice.invoice_date,
                invoiceType: "tax_invoice",

                supplierName: businessInfo.business_name,
                supplierGSTIN: businessInfo.gstin || "",
                supplierAddress: businessInfo.address || "",
                supplierCity: businessInfo.city || "",
                supplierState: businessInfo.state || "",
                supplierPincode: businessInfo.pincode || "",

                recipientName: invoice.customer?.name || "",
                recipientGSTIN: invoice.customer?.gstin || "",
                recipientAddress: invoice.customer?.billing_address || "",
                recipientCity: invoice.customer?.city || "",
                recipientState: invoice.customer?.state || "",
                recipientPincode: invoice.customer?.pincode || "",

                placeOfSupply: invoice.place_of_supply || getPlaceOfSupply(businessInfo.state || "27"),
                consignmentValue: invoice.total_amount,
                hsnCodes: invoice.invoice_items?.map((item: any) => item.hsn_sac_code).filter(Boolean) || [],
                items: invoice.invoice_items?.map((item: any) => ({
                    description: item.description,
                    hsnCode: item.hsn_sac_code || "",
                    quantity: item.quantity,
                    taxableValue: item.amount - (item.cgst_amount || 0) - (item.sgst_amount || 0) - (item.igst_amount || 0),
                })) || [],

                cgst: invoice.cgst_amount || 0,
                sgst: invoice.sgst_amount || 0,
                igst: invoice.igst_amount || 0,
                totalTax: invoice.tax_amount || 0,

                transportMode,
                vehicleNumber: vehicleNumber || undefined,
                transporterName: transporterName || undefined,
                transporterId: transporterId || undefined,
                distanceKm,

                ewayBillNumber: result.ewayBillNumber,
                validityDate: result.validityDate,
            };

            // Generate and download PDF
            await downloadEWayBillPDF(ewayBillData);

            // Close dialog
            onOpenChange(false);

            // Reset form
            setVehicleNumber("");
            setTransporterName("");
            setTransporterId("");
            setDistanceKm(100);
        } catch (error: any) {
            console.error("E-Way Bill generation error:", error);
        }
    };

    const validityDays = calculateEWayBillValidity(distanceKm);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Generate E-Way Bill
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Invoice Info */}
                    <div className="rounded-lg bg-muted p-3 space-y-1">
                        <p className="text-sm font-medium">Invoice: {invoice?.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                            Amount: ₹{invoice?.total_amount?.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            E-way bill is required for consignments ≥ ₹50,000
                        </p>
                    </div>

                    {/* Transport Mode */}
                    <div className="space-y-2">
                        <Label htmlFor="transport-mode">Transport Mode *</Label>
                        <Select value={transportMode} onValueChange={(value: any) => setTransportMode(value)}>
                            <SelectTrigger id="transport-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="road">Road</SelectItem>
                                <SelectItem value="rail">Rail</SelectItem>
                                <SelectItem value="air">Air</SelectItem>
                                <SelectItem value="ship">Ship</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vehicle Number (required for road) */}
                    {transportMode === "road" && (
                        <div className="space-y-2">
                            <Label htmlFor="vehicle-number">Vehicle Number *</Label>
                            <Input
                                id="vehicle-number"
                                placeholder="MH12AB1234"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                maxLength={15}
                            />
                        </div>
                    )}

                    {/* Transporter Name */}
                    <div className="space-y-2">
                        <Label htmlFor="transporter-name">Transporter Name</Label>
                        <Input
                            id="transporter-name"
                            placeholder="ABC Transport Services"
                            value={transporterName}
                            onChange={(e) => setTransporterName(e.target.value)}
                        />
                    </div>

                    {/* Transporter ID */}
                    <div className="space-y-2">
                        <Label htmlFor="transporter-id">Transporter ID / GSTIN</Label>
                        <Input
                            id="transporter-id"
                            placeholder="27AABCT1234F1Z5"
                            value={transporterId}
                            onChange={(e) => setTransporterId(e.target.value.toUpperCase())}
                            maxLength={15}
                        />
                    </div>

                    {/* Distance */}
                    <div className="space-y-2">
                        <Label htmlFor="distance">Approximate Distance (km) *</Label>
                        <Input
                            id="distance"
                            type="number"
                            min="1"
                            value={distanceKm}
                            onChange={(e) => setDistanceKm(parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Validity: {validityDays} day{validityDays > 1 ? 's' : ''}
                            {distanceKm > 100 && ` (1 day for first 100km + ${validityDays - 1} day${validityDays > 2 ? 's' : ''} for additional distance)`}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                    >
                        {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate E-Way Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
