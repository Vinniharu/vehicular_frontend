"use client";

// Forced first-login password change, shared by the agent and staff portals.

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { authSetPassword, setCachedUser } from "@/lib/api";
import { Button, Field, Input, Notice } from "@/app/dashboard/_kit";

export default function PasswordGate({ user, onDone, minLength = 8 }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < minLength) return setError(`Use at least ${minLength} characters.`);
    if (password !== confirm) return setError("The two passwords don't match.");
    setSaving(true);
    const res = await authSetPassword({ new_password: password });
    setSaving(false);
    if (res.error) return setError(res.error);
    const updated = { ...user, must_change_password: false };
    setCachedUser(updated);
    onDone(updated);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-cx-ink/50 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <form onSubmit={submit} className="cx-safe-bottom w-full space-y-4 rounded-t-[22px] bg-cx-surface p-5 shadow-cx-raised md:max-w-md md:rounded-cx-lg">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cx-amber-soft text-cx-amber">
            <KeyRound className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 id="pw-title" className="text-lg font-semibold text-cx-ink">Set your own password</h2>
            <p className="mt-0.5 text-sm text-cx-muted">Your account was set up with a temporary password. Choose a new one to continue.</p>
          </div>
        </div>
        {error ? <Notice tone="red">{error}</Notice> : null}
        <Field label="New password" hint={`At least ${minLength} characters`}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <Field label="Type it again">
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}
        </Field>
        <Button type="submit" size="lg" block loading={saving}>
          {saving ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}

