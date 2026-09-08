"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  TrendingUp,
  Landmark,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarRange,
  AlertCircle,
  Sliders,
  CheckCircle2,
  Save,
  ShieldCheck,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  adminGetMetricsOverview,
  adminGetRevenueTransactions,
  adminGetServiceProfits,
  adminUpdateServiceProfits,
  koboToNaira,
} from "@/lib/api";

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
  { id: "this_week", label: "This Week", range: () => [startOfWeek(new Date()), new Date()] },
  { id: "this_month", label: "This Month", range: () => [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] },
  { id: "all_time", label: "All Time", range: () => [null, null] },
];

const PAYMENT_STATUS_STYLES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const CATEGORY_METADATA = {
  driver_licence: { label: "Driver's Licence", badge: "DL Family" },
  number_plate: { label: "Number Plates", badge: "Plates" },
  vehicle_particulars: { label: "Vehicle Particulars", badge: "Particulars" },
  inspection_verification: { label: "Inspections & Verifications", badge: "Inspections" },
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

function EmptyState({ message }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Landmark className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-[14px] text-slate-500 font-medium">{message}</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminRevenuePage() {
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

  // Service Net Profits state
  const [serviceProfits, setServiceProfits] = useState([]);
  const [profitInputs, setProfitInputs] = useState({});
  const [profitsLoading, setProfitsLoading] = useState(true);
  const [isSavingProfits, setIsSavingProfits] = useState(false);
  const [profitsSaveSuccess, setProfitsSaveSuccess] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [settingsCategoryTab, setSettingsCategoryTab] = useState("all");

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

  const loadTransactions = async (targetPage = page, targetFrom = fromDate, targetTo = effectiveToDate) => {
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
    setPage(1);
    loadOverview(fromDate, effectiveToDate);
    loadTransactions(1, fromDate, effectiveToDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, fromDate, toDate]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadTransactions(page, fromDate, effectiveToDate);
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
      loadTransactions(page, fromDate, effectiveToDate),
      loadServiceProfits(),
    ]);
    setRefreshing(false);
  };

  const handleProfitInputChange = (serviceKey, value) => {
    // Only permit digits
    const cleaned = value.replace(/[^0-9]/g, "");
    setProfitInputs((prev) => ({
      ...prev,
      [serviceKey]: cleaned,
    }));
  };

  const handleSaveServiceProfits = async () => {
    setIsSavingProfits(true);
    setProfitsSaveSuccess(false);
    try {
      const payload = Object.entries(profitInputs).map(([service_key, val]) => ({
        service_key,
        net_profit_kobo: Math.round((parseFloat(val) || 0) * 100),
      }));

      const res = await adminUpdateServiceProfits(payload);
      if (res.data?.items) {
        setServiceProfits(res.data.items);
        const inputs = {};
        res.data.items.forEach((item) => {
          inputs[item.service_key] = item.net_profit_kobo ? (item.net_profit_kobo / 100).toString() : "0";
        });
        setProfitInputs(inputs);
        setProfitsSaveSuccess(true);
        setTimeout(() => setProfitsSaveSuccess(false), 4000);

        // Instantly recalculate revenue overview & transactions with newly saved net profits
        await Promise.all([
          loadOverview(fromDate, effectiveToDate),
          loadTransactions(page, fromDate, effectiveToDate),
        ]);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to save service net profits");
    } finally {
      setIsSavingProfits(false);
    }
  };

  const stats = [
    {
      label: "Total Inflow",
      value: overview ? koboToNaira(overview.gross_payments_kobo) : "—",
      sub: "Gross successful payments",
      icon: TrendingUp,
      accent: "text-slate-900",
    },
    {
      label: "Platform Net Profit",
      value: overview ? koboToNaira(overview.net_profit_kobo || 0) : "—",
      sub: "Vehiculars retained profit",
      icon: Landmark,
      accent: "text-emerald-600",
    },
    {
      label: "Government Payment",
      value: overview ? koboToNaira(overview.government_payment_kobo || 0) : "—",
      sub: "Statutory remittance pool",
      icon: Building,
      accent: "text-blue-600",
    },
    {
      label: "Agent Service Fees",
      value: overview ? koboToNaira(overview.agent_service_fees_kobo) : "—",
      sub: overview ? `${koboToNaira(overview.agent_payables_paid_kobo)} disbursed` : "—",
      icon: Users,
      accent: "text-slate-700",
    },
  ];

  const filteredServices = serviceProfits.filter((s) => {
    if (settingsCategoryTab === "all") return true;
    return s.category === settingsCategoryTab;
  });

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Revenue & Platform Net Profit</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Total inflow, platform net profit, government remittance, agent payouts, and service-level profit settings.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold border transition-all shadow-xs ${
              showSettingsPanel
                ? "bg-[#28A745] text-white border-[#28A745]"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Set Profit per Service</span>
            {showSettingsPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || statsLoading || tableLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing || statsLoading ? "animate-spin" : ""} text-slate-500`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ─── Error Banner ─── */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-[13px] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-[12px] font-semibold text-amber-900 underline hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Service Net Profit Settings Panel (Collapsible) ─── */}
      {showSettingsPanel && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-5 sm:p-6 transition-all space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[12px]">
                  ₦
                </span>
                <h2 className="text-[16px] font-bold text-slate-900">Platform Net Profit Settings</h2>
              </div>
              <p className="text-[12.5px] text-slate-500 mt-1">
                Define the net profit amount kept by Vehiculars per service. The remainder of the platform profit is allocated to statutory government payment.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profitsSaveSuccess && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Saved & Applied!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveServiceProfits}
                disabled={isSavingProfits || profitsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[#28A745] hover:bg-[#218838] text-white shadow-sm disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSavingProfits ? "Saving Changes..." : "Save Profit Settings"}
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSettingsCategoryTab("all")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                settingsCategoryTab === "all"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              All Services ({serviceProfits.length})
            </button>
            {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
              const count = serviceProfits.filter((s) => s.category === catKey).length;
              const isActive = settingsCategoryTab === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSettingsCategoryTab(catKey)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {meta.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Service Profits Grid */}
          {profitsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
              <p className="text-[13px] text-slate-500">Loading service profit configurations...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredServices.map((service) => {
                const meta = CATEGORY_METADATA[service.category] || { label: service.category, badge: service.category };
                const currentVal = profitInputs[service.service_key] ?? "0";
                return (
                  <div
                    key={service.service_key}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50/50 hover:bg-white transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900 leading-snug">{service.service_name}</p>
                        <span className="font-mono text-[11px] text-slate-400">{service.service_key}</span>
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-200 text-slate-700 whitespace-nowrap">
                        {meta.badge}
                      </span>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Net Profit (₦)
                      </label>
                      <div className="relative rounded-lg shadow-xs">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-slate-400 font-bold text-[13px]">₦</span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={currentVal === "" ? "" : Number(currentVal).toLocaleString()}
                          onChange={(e) => handleProfitInputChange(service.service_key, e.target.value)}
                          placeholder="0"
                          className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[13px] font-semibold text-slate-900 placeholder:text-slate-300 focus:border-[#28A745] focus:outline-none focus:ring-1 focus:ring-[#28A745]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Date Range ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <CalendarRange className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Date Range</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  isActive
                    ? "bg-[#28A745] text-white border border-[#28A745] shadow-xs font-semibold"
                    : "border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
          />
          <span className="text-[12px] text-slate-400">to</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── Stats Row (4 Metrics) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              {statsLoading ? (
                <div className="mt-2 space-y-2 py-0.5">
                  <div className="h-6 w-32 bg-slate-100 animate-pulse rounded-md" />
                  <div className="h-3.5 w-24 bg-slate-50 animate-pulse rounded-md" />
                </div>
              ) : (
                <>
                  <p className={`text-[23px] font-bold mt-1.5 leading-none ${stat.accent}`}>{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5">{stat.sub}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Transaction Log ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
          <p className="text-[13px] font-semibold text-slate-700">
            Transactions <span className="text-slate-400 font-normal">({total})</span>
          </p>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-[12.5px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]"
            >
              <option value="">All types</option>
              <option value="fresh">Fresh DL</option>
              <option value="renewal">Renewal DL</option>
              <option value="reissue">Reissue DL</option>
              <option value="number_plate_new">New Plate</option>
              <option value="vehicle_particulars">Vehicle Particulars</option>
              <option value="roadworthiness_express">Roadworthiness Express</option>
              <option value="physical_condition_inspection">Physical Condition Inspection</option>
            </select>
          </div>
        </div>

        {tableLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 text-[#28A745] animate-spin" />
            <p className="text-[13px] text-slate-500 font-medium">Computing transactions for selected date range&hellip;</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="No transactions match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-5 font-semibold">Applicant</th>
                  <th className="py-3 px-5 font-semibold">Type</th>
                  <th className="py-3 px-5 font-semibold">Reference</th>
                  <th className="py-3 px-5 font-semibold">Total Paid</th>
                  <th className="py-3 px-5 font-semibold text-emerald-700">Net Profit</th>
                  <th className="py-3 px-5 font-semibold text-blue-700">Gov Payment</th>
                  <th className="py-3 px-5 font-semibold">Agent Fee</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold">Transfer</th>
                  <th className="py-3 px-5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr key={tx.payment_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold text-slate-900">{tx.applicant_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">App #{tx.application_id}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-[12.5px] text-slate-700 capitalize">{tx.application_type}</p>
                      <p className="text-[11px] text-slate-400">{tx.validity_period || "—"}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11.5px] text-slate-500">{tx.reference}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold text-slate-900">{koboToNaira(tx.amount_kobo)}</p>
                      {tx.amount_paid_kobo < tx.amount_kobo && (
                        <p className="text-[11px] text-amber-600">{koboToNaira(tx.amount_paid_kobo)} paid so far</p>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[13px] font-semibold text-emerald-700">{koboToNaira(tx.net_profit_kobo || 0)}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[13px] font-semibold text-blue-700">{koboToNaira(tx.government_payment_kobo || 0)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-[12.5px] text-slate-700">
                      {koboToNaira(tx.service_fee_kobo)}
                      {tx.agent_name && <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{tx.agent_name}</p>}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={tx.agent_transfer_status} fallback="No transfer" />
                    </td>
                    <td className="py-3.5 px-5 text-[12px] text-slate-500 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ─── */}
        {!tableLoading && items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <p className="text-[12px] text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
