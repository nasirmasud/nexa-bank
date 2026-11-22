"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChangePasswordMutation,
  useGetMeQuery,
  useSetPinMutation,
  useToggle2faMutation,
  useUpdateMeMutation,
  useUpdateThemeMutation,
  type MyProfile,
} from "@/store/api/profileApi";

function SettingsForm({ me }: { me: MyProfile }) {
  const { setTheme } = useTheme();
  const [updateMe, updateMeState] = useUpdateMeMutation();
  const [changePassword, changePwState] = useChangePasswordMutation();
  const [setPin, setPinState] = useSetPinMutation();
  const [toggle2fa, toggle2faState] = useToggle2faMutation();
  const [updateTheme] = useUpdateThemeMutation();

  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security, and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateMe({ name, phone: phone || null }).unwrap();
                toast.success("Profile updated");
              } catch {}
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="settings-name">
                  Name
                </label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="settings-phone">
                  Phone
                </label>
                <Input
                  id="settings-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">Email: {me.email}</div>
            <Button type="submit" disabled={updateMeState.isLoading}>
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await changePassword({ currentPassword, newPassword }).unwrap();
                setCurrentPassword("");
                setNewPassword("");
                toast.success("Password changed");
              } catch {}
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="settings-current-password">
                  Current password
                </label>
                <Input
                  id="settings-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="settings-new-password">
                  New password
                </label>
                <Input
                  id="settings-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={changePwState.isLoading}>
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await setPin({ ...(me.hasPin ? { currentPin } : {}), newPin }).unwrap();
                setCurrentPin("");
                setNewPin("");
                toast.success(me.hasPin ? "PIN updated" : "PIN set");
              } catch {}
            }}
          >
            <p className="text-sm text-muted-foreground">
              {me.hasPin
                ? "Enter your current PIN to set a new one."
                : "You don't have a PIN yet. Set one to enable transfers."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {me.hasPin && (
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="settings-current-pin">
                    Current PIN
                  </label>
                  <Input
                    id="settings-current-pin"
                    type="password"
                    inputMode="numeric"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="settings-new-pin">
                  New PIN
                </label>
                <Input
                  id="settings-new-pin"
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={setPinState.isLoading}>
              {me.hasPin ? "Update PIN" : "Set PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Toggle 2FA flag for your account.</p>
            </div>
            <Button
              variant="outline"
              disabled={toggle2faState.isLoading}
              onClick={async () => {
                try {
                  await toggle2fa({ enabled: !me.twoFactorEnabled }).unwrap();
                  toast.success("2FA updated");
                } catch {}
              }}
            >
              {me.twoFactorEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="settings-theme">
              Theme
            </label>
            <select
              id="settings-theme"
              className="h-9 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
              value={me.theme}
              onChange={async (e) => {
                const theme = e.target.value as "light" | "dark" | "system";
                setTheme(theme);
                try {
                  await updateTheme({ theme }).unwrap();
                  toast.success("Theme updated");
                } catch {}
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomerSettingsPage() {
  const { data, isLoading } = useGetMeQuery();
  const me = data?.data;

  if (isLoading || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <SettingsForm key={me.updatedAt} me={me} />;
}
