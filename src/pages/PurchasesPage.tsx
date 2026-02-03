import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { usePurchases, useDeletePurchase } from "@/hooks/usePurchases";
import { formatCurrency, formatDate } from "@/lib/helpers";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PurchasesPage() {
    const navigate = useNavigate();
    const { data: purchases, isLoading } = usePurchases();
    const deletePurchase = useDeletePurchase();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = async () => {
        if (deleteId) {
            await deletePurchase.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive"> = {
            draft: "secondary",
            received: "default",
            paid: "default",
            partial: "secondary",
            cancelled: "destructive",
        };
        return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
    };

    return (
        <AppLayout title="Purchases" subtitle="Manage purchase invoices and track ITC">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Purchase Invoices</h2>
                        <p className="text-muted-foreground">Track purchases for Input Tax Credit (ITC)</p>
                    </div>
                    <Button onClick={() => navigate("/purchases/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Purchase
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : purchases && purchases.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Purchase No</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">CGST</TableHead>
                                        <TableHead className="text-right">SGST</TableHead>
                                        <TableHead className="text-right">IGST</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>ITC</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                                            <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                                            <TableCell>{purchase.supplier_id || "-"}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.subtotal)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.cgst_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.sgst_amount)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(purchase.igst_amount)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(purchase.total_amount)}
                                            </TableCell>
                                            <TableCell>
                                                {purchase.itc_eligible ? (
                                                    <Badge variant="default">Eligible</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not Eligible</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteId(purchase.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Purchase?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete purchase {purchase.purchase_number}. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No purchases yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start tracking your purchases to claim Input Tax Credit
                                </p>
                                <Button onClick={() => navigate("/purchases/new")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Purchase
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
