"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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
  useAddLoanNoteMutation,
  useApproveLoanMutation,
  useForwardLoanMutation,
  useGetLoanQuery,
  useRejectLoanMutation,
} from "@/store/api/loansApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "info" | "neutral" => {
  if (s === "APPROVED" || s === "ACTIVE" || s === "COMPLETED") return "success";
  if (s === "REJECTED") return "danger";
  if (s === "PENDING") return "warning";
  if (s === "UNDER_REVIEW") return "info";
  return "neutral";
};

export default function AdminLoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useGetLoanQuery(id, { skip: !id });
  const [approveLoan, approveState] = useApproveLoanMutation();
  const [rejectLoan, rejectState] = useRejectLoanMutation();
  const [forwardLoan, forwardState] = useForwardLoanMutation();
  const [addNote, noteState] = useAddLoanNoteMutation();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [disbursementAccountId, setDisbursementAccountId] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const err = error as { status?: number } | undefined;
  const loan = data?.data;
  if (err?.status === 404 || !loan) {
    return (
      <div className="space-y-4">
        <Button
          render={<Link href="/admin/loans" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" /> Back to loans
        </Button>
        <p className="text-sm text-muted-foreground">Loan not found.</p>
      </div>
    );
  }

  const actionable = loan.status === "PENDING" || loan.status === "UNDER_REVIEW";

  const loanId = id;
  const defaultDisbAccountId = loan.disbursementAccountId ?? "";

  async function onApprove() {
    setActionError(null);
    try {
      await approveLoan({
        id: loanId,
        disbursementAccountId: disbursementAccountId || defaultDisbAccountId,
        ...(approvedAmount ? { approvedAmount } : {}),
      }).unwrap();
      setApproveOpen(false);
      setApprovedAmount("");
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setActionError(err?.data?.error?.message ?? "Failed to approve loan");
    }
  }

  async function onReject() {
    if (reason.trim().length < 3) return;
    setActionError(null);
    try {
      await rejectLoan({ id: loanId, reason: reason.trim() }).unwrap();
      setRejectOpen(false);
      setReason("");
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setActionError(err?.data?.error?.message ?? "Failed to reject loan");
    }
  }

  async function onForward() {
    setActionError(null);
    try {
      await forwardLoan({ id: loanId }).unwrap();
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setActionError(err?.data?.error?.message ?? "Failed to forward loan");
    }
  }

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setActionError(null);
    try {
      await addNote({ id: loanId, body: noteBody.trim(), internal: true }).unwrap();
      setNoteBody("");
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setActionError(err?.data?.error?.message ?? "Failed to add note");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/admin/loans" />}
            nativeButton={false}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{loan.loanNo}</h1>
            <p className="text-sm text-muted-foreground">
              {loan.applicant?.name ?? loan.applicantId} · {loan.type}
            </p>
          </div>
        </div>
        {actionable && (
          <div className="flex gap-2">
            <Button variant="outline" disabled={forwardState.isLoading} onClick={onForward}>
              Forward
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setReason("");
                setRejectOpen(true);
              }}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                setDisbursementAccountId(loan.disbursementAccountId ?? "");
                setApprovedAmount(loan.requestedAmount);
                setApproveOpen(true);
              }}
            >
              Approve
            </Button>
          </div>
        )}
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status">
              <StatusBadge variant={statusVariant(loan.status)}>{loan.status}</StatusBadge>
            </Row>
            <Row label="Applicant">{loan.applicant?.name ?? loan.applicantId}</Row>
            <Row label="Email">{loan.applicant?.email ?? "—"}</Row>
            <Row label="Requested">{formatBDT(loan.requestedAmount)}</Row>
            <Row label="Approved">{loan.approvedAmount ? formatBDT(loan.approvedAmount) : "—"}</Row>
            <Row label="Duration">{loan.durationMonths} months</Row>
            <Row label="Interest">{loan.interestRate}%</Row>
            <Row label="EMI">{loan.emiAmount ? formatBDT(loan.emiAmount) : "—"}</Row>
            <Row label="Monthly income">{formatBDT(loan.monthlyIncome)}</Row>
            <Row label="Employment">{loan.employmentStatus}</Row>
            <Row label="Disbursement acct">{loan.disbursementAccountId ?? "—"}</Row>
            <Row label="Applied">{new Date(loan.appliedAt).toLocaleString()}</Row>
            {loan.rejectionReason && <Row label="Rejection reason">{loan.rejectionReason}</Row>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onAddNote}>
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Internal note..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <Button type="submit" disabled={noteState.isLoading || !noteBody.trim()}>
                {noteState.isLoading ? "Adding..." : "Add note"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installments</CardTitle>
        </CardHeader>
        <CardContent>
          {loan.installments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No installments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.installments.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.number}</TableCell>
                    <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{formatBDT(i.principal)}</TableCell>
                    <TableCell className="text-right">{formatBDT(i.interest)}</TableCell>
                    <TableCell className="text-right">{formatBDT(i.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={
                          i.status === "PAID"
                            ? "success"
                            : i.status === "OVERDUE"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {i.status}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loan.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes.</p>
          ) : (
            loan.notes.map((n) => (
              <div key={n.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {n.author.name} ({n.author.role})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{n.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve loan</DialogTitle>
            <DialogDescription>
              This will disburse funds from the system account and activate the loan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Disbursement account ID</label>
              <Input
                value={disbursementAccountId}
                onChange={(e) => setDisbursementAccountId(e.target.value)}
                placeholder="Account ID"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Approved amount</label>
              <Input
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button disabled={approveState.isLoading || !disbursementAccountId} onClick={onApprove}>
              {approveState.isLoading ? "Approving..." : "Approve & disburse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject loan</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this loan.</DialogDescription>
          </DialogHeader>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (min 3 characters)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectState.isLoading || reason.trim().length < 3}
              onClick={onReject}
            >
              {rejectState.isLoading ? "Rejecting..." : "Reject"}
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
