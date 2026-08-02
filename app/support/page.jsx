"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, FileText, MapPinOff, MessageCircle, Users, ArrowRight } from "lucide-react";
import { getSupportMetricsOverview, getCachedUser } from "@/lib/api";

function StatCard({ label, value, sub, icon: Icon, tone }) {
  return (
    <div
      className="bg-white rounded-xl border px-4 py-4 shadow-sm"
      style={{ borderColor: tone === "warn" ? "#fbbf24" : "#e2e8f0" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-300" />}
      </div>
      <p className={`text-[24px] font-bold mt-1.5 leading-none ${tone === "warn" ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <p className="text-[13px] font-semibold text-slate-700">{title}</p>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function formatLabel(key) {
  if (!key) return "—";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SupportDashboardPage() {
  const user = getCachedUser();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    const res = await getSupportMetricsOverview();
    if (res.data) setOverview(res.data);
  };

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const byStatusEntries = overview ? Object.entries(overview.applications_by_status || {}) : [];

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."} Here's what needs attention today.
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

      {loading ? (
        <div className="py-24 text-center text-[13px] text-slate-400">Loading dashboard&hellip;</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Applications" value={overview?.total_applications ?? "—"} sub="All-time submissions" icon={FileText} />
            <StatCard
              label="Unassigned"
              value={overview?.unassigned_count ?? "—"}
              sub="No agent in that LGA"
              icon={MapPinOff}
              tone={overview?.unassigned_count ? "warn" : undefined}
            />
            <StatCard
              label="Unclaimed Tickets"
              value={overview?.unclaimed_tickets ?? "—"}
              sub={`${overview?.open_tickets ?? 0} open total`}
              icon={MessageCircle}
              tone={overview?.unclaimed_tickets ? "warn" : undefined}
            />
            <StatCard label="Customers · Staff · Agents" value={`${overview?.total_customers ?? 0} · ${overview?.total_staff ?? 0} · ${overview?.total_agents ?? 0}`} sub="Registered accounts" icon={Users} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel
              title="Unassigned applications"
              action={
                <Link href="/support/unassigned" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#28A745] hover:opacity-80 transition-opacity">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <p className="text-[13px] text-slate-600">
                {overview?.unassigned_count
                  ? `${overview.unassigned_count} application${overview.unassigned_count === 1 ? "" : "s"} sitting in a state/LGA with no active agents.`
                  : "No applications are currently stuck without an agent."}
              </p>
            </Panel>

            <Panel
              title="Support tickets"
              action={
                <Link href="/support/tickets" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#28A745] hover:opacity-80 transition-opacity">
                  View queue <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <p className="text-[13px] text-slate-600">
                {overview?.unclaimed_tickets
                  ? `${overview.unclaimed_tickets} ticket${overview.unclaimed_tickets === 1 ? "" : "s"} waiting to be accepted.`
                  : "No unclaimed tickets right now."}
              </p>
            </Panel>
          </div>

          <Panel title="Applications by status">
            {byStatusEntries.length === 0 ? (
              <p className="text-[13px] text-slate-400">No data yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {byStatusEntries.map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-[12px] text-slate-600">{formatLabel(key)}</span>
                    <span className="text-[13px] font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
