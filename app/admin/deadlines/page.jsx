"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
  Sliders,
  Timer,
  ChevronRight,
  Pencil,
  X,
  Save,
  RotateCcw,
  Info,
  Globe2,
  Copy,
  MapPin,
  Sparkles,
  ArrowRight,
  Layers,
} from "lucide-react";
import {
  adminGetDeadlines,
  adminUpdateDeadline,
  adminCreateOrOverrideDeadline,
  adminDeleteDeadlineOverride,
  adminCloneDeadlines,
  adminApplyDeadlinesToAll,
  adminResetDeadlines,
  getReferenceStates,
} from "@/lib/api";
import FastTrackSLACard from "./FastTrackSLACard";

const BRAND = "#28A745";

export default function AdminDeadlinesPage() {
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(""); // "" = General (All States)
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toast, setToast] = useState(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    expected_days: 5,
    day_type: "business_days",
    warning_threshold_percent: 75,
    is_active: true,
    description: "",
    apply_to_all_states: false,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Clone Modal State
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneSourceStateId, setCloneSourceStateId] = useState("");
  const [cloneTargetStateId, setCloneTargetStateId] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState(null);

  // Apply to All States Modal State
  const [applyAllOpen, setApplyAllOpen] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);

  // Reverting item id tracking
  const [revertingId, setRevertingId] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Reference States on mount
  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setStates(res.data);
      }
    });
  }, []);

  const loadData = async (stateId = selectedStateId, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const param = stateId ? parseInt(stateId, 10) : undefined;
    const res = await adminGetDeadlines({ state_id: param });

    if (res?.data?.items) {
      setDeadlines(res.data.items);
    } else if (res?.error) {
      showToast("error", res.error.detail || "Failed to load service deadlines.");
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Trigger load when selectedStateId changes
  useEffect(() => {
    loadData(selectedStateId);
  }, [selectedStateId]);

  const selectedStateName = useMemo(() => {
    if (!selectedStateId) return null;
    const match = states.find((s) => String(s.id) === String(selectedStateId));
    return match ? match.name : `State #${selectedStateId}`;
  }, [selectedStateId, states]);

  const categories = useMemo(() => {
    const cats = new Set(deadlines.map((d) => d.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [deadlines]);

  const filteredDeadlines = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return deadlines.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchQuery =
        !q ||
        item.service_name.toLowerCase().includes(q) ||
        item.service_key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [deadlines, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = deadlines.length;
    const businessDaysCount = deadlines.filter((d) => d.day_type === "business_days").length;
    const calendarDaysCount = deadlines.filter((d) => d.day_type === "calendar_days").length;
    const activeCount = deadlines.filter((d) => d.is_active).length;
    const overrideCount = deadlines.filter((d) => d.is_override).length;
    const inheritedCount = total - overrideCount;
    return {
      total,
      businessDaysCount,
      calendarDaysCount,
      activeCount,
      overrideCount,
      inheritedCount,
    };
  }, [deadlines]);

  // Edit Modal Handlers
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      expected_days: item.expected_days,
      day_type: item.day_type,
      warning_threshold_percent: item.warning_threshold_percent || 75,
      is_active: item.is_active,
      description: item.description || "",
      apply_to_all_states: false,
    });
    setEditError(null);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingItem(null);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const days = parseInt(editForm.expected_days, 10);
    if (isNaN(days) || days < 1) {
      setEditError("Please enter a valid expected turnaround days (at least 1 day).");
      return;
    }
    const warn = parseInt(editForm.warning_threshold_percent, 10);
    if (isNaN(warn) || warn < 10 || warn > 99) {
      setEditError("Warning threshold must be between 10% and 99%.");
      return;
    }

    setSaving(true);
    setEditError(null);

    let res;
    if (!selectedStateId) {
      // General baseline
      res = await adminUpdateDeadline(editingItem.id, {
        expected_days: days,
        day_type: editForm.day_type,
        warning_threshold_percent: warn,
        is_active: editForm.is_active,
        description: editForm.description,
        apply_to_all_states: editForm.apply_to_all_states,
      });
    } else {
      // State override
      res = await adminCreateOrOverrideDeadline({
        service_key: editingItem.service_key,
        state_id: parseInt(selectedStateId, 10),
        expected_days: days,
        day_type: editForm.day_type,
        warning_threshold_percent: warn,
        is_active: editForm.is_active,
        description: editForm.description,
      });
    }

    setSaving(false);
    if (res?.error) {
      setEditError(res.error.detail || "Failed to update deadline.");
    } else {
      const scopeLabel = selectedStateName ? `${selectedStateName} State` : "General (All States)";
      showToast("success", `Updated deadline for ${editingItem.service_name} (${scopeLabel})`);
      closeEditModal();
      loadData(selectedStateId);
    }
  };

  // Revert State Override Handler
  const handleRevertOverride = async (item) => {
    if (
      !confirm(
        `Revert ${item.service_name} in ${selectedStateName} back to the General SLA baseline? This state will now inherit the federation default.`
      )
    ) {
      return;
    }
    setRevertingId(item.id);
    const res = await adminDeleteDeadlineOverride(item.id);
    setRevertingId(null);
    if (res?.error) {
      showToast("error", res.error.detail || "Failed to revert state override.");
    } else {
      showToast("success", `Reverted ${item.service_name} in ${selectedStateName} to General baseline.`);
      loadData(selectedStateId);
    }
  };

  // Clone Modal Handlers
  const openCloneModal = () => {
    setCloneSourceStateId(selectedStateId || "");
    setCloneTargetStateId(selectedStateId ? "" : states[0]?.id ? String(states[0].id) : "");
    setCloneError(null);
    setCloneOpen(true);
  };

  const closeCloneModal = () => {
    if (cloning) return;
    setCloneOpen(false);
    setCloneError(null);
  };

  const handleCloneDeadlines = async () => {
    if (!cloneTargetStateId) {
      setCloneError("Please select a target Nigerian state.");
      return;
    }
    if ((cloneSourceStateId || null) === (cloneTargetStateId || null)) {
      setCloneError("Source and target state cannot be the same.");
      return;
    }

    setCloning(true);
    setCloneError(null);

    const res = await adminCloneDeadlines({
      source_state_id: cloneSourceStateId ? parseInt(cloneSourceStateId, 10) : null,
      target_state_id: parseInt(cloneTargetStateId, 10),
    });

    setCloning(false);
    if (res?.error) {
      setCloneError(res.error.detail || "Failed to clone service deadlines.");
    } else {
      const targetState = states.find((s) => String(s.id) === String(cloneTargetStateId));
      showToast(
        "success",
        `Successfully cloned deadlines to ${targetState ? targetState.name : "target"} state!`
      );
      closeCloneModal();
      setSelectedStateId(String(cloneTargetStateId));
    }
  };

  // Apply to All States Handler
  const handleApplyToAllStates = async () => {
    setApplyingAll(true);
    const res = await adminApplyDeadlinesToAll({ reset_overrides: true });
    setApplyingAll(false);
    if (res?.error) {
      showToast("error", res.error.detail || "Failed to apply baseline to all states.");
    } else {
      const cleared = res.data?.cleared_count ?? 0;
      showToast(
        "success",
        `Baseline turnaround times applied to all states. Cleared ${cleared} state override(s).`
      );
      setApplyAllOpen(false);
      loadData(selectedStateId);
    }
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        "Are you sure you want to reset or sync all general service deadlines to platform standard defaults?"
      )
    )
      return;
    setRefreshing(true);
    const res = await adminResetDeadlines();
    setRefreshing(false);
    if (res?.data?.items) {
      setDeadlines(res.data.items);
      showToast("success", "General service deadlines synced to standard defaults.");
    } else {
      showToast("error", "Failed to reset deadlines.");
    }
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl transition-all ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Operations</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#28A745]">SLA & Delivery Timelines</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Service Delivery Deadlines</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure expected delivery durations nationwide or set custom state-by-state turnaround timelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!selectedStateId && (
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              title="Sync general platform defaults"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              Sync Baseline Defaults
            </button>
          )}

          <button
            type="button"
            onClick={() => loadData(selectedStateId, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            href="/admin/countdown"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: BRAND }}
          >
            <Timer className="h-4 w-4" />
            Live Countdown Monitor
          </Link>
        </div>
      </div>

      {/* State Selector Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]">
              {selectedStateId ? <MapPin className="h-5 w-5" /> : <Globe2 className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Turnaround Time Scope
                </span>
                {selectedStateId ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    <Sparkles className="h-3 w-3" /> State Override Scope
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                    <Globe2 className="h-3 w-3" /> Federation Baseline (All States)
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-3">
                <select
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15 transition-all cursor-pointer"
                >
                  <option value="">General (All States) — Baseline for All States</option>
                  <optgroup label="Configure Specific State Override">
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} State {s.code ? `(${s.code})` : ""}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <span className="text-xs text-slate-500 hidden sm:inline">
                  {selectedStateId
                    ? `Showing turnaround times for ${selectedStateName} State`
                    : "Default SLA applied to any state without custom overrides"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Scope Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCloneModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              title="Copy turnaround times from one state or general baseline to another state"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              Clone Deadlines
            </button>

            {!selectedStateId ? (
              <button
                type="button"
                onClick={() => setApplyAllOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
                title="Ensure every state uses the General baseline by removing state-specific overrides"
              >
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                Apply Baseline to All States
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedStateId("")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <Globe2 className="h-3.5 w-3.5 text-slate-500" />
                Back to General Baseline
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Services</span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
              <Sliders className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[11.5px] font-medium text-slate-500">Service catalogue</span>
        </div>

        {selectedStateId ? (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Custom Overrides
                </span>
                <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-950">{stats.overrideCount}</p>
              <span className="text-[11.5px] font-medium text-emerald-700">Specific to {selectedStateName}</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Inherited Baseline
                </span>
                <div className="rounded-lg bg-slate-200 p-1.5 text-slate-700">
                  <Globe2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{stats.inheritedCount}</p>
              <span className="text-[11.5px] font-medium text-slate-500">Uses federation default</span>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Business Days</span>
                <div className="rounded-lg bg-sky-100 p-1.5 text-sky-700">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-sky-950">{stats.businessDaysCount}</p>
              <span className="text-[11.5px] font-medium text-sky-700/80">Skips weekends & holidays</span>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Calendar Days</span>
                <div className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-amber-950">{stats.calendarDaysCount}</p>
              <span className="text-[11.5px] font-medium text-amber-700/80">Consecutive calendar days</span>
            </div>
          </>
        )}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active SLAs</span>
            <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">{stats.activeCount}</p>
          <span className="text-[11.5px] font-medium text-emerald-700/80">Enforcing on applications</span>
        </div>
      </div>

      <FastTrackSLACard stateId={selectedStateId ? parseInt(selectedStateId, 10) : null} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service name or key..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#28A745] focus:ring-2 focus:ring-[#28A745]/15 transition-all"
          />
        </div>
      </div>

      {/* Deadlines Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#28A745]" />
            <p className="mt-2 text-xs font-medium">Loading service deadlines...</p>
          </div>
        ) : filteredDeadlines.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Clock className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No service deadlines found</p>
            <p className="text-xs text-slate-400">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Service Name & Key</th>
                  <th className="py-3.5 px-5">Scope / Origin</th>
                  <th className="py-3.5 px-5">Expected Turnaround</th>
                  <th className="py-3.5 px-5">Day Type</th>
                  <th className="py-3.5 px-5">Warning Threshold</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDeadlines.map((item) => (
                  <tr key={`${item.service_key}-${item.id}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-slate-900">{item.service_name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.service_key}</p>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                    </td>

                    {/* Scope / Origin Badge */}
                    <td className="py-3.5 px-5">
                      {!selectedStateId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          <Globe2 className="h-3 w-3" />
                          Federation Baseline
                        </span>
                      ) : item.is_override ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          Custom ({selectedStateName})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Globe2 className="h-3 w-3 text-slate-400" />
                          Inherits Baseline
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="text-[14px] font-extrabold text-slate-900 font-mono">
                        {item.expected_days}
                      </span>{" "}
                      <span className="text-slate-500 font-medium">days</span>
                    </td>

                    <td className="py-3.5 px-5">
                      {item.day_type === "business_days" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          <Briefcase className="h-3 w-3" />
                          Business Days
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Calendar className="h-3 w-3" />
                          Calendar Days
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-bold text-slate-700">
                        {item.warning_threshold_percent || 75}%
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Warns at {Math.round((item.expected_days * (item.warning_threshold_percent || 75)) / 100)}d
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          {selectedStateId
                            ? item.is_override
                              ? "Edit State SLA"
                              : "Customize State SLA"
                            : "Edit SLA"}
                        </button>

                        {selectedStateId && item.is_override && (
                          <button
                            type="button"
                            onClick={() => handleRevertOverride(item)}
                            disabled={revertingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
                            title="Revert this service to the General baseline"
                          >
                            {revertingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Revert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit SLA Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-slate-900">
                    {selectedStateId ? "Configure State SLA Override" : "Configure Service Deadline"}
                  </h3>
                  {selectedStateId ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
                      {selectedStateName} State
                    </span>
                  ) : (
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[10.5px] font-bold text-sky-800">
                      Federation Baseline
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">{editingItem.service_name}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scope Banner in Modal */}
            <div className="px-6 pt-4">
              {selectedStateId ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold">State-specific Override:</span>
                    <p className="mt-0.5 text-emerald-800 text-[11.5px]">
                      This custom turnaround duration will only apply to applications filed in{" "}
                      <strong>{selectedStateName} State</strong>. Other states will continue using their own configuration or general defaults.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 flex items-start gap-2.5">
                  <Globe2 className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Federation Baseline:</span>
                    <p className="mt-0.5 text-sky-800 text-[11.5px]">
                      This SLA is the nationwide default. Any Nigerian state without a custom override will follow this timeline.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {editError && (
                <div className="rounded-xl p-3 flex items-start gap-2 text-xs bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Expected Turnaround Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Expected Turnaround Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={editForm.expected_days}
                  onChange={(e) => setEditForm((p) => ({ ...p, expected_days: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Target number of days for this service to be completed or delivered.
                </p>
              </div>

              {/* Day Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Day Calculation Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, day_type: "business_days" }))}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      editForm.day_type === "business_days"
                        ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-sky-900">
                      <Briefcase className="h-3.5 w-3.5 text-sky-600" />
                      Business Days
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                      Working days only (Mon–Fri). Skips weekends and Nigerian public holidays.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, day_type: "calendar_days" }))}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      editForm.day_type === "calendar_days"
                        ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      Calendar Days
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                      Normal consecutive days including weekends and public holidays.
                    </p>
                  </button>
                </div>
              </div>

              {/* Warning Threshold */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Warning Threshold (% of SLA Elapsed)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={editForm.warning_threshold_percent}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        warning_threshold_percent: parseInt(e.target.value, 10),
                      }))
                    }
                    className="flex-1 accent-[#28A745] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="shrink-0 w-12 text-center text-xs font-bold font-mono bg-slate-100 py-1.5 px-2 rounded-lg border border-slate-200 text-slate-800">
                    {editForm.warning_threshold_percent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Turns amber / warning when elapsed time reaches {editForm.warning_threshold_percent}% of total SLA.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div>
                  <span className="text-xs font-bold text-slate-800">Enforce this SLA Rule</span>
                  <p className="text-[11px] text-slate-500">
                    Active SLAs are computed on live applications and countdown monitors.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
                />
              </div>

              {/* Apply to All States Immediately (Only in General baseline mode) */}
              {!selectedStateId && (
                <div className="flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-200 p-3">
                  <div>
                    <span className="text-xs font-bold text-amber-950">
                      Apply to all states immediately
                    </span>
                    <p className="text-[11px] text-amber-800">
                      Clears any custom state overrides for this service so all states follow this turnaround time.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.apply_to_all_states}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, apply_to_all_states: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Notes / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Internal Notes / Description (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder={
                    selectedStateId
                      ? `e.g. Turnaround specifically agreed with ${selectedStateName} VIO`
                      : "e.g. Standard national VIO production timeline"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#28A745] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    {selectedStateId ? "Save State Override" : "Save Baseline SLA"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Deadlines Modal */}
      {cloneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#28A745]/10 text-[#28A745]">
                  <Copy className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Clone Service Deadlines</h3>
              </div>
              <button
                type="button"
                onClick={closeCloneModal}
                disabled={cloning}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Copy all turnaround days, day calculation types, and warning thresholds from a source scope to a target Nigerian state.
              </p>

              {cloneError && (
                <div className="rounded-xl p-3 flex items-start gap-2 text-xs bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{cloneError}</span>
                </div>
              )}

              {/* Source Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Clone From (Source Scope)
                </label>
                <select
                  value={cloneSourceStateId}
                  onChange={(e) => setCloneSourceStateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#28A745] focus:bg-white transition-all"
                >
                  <option value="">General (All States) — Baseline</option>
                  <optgroup label="Clone from Existing State">
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} State
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Target State */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Clone To (Target State)
                </label>
                <select
                  value={cloneTargetStateId}
                  onChange={(e) => setCloneTargetStateId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-[#28A745] focus:bg-white transition-all"
                >
                  <option value="">Select target Nigerian state...</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} State
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeCloneModal}
                disabled={cloning}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCloneDeadlines}
                disabled={cloning}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {cloning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Clone Deadlines
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Baseline to All States Modal */}
      {applyAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Apply Baseline to All States</h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyAllOpen(false)}
                disabled={applyingAll}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                This action will reset turnaround times across all Nigerian states so that every state uses the exact same delivery deadlines configured in the General Baseline.
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <strong>What happens:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1 text-amber-800">
                  <li>All state-specific overrides will be removed.</li>
                  <li>All active applications will compute SLAs from the General baseline.</li>
                  <li>You can still create new state-specific overrides anytime in the future.</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApplyAllOpen(false)}
                disabled={applyingAll}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyToAllStates}
                disabled={applyingAll}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all disabled:opacity-50 shadow-sm"
              >
                {applyingAll ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm & Apply to All States
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
