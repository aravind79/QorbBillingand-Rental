import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { useCreatePurchase, usePurchase } from "@/hooks/usePurchases";
import { toast } from "sonner";

interface PurchaseItem {
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    hsn_code: string;
    amount: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
}

export default function PurchaseFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const createPurchase = useCreatePurchase();
    const { data: existingPurchase } = usePurchase(id || "");

    const [formData, setFormData] = useState({
        purchase_date: new Date().toISOString().split('T')[0],
        supplier_name: "",
        place_of_supply: "",
        is_interstate: false,
        itc_eligible: true,
        notes: "",
    });

    const [items, setItems] = useState<PurchaseItem[]>([
        {
            description: "",
            quantity: 1,
            unit_price: 0,
            tax_rate: 18,
            hsn_code: "",
            amount: 0,
            cgst_amount: 0,
            sgst_amount: 0,
            igst_amount: 0,
        },
    ]);

    const calculateItemTotals = (item: PurchaseItem, isInterstate: boolean) => {
        const amount = item.quantity * item.unit_price;
        const taxAmount = (amount * item.tax_rate) / 100;

        if (isInterstate) {
            return {
                ...item,
                amount,
                igst_amount: taxAmount,
                cgst_amount: 0,
                sgst_amount: 0,
            };
        } else {
            return {
                ...item,
                amount,
                igst_amount: 0,
                cgst_amount: taxAmount / 2,
                sgst_amount: taxAmount / 2,
            };
        }
    };

    const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        newItems[index] = calculateItemTotals(newItems[index], formData.is_interstate);
        setItems(newItems);
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                description: "",
                quantity: 1,
                unit_price: 0,
                tax_rate: 18,
                hsn_code: "",
                amount: 0,
                cgst_amount: 0,
                sgst_amount: 0,
                igst_amount: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const cgst = items.reduce((sum, item) => sum + item.cgst_amount, 0);
        const sgst = items.reduce((sum, item) => sum + item.sgst_amount, 0);
        const igst = items.reduce((sum, item) => sum + item.igst_amount, 0);
        const tax = cgst + sgst + igst;
        const total = subtotal + tax;

        return { subtotal, cgst, sgst, igst, tax, total };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0 || items.some(item => !item.description)) {
            toast.error("Please add at least one item with description");
            return;
        }

        const totals = calculateTotals();
        const purchaseNumber = `PUR-${Date.now()}`;

        try {
            await createPurchase.mutateAsync({
                purchase_number: purchaseNumber,
                purchase_date: formData.purchase_date,
                place_of_supply: formData.place_of_supply,
                is_interstate: formData.is_interstate,
                itc_eligible: formData.itc_eligible,
                subtotal: totals.subtotal,
                discount_amount: 0,
                tax_amount: totals.tax,
                total_amount: totals.total,
                cgst_amount: totals.cgst,
                sgst_amount: totals.sgst,
                igst_amount: totals.igst,
                itc_claimed: formData.itc_eligible ? totals.tax : 0,
                itc_reversed: 0,
                notes: formData.notes,
                status: "received",
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_rate: item.tax_rate,
                    hsn_code: item.hsn_code,
                    amount: item.amount,
                    cgst_amount: item.cgst_amount,
                    sgst_amount: item.sgst_amount,
                    igst_amount: item.igst_amount,
                })),
            });

            navigate("/purchases");
        } catch (error) {
            console.error("Error creating purchase:", error);
        }
    };

    const totals = calculateTotals();

    return (
        <AppLayout title={id ? "Edit Purchase" : "New Purchase"} subtitle="Add purchase invoice for ITC tracking">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Purchase Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <Label>Purchase Date</Label>
                                <Input
                                    type="date"
                                    value={formData.purchase_date}
                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Supplier Name</Label>
                                <Input
                                    value={formData.supplier_name}
                                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                    placeholder="Enter supplier name"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Place of Supply</Label>
                                <Input
                                    value={formData.place_of_supply}
                                    onChange={(e) => setFormData({ ...formData, place_of_supply: e.target.value })}
                                    placeholder="e.g., 29-Karnataka"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.is_interstate}
                                    onCheckedChange={(checked) => {
                                        setFormData({ ...formData, is_interstate: checked });
                                        setItems(items.map(item => calculateItemTotals(item, checked)));
                                    }}
                                />
                                <Label>Interstate Purchase (IGST)</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.itc_eligible}
                                    onCheckedChange={(checked) => setFormData({ ...formData, itc_eligible: checked })}
                                />
                                <Label>ITC Eligible</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Items</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Description</TableHead>
                                    <TableHead className="w-[100px]">HSN</TableHead>
                                    <TableHead className="w-[80px]">Qty</TableHead>
                                    <TableHead className="w-[120px]">Price</TableHead>
                                    <TableHead className="w-[80px]">Tax %</TableHead>
                                    <TableHead className="w-[120px]">Amount</TableHead>
                                    <TableHead className="w-[100px]">Tax</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                                placeholder="Item description"
                                                required
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={item.hsn_code}
                                                onChange={(e) => handleItemChange(index, "hsn_code", e.target.value)}
                                                placeholder="HSN"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.tax_rate.toString()}
                                                onValueChange={(value) => handleItemChange(index, "tax_rate", parseFloat(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0%</SelectItem>
                                                    <SelectItem value="5">5%</SelectItem>
                                                    <SelectItem value="12">12%</SelectItem>
                                                    <SelectItem value="18">18%</SelectItem>
                                                    <SelectItem value="28">28%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="font-medium">₹{item.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            ₹{(item.cgst_amount + item.sgst_amount + item.igst_amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            {formData.is_interstate ? (
                                <div className="flex justify-between">
                                    <span>IGST:</span>
                                    <span className="font-medium">₹{totals.igst.toFixed(2)}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between">
                                        <span>CGST:</span>
                                        <span className="font-medium">₹{totals.cgst.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>SGST:</span>
                                        <span className="font-medium">₹{totals.sgst.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total:</span>
                                <span>₹{totals.total.toFixed(2)}</span>
                            </div>
                            {formData.itc_eligible && (
                                <div className="flex justify-between text-green-600">
                                    <span>ITC Claimable:</span>
                                    <span className="font-medium">₹{totals.tax.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <Label>Notes</Label>
                            <Input
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate("/purchases")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={createPurchase.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {createPurchase.isPending ? "Saving..." : "Save Purchase"}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
