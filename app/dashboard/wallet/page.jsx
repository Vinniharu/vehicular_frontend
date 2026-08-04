"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Check,
  Building2,
  AlertCircle,
  RefreshCw,
  History,
  X,
  Lock,
  Landmark,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getWallet, depositIntoWalletInitialize, verifyWalletDeposit, getWalletTransactions, activateWallet } from "@/lib/api";
import { btnPrimary, btnSecondary, inputBase, fieldLabel } from "@/app/dashboard/_shared/ui";
import Modal from "@/app/dashboard/_shared/Modal";
import { colors } from "@/lib/design-tokens";

const BRAND = colors.primary.DEFAULT;
const SANDBOX_DEPOSIT_ENABLED = true;

function koboToNaira(kobo) {
  return (kobo / 100).toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function txStatusMeta(status) {
  if (status === "failed") return { label: "Failed", className: "bg-red-50 text-red-600" };
  if (status === "pending") return { label: "Pending", className: "bg-amber-50 text-amber-700" };
  return { label: "Paid", className: "bg-[#28A745]/10 text-[#28A745]" };
}

function txLabel(tx) {
  if (tx.source && tx.source.startsWith("referral_reward_app_")) return "Referral Reward";
  return tx.type === "credit" ? "Wallet Deposit" : "Service Payment";
}

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmountNaira, setDepositAmountNaira] = useState("30000");
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState(null);

  const [notice, setNotice] = useState(null); // { type: "error"|"success", message }
  const [checkingRef, setCheckingRef] = useState(null);

  const [isBvnModalOpen, setIsBvnModalOpen] = useState(false);
  const [idType, setIdType] = useState("bvn");
  const [bvnInput, setBvnInput] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [bvnError, setBvnError] = useState(null);

  const loadData = async () => {
    const [wRes, tRes] = await Promise.all([getWallet(), getWalletTransactions()]);
    if (wRes.data) setWallet(wRes.data);
    if (tRes.data && Array.isArray(tRes.data)) setTransactions(tRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const reference =
      searchParams?.get("paymentReference") ||
      searchParams?.get("transactionReference") ||
      searchParams?.get("reference");
    if (reference) {
      setRefreshing(true);
      verifyWalletDeposit({ reference }).then((res) => {
        if (res.error) {
          // Don't strip the reference from the URL on failure — a page
          // refresh should be able to retry rather than permanently losing
          // the only copy of it.
          setNotice({ type: "error", message: res.error || "Couldn't confirm this deposit yet. Refresh this page to retry." });
        } else {
          const outcome = res.data?.status;
          if (outcome === "success") {
            setNotice({ type: "success", message: "Deposit confirmed — your wallet has been credited." });
          } else if (outcome === "failed") {
            setNotice({ type: "error", message: "This deposit didn't go through. No funds were added." });
          } else {
            setNotice({ type: "error", message: "Still waiting on confirmation from Monnify — use \"Check status\" on this transaction shortly." });
          }
          loadData();
          router.replace(pathname, { scroll: false });
        }
        setRefreshing(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckDepositStatus = async (reference) => {
    setCheckingRef(reference);
    const res = await verifyWalletDeposit({ reference });
    setCheckingRef(null);
    if (res.error) {
      setNotice({ type: "error", message: res.error });
      return;
    }
    const outcome = res.data?.status;
    if (outcome === "success") {
      setNotice({ type: "success", message: "Deposit confirmed — your wallet has been credited." });
    } else if (outcome === "failed") {
      setNotice({ type: "error", message: "This deposit didn't go through. No funds were added." });
    } else {
      setNotice({ type: "error", message: "Still pending — Monnify hasn't confirmed this one yet. Try again shortly." });
    }
    await loadData();
  };

  const handleCopyAccount = (accountNumber) => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleInitializeDeposit = async (e) => {
    e.preventDefault();
    setDepositError(null);
    const amountNaira = parseFloat(depositAmountNaira);
    if (isNaN(amountNaira) || amountNaira <= 0) {
      setDepositError("Enter an amount greater than 0.");
      return;
    }
    setDepositing(true);
    const res = await depositIntoWalletInitialize({
      amount_kobo: Math.round(amountNaira * 100),
    });
    setDepositing(false);
    if (res.error) {
      setDepositError(res.error);
    } else if (res.data?.authorization_url) {
      window.location.href = res.data.authorization_url;
    }
  };

  const handleProvisionVirtualAccount = async (e) => {
    e.preventDefault();
    setBvnError(null);
    if (bvnInput.trim().length !== 11) {
      setBvnError(`Enter a valid 11-digit ${idType.toUpperCase()}.`);
      return;
    }
    setProvisioning(true);
    const res = await activateWallet(
      idType === "bvn" ? { bvn: bvnInput.trim() } : { nin: bvnInput.trim() }
    );
    setProvisioning(false);
    if (res.error) {
      setBvnError(res.error);
    } else {
      if (res.data) setWallet(res.data);
      setIsBvnModalOpen(false);
      setBvnInput("");
    }
  };

  const balance = wallet?.balance_kobo || 0;
  const dva = wallet?.virtual_account || null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 pt-2">
      {/* Header Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
        <Wallet className="h-4 w-4" />
        <span className="text-slate-400">&gt;</span>
        <span>Transactions</span>
      </div>

      {notice && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3.5 text-[13px] font-medium ring-1 ring-inset ${
            notice.type === "error" ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
          }`}
        >
          {notice.type === "error" ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <Check className="h-4 w-4 shrink-0 mt-0.5" />}
          <span className="flex-1">{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 text-current opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : (
        <>
          {/* Balance & Actions Section */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[#7A7A7A] font-semibold text-[13px] uppercase tracking-wide">Total Balance</p>
              <div className="mt-2">
                <h1
                  className="text-4xl lg:text-[46px] tracking-tight text-[#111111]"
                  style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
                >
                  {koboToNaira(balance)}
                </h1>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {!dva && (
                <button type="button" onClick={() => setIsBvnModalOpen(true)} className="flex items-center gap-2 bg-white text-slate-800 border border-[#E5E5E5] shadow-sm rounded-full px-5 py-2.5 text-[13.5px] font-bold hover:bg-slate-50 transition-colors">
                  Setup Account
                  <div className="bg-slate-100 text-slate-600 rounded-full p-0.5">
                    <Plus className="h-3 w-3" />
                  </div>
                </button>
              )}
              {SANDBOX_DEPOSIT_ENABLED && (
                <button type="button" onClick={() => setIsDepositModalOpen(true)} className="flex items-center gap-2 bg-[#28A745] text-white rounded-full px-6 py-2.5 text-[13.5px] font-bold shadow-sm hover:bg-[#0c855e] transition-colors">
                  Deposit Funds
                  <div className="bg-white text-[#28A745] rounded-full p-0.5">
                    <ArrowDownRight className="h-3 w-3" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Reserved account details — send transfers here to fund the wallet */}
          {dva && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F5F5F5] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#28A745]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your dedicated account</p>
                  <p className="mt-0.5 font-mono text-[16px] font-bold text-[#111111]">{dva.account_number}</p>
                  <p className="text-[12.5px] text-slate-500 break-words">{dva.bank_name} · {dva.account_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyAccount(dva.account_number)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy number"}
              </button>
            </div>
          )}

          {/* Transactions Table Card */}
          <div className="bg-white rounded-[24px] border border-[#F5F5F5] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-2 sm:p-7 overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-7 px-3 sm:px-0">
              <h2 className="text-xl sm:text-[22px] font-extrabold text-[#111111] tracking-tight">Transactions</h2>
              
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                {/* Search Bar - styled per Adze design */}
                <div className="relative w-full sm:w-[280px]">
                  <input type="text" placeholder="Search for transactions" className="w-full bg-slate-50/70 border border-[#F5F5F5] rounded-full px-10 py-2.5 text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:border-slate-300 transition-colors" />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex items-center justify-center gap-2.5 bg-slate-50/70 border border-[#F5F5F5] rounded-full px-4 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap">
                  <span className="text-[13px] font-bold text-slate-700">This week</span>
                  <Calendar className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 mb-3">
                  <History className="h-6 w-6" />
                </div>
                <p className="text-[13.5px] font-semibold text-slate-700">No transactions yet</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <div className="space-y-3 sm:hidden">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit";
                    const meta = txStatusMeta(tx.status);
                    return (
                      <div key={tx.id} className="rounded-2xl border border-[#F5F5F5] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                              {isCredit ? <ArrowDownRight className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[13.5px] text-slate-800">
                                {txLabel(tx)}
                              </p>
                              <p className="text-[12px] text-slate-400">{formatDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <span className={`inline-flex shrink-0 items-center justify-center px-2.5 py-1 rounded-full text-[10.5px] font-extrabold tracking-wide uppercase ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`font-bold text-[14px] ${isCredit ? "text-[#28A745]" : "text-red-500"}`}>
                            {isCredit ? "↑ +" : "↓ −"} {koboToNaira(tx.amount_kobo)}
                          </span>
                          {tx.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleCheckDepositStatus(tx.reference)}
                              disabled={checkingRef === tx.reference}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {checkingRef === tx.reference && <Loader2 className="h-3 w-3 animate-spin" />}
                              Check status
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* sm and up: table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[#F5F5F5] text-[11.5px] font-semibold text-slate-500">
                        <th className="pb-4 pt-2 pl-2 w-1/3">Type</th>
                        <th className="pb-4 pt-2">Amount <span className="ml-1 opacity-50">↕</span></th>
                        <th className="pb-4 pt-2">Date <span className="ml-1 opacity-50">↕</span></th>
                        <th className="pb-4 pt-2">Status</th>
                        <th className="pb-4 pt-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/80">
                      {transactions.map((tx) => {
                        const isCredit = tx.type === "credit";
                        const meta = txStatusMeta(tx.status);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-4 pl-2">
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-white group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all border border-transparent group-hover:border-[#F5F5F5]">
                                  {isCredit ? <ArrowDownRight className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                                </div>
                                <span className="font-bold text-[13.5px] text-slate-800">
                                  {txLabel(tx)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 font-bold text-[14px]">
                              <span className={isCredit ? "text-[#28A745]" : "text-red-500"}>
                                {isCredit ? "↑ +" : "↓ −"} {koboToNaira(tx.amount_kobo)}
                              </span>
                            </td>
                            <td className="py-4 text-[13px] text-slate-400 font-medium">
                              {formatDate(tx.created_at)}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${meta.className}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-4 text-slate-400">
                              {tx.status === "pending" ? (
                                <button
                                  type="button"
                                  onClick={() => handleCheckDepositStatus(tx.reference)}
                                  disabled={checkingRef === tx.reference}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  {checkingRef === tx.reference && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Check status
                                </button>
                              ) : (
                                <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                  <span className="flex flex-col gap-[3px] items-center justify-center h-5 w-5">
                                    <span className="w-1 h-1 bg-current rounded-full" />
                                    <span className="w-1 h-1 bg-current rounded-full" />
                                    <span className="w-1 h-1 bg-current rounded-full" />
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Deposit modal */}
      <Modal open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen} title="Deposit into wallet">
          <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F5F5F5] px-5 py-4">
              <h3 className="text-[15px] font-bold text-[#111111]">Deposit into Wallet</h3>
              <button onClick={() => setIsDepositModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleInitializeDeposit} className="space-y-4 p-5">
              <p className="rounded-lg bg-emerald-50 p-2.5 text-[11.5px] text-emerald-800 ring-1 ring-inset ring-emerald-200">
                You will be redirected to a secure checkout to complete your deposit.
              </p>

              {depositError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {depositError}
                </div>
              )}

              <div>
                <label className={fieldLabel}>Amount (₦)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={depositAmountNaira}
                  onChange={(e) => setDepositAmountNaira(e.target.value)}
                  className={inputBase}
                />
              </div>

              <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsDepositModalOpen(false)} className={`${btnSecondary} w-full sm:w-auto`}>
                  Cancel
                </button>
                <button type="submit" disabled={depositing} className={`${btnPrimary} w-full sm:w-auto`} style={{ background: BRAND }}>
                  {depositing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {depositing ? "Redirecting…" : "Proceed to checkout"}
                </button>
              </div>
            </form>
          </div>
      </Modal>

      {/* BVN / dedicated account modal */}
      <Modal open={isBvnModalOpen} onOpenChange={setIsBvnModalOpen} title="Set up dedicated account">
          <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F5F5F5] px-5 py-4">
              <h3 className="text-[15px] font-bold text-[#111111]">Set up dedicated account</h3>
              <button onClick={() => setIsBvnModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleProvisionVirtualAccount} className="space-y-4 p-5">
              <p className="text-[12.5px] text-slate-500">
                Your BVN or NIN verifies your identity and generates a permanent account number in your name.
              </p>

              {bvnError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {bvnError}
                </div>
              )}

              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
                {["bvn", "nin"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setIdType(t)}
                    className="rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-all"
                    style={{
                      background: idType === t ? "#fff" : "transparent",
                      color: idType === t ? "#0f172a" : "#64748b",
                      boxShadow: idType === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              <div>
                <label className={fieldLabel}>{idType.toUpperCase()} (11 digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  required
                  value={bvnInput}
                  onChange={(e) => setBvnInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 22233344455"
                  className={`${inputBase} font-mono`}
                />
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                  <Lock className="h-3 w-3" />
                  Used only to generate your account — never shared or displayed elsewhere.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsBvnModalOpen(false)} className={`${btnSecondary} w-full sm:w-auto`}>
                  Cancel
                </button>
                <button type="submit" disabled={provisioning} className={`${btnPrimary} w-full sm:w-auto`} style={{ background: BRAND }}>
                  {provisioning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {provisioning ? "Setting up…" : "Set up account"}
                </button>
              </div>
            </form>
          </div>
      </Modal>
    </div>
  );
}