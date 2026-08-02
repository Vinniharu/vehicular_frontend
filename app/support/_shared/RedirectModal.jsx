"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, MapPinOff } from "lucide-react";
import { getReferenceStates, getReferenceLgas, redirectSupportApplication } from "@/lib/api";

export default function RedirectModal({ application, onClose, onRedirected }) {
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [stateId, setStateId] = useState("");
  const [lgaId, setLgaId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res.data && Array.isArray(res.data)) setStates(res.data);
    });
  }, []);

  useEffect(() => {
    if (!stateId) { setLgas([]); setLgaId(""); return; }
    getReferenceLgas(stateId).then((res) => {
      if (res.data && Array.isArray(res.data)) setLgas(res.data);
    });
  }, [stateId]);

  if (!application) return null;

  const alreadyAssigned = !!application.assigned_agent;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stateId || !lgaId) {
      setError("Choose both a state and an LGA.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await redirectSupportApplication(application.id, {
      state_id: parseInt(stateId, 10),
      lga_id: parseInt(lgaId, 10),
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onRedirected?.(res.data);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MapPinOff className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900">Redirect application</h3>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                #{application.id} · {application.applicant_name} — currently {application.state_of_residence}/{application.lga}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {alreadyAssigned ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-[12.5px] text-amber-700 ring-1 ring-inset ring-amber-200">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            This application is already assigned to an agent — have staff/admin reassign it before redirecting.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">New state</label>
              <select
                value={stateId}
                onChange={(e) => { setStateId(e.target.value); setLgaId(""); }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-900 outline-none focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15"
              >
                <option value="" disabled>Choose a state...</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">New LGA</label>
              <select
                value={lgaId}
                onChange={(e) => setLgaId(e.target.value)}
                disabled={!stateId || lgas.length === 0}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-[13.5px] text-slate-900 outline-none focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15 disabled:opacity-60"
              >
                <option value="" disabled>{!stateId ? "Select a state first" : "Choose an LGA..."}</option>
                {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Redirecting…" : "Redirect application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
