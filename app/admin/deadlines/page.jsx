"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Layers,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Timer,
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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Notice,
  PageHeader,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmSheet, ScopePicker, StatTile, Switch, Tabs, Toolbar } from "../_kit";
import FastTrackSLACard from "./FastTrackSLACard";

const DAY_TYPE_LABEL = {
  business_days: "working days",
  calendar_days: "calendar days",
};

export default function AdminDeadlinesPage() {
  const pushToast = useToast();
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(""); // "" = General (All States)
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [fastTrackOpen, setFastTrackOpen] = useState(false);

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
  const [revertTarget, setRevertTarget] = useState(null);

  // Reset-to-defaults confirmation
  const [resetOpen, setResetOpen] = useState(false);

  const showToast = (type, msg) => {
    pushToast({ tone: type, title: msg });
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
      setEditingItem(null);
      setEditError(null);
      loadData(selectedStateId);
    }
  };

  // Revert State Override Handler (confirmed via ConfirmSheet)
  const handleRevertOverride = async (item) => {
    setRevertingId(item.id);
    const res = await adminDeleteDeadlineOverride(item.id);
    setRevertingId(null);
    setRevertTarget(null);
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
      setCloneOpen(false);
      setCloneError(null);
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

  // Reset general deadlines to platform defaults (confirmed via ConfirmSheet)
  const handleResetDefaults = async () => {
    setRefreshing(true);
    const res = await adminResetDeadlines();
    setRefreshing(false);
    setResetOpen(false);
    if (res?.data?.items) {
      setDeadlines(res.data.items);
      showToast("success", "General service deadlines synced to standard defaults.");
    } else {
      showToast("error", "Failed to reset deadlines.");
    }
  };

  const originBadge = (item) => {
    if (!selectedStateId) return <Badge tone="brand">All states</Badge>;
    if (item.is_override) return <Badge tone="amber">{selectedStateName} only</Badge>;
    return <Badge tone="neutral">From general</Badge>;
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Deadlines"
        description="How long each service should take. Set one deadline for every state, or a different one for a single state."
        actions={
          <>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => loadData(selectedStateId, true)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button href="/admin/countdown" icon={Timer}>
              Live monitor
            </Button>
          </>
        }
      />

      {/* Scope */}
      <Card className="space-y-4">
        <ScopePicker states={states} value={selectedStateId} onChange={setSelectedStateId} label="Deadlines for" />
        <p className="text-sm text-cx-muted">
          {selectedStateId
            ? `Showing deadlines for ${selectedStateName}. Services without their own deadline use the general one.`
            : "The general deadline is used by any state that doesn't have its own."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="secondary" icon={Copy} onClick={openCloneModal}>
            Copy deadlines to a state
          </Button>
          {!selectedStateId ? (
            <>
              <Button variant="secondary" icon={Layers} onClick={() => setApplyAllOpen(true)}>
                Use general deadlines everywhere
              </Button>
              <Button variant="ghost" icon={RotateCcw} onClick={() => setResetOpen(true)} disabled={refreshing}>
                Reset to standard deadlines
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setSelectedStateId("")}>
              Back to general deadlines
            </Button>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Services" value={stats.total} hint="In the catalogue" icon={Sliders} />
        {selectedStateId ? (
          <>
            <StatTile label="Own deadline" value={stats.overrideCount} hint={`Set for ${selectedStateName}`} icon={Sparkles} tone="amber" />
            <StatTile label="From general" value={stats.inheritedCount} hint="Uses the general deadline" icon={Clock} />
          </>
        ) : (
          <>
            <StatTile label="Working days" value={stats.businessDaysCount} hint="Skips weekends and holidays" icon={Briefcase} />
            <StatTile label="Calendar days" value={stats.calendarDaysCount} hint="Counts every day" icon={Calendar} />
          </>
        )}
        <StatTile label="Switched on" value={stats.activeCount} hint="Tracked on applications" icon={CheckCircle2} tone="brand" />
      </div>

      <FastTrackSLACard
        stateId={selectedStateId ? parseInt(selectedStateId, 10) : null}
        open={fastTrackOpen}
        onToggle={() => setFastTrackOpen((v) => !v)}
      />

      {/* Filters */}
      <div>
        {categories.length > 1 ? (
          <Tabs
            className="mb-3"
            label="Category"
            value={selectedCategory}
            onChange={setSelectedCategory}
            tabs={categories.map((cat) => ({
              id: cat,
              label: cat === "all" ? "All categories" : cat.charAt(0).toUpperCase() + cat.slice(1),
            }))}
          />
        ) : null}
        <Toolbar search={searchQuery} onSearch={setSearchQuery} placeholder="Search services" />

        {loading ? (
          <SkeletonList rows={4} />
        ) : filteredDeadlines.length === 0 ? (
          <EmptyState icon={Clock} title="No services found" description="Try clearing the search or picking another category." />
        ) : (
          <Card padded={false}>
            <ul className="divide-y divide-cx-line/70">
              {filteredDeadlines.map((item) => {
                const warnPct = item.warning_threshold_percent || 75;
                return (
                  <li key={`${item.service_key}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="cx-focus group flex w-full items-center gap-3 rounded-cx-lg px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-cx-ink">{item.service_name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {originBadge(item)}
                          {item.category ? <Badge tone="neutral">{item.category}</Badge> : null}
                          {!item.is_active ? <Badge tone="red">Off</Badge> : null}
                        </div>
                        {item.description ? (
                          <p className="mt-1 line-clamp-1 text-[13px] text-cx-muted">{item.description}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[15px] font-semibold text-cx-ink">
                          {item.expected_days} {DAY_TYPE_LABEL[item.day_type] || "days"}
                        </p>
                        <p className="text-[13px] text-cx-muted">
                          Warns at {Math.round((item.expected_days * warnPct) / 100)}d ({warnPct}%)
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {/* Edit deadline */}
      <Sheet
        open={!!editingItem}
        onOpenChange={(o) => !o && closeEditModal()}
        title={editingItem ? editingItem.service_name : ""}
        description={selectedStateId ? `Deadline for ${selectedStateName} only` : "General deadline for every state"}
        footer={
          <>
            <Button variant="secondary" onClick={closeEditModal} disabled={saving}>
              Cancel
            </Button>
            <Button block loading={saving} onClick={handleSaveEdit}>
              {selectedStateId ? `Save for ${selectedStateName}` : "Save deadline"}
            </Button>
          </>
        }
      >
        {editingItem ? (
          <div className="space-y-5">
            <Notice tone={selectedStateId ? "amber" : "brand"}>
              {selectedStateId
                ? `Only applications filed in ${selectedStateName} use this deadline. Other states keep theirs.`
                : "Any state without its own deadline for this service follows this one."}
            </Notice>

            {editError ? <Notice tone="red">{editError}</Notice> : null}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Time allowed">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="365"
                    value={editForm.expected_days}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, expected_days: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Counted in">
                {(p) => (
                  <Select
                    {...p}
                    value={editForm.day_type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, day_type: e.target.value }))}
                  >
                    <option value="business_days">Working days</option>
                    <option value="calendar_days">Calendar days</option>
                  </Select>
                )}
              </Field>
            </div>
            <p className="-mt-2 text-[13px] text-cx-muted">
              {editForm.day_type === "business_days"
                ? "Working days skip weekends and Nigerian public holidays."
                : "Calendar days count every day, weekends and holidays included."}
            </p>

            <Field label="Warn when this much time has passed" hint="The countdown turns amber at this point.">
              {(p) => (
                <div className="flex items-center gap-3">
                  <input
                    {...p}
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={editForm.warning_threshold_percent}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        warning_threshold_percent: parseInt(e.target.value, 10),
                      }))
                    }
                    className="h-11 flex-1 cursor-pointer accent-cx-brand"
                  />
                  <span className="w-14 shrink-0 rounded-cx-sm bg-cx-sunken py-2 text-center text-[15px] font-semibold text-cx-ink">
                    {editForm.warning_threshold_percent}%
                  </span>
                </div>
              )}
            </Field>

            <div className="rounded-cx border border-cx-line p-3.5">
              <Switch
                checked={editForm.is_active}
                onChange={(v) => setEditForm((prev) => ({ ...prev, is_active: v }))}
                label="Track this deadline"
                description="When on, live applications and the countdown monitor use it."
              />
            </div>

            {!selectedStateId ? (
              <div className="rounded-cx border border-cx-line p-3.5">
                <Switch
                  checked={editForm.apply_to_all_states}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, apply_to_all_states: v }))}
                  label="Use in every state now"
                  description="Removes any state's own deadline for this service."
                />
              </div>
            ) : null}

            <Field label="Note" optional>
              {(p) => (
                <Input
                  {...p}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    selectedStateId
                      ? `e.g. Agreed with ${selectedStateName} VIO`
                      : "e.g. Standard national VIO timeline"
                  }
                />
              )}
            </Field>

            {selectedStateId && editingItem.is_override ? (
              <div className="border-t border-cx-line pt-4">
                <Button
                  variant="ghost"
                  icon={RotateCcw}
                  onClick={() => {
                    setRevertTarget(editingItem);
                    setEditingItem(null);
                  }}
                  disabled={saving || revertingId === editingItem.id}
                >
                  Use the general deadline instead
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      {/* Revert override */}
      <ConfirmSheet
        open={!!revertTarget}
        onOpenChange={(o) => !o && setRevertTarget(null)}
        title="Use the general deadline?"
        description={
          revertTarget
            ? `${revertTarget.service_name} in ${selectedStateName} will go back to the general deadline.`
            : ""
        }
        confirmLabel="Use general deadline"
        loading={!!revertTarget && revertingId === revertTarget.id}
        onConfirm={() => handleRevertOverride(revertTarget)}
      />

      {/* Reset general deadlines */}
      <ConfirmSheet
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset to standard deadlines?"
        description="Every general deadline goes back to the platform's standard setting. State deadlines aren't changed."
        confirmLabel="Reset deadlines"
        tone="danger"
        loading={refreshing}
        onConfirm={handleResetDefaults}
      />

      {/* Clone deadlines */}
      <Sheet
        open={cloneOpen}
        onOpenChange={(o) => !o && closeCloneModal()}
        title="Copy deadlines to a state"
        description="Copies every service's time allowed, day type and warning point."
        footer={
          <>
            <Button variant="secondary" onClick={closeCloneModal} disabled={cloning}>
              Cancel
            </Button>
            <Button block icon={Copy} loading={cloning} onClick={handleCloneDeadlines}>
              Copy deadlines
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {cloneError ? <Notice tone="red">{cloneError}</Notice> : null}
          <Field label="Copy from">
            {(p) => (
              <Select {...p} value={cloneSourceStateId} onChange={(e) => setCloneSourceStateId(e.target.value)}>
                <option value="">General (all states)</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Copy to">
            {(p) => (
              <Select {...p} value={cloneTargetStateId} onChange={(e) => setCloneTargetStateId(e.target.value)}>
                <option value="">Pick a state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </Sheet>

      {/* Apply baseline to all states */}
      <ConfirmSheet
        open={applyAllOpen}
        onOpenChange={setApplyAllOpen}
        title="Use general deadlines everywhere?"
        description="Every state will use the general deadlines."
        confirmLabel="Apply to every state"
        tone="danger"
        loading={applyingAll}
        onConfirm={handleApplyToAllStates}
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-cx-ink-2">
          <li>Each state's own deadlines are removed.</li>
          <li>Open applications are timed against the general deadlines.</li>
          <li>You can set a state's own deadline again at any time.</li>
        </ul>
      </ConfirmSheet>
    </div>
  );
}
