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
import { useGetAccountQuery } from "@/store/api/accountsApi";
import { useGetCustomerQuery } from "@/store/api/customersApi";
import { useListTransactionsQuery } from "@/store/api/transactionsApi";

export default function StaffAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useGetAccountQuery(id, { skip: !id });
  const account = data?.data;
  const ownerId = account?.ownerId ?? "";
  const { data: ownerData } = useGetCustomerQuery(ownerId, { skip: !ownerId });

  const [txPage, setTxPage] = useState(1);
  const { data: txData, isLoading: txLoading } = useListTransactionsQuery(
    { page: txPage, pageSize: 10, accountId: id },
    { skip: !id },
  );

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
        <Button render={<Link href="/staff/accounts" />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  const owner = ownerData?.data;
  const txs = txData?.data ?? [];
  const txPagination = txData?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/staff/accounts" />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{account.accountNumber}</h1>
          <p className="text-sm text-muted-foreground">{account.owner?.name ?? "No owner"} · {account.type}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status">
              <StatusBadge variant={account.status === "ACTIVE" ? "success" : account.status === "FROZEN" ? "warning" : "neutral"}>
                {account.status}
              </StatusBadge>
            </Row>
            <Row label="Balance">{formatBDT(account.balance)}</Row>
            <Row label="Type">{account.type}</Row>
            <Row label="Currency">{account.currency}</Row>
            <Row label="Daily transfer limit">{account.dailyTransferLimit ? formatBDT(account.dailyTransferLimit) : "—"}</Row>
            <Row label="Per-tx limit">{account.perTxLimit ? formatBDT(account.perTxLimit) : "—"}</Row>
            <Row label="Min balance">{account.minBalance ? formatBDT(account.minBalance) : "—"}</Row>
            {account.freezeReason && <Row label="Freeze reason">{account.freezeReason}</Row>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Owner</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name">{account.owner?.name ?? "—"}</Row>
            <Row label="Email">{account.owner?.email ?? "—"}</Row>
            <Row label="KYC">
              <StatusBadge variant={owner?.profile?.kycStatus === "VERIFIED" ? "success" : owner?.profile?.kycStatus === "REJECTED" ? "danger" : "warning"}>
                {owner?.profile?.kycStatus ?? "—"}
              </StatusBadge>
            </Row>
            {ownerId && (
              <div className="pt-2">
                <Button render={<Link href={`/staff/customers/${ownerId}`} />} nativeButton={false} size="sm" variant="outline">
                  View customer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {txLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : txs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.reference}</TableCell>
                      <TableCell>{t.type}</TableCell>
                      <TableCell>{t.status}</TableCell>
                      <TableCell className="text-right">{formatBDT(t.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Page {txPagination?.page ?? txPage} of {txPagination?.totalPages ?? 1}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={!txPagination || txPage >= txPagination.totalPages} onClick={() => setTxPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
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
