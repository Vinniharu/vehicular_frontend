"use client";

import { useState, useEffect } from "react";
import { Zap, Pencil, Save, X, Loader2, CheckCircle2, Clock } from "lucide-react";
import { getAdminFastTrackSLA, updateAdminFastTrackSLA } from "@/lib/api";

const FAST_TRACK_SERVICES = [
  { key: "vehicle_particulars", label: "Vehicle Particulars" },
  { key: "tinted_permit", label: "Tinted Permit" },
  { key: "number_plate_new", label: "New Number Plate" },
  { key: "number_plate_replacement", label: "Plate Replacement" },
  { key: "number_plate_change_of_ownership", label: "Change of Ownership Plate" },
  { key: "number_plate_fancy", label: "Fancy / Custom Plate" },
  { key: "number_plate_dealership", label: "Dealership Plate" },
  { key: "vehicle_verification", label: "Vehicle Verification" },
  { key: "central_motor_registry", label: "Electronic Central Motor Registry (eCMR)" },
  { key: "roadworthiness_express", label: "Roadworthiness Express" },
  { key: "physical_condition_inspection", label: "Physical Condition Inspection" },
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
    if (res.data) {
      setItems(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSLA();
  }, [stateId]);

  const currentScopeItems = items.filter((it) => {
    if (stateId == null) return it.state_id == null;
    return it.state_id === stateId;
  });

  const getServiceItem = (serviceKey) => {
    const item = currentScopeItems.find((it) => it.service_name === serviceKey);
    if (item != null) return item;
    if (stateId != null) {
      const gen = items.find((it) => it.service_name === serviceKey && it.state_id == null);
      if (gen != null) return gen;
    }
    return {
      turnaround_hours: 48,
      turnaround_label: "24–48 hours",
      standard_turnaround_label: "3–5 business days",
    };
  };

  const handleStartEdit = () => {
    const initial = {};
    FAST_TRACK_SERVICES.forEach((s) => {
      const it = getServiceItem(s.key);
      initial[s.key] = {
        turnaround_hours: it.turnaround_hours ?? 48,
        turnaround_label: it.turnaround_label ?? "24–48 hours",
        standard_turnaround_label: it.standard_turnaround_label ?? "3–5 business days",
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
        service_name: s.key,
        state_id: stateId ?? null,
        turnaround_hours: parseInt(val.turnaround_hours, 10) || 48,
        turnaround_label: val.turnaround_label?.trim() || "24–48 hours",
        standard_turnaround_label: val.standard_turnaround_label?.trim() || "3–5 business days",
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
              <h2 className="text-lg font-bold text-slate-900">Fast Track SLA & Turnaround Deadlines</h2>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Priority Countdown
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Configure maximum turnaround hours and customer-facing turnaround promises for Fast Track applications.
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
          <span className="text-sm">Loading Fast Track SLAs…</span>
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
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900">{s.label}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md">
                      <Clock className="h-3 w-3 text-amber-700" />
                      {editing ? `${formValues[s.key]?.turnaround_hours ?? 48}h target` : `${it.turnaround_hours ?? 48}h target`}
                    </span>
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-0.5">SLA Target (Hours)</label>
                      <input
                        type="number"
                        value={formValues[s.key]?.turnaround_hours ?? 48}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormValues((prev) => ({
                            ...prev,
                            [s.key]: { ...(prev[s.key] || {}), turnaround_hours: val },
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono font-semibold text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Fast Track Turnaround Label</label>
                      <input
                        type="text"
                        value={formValues[s.key]?.turnaround_label ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormValues((prev) => ({
                            ...prev,
                            [s.key]: { ...(prev[s.key] || {}), turnaround_label: val },
                          }));
                        }}
                        placeholder="e.g. 24–48 hours"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Standard Turnaround Comparison</label>
                      <input
                        type="text"
                        value={formValues[s.key]?.standard_turnaround_label ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormValues((prev) => ({
                            ...prev,
                            [s.key]: { ...(prev[s.key] || {}), standard_turnaround_label: val },
                          }));
                        }}
                        placeholder="e.g. 3–5 business days"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Customer promise</span>
                    <span className="font-semibold text-slate-900">
                      {it.turnaround_label} <span className="text-slate-400 font-normal">(vs {it.standard_turnaround_label})</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
