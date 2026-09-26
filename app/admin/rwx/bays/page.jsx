"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  X,
  Loader2,
  Clock,
  Users,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Building2,
  Filter,
} from "lucide-react";
import {
  getReferenceStates,
  getReferenceLgas,
  adminListBays,
  adminCreateBay,
  adminUpdateBay,
  adminDeleteBay,
  adminCreateBaySlot,
  adminUpdateBaySlot,
  adminDeleteBaySlot,
  adminUpdateBayAgents,
  adminGetAgents,
} from "@/lib/api";

const BRAND = "#28A745";

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-xl border text-[13px] font-medium max-w-sm transition-all ${
        toast.type === "success"
          ? "bg-white border-emerald-200 text-slate-800"
          : "bg-white border-red-200 text-slate-800"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#28A745]" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
      )}
      <span className="flex-1 leading-snug">{toast.msg}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 text-slate-400 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SlotForm({ bayId, onSaved, onCancel, initial }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) || "");
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) || "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? 5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!label.trim() || !startTime || !endTime || !capacity) {
      setError("Fill in every field.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      label,
      start_time: startTime,
      end_time: endTime,
      capacity: Number(capacity),
    };
    const res = initial
      ? await adminUpdateBaySlot(bayId, initial.id, payload)
      : await adminCreateBaySlot(bayId, payload);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSaved();
  };

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-5 sm:items-end">
      <div className="col-span-2 sm:col-span-1">
        <label className="mb-1 block text-[11px] font-semibold text-slate-500">Label</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. 9:00–11:00"
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-slate-500">Start</label>
        <input
          type="time"
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-slate-500">End</label>
        <input
          type="time"
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-slate-500">Capacity</label>
        <input
          type="number"
          min="1"
          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </div>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#28A745] px-3 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11.5px] font-medium text-slate-600"
        >
          Cancel
        </button>
      </div>
      {error && <p className="col-span-2 text-[11px] text-red-600 sm:col-span-5">{error}</p>}
    </div>
  );
}

