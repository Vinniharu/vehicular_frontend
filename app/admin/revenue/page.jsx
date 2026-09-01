"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  TrendingUp,
  Landmark,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarRange,
} from "lucide-react";
import { adminGetMetricsOverview, adminGetRevenueTransactions, koboToNaira } from "@/lib/api";

/* ─── Helpers ─── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Local YYYY-MM-DD (not toISOString, which shifts to UTC and can land on
// the wrong calendar day for users west of UTC).
function toDateInputValue(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${day}`;
}

function startOfWeek(d) {
  const date = new Date(d);
  const dow = date.getDay(); // 0 = Sunday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

const DATE_PRESETS = [
  { label: "Today", range: () => { const t = new Date(); return [t, t]; } },
  { label: "This Week", range: () => [startOfWeek(new Date()), new Date()] },
  { label: "This Month", range: () => [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
  { label: "All Time", range: () => [null, null] },
];

const PAYMENT_STATUS_STYLES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function StatusBadge({ status, fallback = "—" }) {
  if (!status) return <span className="text-[12px] text-slate-300 italic">{fallback}</span>;
  const cls = PAYMENT_STATUS_STYLES[status] || "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Landmark className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-[14px] text-slate-500 font-medium">{message}</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminRevenuePage() {
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Guards against out-of-order responses: rapidly switching date-range
  // presets can fire two overview/transactions requests where the older one
  // (e.g. a since-abandoned range) resolves after the newer one, silently
  // clobbering the correct on-screen figures with stale data.
  const overviewSeqRef = useRef(0);
  const txnSeqRef = useRef(0);

  // Inclusive of the whole "to" day — a bare YYYY-MM-DD compared against a
  // datetime column would otherwise only match up to that day's midnight.
  const effectiveToDate = toDate ? `${toDate}T23:59:59.999` : undefined;

  const loadOverview = async () => {
    const seq = ++overviewSeqRef.current;
    const res = await adminGetMetricsOverview({ from_date: fromDate || undefined, to_date: effectiveToDate });
    if (res.data && seq === overviewSeqRef.current) setOverview(res.data);
  };

  const loadTransactions = async (targetPage = page) => {
    const seq = ++txnSeqRef.current;
    const res = await adminGetRevenueTransactions({
      page: targetPage,
      page_size: pageSize,
      status: statusFilter || undefined,
      application_type: typeFilter || undefined,
      from_date: fromDate || undefined,
      to_date: effectiveToDate,
    });
    if (res.data && seq === txnSeqRef.current) {
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadOverview(), loadTransactions(1)]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    loadOverview();
    loadTransactions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, fromDate, toDate]);

  useEffect(() => {
    loadTransactions(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyPreset = (preset) => {
    const [from, to] = preset.range();
    setFromDate(from ? toDateInputValue(from) : "");
    setToDate(to ? toDateInputValue(to) : "");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOverview(), loadTransactions(page)]);
    setRefreshing(false);
  };

  const stats = [
    {
      label: "Total Inflow",
      value: overview ? koboToNaira(overview.gross_payments_kobo) : "—",
      sub: "Gross successful payments",
      icon: TrendingUp,
    },
    {
      label: "Platform Profit",
      value: overview ? koboToNaira(overview.platform_profit_kobo) : "—",
      sub: "Kept by Vehiculars",
      icon: Landmark,
    },
    {
      label: "Agent Service Fees",
      value: overview ? koboToNaira(overview.agent_service_fees_kobo) : "—",
      sub: overview ? `${koboToNaira(overview.agent_payables_paid_kobo)} disbursed` : "—",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Revenue</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Total inflow, platform profit, agent payouts, and a per-transaction log.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""} text-slate-500`} />
          Refresh
        </button>
      </div>

      {/* ─── Date Range ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <CalendarRange className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Date Range</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
          />
          <span className="text-[12px] text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <Icon className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <p className="text-[24px] font-bold text-slate-900 mt-1.5 leading-none">{stat.value}</p>
              <p className="text-[11px] text-slate-400 mt-1.5">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Transaction Log ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
          <p className="text-[13px] font-semibold text-slate-700">
            Transactions <span className="text-slate-400 font-normal">({total})</span>
          </p>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
            >
              <option value="">All types</option>
              <option value="fresh">Fresh</option>
              <option value="renewal">Renewal</option>
              <option value="reissue">Reissue</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[13px] text-slate-400">Loading transactions&hellip;</div>
        ) : items.length === 0 ? (
          <EmptyState message="No transactions match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-5 font-semibold">Applicant</th>
                  <th className="py-3 px-5 font-semibold">Type</th>
                  <th className="py-3 px-5 font-semibold">Reference</th>
                  <th className="py-3 px-5 font-semibold">Amount</th>
                  <th className="py-3 px-5 font-semibold">Platform</th>
                  <th className="py-3 px-5 font-semibold">Agent</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold">Transfer</th>
                  <th className="py-3 px-5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr key={tx.payment_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold text-slate-900">{tx.applicant_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">App #{tx.application_id}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-[12.5px] text-slate-700 capitalize">{tx.application_type}</p>
                      <p className="text-[11px] text-slate-400">{tx.validity_period || "—"}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11.5px] text-slate-500">{tx.reference}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold text-slate-900">{koboToNaira(tx.amount_kobo)}</p>
                      {tx.amount_paid_kobo < tx.amount_kobo && (
                        <p className="text-[11px] text-amber-600">{koboToNaira(tx.amount_paid_kobo)} paid so far</p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-[12.5px] text-slate-700">{koboToNaira(tx.platform_profit_kobo)}</td>
                    <td className="py-3.5 px-5 text-[12.5px] text-slate-700">
                      {koboToNaira(tx.service_fee_kobo)}
                      {tx.agent_name && <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{tx.agent_name}</p>}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={tx.agent_transfer_status} fallback="No transfer" />
                    </td>
                    <td className="py-3.5 px-5 text-[12px] text-slate-500 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ─── */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <p className="text-[12px] text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
