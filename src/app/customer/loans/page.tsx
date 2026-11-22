"use client";

import Link from "next/link";
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
import { useListLoansQuery } from "@/store/api/loansApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "info" | "neutral" => {
  if (s === "APPROVED" || s === "ACTIVE" || s === "COMPLETED") return "success";
  if (s === "REJECTED") return "danger";
  if (s === "PENDING") return "warning";
  if (s === "UNDER_REVIEW") return "info";
  return "neutral";
};

export default function CustomerLoansPage() {
  const { data, isLoading } = useListLoansQuery({ page: 1, pageSize: 20 });
  const loans = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Loans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your loan applications and repayments.
          </p>
        </div>
        <Button render={<Link href="/customer/loans/apply" />} nativeButton={false}>
          Apply for loan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loans yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.loanNo}</TableCell>
                    <TableCell>{l.type}</TableCell>
                    <TableCell className="text-right">
                      {formatBDT(l.approvedAmount ?? l.requestedAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={statusVariant(l.status)}>{l.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/customer/loans/${l.id}`} />}
                        nativeButton={false}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
