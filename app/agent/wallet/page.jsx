"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet, TrendingUp, ArrowDownLeft, RefreshCw,
  Loader2, AlertCircle, CheckCircle2, Landmark,
  BarChart3, Calendar, ArrowLeftRight, Inbox,
  ShieldCheck, ChevronDown,
} from "lucide-react";
import { getAgentWallet, getAgentBankAccount, setAgentBankAccount, getAgentTransfers, withdrawAgentWallet, koboToNaira } from "@/lib/api";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50";

const STATUS_TONE = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

// Common Nigerian bank CBN codes
const BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Parallex Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank For Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const TABS = [
  { key: "balance", label: "Balance" },
  { key: "bank-account", label: "Bank Account" },
  { key: "transfers", label: "Transfers" },
];

function AgentWalletContent() {
  const searchParams = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "balance";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [wallet, setWallet] = useState(null);
  const [bankAccount, setBankAccountState] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [bankCode, setBankCode] = useState(BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadAll = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const [walletRes, bankRes, transfersRes] = await Promise.all([
      getAgentWallet(),
      getAgentBankAccount(),
      getAgentTransfers(),
    ]);
    if (walletRes.error) setError(walletRes.error);
    else if (walletRes.data) setWallet(walletRes.data);
    if (bankRes.data?.account_number) setBankAccountState(bankRes.data);
    if (Array.isArray(transfersRes.data)) setTransfers(transfersRes.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim() || accountNumber.trim().length !== 10) {
      setNotice({ type: "error", message: "Enter a valid 10-digit account number." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const res = await setAgentBankAccount({ bank_code: bankCode, account_number: accountNumber.trim() });
    setSaving(false);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
    } else {
      setBankAccountState(res.data);
      setNotice({ type: "success", message: "Settlement account saved and verified." });
      setAccountNumber("");
    }
  };

  const handleWithdraw = async () => {
    if (!bankAccount) {
      alert("Please link a bank account first.");
      setActiveTab("bank-account");
      return;
    }
    const amount = wallet?.balance_kobo;
    if (!amount || amount <= 0) return;
    
    if (!window.confirm(`Are you sure you want to withdraw ${koboToNaira(amount)} to ${bankAccount.account_name}?`)) return;

    setWithdrawing(true);
    const res = await withdrawAgentWallet({ amount_kobo: amount });
    setWithdrawing(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert("Withdrawal initiated successfully! The funds will arrive in your account shortly.");
      loadAll(true);
    }
  };

  const transactions = wallet?.transactions || [];
  // Backend-computed, unpaginated totals — a client-side reduce over
  // `transactions` only sees the last 50 rows and double-counts a job
  // whose auto-withdrawal failed and got reversed back into the balance.
  const totalEarned = wallet?.total_income_kobo || 0;
  const totalWithdrawn = wallet?.total_withdrawn_kobo || 0;
  const totalTransferred = transfers.filter((t) => t.status === "success").reduce((sum, t) => sum + (t.amount_kobo || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
        <p className="text-[13px] font-medium text-slate-500">Loading your wallet…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-md space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-500" />
        <p className="text-[14px] font-bold text-slate-900">Failed to load wallet</p>
        <p className="text-[13px] text-red-700">{error}</p>
        <button onClick={() => loadAll()} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-red-700 hover:bg-red-50">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
            <Wallet className="h-3.5 w-3.5 text-[#28A745]" />
            Earnings Wallet
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Earnings</h1>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Balance, settlement account, and payout history — all in one place.
          </p>
        </div>
        <button onClick={() => loadAll(true)} disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
          {refreshing ? "Syncing…" : "Refresh"}
        </button>
      </div>

      {/* Balance hero — shown above all tabs */}
      <div
        className="relative overflow-hidden rounded-3xl p-7 text-white"
        style={{ background: "linear-gradient(135deg, #065f46 0%, #0a7a58 40%, #28A745 100%)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />

        <p className="text-[12px] font-semibold uppercase tracking-widest text-emerald-200/70">
          Available Balance
        </p>
        <div className="flex items-center justify-between mt-2">
          <p className="font-mono text-[38px] font-bold tracking-tight">
            {koboToNaira(wallet?.balance_kobo || 0)}
          </p>
          <button
            onClick={handleWithdraw}
            disabled={withdrawing || !wallet?.balance_kobo || wallet.balance_kobo <= 0}
            className="rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#065f46] shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            Withdraw
          </button>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-emerald-200/80">
          <span className="font-semibold text-white">{wallet?.lga}</span>
          <span>·</span>
          <span>{wallet?.vio_office || "VIO Office"}</span>
        </p>
        <p className="mt-3 text-[12px] text-emerald-100/70 max-w-md">
          {bankAccount
            ? "Job earnings are credited here. You can manually withdraw your balance to your settlement account at any time."
            : "Add a settlement account below so you can withdraw your job earnings."}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-all"
            style={{
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "#0f172a" : "#64748b",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Balance tab ── */}
      {activeTab === "balance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total earned</p>
              <p className="mt-1.5 font-mono text-[20px] font-bold text-slate-900">{koboToNaira(totalEarned)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Withdrawn</p>
              <p className="mt-1.5 font-mono text-[20px] font-bold text-slate-500">{koboToNaira(totalWithdrawn)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transactions</p>
              <p className="mt-1.5 font-mono text-[20px] font-bold text-slate-900">{transactions.length}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Transaction History</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">Credits are added when you accept a job offer.</p>
              </div>
              <BarChart3 className="h-4 w-4 text-slate-300" />
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                  <Wallet className="h-7 w-7 text-slate-300" />
                </div>
                <p className="mt-4 text-[14px] font-bold text-slate-800">No transactions yet</p>
                <p className="mt-1 max-w-xs text-[12.5px] text-slate-400 leading-relaxed">
                  Accept a job offer to earn your first credit — it will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx, idx) => (
                  <div key={tx.id || idx} className="flex items-start justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tx.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {tx.type === "credit"
                          ? <ArrowDownLeft className="h-5 w-5" />
                          : <TrendingUp className="h-5 w-5 rotate-180" />}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-slate-900">
                          {tx.description || (tx.type === "credit" ? "Earnings credit" : "Withdrawal")}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(tx.created_at)}
                        </div>
                        {tx.reference && (
                          <p className="mt-0.5 font-mono text-[10.5px] text-slate-300">{tx.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-mono text-[15px] font-bold ${tx.type === "credit" ? "text-emerald-700" : "text-red-600"}`}>
                        {tx.type === "credit" ? "+" : "–"}{koboToNaira(tx.amount_kobo)}
                      </p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tx.type === "credit" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {tx.type === "credit" ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                        {tx.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bank Account tab ── */}
      {activeTab === "bank-account" && (
        <div className="space-y-6">
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
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-slate-900">Current settlement account</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] font-semibold text-slate-800">{bankAccount.account_name}</p>
                  <p className="font-mono text-[13px] text-slate-500">
                    {bankAccount.account_number}
                    {bankAccount.bank_name && ` · ${bankAccount.bank_name}`}
                    {!bankAccount.bank_name && bankAccount.bank_code && ` · Bank code ${bankAccount.bank_code}`}
                  </p>
                  {bankAccount.created_at && (
                    <p className="mt-1 text-[11.5px] text-slate-400">Added {formatDate(bankAccount.created_at)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleBankSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="border-b border-slate-100 pb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              {bankAccount ? "Update settlement account" : "Add settlement account"}
            </h3>
            <div>
              <label className={fieldLabel}>Bank</label>
              <div className="relative">
                <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
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
              <p className="mt-1.5 text-[11.5px] text-slate-400">
                The account name is resolved automatically — you don't need to enter it.
              </p>
            </div>
            <button type="submit" disabled={saving} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {saving ? "Verifying…" : bankAccount ? "Update account" : "Save & verify account"}
            </button>
          </form>
        </div>
      )}

      {/* ── Transfers tab ── */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <p className="text-[13px] text-slate-500">
            Lifetime auto-withdrawn: <strong className="font-mono" style={{ color: BRAND }}>{koboToNaira(totalTransferred)}</strong>
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {transfers.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No transfers yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Payouts land here once you accept a paid job.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="font-mono text-[13.5px] font-bold text-slate-900">{koboToNaira(t.amount_kobo)}</p>
                      <p className="mt-0.5 text-[12px] text-slate-400">
                        App #{t.application_id} · {t.transfer_code || "—"} · {t.created_at ? new Date(t.created_at).toLocaleString("en-NG") : "—"}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${STATUS_TONE[t.status] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                      {t.status === "failed" && <ArrowLeftRight className="h-3 w-3" />}
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentWalletPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      </div>
    }>
      <AgentWalletContent />
    </Suspense>
  );
}
