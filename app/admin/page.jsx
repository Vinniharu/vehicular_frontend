"use client";

import { useState, useEffect } from "react";
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
  UserCog,
  Briefcase,
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
import { Badge, Button, Card, Notice, PageHeader, SectionTitle, Skeleton } from "@/app/dashboard/_kit";
import { ResponsiveTable, StatTile } from "./_kit";

/* ─── Helpers ─── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatLabel(key) {
  if (!key) return "—";
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const PAYMENT_STATUS_TONE = { success: "brand", pending: "amber", failed: "red" };

function StatusBadge({ status, fallback = "—" }) {
  if (!status) return <span className="text-[13px] text-cx-muted">{fallback}</span>;
  return (
    <Badge tone={PAYMENT_STATUS_TONE[status] || "neutral"} className="capitalize">
      {status}
    </Badge>
  );
}

function ViewAllLink({ href, children = "View all" }) {
  return (
    <Button href={href} variant="ghost" size="sm" className="min-h-11 shrink-0 text-cx-brand-deep">
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Button>
  );
}

function CountList({ entries, empty, raw }) {
  if (entries.length === 0) return <p className="text-sm text-cx-muted">{empty}</p>;
  return (
    <dl className="divide-y divide-cx-line">
      {entries.map(([key, count]) => (
        <div key={key} className="flex items-center justify-between gap-4 py-2.5">
          <dt className={`min-w-0 text-sm text-cx-ink-2 ${raw ? "capitalize" : ""}`}>{raw ? key : formatLabel(key)}</dt>
          <dd className="text-sm font-semibold text-cx-ink">{count}</dd>
        </div>
      ))}
    </dl>
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

  const agentColumns = [
    { key: "agent_name", header: "Agent", primary: true, render: (a) => <span className="font-semibold">{a.agent_name}</span> },
    { key: "jobs_accepted", header: "Jobs accepted" },
    { key: "jobs_completed", header: "Jobs completed" },
    {
      key: "lifetime_earnings_kobo",
      header: "Lifetime earnings",
      render: (a) => <span className="font-semibold">{koboToNaira(a.lifetime_earnings_kobo)}</span>,
    },
  ];

  const txColumns = [
    {
      key: "applicant",
      header: "Applicant",
      primary: true,
      render: (tx) => (
        <div className="min-w-0">
          <p className="font-semibold text-cx-ink">
            {tx.last_name || tx.first_name ? (
              <>
                {tx.last_name || "—"}{" "}
                <span className="font-normal text-cx-muted">
                  ({tx.first_name || "—"}
                  {tx.middle_name ? ` ${tx.middle_name}` : ""})
                </span>
              </>
            ) : (
              tx.applicant_name
            )}
          </p>
          <p className="text-[13px] font-normal capitalize text-cx-muted">
            {tx.application_type === "wallet_deposit" ? "Wallet Deposit" : `${tx.application_type} · ${tx.validity_period || "—"}`}
          </p>
        </div>
      ),
    },
    { key: "amount_kobo", header: "Amount", render: (tx) => <span className="font-semibold">{koboToNaira(tx.amount_kobo)}</span> },
    { key: "status", header: "Status", render: (tx) => <StatusBadge status={tx.status} /> },
    {
      key: "created_at",
      header: "Date",
      className: "whitespace-nowrap",
      render: (tx) => <span className="text-cx-muted">{formatDate(tx.created_at)}</span>,
    },
  ];

  const lgaColumns = [
    { key: "lga_name", header: "LGA", primary: true, render: (r) => <span className="font-semibold">{r.lga_name}</span> },
    { key: "state_name", header: "State" },
    { key: "active_agents", header: "Active agents" },
    { key: "pending_applications", header: "Pending applications" },
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Dashboard"
        description={`${user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."} Here's how the platform is doing.`}
        actions={
          <Button variant="secondary" icon={RefreshCw} loading={refreshing} onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-5" role="status" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-cx-lg" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-cx-lg" />
          <Skeleton className="h-56 rounded-cx-lg" />
        </div>
      ) : (
        <>
          {/* ─── Top KPI Row ─── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Customers" value={overview?.total_customers ?? "—"} hint="Registered accounts" icon={Users} tone="brand" />
            <StatTile label="Staff" value={overview?.total_staff ?? "—"} hint="Verification staff" icon={UserCog} />
            <StatTile label="Agents" value={overview?.total_agents ?? "—"} hint="VIO field agents" icon={Briefcase} />
            <StatTile label="Applications" value={appMetrics?.total_applications ?? "—"} hint="All-time submissions" icon={FileText} />
          </div>

          {/* ─── Failed Transfers Alert ─── */}
          {failedTransfers.length > 0 && (
            <Notice
              tone="red"
              icon={AlertTriangle}
              title={`${failedTransfers.length} agent disbursement${failedTransfers.length === 1 ? "" : "s"} need attention`}
            >
              <ul className="mt-2 space-y-1.5">
                {failedTransfers.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                    <span className="min-w-0 break-all">
                      App #{t.application_id} · {t.transfer_code || "no ref"} <span className="capitalize">({t.status})</span>
                    </span>
                    <span className="font-semibold">{koboToNaira(t.amount_kobo)}</span>
                  </li>
                ))}
              </ul>
            </Notice>
          )}

          {/* ─── Revenue Summary ─── */}
          <Card>
            <SectionTitle title="Revenue" action={<ViewAllLink href="/admin/revenue">Full revenue</ViewAllLink>} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile
                label="Total inflow (Monnify wallet)"
                value={overview ? koboToNaira(overview.gross_payments_kobo) : "—"}
                hint={
                  overview?.total_monnify_fees_kobo
                    ? `${koboToNaira(overview.gross_collected_kobo)} gross (−${koboToNaira(overview.total_monnify_fees_kobo)} fee)`
                    : "Net settled in Monnify wallet"
                }
                icon={TrendingUp}
                tone="brand"
              />
              <StatTile label="Platform profit" value={overview ? koboToNaira(overview.platform_profit_kobo) : "—"} hint="Kept by Vehiculars" icon={Landmark} />
              <StatTile
                label="Agent service fees"
                value={overview ? koboToNaira(overview.agent_service_fees_kobo) : "—"}
                hint={overview ? `${koboToNaira(overview.agent_payables_paid_kobo)} disbursed` : "—"}
                icon={Wallet}
              />
            </div>
          </Card>

          {/* ─── Applications Breakdown ─── */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card>
              <SectionTitle title="Applications by status" />
              <CountList entries={byStatusEntries} empty="No applications yet." />
            </Card>
            <Card>
              <SectionTitle title="Applications by type" />
              <CountList entries={byTypeEntries} empty="No applications yet." raw />
            </Card>
          </div>

          {/* ─── Wallet Summary ─── */}
          <Card>
            <SectionTitle title="Wallets" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Wallets" value={walletMetrics?.total_wallets ?? "—"} icon={Wallet} />
              <StatTile label="Balance" value={walletMetrics ? koboToNaira(walletMetrics.total_balance_kobo) : "—"} />
              <StatTile label="Funded" value={walletMetrics ? koboToNaira(walletMetrics.total_funded_kobo) : "—"} />
              <StatTile label="Spent" value={walletMetrics ? koboToNaira(walletMetrics.total_spent_kobo) : "—"} />
            </div>
          </Card>

          {/* ─── Top Agents ─── */}
          <section>
            <SectionTitle title="Top agents by earnings" action={<ViewAllLink href="/admin/people" />} />
            <ResponsiveTable
              columns={agentColumns}
              rows={topAgents}
              rowKey={(a) => `${a.agent_name}-${a.lifetime_earnings_kobo}-${a.jobs_accepted}`}
              empty="No agents yet."
            />
          </section>

          {/* ─── Recent Transactions ─── */}
          <section>
            <SectionTitle title="Recent transactions" action={<ViewAllLink href="/admin/revenue" />} />
            <ResponsiveTable columns={txColumns} rows={recentTx} rowKey={(tx) => tx.payment_id || tx.reference} empty="No transactions yet." />
          </section>

          {/* ─── LGA Coverage — lazy, opt-in ─── */}
          <Card padded={false}>
            <button
              type="button"
              onClick={handleLoadLgaCoverage}
              aria-expanded={lgaOpen}
              className="cx-focus flex min-h-14 w-full items-center justify-between gap-3 rounded-cx-lg px-4 py-3 text-left sm:px-5"
            >
              <span className="flex min-w-0 items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[17px] font-semibold text-cx-ink">LGA coverage</span>
                  <span className="block text-[13px] text-cx-muted">Loaded on demand — scans every LGA nationally</span>
                </span>
              </span>
              {lgaOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-cx-muted" aria-hidden />
              )}
            </button>
            {lgaOpen && (
              <div className="border-t border-cx-line p-4 sm:p-5">
                {lgaLoading ? (
                  <p className="text-sm text-cx-muted" role="status">
                    Scanning LGA coverage… this can take a moment.
                  </p>
                ) : (
                  <ResponsiveTable
                    columns={lgaColumns}
                    rows={lgaCoverage || []}
                    rowKey={(r) => `${r.state_name}-${r.lga_name}`}
                    empty="No LGAs with active agents or pending applications found."
                  />
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
