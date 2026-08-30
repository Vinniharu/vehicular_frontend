"use client";

import { useState, useEffect } from "react";
import { Loader2, Copy, Globe2 } from "lucide-react";
import { clonePricing, getReferenceStates } from "@/lib/api";
import Modal from "@/app/dashboard/_shared/Modal";
import { SERVICE_SECTIONS } from "./_data/serviceSections";
import { PricingDataProvider } from "./_context/PricingDataContext";
import ServicePricingCard from "./_components/ServicePricingCard";

const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";

function StateSelectorBar({ states, selectedStateId, setSelectedStateId, onOpenClone }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#28A745]/10 text-[#28A745]">
          <Globe2 className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Pricing scope</label>
          <select
            value={selectedStateId}
            onChange={(e) => setSelectedStateId(e.target.value)}
            className="appearance-none bg-transparent text-sm font-semibold text-[#111111] focus:outline-none pr-6"
          >
            <option value="">General (all states)</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenClone}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
      >
        <Copy className="h-3.5 w-3.5" /> Clone services
      </button>
    </div>
  );
}

function CloneServicesModal({ open, onClose, states, defaultTargetStateId, onCloned }) {
  const [sourceStateId, setSourceStateId] = useState("");
  const [targetStateId, setTargetStateId] = useState(defaultTargetStateId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setSourceStateId("");
      setTargetStateId(defaultTargetStateId || "");
      setError(null);
    }
  }, [open, defaultTargetStateId]);

  const handleClone = async () => {
    if (!targetStateId) {
      setError("Choose a target state.");
      return;
    }
    if ((sourceStateId || null) === (targetStateId || null)) {
      setError("Source and target must be different.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await clonePricing({
      source_state_id: sourceStateId ? parseInt(sourceStateId, 10) : null,
      target_state_id: parseInt(targetStateId, 10),
    });
    setSaving(false);
    if (res.error) {
      setError("Could not clone pricing. Please try again.");
      return;
    }
    onCloned(res.data, parseInt(targetStateId, 10));
  };

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} title="Clone services">
      <div className="w-[min(92vw,26rem)] rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-[#111111]">Clone services</h3>
        <p className="mt-1 text-sm text-slate-500">
          Copy every price row — amount, financing fields, status, and priority — from one pricing scope into another.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <select value={sourceStateId} onChange={(e) => setSourceStateId(e.target.value)} className={inputCls}>
              <option value="">General (all states)</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <select value={targetStateId} onChange={(e) => setTargetStateId(e.target.value)} className={inputCls}>
              <option value="">Select a state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-3 text-[12.5px] text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClone}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="h-4 w-4" />} Clone
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPricingPage() {
  const [states, setStates] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(""); // "" = General
  const [cloneOpen, setCloneOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getReferenceStates().then((res) => {
      if (res.data) setStates(res.data);
    });
  }, []);

  const stateIdNum = selectedStateId ? parseInt(selectedStateId, 10) : null;
  const scopeKey = stateIdNum ?? "general";

  const handleCloned = (data, targetStateId) => {
    setCloneOpen(false);
    if (targetStateId === stateIdNum) {
      setReloadKey((k) => k + 1);
    } else {
      setSelectedStateId(String(targetStateId));
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[28px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            Pricing
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Set the price for every service in the catalogue — organized the same way customers see it — optionally overridden per state.
          </p>
        </div>
      </div>

      <StateSelectorBar
        states={states}
        selectedStateId={selectedStateId}
        setSelectedStateId={setSelectedStateId}
        onOpenClone={() => setCloneOpen(true)}
      />

      <PricingDataProvider stateId={stateIdNum} reloadKey={reloadKey}>
        <div className="space-y-4">
          {SERVICE_SECTIONS.map((section) => (
            // Scope-keyed so switching the state dropdown (or a Clone
            // Services reload) remounts every card, dropping any
            // in-progress local edit rather than letting a stale staged
            // payload get saved into the newly-selected scope.
            <ServicePricingCard key={`${scopeKey}:${section.slug}`} section={section} />
          ))}
        </div>
      </PricingDataProvider>

      <CloneServicesModal
        open={cloneOpen}
        onClose={() => setCloneOpen(false)}
        states={states}
        defaultTargetStateId={selectedStateId}
        onCloned={handleCloned}
      />
    </div>
  );
}
