"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Timer,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Briefcase,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  User,
  Phone,
  Mail,
  ArrowUpRight,
  Sliders,
} from "lucide-react";
import { adminGetSlaCountdown, staffGetSlaCountdown } from "@/lib/api";

const BRAND = "#28A745";

export default function SlaCountdownMonitor({ portal = "admin" }) {
  const [data, setData] = useState({
    summary: { total_active: 0, on_track: 0, nearing_deadline: 0, breached: 0, completed: 0 },
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'breached', 'nearing_deadline', 'on_track', 'completed'
  const [selectedService, setSelectedService] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchCountdown = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const fetcher = portal === "admin" ? adminGetSlaCountdown : staffGetSlaCountdown;
    const res = await fetcher({
      sla_status: activeTab,
      service_key: selectedService,
      search: searchQuery,
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
  }, [activeTab, selectedService, page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCountdown();
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

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>{portal === "admin" ? "Operations" : "Staff Portal"}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#28A745]">SLA Deadlines & Countdowns</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Timer className="h-7 w-7 text-[#28A745]" />
            SLA Countdown Monitor
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time countdown tracking across all active applications. Monitor healthy SLAs, closing deadlines, and overdue breaches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {portal === "admin" && (
            <Link
              href="/admin/deadlines"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              Configure Deadlines
            </Link>
          )}

          <button
            type="button"
            onClick={() => fetchCountdown(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Active */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
          className={`rounded-2xl border p-4 text-left transition-all shadow-sm ${
            activeTab === "all" ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/20" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === "all" ? "text-slate-300" : "text-slate-500"}`}>
              Active in SLA
            </span>
            <div className={`rounded-lg p-1.5 ${activeTab === "all" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-black ${activeTab === "all" ? "text-white" : "text-slate-900"}`}>
            {summary.total_active}
          </p>
          <span className={`text-[11.5px] font-medium ${activeTab === "all" ? "text-slate-300" : "text-slate-500"}`}>
            Open applications
          </span>
        </button>

        {/* Breached (Red) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("breached");
            setPage(1);
          }}
          className={`rounded-2xl border p-4 text-left transition-all shadow-sm ${
            activeTab === "breached"
              ? "border-rose-600 bg-rose-600 text-white ring-2 ring-rose-600/30"
              : "border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 text-rose-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === "breached" ? "text-rose-100" : "text-rose-700"}`}>
              Breached / Overdue
            </span>
            <div className={`rounded-lg p-1.5 ${activeTab === "breached" ? "bg-white/20 text-white" : "bg-rose-200/80 text-rose-700"}`}>
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black">{summary.breached}</p>
            {summary.breached > 0 && (
              <span className={`text-[11px] font-bold animate-pulse ${activeTab === "breached" ? "text-white" : "text-rose-600"}`}>
                Action Required
              </span>
            )}
          </div>
          <span className={`text-[11.5px] font-medium ${activeTab === "breached" ? "text-rose-100" : "text-rose-600"}`}>
            Deadline elapsed
          </span>
        </button>

        {/* Nearing Deadline (Amber) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("nearing_deadline");
            setPage(1);
          }}
          className={`rounded-2xl border p-4 text-left transition-all shadow-sm ${
            activeTab === "nearing_deadline"
              ? "border-amber-500 bg-amber-500 text-white ring-2 ring-amber-500/30"
              : "border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === "nearing_deadline" ? "text-amber-100" : "text-amber-800"}`}>
              Closing Soon
            </span>
            <div className={`rounded-lg p-1.5 ${activeTab === "nearing_deadline" ? "bg-white/20 text-white" : "bg-amber-200/80 text-amber-800"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black">{summary.nearing_deadline}</p>
          <span className={`text-[11.5px] font-medium ${activeTab === "nearing_deadline" ? "text-amber-100" : "text-amber-700"}`}>
            Near SLA limit
          </span>
        </button>

        {/* On Track (Green) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("on_track");
            setPage(1);
          }}
          className={`rounded-2xl border p-4 text-left transition-all shadow-sm ${
            activeTab === "on_track"
              ? "border-emerald-600 bg-emerald-600 text-white ring-2 ring-emerald-600/30"
              : "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === "on_track" ? "text-emerald-100" : "text-emerald-800"}`}>
              On Track
            </span>
            <div className={`rounded-lg p-1.5 ${activeTab === "on_track" ? "bg-white/20 text-white" : "bg-emerald-200/80 text-emerald-800"}`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black">{summary.on_track}</p>
          <span className={`text-[11.5px] font-medium ${activeTab === "on_track" ? "text-emerald-100" : "text-emerald-700"}`}>
            Healthy SLA buffer
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Active ({summary.total_active})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("breached");
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              activeTab === "breached"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Breached ({summary.breached})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("nearing_deadline");
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              activeTab === "nearing_deadline"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white border border-amber-200 text-amber-800 hover:bg-amber-50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Closing Soon ({summary.nearing_deadline})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("on_track");
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              activeTab === "on_track"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            On Track ({summary.on_track})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("completed");
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "completed"
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Completed ({summary.completed})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or phone..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#28A745] focus:ring-2 focus:ring-[#28A745]/15 transition-all"
          />
        </div>
      </div>

      {/* Applications Countdown Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#28A745]" />
            <p className="mt-2 text-xs font-medium">Loading SLA countdowns...</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Timer className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No applications match this SLA filter</p>
            <p className="text-xs text-slate-400">All applications are either completed or filter returned no matches.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Application & Customer</th>
                  <th className="py-3.5 px-5">Service & SLA Target</th>
                  <th className="py-3.5 px-5 min-w-[220px]">Countdown & Progress</th>
                  <th className="py-3.5 px-5">Deadline Status</th>
                  <th className="py-3.5 px-5">Handling Assignment</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.items.map((item) => {
                  const sla = item.sla;
                  const isBreached = sla.is_breached;
                  const isNearing = sla.is_nearing;

                  // Progress bar color
                  let barColor = "bg-emerald-500";
                  let bgTint = "";
                  if (isBreached) {
                    barColor = "bg-rose-500";
                    bgTint = "bg-rose-50/30";
                  } else if (isNearing) {
                    barColor = "bg-amber-500";
                    bgTint = "bg-amber-50/30";
                  }

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${bgTint}`}>
                      {/* Application & Customer */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-[12.5px]">
                              {item.application_id_formatted}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                              {(item.current_status || "").replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-[13px] font-bold text-slate-900">{item.applicant_name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            {item.applicant_phone && <span>{item.applicant_phone}</span>}
                            {item.applicant_email && <span className="truncate max-w-[140px]">{item.applicant_email}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Service & SLA Target */}
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="text-[12.5px] font-bold text-slate-900">{item.service_name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[11.5px] font-semibold text-slate-700">
                              {sla.days_allocated}{" "}
                              {sla.day_type === "business_days" ? "Working Days" : "Days"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({sla.day_type === "business_days" ? "Mon-Fri" : "Cal"})
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">
                            Target: {new Date(sla.target_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </td>

                      {/* Visual Countdown & Progress */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {sla.days_elapsed} of {sla.days_allocated} days
                            </span>
                            <span className={`font-bold font-mono ${
                              isBreached ? "text-rose-600" : isNearing ? "text-amber-600" : "text-emerald-600"
                            }`}>
                              {sla.percent_elapsed}%
                            </span>
                          </div>

                          {/* Progress Track */}
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${Math.min(100, sla.percent_elapsed)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                            <span>Started: {new Date(sla.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                            <span>{sla.days_remaining}d remaining</span>
                          </div>
                        </div>
                      </td>

                      {/* Deadline Status Badge */}
                      <td className="py-3.5 px-5">
                        {isBreached ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <Flame className="h-3.5 w-3.5 text-rose-600" />
                            {sla.label}
                          </span>
                        ) : isNearing ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            {sla.label}
                          </span>
                        ) : sla.is_completed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {sla.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                            {sla.label}
                          </span>
                        )}
                      </td>

                      {/* Handling Assignment */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-slate-400">Staff: </span>
                            <span className="font-semibold text-slate-700">
                              {item.assigned_staff_name || "Unassigned"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Agent: </span>
                            <span className="font-semibold text-slate-700">
                              {item.assigned_agent_name || "None"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={getApplicationLink(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="h-3 w-3 text-slate-500" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
