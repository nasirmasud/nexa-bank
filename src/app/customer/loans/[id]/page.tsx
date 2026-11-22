"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGetLoanQuery, usePayLoanInstallmentMutation } from "@/store/api/loansApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "info" | "neutral" => {
  if (s === "APPROVED" || s === "ACTIVE" || s === "COMPLETED") return "success";
  if (s === "REJECTED") return "danger";
  if (s === "PENDING") return "warning";
  if (s === "UNDER_REVIEW") return "info";
  return "neutral";
};

export default function CustomerLoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useGetLoanQuery(id, { skip: !id });
  const [payInstallment, payState] = usePayLoanInstallmentMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

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
          render={<Link href="/customer/loans" />}
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

  const nextPayable = loan.installments.find(
    (i) => i.status === "UPCOMING" || i.status === "OVERDUE",
  );

  async function onPay(installmentId: string) {
    setActionError(null);
    setPayingId(installmentId);
    try {
      await payInstallment({ loanId: id, installmentId }).unwrap();
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setActionError(err?.data?.error?.message ?? "Failed to pay installment");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/customer/loans" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{loan.loanNo}</h1>
          <p className="text-sm text-muted-foreground">{loan.type} loan</p>
        </div>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Status">
            <StatusBadge variant={statusVariant(loan.status)}>{loan.status}</StatusBadge>
          </Row>
          <Row label="Requested">{formatBDT(loan.requestedAmount)}</Row>
          <Row label="Approved">{loan.approvedAmount ? formatBDT(loan.approvedAmount) : "—"}</Row>
          <Row label="Duration">{loan.durationMonths} months</Row>
          <Row label="Interest rate">{loan.interestRate}%</Row>
          <Row label="EMI">{loan.emiAmount ? formatBDT(loan.emiAmount) : "—"}</Row>
          <Row label="Total payable">{loan.totalPayable ? formatBDT(loan.totalPayable) : "—"}</Row>
          <Row label="Remaining">
            {loan.remainingBalance ? formatBDT(loan.remainingBalance) : "—"}
          </Row>
          <Row label="Applied">{new Date(loan.appliedAt).toLocaleString()}</Row>
          {loan.rejectionReason && <Row label="Rejection reason">{loan.rejectionReason}</Row>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repayment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {loan.installments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Installments will appear after approval and disbursement.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.installments.map((i) => {
                  const canPay =
                    loan.status === "ACTIVE" &&
                    (i.status === "UPCOMING" || i.status === "OVERDUE") &&
                    nextPayable?.id === i.id;
                  return (
                    <TableRow key={i.id}>
                      <TableCell>{i.number}</TableCell>
                      <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
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
                      <TableCell className="text-right">
                        {canPay ? (
                          <Button
                            size="sm"
                            disabled={payState.isLoading}
                            onClick={() => onPay(i.id)}
                          >
                            {payingId === i.id ? "Paying..." : "Pay"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {i.paidAt ? new Date(i.paidAt).toLocaleDateString() : "—"}
                          </span>
                        )}
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
