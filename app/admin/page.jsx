"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  TrendingUp,
  Landmark,
  Users,
  Wallet,
  FileText,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import {
  adminGetMetricsOverview,
  adminGetMetricsApplications,
  adminGetMetricsAgents,
  adminGetMetricsWallets,
  adminGetMetricsLgaCoverage,
  adminGetFailedTransfers,
  adminGetRevenueTransactions,
  koboToNaira,
  getCachedUser,
} from "@/lib/api";

/* ─── Helpers ─── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatLabel(key) {
  if (!key) return "—";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const PAYMENT_STATUS_STYLES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
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

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-300" />}
      </div>
      <p className="text-[24px] font-bold text-slate-900 mt-1.5 leading-none">{value}</p>
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

/* ─── Main Page ─── */
export default function AdminDashboardPage() {
  const user = getCachedUser();

  const [overview, setOverview] = useState(null);
  const [appMetrics, setAppMetrics] = useState(null);
  const [agentMetrics, setAgentMetrics] = useState([]);
  const [walletMetrics, setWalletMetrics] = useState(null);
  const [failedTransfers, setFailedTransfers] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [lgaOpen, setLgaOpen] = useState(false);
  const [lgaLoading, setLgaLoading] = useState(false);
  const [lgaCoverage, setLgaCoverage] = useState(null);

  const loadAll = async () => {
    const [overviewRes, appRes, agentRes, walletRes, failedRes, txRes] = await Promise.all([
      adminGetMetricsOverview(),
      adminGetMetricsApplications(),
      adminGetMetricsAgents(),
      adminGetMetricsWallets(),
      adminGetFailedTransfers(),
      adminGetRevenueTransactions({ page: 1, page_size: 5 }),
    ]);
    if (overviewRes.data) setOverview(overviewRes.data);
    if (appRes.data) setAppMetrics(appRes.data);
    if (agentRes.data && Array.isArray(agentRes.data)) setAgentMetrics(agentRes.data);
    if (walletRes.data) setWalletMetrics(walletRes.data);
    if (failedRes.data && Array.isArray(failedRes.data)) setFailedTransfers(failedRes.data);
    if (txRes.data) setRecentTx(txRes.data.items || []);
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

  const handleLoadLgaCoverage = async () => {
    setLgaOpen((open) => !open);
    if (!lgaCoverage) {
      setLgaLoading(true);
      const res = await adminGetMetricsLgaCoverage();
      if (res.data && Array.isArray(res.data)) setLgaCoverage(res.data);
      setLgaLoading(false);
    }
  };

  const topAgents = [...agentMetrics]
    .sort((a, b) => (b.lifetime_earnings_kobo || 0) - (a.lifetime_earnings_kobo || 0))
    .slice(0, 5);

  const byStatusEntries = appMetrics ? Object.entries(appMetrics.by_status || {}) : [];
  const byTypeEntries = appMetrics ? Object.entries(appMetrics.by_type || {}) : [];

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."} Here's how the platform is doing.
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
          {/* ─── Top KPI Row ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Customers" value={overview?.total_customers ?? "—"} sub="Registered accounts" icon={Users} />
            <StatCard label="Total Staff" value={overview?.total_staff ?? "—"} sub="Verification staff" icon={Users} />
            <StatCard label="Total Agents" value={overview?.total_agents ?? "—"} sub="VIO field agents" icon={Users} />
            <StatCard label="Total Applications" value={appMetrics?.total_applications ?? "—"} sub="All-time submissions" icon={FileText} />
          </div>

          {/* ─── Revenue Summary ─── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-slate-700">Revenue</p>
              <Link href="/admin/revenue" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#28A745] hover:opacity-80 transition-opacity">
                View full revenue <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Total Inflow" value={overview ? koboToNaira(overview.gross_payments_kobo) : "—"} sub="Gross successful payments" icon={TrendingUp} />
              <StatCard label="Platform Profit" value={overview ? koboToNaira(overview.platform_profit_kobo) : "—"} sub="Kept by Vehiculars" icon={Landmark} />
              <StatCard
                label="Agent Service Fees"
                value={overview ? koboToNaira(overview.agent_service_fees_kobo) : "—"}
                sub={overview ? `${koboToNaira(overview.agent_payables_paid_kobo)} disbursed` : "—"}
                icon={Wallet}
              />
            </div>
          </div>

          {/* ─── Applications Breakdown ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel title="Applications by status">
              {byStatusEntries.length === 0 ? (
                <p className="text-[12.5px] text-slate-400">No applications yet.</p>
              ) : (
                <div className="space-y-2">
                  {byStatusEntries.map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-slate-600">{formatLabel(status)}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Applications by type">
              {byTypeEntries.length === 0 ? (
                <p className="text-[12.5px] text-slate-400">No applications yet.</p>
              ) : (
                <div className="space-y-2">
                  {byTypeEntries.map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-slate-600 capitalize">{type}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* ─── Wallet Summary ─── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-semibold text-slate-700 mb-3">Wallets</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Wallets" value={walletMetrics?.total_wallets ?? "—"} icon={Wallet} />
              <StatCard label="Total Balance" value={walletMetrics ? koboToNaira(walletMetrics.total_balance_kobo) : "—"} />
              <StatCard label="Total Funded" value={walletMetrics ? koboToNaira(walletMetrics.total_funded_kobo) : "—"} />
              <StatCard label="Total Spent" value={walletMetrics ? koboToNaira(walletMetrics.total_spent_kobo) : "—"} />
            </div>
          </div>

          {/* ─── Top Agents ─── */}
          <Panel
            title="Top agents by earnings"
            action={
              <Link href="/admin/people" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#28A745] hover:opacity-80 transition-opacity">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {topAgents.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">No agents yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-2 px-4 font-semibold">Agent</th>
                      <th className="py-2 px-4 font-semibold">Jobs accepted</th>
                      <th className="py-2 px-4 font-semibold">Jobs completed</th>
                      <th className="py-2 px-4 font-semibold">Lifetime earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((a, idx) => (
                      <tr key={`${a.agent_name}-${idx}`} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 px-4 text-[12.5px] font-semibold text-slate-900">{a.agent_name}</td>
                        <td className="py-2.5 px-4 text-[12.5px] text-slate-600">{a.jobs_accepted}</td>
                        <td className="py-2.5 px-4 text-[12.5px] text-slate-600">{a.jobs_completed}</td>
                        <td className="py-2.5 px-4 text-[12.5px] font-semibold text-slate-900">{koboToNaira(a.lifetime_earnings_kobo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* ─── Failed Transfers Alert ─── */}
          {failedTransfers.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-red-800">
                    {failedTransfers.length} agent disbursement{failedTransfers.length === 1 ? "" : "s"} need attention
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {failedTransfers.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-[12px] text-red-700">
                        <span className="font-mono">
                          App #{t.application_id} &middot; {t.transfer_code || "no ref"}
                          <span className="ml-1.5 uppercase text-red-500">({t.status})</span>
                        </span>
                        <span className="font-semibold">{koboToNaira(t.amount_kobo)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Recent Transactions ─── */}
          <Panel
            title="Recent transactions"
            action={
              <Link href="/admin/revenue" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#28A745] hover:opacity-80 transition-opacity">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {recentTx.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-2 px-4 font-semibold">Applicant</th>
                      <th className="py-2 px-4 font-semibold">Amount</th>
                      <th className="py-2 px-4 font-semibold">Status</th>
                      <th className="py-2 px-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map((tx) => (
                      <tr key={tx.payment_id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 px-4">
                          <p className="text-[12.5px] font-semibold text-slate-900">{tx.applicant_name}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{tx.application_type} &middot; {tx.validity_period || "—"}</p>
                        </td>
                        <td className="py-2.5 px-4 text-[12.5px] font-semibold text-slate-900">{koboToNaira(tx.amount_kobo)}</td>
                        <td className="py-2.5 px-4"><StatusBadge status={tx.status} /></td>
                        <td className="py-2.5 px-4 text-[12px] text-slate-500 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* ─── LGA Coverage — lazy, opt-in ─── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={handleLoadLgaCoverage}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                LGA coverage
                <span className="text-[11px] font-normal text-slate-400">(loaded on demand — scans every LGA nationally)</span>
              </span>
              {lgaOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {lgaOpen && (
              <div className="border-t border-slate-100 p-4">
                {lgaLoading ? (
                  <p className="text-[12.5px] text-slate-400">Scanning LGA coverage&hellip; this can take a moment.</p>
                ) : !lgaCoverage || lgaCoverage.length === 0 ? (
                  <p className="text-[12.5px] text-slate-400">No LGAs with active agents or pending applications found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <th className="py-2 px-4 font-semibold">State</th>
                          <th className="py-2 px-4 font-semibold">LGA</th>
                          <th className="py-2 px-4 font-semibold">Active agents</th>
                          <th className="py-2 px-4 font-semibold">Pending applications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lgaCoverage.map((row) => (
                          <tr key={`${row.state_name}-${row.lga_name}`} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 px-4 text-[12.5px] text-slate-600">{row.state_name}</td>
                            <td className="py-2 px-4 text-[12.5px] font-semibold text-slate-900">{row.lga_name}</td>
                            <td className="py-2 px-4 text-[12.5px] text-slate-600">{row.active_agents}</td>
                            <td className="py-2 px-4 text-[12.5px] text-slate-600">{row.pending_applications}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
