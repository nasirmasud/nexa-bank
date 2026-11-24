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

type CreatedCustomer = { id: string; name: string; email: string; tempPassword: string | null };

export default function StaffCustomersPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, isError, error, refetch } = useListCustomersQuery({
    page: 1,
    pageSize: 20,
    q: q || undefined,
  });
  const [createCustomer, createState] = useCreateCustomerMutation();
  const [updateKyc] = useUpdateCustomerKycMutation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<CreatedCustomer | null>(null);
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
  const errorMessage =
    (error as { message?: string } | undefined)?.message ?? "Failed to load customers.";

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function resetCreateState() {
    setStep(1);
    setCopied(false);
    setCreated(null);
  }

  function credentialsMessage(c: CreatedCustomer) {
    const loginUrl = `${window.location.origin}/login`;
    const pw = c.tempPassword ?? "(provided during creation)";
    return `Welcome to NexaBank. Email: ${c.email}, Temporary password: ${pw}, Login: ${loginUrl}`;
  }

  async function copyCredentials() {
    if (!created) return;
    await navigator.clipboard.writeText(credentialsMessage(created));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await createCustomer(form).unwrap();
      const c = res.data.customer;
      const tempPassword = res.data.tempPassword ?? null;
      if (c) {
        setCreated({ id: c.id, name: c.name, email: c.email, tempPassword });
        setStep(1);
        setCopied(false);
      }
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

  const mailtoHref = created
    ? `mailto:${encodeURIComponent(created.email)}?subject=${encodeURIComponent(
        "Your NexaBank account credentials",
      )}&body=${encodeURIComponent(
        `${credentialsMessage(created)}\n\nPlease change this password after your first login.`,
      )}`
    : "#";

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
            resetCreateState();
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
          ) : isError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
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
          if (!v) resetCreateState();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{created ? "Customer created" : "Create customer"}</DialogTitle>
            <DialogDescription>
              {created
                ? `Step ${step} of 3 — ${step === 1 ? "Credentials" : step === 2 ? "Share" : "Open account"}`
                : "Create a customer user and profile."}
            </DialogDescription>
          </DialogHeader>

          {created ? (
            <div className="space-y-4 text-sm">
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    These credentials are shown only once. They are not stored or logged in plaintext and will not be returned by later API calls.
                  </p>
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{created.name}</span></p>
                    <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{created.email}</span></p>
                    <p><span className="text-muted-foreground">Temporary password:</span> <span className="font-mono font-semibold">{created.tempPassword ?? "—"}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={copyCredentials}>{copied ? "Copied" : "Copy credentials"}</Button>
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Next: Share</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-muted-foreground">Share the credentials securely with the customer. The customer should change this password after the first login.</p>
                  <div className="flex flex-col gap-2">
                    <Button render={<a href={mailtoHref} />} nativeButton={false} variant="outline">Send by email</Button>
                    <Button type="button" variant="outline" onClick={copyCredentials}>{copied ? "Copied" : "Copy message"}</Button>
                    <Button type="button" variant="ghost" onClick={() => setStep(3)}>Skip, I&apos;ll hand it over in person</Button>
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" onClick={() => setStep(3)}>Next: Open account</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-muted-foreground">The customer has no account yet. Open an account so they can use banking features.</p>
                  <div className="flex flex-col gap-2">
                    <Button render={<Link href={`/staff/accounts/new?ownerId=${created.id}`} />} nativeButton={false}>
                      Create account for {created.name}
                    </Button>
                    <Button render={<Link href={`/staff/customers/${created.id}`} />} nativeButton={false} variant="outline">
                      Go to customer details
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetCreateState(); }}>Done</Button>
                  </div>
                  <div>
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onCreate}>
              <Input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              <Input placeholder="NID" value={form.nid} onChange={(e) => set("nid", e.target.value)} required />
              <Input placeholder="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required />
              <Input placeholder="Present address" value={form.presentAddress} onChange={(e) => set("presentAddress", e.target.value)} required />
              <Input placeholder="Occupation (optional)" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createState.isLoading}>{createState.isLoading ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
