"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import { dealerGetBankAccount, dealerSetBankAccount } from "@/lib/api";

const BRAND = "#28A745";
const inputBase = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";

const BANKS = [
  { code: "044", name: "Access Bank" }, { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" }, { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" }, { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" }, { code: "082", name: "Keystone Bank" },
  { code: "076", name: "Polaris Bank" }, { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" }, { code: "232", name: "Sterling Bank" },
  { code: "032", name: "Union Bank of Nigeria" }, { code: "033", name: "United Bank For Africa" },
  { code: "215", name: "Unity Bank" }, { code: "035", name: "Wema Bank" }, { code: "057", name: "Zenith Bank" },
];

export default function DealerBankAccountPage() {
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankCode, setBankCode] = useState(BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    dealerGetBankAccount().then((res) => {
      if (res.data?.account_number) setBankAccount(res.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim() || accountNumber.trim().length !== 10) {
      setNotice({ type: "error", message: "Enter a valid 10-digit account number." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const res = await dealerSetBankAccount({ bank_code: bankCode, account_number: accountNumber.trim() });
    setSaving(false);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setBankAccount(res.data);
      setNotice({ type: "success", message: "Settlement account saved and verified." });
      setAccountNumber("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bank Account</h1>
        <p className="mt-1 text-[13.5px] text-slate-500">Where escrow payouts are sent when you withdraw.</p>
      </div>

      {notice && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3.5 text-[13px] ${notice.type === "error" ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 font-medium"}`}>
          {notice.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      {bankAccount && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-800">{bankAccount.account_name}</p>
              <p className="font-mono text-[13px] text-slate-500">
                {bankAccount.account_number}{bankAccount.bank_name && ` · ${bankAccount.bank_name}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="border-b border-slate-100 pb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
          {bankAccount ? "Update settlement account" : "Add settlement account"}
        </h3>
        <div>
          <label className={fieldLabel}>Bank</label>
          <div className="relative">
            <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
              {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div>
          <label className={fieldLabel}>Account number</label>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="0123456789"
            maxLength={10}
            className={`${inputBase} font-mono`}
          />
        </div>
        <button type="submit" disabled={saving} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? "Verifying…" : bankAccount ? "Update account" : "Save & verify account"}
        </button>
      </form>
    </div>
  );
}
