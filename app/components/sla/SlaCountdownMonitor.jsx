"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { adminGetSlaCountdown, staffGetSlaCountdown } from "@/lib/api";
import { Badge, Button, EmptyState, PageHeader, Select, SkeletonList } from "@/app/dashboard/_kit";
import { ResponsiveTable, Toolbar } from "@/app/admin/_kit";
import { statusMeta } from "@/app/staff/_components/status";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function SummaryTab({ active, onClick, label, value, hint, icon: Icon, tone }) {
  const toneCls = { neutral: "text-cx-muted", brand: "text-cx-brand", amber: "text-cx-amber", red: "text-cx-red" }[tone];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx(
        "cx-focus block w-full rounded-cx-lg border p-4 text-left shadow-cx transition-colors",
        active ? "border-cx-brand bg-cx-brand-soft ring-1 ring-cx-brand" : "border-cx-line bg-cx-surface hover:border-cx-brand/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cx("text-[13px] font-medium", active ? "text-cx-brand-deep" : "text-cx-muted")}>{label}</p>
        <Icon className={cx("h-5 w-5", toneCls)} aria-hidden />
      </div>
      <p className="mt-1.5 text-[22px] font-semibold leading-tight text-cx-ink">{value}</p>
      <p className="mt-0.5 text-[13px] text-cx-muted">{hint}</p>
    </button>
  );
}

function DeadlineBadge({ sla }) {
  if (sla.is_breached) {
    return (
      <Badge tone="red">
        <Flame className="h-3.5 w-3.5" aria-hidden />
        {sla.label}
      </Badge>
    );
  }
  if (sla.is_nearing) {
    return (
      <Badge tone="amber">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {sla.label}
      </Badge>
    );
  }
  const Icon = sla.is_completed ? CheckCircle2 : Clock;
  return (
    <Badge tone="brand">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {sla.label}
    </Badge>
  );
}

