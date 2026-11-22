"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
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
import { maskAccountNumber } from "@/lib/format";
import { formatBDT } from "@/lib/money";
import { useListAccountsQuery } from "@/store/api/accountsApi";

export default function CustomerAccountsPage() {
  const { data, isLoading } = useListAccountsQuery({ page: 1, pageSize: 50 });
  const accounts = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your accounts and balances.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">
                        {a.nickname || maskAccountNumber(a.accountNumber)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {maskAccountNumber(a.accountNumber)}
                      </div>
                    </TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={
                          a.status === "ACTIVE"
                            ? "success"
                            : a.status === "FROZEN"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {a.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(a.balance)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/customer/accounts/${a.id}`} />}
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="size-4" />
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
