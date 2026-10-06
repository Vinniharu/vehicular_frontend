"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Info, RefreshCw } from "lucide-react";
import { adminGetErrorEvents } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select, SkeletonList } from "@/app/dashboard/_kit";
import { Toolbar } from "@/app/admin/_kit";

const ACTIVE_POLL_MS = 8000;
const IDLE_POLL_MS = 30000;

const SEVERITY_TONE = {
  critical: "red",
  error: "red",
  warning: "amber",
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
    <Badge tone={SEVERITY_TONE[severity] || "amber"} className="capitalize">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {severity}
    </Badge>
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
    <div>
      <PageHeader
        title="Activity log"
        description="A live feed of things that went wrong for customers: a failed payment, a text or email that didn't send, or a system error. Updates every few seconds."
        actions={
          <Button variant="secondary" icon={RefreshCw} loading={refreshing} disabled={loading} onClick={() => loadData(true)}>
            Refresh
          </Button>
        }
      />

      <Toolbar>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by type" className="md:w-60">
          <option value="">All types</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} aria-label="Filter by severity" className="md:w-52">
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </Select>
      </Toolbar>

      {error && (
        <div className="mb-4">
          <Notice tone="red">{error}</Notice>
        </div>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing to show" description="No customer-facing issues match this filter right now." />
      ) : (
        <ul className="space-y-3">
          {items.map((event) => {
            const expanded = expandedId === event.id;
            return (
              <li key={event.id}>
                <Card className="space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={event.severity} />
                      <Badge>{CATEGORY_LABELS[event.category] || event.category}</Badge>
                    </div>
                    <p className="shrink-0 text-[13px] text-cx-muted">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
                        : "—"}
                    </p>
                  </div>

                  <p className="break-words text-[15px] font-semibold text-cx-ink">{event.friendly_message}</p>

                  <p className="break-words text-sm text-cx-ink-2">
                    {event.customer_name ? (
                      <>
                        {event.customer_name}
                        {event.customer_email && <span className="text-cx-muted"> · {event.customer_email}</span>}
                      </>
                    ) : (
                      <span className="text-cx-muted">Unknown customer</span>
                    )}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={expanded ? ChevronUp : ChevronDown}
                    aria-expanded={expanded}
                    className="-ml-3 min-h-11"
                    onClick={() => setExpandedId(expanded ? null : event.id)}
                  >
                    {expanded ? "Hide technical details" : "Show technical details"}
                  </Button>

                  {expanded && (
                    <div className="space-y-2 rounded-cx bg-cx-sunken p-3">
                      <p className="text-[13px] font-medium text-cx-muted">Source</p>
                      <p className="break-all font-mono text-[13px] text-cx-ink-2">{event.source}</p>
                      {event.technical_detail && (
                        <>
                          <p className="pt-1 text-[13px] font-medium text-cx-muted">Detail</p>
                          <pre className="whitespace-pre-wrap break-all font-mono text-[13px] text-cx-ink-2">{event.technical_detail}</pre>
                        </>
                      )}
                      {event.context && (
                        <>
                          <p className="pt-1 text-[13px] font-medium text-cx-muted">Context</p>
                          <pre className="whitespace-pre-wrap break-all font-mono text-[13px] text-cx-ink-2">{JSON.stringify(event.context, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
