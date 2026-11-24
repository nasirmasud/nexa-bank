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
import { useListAccountsQuery } from "@/store/api/accountsApi";
import {
  useGetCustomerQuery,
  useGetCustomerTransactionsQuery,
  useUpdateCustomerKycMutation,
} from "@/store/api/customersApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "ACTIVE" ? "success" : s === "BLOCKED" ? "danger" : "warning";

export default function StaffCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, error } = useGetCustomerQuery(id, { skip: !id });
  const [txPage, setTxPage] = useState(1);
  const { data: txData, isLoading: txLoading } = useGetCustomerTransactionsQuery(
    { id, page: txPage, pageSize: 10 },
    { skip: !id },
  );
  const { data: accountsData, isLoading: accountsLoading } = useListAccountsQuery(
    { ownerId: id, page: 1, pageSize: 50 },
    { skip: !id },
  );
  const [updateKyc, kycState] = useUpdateCustomerKycMutation();
  const [kycError, setKycError] = useState<string | null>(null);

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );

  const err = error as { status?: number } | undefined;
  const customer = data?.data;
  if (err?.status === 404 || !customer) {
    return (
      <div className="space-y-4">
        <Button render={<Link href="/staff/customers" />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Back to customers
        </Button>
        <p className="text-sm text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  const txs = txData?.data ?? [];
  const txPagination = txData?.pagination;
  const accounts = accountsData?.data ?? [];

  async function onKycChange(kycStatus: "PENDING" | "VERIFIED" | "REJECTED") {
    setKycError(null);
    try {
      await updateKyc({ id, kycStatus }).unwrap();
    } catch (e: unknown) {
      const er = e as { data?: { error?: { message?: string } } };
      setKycError(er?.data?.error?.message ?? "Failed to update KYC");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button render={<Link href="/staff/customers" />} nativeButton={false} variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      {kycError && <p className="text-sm text-destructive">{kycError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status">
              <StatusBadge variant={statusVariant(customer.status)}>{customer.status}</StatusBadge>
            </Row>
            <Row label="Customer No">{customer.profile?.customerNo ?? "—"}</Row>
            <Row label="Phone">{customer.phone ?? "—"}</Row>
            <Row label="NID">{customer.profile?.nid ?? "—"}</Row>
            <Row label="Address">{customer.profile?.presentAddress ?? "—"}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KYC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge
                variant={
                  customer.profile?.kycStatus === "VERIFIED"
                    ? "success"
                    : customer.profile?.kycStatus === "REJECTED"
                      ? "danger"
                      : "warning"
                }
              >
                {customer.profile?.kycStatus ?? "—"}
              </StatusBadge>
              <select
                aria-label={`KYC status for ${customer.name}`}
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={customer.profile?.kycStatus ?? "PENDING"}
                disabled={kycState.isLoading}
                onChange={(e) => onKycChange(e.target.value as "PENDING" | "VERIFIED" | "REJECTED")}
              >
                <option value="PENDING">PENDING</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Staff can verify or update KYC status.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Accounts</CardTitle>
          <Button render={<Link href={`/staff/accounts/new?ownerId=${id}`} />} nativeButton={false} size="sm" variant="outline">
            Open account
          </Button>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : accounts.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No accounts found for this customer.</p>
              <Button render={<Link href={`/staff/accounts/new?ownerId=${id}`} />} nativeButton={false} size="sm">
                Open account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.accountNumber}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell><StatusBadge variant={a.status === "ACTIVE" ? "success" : a.status === "FROZEN" ? "warning" : "neutral"}>{a.status}</StatusBadge></TableCell>
                    <TableCell className="text-right">{formatBDT(a.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
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
