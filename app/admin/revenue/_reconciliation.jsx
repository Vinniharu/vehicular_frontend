"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PlayCircle, RefreshCw, Scale } from "lucide-react";
import {
  adminApplyReconciliationDiscrepancy,
  adminGetReconciliationDiscrepancies,
  adminGetReconciliationSummary,
  adminResolveReconciliationDiscrepancy,
  adminRunReconciliation,
} from "@/lib/api";
import { Badge, Button, Card, Field, Input, Notice, SectionTitle, Select, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { ResponsiveTable, StatTile, formatNaira } from "@/app/admin/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

// What each discrepancy means, in plain words, and whether "Apply" can fix it.
export const DISCREPANCY_KINDS = {
  missing_credit: { label: "Paid on Monnify, missing here", tone: "red", canApply: true },
  amount_mismatch: { label: "Amount differs from Monnify", tone: "red" },
  reversal: { label: "Reversed on Monnify", tone: "amber", canApply: true },
  reversal_shortfall: { label: "Reversal not fully recovered", tone: "red" },
  excess_unallocated: { label: "Extra money held for review", tone: "amber" },
  unconfirmed_credit: { label: "Credited here, not paid on Monnify", tone: "red" },
  manual_credit: { label: "Manual credit (not Monnify)", tone: "neutral" },
  unmatched: { label: "Monnify payment with no customer", tone: "amber" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ReconciliationPanel({ onChanged }) {
  const pushToast = useToast();
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("open");
  const [kindFilter, setKindFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [resolveNote, setResolveNote] = useState("");

  const load = async () => {
    setLoading(true);
    const [s, d] = await Promise.all([
      adminGetReconciliationSummary(),
      adminGetReconciliationDiscrepancies({ status_filter: statusFilter, kind: kindFilter || undefined, page_size: 50 }),
    ]);
    if (s.data) setSummary(s.data);
    if (d.data) {
      setItems(d.data.items || []);
      setTotal(d.data.total || 0);
    }
    setError(s.error || d.error || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, kindFilter]);

  const runNow = async () => {
    setRunning(true);
    const res = await adminRunReconciliation({});
    setRunning(false);
    if (res.error) {
      pushToast({ tone: "red", title: "Couldn't run the check", body: String(res.error) });
      return;
    }
    const run = res.data?.summary?.last_run;
    pushToast({
      tone: res.data?.status === "completed" ? "success" : "red",
      title: res.data?.status === "completed" ? "Checked against Monnify" : "Check didn't finish",
      body: run
        ? `${run.monnify_count} Monnify transactions, ${run.matched_count} matched, ${run.discrepancy_count} to review.`
        : res.data?.error || undefined,
    });
    await load();
    onChanged?.();
  };

  const apply = async (d) => {
    setBusyId(d.id);
    const res = await adminApplyReconciliationDiscrepancy(d.id);
    setBusyId(null);
    if (res.error) {
      pushToast({ tone: "red", title: "Couldn't apply", body: String(res.error) });
      return;
    }
    pushToast({ tone: "success", title: "Applied", body: "Monnify confirmed it and the records are updated." });
    await load();
    onChanged?.();
  };

  const resolve = async () => {
    if (!resolving) return;
    setBusyId(resolving.id);
    const res = await adminResolveReconciliationDiscrepancy(resolving.id, resolveNote.trim() || undefined);
    setBusyId(null);
    if (res.error) {
      pushToast({ tone: "red", title: "Couldn't update", body: String(res.error) });
      return;
    }
    setResolving(null);
    setResolveNote("");
    await load();
  };

  const run = summary?.last_completed_run;
  const difference = run ? run.difference_kobo : null;

  const columns = [
    {
      key: "kind",
      header: "Issue",
      primary: true,
      render: (d) => {
        const meta = DISCREPANCY_KINDS[d.kind] || { label: d.kind, tone: "neutral" };
        return (
          <div className="min-w-0">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {d.detail?.reason ? <p className="mt-1 text-[13px] text-cx-muted">{d.detail.reason}</p> : null}
            {d.detail?.customer_email ? <p className="text-[13px] text-cx-muted">{d.detail.customer_email}</p> : null}
          </div>
        );
      },
    },
    {
      key: "refs",
      header: "Reference",
      render: (d) => (
        <div className="min-w-0 font-mono text-[13px] text-cx-muted">
          {d.monnify_transaction_reference ? <p className="break-all">{d.monnify_transaction_reference}</p> : null}
          {d.payment_reference && d.payment_reference !== d.monnify_transaction_reference ? <p className="break-all">{d.payment_reference}</p> : null}
        </div>
      ),
    },
    {
      key: "amounts",
      header: "Monnify / ours",
      render: (d) => (
        <div className="text-[14px]">
          <p>{d.amount_monnify_kobo != null ? formatNaira(d.amount_monnify_kobo) : "—"}</p>
          <p className="text-cx-muted">{d.amount_ours_kobo != null ? formatNaira(d.amount_ours_kobo) : "—"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <div>
          <Badge tone={d.status === "open" ? "amber" : "brand"} className="capitalize">
            {d.status === "auto_fixed" ? "Fixed automatically" : d.status}
          </Badge>
          {d.resolution_note ? <p className="mt-1 text-[13px] text-cx-muted">{d.resolution_note}</p> : null}
          <p className="mt-1 text-[13px] text-cx-muted">{formatDate(d.created_at)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (d) =>
        d.status === "open" ? (
          <div className="flex flex-wrap gap-2">
            {DISCREPANCY_KINDS[d.kind]?.canApply ? (
              <Button size="sm" onClick={() => apply(d)} loading={busyId === d.id} disabled={busyId != null}>
                Apply
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => setResolving(d)} disabled={busyId != null}>
              Mark resolved
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <section className="space-y-4">
      <SectionTitle
        title="Monnify reconciliation"
        description="Our records checked against Monnify's own transaction list. Nothing counts as paid unless Monnify confirms it."
      />

      {error ? <Notice tone="amber" title="Couldn't load everything">{String(error)}</Notice> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Monnify received" value={run ? formatNaira(run.monnify_total_kobo) : "—"} hint={run ? "Last completed check" : "No check yet"} icon={Scale} />
        <StatTile label="Credited by us" value={run ? formatNaira(run.ours_total_kobo) : "—"} hint="Same transactions" icon={CheckCircle2} tone="brand" />
        <StatTile
          label="Difference"
          value={difference == null ? "—" : formatNaira(Math.abs(difference))}
          hint={difference == null ? "—" : difference === 0 ? "Tallies with Monnify" : difference > 0 ? "Monnify has more" : "We credited more"}
          icon={Scale}
          tone={difference ? "red" : "brand"}
        />
        <StatTile
          label="Open issues"
          value={summary ? String(summary.open_discrepancies) : "—"}
          hint={summary?.last_run ? `Last check ${formatDate(summary.last_run.finished_at || summary.last_run.started_at)}` : "Never run"}
          icon={RefreshCw}
          tone={summary?.open_discrepancies ? "amber" : "neutral"}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[14px] text-cx-muted">
            <p>
              Runs every 30 minutes over the last 2 days.{" "}
              {summary?.autofix_enabled
                ? "Missed payments are credited and reversals deducted automatically."
                : "It only reports for now: use Apply to credit a missed payment after checking it."}
            </p>
            <p>
              Extra money (overpayments, payments on an old link):{" "}
              {summary?.excess_to_wallet_enabled ? "credited to the customer's wallet." : "held here for review."}
            </p>
          </div>
          <Button icon={PlayCircle} onClick={runNow} loading={running} disabled={running}>
            Check last 2 days now
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Issue status" className="md:w-52">
          <option value="open">Open</option>
          <option value="auto_fixed">Fixed automatically</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </Select>
        <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} aria-label="Issue type" className="md:w-72">
          <option value="">All issue types</option>
          {Object.entries(DISCREPANCY_KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <SkeletonList rows={3} />
      ) : (
        <ResponsiveTable columns={columns} rows={items} rowKey={(d) => d.id} empty="Nothing to review. Our records match Monnify." />
      )}
      {!loading && total > items.length ? <p className="text-[13px] text-cx-muted">Showing {items.length} of {total}.</p> : null}

      <Sheet
        open={!!resolving}
        onOpenChange={(o) => !o && setResolving(null)}
        title="Mark as resolved"
        description={resolving ? DISCREPANCY_KINDS[resolving.kind]?.label || resolving.kind : ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResolving(null)}>
              Cancel
            </Button>
            <Button block onClick={resolve} loading={busyId === resolving?.id}>
              Mark resolved
            </Button>
          </>
        }
      >
        <Field label="What was done" optional hint="For example: refunded to the customer's bank, or confirmed with Monnify support.">
          {(p) => <Input {...p} value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />}
        </Field>
      </Sheet>
    </section>
  );
}
