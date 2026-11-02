"use client";

import { useEffect, useState } from "react";
import { MinusCircle, Search, Wallet } from "lucide-react";
import { adminDeductFromWallet, adminListWalletDeductions, adminSearchDeductionCustomers } from "@/lib/api";
import { Badge, Button, Card, Field, Input, Notice, SectionTitle, Sheet, SkeletonList, Textarea } from "@/app/dashboard/_kit";
import { ResponsiveTable, StatTile, formatNaira } from "@/app/admin/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const REASON_MAX = 120;
const DETAILS_MAX = 1000;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

export default function WalletDeductionsPanel() {
  const pushToast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [history, setHistory] = useState({ items: [], total: 0, total_kobo: 0 });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [target, setTarget] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [requestKey, setRequestKey] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const res = await adminListWalletDeductions({ page_size: 50 });
    if (res.data) setHistory(res.data);
    setHistoryError(res.error || null);
    setHistoryLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await adminSearchDeductionCustomers(term);
      if (!cancelled) {
        setResults(res.data?.items || []);
        setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const openFor = (customer) => {
    setTarget(customer);
    setAmount("");
    setReason("");
    setDetails("");
    setFormError(null);
    setConfirming(false);
    setRequestKey(newRequestKey());
  };

  const close = () => {
    if (submitting) return;
    setTarget(null);
  };

  const amountKobo = nairaToKobo(amount);
  const balance = target?.wallet_balance_kobo || 0;
  const overBalance = amountKobo != null && amountKobo > balance;
  const canReview = amountKobo != null && !overBalance && reason.trim().length > 0;

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);
    const res = await adminDeductFromWallet({
      customer_id: target.id,
      amount_kobo: amountKobo,
      reason: reason.trim(),
      details: details.trim(),
      request_key: requestKey,
    });
    setSubmitting(false);
    if (res.error) {
      setConfirming(false);
      setFormError(String(res.error));
      if (res.status === 402) {
        // Balance changed since the search; refresh it so the form shows the truth.
        const fresh = await adminSearchDeductionCustomers(target.email || target.phone || target.name);
        const match = fresh.data?.items?.find((c) => c.id === target.id);
        if (match) setTarget(match);
      }
      return;
    }
    const d = res.data;
    pushToast({
      tone: "success",
      title: `${formatNaira(d.amount_kobo)} deducted`,
      body: `New balance ${formatNaira(d.new_balance_kobo)}. ${d.email_sent ? "The customer has been emailed." : "The email to the customer couldn't be sent, so let them know directly."}`,
    });
    setResults((rows) => rows.map((c) => (c.id === target.id ? { ...c, wallet_balance_kobo: d.new_balance_kobo } : c)));
    setTarget(null);
    await loadHistory();
  };

  const resultColumns = [
    {
      key: "customer",
      header: "Customer",
      primary: true,
      render: (c) => (
        <div className="min-w-0">
          <p className="font-medium text-cx-ink">{c.name}</p>
          <p className="text-[13px] text-cx-muted">{[c.email, c.phone].filter(Boolean).join(" · ")}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Wallet balance",
      render: (c) => (
        <div>
          <p className="font-semibold">{formatNaira(c.wallet_balance_kobo, formatNaira(0))}</p>
          {c.wallet_linked_to_spare_parts ? <Badge tone="amber">Shared with Spare Parts</Badge> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <Button size="sm" icon={MinusCircle} onClick={() => openFor(c)} disabled={!c.wallet_balance_kobo}>
          Deduct
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      key: "customer",
      header: "Customer",
      primary: true,
      render: (d) => (
        <div className="min-w-0">
          <p className="font-medium text-cx-ink">{d.customer_name}</p>
          <p className="text-[13px] text-cx-muted">{d.customer_email}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", render: (d) => <span className="font-semibold">{formatNaira(d.amount_kobo)}</span> },
    {
      key: "note",
      header: "What it was for",
      render: (d) => <p className="max-w-md whitespace-pre-line text-[14px]">{d.note || "—"}</p>,
    },
    {
      key: "by",
      header: "Done by",
      render: (d) => (
        <div className="text-[14px]">
          <p>{d.admin_name || "—"}</p>
          <p className="text-[13px] text-cx-muted">{formatDate(d.created_at)}</p>
        </div>
      ),
    },
    { key: "reference", header: "Reference", render: (d) => <span className="break-all font-mono text-[13px] text-cx-muted">{d.reference}</span> },
  ];

  return (
    <section className="space-y-4">
      <SectionTitle
        title="Wallet deductions"
        description="Take money out of a customer's wallet, for example for a service they paid for outside the platform. The customer gets an email with the amount and what it was for."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total deducted" value={formatNaira(history.total_kobo, formatNaira(0))} hint="All manual deductions" icon={Wallet} />
        <StatTile label="Deductions" value={String(history.total || 0)} hint="Made by admins" icon={MinusCircle} tone="brand" />
      </div>

      <Card>
        <Field label="Find the customer" hint="Search by email, phone number or name (at least 3 characters).">
          {(p) => (
            <Input {...p} prefix={<Search className="h-4 w-4" aria-hidden />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. ada@example.com" />
          )}
        </Field>
        <div className="mt-4">
          {searching ? (
            <SkeletonList rows={2} />
          ) : query.trim().length >= 3 ? (
            <ResponsiveTable columns={resultColumns} rows={results} rowKey={(c) => c.id} empty="No customer matches that search." />
          ) : null}
        </div>
      </Card>

      <SectionTitle title="Deduction history" />
      {historyError ? <Notice tone="amber" title="Couldn't load the history">{String(historyError)}</Notice> : null}
      {historyLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <ResponsiveTable columns={historyColumns} rows={history.items} rowKey={(d) => d.id} empty="No deductions yet." />
      )}
      {!historyLoading && history.total > history.items.length ? (
        <p className="text-[13px] text-cx-muted">Showing the latest {history.items.length} of {history.total}.</p>
      ) : null}

      <Sheet
        open={!!target}
        onOpenChange={(o) => !o && close()}
        title={confirming ? "Confirm deduction" : "Deduct from wallet"}
        description={target ? `${target.name} · balance ${formatNaira(balance, formatNaira(0))}` : ""}
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
        {target ? (
          <div className="space-y-4">
            {formError ? <Notice tone="red" title="Deduction not made">{formError}</Notice> : null}
            {target.wallet_linked_to_spare_parts ? (
              <Notice tone="amber" title="Shared wallet">
                This wallet is linked to Spare Parts, so the deduction also lowers the balance they see there.
              </Notice>
            ) : null}

            {confirming ? (
              <div className="space-y-3 text-[15px]">
                <p>
                  Deduct <strong>{formatNaira(amountKobo)}</strong> from <strong>{target.name}</strong>&apos;s wallet?
                </p>
                <p className="text-cx-muted">
                  Their balance goes from {formatNaira(balance, formatNaira(0))} to {formatNaira(balance - amountKobo, formatNaira(0))}.
                  They&apos;ll get an email at {target.email} explaining it.
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
                  {(p) => (
                    <Input {...p} maxLength={REASON_MAX} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Vehicle registration renewal" />
                  )}
                </Field>
                <Field label="Details" optional hint="Anything else the customer should know, e.g. who was paid and when.">
                  {(p) => <Textarea {...p} rows={4} maxLength={DETAILS_MAX} value={details} onChange={(e) => setDetails(e.target.value)} />}
                </Field>
              </>
            )}
          </div>
        ) : null}
      </Sheet>
    </section>
  );
}
