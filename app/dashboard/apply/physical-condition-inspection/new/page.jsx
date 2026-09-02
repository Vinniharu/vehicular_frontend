"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Car,
  Wrench,
  MapPin,
  Upload,
} from "lucide-react";
import {
  getReferenceStates,
  getReferenceLgas,
  getServicePricing,
  submitPhysicalConditionInspectionApplication,
  uploadApplicationFile,
  payFromWalletEndpoint,
  getWallet,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";
const STEP_LABELS = ["Whose vehicle", "Category & schedule", "Review & pay"];
const PCI_SLUG = "physical-condition-inspection";

const REASONS = [
  { value: "pre_purchase", label: "Pre-purchase check" },
  { value: "periodic_health_check", label: "Periodic health check" },
  { value: "dispute", label: "Dispute" },
  { value: "other", label: "Other" },
];

function todayPlusDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PhysicalConditionInspectionNewApplicationPage() {
  const router = useRouter();
  const { draftFormData, hydrated, save, clearDraft, markSubmitting } = useApplicationDraft("physical_condition_inspection");

  const [step, setStep] = useState(1);

  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [servicePrices, setServicePrices] = useState(null);

  const [wholeVehicle, setWholeVehicle] = useState("mine");
  const [form, setForm] = useState({
    plate_number: "", make: "", model: "", year: "", mileage: "",
    seller_name: "", seller_phone: "",
    vehicle_category: "", state_id: "", lga_id: "",
    location_address: "", preferred_date: todayPlusDaysIso(2), preferred_time: "",
    reason: "pre_purchase",
  });

  const [supportingDoc, setSupportingDoc] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [payOpts, setPayOpts] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    Promise.all([getReferenceStates(), getWallet()]).then(([statesRes, walletRes]) => {
      if (statesRes.data) setStates(statesRes.data);
      if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !draftFormData) return;
    if (draftFormData.wholeVehicle) setWholeVehicle(draftFormData.wholeVehicle);
    if (draftFormData.form) setForm((f) => ({ ...f, ...draftFormData.form }));
    if (draftFormData.supportingDoc) setSupportingDoc(draftFormData.supportingDoc);
    if (draftFormData.step) setStep(draftFormData.step);
  }, [hydrated, draftFormData]);

  useEffect(() => {
    if (!form.state_id) { setLgas([]); setForm((f) => ({ ...f, lga_id: "" })); return; }
    getReferenceLgas(form.state_id).then((res) => {
      if (res.data) setLgas(res.data);
    });
  }, [form.state_id]);

  // Flat, state-tiered price (ServicePrice, not vehicle-category-based) —
  // same public endpoint RWX/CMR use. Falls back to the general tier before
  // a state is picked, so a price shows as soon as possible.
  useEffect(() => {
    getServicePricing(form.state_id || undefined).then((res) => {
      if (res.data?.prices) setServicePrices(res.data.prices);
    });
  }, [form.state_id]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleDocUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploadingDoc(true);
    const { data, error } = await uploadApplicationFile(file);
    setUploadingDoc(false);
    if (error || !data?.file_url) {
      setUploadError(error || "Upload failed. Please try again.");
      return;
    }
    setSupportingDoc({ fileName: file.name, url: data.file_url });
  };

  const priceKobo = useMemo(() => {
    if (!servicePrices) return null;
    return servicePrices.find((p) => p.slug === PCI_SLUG)?.amount_kobo ?? null;
  }, [servicePrices]);

  const isThirdParty = wholeVehicle === "other";

  const validateStep1 = () => {
    const errors = {};
    if (!form.plate_number.trim()) errors.plate_number = "Plate number is required.";
    if (!form.make.trim()) errors.make = "Make is required.";
    if (!form.model.trim()) errors.model = "Model is required.";
    if (!form.year.trim()) errors.year = "Year is required.";
    if (isThirdParty) {
      if (!form.seller_name.trim()) errors.seller_name = "Seller/owner name is required.";
      if (!form.seller_phone.trim()) errors.seller_phone = "Seller/owner phone is required.";
    }
    return errors;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!form.vehicle_category) errors.vehicle_category = "Select a vehicle category.";
    if (!form.state_id) errors.state_id = "Select a state.";
    if (!form.lga_id) errors.lga_id = "Select an LGA.";
    if (!form.location_address.trim()) errors.location_address = "Tell us where the inspector should meet you.";
    if (!form.preferred_date) errors.preferred_date = "Select a preferred date.";
    if (!form.reason) errors.reason = "Select a reason.";
    return errors;
  };

  const goNext = () => {
    const errors = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const nextStep = step + 1;
    setStep(nextStep);
    save({ wholeVehicle, form, supportingDoc, step: nextStep }, `Step ${nextStep} of ${STEP_LABELS.length}`);
  };

  const canSubmit = Object.keys(validateStep1()).length === 0 && Object.keys(validateStep2()).length === 0;

  const handleSubmit = async () => {
    const errors = { ...validateStep1(), ...validateStep2() };
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStep(Object.keys(validateStep1()).length > 0 ? 1 : 2);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    markSubmitting();
    const res = await submitPhysicalConditionInspectionApplication({
      state_id: Number(form.state_id),
      lga_id: Number(form.lga_id),
      whose_vehicle: wholeVehicle,
      plate_number: form.plate_number.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      mileage: form.mileage.trim() || undefined,
      vehicle_category: form.vehicle_category,
      seller_name: isThirdParty ? form.seller_name.trim() : undefined,
      seller_phone: isThirdParty ? form.seller_phone.trim() : undefined,
      location_address: form.location_address.trim(),
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time.trim() || undefined,
      reason: form.reason,
      supporting_document: supportingDoc ? { doc_type: "pci_supporting_document", file_url: supportingDoc.url } : undefined,
    });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    await clearDraft();
    setSuccessApp(res.data);
    setPayOpts(res.data.payment_options || null);
  };

  const handlePayFromWallet = async () => {
    if (!successApp) return;
    setPayingFromWallet(true);
    const res = await payFromWalletEndpoint(successApp.id, { amount_kobo: payOpts?.remaining_kobo ?? payOpts?.amount_kobo });
    setPayingFromWallet(false);
    if (res.error) return;
    const walletRes = await getWallet();
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    if (res.data?.is_fully_paid) {
      router.push("/dashboard/applications");
    }
  };

  const isPaid = successApp ? (payOpts?.remaining_kobo ?? payOpts?.amount_kobo ?? 0) <= 0 : false;

  useEffect(() => {
    if (!successApp || isPaid) return;
    const checkPayment = async () => {
      const res = await getApplication(successApp.id);
      const opts = res.data?.payment_options;
      if (!opts) return;
      const remaining = opts.remaining_kobo ?? opts.amount_kobo ?? 0;
      if (remaining <= 0) {
        router.push("/dashboard/applications");
      } else {
        setPayOpts(opts);
      }
    };
    window.addEventListener("focus", checkPayment);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkPayment();
    });
    return () => {
      window.removeEventListener("focus", checkPayment);
    };
  }, [successApp, isPaid, router]);

  if (successApp) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: BRAND_TINT }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: BRAND }} />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Inspection booked</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            Complete payment and our team will assign an inspector near you.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Total</span>
              <span className="font-mono font-bold text-[#111111]">{koboToNaira(payOpts?.amount_kobo ?? priceKobo ?? 0)}</span>
            </div>
          </div>

          {!isPaid && payOpts && (
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handlePayFromWallet}
                disabled={payingFromWallet || walletBalance < (payOpts.remaining_kobo ?? payOpts.amount_kobo ?? 0)}
                className={`${btnPrimary} w-full`}
                style={{ background: BRAND }}
              >
                {payingFromWallet && <Loader2 className="h-4 w-4 animate-spin" />}
                Pay full amount from wallet ({koboToNaira(walletBalance)} available)
              </button>
              {payOpts.checkout_url && (
                <a href={payOpts.checkout_url} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} w-full`}>
                  Card or Transfer
                </a>
              )}
            </div>
          )}

          <button type="button" onClick={() => router.push("/dashboard/applications")} className={`${btnSecondary} mt-6 w-full`}>
            Back to applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <button onClick={() => router.push("/dashboard/services")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Physical Condition Inspection</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          A full mechanical health check before you buy — engine, body, underbody, interior, and a road test, graded and reported.
        </p>
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {step === 1 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
              <Car className="h-4 w-4" style={{ color: BRAND }} /> Whose vehicle is this?
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                { value: "mine", label: "Mine", desc: "I own this vehicle." },
                { value: "other", label: "Someone else's", desc: "Pre-purchase — inspecting a seller's vehicle." },
              ].map((opt) => {
                const active = wholeVehicle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWholeVehicle(opt.value)}
                    className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-all"
                    style={{ borderColor: active ? BRAND : "#e2e8f0", background: active ? BRAND_TINT : "#fff" }}
                  >
                    <span className="text-[13.5px] font-semibold text-[#111111]">{opt.label}</span>
                    <span className="text-[12px] text-slate-500">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isThirdParty && (
            <div>
              <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Seller / owner contact</h2>
              <p className="mb-2 text-[12px] text-slate-500">Kept private from the inspector — only used to coordinate the visit.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Seller/owner name</label>
                  <input className={`${inputBase} ${errInputClass(!!fieldErrors.seller_name)}`} name="seller_name" value={form.seller_name} onChange={handleChange} />
                  <FieldError message={fieldErrors.seller_name} />
                </div>
                <div>
                  <label className={label}>Seller/owner phone</label>
                  <input className={`${inputBase} ${errInputClass(!!fieldErrors.seller_phone)}`} name="seller_phone" value={form.seller_phone} onChange={handleChange} />
                  <FieldError message={fieldErrors.seller_phone} />
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
              <Car className="h-4 w-4" style={{ color: BRAND }} /> Vehicle details
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Plate number</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.plate_number)}`} name="plate_number" value={form.plate_number} onChange={handleChange} />
                <FieldError message={fieldErrors.plate_number} />
              </div>
              <div>
                <label className={label}>Make</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.make)}`} name="make" value={form.make} onChange={handleChange} placeholder="e.g. Toyota" />
                <FieldError message={fieldErrors.make} />
              </div>
              <div>
                <label className={label}>Model</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.model)}`} name="model" value={form.model} onChange={handleChange} placeholder="e.g. Camry" />
                <FieldError message={fieldErrors.model} />
              </div>
              <div>
                <label className={label}>Year</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.year)}`} name="year" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="e.g. 2018" inputMode="numeric" />
                <FieldError message={fieldErrors.year} />
              </div>
              <div>
                <label className={label}>Mileage (optional)</label>
                <input className={inputBase} name="mileage" value={form.mileage} onChange={handleChange} placeholder="e.g. 45000" inputMode="numeric" />
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
              <Wrench className="h-4 w-4" style={{ color: BRAND }} /> Vehicle category
            </h2>
            <p className="mb-2 text-[12px] text-slate-500">Helps the mechanic know what to expect — the inspection fee is a flat rate and doesn't change with vehicle category.</p>
            <select className={`${inputBase} ${errInputClass(!!fieldErrors.vehicle_category)}`} name="vehicle_category" value={form.vehicle_category} onChange={handleChange}>
              <option value="">Select category</option>
              {VEHICLE_CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <FieldError message={fieldErrors.vehicle_category} />
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
              <MapPin className="h-4 w-4" style={{ color: BRAND }} /> Location & schedule
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>State</label>
                <select className={`${inputBase} ${errInputClass(!!fieldErrors.state_id)}`} name="state_id" value={form.state_id} onChange={handleChange}>
                  <option value="">Select state</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <FieldError message={fieldErrors.state_id} />
              </div>
              <div>
                <label className={label}>LGA</label>
                <select className={`${inputBase} ${errInputClass(!!fieldErrors.lga_id)}`} name="lga_id" value={form.lga_id} onChange={handleChange} disabled={!form.state_id}>
                  <option value="">Select LGA</option>
                  {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <FieldError message={fieldErrors.lga_id} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Where should the inspector meet you?</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.location_address)}`} name="location_address" value={form.location_address} onChange={handleChange} placeholder="House address, estate, or landmark" />
                <FieldError message={fieldErrors.location_address} />
              </div>
              <div>
                <label className={label}>Preferred date</label>
                <input type="date" min={todayPlusDaysIso(0)} className={`${inputBase} ${errInputClass(!!fieldErrors.preferred_date)}`} name="preferred_date" value={form.preferred_date} onChange={handleChange} />
                <FieldError message={fieldErrors.preferred_date} />
              </div>
              <div>
                <label className={label}>Preferred time (optional)</label>
                <select className={inputBase} name="preferred_time" value={form.preferred_time} onChange={handleChange}>
                  <option value="">Any time</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Reason for inspection</label>
                <select className={`${inputBase} ${errInputClass(!!fieldErrors.reason)}`} name="reason" value={form.reason} onChange={handleChange}>
                  {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <FieldError message={fieldErrors.reason} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Documents to check (optional)</h2>
            {supportingDoc?.url ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-3">
                <p className="truncate text-[12.5px] font-semibold text-[#111111]">{supportingDoc.fileName}</p>
                <button type="button" onClick={() => setSupportingDoc(null)} className="shrink-0 text-[11.5px] font-semibold text-red-600">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
                {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingDoc ? "Uploading…" : "Click to upload"}
                <input type="file" accept="image/*,application/pdf" disabled={uploadingDoc} onChange={(e) => handleDocUpload(e.target.files?.[0])} className="hidden" />
              </label>
            )}
            <FieldError message={uploadError} />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Review your booking</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Whose vehicle</span>
                <span className="font-semibold text-[#111111]">{isThirdParty ? "Someone else's" : "Mine"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-[#111111]">{form.make} {form.model} — {form.plate_number}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-[#111111]">{VEHICLE_CATEGORY_OPTIONS.find((c) => c.value === form.vehicle_category)?.label}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Meeting location</span>
                <span className="font-semibold text-[#111111]">{form.location_address}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Preferred date</span>
                <span className="font-semibold text-[#111111]">{form.preferred_date}{form.preferred_time ? ` (${form.preferred_time})` : ""}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Reason</span>
                <span className="font-semibold text-[#111111]">{REASONS.find((r) => r.value === form.reason)?.label}</span>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-[13.5px] font-bold text-[#111111]">Payment</h2>
            {priceKobo != null ? (
              <p className="text-[20px] font-bold text-[#111111]">Total: {koboToNaira(priceKobo)}</p>
            ) : (
              <p className="text-[13px] font-semibold text-amber-700">Not yet priced — contact support.</p>
            )}
          </section>

          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}

          <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit || priceKobo == null} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit & continue to payment"}
          </button>
        </section>
      )}

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => { const prev = step - 1; setStep(prev); save({ wholeVehicle, form, supportingDoc, step: prev }, `Step ${prev} of ${STEP_LABELS.length}`); }} className={btnSecondary}>Back</button>
        ) : <span />}
        {step < 3 && (
          <button type="button" onClick={goNext} className={btnPrimary} style={{ background: BRAND }}>Continue</button>
        )}
      </div>
    </div>
  );
}
