"use client";

import { useState } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { koboToNaira } from "@/lib/api";
import { Button, Field, Input } from "@/app/dashboard/_kit";

// Fallback only — the real first-payment minimum is configured per service on
// the backend and arrives as payment_options.minimum_payable_kobo (the
// service's initial deposit before anything is paid, the rest of the deposit if a payment came in short, 1 kobo once the deposit is reached).
export const MIN_PARTIAL_PAYMENT_KOBO = 1000000;

export function resolveMinimumKobo({ minimumPayableKobo, remainingKobo, amountPaidKobo = 0 }) {
  if (minimumPayableKobo != null && minimumPayableKobo > 0) return Math.min(minimumPayableKobo, remainingKobo);
  if (amountPaidKobo > 0) return 1;
  return Math.min(MIN_PARTIAL_PAYMENT_KOBO, remainingKobo);
}

export default function PartialPayControls({
  remainingKobo,
  walletBalanceKobo = 0,
  amountPaidKobo = 0,
  minimumPayableKobo,
  payingWallet,
  onPay,
  payingCard,
  onPayCard,
  partialAllowed = true,
}) {
  const minKobo = resolveMinimumKobo({ minimumPayableKobo, remainingKobo, amountPaidKobo });
  const suggestedKobo = Math.max(minKobo, Math.min(remainingKobo, walletBalanceKobo));
  // Hooks run before any branch so the call order never changes between renders.
  const [amountNaira, setAmountNaira] = useState(String(Math.ceil(suggestedKobo / 100) || ""));

  if (!partialAllowed || minKobo >= remainingKobo) {
    const canPayFromWallet = remainingKobo > 0 && remainingKobo <= walletBalanceKobo && !payingWallet;
    return (
      <div className="space-y-3">
        <p className="text-[15px] text-cx-ink">
          Amount due: <strong>{koboToNaira(remainingKobo)}</strong>
          {!partialAllowed ? <span className="text-cx-muted"> (paid in full)</span> : null}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button icon={Wallet} loading={payingWallet} disabled={!canPayFromWallet} onClick={() => onPay(remainingKobo)}>
            Pay {koboToNaira(remainingKobo)} from wallet
          </Button>
          {onPayCard ? (
            <Button variant="secondary" icon={CreditCard} loading={payingCard} disabled={remainingKobo <= 0} onClick={() => onPayCard(remainingKobo)}>
              Pay by card or transfer
            </Button>
          ) : null}
        </div>
        {remainingKobo > walletBalanceKobo ? (
          <p className="text-[13px] text-cx-muted">Your wallet has {koboToNaira(walletBalanceKobo)}. Top it up or pay by card.</p>
        ) : null}
      </div>
    );
  }

  const amountKobo = Math.round((parseFloat(amountNaira) || 0) * 100);
  const tooLow = amountKobo > 0 && amountKobo < minKobo;
  const tooHigh = amountKobo > remainingKobo;
  const overBalance = amountKobo > walletBalanceKobo;
  const valid = amountKobo > 0 && !tooLow && !tooHigh;
  const error = tooLow
    ? `Pay at least ${koboToNaira(minKobo)}.`
    : tooHigh
      ? `That's more than the ${koboToNaira(remainingKobo)} you owe.`
      : null;

  return (
    <div className="space-y-3">
      <Field
        label="Amount to pay now"
        error={error}
        hint={`Between ${koboToNaira(minKobo)} and ${koboToNaira(remainingKobo)}. Pay the rest whenever you're ready.`}
      >
        {(a11y) => (
          <Input
            {...a11y}
            prefix="₦"
            type="number"
            inputMode="decimal"
            min={0}
            value={amountNaira}
            invalid={!!error}
            onChange={(e) => setAmountNaira(e.target.value)}
          />
        )}
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button icon={Wallet} loading={payingWallet} disabled={!valid || overBalance} onClick={() => onPay(amountKobo)}>
          Pay {koboToNaira(amountKobo || 0)} from wallet
        </Button>
        {onPayCard ? (
          <Button variant="secondary" icon={CreditCard} loading={payingCard} disabled={!valid} onClick={() => onPayCard(amountKobo)}>
            Pay by card or transfer
          </Button>
        ) : null}
      </div>
      {valid && overBalance ? (
        <p className="text-[13px] text-cx-muted">Your wallet has {koboToNaira(walletBalanceKobo)}. Top it up or pay by card.</p>
      ) : null}
    </div>
  );
}
