"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Loader2,
  RefreshCw,
  CheckSquare,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { getStaffQueue, staffClaimApplication, getCachedUser, koboToNaira } from "@/lib/api";

const BRAND = "#28A745";

const STAFF_STATUS = {
  submitted: { label: "Awaiting review", tone: "info" },
  staff_review: { label: "Under verification", tone: "warning" },
  released_to_agents: { label: "Released to agents", tone: "success" },
  in_progress: { label: "Agents working", tone: "success" },
  driving_school_enrolled: { label: "In driving school pool", tone: "purple" },
  driving_school_certificate_ready: { label: "School complete — Ready to route", tone: "teal" },
  routed: { label: "Routed to field agent", tone: "success" },
  agent_assigned: { label: "Agent assigned", tone: "success" },
  agent_accepted: { label: "Agent en route", tone: "success" },
  temp_licence_pending_review: { label: "Temp licence — needs review", tone: "warning" },
  temp_licence_issued: { label: "Temp licence issued", tone: "purple" },
  agent_completed: { label: "Awaiting final review", tone: "teal" },
  staff_final_review: { label: "In final review", tone: "warning" },
  ready_for_pickup: { label: "Ready for pickup", tone: "indigo" },
  awaiting_customer: { label: "Awaiting customer confirmation", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  staff_rejected: { label: "Rejected / Flagged", tone: "danger" },
  needs_correction: { label: "Needs customer correction", tone: "warning" },
  expired: { label: "Licence expired", tone: "danger" },
};

const TONE_CLASSES = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

const TONE_DOT = {
  info: "bg-sky-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  success: "bg-emerald-500",
  purple: "bg-violet-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  neutral: "bg-slate-400",
};

function statusMeta(status) {
  return STAFF_STATUS[status] || {
    label: (status || "Unknown").replace(/_/g, " "),
    tone: "neutral",
  };
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ${TONE_CLASSES[meta.tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} />
      {meta.label}
    </span>
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const currentUser = useMemo(() => getCachedUser(), []);

  // Filters & Search — initial tab can be deep-linked via ?tab=
  const [activeTab, setActiveTab] = useState(() => searchParams?.get("tab") || "unclaimed");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");

  const loadData = async (isRefresh = false, sort = sortBy) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const res = await getStaffQueue({ page: 1, page_size: 100, sort });
    if (res.error) {
      setError(res.error);
    } else if (Array.isArray(res.data?.items)) {
      setApplications(res.data.items);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData(false, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handleClaim = async (e, appId) => {
    e.stopPropagation();
    setClaimingId(appId);
    const res = await staffClaimApplication(appId);
    setClaimingId(null);
    if (!res.error) {
      await loadData(true);
    } else {
      setError(res.error);
    }
  };

  // Filtered list based on search and tab
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        String(app.id).includes(q) ||
        (app.applicant_name || "").toLowerCase().includes(q) ||
        (app.lga || "").toLowerCase().includes(q) ||
        (app.state_of_residence || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      const matchType = typeFilter === "all" || app.application_type === typeFilter;
      if (!matchType) return false;

      if (activeTab === "all") return true;
      if (activeTab === "unclaimed") return !app.staff_id;
      if (activeTab === "mine") return app.staff_id === currentUser?.id;
      if (activeTab === "submitted") return app.status === "submitted";
      if (activeTab === "staff_review") return app.status === "staff_review";
      if (activeTab === "driving_school") return app.status === "driving_school_enrolled";
      if (activeTab === "graduated") return app.status === "driving_school_certificate_ready";
      if (activeTab === "action_needed") return app.status === "agent_completed";
      if (activeTab === "dispatch") return app.status === "awaiting_customer";
      if (activeTab === "flagged") return app.status === "staff_rejected" || app.status === "needs_correction";
      return true;
    });
  }, [applications, activeTab, searchQuery, currentUser, typeFilter]);

  // Counts for top tabs
  const counts = useMemo(() => {
    return {
      all: applications.length,
      unclaimed: applications.filter((a) => !a.staff_id).length,
      mine: applications.filter((a) => a.staff_id === currentUser?.id).length,
      submitted: applications.filter((a) => a.status === "submitted").length,
      staff_review: applications.filter((a) => a.status === "staff_review").length,
      driving_school: applications.filter((a) => a.status === "driving_school_enrolled").length,
      graduated: applications.filter((a) => a.status === "driving_school_certificate_ready").length,
      action_needed: applications.filter((a) => a.status === "agent_completed").length,
      dispatch: applications.filter((a) => a.status === "awaiting_customer").length,
      flagged: applications.filter((a) => a.status === "staff_rejected" || a.status === "needs_correction").length,
    };
  }, [applications, currentUser]);

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Header Section ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#28A745]" />
              Processing & Routing Queue
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Applications Review Queue
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Search, filter, and review all applications (fresh, renewal, reissue, and international permit). Open any candidate file to inspect documents, enroll into accredited driving academies, route graduates to VIO field agents, or complete a final review before dispatch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
            <span>{refreshing ? "Syncing Queue…" : "Refresh Queue"}</span>
          </button>
        </div>
      </div>

      {/* ─── Search Bar & Horizontal Status Tabs ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by ID, candidate name, or LGA..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="all">All types</option>
          <option value="fresh">Fresh</option>
          <option value="renewal">Renewal</option>
          <option value="reissue">Reissue</option>
          <option value="international_permit">International Permit</option>
          <option value="tinted_permit">Tinted Permit</option>
          <option value="number_plate_new">Number Plate — New</option>
          <option value="number_plate_replacement">Number Plate — Replacement</option>
          <option value="number_plate_change_of_ownership">Number Plate — Change of Ownership</option>
          <option value="number_plate_fancy">Number Plate — Fancy</option>
          <option value="number_plate_dealership">Number Plate — Dealership</option>
          <option value="vehicle_particulars">Vehicle Particulars</option>
          <option value="physical_condition_inspection">Physical Condition Inspection</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 shadow-sm focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15"
        >
          <option value="updated_at">Recently updated</option>
          <option value="id">ID number</option>
          <option value="name">Applicant name</option>
        </select>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: `All (${counts.all})` },
            { id: "unclaimed", label: `Unclaimed (${counts.unclaimed})` },
            { id: "mine", label: `My Queue (${counts.mine})` },
            { id: "submitted", label: `Awaiting (${counts.submitted})` },
            { id: "staff_review", label: `Under Review (${counts.staff_review})` },
            { id: "driving_school", label: `Driving School (${counts.driving_school})` },
            { id: "graduated", label: `Ready to Route (${counts.graduated})` },
            { id: "action_needed", label: `Needs Final Review (${counts.action_needed})` },
            { id: "dispatch", label: `Needs Dispatch (${counts.dispatch})` },
            { id: "flagged", label: `Flagged (${counts.flagged})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all shadow-sm ${
                activeTab === tab.id
                  ? "bg-[#28A745] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Error Alert ─── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Applications List ─── */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-3 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading application queue…</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-2 shadow-sm">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Applications Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No applications match your current search query or active filter tab.
            </p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const isPaid = app.payment_status === "success";
            const isUnclaimed = !app.staff_id;
            const isMine = app.staff_id === currentUser?.id;

            return (
              <div
                key={app.id}
                onClick={() => router.push(`/staff/applications/${app.id}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#28A745]/60 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900">#{app.id}</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {(app.application_type || "FRESH").replace(/_/g, " ")}
                    </span>
                    <StatusBadge status={app.status} />
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Paid Fee
                      </span>
                    ) : app.remaining_kobo > 0 && (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${app.is_overdue ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {app.is_overdue && <AlertCircle className="h-3 w-3" />}
                        {koboToNaira(app.remaining_kobo)} owed{app.is_overdue ? " · Overdue" : ""}
                      </span>
                    )}
                    {isUnclaimed ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">
                        Unclaimed
                      </span>
                    ) : isMine ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#28A745]/30 bg-[#E9F7EC] px-2 py-0.5 text-[10.5px] font-bold text-[#166B2C]">
                        <UserCheck className="h-3 w-3" />
                        Claimed by you
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#28A745] transition-colors flex items-center gap-2">
                      <span>{app.applicant_name}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>LGA Sector: <strong className="text-slate-700">{app.lga || "—"}</strong></span>
                      <span>•</span>
                      <span>State: <strong className="text-slate-700">{app.state_of_residence || "—"}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {isUnclaimed && (
                    <button
                      type="button"
                      onClick={(e) => handleClaim(e, app.id)}
                      disabled={claimingId === app.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#28A745] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F8838] transition-all shadow-sm disabled:opacity-60"
                    >
                      {claimingId === app.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      <span>Accept</span>
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-semibold text-slate-700 group-hover:bg-[#28A745] group-hover:text-white group-hover:border-[#28A745] transition-all shadow-sm">
                    <span>Review Details & Verify</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function StaffApplicationsQueuePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-slate-400">Loading queue…</div>}>
      <StaffApplicationsQueueInner />
    </Suspense>
  );
}
