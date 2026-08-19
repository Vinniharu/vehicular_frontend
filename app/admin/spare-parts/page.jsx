"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Loader2, Plus, X } from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  adminListSparePartCategories,
  adminCreateSparePartCategory,
  adminUpdateSparePartCategory,
} from "@/lib/api";

const BRAND = "#28A745";
const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm bg-slate-50 border border-[#E5E5E5] focus:outline-none focus:border-[#28A745] focus:ring-1 focus:ring-[#28A745]";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";

export default function AdminSparePartsPage() {
  const [toast, setToast] = useState(null);
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {toast && (
        <div className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border max-w-sm ${toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div>
        <h1 className="text-[28px] tracking-tight text-[#111111]" style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}>
          Spare Parts
        </h1>
        <p className="text-sm text-[#7A7A7A] mt-1">Commitment fee and category management for the Spare Parts marketplace.</p>
      </div>

      <CommitmentFeeSection showToast={showToast} />
      <CategoriesSection showToast={showToast} />
    </div>
  );
}

function CommitmentFeeSection({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feeNaira, setFeeNaira] = useState("");

  useEffect(() => {
    getAdminSettings().then((res) => {
      if (res.data) {
        setFeeNaira(res.data.spare_parts_commitment_fee_kobo != null ? (res.data.spare_parts_commitment_fee_kobo / 100).toString() : "");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateAdminSettings({
      spare_parts_commitment_fee_kobo: feeNaira ? Math.round(parseFloat(feeNaira) * 100) : null,
    });
    setSaving(false);
    if (res.error) showToast("error", res.error);
    else showToast("success", "Commitment fee updated.");
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-[#111111]">Commitment fee</h2>
        <p className="mt-1 text-[12.5px] text-slate-500">
          A soft ledger amount recorded on every escrow — never automatically debited from a dealer. Used only as a
          reference figure when staff manually intervene against a dealer who ghosts a committed order.
        </p>
      </div>
      <div className="max-w-xs">
        <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Amount (₦)</label>
        <input type="number" min="0" className={inputCls} value={feeNaira} onChange={(e) => setFeeNaira(e.target.value)} placeholder="2000" />
      </div>
      <button type="submit" disabled={saving} className={btnPrimary} style={{ background: BRAND }}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save
      </button>
    </form>
  );
}

function CategoriesSection({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await adminListSparePartCategories();
    if (Array.isArray(res.data)) setCategories(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSlug.trim() || !newName.trim()) return;
    setSaving(true);
    const res = await adminCreateSparePartCategory({ slug: newSlug.trim().toLowerCase().replace(/\s+/g, "_"), name: newName.trim() });
    setSaving(false);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    setNewSlug("");
    setNewName("");
    setShowAdd(false);
    load();
  };

  const toggleActive = async (category) => {
    setTogglingId(category.id);
    const res = await adminUpdateSparePartCategory(category.id, { active: !category.active });
    setTogglingId(null);
    if (res.error) {
      showToast("error", res.error);
      return;
    }
    load();
  };

  return (
    <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-[#111111]">Categories</h2>
          <p className="mt-1 text-[12.5px] text-slate-500">Inactive categories are hidden from customers and dealers.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add category"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="flex items-end gap-3 rounded-xl bg-slate-50 p-4">
          <div className="flex-1">
            <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">Slug</label>
            <input className={inputCls} value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="exhaust" required />
          </div>
          <div className="flex-1">
            <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">Display name</label>
            <input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Exhaust Systems" required />
          </div>
          <button type="submit" disabled={saving} className={btnPrimary} style={{ background: BRAND }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : (
        <div className="divide-y divide-slate-100">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">{c.name}</p>
                <p className="text-[11.5px] font-mono text-slate-400">{c.slug}</p>
              </div>
              <button
                onClick={() => toggleActive(c)}
                disabled={togglingId === c.id}
                className="rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all disabled:opacity-50"
                style={{ background: c.active ? "#ecfdf5" : "#f1f5f9", color: c.active ? "#047857" : "#64748b" }}
              >
                {c.active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
