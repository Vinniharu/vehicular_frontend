"use client";

// Edit one pay amount. Blank (or "Use default") clears it so the next rule
// in line applies. onSave(kobo | null) returns { ok, error }.

import { useEffect, useState } from "react";
import { Button, Field, Notice, Sheet } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { MoneyInput, moneyError, toKobo, toNaira } from "../../_kit";

export default function PayEditSheet({ open, onOpenChange, title, description, kobo, fallbackText, onSave, children, clearLabel = "Use default instead" }) {
  const pushToast = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null); // "save" | "clear"

  useEffect(() => {
    if (!open) return;
    setValue(toNaira(kobo));
    setError(null);
  }, [open, kobo]);

  const run = async (mode) => {
    let next = null;
    if (mode === "save") {
      const err = moneyError(value, { required: true });
      if (err) return setError(err);
      next = toKobo(value);
    }
    setError(null);
    setSaving(mode);
    const res = await onSave(next);
    setSaving(null);
    if (!res?.ok) return setError(res?.error || "Couldn't save. Try again.");
    pushToast({ tone: "success", title: mode === "clear" ? "Now using the default" : "Pay saved", body: title });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={!!saving}>Cancel</Button>
          <Button block loading={saving === "save"} disabled={saving === "clear"} onClick={() => run("save")}>Save pay</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Notice tone="red">{error}</Notice> : null}
        <Field label="Agent is paid" required hint={fallbackText ? `Without this, ${fallbackText}.` : undefined}>
          {(p) => <MoneyInput {...p} value={value} onChange={setValue} placeholder="0" />}
        </Field>
        {children}
        {kobo !== null && kobo !== undefined ? (
          <Button variant="ghost" className="-ml-1" loading={saving === "clear"} disabled={saving === "save"} onClick={() => run("clear")}>
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}
