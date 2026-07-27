"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronRight,
  UserCheck,
  Building,
  Truck,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CheckSquare,
  ArrowUpRight,
  BarChart3,
  TrendingUp,
  ListFilter,
} from "lucide-react";
import { getStaffQueue } from "@/lib/api";

const BRAND = "#28A745";

const STAFF_STATUS = {
  submitted: { label: "Awaiting review", tone: "info" },
  staff_review: { label: "Under verification", tone: "warning" },
  driving_school_enrolled: { label: "In driving school pool", tone: "purple" },
  driving_school_certificate_ready: { label: "School complete — Ready to route", tone: "teal" },
  routed: { label: "Routed to field agent", tone: "success" },
  agent_assigned: { label: "Agent assigned", tone: "success" },
  agent_accepted: { label: "Agent en route", tone: "success" },
  capture_scheduled: { label: "Capture scheduled", tone: "success" },
  capturing_scheduled: { label: "Capture scheduled", tone: "success" },
  captured: { label: "Biometrics captured", tone: "teal" },
  capturing_completed: { label: "Biometrics captured", tone: "teal" },
  temp_licence_pending_review: { label: "Temp licence — needs review", tone: "warning" },
  temp_licence_issued: { label: "Temp licence issued", tone: "purple" },
  agent_completed: { label: "Awaiting final review", tone: "warning" },
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

export default function StaffStatsDashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const res = await getStaffQueue({ page: 1, page_size: 100 });
    if (res.error) {
      setError(res.error);
    } else if (Array.isArray(res.data?.items)) {
      setApplications(res.data.items);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const counts = useMemo(() => {
    const total = applications.length;
    const submitted = applications.filter((a) => a.status === "submitted").length;
    const staff_review = applications.filter((a) => a.status === "staff_review").length;
    const driving_school = applications.filter((a) => a.status === "driving_school_enrolled").length;
    const graduated = applications.filter((a) => a.status === "driving_school_certificate_ready").length;
    const routed = applications.filter((a) => a.status === "routed").length;
    const needsFinalReview = applications.filter((a) => a.status === "agent_completed").length;
    const awaitingCustomer = applications.filter((a) => a.status === "awaiting_customer").length;
    const flagged = applications.filter((a) => a.status === "staff_rejected" || a.status === "needs_correction").length;

    const calcPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

    return {
      all: total,
      submitted,
      staff_review,
      driving_school,
      graduated,
      routed,
      needsFinalReview,
      awaitingCustomer,
      flagged,
      pctSubmitted: calcPct(submitted),
      pctReview: calcPct(staff_review),
      pctDriving: calcPct(driving_school),
      pctGraduated: calcPct(graduated),
      pctRouted: calcPct(routed),
    };
  }, [applications]);

  // Top recent applications requiring action
  const recentActionApps = useMemo(() => {
    return applications
      .filter((a) => ["submitted", "staff_review", "driving_school_certificate_ready", "agent_completed", "awaiting_customer"].includes(a.status))
      .slice(0, 6);
  }, [applications]);

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Modern Professional Header Banner ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-3">
              <BarChart3 className="h-3.5 w-3.5 text-[#28A745]" />
              Staff overview
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              What needs your attention
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
              Every fresh, renewal, and reissue application currently in your queue, grouped by
              what's next: review new submissions, enroll in driving school, route to a field
              agent, sign off on finished jobs, and confirm dispatch details.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <Link
              href="/staff/applications"
              className="inline-flex items-center gap-2 rounded-lg bg-[#28A745] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1F8838] transition-all shadow-sm"
            >
              <ListFilter className="h-4 w-4" />
              <span>Open Review Queue</span>
            </Link>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#28A745]" : "text-slate-500"}`} />
              <span>{refreshing ? "Syncing…" : "Sync Stats"}</span>
            </button>
          </div>
        </div>

        {/* Metric Counter Cards */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 border-t border-slate-100">
          <Link
            href="/staff/applications"
            className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 hover:border-[#28A745] hover:bg-white transition-all shadow-sm"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-800">
              Total Fresh
            </span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{counts.all}</span>
          </Link>
          <Link
            href="/staff/applications"
            className="group rounded-xl border border-sky-200 bg-sky-50/60 p-4 hover:border-sky-400 hover:bg-white transition-all shadow-sm"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-sky-700">Awaiting Review</span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{counts.submitted}</span>
          </Link>
          <Link
            href="/staff/applications"
            className="group rounded-xl border border-amber-200 bg-amber-50/60 p-4 hover:border-amber-400 hover:bg-white transition-all shadow-sm"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700">Under Review</span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{counts.staff_review}</span>
          </Link>
          <Link
            href="/staff/applications"
            className="group rounded-xl border border-violet-200 bg-violet-50/60 p-4 hover:border-violet-400 hover:bg-white transition-all shadow-sm"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-violet-700">Driving School</span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{counts.driving_school}</span>
          </Link>
          <Link
            href="/staff/applications"
            className="group rounded-xl border border-teal-200 bg-teal-50/60 p-4 hover:border-teal-400 hover:bg-white transition-all shadow-sm"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-700">Ready to Route</span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{counts.graduated}</span>
          </Link>
          <Link
            href="/staff/applications"
            className="group rounded-xl border border-red-200 bg-red-50/60 p-4 hover:border-red-400 hover:bg-white transition-all shadow-sm"
          >
            <span className="block text-[11px] font-bold uppercase tracking-wider text-red-700">Flagged</span>
            <span className="mt-1.5 block text-2xl font-bold text-slate-900">{counts.flagged}</span>
          </Link>
        </div>
      </div>

      {/* ─── Error Alert ─── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Workflow Analytics & Actionable Priorities ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#28A745]" />
                Workflow Pipeline Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage breakdown across active candidate files
              </p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {counts.all} Total Files
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Awaiting Initial Review
                </span>
                <span>{counts.submitted} ({counts.pctSubmitted}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${counts.pctSubmitted}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Under Verification / Correction
                </span>
                <span>{counts.staff_review} ({counts.pctReview}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${counts.pctReview}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  In Driving School Pool (Countdown Active)
                </span>
                <span>{counts.driving_school} ({counts.pctDriving}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${counts.pctDriving}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  Graduated — Ready for VIO Dispatch
                </span>
                <span>{counts.graduated} ({counts.pctGraduated}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${counts.pctGraduated}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Successfully Routed to Field Agents
                </span>
                <span>{counts.routed} ({counts.pctRouted}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${counts.pctRouted}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Required & Priorities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Immediate Operational Priorities
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actionable queues requiring staff processing right now
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800">
                  <Truck className="h-4 w-4 text-teal-600" />
                  Ready for VIO Field Dispatch ({counts.graduated})
                </span>
                <p className="text-xs text-teal-700 leading-relaxed">
                  These applicants have completed driving school and uploaded their graduation certificates. They are ready to be dispatched to field officers.
                </p>
              </div>
              <Link
                href="/staff/applications?tab=graduated"
                className="shrink-0 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-all shadow-sm"
              >
                Route Now
              </Link>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800">
                  <ShieldCheck className="h-4 w-4 text-sky-600" />
                  Pending Biodata Review ({counts.submitted})
                </span>
                <p className="text-xs text-sky-700 leading-relaxed">
                  New candidates awaiting initial verification. Check NIN details and driving school eligibility.
                </p>
              </div>
              <Link
                href="/staff/applications?tab=submitted"
                className="shrink-0 rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-50 transition-all shadow-sm"
              >
                Inspect
              </Link>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Needs Final Review ({counts.needsFinalReview})
                </span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The assigned agent has finished the job and uploaded proof. Sign off before it moves to the customer.
                </p>
              </div>
              <Link
                href="/staff/applications?tab=action_needed"
                className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-all shadow-sm"
              >
                Review Now
              </Link>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  Needs Dispatch Details ({counts.awaitingCustomer})
                </span>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Approved and ready — record who dispatched the licence and any tracking note before the customer confirms receipt.
                </p>
              </div>
              <Link
                href="/staff/applications?tab=dispatch"
                className="shrink-0 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-all shadow-sm"
              >
                Record Dispatch
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Flagged for correction or rejection: <strong className="text-red-600">{counts.flagged} files</strong></span>
            <Link href="/staff/applications" className="font-bold text-[#28A745] hover:underline flex items-center gap-1">
              <span>View full queue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Recent Applications Requiring Attention ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#28A745]" />
              Recent Submissions Requiring Attention
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick access to priority applications awaiting verification or field routing
            </p>
          </div>
          <Link
            href="/staff/applications"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-300 transition-all self-start sm:self-center"
          >
            <span>View All ({counts.all})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-[#28A745] mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading recent submissions…</p>
          </div>
        ) : recentActionApps.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckSquare className="h-9 w-9 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">All Caught Up!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no immediate submissions or graduation files awaiting review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActionApps.map((app) => (
              <div
                key={app.id}
                onClick={() => router.push(`/staff/applications/${app.id}`)}
                className="group cursor-pointer py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 -mx-4 px-4 rounded-xl transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-slate-900">#{app.id}</span>
                    <StatusBadge status={app.status} />
                    <span className="text-xs font-bold text-slate-900">
                      {app.applicant_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2.5">
                    <span className="uppercase tracking-wide text-[10px] font-bold text-slate-400">{app.application_type || "fresh"}</span>
                    <span>•</span>
                    <span>LGA: <strong className="text-slate-700">{app.lga || "—"}</strong></span>
                    <span>•</span>
                    <span>State: <strong className="text-slate-700">{app.state_of_residence || "—"}</strong></span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 group-hover:border-[#28A745] group-hover:bg-[#28A745] group-hover:text-white transition-all shadow-sm">
                    <span>Review & Verify</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
