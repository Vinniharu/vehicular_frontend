"use client";

import { useState, useEffect } from "react";
import { Zap, Pencil, Save, X, Loader2, CheckCircle2, Clock } from "lucide-react";
import { getAdminFastTrackSLA, updateAdminFastTrackSLA } from "@/lib/api";

// Aligned with the backend's FAST_TRACK_SERVICES canonical keys.
// SLA config is global (no state_id), so there are no state-scoped rows.
const FAST_TRACK_SERVICES = [
  { key: "vehicle_particulars", label: "Vehicle Particulars" },
  { key: "tinted_permit", label: "Tinted Permit" },
  { key: "number_plate", label: "Number Plate (all types)" },
  { key: "vehicle_verification", label: "Vehicle Verification" },
  { key: "central_motor_registry", label: "Electronic Central Motor Registry (eCMR)" },
  { key: "roadworthiness_express", label: "Roadworthiness Express" },
  { key: "physical_condition_inspection", label: "Physical Condition Inspection" },
  { key: "driver_licence", label: "Driver's Licence (upgrades only)" },
];

export default function FastTrackSLACard({ stateId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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

  const handleStartEdit = () => {
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
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payloadItems = FAST_TRACK_SERVICES.map((s) => {
      const val = formValues[s.key] || {};
      return {
        service_type: s.key,                                          // was: service_name
        expected_days: parseInt(val.expected_days, 10) || 2,          // was: turnaround_hours
        day_type: val.day_type || "business_days",                    // was: turnaround_label
        warning_threshold_percent: parseInt(val.warning_threshold_percent, 10) || 75,
        is_active: true,
      };
    });

    const res = await updateAdminFastTrackSLA(payloadItems);
    setSaving(false);
    if (res.error) {
      setToast({ type: "error", message: res.error });
    } else {
      setToast({ type: "success", message: "Fast Track SLA configurations updated successfully!" });
      setEditing(false);
      await loadSLA();
    }
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300/80 bg-white p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Zap className="h-5 w-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Fast Track SLA &amp; Turnaround Deadlines</h2>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Priority Countdown
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Configure maximum turnaround days and day-type for Fast Track applications per service. These are global — not per state.
            </p>
          </div>
        </div>

        <div>
          {!editing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Fast Track SLAs
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : "Save all"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`rounded-xl p-3.5 text-sm font-medium flex items-center gap-2 ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading Fast Track SLA config…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {FAST_TRACK_SERVICES.map((s) => {
            const it = getServiceItem(s.key);

            return (
              <div
                key={s.key}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between gap-3 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">{s.label}</span>
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  {editing ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 font-medium">Max days</span>
                        <input
                          type="number"
                          min="1"
                          value={formValues[s.key]?.expected_days ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormValues((prev) => ({
                              ...prev,
                              [s.key]: { ...(prev[s.key] || {}), expected_days: val },
                            }));
                          }}
                          className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 font-medium">Day type</span>
                        <select
                          value={formValues[s.key]?.day_type ?? "business_days"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormValues((prev) => ({
                              ...prev,
                              [s.key]: { ...(prev[s.key] || {}), day_type: val },
                            }));
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="business_days">Business days</option>
                          <option value="calendar_days">Calendar days</option>
                          <option value="hours">Hours</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 font-medium">Warning at %</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formValues[s.key]?.warning_threshold_percent ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormValues((prev) => ({
                              ...prev,
                              [s.key]: { ...(prev[s.key] || {}), warning_threshold_percent: val },
                            }));
                          }}
                          className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none text-right"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Turnaround</span>
                        <span className="font-mono font-bold text-sm text-amber-900">
                          {it.expected_days} {it.day_type === "hours" ? "hours" : it.day_type === "calendar_days" ? "calendar days" : "business days"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Warning threshold</span>
                        <span className="text-xs font-semibold text-slate-700">{it.warning_threshold_percent ?? 75}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
