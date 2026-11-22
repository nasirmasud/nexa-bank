"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/money";
import {
  useFreezeAccountMutation,
  useGetAccountQuery,
  useUnfreezeAccountMutation,
  useUpdateAccountLimitsMutation,
} from "@/store/api/accountsApi";

export default function AdminAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useGetAccountQuery(id, { skip: !id });
  const [freezeAccount, freezeState] = useFreezeAccountMutation();
  const [unfreezeAccount, unfreezeState] = useUnfreezeAccountMutation();
  const [updateLimits, limitsState] = useUpdateAccountLimitsMutation();

  const [freezeOpen, setFreezeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [dailyTransferLimit, setDailyTransferLimit] = useState("");
  const [perTxLimit, setPerTxLimit] = useState("");
  const [minBalance, setMinBalance] = useState("");

  const account = data?.data;
  useEffect(() => {
    if (!account) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form defaults from fetched account
    setDailyTransferLimit(account.dailyTransferLimit ?? "");
    setPerTxLimit(account.perTxLimit ?? "");
    setMinBalance(account.minBalance ?? "");
  }, [account]);

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const err = error as { status?: number } | undefined;
  if (err?.status === 404 || !account) {
    return (
      <div className="space-y-4">
        <Button
          render={<Link href="/admin/accounts" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  async function onFreeze() {
    if (reason.trim().length < 3) return;
    setActionError(null);
    try {
      await freezeAccount({ id, reason: reason.trim() }).unwrap();
      setFreezeOpen(false);
      setReason("");
    } catch (e: unknown) {
      const er = e as { data?: { error?: { message?: string } } };
      setActionError(er?.data?.error?.message ?? "Failed to freeze account");
    }
  }

  async function onUnfreeze() {
    setActionError(null);
    try {
      await unfreezeAccount(id).unwrap();
    } catch (e: unknown) {
      const er = e as { data?: { error?: { message?: string } } };
      setActionError(er?.data?.error?.message ?? "Failed to unfreeze account");
    }
  }

  async function onLimits(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    try {
      await updateLimits({
        id,
        dailyTransferLimit: dailyTransferLimit || null,
        perTxLimit: perTxLimit || null,
        minBalance: minBalance || null,
      }).unwrap();
    } catch (e: unknown) {
      const er = e as { data?: { error?: { message?: string } } };
      setActionError(er?.data?.error?.message ?? "Failed to update limits");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/admin/accounts" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {account.accountNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {account.owner?.name ?? "No owner"} · {account.type}
          </p>
        </div>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status">
              <StatusBadge
                variant={
                  account.status === "ACTIVE"
                    ? "success"
                    : account.status === "FROZEN"
                      ? "warning"
                      : "neutral"
                }
              >
                {account.status}
              </StatusBadge>
            </Row>
            <Row label="Balance">{formatBDT(account.balance)}</Row>
            <Row label="Owner">{account.owner?.name ?? "—"}</Row>
            <Row label="Email">{account.owner?.email ?? "—"}</Row>
            <Row label="Nickname">{account.nickname ?? "—"}</Row>
            {account.freezeReason && <Row label="Freeze reason">{account.freezeReason}</Row>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {account.status === "ACTIVE" ? (
              <Button variant="destructive" onClick={() => setFreezeOpen(true)}>
                Freeze account
              </Button>
            ) : account.status === "FROZEN" ? (
              <Button disabled={unfreezeState.isLoading} onClick={onUnfreeze}>
                {unfreezeState.isLoading ? "Unfreezing..." : "Unfreeze account"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Closed accounts cannot be changed.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onLimits}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Daily transfer limit</label>
                <Input
                  value={dailyTransferLimit}
                  onChange={(e) => setDailyTransferLimit(e.target.value)}
                  placeholder="empty = no limit"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Per-tx limit</label>
                <Input
                  value={perTxLimit}
                  onChange={(e) => setPerTxLimit(e.target.value)}
                  placeholder="empty = no limit"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Min balance</label>
                <Input
                  value={minBalance}
                  onChange={(e) => setMinBalance(e.target.value)}
                  placeholder="empty = no limit"
                />
              </div>
            </div>
            <Button type="submit" disabled={limitsState.isLoading}>
              {limitsState.isLoading ? "Saving..." : "Save limits"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={freezeOpen} onOpenChange={setFreezeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze account</DialogTitle>
            <DialogDescription>Provide a reason for freezing this account.</DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (min 3 chars)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={freezeState.isLoading || reason.trim().length < 3}
              onClick={onFreeze}
            >
              {freezeState.isLoading ? "Freezing..." : "Freeze"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
