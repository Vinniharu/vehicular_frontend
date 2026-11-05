"use client";

import { useEffect, useState } from "react";
import { adminDeductFromWallet, adminGetClientWalletTransactions } from "@/lib/api";
import { Button, Card, Field, Input, Notice, Sheet, Textarea } from "@/app/dashboard/_kit";
import { formatNaira } from "@/app/admin/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const REASON_MAX = 120;
const DETAILS_MAX = 1000;

function newRequestKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

// Naira text → kobo, or null when it isn't a positive amount with at most 2 decimals.
function nairaToKobo(text) {
  const clean = String(text || "").replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const kobo = Math.round(Number(clean) * 100);
  return kobo > 0 ? kobo : null;
}

export default function DeductSheet({ client, onClose, onDeducted }) {
  const pushToast = useToast();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [requestKey, setRequestKey] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // One request key per opened form, so a double-click or retry deducts once.
  useEffect(() => {
    if (!client) return;
    setBalance(client.wallet_balance_kobo || 0);
    setAmount("");
    setReason("");
    setDetails("");
    setFormError(null);
    setConfirming(false);
    setRequestKey(newRequestKey());
  }, [client]);

  const amountKobo = nairaToKobo(amount);
  const overBalance = amountKobo != null && amountKobo > balance;
  const canReview = amountKobo != null && !overBalance && reason.trim().length > 0;

  const close = () => {
    if (!submitting) onClose();
  };

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);
    const res = await adminDeductFromWallet({
      customer_id: client.id,
      amount_kobo: amountKobo,
      reason: reason.trim(),
      details: details.trim(),
      request_key: requestKey,
    });
    if (res.error) {
      // Nothing was deducted, so the same key can safely be used on a retry.
      if (res.status === 402) {
        // The balance changed since the list loaded; show the real one.
        const fresh = await adminGetClientWalletTransactions(client.id, { page_size: 1 });
        if (fresh.data) setBalance(fresh.data.wallet_balance_kobo);
      }
      setSubmitting(false);
      setConfirming(false);
      setFormError(String(res.error));
      return;
    }
    const d = res.data;
    setSubmitting(false);
    if (d.duplicate) {
      pushToast({ tone: "success", title: "Already deducted", body: `This deduction went through earlier. Balance ${formatNaira(d.new_balance_kobo)}.` });
    } else {
      pushToast({
        tone: "success",
        title: `${formatNaira(d.amount_kobo)} deducted`,
        body: `New balance ${formatNaira(d.new_balance_kobo)}. ${d.email_sent ? "The customer has been emailed." : "The email to the customer couldn't be sent, so let them know directly."}`,
      });
    }
    onDeducted();
  };

  return (
    <Sheet
      open={!!client}
      onOpenChange={(o) => !o && close()}
      title={confirming ? "Confirm deduction" : "Deduct from wallet"}
      description={client ? `${client.name} · balance ${formatNaira(balance)}` : ""}
      size="sm"
      footer={
        confirming ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
              Back
            </Button>
            <Button block onClick={submit} loading={submitting}>
              Deduct {amountKobo != null ? formatNaira(amountKobo) : ""}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button block onClick={() => setConfirming(true)} disabled={!canReview}>
              Review
            </Button>
          </>
        )
      }
    >
      {client ? (
        <div className="space-y-4">
          {formError ? <Notice tone="red" title="Deduction not made">{formError}</Notice> : null}
          {client.wallet_linked_to_spare_parts ? (
            <Notice tone="amber" title="Shared wallet">
              This wallet is linked to Spare Parts, so the deduction also lowers the balance they see there.
            </Notice>
          ) : null}

          {confirming ? (
            <div className="space-y-3 text-[15px]">
              <p>
                Deduct <strong>{formatNaira(amountKobo)}</strong> from <strong>{client.name}</strong>&apos;s wallet?
              </p>
              <p className="text-cx-muted">
                Their balance goes from {formatNaira(balance)} to {formatNaira(balance - amountKobo)}.
                {client.email ? ` They'll get an email at ${client.email} explaining it.` : " This customer has no email address, so let them know directly."}
              </p>
              <Card>
                <p className="text-[13px] font-medium text-cx-muted">What it was for</p>
                <p className="mt-1">{reason.trim()}</p>
                {details.trim() ? <p className="mt-2 whitespace-pre-line text-[14px] text-cx-muted">{details.trim()}</p> : null}
              </Card>
            </div>
          ) : (
            <>
              <Field
                label="Amount (₦)"
                required
                error={amount && amountKobo == null ? "Enter an amount above zero, e.g. 15000 or 15000.50" : overBalance ? `More than the wallet holds (${formatNaira(balance)}).` : null}
              >
                {(p) => <Input {...p} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />}
              </Field>
              <Field label="What is this for?" required hint="The customer sees this in the email and in their wallet history.">
                {(p) => <Input {...p} maxLength={REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vehicle registration renewal" />}
              </Field>
              <Field label="Details" optional hint="Anything else the customer should know, e.g. who was paid and when.">
                {(p) => <Textarea {...p} rows={4} maxLength={DETAILS_MAX} value={details} onChange={(e) => setDetails(e.target.value)} />}
              </Field>
            </>
          )}
        </div>
      ) : null}
    </Sheet>
  );
}
