"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  AlertCircle,
  Search,
  X,
  Loader2,
  RefreshCw,
  CheckSquare,
  ArrowUpRight,
  Timer,
} from "lucide-react";
import { getAgentApplications } from "@/lib/api";
import { StatusBadge } from "../_status";

const TAB_FILTERS = {
  all: () => true,
  needs_capture: (app) => app.application_type === "fresh" && ["agent_accepted", "agent_assigned", "capture_scheduled", "capturing_scheduled"].includes(app.status),
  awaiting_upload: (app) => {
    if (app.application_type === "vehicle_particulars") {
      return (
        ["agent_accepted", "agent_assigned", "in_progress", "in_process", "needs_correction", "released_to_agents"].includes(app.status) ||
        (app.items && app.items.some((i) => ["agent_accepted", "rejected", "evidence_submitted", "submitted", "pending_evidence"].includes(i.status)))
      );
    }
    if (app.application_type === "fresh") {
      return ["captured", "capturing_completed", "temp_licence_pending_review", "temp_licence_issued", "needs_correction"].includes(app.status);
    }
    return ["agent_accepted", "agent_assigned", "in_progress", "in_process", "needs_correction", "captured", "capturing_completed"].includes(app.status);
  },
  ready_for_pickup: (app) => ["agent_completed", "staff_final_review", "ready_for_pickup"].includes(app.status),
  completed: (app) => ["completed", "awaiting_customer"].includes(app.status),
};

export default function AgentApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");

  const loadData = async (isRefresh = false, sort = sortBy) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await getAgentApplications({ sort });
    if (res.error) setError(res.error);
    else if (Array.isArray(res.data)) setApplications(res.data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData(false, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const counts = useMemo(() => {
    return Object.fromEntries(
      Object.entries(TAB_FILTERS).map(([key, predicate]) => [key, applications.filter(predicate).length])
    );
  }, [applications]);

  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return applications.filter((app) => {
      const matchesTab = TAB_FILTERS[activeTab](app);
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        String(app.raw_id ?? app.id).includes(q) ||
        (app.last_name || "").toLowerCase().includes(q) ||
        (app.first_name || "").toLowerCase().includes(q) ||
        (app.middle_name || "").toLowerCase().includes(q) ||
        (app.applicant_name || "").toLowerCase().includes(q) ||
        (app.lga || "").toLowerCase().includes(q)
      );
    });
  }, [applications, searchQuery, activeTab]);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <ClipboardList className="h-3.5 w-3.5 text-[#28A745]" />
              My Applications
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Applications assigned to you</h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Everything you've accepted — schedule captures, mark biometrics done, and upload proof of the finished card.
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by ID, name, or LGA..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/15 shadow-sm transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

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
            { id: "all", label: `All (${counts.all || 0})` },
            { id: "needs_capture", label: `Needs Capture (${counts.needs_capture || 0})` },
            { id: "awaiting_upload", label: `Awaiting Document Upload (${counts.awaiting_upload || 0})` },
            { id: "ready_for_pickup", label: `Ready for Pickup (${counts.ready_for_pickup || 0})` },
            { id: "completed", label: `Completed (${counts.completed || 0})` },
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

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3.5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-3 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading your applications…</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center space-y-2 shadow-sm">
            <CheckSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Nothing here yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Accept an offer to see it show up here.
            </p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const id = app.raw_id ?? app.id;
            const detailHref =
              app.application_type === "roadworthiness_express" ? `/agent/rwx/${id}` :
              `/agent/applications/${id}`;
            const isParticulars = app.application_type === "vehicle_particulars";
            const items = app.items || [];
            const totalItems = items.length;
            const approvedItems = items.filter((i) => i.status === "approved").length;
            const rejectedItems = items.filter((i) => i.status === "rejected").length;
            const pendingUploadItems = items.filter((i) => ["agent_accepted", "evidence_submitted", "submitted", "pending_evidence"].includes(i.status)).length;

            return (
              <div
                key={id}
                onClick={() => router.push(detailHref)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#28A745]/60 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900">#{id}</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {(app.application_type || "FRESH").replace(/_/g, " ")}
                    </span>
                    <StatusBadge status={app.status} appType={app.application_type} size="sm" />
                    {isParticulars && rejectedItems > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                        {rejectedItems} Revision Required
                      </span>
                    )}
                    {isParticulars && rejectedItems === 0 && pendingUploadItems > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        {pendingUploadItems} of {totalItems} Pending Upload
                      </span>
                    )}
                    {isParticulars && rejectedItems === 0 && pendingUploadItems === 0 && totalItems > 0 && approvedItems === totalItems && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        All {totalItems} Approved
                      </span>
                    )}
                    {isParticulars && rejectedItems === 0 && pendingUploadItems === 0 && totalItems > 0 && approvedItems < totalItems && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {totalItems} Under Review
                      </span>
                    )}
                    {app.sla && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        app.sla.is_breached
                          ? "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                          : app.sla.is_nearing
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <Timer className="h-3 w-3 shrink-0" />
                        {app.sla.label} ({app.sla.days_elapsed}/{app.sla.days_allocated}d)
                      </span>
                    )}
                  </div>
                  <div>
                    {isParticulars ? (
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Customer: <strong className="text-base font-bold text-slate-900 group-hover:text-[#28A745] transition-colors">
                            {app.applicant_name || `${app.first_name || ""} ${app.last_name || ""}`.trim() || "Applicant"}
                          </strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Bundle: <strong className="text-slate-800">{totalItems} document{totalItems !== 1 ? "s" : ""}</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Surname: <strong className="text-base font-bold text-slate-900 group-hover:text-[#28A745] transition-colors">{app.last_name || "—"}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">First: <strong className="text-base font-bold text-slate-900 group-hover:text-[#28A745] transition-colors">{app.first_name || "—"}</strong></span>
                        {app.middle_name && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Middle: <strong className="text-base font-bold text-slate-900 group-hover:text-[#28A745] transition-colors">{app.middle_name}</strong></span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>LGA: <strong className="text-slate-700">{app.lga || "—"}</strong></span>
                      <span>•</span>
                      <span>Phone: <strong className="text-slate-700">{app.phone || "—"}</strong></span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] font-semibold text-slate-700 group-hover:bg-[#28A745] group-hover:text-white group-hover:border-[#28A745] transition-all shadow-sm">
                    <span>Open</span>
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
