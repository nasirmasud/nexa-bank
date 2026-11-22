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
  useListSuspiciousFlagsQuery,
  useResolveSuspiciousFlagMutation,
} from "@/store/api/suspiciousFlagsApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "DISMISSED" ? "success" : s === "ESCALATED" ? "danger" : "warning";

export default function StaffSuspiciousPage() {
  const [status, setStatus] = useState("OPEN");
  const { data, isLoading } = useListSuspiciousFlagsQuery({
    page: 1,
    pageSize: 20,
    ...(status ? { status } : {}),
  });
  const [resolveFlag, resolveState] = useResolveSuspiciousFlagMutation();
  const [action, setAction] = useState<{ id: string; status: "DISMISSED" | "ESCALATED" } | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const items = data?.data ?? [];

  async function onResolve() {
    if (!action || note.trim().length < 3) return;
    setActionError(null);
    try {
      await resolveFlag({
        id: action.id,
        status: action.status,
        resolutionNote: note.trim(),
      }).unwrap();
      setAction(null);
      setNote("");
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setActionError(err?.data?.error?.message ?? "Failed to resolve flag");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Suspicious Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and resolve flagged transactions.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Flags</CardTitle>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flags found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.transaction.reference}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{f.reason}</TableCell>
                    <TableCell>
                      <StatusBadge variant={statusVariant(f.status)}>{f.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(f.transaction.amount)}</TableCell>
                    <TableCell className="text-right">
                      {f.status === "OPEN" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAction({ id: f.id, status: "DISMISSED" });
                              setNote("");
                              setActionError(null);
                            }}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setAction({ id: f.id, status: "ESCALATED" });
                              setNote("");
                              setActionError(null);
                            }}
                          >
                            Escalate
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Resolved</span>
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
        open={!!action}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setNote("");
            setActionError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.status === "ESCALATED" ? "Escalate flag" : "Dismiss flag"}
            </DialogTitle>
            <DialogDescription>Provide a resolution note (min 3 characters).</DialogDescription>
          </DialogHeader>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Resolution note"
          />
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAction(null);
                setNote("");
                setActionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={action?.status === "ESCALATED" ? "destructive" : "default"}
              disabled={resolveState.isLoading || note.trim().length < 3}
              onClick={onResolve}
            >
              {resolveState.isLoading ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
