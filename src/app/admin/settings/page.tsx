"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settingsApi";

export default function AdminSettingsPage() {
  const { data, isLoading, error } = useGetSettingsQuery();
  const [updateSettings, updateState] = useUpdateSettingsMutation();
  const [form, setForm] = useState({
    dailyTransferLimit: "",
    maxSingleTransaction: "",
    minAccountBalance: "",
    transferFeePercent: "",
    minTransferFee: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.data) return;
    const s = data.data;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form from fetched settings
    setForm({
      dailyTransferLimit: s.dailyTransferLimit,
      maxSingleTransaction: s.maxSingleTransaction,
      minAccountBalance: s.minAccountBalance,
      transferFeePercent: s.transferFeePercent,
      minTransferFee: s.minTransferFee,
    });
  }, [data]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await updateSettings({
        dailyTransferLimit: form.dailyTransferLimit,
        maxSingleTransaction: form.maxSingleTransaction,
        minAccountBalance: form.minAccountBalance,
        transferFeePercent: Number(form.transferFeePercent),
        minTransferFee: form.minTransferFee,
      }).unwrap();
      setMessage("Settings saved.");
    } catch {
      setMessage("Failed to save settings.");
    }
  }

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error) return <p className="text-sm text-destructive">Failed to load settings.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Global transfer limits, fees, and minimum balance.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field
              id="settings-daily-limit"
              label="Daily transfer limit (BDT)"
              value={form.dailyTransferLimit}
              onChange={(v) => set("dailyTransferLimit", v)}
            />
            <Field
              id="settings-max-single"
              label="Max single transaction (BDT)"
              value={form.maxSingleTransaction}
              onChange={(v) => set("maxSingleTransaction", v)}
            />
            <Field
              id="settings-min-balance"
              label="Min account balance (BDT)"
              value={form.minAccountBalance}
              onChange={(v) => set("minAccountBalance", v)}
            />
            <Field
              id="settings-fee-percent"
              label="Transfer fee percent (%)"
              value={form.transferFeePercent}
              onChange={(v) => set("transferFeePercent", v)}
            />
            <Field
              id="settings-min-fee"
              label="Min transfer fee (BDT)"
              value={form.minTransferFee}
              onChange={(v) => set("minTransferFee", v)}
            />
            <Button type="submit" disabled={updateState.isLoading}>
              {updateState.isLoading ? "Saving..." : "Save settings"}
            </Button>
            {message && (
              <p className="text-sm text-muted-foreground" role="status">
                {message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
