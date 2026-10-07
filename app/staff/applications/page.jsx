"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckSquare,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  Zap,
} from "lucide-react";
import { getStaffQueue, staffClaimApplication, getCachedUser, authGetMe, koboToNaira, getStaffCounts } from "@/lib/api";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Notice,
  PageHeader,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { Switch, Tabs, Toolbar } from "@/app/admin/_kit";
import { SlaChip } from "@/app/components/portal/ui";
import { useToast } from "@/app/components/shared/ToastProvider";
import { statusMeta } from "@/app/staff/_components/status";
import { serviceLabel } from "@/app/agent/_components/jobs";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const DRIVING_SCHOOL_FILTERS = ["driving_school", "driving_school_countdown", "driving_school_graduation", "graduation", "graduated", "driving_school_ready"];

function applicantName(app) {
  return [app.last_name, app.first_name, app.middle_name].filter(Boolean).join(" ") || app.applicant_name || "—";
}

function TypeOptions() {
  return (
    <>
      <option value="all">All services</option>
      <option value="fresh">Fresh</option>
      <option value="renewal">Renewal</option>
      <option value="reissue">Reissue</option>
      <option value="international_permit">International permit</option>
      <option value="tinted_permit">Tinted permit</option>
      <option value="central_motor_registry">Electronic Central Motor Registry (eCMR)</option>
      <option value="roadworthiness_express">Roadworthiness Express</option>
      <option value="vehicle_particulars">Vehicle particulars</option>
      <option value="physical_condition_inspection">Physical condition inspection</option>
      <option value="number_plate_new">Number plate — new</option>
      <option value="number_plate_replacement">Number plate — replacement</option>
      <option value="number_plate_change_of_ownership">Number plate — change of ownership</option>
      <option value="number_plate_fancy">Number plate — fancy</option>
      <option value="number_plate_dealership">Number plate — dealership</option>
    </>
  );
}

function PaymentOptions() {
  return (
    <>
      <option value="all">All payments</option>
      <option value="paid">Paid</option>
      <option value="unpaid">Unpaid</option>
      <option value="partial">Partly paid</option>
    </>
  );
}

function SortOptions() {
  return (
    <>
      <option value="updated_at">Recently updated</option>
      <option value="id">ID number</option>
      <option value="name">Applicant name</option>
    </>
  );
}