export default function SlaCountdownMonitor({ portal = "admin" }) {
  const router = useRouter();
  const [data, setData] = useState({
    summary: { total_active: 0, on_track: 0, nearing_deadline: 0, breached: 0, completed: 0 },
    items: [],
    total: 0,
    page: 1,
    page_size: 25,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // The search actually sent to the server, updated after typing pauses.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'breached', 'nearing_deadline', 'on_track'
  const [selectedService, setSelectedService] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchCountdown = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const fetcher = portal === "admin" ? adminGetSlaCountdown : staffGetSlaCountdown;
    const res = await fetcher({
      sla_status: activeTab,
      service_key: selectedService,
      search: debouncedSearch,
      page,
      page_size: pageSize,
    });

    if (res?.data) {
      setData(res.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedService, page, pageSize, debouncedSearch]);

  // Debounce search. Updating the search and resetting to page 1 together
  // triggers a single fetch above with the new page, not the old one.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const summary = data?.summary || {
    total_active: 0,
    on_track: 0,
    nearing_deadline: 0,
    breached: 0,
    completed: 0,
  };

  const getApplicationLink = (appId) => {
    if (portal === "staff") {
      return `/staff/applications/${appId}`;
    }
    return `/admin/applications`;
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const summaryTabs = [
    { id: "all", label: "Active", value: summary.total_active, hint: "Open applications", icon: Clock, tone: "neutral" },
    { id: "breached", label: "Overdue", value: summary.breached, hint: "Deadline passed", icon: Flame, tone: "red" },
    { id: "nearing_deadline", label: "Closing soon", value: summary.nearing_deadline, hint: "Near the SLA limit", icon: AlertTriangle, tone: "amber" },
    { id: "on_track", label: "On track", value: summary.on_track, hint: "Healthy buffer", icon: CheckCircle2, tone: "brand" },
  ];

  const fmtDate = (value, opts) => (value ? new Date(value).toLocaleDateString("en-GB", opts) : "—");

  const columns = [
    {
      key: "application",
      header: "Application",
      primary: true,
      render: (item) => (
        <div className="min-w-0">
          <p className="font-semibold text-cx-ink">
            {item.last_name
              ? [item.last_name, item.first_name, item.middle_name].filter(Boolean).join(" ")
              : item.applicant_name || "—"}
          </p>
          <p className="mt-0.5 text-[13px] font-normal text-cx-muted">
            {item.application_id_formatted} · {statusMeta(item.current_status).label}
          </p>
          {item.applicant_phone || item.applicant_email ? (
            <p className="mt-0.5 truncate text-[13px] font-normal text-cx-muted">
              {[item.applicant_phone, item.applicant_email].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-cx-ink">{item.service_name}</p>
          <p className="text-[13px] text-cx-muted">
            {item.sla.days_allocated} {item.sla.day_type === "business_days" ? "working days" : "days"} · due{" "}
            {fmtDate(item.sla.target_deadline, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      className: "md:w-56",
      render: (item) => {
        const sla = item.sla;
        const bar = sla.is_breached ? "bg-cx-red" : sla.is_nearing ? "bg-cx-amber" : "bg-cx-brand";
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span className="font-medium text-cx-ink">
                {sla.days_elapsed} of {sla.days_allocated} days
              </span>
              <span className={cx("font-semibold", sla.is_breached ? "text-cx-red" : sla.is_nearing ? "text-cx-amber" : "text-cx-brand-deep")}>
                {sla.percent_elapsed}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-cx-sunken">
              <div className={cx("h-full rounded-full transition-all duration-300", bar)} style={{ width: `${Math.min(100, sla.percent_elapsed)}%` }} />
            </div>
            <p className="text-[13px] text-cx-muted">
              Started {fmtDate(sla.start_date, { day: "numeric", month: "short" })} · {sla.days_remaining}d left
            </p>
          </div>
        );
      },
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (item) => <DeadlineBadge sla={item.sla} />,
    },
    {
      key: "assignment",
      header: "Handled by",
      render: (item) => (
        <div className="text-[13px]">
          <p className="truncate">
            <span className="text-cx-muted">Staff: </span>
            <span className="font-medium text-cx-ink">{item.assigned_staff_name || "Unassigned"}</span>
          </p>
          <p className="truncate">
            <span className="text-cx-muted">Agent: </span>
            <span className="font-medium text-cx-ink">{item.assigned_agent_name || "None"}</span>
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: <span className="sr-only">Action</span>,
      hideOnMobile: true,
      className: "text-right",
      render: (item) => (
        <Button
          href={getApplicationLink(item.id)}
          variant="secondary"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="min-h-11"
        >
          Review
        </Button>
      ),
    },
  ];

  const total = data?.total || 0;
  const totalPages = data.total_pages || 1;

  return (
    <div>
      <PageHeader
        title="SLA countdown"
        description="Every active application against its deadline: on track, closing soon, or overdue."
        actions={
          <>
            {portal === "admin" ? (
              <Button href="/admin/deadlines" variant="secondary" size="sm" icon={Sliders} className="min-h-11">
                Deadlines
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchCountdown(true)}
              className="min-h-11"
            >
              Refresh
            </Button>
          </>
        }
      />

      <div role="tablist" aria-label="SLA status" className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryTabs.map((t) => (
          <SummaryTab
            key={t.id}
            active={activeTab === t.id}
            onClick={() => selectTab(t.id)}
            label={t.label}
            value={t.value}
            hint={t.hint}
            icon={t.icon}
            tone={t.tone}
          />
        ))}
      </div>

      <Toolbar search={searchQuery} onSearch={setSearchQuery} placeholder="Search ID, name or phone" />

      {loading ? (
        <SkeletonList rows={4} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="Nothing matches this filter"
          description="Applications are either completed or nothing matched your search."
        />
      ) : (
        <ResponsiveTable
          columns={columns}
          rows={data.items}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(getApplicationLink(item.id))}
        />
      )}

      {!loading && total > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-cx-muted">
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Results per page"
              className="w-40"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-11"
            >
              Prev
            </Button>
            <span className="text-[13px] text-cx-muted">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.total_pages || 1, p + 1))}
              disabled={page >= totalPages}
              className="min-h-11"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
