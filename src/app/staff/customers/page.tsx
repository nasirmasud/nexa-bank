"use client";

import Link from "next/link";
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
import {
  useCreateCustomerMutation,
  useListCustomersQuery,
  useUpdateCustomerKycMutation,
} from "@/store/api/customersApi";

export default function StaffCustomersPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useListCustomersQuery({ page: 1, pageSize: 20, q: q || undefined });
  const [createCustomer, createState] = useCreateCustomerMutation();
  const [updateKyc] = useUpdateCustomerKycMutation();
  const [open, setOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    nid: "",
    dateOfBirth: "",
    presentAddress: "",
    occupation: "",
  });
  const items = data?.data ?? [];

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await createCustomer(form).unwrap();
      setTempPassword(res.data.tempPassword);
      setForm({
        name: "",
        email: "",
        phone: "",
        nid: "",
        dateOfBirth: "",
        presentAddress: "",
        occupation: "",
      });
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search and onboard customers.</p>
        </div>
        <Button
          onClick={() => {
            setOpen(true);
            setTempPassword(null);
          }}
        >
          Create customer
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Customer List</CardTitle>
          <Input
            className="w-full sm:max-w-xs"
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
                  <TableHead>Customer No</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.profile?.customerNo ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                        <select
                          aria-label={`KYC status for ${c.name}`}
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                          value={c.profile?.kycStatus ?? "PENDING"}
                          onChange={(e) =>
                            updateKyc({
                              id: c.id,
                              kycStatus: e.target.value as "PENDING" | "VERIFIED" | "REJECTED",
                            })
                          }
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button render={<Link href={`/staff/customers/${c.id}`} />} nativeButton={false} size="sm" variant="outline">
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

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setTempPassword(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create customer</DialogTitle>
            <DialogDescription>
              Create a customer user and profile. A temporary password will be generated if not
              provided by backend.
            </DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-green-600">Customer created.</p>
              <p>
                Temporary password: <span className="font-mono font-semibold">{tempPassword}</span>
              </p>
              <p className="text-muted-foreground">Share it securely with the customer.</p>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onCreate}>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
              <Input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
              <Input
                placeholder="NID"
                value={form.nid}
                onChange={(e) => set("nid", e.target.value)}
                required
              />
              <Input
                placeholder="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                required
              />
              <Input
                placeholder="Present address"
                value={form.presentAddress}
                onChange={(e) => set("presentAddress", e.target.value)}
                required
              />
              <Input
                placeholder="Occupation (optional)"
                value={form.occupation}
                onChange={(e) => set("occupation", e.target.value)}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createState.isLoading}>
                  {createState.isLoading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
