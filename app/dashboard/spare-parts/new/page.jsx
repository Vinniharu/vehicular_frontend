"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { sparePartsCreateRequest, sparePartsListCategories, getReferenceStates } from "@/lib/api";

const BRAND = "#28A745";
const inputBase = "w-full rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";

export default function NewSparePartRequestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState({
    vehicle_make: "", vehicle_model: "", vehicle_year: "", part_name: "", description: "",
    category_slug: "", photo_url: "", state_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    sparePartsListCategories().then((res) => { if (Array.isArray(res.data)) setCategories(res.data); });
    getReferenceStates().then((res) => { if (Array.isArray(res.data)) setStates(res.data); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.vehicle_make || !form.vehicle_model || !form.vehicle_year || !form.part_name || !form.category_slug || !form.state_id) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const res = await sparePartsCreateRequest({
      ...form,
      photo_url: form.photo_url || null,
      state_id: parseInt(form.state_id, 10),
    });
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/dashboard/spare-parts/${res.data.id}`);
  };

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/dashboard/spare-parts" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Spare Parts
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Post a spare part request</h1>
        <p className="mt-1 text-[13.5px] text-[#7A7A7A]">Matched dealers will see this and start bidding.</p>
      </div>

      {error && (
        <div className="rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] leading-relaxed bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>Make</label>
            <input className={inputBase} value={form.vehicle_make} onChange={(e) => setForm({ ...form, vehicle_make: e.target.value })} placeholder="Toyota" required />
          </div>
          <div>
            <label className={fieldLabel}>Model</label>
            <input className={inputBase} value={form.vehicle_model} onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} placeholder="Camry" required />
          </div>
          <div>
            <label className={fieldLabel}>Year</label>
            <input className={inputBase} value={form.vehicle_year} onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })} placeholder="2015" required />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Part name</label>
          <input className={inputBase} value={form.part_name} onChange={(e) => setForm({ ...form, part_name: e.target.value })} placeholder="Radiator" required />
        </div>

        <div>
          <label className={fieldLabel}>Description (optional)</label>
          <textarea className={inputBase} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Any extra detail that helps dealers quote accurately" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>Category</label>
            <select className={inputBase} value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })} required>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Your state</label>
            <select className={inputBase} value={form.state_id} onChange={(e) => setForm({ ...form, state_id: e.target.value })} required>
              <option value="">Select a state</option>
              {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Photo URL (optional)</label>
          <input className={inputBase} value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
        </div>

        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Posting…" : "Post request"}
        </button>
      </form>
    </div>
  );
}
