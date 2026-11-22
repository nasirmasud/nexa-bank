"use client";

import { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { maskAccountNumber } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { useLazyLookupAccountQuery, useListAccountsQuery } from "@/store/api/accountsApi";
import { useCreateTransferMutation } from "@/store/api/transfersApi";

export default function CustomerTransferPage() {
  const { data: accountsData } = useListAccountsQuery({ page: 1, pageSize: 50 });
  const [lookup, lookupState] = useLazyLookupAccountQuery();
  const [createTransfer, createState] = useCreateTransferMutation();

  const accounts = (accountsData?.data ?? []).filter((a) => a.status === "ACTIVE");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [receipt, setReceipt] = useState<{
    reference: string;
    amount: string;
    fee: string;
    to: string;
  } | null>(null);

  const recipient = lookupState.data?.data;

  async function onLookup() {
    if (!/^\d{12}$/.test(toAccountNumber)) return;
    setReceipt(null);
    await lookup(toAccountNumber)
      .unwrap()
      .catch(() => undefined);
  }

  function openConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAccountId || !toAccountNumber || !amount || !pin) return;
    setIdempotencyKey(crypto.randomUUID());
    setConfirmOpen(true);
  }

  async function onConfirm() {
    try {
      const res = await createTransfer({
        fromAccountId,
        toAccountNumber,
        amount,
        description: description || undefined,
        pin,
        idempotencyKey,
      }).unwrap();
      setReceipt({
        reference: res.data.transaction.reference,
        amount: res.data.transaction.amount,
        fee: res.data.transaction.fee,
        to: toAccountNumber,
      });
      setConfirmOpen(false);
      setAmount("");
      setDescription("");
      setPin("");
    } catch {
      // baseApi already toasts
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send money to another account securely.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={openConfirm}>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="transfer-from-account">
                  From account
                </label>
                <select
                  id="transfer-from-account"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nickname || a.type} — {maskAccountNumber(a.accountNumber)} (
                      {formatBDT(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="transfer-to-account">
                  Recipient account number
                </label>
                <div className="flex gap-2">
                  <Input
                    id="transfer-to-account"
                    value={toAccountNumber}
                    onChange={(e) =>
                      setToAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 12))
                    }
                    placeholder="12-digit account number"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onLookup}
                    disabled={lookupState.isFetching}
                  >
                    <Search className="size-4" />
                    Lookup
                  </Button>
                </div>
                {recipient && (
                  <p className="text-xs text-muted-foreground">
                    Recipient: {recipient.owner?.name ?? "Account"} ({recipient.type})
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="transfer-amount">
                    Amount (BDT)
                  </label>
                  <Input
                    id="transfer-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="transfer-pin">
                    Transaction PIN
                  </label>
                  <Input
                    id="transfer-pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    type="password"
                    inputMode="numeric"
                    placeholder="4-6 digit PIN"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="transfer-description">
                  Description (optional)
                </label>
                <Input
                  id="transfer-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this for?"
                />
              </div>

              <Button type="submit" disabled={createState.isLoading}>
                Review Transfer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            {receipt ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="size-4" />
                  <span className="font-medium">Transfer successful</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{receipt.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span>{maskAccountNumber(receipt.to)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>{formatBDT(receipt.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span>{formatBDT(receipt.fee)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete a transfer to see the receipt here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transfer</DialogTitle>
            <DialogDescription>
              Review details before sending. This action debits your account immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span>{maskAccountNumber(toAccountNumber)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span>{amount ? formatBDT(amount) : "—"}</span>
            </div>
            {recipient?.owner?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{recipient.owner.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={createState.isLoading}>
              {createState.isLoading ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
