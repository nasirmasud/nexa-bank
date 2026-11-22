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
import { useListCustomersQuery } from "@/store/api/customersApi";

const statusVariant = (s: string): "success" | "danger" | "warning" | "neutral" =>
  s === "ACTIVE" ? "success" : s === "BLOCKED" ? "danger" : "warning";

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useListCustomersQuery({ page: 1, pageSize: 20, q: q || undefined });
  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage customer accounts and status.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Customer List</CardTitle>
          <Input
            className="max-w-xs"
            placeholder="Search name/email/NID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>
                      <StatusBadge variant={statusVariant(c.status)}>{c.status}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        variant={
                          c.profile?.kycStatus === "VERIFIED"
                            ? "success"
                            : c.profile?.kycStatus === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {c.profile?.kycStatus ?? "—"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        render={<Link href={`/admin/customers/${c.id}`} />}
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
