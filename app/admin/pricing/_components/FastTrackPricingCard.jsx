"use client";

import { useState, useEffect } from "react";
import { Zap, Pencil, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import {
  getAdminFastTrackPricing,
  updateAdminFastTrackPricing,
  koboToNaira,
} from "@/lib/api";

const FAST_TRACK_SERVICES = [
  {
    key: "vehicle_particulars",
    label: "Vehicle Particulars",
    desc: "Expedited processing for vehicle particulars renewal & registration",
  },
  {
    key: "tinted_permit",
    label: "Tinted Permit",
    desc: "Expedited processing for police tinted glass permit",
  },
  {
    key: "number_plate_new",
    label: "New Number Plate",
    desc: "Expedited standard new plate issuance",
  },
  {
    key: "number_plate_replacement",
    label: "Plate Replacement",
    desc: "Expedited plate reissue for damaged or lost plates",
  },
  {
    key: "number_plate_change_of_ownership",
    label: "Change of Ownership Plate",
    desc: "Expedited plate transfer & vehicle reassignment",
  },
  {
    key: "number_plate_fancy",
    label: "Fancy / Custom Plate",
    desc: "Expedited personalized plate number issuance",
  },
  {
    key: "number_plate_dealership",
    label: "Dealership Plate",
    desc: "Expedited commercial auto-dealer plate processing",
  },
  {
    key: "vehicle_verification",
    label: "Vehicle Verification",
    desc: "Expedited multi-agency ownership and history verification",
  },
  {
    key: "central_motor_registry",
    label: "Electronic Central Motor Registry (eCMR)",
    desc: "Expedited police motor registry document processing",
  },
  {
    key: "roadworthiness_express",
    label: "Roadworthiness Express",
    desc: "Priority inspection slot and certificate dispatch",
  },
  {
    key: "physical_condition_inspection",
    label: "Physical Condition Inspection",
    desc: "Priority mechanic visit and comprehensive report generation",
  },
];

export default function FastTrackPricingCard({ stateId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const loadPricing = async () => {
    setLoading(true);
    const res = await getAdminFastTrackPricing();
    if (Array.isArray(res.data)) {
      setItems(res.data);
    } else {
      setItems([]);
      if (res.error) {
        setToast({
          type: "error",
          message: "Could not load Fast Track pricing.",
        });
        setTimeout(() => setToast(null), 4000);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPricing();
  }, [stateId]);

  const currentScopeItems = items.filter((it) => {
    if (stateId == null) return it.state_id == null;
    return it.state_id === stateId;
  });

  const getServicePriceKobo = (serviceKey) => {
    const item = currentScopeItems.find((it) => it.service_name === serviceKey);
    if (item != null) return item.surcharge_kobo;
    if (stateId != null) {
      const generalItem = items.find(
        (it) => it.service_name === serviceKey && it.state_id == null,
      );
      if (generalItem != null) return generalItem.surcharge_kobo;
    }
    return 500000;
  };

  const getServiceActive = (serviceKey) => {
    const item = currentScopeItems.find((it) => it.service_name === serviceKey);
    if (item != null) return item.is_active;
    if (stateId != null) {
      const generalItem = items.find(
        (it) => it.service_name === serviceKey && it.state_id == null,
      );
      if (generalItem != null) return generalItem.is_active;
    }
    return true;
  };

  const handleStartEdit = () => {
    const initial = {};
    FAST_TRACK_SERVICES.forEach((s) => {
      initial[s.key] = {
        naira: (getServicePriceKobo(s.key) / 100).toString(),
        is_active: getServiceActive(s.key),
      };
    });
    setFormValues(initial);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payloadItems = FAST_TRACK_SERVICES.map((s) => {
      const val = formValues[s.key] || {};
      const amountNaira = parseFloat(val.naira) || 0;
      return {
        service_type: s.key, // was: service_name
        state_id: stateId ?? null,
        price_kobo: Math.round(amountNaira * 100), // was: surcharge_kobo
        is_active: val.is_active ?? true,
      };
    });

    const res = await updateAdminFastTrackPricing(payloadItems);
    setSaving(false);
    if (res.error) {
      setToast({ type: "error", message: res.error });
    } else {
      setToast({
        type: "success",
        message: "Fast Track surcharges updated successfully!",
      });
      setEditing(false);
      await loadPricing();
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
              <h2 className="text-lg font-bold text-slate-900">
                Fast Track Surcharges
              </h2>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Expedited Processing
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Configure the extra fee charged to customers who choose Fast
              Track. Urgent applications bypass standard queues.
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
              <Pencil className="h-3.5 w-3.5" /> Edit surcharges
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
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saving ? "Saving…" : "Save all"}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-xl p-3.5 text-sm font-medium flex items-center gap-2 ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading Fast Track pricing…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {FAST_TRACK_SERVICES.map((s) => {
            const priceKobo = getServicePriceKobo(s.key);
            const active = getServiceActive(s.key);

            return (
              <div
                key={s.key}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between gap-3 hover:border-amber-200 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {s.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (editing ? formValues[s.key]?.is_active : active)
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {(editing ? formValues[s.key]?.is_active : active)
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Surcharge fee
                  </span>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          ₦
                        </span>
                        <input
                          type="number"
                          value={formValues[s.key]?.naira ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormValues((prev) => ({
                              ...prev,
                              [s.key]: { ...(prev[s.key] || {}), naira: val },
                            }));
                          }}
                          className="w-28 rounded-lg border border-slate-300 bg-white pl-6 pr-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer select-none text-xs font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={formValues[s.key]?.is_active ?? true}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormValues((prev) => ({
                              ...prev,
                              [s.key]: {
                                ...(prev[s.key] || {}),
                                is_active: checked,
                              },
                            }));
                          }}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                        />
                      </label>
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-sm text-amber-900">
                      {koboToNaira(priceKobo)}
                    </span>
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
