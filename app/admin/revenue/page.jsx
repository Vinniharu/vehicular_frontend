"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  TrendingUp,
  Landmark,
  Users,
  ChevronLeft,
  ChevronRight,
  Sliders,
  BadgeCheck,
  Building,
  CheckCircle2,
} from "lucide-react";
import {
  adminGetMetricsOverview,
  adminGetRevenueTransactions,
  adminGetServiceProfits,
  adminUpdateServiceProfits,
  adminReconcileCustomerPayment,
} from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  DetailRow,
  Field,
  Input,
  Notice,
  PageHeader,
  SectionTitle,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import {
  MoneyInput,
  ResponsiveTable,
  StatTile,
  Switch,
  Tabs,
  Toolbar,
  formatNaira,
  moneyError,
  toKobo,
  toNaira,
} from "@/app/admin/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ─── Helpers ─── */
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${day}`;
}

function startOfWeek(d) {
  const date = new Date(d);
  const dow = date.getDay(); // 0 = Sunday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

const DATE_PRESETS = [
  { id: "today", label: "Today", range: () => { const t = new Date(); return [t, t]; } },
  { id: "this_week", label: "This week", range: () => [startOfWeek(new Date()), new Date()] },
  { id: "this_month", label: "This month", range: () => [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
  { id: "all_time", label: "All time", range: () => [null, null] },
];

const PAYMENT_STATUS_TONES = {
  success: "brand",
  partial: "neutral",
  pending: "amber",
  failed: "red",
};

const CATEGORY_METADATA = {
  driver_licence: { label: "Driver's licence", badge: "DL family" },
  number_plate: { label: "Number plates", badge: "Plates" },
  vehicle_particulars: { label: "Vehicle particulars", badge: "Particulars" },
  inspection_verification: { label: "Inspections & verifications", badge: "Inspections" },
};

function StatusBadge({ status, fallback = "—" }) {
  if (!status) return <span className="text-[13px] text-cx-muted">{fallback}</span>;
  return (
    <Badge tone={PAYMENT_STATUS_TONES[status] || "neutral"} className="capitalize">
      {status}
    </Badge>
  );
}

function ProfitLine({ label, hint, amount, badge, onClick }) {
  return (
    <button type="button" onClick={onClick} className="cx-focus group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-cx-ink">{label}</p>
        {hint ? <p className="break-all text-[13px] text-cx-muted">{hint}</p> : null}
        {badge ? <div className="mt-1">{badge}</div> : null}
      </div>
      <span className="shrink-0 text-right text-[15px] font-semibold text-cx-ink">{formatNaira(amount)}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

/* ─── Main Page ─── */
export default function AdminRevenuePage() {
  const pushToast = useToast();
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activePreset, setActivePreset] = useState("all_time");

  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Reconcile Customer Payment Modal state
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileQuery, setReconcileQuery] = useState("");
  const [reconcileAmount, setReconcileAmount] = useState("");
  const [reconcileNotes, setReconcileNotes] = useState("");
  const [reconcileForce, setReconcileForce] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [reconcileError, setReconcileError] = useState(null);

  // Service Net Profits state
  const [serviceProfits, setServiceProfits] = useState([]);
  const [profitInputs, setProfitInputs] = useState({});
  const [profitsLoading, setProfitsLoading] = useState(true);
  const [isSavingProfits, setIsSavingProfits] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [settingsCategoryTab, setSettingsCategoryTab] = useState("all");

  // Service profit edit sheet
  const [editingService, setEditingService] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState(null);

  const overviewSeqRef = useRef(0);
  const txnSeqRef = useRef(0);

  const effectiveToDate = toDate ? `${toDate}T23:59:59.999` : undefined;

  const loadOverview = async (targetFrom = fromDate, targetTo = effectiveToDate) => {
    setStatsLoading(true);
    const seq = ++overviewSeqRef.current;
    try {
      const res = await adminGetMetricsOverview({
        from_date: targetFrom || undefined,
        to_date: targetTo,
      });
      if (seq === overviewSeqRef.current) {
        if (res.data) {
          setOverview(res.data);
          setErrorMessage(null);
        } else if (res.error) {
          console.warn("[Admin Revenue] Overview error:", res.error);
          setErrorMessage(res.error);
        }
      }
    } catch (err) {
      if (seq === overviewSeqRef.current) {
        setErrorMessage(err.message || "Failed to load revenue overview");
      }
    } finally {
      if (seq === overviewSeqRef.current) {
        setStatsLoading(false);
      }
    }
  };

  const loadTransactions = async (
    targetPage = page,
    targetFrom = fromDate,
    targetTo = effectiveToDate,
    targetSearch = debouncedSearch,
  ) => {
    setTableLoading(true);
    const seq = ++txnSeqRef.current;
    try {
      const res = await adminGetRevenueTransactions({
        page: targetPage,
        page_size: pageSize,
        status: statusFilter || undefined,
        application_type: typeFilter || undefined,
        from_date: targetFrom || undefined,
        to_date: targetTo,
        search: targetSearch || undefined,
      });
      if (seq === txnSeqRef.current) {
        if (res.data) {
          setItems(res.data.items || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.total_pages || 1);
          setErrorMessage(null);
        } else if (res.error) {
          console.warn("[Admin Revenue] Transactions error:", res.error);
          if (!overview) {
            setErrorMessage(res.error);
          }
        }
      }
    } catch (err) {
      if (seq === txnSeqRef.current) {
        console.error("[Admin Revenue] Transactions error:", err);
      }
    } finally {
      if (seq === txnSeqRef.current) {
        setTableLoading(false);
      }
    }
  };

  const loadServiceProfits = async () => {
    setProfitsLoading(true);
    try {
      const res = await adminGetServiceProfits();
      if (res.data?.items) {
        setServiceProfits(res.data.items);
        const inputs = {};
        res.data.items.forEach((item) => {
          inputs[item.service_key] = item.net_profit_kobo ? (item.net_profit_kobo / 100).toString() : "0";
        });
        setProfitInputs(inputs);
      }
    } catch (err) {
      console.error("[Admin Revenue] Failed to load service net profits:", err);
    } finally {
      setProfitsLoading(false);
    }
  };

  useEffect(() => {
    loadServiceProfits();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    loadOverview(fromDate, effectiveToDate);
    loadTransactions(1, fromDate, effectiveToDate, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, fromDate, toDate, debouncedSearch]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadTransactions(page, fromDate, effectiveToDate, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    const [from, to] = preset.range();
    setFromDate(from ? toDateInputValue(from) : "");
    setToDate(to ? toDateInputValue(to) : "");
  };

  const handleFromDateChange = (val) => {
    setFromDate(val);
    setActivePreset("custom");
  };

  const handleToDateChange = (val) => {
    setToDate(val);
    setActivePreset("custom");
  };

  const handleClear = () => {
    setActivePreset("all_time");
    setFromDate("");
    setToDate("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadOverview(fromDate, effectiveToDate),
      loadTransactions(page, fromDate, effectiveToDate, debouncedSearch),
      loadServiceProfits(),
    ]);
    setRefreshing(false);
  };

  const openReconcile = () => {
    setShowReconcileModal(true);
    setReconcileResult(null);
    setReconcileError(null);
  };

  const reconcileAmountError = moneyError(reconcileAmount);

  const handleReconcileSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!reconcileQuery.trim()) return;
    if (reconcileAmountError) return;
    setIsReconciling(true);
    setReconcileResult(null);
    setReconcileError(null);
    try {
      const amountKobo = reconcileAmount ? toKobo(reconcileAmount) : null;
      const res = await adminReconcileCustomerPayment({
        query: reconcileQuery.trim(),
        amount_kobo: amountKobo,
        notes: reconcileNotes.trim() || undefined,
        force_credit: reconcileForce,
      });
      if (res.data) {
        setReconcileResult(res.data);
        await Promise.all([
          loadOverview(fromDate, effectiveToDate),
          loadTransactions(1, fromDate, effectiveToDate, debouncedSearch),
        ]);
      } else if (res.error) {
        setReconcileError(res.error);
      }
    } catch (err) {
      setReconcileError(err.message || "Failed to reconcile payment");
    } finally {
      setIsReconciling(false);
    }
  };

  // Saves every service's net profit in one call (same payload shape as before).
  // `inputs` lets the edit sheet pass the edited map without waiting for state.
  const handleSaveServiceProfits = async (inputs = profitInputs) => {
    setIsSavingProfits(true);
    try {
      const payload = Object.entries(inputs).map(([service_key, val]) => ({
        service_key,
        net_profit_kobo: Math.round((parseFloat(val) || 0) * 100),
      }));

      const res = await adminUpdateServiceProfits(payload);
      if (res.data?.items) {
        setServiceProfits(res.data.items);
        const nextInputs = {};
        res.data.items.forEach((item) => {
          nextInputs[item.service_key] = item.net_profit_kobo ? (item.net_profit_kobo / 100).toString() : "0";
        });
        setProfitInputs(nextInputs);
        pushToast({ tone: "success", title: "Profit saved", body: "Revenue figures now use the new amount." });

        // Instantly recalculate revenue overview & transactions with newly saved net profits
        await Promise.all([
          loadOverview(fromDate, effectiveToDate),
          loadTransactions(page, fromDate, effectiveToDate),
        ]);
        return { ok: true };
      } else if (res.error) {
        setErrorMessage(res.error);
        return { ok: false, error: res.error };
      }
      return { ok: false, error: "Couldn't save. Try again." };
    } catch (err) {
      const msg = err.message || "Failed to save service net profits";
      setErrorMessage(msg);
      return { ok: false, error: msg };
    } finally {
      setIsSavingProfits(false);
    }
  };

  const openProfitEdit = (service) => {
    setEditingService(service);
    setEditValue(profitInputs[service.service_key] ?? toNaira(service.net_profit_kobo || 0));
    setEditError(null);
  };

  const saveProfitEdit = async () => {
    const err = moneyError(editValue, { required: true });
    if (err) {
      setEditError(err);
      return;
    }
    const kobo = toKobo(editValue);
    const next = { ...profitInputs, [editingService.service_key]: String(kobo / 100) };
    const res = await handleSaveServiceProfits(next);
    if (res.ok) setEditingService(null);
    else setEditError(typeof res.error === "string" ? res.error : "Couldn't save. Try again.");
  };

  const hasFeeBreakdown = !!overview?.total_monnify_fees_kobo;
  const stats = [
    {
      label: "Total inflow",
      value: overview ? formatNaira(overview.gross_payments_kobo) : "—",
      sub: hasFeeBreakdown ? "Net of Monnify fees" : "Net settled in Monnify wallet",
      icon: TrendingUp,
      tone: "neutral",
    },
    {
      label: "Platform net profit",
      value: overview ? formatNaira(overview.net_profit_kobo || 0) : "—",
      sub: "Kept by Vehiculars",
      icon: Landmark,
      tone: "brand",
    },
    {
      label: "Government payment",
      value: overview ? formatNaira(overview.government_payment_kobo || 0) : "—",
      sub: "Statutory remittance pool",
      icon: Building,
      tone: "neutral",
    },
    {
      label: "Agent service fees",
      value: overview ? formatNaira(overview.agent_service_fees_kobo) : "—",
      sub: overview ? `${formatNaira(overview.agent_payables_paid_kobo)} paid out` : "—",
      icon: Users,
      tone: "neutral",
    },
  ];

  const filteredServices = serviceProfits.filter((s) => {
    if (settingsCategoryTab === "all") return true;
    return s.category === settingsCategoryTab;
  });

  const categoryTabs = [
    { id: "all", label: "All services", count: serviceProfits.length },
    ...Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => ({
      id: catKey,
      label: meta.label,
      count: serviceProfits.filter((s) => s.category === catKey).length,
    })),
  ];

  const columns = [
    {
      key: "applicant",
      header: "Applicant",
      primary: true,
      render: (tx) => (
        <div className="min-w-0">
          <p className="font-semibold text-cx-ink">{tx.applicant_name}</p>
          <p className="text-[13px] font-normal text-cx-muted">
            {tx.application_id ? `App #${tx.application_id}` : tx.application_type === "wallet_deposit" ? "Wallet deposit" : "—"}
            {" · "}
            <span className="capitalize">{tx.application_type ? tx.application_type.replace(/_/g, " ") : "—"}</span>
          </p>
          <p className="text-[13px] font-normal text-cx-muted">
            {tx.validity_period || (tx.application_type === "wallet_deposit" ? "Direct inflow" : "")}
          </p>
          <p className="break-all font-mono text-[13px] font-normal text-cx-muted">{tx.reference}</p>
        </div>
      ),
    },
    {
      key: "paid",
      header: "Amount paid",
      render: (tx) => {
        const grossPaid = tx.amount_paid_kobo > 0 ? tx.amount_paid_kobo : tx.amount_kobo;
        const feeKobo = tx.monnify_fee_kobo || 0;
        const isPartial = tx.status === "partial" || (tx.amount_paid_kobo > 0 && tx.amount_paid_kobo < tx.amount_kobo);
        return (
          <div>
            <p className="font-semibold text-cx-ink">{formatNaira(grossPaid)}</p>
            {isPartial ? <p className="text-[13px] text-cx-amber">of {formatNaira(tx.amount_kobo)} (partial)</p> : null}
            <p className="text-[13px] text-cx-muted">Fee {feeKobo > 0 ? `−${formatNaira(feeKobo)}` : formatNaira(0)}</p>
          </div>
        );
      },
    },
    {
      key: "net_inflow",
      header: "Net inflow",
      render: (tx) => {
        const grossPaid = tx.amount_paid_kobo > 0 ? tx.amount_paid_kobo : tx.amount_kobo;
        const feeKobo = tx.monnify_fee_kobo || 0;
        const netInflow = tx.net_amount_kobo != null ? tx.net_amount_kobo : Math.max(0, grossPaid - feeKobo);
        return <span className="font-semibold text-cx-ink">{formatNaira(netInflow)}</span>;
      },
    },
    {
      key: "net_profit",
      header: "Net profit",
      render: (tx) =>
        tx.net_profit_kobo != null ? <span className="font-semibold text-cx-brand-deep">{formatNaira(tx.net_profit_kobo)}</span> : <span className="text-cx-muted">—</span>,
    },
    {
      key: "gov",
      header: "Government",
      render: (tx) => (tx.government_payment_kobo != null ? formatNaira(tx.government_payment_kobo) : <span className="text-cx-muted">—</span>),
    },
    {
      key: "agent_fee",
      header: "Agent fee",
      render: (tx) => (
        <div className="min-w-0">
          <p>{tx.service_fee_kobo != null ? formatNaira(tx.service_fee_kobo) : <span className="text-cx-muted">—</span>}</p>
          {tx.agent_name ? <p className="truncate text-[13px] text-cx-muted">{tx.agent_name}</p> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Payment / transfer",
      render: (tx) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={tx.status} />
          <StatusBadge status={tx.agent_transfer_status} fallback="No transfer" />
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (tx) => <span className="text-[13px] text-cx-muted">{formatDate(tx.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Revenue"
        description="Total inflow, platform net profit, government remittance, agent payouts and profit per service."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh} loading={refreshing} disabled={refreshing || statsLoading || tableLoading}>
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="soft" icon={BadgeCheck} onClick={openReconcile}>
          Reconcile a payment
        </Button>
        <Button
          variant={showSettingsPanel ? "primary" : "secondary"}
          icon={Sliders}
          onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          aria-expanded={showSettingsPanel}
        >
          {showSettingsPanel ? "Hide profit per service" : "Set profit per service"}
        </Button>
      </div>

      {errorMessage ? (
        <Notice
          tone="amber"
          title="Some figures didn't load"
          action={
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh}>
              Try again
            </Button>
          }
        >
          {String(errorMessage)}
        </Notice>
      ) : null}

      {/* ─── Service net profit settings ─── */}
      {showSettingsPanel ? (
        <section>
          <SectionTitle
            title="Profit per service"
            description="What Vehiculars keeps from each service. The rest of the platform profit goes to the government payment."
          />
          <Tabs tabs={categoryTabs} value={settingsCategoryTab} onChange={setSettingsCategoryTab} label="Service category" className="mb-3" />
          {profitsLoading ? (
            <SkeletonList rows={3} />
          ) : filteredServices.length === 0 ? (
            <p className="rounded-cx-lg border border-dashed border-cx-line-strong bg-cx-surface px-4 py-8 text-center text-sm text-cx-muted">
              No services in this category.
            </p>
          ) : (
            <Card padded={false}>
              <ul className="divide-y divide-cx-line/70">
                {filteredServices.map((service) => {
                  const meta = CATEGORY_METADATA[service.category] || { label: service.category, badge: service.category };
                  return (
                    <li key={service.service_key}>
                      <ProfitLine
                        label={service.service_name}
                        hint={service.service_key}
                        amount={service.net_profit_kobo ?? 0}
                        badge={<Badge>{meta.badge}</Badge>}
                        onClick={() => openProfitEdit(service)}
                      />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      ) : null}

      {/* ─── Date range ─── */}
      <Card>
        <p className="mb-2 text-[13px] text-cx-muted">Date range</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {DATE_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => applyPreset(preset)}
                className={cx(
                  "cx-focus min-h-11 rounded-cx px-4 text-[15px] font-medium transition-colors",
                  isActive ? "bg-cx-brand text-white" : "border border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <Field label="From" className="min-w-0 sm:w-48">
            {(p) => <Input {...p} type="date" value={fromDate} max={toDate || undefined} onChange={(e) => handleFromDateChange(e.target.value)} />}
          </Field>
          <Field label="To" className="min-w-0 sm:w-48">
            {(p) => <Input {...p} type="date" value={toDate} min={fromDate || undefined} onChange={(e) => handleToDateChange(e.target.value)} />}
          </Field>
          {fromDate || toDate ? (
            <Button variant="ghost" onClick={handleClear} className="col-span-2 sm:col-span-1">
              Clear dates
            </Button>
          ) : null}
        </div>
      </Card>

      {/* ─── Stats ─── */}
      <div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={statsLoading ? "…" : stat.value} hint={statsLoading ? "Loading" : stat.sub} icon={stat.icon} tone={stat.tone} />
          ))}
        </div>
        {!statsLoading && hasFeeBreakdown ? (
          <p className="mt-2 text-[13px] text-cx-muted">
            {formatNaira(overview.gross_collected_kobo)} collected, less {formatNaira(overview.total_monnify_fees_kobo)} Monnify fees
            {overview.wallet_deposits_kobo ? `. Includes ${formatNaira(overview.wallet_deposits_kobo)} in wallet deposits.` : "."}
          </p>
        ) : null}
      </div>

      {/* ─── Transactions ─── */}
      <section>
        <SectionTitle title={`Transactions (${total})`} />
        <Toolbar search={searchTerm} onSearch={setSearchTerm} placeholder="Search email, reference or applicant">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Payment status" className="md:w-60">
            <option value="">Successful only (revenue)</option>
            <option value="all">All statuses (incl. pending/failed)</option>
            <option value="success">Success (full payment)</option>
            <option value="partial">Partial payment</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Type" className="md:w-56">
            <option value="">All types</option>
            <option value="wallet_deposit">Wallet deposits</option>
            <option value="fresh">Fresh DL</option>
            <option value="renewal">Renewal DL</option>
            <option value="reissue">Reissue DL</option>
            <option value="number_plate_new">New plate</option>
            <option value="vehicle_particulars">Vehicle particulars</option>
            <option value="roadworthiness_express">Roadworthiness express</option>
            <option value="physical_condition_inspection">Physical condition inspection</option>
          </Select>
        </Toolbar>

        {tableLoading ? (
          <SkeletonList rows={4} />
        ) : (
          <ResponsiveTable columns={columns} rows={items} rowKey={(tx) => tx.payment_id || tx.reference} empty="No transactions match these filters." />
        )}

        {!tableLoading && items.length > 0 ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-cx-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" icon={ChevronLeft} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Prev
              </Button>
              <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {/* ─── Edit one service's net profit ─── */}
      <Sheet
        open={!!editingService}
        onOpenChange={(o) => !o && !isSavingProfits && setEditingService(null)}
        title={editingService?.service_name || "Net profit"}
        description="How much Vehiculars keeps from each payment for this service."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingService(null)} disabled={isSavingProfits}>
              Cancel
            </Button>
            <Button block loading={isSavingProfits} onClick={saveProfitEdit}>
              Save
            </Button>
          </>
        }
      >
        <Field label="Net profit" error={editError} hint="Saved for every service at once, then revenue figures refresh.">
          {(p) => (
            <MoneyInput
              {...p}
              value={editValue}
              onChange={(v) => {
                setEditValue(v);
                setEditError(null);
              }}
              placeholder="0"
              invalid={!!editError}
            />
          )}
        </Field>
      </Sheet>

      {/* ─── Payment reconciliation ─── */}
      <Sheet
        open={showReconcileModal}
        onOpenChange={(o) => !isReconciling && setShowReconcileModal(o)}
        title="Reconcile a customer payment"
        description="Look a payment up on Monnify, or record one that's missing."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReconcileModal(false)} disabled={isReconciling}>
              Close
            </Button>
            <Button
              block
              type="submit"
              form="reconcile-payment-form"
              icon={BadgeCheck}
              loading={isReconciling}
              disabled={!reconcileQuery.trim() || !!reconcileAmountError}
            >
              Reconcile payment
            </Button>
          </>
        }
      >
        <form id="reconcile-payment-form" onSubmit={handleReconcileSubmit} className="space-y-4">
          {reconcileResult ? (
            <Notice tone="brand" icon={CheckCircle2} title={reconcileResult.message}>
              <dl className="divide-y divide-cx-line/60">
                {reconcileResult.application_id ? <DetailRow label="Application" value={`#${reconcileResult.application_id}`} /> : null}
                {reconcileResult.amount_kobo ? <DetailRow label="Amount" value={formatNaira(reconcileResult.amount_kobo)} /> : null}
                {reconcileResult.customer_email ? <DetailRow label="Customer" value={reconcileResult.customer_email} /> : null}
                {reconcileResult.reference ? <DetailRow label="Reference" value={<span className="break-all font-mono">{reconcileResult.reference}</span>} /> : null}
              </dl>
            </Notice>
          ) : null}

          {reconcileError ? (
            <Notice tone="red" title="Couldn't reconcile">
              {String(reconcileError)}
            </Notice>
          ) : null}

          <Field label="Customer email or payment reference" required hint="Any Monnify or Vehiculars reference works. We'll search Monnify and link it to the application.">
            {(p) => (
              <Input
                {...p}
                required
                placeholder="e.g. name@email.com, MNFY|… or vhc_ref_…"
                value={reconcileQuery}
                onChange={(e) => setReconcileQuery(e.target.value)}
              />
            )}
          </Field>

          <Field label="Amount" optional error={reconcileAmountError} hint="Leave empty to use the Monnify or application amount.">
            {(p) => <MoneyInput {...p} value={reconcileAmount} onChange={setReconcileAmount} placeholder="0" invalid={!!reconcileAmountError} />}
          </Field>

          <Field label="Internal notes" optional>
            {(p) => (
              <Input {...p} placeholder="e.g. Verified customer support query" value={reconcileNotes} onChange={(e) => setReconcileNotes(e.target.value)} />
            )}
          </Field>

          <Switch
            checked={reconcileForce}
            onChange={setReconcileForce}
            label="Force credit (manual settlement)"
            description="Turn on if you confirmed the payment on the Monnify dashboard or bank account and want to credit the application now, without an automated check."
          />
        </form>
      </Sheet>
    </div>
  );
}