function StaffApplicationsQueueInner() {
  const router = useRouter();
  let searchParams = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // static / outside Suspense fallback
  }
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => getCachedUser());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pushToast = useToast();

  useEffect(() => {
    const cached = getCachedUser();
    if (cached) setCurrentUser(cached);
    authGetMe().then((res) => {
      if (res?.data) setCurrentUser(res.data);
    }).catch(() => {});
  }, []);

  // Queue Scope & Status Filter:
  // Scope controls job-locking/assignment: 'mine' (Assigned to Me), 'unclaimed' (Unclaimed Pool), 'all' (All Applications)
  // When scope is 'mine', staff sees ALL applications assigned to them NO MATTER THE STATUS (when statusFilter is 'all').
  const initialParam = searchParams?.get("tab") || searchParams?.get("scope") || "mine";
  const [scope, setScope] = useState(() => {
    if (["unclaimed", "mine", "all"].includes(initialParam)) return initialParam;
    return "mine";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    if (!["unclaimed", "mine", "all"].includes(initialParam)) return initialParam;
    return "all";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);

  const loadData = async (
    isRefresh = false,
    sort = sortBy,
    urgentOnly = isUrgentOnly,
    payFilter = paymentFilter,
    currentScope = scope,
    currStatus = statusFilter,
    type = typeFilter,
    searchStr = debouncedSearch
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    let queryStatus = currStatus === "all" ? undefined : currStatus;
    let queryStaffId = undefined;
    let shouldShowAll = false;

    if (currentScope === "unclaimed") {
      queryStaffId = 0;
    } else if (currentScope === "mine") {
      queryStaffId = currentUser?.id || -1;
    } else if (currentScope === "all") {
      shouldShowAll = true;
    }

    const [queueRes, countsRes] = await Promise.all([
      getStaffQueue({
        page: 1,
        page_size: 100,
        sort,
        is_urgent_only: urgentOnly ? true : undefined,
        payment_status: payFilter === "all" ? undefined : payFilter,
        application_type: type === "all" ? undefined : type,
        status: queryStatus,
        staff_id: queryStaffId,
        show_all: shouldShowAll,
        search: searchStr || undefined,
      }),
      getStaffCounts(),
    ]);

    if (queueRes.error) {
      setError(queueRes.error);
    } else if (Array.isArray(queueRes.data?.items)) {
      setApplications(queueRes.data.items);
    }

    if (countsRes?.data) {
      setStats(countsRes.data);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData(false, sortBy, isUrgentOnly, paymentFilter, scope, statusFilter, typeFilter, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, isUrgentOnly, paymentFilter, scope, statusFilter, typeFilter, debouncedSearch, currentUser?.id]);

  const handleClaim = async (e, appId) => {
    e.stopPropagation();
    setClaimingId(appId);
    const res = await staffClaimApplication(appId);
    setClaimingId(null);
    if (!res.error) {
      pushToast({ tone: "success", title: `Claimed #${appId}`, body: "It's now in your queue." });
      await loadData(true);
    } else {
      pushToast({ tone: "error", title: "Couldn't claim this application", body: res.error });
    }
  };

  // Filtered list based on search, scope, and status
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        String(app.id).includes(q) ||
        (app.last_name || "").toLowerCase().includes(q) ||
        (app.first_name || "").toLowerCase().includes(q) ||
        (app.middle_name || "").toLowerCase().includes(q) ||
        (app.applicant_name || "").toLowerCase().includes(q) ||
        (app.applicant_email || "").toLowerCase().includes(q) ||
        (app.applicant_phone || "").toLowerCase().includes(q) ||
        (app.lga || "").toLowerCase().includes(q) ||
        (app.state_of_residence || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      const matchType = typeFilter === "all" || app.application_type === typeFilter;
      if (!matchType) return false;

      // Scope filtering
      if (scope === "unclaimed" && app.staff_id) return false;
      if (scope === "mine" && currentUser?.id && String(app.staff_id) !== String(currentUser.id)) return false;

      // Status filtering
      if (statusFilter === "all") return true;
      if (statusFilter === "submitted") return app.status === "submitted";
      if (statusFilter === "staff_review") return app.status === "staff_review";
      if (statusFilter === "driving_school") return ["driving_school_enrolled", "driving_school_graduation", "driving_school_certificate_ready"].includes(app.status);
      if (statusFilter === "driving_school_countdown") return app.status === "driving_school_enrolled";
      if (statusFilter === "driving_school_graduation" || statusFilter === "graduation") return app.status === "driving_school_graduation";
      if (statusFilter === "graduated" || statusFilter === "driving_school_ready") return app.status === "driving_school_certificate_ready";
      if (statusFilter === "agent_working") return ["routed", "agent_assigned", "agent_accepted", "in_progress", "capturing_scheduled", "captured", "temp_licence_issued"].includes(app.status);
      if (statusFilter === "action_needed") return ["agent_completed", "staff_final_review"].includes(app.status);
      if (statusFilter === "dispatch") return app.status === "awaiting_customer";
      if (statusFilter === "completed") return app.status === "completed";
      if (statusFilter === "flagged") return ["staff_rejected", "needs_correction"].includes(app.status);
      return app.status === statusFilter;
    });
  }, [applications, scope, statusFilter, searchQuery, currentUser, typeFilter]);

  // Counts for tabs and dropdowns
  const counts = useMemo(() => {
    const total = stats?.all ?? applications.length;
    const ds_countdown = stats?.driving_school_countdown ?? applications.filter((a) => a.status === "driving_school_enrolled").length;
    const ds_graduation = stats?.driving_school_graduation ?? applications.filter((a) => a.status === "driving_school_graduation").length;
    const ds_ready = stats?.graduated ?? applications.filter((a) => a.status === "driving_school_certificate_ready").length;
    const ds_total = stats?.driving_school ?? (ds_countdown + ds_graduation + ds_ready);

    return {
      all: total,
      unclaimed: stats?.unclaimed ?? applications.filter((a) => !a.staff_id).length,
      mine: stats?.mine ?? (currentUser?.id ? applications.filter((a) => String(a.staff_id) === String(currentUser.id)).length : 0),
      submitted: stats?.submitted ?? applications.filter((a) => a.status === "submitted").length,
      staff_review: stats?.staff_review ?? applications.filter((a) => a.status === "staff_review").length,
      driving_school: ds_total,
      driving_school_countdown: ds_countdown,
      driving_school_graduation: ds_graduation,
      graduation: ds_graduation,
      graduated: ds_ready,
      agent_working: stats?.agent_working ?? applications.filter((a) => ["routed", "agent_assigned", "agent_accepted", "in_progress", "capturing_scheduled", "captured", "temp_licence_issued"].includes(a.status)).length,
      action_needed: stats?.needs_final_review ?? applications.filter((a) => ["agent_completed", "staff_final_review"].includes(a.status)).length,
      dispatch: stats?.awaiting_customer ?? applications.filter((a) => a.status === "awaiting_customer").length,
      completed: stats?.completed ?? applications.filter((a) => a.status === "completed").length,
      flagged: stats?.flagged ?? applications.filter((a) => a.status === "staff_rejected" || a.status === "needs_correction").length,
    };
  }, [applications, stats, currentUser]);

  const scopeTabs = [
    { id: "mine", label: "Mine", count: counts.mine },
    { id: "unclaimed", label: "Unclaimed", count: counts.unclaimed },
    { id: "all", label: "All", count: counts.all },
  ];

  const activeExtraFilters = [typeFilter !== "all", paymentFilter !== "all", sortBy !== "updated_at", isUrgentOnly].filter(Boolean).length;

  const dsChips = [
    { id: "driving_school", label: "All driving school", count: counts.driving_school, active: statusFilter === "driving_school" },
    { id: "driving_school_countdown", label: "In countdown", count: counts.driving_school_countdown, active: statusFilter === "driving_school_countdown" },
    {
      id: "driving_school_graduation",
      label: "Awaiting certificate",
      count: counts.driving_school_graduation,
      active: statusFilter === "driving_school_graduation" || statusFilter === "graduation",
    },
    { id: "graduated", label: "School complete", count: counts.graduated, active: statusFilter === "graduated" || statusFilter === "driving_school_ready" },
  ];

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Open a file to check documents, enrol in driving school, route to an agent or do the final review."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            disabled={loading}
            onClick={() => loadData(true)}
            className="min-h-11"
          >
            Refresh
          </Button>
        }
      />

      <Tabs tabs={scopeTabs} value={scope} onChange={setScope} label="Queue" className="mb-4" />

      <Toolbar search={searchQuery} onSearch={setSearchQuery} placeholder="Search ID, name, email, phone, state or LGA">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status"
          className="md:w-64"
        >
          <option value="all">
            All statuses {scope === "mine" ? `(mine: ${counts.mine})` : scope === "unclaimed" ? `(unclaimed: ${counts.unclaimed})` : `(${counts.all})`}
          </option>
          <optgroup label="First review">
            <option value="submitted">Awaiting review ({counts.submitted})</option>
            <option value="staff_review">Under review ({counts.staff_review})</option>
          </optgroup>
          <optgroup label="Driving school">
            <option value="driving_school">All driving school ({counts.driving_school})</option>
            <option value="driving_school_countdown">In countdown ({counts.driving_school_countdown})</option>
            <option value="driving_school_graduation">Awaiting certificate ({counts.driving_school_graduation})</option>
            <option value="graduated">School complete, ready to route ({counts.graduated})</option>
          </optgroup>
          <optgroup label="Field work">
            <option value="agent_working">Agent working ({counts.agent_working})</option>
          </optgroup>
          <optgroup label="Sign-off and dispatch">
            <option value="action_needed">Needs final review ({counts.action_needed})</option>
            <option value="dispatch">Needs dispatch ({counts.dispatch})</option>
            <option value="completed">Completed ({counts.completed})</option>
            <option value="flagged">Flagged ({counts.flagged})</option>
          </optgroup>
        </Select>
        <Button
          variant="secondary"
          icon={SlidersHorizontal}
          onClick={() => setFiltersOpen(true)}
          className="min-h-12 md:hidden"
        >
          Filters{activeExtraFilters ? ` (${activeExtraFilters})` : ""}
        </Button>
      </Toolbar>

      <div className="mb-4 hidden gap-2 md:grid md:grid-cols-2 lg:grid-cols-4">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Service">
          <TypeOptions />
        </Select>
        <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} aria-label="Payment">
          <PaymentOptions />
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort">
          <SortOptions />
        </Select>
        <div className="flex min-h-12 items-center rounded-cx border border-cx-line-strong bg-cx-surface px-3.5">
          <div className="w-full">
            <Switch checked={isUrgentOnly} onChange={setIsUrgentOnly} label="Fast Track only" />
          </div>
        </div>
      </div>

      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filters"
        footer={
          <Button block onClick={() => setFiltersOpen(false)}>
            Show results
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Service">
            {(p) => (
              <Select {...p} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <TypeOptions />
              </Select>
            )}
          </Field>
          <Field label="Payment">
            {(p) => (
              <Select {...p} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <PaymentOptions />
              </Select>
            )}
          </Field>
          <Field label="Sort by">
            {(p) => (
              <Select {...p} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <SortOptions />
              </Select>
            )}
          </Field>
          <Switch
            checked={isUrgentOnly}
            onChange={setIsUrgentOnly}
            label="Fast Track only"
            description="Only show applications the customer paid to speed up."
          />
        </div>
      </Sheet>

      {DRIVING_SCHOOL_FILTERS.includes(statusFilter) ? (
        <div className="mb-4">
          <p className="mb-2 text-[13px] text-cx-muted">
            Separate candidates still in the 26-day countdown from those who graduated and need a certificate or are ready to route.
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Driving school stage">
            {dsChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                aria-pressed={chip.active}
                onClick={() => setStatusFilter(chip.id)}
                className={cx(
                  "cx-focus inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                  chip.active
                    ? "bg-cx-brand text-white"
                    : "border border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
                )}
              >
                {chip.label}
                <span className={chip.active ? "text-white/85" : "text-cx-muted"}>{chip.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error && applications.length > 0 ? (
        <div className="mb-4">
          <Notice tone="red" title="Couldn't refresh the queue">
            {error}
          </Notice>
        </div>
      ) : null}

      {loading ? (
        <SkeletonList rows={4} />
      ) : error && applications.length === 0 ? (
        <ErrorState message={error} onRetry={() => loadData()} />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No applications match"
          description="Try another status or tab, or clear your search."
        />
      ) : (
        <ul className="space-y-3">
          {filteredApps.map((app) => {
            const isPaid = (app.payment_status === "success" || app.payment_status === "paid") && (!app.remaining_kobo || app.remaining_kobo <= 0);
            const isUnclaimed = !app.staff_id;
            const isMine = currentUser?.id ? String(app.staff_id) === String(currentUser.id) : (scope === "mine");
            const meta = statusMeta(app.status);

            return (
              <li key={app.id}>
                <div
                  onClick={() => router.push(`/staff/applications/${app.id}`)}
                  className="cursor-pointer rounded-cx-lg border border-cx-line bg-cx-surface p-4 shadow-cx transition-colors hover:border-cx-brand/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm text-cx-muted">
                      {serviceLabel(app.application_type || "fresh")} · #{app.id}
                    </p>
                    <Badge tone={meta.tone} className="shrink-0">{meta.label}</Badge>
                  </div>
                  <p className="mt-1 break-words text-[17px] font-semibold text-cx-ink">{applicantName(app)}</p>
                  <p className="mt-0.5 text-sm text-cx-muted">
                    {[app.lga, app.state_of_residence].filter(Boolean).join(" · ") || "No location yet"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isPaid && app.sla ? <SlaChip sla={app.sla} compact /> : null}
                    {app.is_urgent ? (
                      <Badge tone="amber">
                        <Zap className="h-3.5 w-3.5" aria-hidden />
                        Fast Track
                      </Badge>
                    ) : null}
                    {isPaid ? (
                      <Badge tone="brand">Paid</Badge>
                    ) : app.remaining_kobo > 0 ? (
                      <Badge tone={app.is_overdue ? "red" : "amber"}>
                        {app.is_overdue ? <AlertCircle className="h-3.5 w-3.5" aria-hidden /> : null}
                        {koboToNaira(app.remaining_kobo)} owed{app.is_overdue ? " · overdue" : ""}
                      </Badge>
                    ) : null}
                    {isUnclaimed ? (
                      <Badge tone="amber">Unclaimed</Badge>
                    ) : isMine ? (
                      <Badge tone="brand">
                        <UserCheck className="h-3.5 w-3.5" aria-hidden />
                        Yours
                      </Badge>
                    ) : (
                      <Badge>Staff #{app.staff_id}</Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-cx-line pt-3">
                    {isUnclaimed ? (
                      <Button
                        size="sm"
                        icon={UserCheck}
                        loading={claimingId === app.id}
                        onClick={(e) => handleClaim(e, app.id)}
                        className="min-h-11"
                      >
                        Claim
                      </Button>
                    ) : null}
                    <Button
                      href={`/staff/applications/${app.id}`}
                      variant="secondary"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="min-h-11"
                    >
                      Open
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function StaffApplicationsQueuePage() {
  return (
    <Suspense fallback={<SkeletonList rows={4} />}>
      <StaffApplicationsQueueInner />
    </Suspense>
  );
}
