"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { useCreateStaffMutation, useListStaffQuery, useUpdateStaffStatusMutation } from "@/store/api/staffApi";

export default function AdminStaffPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const [q, setQ] = useState("");
  const { data, isLoading, isError, error, refetch } = useListStaffQuery({
    page: 1,
    pageSize: 20,
    q: q || undefined,
  });
  const [createStaff, createState] = useCreateStaffMutation();
  const [updateStatus, statusState] = useUpdateStaffStatusMutation();
  const [open, setOpen] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", temporaryPassword: "" });
  const items = data?.data ?? [];
  const errorMessage =
    (error as { message?: string } | undefined)?.message ?? "Failed to load staff.";

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createStaff({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        temporaryPassword: form.temporaryPassword,
      }).unwrap();
      setCreatedPassword(form.temporaryPassword);
      setForm({ name: "", email: "", phone: "", temporaryPassword: "" });
    } catch {}
  }

  async function onStatusChange(id: string, status: "ACTIVE" | "INACTIVE") {
    try {
      await updateStatus({ id, status }).unwrap();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage staff accounts and access.</p>
        </div>
        <Button
          onClick={() => {
            setOpen(true);
            setCreatedPassword(null);
          }}
        >
          Create staff
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Staff List</CardTitle>
          <Input
            className="w-full sm:max-w-xs"
            placeholder="Search name/email/phone"
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
            <p className="text-sm text-muted-foreground">No staff users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => {
                  const isSelf = currentUserId === s.id;
                  const nextStatus = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <StatusBadge variant={s.status === "ACTIVE" ? "success" : "warning"}>
                          {s.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusState.isLoading || isSelf}
                          title={isSelf ? "You cannot change your own status" : undefined}
                          onClick={() => onStatusChange(s.id, nextStatus)}
                        >
                          {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setCreatedPassword(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create staff</DialogTitle>
            <DialogDescription>
              Create a staff account. Share the temporary password securely.
            </DialogDescription>
          </DialogHeader>
          {createdPassword ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium text-green-600">Staff account created.</p>
              <p>
                Temporary password:{" "}
                <span className="font-mono font-semibold">{createdPassword}</span>
              </p>
              <p className="text-muted-foreground">The staff user should change it after signing in.</p>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setOpen(false);
                    setCreatedPassword(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
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
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
              <Input
                placeholder="Temporary password"
                type="password"
                value={form.temporaryPassword}
                onChange={(e) => set("temporaryPassword", e.target.value)}
                minLength={8}
                required
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
