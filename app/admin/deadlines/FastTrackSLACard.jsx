"use client";

// Fast Track deadlines: how long an expedited application should take, per
// service. These are global (no state). One line per service; tapping a line
// opens a sheet. Saving still sends every service at once, as the API expects.

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { getAdminFastTrackSLA, updateAdminFastTrackSLA } from "@/lib/api";
import { Button, Field, Input, Notice, Select, Sheet, SkeletonList } from "@/app/dashboard/_kit";
import { useToast } from "@/app/components/shared/ToastProvider";
import { PercentInput } from "../_kit";

const cx = (...parts) => parts.filter(Boolean).join(" ");

// Aligned with the backend's FAST_TRACK_SERVICES canonical keys.
// SLA config is global (no state_id), so there are no state-scoped rows.
const FAST_TRACK_SERVICES = [
  { key: "vehicle_particulars", label: "Vehicle papers" },
  { key: "tinted_permit", label: "Tinted glass permit" },
  { key: "number_plate", label: "Number plates (all types)" },
  { key: "vehicle_verification", label: "Vehicle verification" },
  { key: "central_motor_registry", label: "Central Motor Registry (eCMR)" },
  { key: "roadworthiness_express", label: "Roadworthiness inspection" },
  { key: "physical_condition_inspection", label: "Physical condition inspection" },
  { key: "driver_licence", label: "Driver's licence (upgrades only)" },
];

const DAY_TYPE_LABEL = {
  business_days: "working days",
  calendar_days: "calendar days",
  hours: "hours",
};

export default function FastTrackSLACard({ stateId, open, onToggle }) {
  const pushToast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // the service being edited
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Collapsible when the parent controls it; otherwise manage it here.
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = open ?? localOpen;
  const toggle = onToggle ?? (() => setLocalOpen((v) => !v));

  const loadSLA = async () => {
    setLoading(true);
    const res = await getAdminFastTrackSLA();
    // Backend returns: { items: [{ id, service_type, expected_days, day_type, warning_threshold_percent, is_active }] }
    if (res.data?.items && Array.isArray(res.data.items)) {
      setItems(res.data.items);
    } else if (Array.isArray(res.data)) {
      setItems(res.data);
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSLA();
  }, [stateId]);

  // SLA has no state_id — all rows are global, no scoping needed.
  const getServiceItem = (serviceKey) => {
    // Field is service_type (not service_name)
    const item = items.find((it) => it.service_type === serviceKey);
    if (item != null) return item;
    return { expected_days: 2, day_type: "business_days", warning_threshold_percent: 75 };
  };

  const handleStartEdit = (svc) => {
    const initial = {};
    FAST_TRACK_SERVICES.forEach((s) => {
      const it = getServiceItem(s.key);
      initial[s.key] = {
        expected_days: it.expected_days ?? 2,
        day_type: it.day_type ?? "business_days",
        warning_threshold_percent: it.warning_threshold_percent ?? 75,
      };
    });
    setFormValues(initial);
    setFormError(null);
    setEditing(svc);
  };

  const setField = (key, field, val) =>
    setFormValues((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    const payloadItems = FAST_TRACK_SERVICES.map((s) => {
      const val = formValues[s.key] || {};
      return {
        service_type: s.key,
        expected_days: parseInt(val.expected_days, 10) || 2,
        day_type: val.day_type || "business_days",
        warning_threshold_percent: parseInt(val.warning_threshold_percent, 10) || 75,
        is_active: true,
      };
    });

    const res = await updateAdminFastTrackSLA(payloadItems);
    setSaving(false);
    if (res.error) {
      setFormError(typeof res.error === "string" ? res.error : res.error?.detail || "Couldn't save. Try again.");
    } else {
      pushToast({ tone: "success", title: "Fast Track deadline saved", body: editing?.label });
      setEditing(null);
      await loadSLA();
    }
  };

  const current = editing ? formValues[editing.key] || {} : {};

  return (
    <section className="rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx">
      <button type="button" onClick={toggle} aria-expanded={isOpen} className="cx-focus flex w-full items-start gap-3 rounded-cx-lg px-4 py-4 text-left sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cx-amber-soft text-cx-amber">
          <Zap className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-cx-ink">Fast Track deadlines</h2>
          <p className="mt-0.5 text-sm text-cx-muted">
            {FAST_TRACK_SERVICES.length} services · Same in every state
          </p>
        </div>
        <ChevronDown className={cx("mt-1 h-5 w-5 shrink-0 text-cx-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
      </button>

      {isOpen ? (
        <div className="border-t border-cx-line">
          {loading ? (
            <div className="p-4"><SkeletonList rows={3} /></div>
          ) : (
            <ul className="divide-y divide-cx-line/70">
              {FAST_TRACK_SERVICES.map((s) => {
                const it = getServiceItem(s.key);
                return (
                  <li key={s.key}>
                    <button type="button" onClick={() => handleStartEdit(s)} className="cx-focus group flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cx-sunken/70 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-cx-ink">{s.label}</p>
                        <p className="mt-0.5 text-[13px] text-cx-muted">Warns at {it.warning_threshold_percent ?? 75}%</p>
                      </div>
                      <span className="shrink-0 text-right text-[15px] font-semibold text-cx-ink">
                        {it.expected_days} {DAY_TYPE_LABEL[it.day_type] || "working days"}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-cx-muted group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <Sheet
        open={!!editing}
        onOpenChange={(o) => !o && !saving && setEditing(null)}
        title={editing ? `Fast Track — ${editing.label}` : ""}
        description="Applies in every state."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button block loading={saving} onClick={handleSave}>Save deadline</Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-5">
            {formError ? <Notice tone="red">{formError}</Notice> : null}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time allowed">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={current.expected_days ?? ""}
                    onChange={(e) => setField(editing.key, "expected_days", e.target.value)}
                  />
                )}
              </Field>
              <Field label="Counted in">
                {(p) => (
                  <Select {...p} value={current.day_type ?? "business_days"} onChange={(e) => setField(editing.key, "day_type", e.target.value)}>
                    <option value="business_days">Working days</option>
                    <option value="calendar_days">Calendar days</option>
                    <option value="hours">Hours</option>
                  </Select>
                )}
              </Field>
            </div>
            <Field label="Warn when this much time has passed" hint="The countdown turns amber at this point.">
              {(p) => (
                <PercentInput
                  {...p}
                  value={String(current.warning_threshold_percent ?? "")}
                  onChange={(v) => setField(editing.key, "warning_threshold_percent", v)}
                />
              )}
            </Field>
            <p className="text-[13px] text-cx-muted">Saving also re-saves the other Fast Track deadlines as they are now.</p>
          </div>
        ) : null}
      </Sheet>
    </section>
  );
}
