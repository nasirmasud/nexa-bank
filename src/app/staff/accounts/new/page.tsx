"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateAccountMutation } from "@/store/api/accountsApi";
import { useListCustomersQuery } from "@/store/api/customersApi";

export default function StaffCreateAccountPage() {
  const searchParams = useSearchParams();
  const ownerIdParam = searchParams.get("ownerId") ?? "";
  const { data: customersData } = useListCustomersQuery({ page: 1, pageSize: 100 });
  const [createAccount, createState] = useCreateAccountMutation();
  const customers = customersData?.data ?? [];

  const [ownerId, setOwnerId] = useState(ownerIdParam);
  const [type, setType] = useState<"SAVINGS" | "CURRENT" | "BUSINESS">("SAVINGS");
  const [nickname, setNickname] = useState("");
  const [createdNumber, setCreatedNumber] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreatedNumber(null);
    try {
      const res = await createAccount({ ownerId, type, nickname: nickname || undefined }).unwrap();
      setCreatedNumber(res.data.accountNumber);
      setNickname("");
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Create Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Open a new account for a customer.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="new-account-owner">
                Customer
              </label>
              <select
                id="new-account-owner"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="new-account-type">
                Account type
              </label>
              <select
                id="new-account-type"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as "SAVINGS" | "CURRENT" | "BUSINESS")}
              >
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="new-account-nickname">
                Nickname (optional)
              </label>
              <Input
                id="new-account-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Salary account"
              />
            </div>
            <Button type="submit" disabled={createState.isLoading}>
              {createState.isLoading ? "Creating..." : "Create account"}
            </Button>
            {createdNumber && (
              <p className="text-sm text-green-600">
                Account created: <span className="font-mono font-semibold">{createdNumber}</span>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
