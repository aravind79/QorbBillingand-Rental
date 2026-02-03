import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTables, useCreateTable, useUpdateTable, useDeleteTable } from "@/hooks/useTables";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Receipt, Trash2, Edit, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TableBillingPage() {
  const navigate = useNavigate();
  const { data: tables = [], isLoading } = useTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");

  const handleAddTable = async () => {
    if (!tableNumber.trim()) return;
    await createTable.mutateAsync({
      table_number: tableNumber,
      capacity: parseInt(capacity) || 4,
    });
    setTableNumber("");
    setCapacity("4");
    setShowAddTable(false);
  };

  const handleUpdateTable = async () => {
    if (!editingTable || !tableNumber.trim()) return;
    await updateTable.mutateAsync({
      id: editingTable,
      table_number: tableNumber,
      capacity: parseInt(capacity) || 4,
    });
    setTableNumber("");
    setCapacity("4");
    setEditingTable(null);
  };

  const handleStartBilling = (tableId: string) => {
    // Navigate to POS with table context
    navigate(`/pos?table=${tableId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-700 border-green-500/30";
      case "occupied": return "bg-red-500/20 text-red-700 border-red-500/30";
      case "reserved": return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Table Billing">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Table Billing"
      subtitle="Manage restaurant tables and start orders"
      actions={
        <Button onClick={() => setShowAddTable(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={cn(
              "relative overflow-hidden transition-all hover:shadow-md",
              table.status === "occupied" && "ring-2 ring-primary"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Table {table.table_number}</CardTitle>
                <Badge className={getStatusColor(table.status)} variant="outline">
                  {table.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Users className="h-4 w-4" />
                <span>{table.capacity} seats</span>
              </div>

              <div className="flex gap-2">
                {table.status === "available" ? (
                  <Button
                    className="flex-1"
                    onClick={() => handleStartBilling(table.id)}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Start Order
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => handleStartBilling(table.id)}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    View Order
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingTable(table.id);
                    setTableNumber(table.table_number);
                    setCapacity(String(table.capacity));
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDeleteId(table.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tables.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No Tables Added</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Add tables to start managing your restaurant billing
              </p>
              <Button onClick={() => setShowAddTable(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Table
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Table Dialog */}
      <Dialog
        open={showAddTable || !!editingTable}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddTable(false);
            setEditingTable(null);
            setTableNumber("");
            setCapacity("4");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Table Number *</label>
              <Input
                placeholder="e.g., 1, A1, VIP-1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Capacity</label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddTable(false);
                setEditingTable(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingTable ? handleUpdateTable : handleAddTable}
              disabled={!tableNumber.trim() || createTable.isPending || updateTable.isPending}
            >
              {(createTable.isPending || updateTable.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingTable ? "Update" : "Add"} Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this table? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteTable.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
