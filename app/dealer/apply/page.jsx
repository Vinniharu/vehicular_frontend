"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { dealerApply, dealerListCategories, getReferenceStates } from "@/lib/api";

const BRAND = "#28A745";
const inputBase = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";
const btnPrimary = "w-full h-11 rounded-xl font-semibold text-[13.5px] flex items-center justify-center gap-2 text-white transition-all active:scale-[0.99] disabled:opacity-60";

export default function DealerApplyPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    business_name: "", registration_number: "",
    market_state_id: "",
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dealerListCategories().then((res) => {
      if (Array.isArray(res.data)) setCategories(res.data);
    });
    getReferenceStates().then((res) => {
      if (Array.isArray(res.data)) setStates(res.data);
    });
  }, []);

  const toggleCategory = (slug) => {
    setSelectedCategories((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.business_name.trim() || !form.market_state_id) {
      setError("Please fill in your name, email, password, business name, and market state.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Select at least one spare-part category you deal in.");
      return;
    }

    setSubmitting(true);
    const res = await dealerApply({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
      business_name: form.business_name.trim(),
      registration_number: form.registration_number.trim() || undefined,
      categories: selectedCategories,
      market_state_id: parseInt(form.market_state_id, 10),
    });
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-[19px] font-bold text-[#111111]">Application submitted</h1>
          <p className="mt-2 text-[13.5px] text-slate-500 leading-relaxed">
            Our staff will review your application shortly. You'll be able to sign in once your account is approved.
          </p>
          <Link href="/dealer/login" className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl text-[13.5px] font-semibold text-white" style={{ background: BRAND }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #28A745, #0a7a56)" }}>
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-[#111111] tracking-tight">Apply as a Vehiculars Dealer</h1>
          <p className="mt-1.5 text-[13px] text-slate-500 max-w-sm">
            Sell genuine spare parts to matched customers. We review every application before granting access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] leading-relaxed bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Your full name</label>
              <input className={inputBase} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className={fieldLabel}>Phone</label>
              <input className={inputBase} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Email address</label>
            <input type="email" className={inputBase} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div>
            <label className={fieldLabel}>Password</label>
            <input type="password" className={inputBase} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Business name</label>
              <input className={inputBase} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
            </div>
            <div>
              <label className={fieldLabel}>Registration number (optional)</label>
              <input className={inputBase} value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Market state</label>
            <select className={inputBase} value={form.market_state_id} onChange={(e) => setForm({ ...form, market_state_id: e.target.value })} required>
              <option value="">Select a state</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabel}>Categories you deal in</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = selectedCategories.includes(c.slug);
                return (
                  <button
                    type="button"
                    key={c.slug}
                    onClick={() => toggleCategory(c.slug)}
                    className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all"
                    style={{
                      background: active ? BRAND : "#f1f5f9",
                      color: active ? "#fff" : "#475569",
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={submitting} className={btnPrimary} style={{ background: BRAND }}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit application"}
          </button>

          <p className="text-center text-[12.5px] text-slate-500">
            Already have an account?{" "}
            <Link href="/dealer/login" className="font-semibold" style={{ color: BRAND }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
