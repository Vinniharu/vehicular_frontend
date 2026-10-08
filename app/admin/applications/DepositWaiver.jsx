"use client";

// Deposit status for one application, with the admin-only "Allow without
// deposit" exception (reason required, logged in its history). A waived
// application can be processed with nothing paid; it still needs full
// payment before it goes to an agent.

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { adminWaiveDeposit, getStaffApplication, koboToNaira } from "@/lib/api";
import { Badge, Button, Field, Notice, Sheet, Textarea } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

export default function DepositWaiver({ applicationId, onChanged }) {
  const pushToast = useToast();
  const [po, setPo] = useState(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    const res = await getStaffApplication(applicationId);
    setPo(res.data?.payment_options || null);
  };

  useEffect(() => {
    setPo(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  if (!po || po.payment_status === "success") return null;

  const waive = async () => {
    if (!reason.trim()) return setError("Give a reason — it's saved in the application's history.");
    setSaving(true);
    setError(null);
    const res = await adminWaiveDeposit(applicationId, reason.trim());
    setSaving(false);
    if (res.error) {
      // A bare "Not Found" means the live API doesn't have this route yet.
      if (res.status === 404 && /^not found\.?$/i.test(String(res.error).trim())) {
        return setError("This feature isn't on the live server yet — the backend needs to be redeployed.");
      }
      return setError(res.error);
    }
    pushToast({ tone: "success", title: "Deposit waived", body: `Application #${applicationId} can now be processed. It goes to an agent once paid in full.` });
    setOpen(false);
    await load();
    onChanged?.();
  };

  return (
    <div className="rounded-cx-lg border border-cx-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold text-cx-ink">Deposit</span>
        {po.deposit_waived ? (
          <Badge tone="neutral">Deposit waived</Badge>
        ) : po.has_minimum_payment ? (
          <Badge tone="brand">Deposit paid</Badge>
        ) : (
          <Badge tone="amber">Not reached</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-cx-ink-2">
        Paid {koboToNaira(po.amount_paid_kobo || 0)} of {koboToNaira(po.amount_kobo || 0)}
        {po.required_deposit_kobo ? ` · deposit required ${koboToNaira(po.required_deposit_kobo)}` : ""}
        {po.deposit_shortfall_kobo > 0 && !po.deposit_waived ? ` · ${koboToNaira(po.deposit_shortfall_kobo)} still needed` : ""}
      </p>
      {po.deposit_waived ? (
        <p className="mt-1 text-sm text-cx-muted">
          Agent assignment waits for full payment ({koboToNaira(Math.max(0, (po.amount_kobo || 0) - (po.amount_paid_kobo || 0)))} still owed).
        </p>
      ) : null}
      {!po.has_minimum_payment && !po.deposit_waived ? (
        <Button variant="secondary" size="sm" icon={ShieldCheck} className="mt-3" onClick={() => { setReason(""); setError(null); setOpen(true); }}>
          Allow without deposit
        </Button>
      ) : null}

      <Sheet
        open={open}
        onOpenChange={(o) => !o && !saving && setOpen(false)}
        title="Allow without deposit?"
        description="Staff can review and process this application with no deposit paid. It won't be sent to an agent until the customer pays in full."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button block loading={saving} onClick={waive}>Allow it</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Notice tone="red">{error}</Notice> : null}
          <Field label="Reason" required hint="Saved in the application's history.">
            {(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Agreed with the customer that they'll pay in full before the agent visit." />}
          </Field>
        </div>
      </Sheet>
    </div>
  );
}
