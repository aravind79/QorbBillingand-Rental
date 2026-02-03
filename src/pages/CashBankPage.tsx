import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/helpers";
import { format } from "date-fns";
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
  useAccountTransactions,
  useCreateAccountTransaction,
  BankAccount,
} from "@/hooks/useBankAccounts";

export default function CashBankPage() {
  const { data: accounts = [], isLoading } = useBankAccounts();
  const { data: transactions = [] } = useAccountTransactions();
  const createAccount = useCreateBankAccount();
  const deleteAccount = useDeleteBankAccount();
  const createTransaction = useCreateAccountTransaction();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showReduceMoney, setShowReduceMoney] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Form states
  const [newAccount, setNewAccount] = useState({
    account_name: "",
    account_type: "savings",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    opening_balance: 0,
  });
  const [transactionAmount, setTransactionAmount] = useState<number>(0);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transferToAccountId, setTransferToAccountId] = useState<string>("");

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  const cashAccount = accounts.find((a) => a.account_type === "cash");
  const bankAccounts = accounts.filter((a) => a.account_type !== "cash");

  const handleCreateAccount = async () => {
    await createAccount.mutateAsync({
      ...newAccount,
      current_balance: newAccount.opening_balance,
      is_default: accounts.length === 0,
    });
    setShowAddAccount(false);
    setNewAccount({
      account_name: "",
      account_type: "savings",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      opening_balance: 0,
    });
  };

  const handleAddMoney = async () => {
    if (!selectedAccountId || transactionAmount <= 0) return;
    await createTransaction.mutateAsync({
      account_id: selectedAccountId,
      transaction_type: "credit",
      amount: transactionAmount,
      description: transactionDescription || "Money added",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      reference_type: null,
      reference_id: null,
      counterparty_account_id: null,
    });
    setShowAddMoney(false);
    setTransactionAmount(0);
    setTransactionDescription("");
    setSelectedAccountId("");
  };

  const handleReduceMoney = async () => {
    if (!selectedAccountId || transactionAmount <= 0) return;
    await createTransaction.mutateAsync({
      account_id: selectedAccountId,
      transaction_type: "debit",
      amount: transactionAmount,
      description: transactionDescription || "Money withdrawn",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      reference_type: null,
      reference_id: null,
      counterparty_account_id: null,
    });
    setShowReduceMoney(false);
    setTransactionAmount(0);
    setTransactionDescription("");
    setSelectedAccountId("");
  };

  const handleTransfer = async () => {
    if (!selectedAccountId || !transferToAccountId || transactionAmount <= 0) return;
    
    // Debit from source
    await createTransaction.mutateAsync({
      account_id: selectedAccountId,
      transaction_type: "debit",
      amount: transactionAmount,
      description: `Transfer to ${accounts.find((a) => a.id === transferToAccountId)?.account_name}`,
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      reference_type: "transfer",
      reference_id: null,
      counterparty_account_id: transferToAccountId,
    });

    // Credit to destination
    await createTransaction.mutateAsync({
      account_id: transferToAccountId,
      transaction_type: "credit",
      amount: transactionAmount,
      description: `Transfer from ${accounts.find((a) => a.id === selectedAccountId)?.account_name}`,
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      reference_type: "transfer",
      reference_id: null,
      counterparty_account_id: selectedAccountId,
    });

    setShowTransfer(false);
    setTransactionAmount(0);
    setSelectedAccountId("");
    setTransferToAccountId("");
  };

  if (isLoading) {
    return (
      <AppLayout title="Cash & Bank">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Cash & Bank"
      subtitle="Manage your cash and bank accounts"
      actions={
        <Button onClick={() => setShowAddAccount(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-success/10">
                  <Wallet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash in Hand</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(cashAccount?.current_balance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-info/10">
                  <Building2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(bankAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowAddMoney(true)} disabled={accounts.length === 0}>
            <ArrowDownLeft className="mr-2 h-4 w-4 text-success" />
            Add Money
          </Button>
          <Button variant="outline" onClick={() => setShowReduceMoney(true)} disabled={accounts.length === 0}>
            <ArrowUpRight className="mr-2 h-4 w-4 text-destructive" />
            Reduce Money
          </Button>
          <Button variant="outline" onClick={() => setShowTransfer(true)} disabled={accounts.length < 2}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        </div>

        {/* Accounts List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No accounts yet. Add your first account to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {account.account_type === "cash" ? (
                          <Wallet className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.bank_name || account.account_type}
                          {account.account_number && ` • ****${account.account_number.slice(-4)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(account.current_balance)}
                        </p>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {account.account_type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteAccount.mutate(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((tx) => {
                    const account = accounts.find((a) => a.id === tx.account_id);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.transaction_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>{account?.account_name || "Unknown"}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          tx.transaction_type === "credit" ? "text-success" : "text-destructive"
                        }`}>
                          {tx.transaction_type === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account Name *</Label>
              <Input
                value={newAccount.account_name}
                onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                placeholder="e.g., Main Savings, Petty Cash"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select
                value={newAccount.account_type}
                onValueChange={(value) => setNewAccount({ ...newAccount, account_type: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="current">Current Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newAccount.account_type !== "cash" && (
              <>
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={newAccount.bank_name}
                    onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                    placeholder="e.g., HDFC Bank"
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={newAccount.account_number}
                      onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                      placeholder="1234567890"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input
                      value={newAccount.ifsc_code}
                      onChange={(e) => setNewAccount({ ...newAccount, ifsc_code: e.target.value })}
                      placeholder="HDFC0001234"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label>Opening Balance (₹)</Label>
              <Input
                type="number"
                value={newAccount.opening_balance}
                onChange={(e) => setNewAccount({ ...newAccount, opening_balance: parseFloat(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount} disabled={!newAccount.account_name || createAccount.isPending}>
              {createAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="e.g., Cash deposit, Sales collection"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMoney(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMoney} disabled={!selectedAccountId || transactionAmount <= 0}>
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reduce Money Dialog */}
      <Dialog open={showReduceMoney} onOpenChange={setShowReduceMoney}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reduce Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="e.g., Cash withdrawal, Expense payment"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReduceMoney(false)}>
              Cancel
            </Button>
            <Button onClick={handleReduceMoney} disabled={!selectedAccountId || transactionAmount <= 0}>
              Reduce Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_name} ({formatCurrency(acc.current_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Account</Label>
              <Select value={transferToAccountId} onValueChange={setTransferToAccountId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((acc) => acc.id !== selectedAccountId)
                    .map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(parseFloat(e.target.value) || 0)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedAccountId || !transferToAccountId || transactionAmount <= 0}
            >
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
