"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateEmi } from "@/lib/emi";
import { formatBDT } from "@/lib/money";
import { useListAccountsQuery } from "@/store/api/accountsApi";
import { useApplyLoanMutation } from "@/store/api/loansApi";

const LOAN_TYPES = ["PERSONAL", "HOME", "AUTO", "EDUCATION", "BUSINESS"] as const;
const EMPLOYMENT = [
  "EMPLOYED",
  "SELF_EMPLOYED",
  "BUSINESS_OWNER",
  "STUDENT",
  "UNEMPLOYED",
  "RETIRED",
] as const;
const DEFAULT_RATES: Record<string, number> = {
  PERSONAL: 12,
  HOME: 10,
  AUTO: 11,
  EDUCATION: 8,
  BUSINESS: 14,
};

export default function CustomerApplyLoanPage() {
  const router = useRouter();
  const { data: accountsData, isLoading: accountsLoading } = useListAccountsQuery({
    page: 1,
    pageSize: 50,
  });
  const [applyLoan, applyState] = useApplyLoanMutation();
  const accounts = (accountsData?.data ?? []).filter((a) => a.status === "ACTIVE");

  const [type, setType] = useState<(typeof LOAN_TYPES)[number]>("PERSONAL");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("12");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<(typeof EMPLOYMENT)[number]>("EMPLOYED");
  const [disbursementAccountId, setDisbursementAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const amount = Number(requestedAmount);
    const months = Number(durationMonths);
    if (!amount || !months || amount <= 0 || months <= 0) return null;
    const rate = DEFAULT_RATES[type] ?? 12;
    try {
      const emi = calculateEmi(amount, rate, months);
      const total = emi.mul(months);
      return { rate, emi: emi.toFixed(2), total: total.toFixed(2) };
    } catch {
      return null;
    }
  }, [requestedAmount, durationMonths, type]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await applyLoan({
        type,
        requestedAmount,
        durationMonths: Number(durationMonths),
        monthlyIncome,
        employmentStatus,
        disbursementAccountId,
        ...(description ? { description } : {}),
      }).unwrap();
      router.push("/customer/loans");
    } catch (e: unknown) {
      const err = e as { data?: { error?: { message?: string } } };
      setError(err?.data?.error?.message ?? "Failed to apply for loan");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/customer/loans" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Apply for Loan</h1>
          <p className="text-sm text-muted-foreground">Submit a loan application for review.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="loan-type">
                    Loan type
                  </label>
                  <select
                    id="loan-type"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value as (typeof LOAN_TYPES)[number])}
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="loan-employment">
                    Employment status
                  </label>
                  <select
                    id="loan-employment"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={employmentStatus}
                    onChange={(e) =>
                      setEmploymentStatus(e.target.value as (typeof EMPLOYMENT)[number])
                    }
                  >
                    {EMPLOYMENT.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="loan-amount">
                    Requested amount (BDT)
                  </label>
                  <Input
                    id="loan-amount"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder="e.g. 50000.00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="loan-duration">
                    Duration (months)
                  </label>
                  <Input
                    id="loan-duration"
                    type="number"
                    min={1}
                    max={360}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="loan-income">
                    Monthly income (BDT)
                  </label>
                  <Input
                    id="loan-income"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 30000.00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="loan-disbursement">
                    Disbursement account
                  </label>
                  {accountsLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <select
                      id="loan-disbursement"
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={disbursementAccountId}
                      onChange={(e) => setDisbursementAccountId(e.target.value)}
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nickname || a.accountNumber} ({a.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="loan-description">
                  Description (optional)
                </label>
                <textarea
                  id="loan-description"
                  className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purpose of loan"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={applyState.isLoading || !disbursementAccountId}>
                {applyState.isLoading ? "Submitting..." : "Submit application"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EMI Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {preview ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest rate</span>
                  <span className="font-medium">{preview.rate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated EMI</span>
                  <span className="font-medium">{formatBDT(preview.emi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-medium">{formatBDT(preview.total)}</span>
                </div>
                <p className="pt-2 text-xs text-muted-foreground">
                  Preview uses default rates. Final rate/EMI is determined during approval.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Enter amount and duration to preview EMI.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
