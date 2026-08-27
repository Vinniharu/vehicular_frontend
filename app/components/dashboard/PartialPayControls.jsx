"use client";

import { useState } from "react";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { koboToNaira } from "@/lib/api";

const BRAND = "#28A745";

// ₦10,000 — mirrors app/core/payment_helpers.py MIN_PARTIAL_PAYMENT_KOBO on
// the backend ("pay small small" minimum contribution).
export const MIN_PARTIAL_PAYMENT_KOBO = 1000000;

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 hover:bg-slate-50";

/* "Pay small small" — a partial contribution (by wallet or card), at least
   ₦10,000 unless it's the exact remaining balance. Shared across every
   customer surface that offers a partial payment. onPayCard is optional —
   omit it to keep the wallet-only behavior some callers may still want. */
export default function PartialPayControls({ remainingKobo, walletBalanceKobo, payingWallet, onPay, payingCard, onPayCard }) {
  const minKobo = Math.min(MIN_PARTIAL_PAYMENT_KOBO, remainingKobo);
  const suggestedKobo = Math.max(0, Math.min(remainingKobo, walletBalanceKobo));
  const [amountNaira, setAmountNaira] = useState(String(Math.floor(suggestedKobo / 100) || Math.ceil(minKobo / 100)));

  const amountKobo = Math.round((parseFloat(amountNaira) || 0) * 100);
  const tooLow = amountKobo > 0 && amountKobo < minKobo;
  const tooHigh = amountKobo > remainingKobo;
  const overBalance = amountKobo > walletBalanceKobo;
  const canPayFromWallet = amountKobo > 0 && !tooLow && !tooHigh && !overBalance && !payingWallet;
  // Card has no wallet-balance ceiling — deliberately not gated by overBalance.
  const canPayByCard = amountKobo > 0 && !tooLow && !tooHigh && !payingCard;

  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold text-slate-600">Amount to pay now</label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[140px] flex-1 items-center rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 focus-within:border-[#28A745] focus-within:ring-2 focus-within:ring-[#28A745]/15">
          <span className="mr-1 text-[13.5px] font-semibold text-slate-500">₦</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
            className="w-full bg-transparent text-[13.5px] font-mono text-[#111111] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => onPay(amountKobo)}
          disabled={!canPayFromWallet}
          className={btnPrimary}
          style={{ background: BRAND }}
        >
          {payingWallet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          {payingWallet ? "Processing…" : `Pay ${koboToNaira(amountKobo || 0)} from wallet`}
        </button>
        {onPayCard && (
          <button
            type="button"
            onClick={() => onPayCard(amountKobo)}
            disabled={!canPayByCard}
            className={btnSecondary}
          >
            {payingCard ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {payingCard ? "Preparing…" : `Pay ${koboToNaira(amountKobo || 0)} by card`}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Minimum {koboToNaira(minKobo)}{minKobo < MIN_PARTIAL_PAYMENT_KOBO ? " — this closes out the balance" : " per payment"}. Pay bit by bit as you have funds, by wallet or by card.
      </p>
      {tooLow && <p className="mt-1 text-[11.5px] font-medium text-red-600">Minimum payment is {koboToNaira(minKobo)}.</p>}
      {!tooLow && tooHigh && <p className="mt-1 text-[11.5px] font-medium text-red-600">Amount exceeds the remaining balance of {koboToNaira(remainingKobo)}.</p>}
      {!tooHigh && overBalance && <p className="mt-1 text-[11.5px] font-medium text-red-600">Amount exceeds your wallet balance of {koboToNaira(walletBalanceKobo)} — Card or Transfer.</p>}
    </div>
  );
}
