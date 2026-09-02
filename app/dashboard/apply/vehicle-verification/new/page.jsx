"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Car,
  FileSearch,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  getReferenceStates,
  submitVehicleVerificationApplication,
  getDriverLicenceFeeSchedule,
  uploadApplicationFile,
  payFromWalletEndpoint,
  getWallet,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";
const STEP_LABELS = ["Vehicle & check", "Review & pay"];

const CHECK_TYPES = [
  {
    value: "registration_history",
    label: "Registration history",
    desc: "Is it registered, reported stolen, or carrying outstanding fines? Checked against the plate number.",
    icon: FileSearch,
  },
  {
    value: "customs_duty",
    label: "Customs duty",
    desc: "Confirm an imported vehicle's duty certificate is legitimate and complete.",
    icon: ShieldCheck,
  },
];

const REASONS = [
  { value: "pre_purchase", label: "Pre-purchase check" },
  { value: "dispute", label: "Dispute" },
  { value: "re_registration", label: "Re-registration" },
  { value: "other", label: "Other" },
];

export default function VehicleVerificationNewApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draftFormData, hydrated, save, clearDraft, markSubmitting } = useApplicationDraft("vehicle_verification");

  const [step, setStep] = useState(1);

  const [states, setStates] = useState([]);
  const [prices, setPrices] = useState(null);

  const [checkType, setCheckType] = useState("registration_history");
  const [form, setForm] = useState({
    plate_number: "", make: "", model: "", year: "", colour: "",
    chassis_number: "", state_id: "", reason: "pre_purchase",
  });

  const [certificate, setCertificate] = useState(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [payOpts, setPayOpts] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    Promise.all([getReferenceStates(), getDriverLicenceFeeSchedule(), getWallet()]).then(
      ([statesRes, feeRes, walletRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (feeRes.data?.prices) setPrices(feeRes.data.prices);
        if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
      }
    );
  }, []);

  // A resumed draft takes priority (it's exactly what the customer had);
  // only fall back to the ?type= URL param — set by the requirements-
  // preview page's "Start Application" CTA — once we know there's no draft.
  useEffect(() => {
    if (!hydrated) return;
    if (draftFormData) {
      if (draftFormData.checkType) setCheckType(draftFormData.checkType);
      if (draftFormData.form) setForm((f) => ({ ...f, ...draftFormData.form }));
      if (draftFormData.certificate) setCertificate(draftFormData.certificate);
      if (draftFormData.step) setStep(draftFormData.step);
      return;
    }
    const typeParam = searchParams.get("type");
    if (typeParam === "vehicle_verification_registration_history") setCheckType("registration_history");
    else if (typeParam === "vehicle_verification_customs_duty") setCheckType("customs_duty");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, draftFormData]);

  const applicationType = `vehicle_verification_${checkType}`;
  const priceKobo = useMemo(() => {
    if (!prices) return null;
    const row = prices.find((p) => p.application_type === applicationType);
    return row?.amount_kobo ?? null;
  }, [prices, applicationType]);

  const isCustomsDuty = checkType === "customs_duty";

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCertificateUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploadingCert(true);
    const { data, error } = await uploadApplicationFile(file);
    setUploadingCert(false);
    if (error || !data?.file_url) {
      setUploadError(error || "Upload failed. Please try again.");
      return;
    }
    setCertificate({ fileName: file.name, url: data.file_url });
  };

  const validateStep1 = () => {
    const errors = {};
    if (!form.plate_number.trim()) errors.plate_number = "Plate number is required.";
    if (!form.make.trim()) errors.make = "Make is required.";
    if (!form.model.trim()) errors.model = "Model is required.";
    if (!form.year.trim()) errors.year = "Year is required.";
    if (!form.colour.trim()) errors.colour = "Colour is required.";
    if (!form.state_id) errors.state_id = "Select a state.";
    if (!form.reason) errors.reason = "Select a reason.";
    if (isCustomsDuty) {
      if (!form.chassis_number.trim()) errors.chassis_number = "Chassis/VIN number is required for a customs duty check.";
      if (!certificate?.url) errors.certificate = "Upload your customs duty certificate/receipt.";
    }
    return errors;
  };

  const goNext = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep(2);
    save({ checkType, form, certificate, step: 2 }, "Step 2 of 2");
  };

  const canSubmit = Object.keys(validateStep1()).length === 0;

  const handleSubmit = async () => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStep(1);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    markSubmitting();
    const res = await submitVehicleVerificationApplication({
      state_id: Number(form.state_id),
      check_type: checkType,
      plate_number: form.plate_number.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      colour: form.colour.trim(),
      reason: form.reason,
      chassis_number: isCustomsDuty ? form.chassis_number.trim() : undefined,
      customs_duty_certificate: isCustomsDuty ? { doc_type: "customs_duty_certificate", file_url: certificate.url } : undefined,
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
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Verification submitted</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            Complete payment to have your check reviewed by an agent.
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
        <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Vehicle Verification</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Registration history or customs duty check — a Vehiculars agent reviews your submission and returns a documented verdict.
        </p>
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {step === 1 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
              <ShieldCheck className="h-4 w-4" style={{ color: BRAND }} /> Check type
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CHECK_TYPES.map((ct) => {
                const Icon = ct.icon;
                const active = checkType === ct.value;
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setCheckType(ct.value)}
                    className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-all"
                    style={{ borderColor: active ? BRAND : "#e2e8f0", background: active ? BRAND_TINT : "#fff" }}
                  >
                    <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#111111]">
                      <Icon className="h-4 w-4" style={{ color: active ? BRAND : "#94a3b8" }} /> {ct.label}
                    </span>
                    <span className="text-[12px] text-slate-500">{ct.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
                <label className={label}>Colour</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.colour)}`} name="colour" value={form.colour} onChange={handleChange} />
                <FieldError message={fieldErrors.colour} />
              </div>
              <div>
                <label className={label}>State</label>
                <select className={`${inputBase} ${errInputClass(!!fieldErrors.state_id)}`} name="state_id" value={form.state_id} onChange={handleChange}>
                  <option value="">Select state</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <FieldError message={fieldErrors.state_id} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Reason for check</label>
                <select className={`${inputBase} ${errInputClass(!!fieldErrors.reason)}`} name="reason" value={form.reason} onChange={handleChange}>
                  {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <FieldError message={fieldErrors.reason} />
              </div>
            </div>
          </div>

          {isCustomsDuty && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
                <FileSearch className="h-4 w-4" style={{ color: BRAND }} /> Customs duty certificate
              </h2>
              <div>
                <label className={label}>Chassis / VIN number</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.chassis_number)}`} name="chassis_number" value={form.chassis_number} onChange={handleChange} />
                <FieldError message={fieldErrors.chassis_number} />
              </div>
              <div className="mt-3">
                <label className={label}>Duty certificate or receipt</label>
                {certificate?.url ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-3">
                    <p className="truncate text-[12.5px] font-semibold text-[#111111]">{certificate.fileName}</p>
                    <button type="button" onClick={() => setCertificate(null)} className="shrink-0 text-[11.5px] font-semibold text-red-600">Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
                    {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingCert ? "Uploading…" : "Click to upload"}
                    <input type="file" accept="image/*,application/pdf" disabled={uploadingCert} onChange={(e) => handleCertificateUpload(e.target.files?.[0])} className="hidden" />
                  </label>
                )}
                <FieldError message={fieldErrors.certificate || uploadError} />
              </div>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Review your submission</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Check type</span>
                <span className="font-semibold text-[#111111]">{CHECK_TYPES.find((c) => c.value === checkType)?.label}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-[#111111]">{form.make} {form.model} — {form.plate_number}</span>
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
        {step === 2 ? (
          <button type="button" onClick={() => { setStep(1); save({ checkType, form, certificate, step: 1 }, "Step 1 of 2"); }} className={btnSecondary}>Back</button>
        ) : <span />}
        {step === 1 && (
          <button type="button" onClick={goNext} className={btnPrimary} style={{ background: BRAND }}>Continue</button>
        )}
      </div>
    </div>
  );
}
