"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Plus,
  Car,
  Wallet,
} from "lucide-react";
import {
  getReferenceStates,
  listVehicles,
  createVehicle,
  submitCentralMotorRegistryApplication,
  payFromWalletEndpoint,
  getWallet,
  getServicePricing,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import UploadSlot from "@/app/components/dashboard/UploadSlot";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";
const NIN_RE = /^\d{11}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEP_LABELS = ["Vehicle", "Your details", "Document", "Review & submit"];
const DOC_STEP = 3;
const REVIEW_STEP = 4;

const DOC_SLOT = {
  doc_type: "vehicle_licence",
  title: "Vehicle Licence",
  hint: "A clear photo or scan of the vehicle licence document",
  image: "/placeholder/vehicle.jpeg",
};

export default function CentralMotorRegistryNewApplicationPage() {
  const router = useRouter();
  const { draftFormData, hydrated: draftHydrated, save: saveDraft, clearDraft, markSubmitting } = useApplicationDraft("central_motor_registry");
  const [draftRestored, setDraftRestored] = useState(false);

  const [states, setStates] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [addingVehicle, setAddingVehicle] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "", make: "", model: "", colour: "", year: "", chassis_number: "", engine_number: "", state_id: "", vehicle_category: "",
  });
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [vehicleFieldErrors, setVehicleFieldErrors] = useState({});

  const [selectedStateId, setSelectedStateId] = useState("");
  const [nin, setNin] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [doc, setDoc] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [feeKobo, setFeeKobo] = useState(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [payOpts, setPayOpts] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    Promise.all([getReferenceStates(), listVehicles(), getWallet()]).then(
      ([statesRes, vehiclesRes, walletRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
          if (vehiclesRes.data.length > 0) setSelectedVehicleId(vehiclesRes.data[0].id);
          else setAddingVehicle(true);
        } else {
          setAddingVehicle(true);
        }
        if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
        setLoadingVehicles(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore an in-progress draft once (after the initial GET resolves) —
  // guarded by draftRestored so it never re-applies on a later re-render.
  useEffect(() => {
    if (!draftHydrated || draftRestored) return;
    if (draftFormData) {
      if (draftFormData.selectedVehicleId != null) setSelectedVehicleId(draftFormData.selectedVehicleId);
      if (draftFormData.selectedStateId) setSelectedStateId(draftFormData.selectedStateId);
      if (draftFormData.nin) setNin(draftFormData.nin);
      if (draftFormData.applicantEmail) setApplicantEmail(draftFormData.applicantEmail);
      if (draftFormData.doc) setDoc(draftFormData.doc);
      if (draftFormData.step) setStep(draftFormData.step);
    }
    setDraftRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftHydrated, draftFormData]);

  const buildDraftSnapshot = (targetStep) => ({
    selectedVehicleId, selectedStateId, nin, applicantEmail, doc, step: targetStep,
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  // Flat, state-aware price (not vehicle-category-based) — reads the same
  // public flat-price endpoint the /pricing calculator uses (GET
  // /pricing/services), filtered to this service.
  useEffect(() => {
    if (!selectedStateId) return;
    getServicePricing(Number(selectedStateId)).then((res) => {
      const row = res.data?.prices?.find((p) => p.slug === "central-motor-registry");
      setFeeKobo(row?.amount_kobo ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStateId]);

  const handleCreateVehicle = async () => {
    const errors = {};
    if (vehicleForm.plate_number.trim() && !/^[A-Za-z0-9-]{4,15}$/.test(vehicleForm.plate_number.trim())) {
      errors.plate_number = "Use 4-15 letters, digits, or hyphens, or leave blank.";
    }
    if (!vehicleForm.make.trim()) errors.make = "Make is required.";
    if (!vehicleForm.model.trim()) errors.model = "Model is required.";
    if (!vehicleForm.colour.trim()) errors.colour = "Colour is required.";
    if (!vehicleForm.state_id) errors.state_id = "Select a state.";
    if (Object.keys(errors).length > 0) {
      setVehicleFieldErrors(errors);
      return;
    }
    setVehicleFieldErrors({});
    setCreatingVehicle(true);
    const res = await createVehicle({
      ...vehicleForm,
      plate_number: vehicleForm.plate_number.trim() || undefined,
      vehicle_category: vehicleForm.vehicle_category || undefined,
      year: vehicleForm.year ? Number(vehicleForm.year) : undefined,
      state_id: Number(vehicleForm.state_id),
    });
    setCreatingVehicle(false);
    if (res.error) {
      setVehicleFieldErrors({ plate_number: res.error });
      return;
    }
    setVehicles((prev) => [res.data, ...prev]);
    setSelectedVehicleId(res.data.id);
    setAddingVehicle(false);
  };

  const validateStep = (n) => {
    const errors = {};
    if (n === 1) {
      if (!selectedVehicleId) errors.vehicle = "Pick a vehicle, or add one, to continue.";
    }
    if (n === 2) {
      if (!selectedStateId) errors.state = "Select the state to register in.";
      if (!nin.trim()) errors.nin = "NIN is required.";
      else if (!NIN_RE.test(nin.trim())) errors.nin = "NIN must be exactly 11 digits.";
      if (!applicantEmail.trim()) errors.applicant_email = "Email is required.";
      else if (!EMAIL_RE.test(applicantEmail.trim())) errors.applicant_email = "Enter a valid email address.";
    }
    if (n === DOC_STEP) {
      if (!doc?.url) errors.documents = "Upload the vehicle licence document to continue.";
    }
    return errors;
  };

  const goNext = () => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const nextStep = Math.min(4, step + 1);
    setStep(nextStep);
    saveDraft(buildDraftSnapshot(nextStep), STEP_LABELS[nextStep - 1]);
  };

  const canSubmit =
    selectedVehicleId &&
    selectedStateId && NIN_RE.test(nin.trim()) && EMAIL_RE.test(applicantEmail.trim()) &&
    !!doc?.url;

  const handleSubmit = async () => {
    const stepsToCheck = [1, 2, 3];
    const allErrors = stepsToCheck.reduce((acc, s) => ({ ...acc, ...validateStep(s) }), {});
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const firstBadStep = stepsToCheck.find((s) => Object.keys(validateStep(s)).length > 0);
      if (firstBadStep) setStep(firstBadStep);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    markSubmitting();
    const res = await submitCentralMotorRegistryApplication({
      vehicle_id: selectedVehicleId,
      state_id: Number(selectedStateId),
      nin: nin.trim(),
      applicant_email: applicantEmail.trim(),
      vehicle_licence: { doc_type: "vehicle_licence", file_url: doc.url },
    });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    setSuccessApp(res.data);
    setPayOpts(res.data.payment_options);
    clearDraft();
  };

  const handlePayFromWallet = async (amountKobo) => {
    if (!successApp) return;
    setPayingFromWallet(true);
    const res = await payFromWalletEndpoint(successApp.id, { amount_kobo: amountKobo });
    setPayingFromWallet(false);
    if (res.error) return;
    const walletRes = await getWallet();
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    if (res.data) {
      if (res.data.is_fully_paid) {
        router.push(`/dashboard/apply/${successApp.id}`);
        return;
      }
      setPayOpts((prev) => ({ ...prev, remaining_kobo: res.data.remaining_kobo, amount_kobo: prev?.amount_kobo }));
    }
  };

  const isPaid = successApp ? (payOpts?.remaining_kobo ?? payOpts?.amount_kobo ?? 0) <= 0 : false;

  useEffect(() => {
    if (!successApp || isPaid) return;
    const checkPayment = async () => {
      const res = await getApplication(successApp.id);
      const opts = res.data?.payment_options;
      if (!opts) return;
      setPayOpts(opts);
      if ((opts.remaining_kobo ?? opts.amount_kobo) <= 0) {
        router.push(`/dashboard/apply/${successApp.id}`);
      }
    };
    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [successApp, isPaid, router]);

  if (successApp) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: BRAND_TINT }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: BRAND }} />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Application submitted</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            We'll route this to an authorized agent and keep you updated in your dashboard.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Total</span>
              <span className="font-mono font-bold text-[#111111]">{koboToNaira(payOpts?.amount_kobo ?? feeKobo ?? 0)}</span>
            </div>
          </div>

          {!isPaid && payOpts && (
            <div className="mt-5 space-y-2.5 text-left">
              <button
                type="button"
                onClick={() => handlePayFromWallet(payOpts.remaining_kobo ?? payOpts.amount_kobo)}
                disabled={payingFromWallet}
                className={`${btnPrimary} w-full`}
                style={{ background: BRAND }}
              >
                {payingFromWallet ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                {payingFromWallet ? "Processing…" : "Pay from wallet"}
              </button>
              {payOpts.checkout_url && (
                <a href={payOpts.checkout_url} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} w-full`}>
                  Card or Transfer
                </a>
              )}
            </div>
          )}

          <button type="button" onClick={() => router.push("/dashboard/applications")} className={`${btnPrimary} mt-6 w-full`} style={{ background: BRAND }}>
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
        <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Apply — ECMR</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Register your vehicle on the ECMR. One document, one flat fee — the same for every vehicle.
        </p>
        {feeKobo != null && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[12.5px] text-slate-600">Estimated total: {koboToNaira(feeKobo)}</p>
          </div>
        )}
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {step === 1 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
            <Car className="h-4 w-4" style={{ color: BRAND }} /> Vehicle
          </h2>

          {!loadingVehicles && vehicles.length > 0 && !addingVehicle && (
            <div className="space-y-2">
              {vehicles.map((v) => {
                const active = selectedVehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="flex w-full items-center justify-between rounded-xl border-2 p-3.5 text-left transition-all"
                    style={{ borderColor: active ? BRAND : "#e2e8f0", background: active ? BRAND_TINT : "#fff" }}
                  >
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#111111]">
                        {v.make} {v.model} {v.plate_number ? `— ${v.plate_number}` : "(no plate yet)"}
                      </p>
                      <p className="text-[12px] text-slate-500">{v.colour} · {v.state}</p>
                    </div>
                    {active && <CheckCircle2 className="h-4.5 w-4.5" style={{ color: BRAND }} />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setAddingVehicle(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 p-2.5 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add another vehicle
              </button>
            </div>
          )}

          {(addingVehicle || (!loadingVehicles && vehicles.length === 0)) && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Plate number <span className="font-normal text-slate-400">(leave blank if none yet)</span></label>
                  <input
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.plate_number)}`}
                    value={vehicleForm.plate_number}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, plate_number: e.target.value }))}
                  />
                  <FieldError message={vehicleFieldErrors.plate_number} />
                </div>
                <div>
                  <label className={label}>Make</label>
                  <input
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.make)}`}
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, make: e.target.value }))}
                    placeholder="e.g. Toyota"
                  />
                  <FieldError message={vehicleFieldErrors.make} />
                </div>
                <div>
                  <label className={label}>Model</label>
                  <input
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.model)}`}
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. Camry"
                  />
                  <FieldError message={vehicleFieldErrors.model} />
                </div>
                <div>
                  <label className={label}>Colour</label>
                  <input
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.colour)}`}
                    value={vehicleForm.colour}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, colour: e.target.value }))}
                  />
                  <FieldError message={vehicleFieldErrors.colour} />
                </div>
                <div>
                  <label className={label}>Vehicle category <span className="font-normal text-slate-400">(optional)</span></label>
                  <select
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.vehicle_category)}`}
                    value={vehicleForm.vehicle_category}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, vehicle_category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {VEHICLE_CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <FieldError message={vehicleFieldErrors.vehicle_category} />
                </div>
                <div>
                  <label className={label}>Year <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    type="number"
                    className={inputBase}
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value }))}
                    placeholder="e.g. 2021"
                  />
                </div>
                <div>
                  <label className={label}>State</label>
                  <select
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.state_id)}`}
                    value={vehicleForm.state_id}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, state_id: e.target.value }))}
                  >
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <FieldError message={vehicleFieldErrors.state_id} />
                </div>
                <div>
                  <label className={label}>Chassis number <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    className={inputBase}
                    value={vehicleForm.chassis_number}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, chassis_number: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleCreateVehicle} disabled={creatingVehicle} className={btnPrimary} style={{ background: BRAND }}>
                  {creatingVehicle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add vehicle
                </button>
                {vehicles.length > 0 && (
                  <button type="button" onClick={() => setAddingVehicle(false)} className={btnSecondary}>Cancel</button>
                )}
              </div>
            </div>
          )}
          <FieldError message={fieldErrors.vehicle} />
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Your details</h2>
          <div className="space-y-4">
            <div>
              <label className={label}>State <span className="text-red-400">*</span></label>
              <select
                className={`${inputBase} ${errInputClass(!!fieldErrors.state)}`}
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
              >
                <option value="">Select state</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <FieldError message={fieldErrors.state} />
            </div>
            <div>
              <label className={label}>NIN <span className="text-red-400">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`}
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678901"
              />
              <FieldError message={fieldErrors.nin} />
            </div>
            <div>
              <label className={label}>Email <span className="text-red-400">*</span></label>
              <input
                type="email"
                className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_email)}`}
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <FieldError message={fieldErrors.applicant_email} />
            </div>
          </div>
        </section>
      )}

      {step === DOC_STEP && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Document</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UploadSlot slot={DOC_SLOT} value={doc} onChange={setDoc} />
          </div>
          <FieldError message={fieldErrors.documents} />
        </section>
      )}

      {step === REVIEW_STEP && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Review your application</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-[#111111]">
                  {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.plate_number ? ` — ${selectedVehicle.plate_number}` : ""}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">State</span>
                <span className="font-semibold text-[#111111]">{states.find((s) => String(s.id) === String(selectedStateId))?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">NIN</span>
                <span className="font-mono font-semibold text-[#111111]">{nin || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-[#111111]">{applicantEmail || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Document</span>
                <span className="font-semibold text-[#111111]">{doc?.url ? "1 of 1 uploaded" : "0 of 1 uploaded"}</span>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-[13.5px] font-bold text-[#111111]">Payment</h2>
            <p className="text-[20px] font-bold text-[#111111]">Total: {feeKobo != null ? koboToNaira(feeKobo) : "—"}</p>
            <p className="mt-1 text-[12px] text-slate-500">Pay in full, or at least the ₦10,000 minimum to get started — the rest can follow.</p>
          </section>

          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}

          <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </section>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                const prevStep = Math.max(1, step - 1);
                setStep(prevStep);
                saveDraft(buildDraftSnapshot(prevStep), STEP_LABELS[prevStep - 1]);
              }}
              className={btnSecondary}
            >
              Back
            </button>
          ) : <span />}
          <button type="button" onClick={goNext} className={btnPrimary} style={{ background: BRAND }}>
            Continue
          </button>
        </div>
      )}
      {step === 4 && (
        <button
          type="button"
          onClick={() => {
            setStep(3);
            saveDraft(buildDraftSnapshot(3), STEP_LABELS[2]);
          }}
          className={btnSecondary}
        >
          Back
        </button>
      )}
    </div>
  );
}