function BayCard({ bay, states, agents, onChanged, showToast }) {
  const [expanded, setExpanded] = useState(false);
  const [editingBay, setEditingBay] = useState(false);
  const [bayName, setBayName] = useState(bay.name);
  const [bayAddress, setBayAddress] = useState(bay.address);
  const [bayStateId, setBayStateId] = useState(String(bay.state_id || ""));
  const [bayLgaId, setBayLgaId] = useState(String(bay.lga_id || ""));
  const [bayIsActive, setBayIsActive] = useState(bay.is_active);
  const [bayLgas, setBayLgas] = useState([]);
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [savingBay, setSavingBay] = useState(false);

  const [addingSlot, setAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editingAgents, setEditingAgents] = useState(false);
  const [pendingAgentIds, setPendingAgentIds] = useState(bay.agent_ids || []);
  const [savingAgents, setSavingAgents] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (editingBay && bayStateId) {
      setLoadingLgas(true);
      getReferenceLgas(bayStateId).then((res) => {
        setBayLgas(res.data || []);
        setLoadingLgas(false);
      });
    }
  }, [editingBay, bayStateId]);

  const handleStateChange = (newStateId) => {
    setBayStateId(newStateId);
    setBayLgaId("");
    if (newStateId) {
      setLoadingLgas(true);
      getReferenceLgas(newStateId).then((res) => {
        setBayLgas(res.data || []);
        setLoadingLgas(false);
      });
    } else {
      setBayLgas([]);
    }
  };

  const handleSaveBayDetails = async () => {
    if (!bayName.trim() || !bayAddress.trim() || !bayStateId) {
      showToast("error", "Name, address, and state are required.");
      return;
    }
    setSavingBay(true);
    const res = await adminUpdateBay(bay.id, {
      name: bayName.trim(),
      address: bayAddress.trim(),
      state_id: Number(bayStateId),
      lga_id: bayLgaId ? Number(bayLgaId) : null,
      is_active: bayIsActive,
    });
    setSavingBay(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    setEditingBay(false);
    showToast("success", "Bay details updated.");
    onChanged();
  };

  const handleToggleActive = async () => {
    setDeactivating(true);
    const res = await adminUpdateBay(bay.id, { is_active: !bay.is_active });
    setDeactivating(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    showToast(
      "success",
      bay.is_active ? "Bay deactivated." : "Bay activated."
    );
    onChanged();
  };

  const handleSaveAgents = async () => {
    setSavingAgents(true);
    const res = await adminUpdateBayAgents(bay.id, pendingAgentIds);
    setSavingAgents(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    setEditingAgents(false);
    showToast("success", "Assigned agents updated.");
    onChanged();
  };

  const stateName =
    bay.state_name || states.find((s) => s.id === bay.state_id)?.name || "";
  const lgaName = bay.lga_name || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      <div className="flex w-full items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#28A745]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13.5px] font-bold text-slate-900">{bay.name}</p>
              {!bay.is_active && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Inactive
                </span>
              )}
              {stateName && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#28A745]">
                  {lgaName ? `${lgaName}, ` : ""}
                  {stateName}
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-0.5">{bay.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingBay((v) => !v);
              setExpanded(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
            title="Edit bay details"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] font-medium text-slate-600 hover:bg-slate-100"
          >
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />{" "}
              {bay.slot_templates?.length || 0} slots
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-400" />{" "}
              {bay.agent_ids?.length || 0} agents
            </span>
          </button>
        </div>
      </div>

      {/* Inline Edit Bay Form */}
      {editingBay && (
        <div className="border-t border-slate-100 bg-slate-50/80 p-4 space-y-3">
          <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-700">
            Edit Bay Location Details
          </h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                Bay name
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px]"
                value={bayName}
                onChange={(e) => setBayName(e.target.value)}
                placeholder="e.g. Ikeja Central Bay"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                Street address
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px]"
                value={bayAddress}
                onChange={(e) => setBayAddress(e.target.value)}
                placeholder="Physical address"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                State
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px]"
                value={bayStateId}
                onChange={(e) => handleStateChange(e.target.value)}
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                LGA (Area)
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] disabled:opacity-50"
                value={bayLgaId}
                onChange={(e) => setBayLgaId(e.target.value)}
                disabled={!bayStateId || loadingLgas}
              >
                <option value="">
                  {loadingLgas ? "Loading LGAs…" : "Select LGA (optional)"}
                </option>
                {bayLgas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-slate-700">
              <input
                type="checkbox"
                checked={bayIsActive}
                onChange={(e) => setBayIsActive(e.target.checked)}
                className="rounded border-slate-300 text-[#28A745] focus:ring-[#28A745]"
              />
              Active location (accepts customer bookings)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveBayDetails}
                disabled={savingBay}
                className="rounded-lg bg-[#28A745] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-xs disabled:opacity-70"
              >
                {savingBay ? "Saving…" : "Save details"}
              </button>
              <button
                type="button"
                onClick={() => setEditingBay(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 p-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Daily Slot Templates &amp; Capacity
              </h4>
              {!addingSlot && (
                <button
                  type="button"
                  onClick={() => setAddingSlot(true)}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-[#28A745]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add slot
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(bay.slot_templates || []).map((slot) =>
                editingSlotId === slot.id ? (
                  <SlotForm
                    key={slot.id}
                    bayId={bay.id}
                    initial={slot}
                    onCancel={() => setEditingSlotId(null)}
                    onSaved={() => {
                      setEditingSlotId(null);
                      onChanged();
                      showToast("success", "Slot updated.");
                    }}
                  />
                ) : (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <div>
                      <p className="text-[12.5px] font-semibold text-slate-800">
                        {slot.label}{" "}
                        {!slot.is_active && (
                          <span className="ml-1 text-[10.5px] text-slate-400">
                            (inactive)
                          </span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-slate-500">
                        {slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)} · capacity{" "}
                        {slot.capacity} vehicles
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingSlotId(slot.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Edit slot"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await adminDeleteBaySlot(bay.id, slot.id);
                          if (res.error) {
                            showToast("error", res.error);
                            return;
                          }
                          showToast("success", res.data?.message || "Slot removed.");
                          onChanged();
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete slot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              )}
              {addingSlot && (
                <SlotForm
                  bayId={bay.id}
                  onCancel={() => setAddingSlot(false)}
                  onSaved={() => {
                    setAddingSlot(false);
                    onChanged();
                    showToast("success", "Slot added.");
                  }}
                />
              )}
              {!addingSlot && (bay.slot_templates || []).length === 0 && (
                <p className="text-[12px] text-slate-400">No time slots configured yet.</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Assigned Accredited Agents
              </h4>
              {!editingAgents && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingAgentIds(bay.agent_ids || []);
                    setEditingAgents(true);
                  }}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-[#28A745]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit agents
                </button>
              )}
            </div>
            {editingAgents ? (
              <div className="space-y-2">
                <p className="text-[11.5px] text-slate-500">
                  Select which agents can claim and inspect bookings arriving at this bay:
                </p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {agents
                    .filter((a) => a.agent_profile?.id)
                    .map((a) => {
                      const agentId = a.agent_profile.id;
                      const checked = pendingAgentIds.includes(agentId);
                      return (
                        <button
                          key={agentId}
                          type="button"
                          onClick={() =>
                            setPendingAgentIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== agentId)
                                : [...prev, agentId]
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                            checked
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-xs"
                              : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {a.name}
                        </button>
                      );
                    })}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveAgents}
                    disabled={savingAgents}
                    className="rounded-lg bg-[#28A745] px-3.5 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-70"
                  >
                    {savingAgents ? "Saving…" : "Save assigned agents"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAgents(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11.5px] font-medium text-slate-600 bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(bay.agent_ids || []).length === 0 ? (
                  <p className="text-[12px] text-slate-400">No agents assigned yet.</p>
                ) : (
                  bay.agent_ids.map((id) => {
                    const agent = agents.find((a) => a.agent_profile?.id === id);
                    return (
                      <span
                        key={id}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600"
                      >
                        {agent?.name || `Agent #${id}`}
                      </span>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={deactivating}
              className="text-[11.5px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
            >
              {deactivating
                ? "Working…"
                : bay.is_active
                ? "Deactivate bay"
                : "Reactivate bay"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRwxBaysPage() {
  const [states, setStates] = useState([]);
  const [stateFilter, setStateFilter] = useState("");
  const [filterLgas, setFilterLgas] = useState([]);
  const [lgaFilter, setLgaFilter] = useState("");
  const [bays, setBays] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    address: "",
    state_id: "",
    lga_id: "",
  });
  const [newLgas, setNewLgas] = useState([]);
  const [loadingNewLgas, setLoadingNewLgas] = useState(false);
  const [creating, setCreating] = useState(false);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const loadBays = async () => {
    setLoading(true);
    const res = await adminListBays(stateFilter || undefined, lgaFilter || undefined);
    if (res.data?.items) setBays(res.data.items);
    setLoading(false);
  };

  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res.data) setStates(res.data);
    });
    adminGetAgents().then((res) => {
      if (res.data) setAgents(res.data);
    });
  }, []);

  useEffect(() => {
    if (stateFilter) {
      getReferenceLgas(stateFilter).then((res) => {
        setFilterLgas(res.data || []);
      });
    } else {
      setFilterLgas([]);
      setLgaFilter("");
    }
  }, [stateFilter]);

  useEffect(() => {
    loadBays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, lgaFilter]);

  const handleCreateStateChange = (selectedStateId) => {
    setCreateForm((f) => ({ ...f, state_id: selectedStateId, lga_id: "" }));
    if (selectedStateId) {
      setLoadingNewLgas(true);
      getReferenceLgas(selectedStateId).then((res) => {
        setNewLgas(res.data || []);
        setLoadingNewLgas(false);
      });
    } else {
      setNewLgas([]);
    }
  };

  const handleCreateBay = async () => {
    if (!createForm.name.trim() || !createForm.address.trim() || !createForm.state_id) {
      showToast("error", "Fill in bay name, street address, and state.");
      return;
    }
    setCreating(true);
    const res = await adminCreateBay({
      name: createForm.name.trim(),
      address: createForm.address.trim(),
      state_id: Number(createForm.state_id),
      lga_id: createForm.lga_id ? Number(createForm.lga_id) : null,
    });
    setCreating(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    setCreateForm({ name: "", address: "", state_id: "", lga_id: "" });
    setNewLgas([]);
    setShowCreate(false);
    showToast("success", "Bay location registered successfully.");
    loadBays();
  };

  return (
    <div className="space-y-6 pb-16">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <MapPin className="h-3.5 w-3.5 text-[#28A745]" />
              Inspection Bay Directory
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bay Areas &amp; Inspection Locations
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
              Register physical inspection bay locations by state and LGA for ride-hailing and vehicle roadworthiness checks. Configure daily slot capacity and assign accredited field agents to oversee inspections.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#28A745] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1F8838] transition-all shrink-0 self-start md:self-center"
          >
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? "Close form" : "Register new bay"}
          </button>
        </div>

        {showCreate && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <h3 className="text-[13px] font-bold text-slate-800">
              Register New Inspection Bay Location
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Bay Name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px]"
                  placeholder="e.g. Alausa Bay 1"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Physical Address
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px]"
                  placeholder="e.g. Plot 12, Commercial Ave"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  State
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px]"
                  value={createForm.state_id}
                  onChange={(e) => handleCreateStateChange(e.target.value)}
                >
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  LGA / Area
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] disabled:opacity-50"
                  value={createForm.lga_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lga_id: e.target.value }))}
                  disabled={!createForm.state_id || loadingNewLgas}
                >
                  <option value="">
                    {loadingNewLgas ? "Loading LGAs…" : "Select LGA (optional)"}
                  </option>
                  {newLgas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCreateBay}
                disabled={creating}
                className="rounded-lg bg-[#28A745] px-4 py-2 text-[12.5px] font-semibold text-white shadow-xs disabled:opacity-70"
              >
                {creating ? "Registering…" : "Save & Register Bay"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[12.5px] font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
            Filter Location:
          </span>
        </div>
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setLgaFilter("");
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 shadow-xs focus:border-[#28A745] focus:outline-none"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {stateFilter && (
          <select
            value={lgaFilter}
            onChange={(e) => setLgaFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-700 shadow-xs focus:border-[#28A745] focus:outline-none"
          >
            <option value="">All LGAs in state</option>
            {filterLgas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
        <span className="text-[12.5px] text-slate-400 ml-auto">
          {bays.length} {bays.length === 1 ? "bay area registered" : "bay areas registered"}
        </span>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#28A745] mx-auto" />
          <p className="mt-2 text-[12.5px] text-slate-400">Loading registered bays…</p>
        </div>
      ) : bays.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-slate-700">No inspection bays found</p>
          <p className="text-[12.5px] text-slate-500 mt-1 max-w-sm mx-auto">
            {stateFilter
              ? "No bay locations exist for the selected location filter. Try switching filters or register a new bay above."
              : "Register your first bay location to start accepting vehicle inspections and ride-hailing appointments."}
          </p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#28A745] px-4 py-2 text-[12.5px] font-semibold text-white shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Bay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bays.map((bay) => (
            <BayCard
              key={bay.id}
              bay={bay}
              states={states}
              agents={agents}
              onChanged={loadBays}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
