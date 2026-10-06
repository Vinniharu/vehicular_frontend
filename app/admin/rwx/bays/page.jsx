"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Clock, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  Notice,
  PageHeader,
  Select,
  Sheet,
  SkeletonList,
} from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { ConfirmSheet, Switch, Toolbar } from "../../_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Slot add / edit sheet ─────────────────────────────────────────── */

function SlotSheet({ open, bayId, initial, onSaved, onClose }) {
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
    <Sheet
      open={open}
      onOpenChange={(o) => !o && !saving && onClose()}
      title={initial ? "Edit time slot" : "Add time slot"}
      description="A daily slot customers can book at this bay."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button block loading={saving} onClick={handleSave}>
            Save slot
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error ? <Notice tone="red">{error}</Notice> : null}
        <Field label="Label">
          {(p) => <Input {...p} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 9:00–11:00" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            {(p) => <Input {...p} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />}
          </Field>
          <Field label="Ends">
            {(p) => <Input {...p} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />}
          </Field>
        </div>
        <Field label="Vehicles per slot">
          {(p) => (
            <Input {...p} type="number" inputMode="numeric" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          )}
        </Field>
      </div>
    </Sheet>
  );
}

/* ── One bay ───────────────────────────────────────────────────────── */

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
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [deletingSlotBusy, setDeletingSlotBusy] = useState(false);
  const [editingAgents, setEditingAgents] = useState(false);
  const [pendingAgentIds, setPendingAgentIds] = useState(bay.agent_ids || []);
  const [savingAgents, setSavingAgents] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

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

  const openEditBay = () => {
    setBayName(bay.name);
    setBayAddress(bay.address);
    setBayStateId(String(bay.state_id || ""));
    setBayLgaId(String(bay.lga_id || ""));
    setBayIsActive(bay.is_active);
    setEditingBay(true);
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
    setConfirmDeactivate(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    showToast("success", bay.is_active ? "Bay deactivated." : "Bay activated.");
    onChanged();
  };

  const handleDeleteSlot = async (slot) => {
    setDeletingSlotBusy(true);
    const res = await adminDeleteBaySlot(bay.id, slot.id);
    setDeletingSlotBusy(false);
    setDeletingSlot(null);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    showToast("success", res.data?.message || "Slot removed.");
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

  const stateName = bay.state_name || states.find((s) => s.id === bay.state_id)?.name || "";
  const lgaName = bay.lga_name || "";
  const slots = bay.slot_templates || [];
  const dailyCapacity = slots.filter((s) => s.is_active !== false).reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
  const editingSlot = slots.find((s) => s.id === editingSlotId) || null;

  return (
    <Card padded={false}>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cx-brand-soft text-cx-brand-deep">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-[17px] font-semibold text-cx-ink">{bay.name}</h2>
            {!bay.is_active ? <Badge tone="neutral">Inactive</Badge> : null}
          </div>
          {stateName ? (
            <p className="mt-0.5 text-sm font-medium text-cx-ink-2">
              {lgaName ? `${lgaName}, ` : ""}
              {stateName}
            </p>
          ) : null}
          <p className="mt-0.5 break-words text-sm text-cx-muted">{bay.address}</p>
        </div>
        <IconButton label="Edit bay details" icon={Pencil} onClick={openEditBay} className="-mr-2 -mt-1" />
      </div>

      <div className="space-y-2 px-4 pb-4 sm:px-5">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-cx-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden />
            {slots.length} {slots.length === 1 ? "slot" : "slots"} a day
          </span>
          <span>{dailyCapacity} vehicles a day</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(bay.agent_ids || []).length === 0 ? (
            <span className="text-[13px] text-cx-muted">No agents assigned yet.</span>
          ) : (
            bay.agent_ids.map((id) => {
              const agent = agents.find((a) => a.agent_profile?.id === id);
              return (
                <Badge key={id} tone="brand">
                  {agent?.name || `Agent #${id}`}
                </Badge>
              );
            })
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="cx-focus flex min-h-11 w-full items-center justify-between gap-2 border-t border-cx-line px-4 py-2.5 text-left text-sm font-medium text-cx-ink-2 hover:bg-cx-sunken/70 sm:px-5"
      >
        Time slots and agents
        <ChevronDown className={cx("h-5 w-5 text-cx-muted transition-transform", expanded && "rotate-180")} aria-hidden />
      </button>

      {expanded ? (
        <div className="space-y-5 border-t border-cx-line p-4 sm:p-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-cx-ink">Daily time slots</h3>
              <Button size="sm" variant="soft" icon={Plus} onClick={() => setAddingSlot(true)} className="min-h-11">
                Add slot
              </Button>
            </div>
            {slots.length === 0 ? (
              <p className="text-sm text-cx-muted">No time slots yet.</p>
            ) : (
              <ul className="divide-y divide-cx-line/70 rounded-cx border border-cx-line">
                {slots.map((slot) => (
                  <li key={slot.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingSlotId(slot.id)}
                      className="cx-focus min-w-0 flex-1 rounded-cx px-3 py-2.5 text-left hover:bg-cx-sunken/70"
                    >
                      <p className="text-[15px] font-medium text-cx-ink">
                        {slot.label}
                        {!slot.is_active ? <span className="ml-1.5 text-[13px] font-normal text-cx-muted">(inactive)</span> : null}
                      </p>
                      <p className="text-[13px] text-cx-muted">
                        {slot.start_time?.slice(0, 5)}–{slot.end_time?.slice(0, 5)} · {slot.capacity} vehicles
                      </p>
                    </button>
                    <IconButton label={`Delete ${slot.label}`} icon={Trash2} onClick={() => setDeletingSlot(slot)} className="mr-1 hover:text-cx-red" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-cx-ink">Assigned agents</h3>
              <Button
                size="sm"
                variant="soft"
                icon={Users}
                className="min-h-11"
                onClick={() => {
                  setPendingAgentIds(bay.agent_ids || []);
                  setEditingAgents(true);
                }}
              >
                Edit agents
              </Button>
            </div>
            <p className="text-sm text-cx-muted">Assigned agents can claim and inspect bookings at this bay.</p>
          </div>

          <div className="border-t border-cx-line pt-4">
            {bay.is_active ? (
              <Button variant="ghost" className="text-cx-red" onClick={() => setConfirmDeactivate(true)} disabled={deactivating}>
                Deactivate bay
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleToggleActive} loading={deactivating}>
                Reactivate bay
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {/* Edit bay details */}
      <Sheet
        open={editingBay}
        onOpenChange={(o) => !o && !savingBay && setEditingBay(false)}
        title="Edit bay"
        description={bay.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingBay(false)} disabled={savingBay}>
              Cancel
            </Button>
            <Button block loading={savingBay} onClick={handleSaveBayDetails}>
              Save details
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Bay name" required>
            {(p) => <Input {...p} value={bayName} onChange={(e) => setBayName(e.target.value)} placeholder="e.g. Ikeja Central Bay" />}
          </Field>
          <Field label="Street address" required>
            {(p) => <Input {...p} value={bayAddress} onChange={(e) => setBayAddress(e.target.value)} placeholder="Physical address" />}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="State" required>
              {(p) => (
                <Select {...p} value={bayStateId} onChange={(e) => handleStateChange(e.target.value)}>
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="LGA" optional>
              {(p) => (
                <Select {...p} value={bayLgaId} onChange={(e) => setBayLgaId(e.target.value)} disabled={!bayStateId || loadingLgas}>
                  <option value="">{loadingLgas ? "Loading LGAs…" : "Select LGA"}</option>
                  {bayLgas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div className="rounded-cx border border-cx-line p-3.5">
            <Switch checked={bayIsActive} onChange={setBayIsActive} label="Active" description="Customers can book inspections here." />
          </div>
        </div>
      </Sheet>

      {/* Assigned agents */}
      <Sheet
        open={editingAgents}
        onOpenChange={(o) => !o && !savingAgents && setEditingAgents(false)}
        title="Assigned agents"
        description="Pick the agents who can claim and inspect bookings at this bay."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingAgents(false)} disabled={savingAgents}>
              Cancel
            </Button>
            <Button block loading={savingAgents} onClick={handleSaveAgents}>
              Save agents
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {agents.filter((a) => a.agent_profile?.id).length === 0 ? (
            <p className="text-sm text-cx-muted">No accredited agents found.</p>
          ) : (
            agents
              .filter((a) => a.agent_profile?.id)
              .map((a) => {
                const agentId = a.agent_profile.id;
                const checked = pendingAgentIds.includes(agentId);
                return (
                  <button
                    key={agentId}
                    type="button"
                    aria-pressed={checked}
                    onClick={() =>
                      setPendingAgentIds((prev) => (checked ? prev.filter((id) => id !== agentId) : [...prev, agentId]))
                    }
                    className={cx(
                      "cx-focus min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                      checked
                        ? "border-cx-brand bg-cx-brand-soft text-cx-brand-deep"
                        : "border-cx-line-strong bg-cx-surface text-cx-ink-2 hover:bg-cx-sunken"
                    )}
                  >
                    {a.name}
                  </button>
                );
              })
          )}
        </div>
      </Sheet>

      {/* Slots */}
      {addingSlot ? (
        <SlotSheet
          open
          bayId={bay.id}
          onClose={() => setAddingSlot(false)}
          onSaved={() => {
            setAddingSlot(false);
            onChanged();
            showToast("success", "Slot added.");
          }}
        />
      ) : null}
      {editingSlot ? (
        <SlotSheet
          key={editingSlot.id}
          open
          bayId={bay.id}
          initial={editingSlot}
          onClose={() => setEditingSlotId(null)}
          onSaved={() => {
            setEditingSlotId(null);
            onChanged();
            showToast("success", "Slot updated.");
          }}
        />
      ) : null}

      <ConfirmSheet
        open={!!deletingSlot}
        onOpenChange={(o) => !o && setDeletingSlot(null)}
        title="Delete this slot?"
        description={deletingSlot ? `${deletingSlot.label} will no longer be offered at ${bay.name}.` : ""}
        confirmLabel="Delete slot"
        tone="danger"
        loading={deletingSlotBusy}
        onConfirm={() => handleDeleteSlot(deletingSlot)}
      />

      <ConfirmSheet
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Deactivate this bay?"
        description={`Customers won't be able to book inspections at ${bay.name}. You can reactivate it later.`}
        confirmLabel="Deactivate"
        tone="danger"
        loading={deactivating}
        onConfirm={handleToggleActive}
      />
    </Card>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function AdminRwxBaysPage() {
  const pushToast = useToast();
  const [states, setStates] = useState([]);
  const [stateFilter, setStateFilter] = useState("");
  const [filterLgas, setFilterLgas] = useState([]);
  const [lgaFilter, setLgaFilter] = useState("");
  const [bays, setBays] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
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
    pushToast({ tone: type, title: typeof msg === "string" ? msg : msg?.detail || "Something went wrong." });
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
    <div className="space-y-5 pb-16">
      <PageHeader
        title="Inspection bays"
        description="Where customers bring vehicles for roadworthiness and ride-hailing checks. Set each bay's daily slots and the agents who work there."
        actions={
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Add bay
          </Button>
        }
      />

      <Toolbar>
        <Select
          aria-label="State"
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setLgaFilter("");
          }}
          className="sm:w-56"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        {stateFilter ? (
          <Select aria-label="LGA" value={lgaFilter} onChange={(e) => setLgaFilter(e.target.value)} className="sm:w-56">
            <option value="">All LGAs</option>
            {filterLgas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        ) : null}
      </Toolbar>

      {!loading ? (
        <p className="text-[13px] text-cx-muted">
          {bays.length} {bays.length === 1 ? "bay" : "bays"}
        </p>
      ) : null}

      {loading ? (
        <SkeletonList rows={3} />
      ) : bays.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No inspection bays"
          description={
            stateFilter
              ? "No bays in this area. Try another filter or add a bay."
              : "Add your first bay to start taking inspection bookings."
          }
          action={
            <Button icon={Plus} onClick={() => setShowCreate(true)}>
              Add bay
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {bays.map((bay) => (
            <BayCard key={bay.id} bay={bay} states={states} agents={agents} onChanged={loadBays} showToast={showToast} />
          ))}
        </div>
      )}

      {/* Create bay */}
      <Sheet
        open={showCreate}
        onOpenChange={(o) => !o && !creating && setShowCreate(false)}
        title="Add an inspection bay"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button block loading={creating} onClick={handleCreateBay}>
              Add bay
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Bay name" required>
            {(p) => (
              <Input
                {...p}
                placeholder="e.g. Alausa Bay 1"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            )}
          </Field>
          <Field label="Street address" required>
            {(p) => (
              <Input
                {...p}
                placeholder="e.g. Plot 12, Commercial Ave"
                value={createForm.address}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
              />
            )}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="State" required>
              {(p) => (
                <Select {...p} value={createForm.state_id} onChange={(e) => handleCreateStateChange(e.target.value)}>
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="LGA" optional>
              {(p) => (
                <Select
                  {...p}
                  value={createForm.lga_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, lga_id: e.target.value }))}
                  disabled={!createForm.state_id || loadingNewLgas}
                >
                  <option value="">{loadingNewLgas ? "Loading LGAs…" : "Select LGA"}</option>
                  {newLgas.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
