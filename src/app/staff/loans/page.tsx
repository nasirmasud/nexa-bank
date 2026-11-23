"use client";

import Link from "next/link";
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
import { formatBDT } from "@/lib/money";
import { useListLoansQuery } from "@/store/api/loansApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "info" | "neutral" => {
  if (s === "APPROVED" || s === "ACTIVE" || s === "COMPLETED") return "success";
  if (s === "REJECTED") return "danger";
  if (s === "PENDING") return "warning";
  if (s === "UNDER_REVIEW") return "info";
  return "neutral";
};

export default function StaffLoansPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListLoansQuery({
    page,
    pageSize: 10,
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
  });
  const loans = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Loans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review loan applications, add notes, and forward to admin for decision.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Loan Queue</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              className="sm:w-56"
              placeholder="Search loan/applicant"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <select
              aria-label="Filter by status"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-auto"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No loans found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.loanNo}</TableCell>
                      <TableCell>{l.applicant?.name ?? l.applicantId.slice(0, 8)}</TableCell>
                      <TableCell>{l.type}</TableCell>
                      <TableCell className="text-right">{formatBDT(l.requestedAmount)}</TableCell>
                      <TableCell>
                        <StatusBadge variant={statusVariant(l.status)}>{l.status}</StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          render={<Link href={`/staff/loans/${l.id}`} />}
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination || page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
