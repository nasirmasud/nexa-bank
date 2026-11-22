"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT } from "@/lib/money";
import {
  useApproveRequestMutation,
  useListRequestsQuery,
  useRejectRequestMutation,
} from "@/store/api/requestsApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "APPROVED"
    ? "success"
    : s === "REJECTED"
      ? "danger"
      : s === "PENDING"
        ? "warning"
        : "neutral";

export default function StaffRequestsPage() {
  const [status, setStatus] = useState("PENDING");
  const { data, isLoading } = useListRequestsQuery({
    page: 1,
    pageSize: 20,
    ...(status ? { status } : {}),
  });
  const [approve, approveState] = useApproveRequestMutation();
  const [reject, rejectState] = useRejectRequestMutation();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const requests = data?.data ?? [];

  async function onApprove(id: string) {
    await approve(id)
      .unwrap()
      .catch(() => undefined);
  }

  async function onReject() {
    if (!rejectId || reason.trim().length < 3) return;
    try {
      await reject({ id: rejectId, reason: reason.trim() }).unwrap();
      setRejectId(null);
      setReason("");
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Requests Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review deposit and withdrawal requests. You cannot approve your own request.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Requests</CardTitle>
          <select
            aria-label="Filter by status"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-auto"
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.requester?.name ?? r.requesterId.slice(0, 8)}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{formatBDT(r.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge variant={statusVariant(r.status)}>{r.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approveState.isLoading}
                            onClick={() => onApprove(r.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectId(r.id);
                              setReason("");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
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

      <Dialog
        open={!!rejectId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectId(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this request.</DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (min 3 characters)"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectId(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectState.isLoading || reason.trim().length < 3}
              onClick={onReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
