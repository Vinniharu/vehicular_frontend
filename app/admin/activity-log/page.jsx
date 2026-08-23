"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  Loader2,
  RefreshCw,
  CheckSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { adminGetErrorEvents } from "@/lib/api";

const ACTIVE_POLL_MS = 8000;
const IDLE_POLL_MS = 30000;

const SEVERITY_TONE = {
  critical: "bg-red-50 text-red-700 ring-red-200",
  error: "bg-orange-50 text-orange-700 ring-orange-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
};

const SEVERITY_ICON = {
  critical: AlertOctagon,
  error: AlertCircle,
  warning: Info,
};

const CATEGORY_LABELS = {
  unhandled_exception: "System error",
  payment_failed: "Payment failed",
  webhook_processing_failed: "Payment notification issue",
  sms_delivery_failed: "SMS delivery failed",
  email_delivery_failed: "Email delivery failed",
  file_upload_failed: "File upload failed",
};

function SeverityBadge({ severity }) {
  const Icon = SEVERITY_ICON[severity] || Info;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset capitalize ${SEVERITY_TONE[severity] || SEVERITY_TONE.warning}`}>
      <Icon className="h-3 w-3" />
      {severity}
    </span>
  );
}

export default function AdminActivityLogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const res = await adminGetErrorEvents({
      category: categoryFilter || undefined,
      severity: severityFilter || undefined,
      page_size: 50,
    });
    if (res.error) setError(res.error);
    else if (res.data) {
      setItems(res.data.items || []);
      setError(null);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Real-time via visibility-aware polling, matching this portal's
  // established pattern (app/support/_shared/SupportChatNotifier.jsx) —
  // no WebSocket/SSE infra exists anywhere in this app. The effect re-keys
  // on filter change (tears down and restarts the loop), which keeps the
  // poll's filters always current without needing a separate ref.
  useEffect(() => {
    let cancelled = false;
    let timeoutId;
    let documentVisible = true;

    const track = () => {
      documentVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", track);

    const tick = async (isRefresh) => {
      await loadData(isRefresh);
      if (!cancelled) {
        timeoutId = setTimeout(() => tick(true), documentVisible ? ACTIVE_POLL_MS : IDLE_POLL_MS);
      }
    };

    tick(false);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", track);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, severityFilter]);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#28A745]" />
              Live
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Log</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              A real-time feed of things that went wrong for customers — a failed payment, a text message or
              email that didn't send, or a system error. Updates automatically every few seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="">All types</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading activity…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Nothing to show</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No customer-facing issues match this filter right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((event) => {
              const expanded = expandedId === event.id;
              return (
                <div key={event.id} className="p-5 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={event.severity} />
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {CATEGORY_LABELS[event.category] || event.category}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-semibold text-slate-800">{event.friendly_message}</p>
                    </div>
                    <p className="flex items-center gap-1.5 text-[11.5px] text-slate-400 shrink-0">
                      <Clock className="h-3 w-3" />
                      {event.created_at ? new Date(event.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </p>
                  </div>

                  <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                    <User className="h-3 w-3" />
                    {event.customer_name ? (
                      <>
                        {event.customer_name}
                        {event.customer_email && <span className="text-slate-400"> · {event.customer_email}</span>}
                      </>
                    ) : (
                      "Unknown customer"
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : event.id)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded ? "Hide technical details" : "Show technical details"}
                  </button>

                  {expanded && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Source</p>
                      <p className="font-mono text-[12px] text-slate-700 break-all">{event.source}</p>
                      {event.technical_detail && (
                        <>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 pt-1">Detail</p>
                          <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap break-all">{event.technical_detail}</pre>
                        </>
                      )}
                      {event.context && (
                        <>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 pt-1">Context</p>
                          <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap break-all">{JSON.stringify(event.context, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
