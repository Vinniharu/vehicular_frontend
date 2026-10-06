"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Inbox, Landmark, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { getAgentBankAccount, getAgentTransfers, getAgentWallet, koboToNaira, setAgentBankAccount, withdrawAgentWallet } from "@/lib/api";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Notice, PageHeader, Select, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const cx = (...parts) => parts.filter(Boolean).join(" ");

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
  { code: "999992", name: "OPay (PayCom)" },
  { code: "999991", name: "PalmPay" },
  { code: "50211", name: "Kuda Bank" },
  { code: "50515", name: "Moniepoint MFB" },
  { code: "302", name: "TAJ Bank" },
  { code: "303", name: "Lotus Bank" },
];

const TABS = [
  { key: "balance", label: "Earnings" },
  { key: "bank-account", label: "Bank account" },
  { key: "transfers", label: "Payouts" },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AgentWalletContent() {
  const pushToast = useToast();
  const searchParams = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "balance";
  const [tab, setTab] = useState(initialTab);

  const [wallet, setWallet] = useState(null);
  const [bank, setBank] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [bankCode, setBankCode] = useState(BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankError, setBankError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError(null);
    const [w, b, t] = await Promise.all([getAgentWallet(), getAgentBankAccount(), getAgentTransfers()]);
    if (w.error) setError(w.error);
    else if (w.data) setWallet(w.data);
    if (b.data?.account_number) setBank(b.data);
    if (Array.isArray(t.data)) setTransfers(t.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveBank = async (e) => {
    e.preventDefault();
    setBankError(null);
    if (accountNumber.trim().length !== 10) return setBankError("Enter the 10-digit account number.");
    setSaving(true);
    const res = await setAgentBankAccount({ bank_code: bankCode, account_number: accountNumber.trim() });
    setSaving(false);
    if (res.error) return setBankError(res.error);
    setBank(res.data);
    setAccountNumber("");
    pushToast({ tone: "success", title: "Bank account saved and verified" });
  };

  const balance = wallet?.balance_kobo || 0;

  const startWithdraw = () => {
    if (!bank) {
      pushToast({ tone: "error", title: "Add a bank account first", body: "We need somewhere to send your money." });
      setTab("bank-account");
      return;
    }
    setConfirmOpen(true);
  };

  const withdraw = async () => {
    setWithdrawing(true);
    const res = await withdrawAgentWallet({ amount_kobo: balance });
    setWithdrawing(false);
    if (res.error) return pushToast({ tone: "error", title: "Withdrawal failed", body: res.error });
    setConfirmOpen(false);
    pushToast({ tone: "success", title: "Withdrawal started", body: "The money should reach your account shortly." });
    load(true);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Wallet" />
        <SkeletonList rows={3} />
      </div>
    );
  }
  if (error) return <ErrorState title="Your wallet didn't load" message={error} onRetry={() => load()} />;

  const transactions = wallet?.transactions || [];
  const totalPaidOut = transfers.filter((t) => t.status === "success").reduce((s, t) => s + (t.amount_kobo || 0), 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Wallet"
        description="Your earnings, bank account and payouts."
        actions={<Button variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onClick={() => load(true)}>Refresh</Button>}
      />

      <Card className="mb-4">
        <p className="text-sm text-cx-muted">Available to withdraw</p>
        <p className="mt-1 font-display text-[34px] leading-tight text-cx-ink">{koboToNaira(balance)}</p>
        <p className="mt-1 text-sm text-cx-muted">{[wallet?.vio_office, wallet?.lga].filter(Boolean).join(" · ")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-cx-line pt-4">
          <div>
            <p className="text-[13px] text-cx-muted">Total earned</p>
            <p className="text-[17px] font-semibold text-cx-ink">{koboToNaira(wallet?.total_income_kobo || 0)}</p>
          </div>
          <div>
            <p className="text-[13px] text-cx-muted">Withdrawn</p>
            <p className="text-[17px] font-semibold text-cx-ink">{koboToNaira(wallet?.total_withdrawn_kobo || 0)}</p>
          </div>
        </div>
        <Button className="mt-4" size="lg" block icon={ArrowUpRight} disabled={balance <= 0} onClick={startWithdraw}>
          Withdraw to bank
        </Button>
        {!bank ? <p className="mt-2 text-center text-[13px] text-cx-muted">Add a bank account to withdraw.</p> : null}
      </Card>

      <div role="tablist" aria-label="Wallet sections" className="mb-4 grid grid-cols-3 gap-1 rounded-cx bg-cx-sunken p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cx("cx-focus min-h-11 rounded-cx-sm text-[15px] font-semibold", tab === t.key ? "bg-cx-surface text-cx-ink shadow-cx" : "text-cx-muted hover:text-cx-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "balance" ? (
        transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="No earnings yet" description="Your earnings appear here when you accept paid jobs." />
        ) : (
          <Card padded={false}>
            <ul className="divide-y divide-cx-line">
              {transactions.map((tx, i) => {
                const credit = tx.type === "credit";
                return (
                  <li key={tx.id || i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", credit ? "bg-cx-brand-soft text-cx-brand-deep" : "bg-cx-sunken text-cx-ink-2")}>
                      {credit ? <ArrowDownLeft className="h-5 w-5" aria-hidden /> : <ArrowUpRight className="h-5 w-5" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-cx-ink">{tx.description || (credit ? "Job earnings" : "Withdrawal")}</p>
                      <p className="text-[13px] text-cx-muted">{formatDate(tx.created_at)}</p>
                    </div>
                    <p className={cx("shrink-0 text-[15px] font-semibold", credit ? "text-cx-brand-deep" : "text-cx-ink")}>
                      {credit ? "+" : "−"}
                      {koboToNaira(tx.amount_kobo)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : null}

      {tab === "bank-account" ? (
        <div className="space-y-4">
          {bank ? (
            <Card>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
                  <Landmark className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[16px] font-semibold text-cx-ink">{bank.account_name}</p>
                    <Badge tone="brand"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verified</Badge>
                  </div>
                  <p className="font-mono text-[15px] text-cx-ink-2">{bank.account_number}</p>
                  <p className="text-[13px] text-cx-muted">{bank.bank_name || (bank.bank_code ? `Bank code ${bank.bank_code}` : "")}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Notice tone="amber" title="No bank account yet">You need a verified bank account to accept jobs and withdraw.</Notice>
          )}

          <Card as="form" onSubmit={saveBank}>
            <h2 className="mb-4 text-[16px] font-semibold text-cx-ink">{bank ? "Change bank account" : "Add bank account"}</h2>
            <div className="space-y-4">
              {bankError ? <Notice tone="red">{bankError}</Notice> : null}
              <Field label="Bank">
                {(p) => (
                  <Select {...p} value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
                    {BANKS.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Account number" hint="We look up the account name for you.">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="numeric"
                    autoComplete="off"
                    className="font-mono"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="0123456789"
                  />
                )}
              </Field>
              <Button type="submit" size="lg" block icon={ShieldCheck} loading={saving}>
                {saving ? "Verifying…" : bank ? "Save new account" : "Save and verify"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "transfers" ? (
        transfers.length === 0 ? (
          <EmptyState icon={Inbox} title="No payouts yet" description="Money sent to your bank account appears here." />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-cx-muted">Paid out so far: <strong className="text-cx-ink">{koboToNaira(totalPaidOut)}</strong></p>
            <Card padded={false}>
              <ul className="divide-y divide-cx-line">
                {transfers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-cx-ink">{koboToNaira(t.amount_kobo)}</p>
                      <p className="truncate text-[13px] text-cx-muted">
                        {t.application_id ? `Job #${String(t.application_id).replace(/^app_/, "")} · ` : ""}
                        {formatDate(t.created_at)}
                      </p>
                    </div>
                    <Badge tone={t.status === "success" ? "brand" : t.status === "failed" ? "red" : "amber"}>
                      {t.status === "success" ? "Paid" : t.status === "failed" ? "Failed" : "Pending"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )
      ) : null}

      <Sheet
        open={confirmOpen}
        onOpenChange={(o) => !o && !withdrawing && setConfirmOpen(false)}
        title={`Withdraw ${koboToNaira(balance)}?`}
        description="The full balance goes to your bank account."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={withdrawing}>Cancel</Button>
            <Button block loading={withdrawing} onClick={withdraw}>Withdraw</Button>
          </>
        }
      >
        {bank ? (
          <div className="rounded-cx bg-cx-sunken p-3">
            <p className="text-[15px] font-semibold text-cx-ink">{bank.account_name}</p>
            <p className="font-mono text-sm text-cx-ink-2">{bank.account_number}{bank.bank_name ? ` · ${bank.bank_name}` : ""}</p>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

export default function AgentWalletPage() {
  return (
    <Suspense fallback={<SkeletonList rows={3} />}>
      <AgentWalletContent />
    </Suspense>
  );
}
