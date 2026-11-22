"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { maskAccountNumber } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { useListAccountsQuery } from "@/store/api/accountsApi";
import {
  useCancelRequestMutation,
  useCreateRequestMutation,
  useListRequestsQuery,
} from "@/store/api/requestsApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "APPROVED"
    ? "success"
    : s === "REJECTED"
      ? "danger"
      : s === "PENDING"
        ? "warning"
        : "neutral";

export default function CustomerRequestsPage() {
  const { data: accountsData } = useListAccountsQuery({ page: 1, pageSize: 50 });
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useListRequestsQuery({
    page: 1,
    pageSize: 20,
    ...(status ? { status } : {}),
  });
  const [createRequest, createState] = useCreateRequestMutation();
  const [cancelRequest, cancelState] = useCancelRequestMutation();

  const accounts = (accountsData?.data ?? []).filter((a) => a.status === "ACTIVE");
  const requests = data?.data ?? [];

  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !amount) return;
    try {
      await createRequest({
        type,
        accountId,
        amount,
        description: description || undefined,
      }).unwrap();
      setAmount("");
      setDescription("");
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create deposit/withdrawal requests and track their status.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>New Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as "DEPOSIT" | "WITHDRAWAL")}
                >
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Account</label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nickname || a.type} — {maskAccountNumber(a.accountNumber)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount (BDT)</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes for staff/admin"
                />
              </div>
              <Button type="submit" disabled={createState.isLoading}>
                {createState.isLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>My Requests</CardTitle>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{formatBDT(r.amount)}</TableCell>
                      <TableCell>
                        <StatusBadge variant={statusVariant(r.status)}>
                          {r.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{new Date(r.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {r.status === "PENDING" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancelState.isLoading}
                            onClick={() => cancelRequest(r.id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
