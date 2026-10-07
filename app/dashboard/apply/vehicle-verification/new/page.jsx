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
  getCachedUser,
  getReferenceStates,
  submitVehicleVerificationApplication,
  getDriverLicenceFeeSchedule,
  uploadApplicationFile,
  payFromWalletEndpoint,
  getWallet,
  getFastTrackPricingPublic,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import ProcessingSpeedSelector from "@/app/components/dashboard/ProcessingSpeedSelector";
import PaymentOptions from "@/app/components/dashboard/PaymentOptions";
import { validateUploadFile } from "@/lib/utils/fileValidation";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";
import { goToCheckout } from "@/lib/utils/checkout";
import { useToast } from "@/app/components/shared/ToastProvider";
import SubmissionSuccess from "@/app/dashboard/_kit/SubmissionSuccess";

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
  const pushToast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = getCachedUser();
  const { draftFormData, hydrated, save, clearDraft, markSubmitting, unmarkSubmitting } = useApplicationDraft("vehicle_verification");

  const [step, setStep] = useState(1);

  const [states, setStates] = useState([]);
  const [prices, setPrices] = useState(null);

  const [checkType, setCheckType] = useState("registration_history");
  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "",
    applicant_email: user?.email || "", applicant_phone: user?.phone || "",
    plate_number: "", make: "", model: "", year: "", colour: "",
    chassis_number: "", state_id: "", delivery_address: "", reason: "pre_purchase",
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
  const feeRow = useMemo(() => {
    if (!prices) return null;
    return prices.find((p) => p.application_type === applicationType);
  }, [prices, applicationType]);
  const priceKobo = feeRow?.amount_kobo ?? null;
  const minDepositKobo = feeRow?.initial_deposit_kobo ?? null;
  const partialAllowed = feeRow?.partial_payment_allowed ?? false;

  const [processingSpeed, setProcessingSpeed] = useState("normal");
  const [fastTrackInfo, setFastTrackInfo] = useState(null);

  useEffect(() => {
    if (form.state_id) {
      getFastTrackPricingPublic("vehicle_verification", form.state_id).then((res) => {
        setFastTrackInfo(res.data || null);
      });
    }
  }, [form.state_id]);

  // Fast Track is only offered when the backend says so (admin can switch it
  // off per service/state); a failed lookup hides it rather than guessing a price.
  const fastTrackAvailable = !!fastTrackInfo && fastTrackInfo.available !== false;
  const fastTrackSurchargeKobo = fastTrackAvailable ? fastTrackInfo.price_kobo ?? 0 : 0;
  useEffect(() => {
    if (!fastTrackAvailable && processingSpeed !== "normal") setProcessingSpeed("normal");
  }, [fastTrackAvailable, processingSpeed]);
  const totalFeeKobo = priceKobo != null ? (priceKobo + (processingSpeed === "fast_track" ? fastTrackSurchargeKobo : 0)) : null;

  const isCustomsDuty = checkType === "customs_duty";

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCertificateUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    const validation = validateUploadFile(file, { maxSizeMb: 10 });
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }
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
    if (!form.first_name?.trim()) errors.first_name = "First name is required.";
    if (!form.last_name?.trim()) errors.last_name = "Surname is required.";
    if (!form.applicant_email?.trim()) errors.applicant_email = "Email address is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.applicant_email.trim())) errors.applicant_email = "Enter a valid email address.";
    if (!form.applicant_phone?.trim()) errors.applicant_phone = "Mobile number is required.";
    if (!form.plate_number.trim()) errors.plate_number = "Plate number is required.";
    if (!form.make.trim()) errors.make = "Make is required.";
    if (!form.model.trim()) errors.model = "Model is required.";
    if (!form.year.trim()) errors.year = "Year is required.";
    if (!form.colour.trim()) errors.colour = "Colour is required.";
    if (!form.state_id) errors.state_id = "Select a state.";
    if (!form.reason) errors.reason = "Select a reason.";
    if (!form.delivery_address?.trim()) errors.delivery_address = "Delivery address is required for dispatching verification report.";
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

  const handleSubmit = async (paymentOpts = null) => {
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

    const payment_method = paymentOpts?.payment_method || "card";
    // Initial deposit: send no amount so the server charges its own exact
    // minimum (it prices the deposit on the total including any fast-track
    // surcharge, so a client-side figure can come in under it).
    const payment_amount_kobo = paymentOpts?.deposit ? undefined : (paymentOpts?.payment_amount_kobo || totalFeeKobo);

    const res = await submitVehicleVerificationApplication({
      payment_method,
      payment_amount_kobo,
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      last_name: form.last_name.trim(),
      applicant_email: form.applicant_email.trim(),
      applicant_phone: form.applicant_phone.trim(),
      state_id: Number(form.state_id),
      check_type: checkType,
      plate_number: form.plate_number.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      colour: form.colour.trim(),
      reason: form.reason,
      delivery_address: form.delivery_address.trim(),
      chassis_number: isCustomsDuty ? form.chassis_number.trim() : undefined,
      customs_duty_certificate: isCustomsDuty ? { doc_type: "customs_duty_certificate", file_url: certificate.url } : undefined,
      is_urgent: processingSpeed === "fast_track",
      processing_speed: processingSpeed,
    });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      unmarkSubmitting();
      return;
    }
    await clearDraft();
    setSuccessApp(res.data);
    setPayOpts(res.data.payment_options || null);

    if (payment_method === "wallet") {
      const walletRes = await getWallet();
      if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
    } else if (res.data?.payment_options?.checkout_url) {
      const authUrl = res.data.payment_options.checkout_url;
      goToCheckout(authUrl, { applicationId: res.data.id, amountPaidKobo: res.data.payment_options?.amount_paid_kobo });
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
        router.push(`/dashboard/apply/${successApp.id}`);
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
      <SubmissionSuccess
        application={{ ...successApp, payment_options: payOpts ?? successApp.payment_options }}
        title="Verification submitted"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-2 sm:py-8">
      <button onClick={() => router.push("/dashboard/services")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-cx-muted hover:text-cx-ink-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="font-display text-[26px] leading-tight text-cx-ink sm:text-[30px]">Vehicle Verification</h1>
        <p className="mt-1.5 text-sm text-cx-muted">
          Registration history or customs duty check — a Vehiculars agent reviews your submission and returns a documented verdict.
        </p>
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {step === 1 && (
        <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-cx-ink">
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
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-cx-ink">
                      <Icon className="h-4 w-4" style={{ color: active ? BRAND : "#94a3b8" }} /> {ct.label}
                    </span>
                    <span className="text-[12px] text-cx-muted">{ct.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-cx-ink">
              <Car className="h-4 w-4" style={{ color: BRAND }} /> Applicant details
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>First Name <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.first_name)}`}
                  name="first_name"
                  value={form.first_name || ""}
                  onChange={handleChange}
                  placeholder="e.g. Adebayo"
                />
                <FieldError message={fieldErrors.first_name} />
              </div>
              <div>
                <label className={label}>Middle name <span className="font-normal text-cx-muted">(optional)</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.middle_name)}`}
                  name="middle_name"
                  value={form.middle_name || ""}
                  onChange={handleChange}
                  placeholder="e.g. Olawale"
                />
                <FieldError message={fieldErrors.middle_name} />
              </div>
              <div>
                <label className={label}>Surname <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.last_name)}`}
                  name="last_name"
                  value={form.last_name || ""}
                  onChange={handleChange}
                  placeholder="e.g. Ogunleye"
                />
                <FieldError message={fieldErrors.last_name} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_email)}`}
                  name="applicant_email"
                  value={form.applicant_email || ""}
                  onChange={handleChange}
                  placeholder="e.g. adebayo@example.com"
                />
                <FieldError message={fieldErrors.applicant_email} />
              </div>
              <div>
                <label className={label}>Mobile Number <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_phone)}`}
                  name="applicant_phone"
                  value={form.applicant_phone || ""}
                  onChange={handleChange}
                  placeholder="e.g. 08012345678"
                />
                <FieldError message={fieldErrors.applicant_phone} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-cx-ink">
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
              <div className="sm:col-span-2">
                <label className={label}>Delivery Address <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.delivery_address)}`}
                  name="delivery_address"
                  value={form.delivery_address || ""}
                  onChange={handleChange}
                  placeholder="e.g. 14 Marina Road, Victoria Island, Lagos"
                />
                <p className="mt-1 text-xs text-cx-muted">Official verification report and certified search documents will be dispatched to this delivery address.</p>
                <FieldError message={fieldErrors.delivery_address} />
              </div>
            </div>
          </div>

          {isCustomsDuty && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-cx-ink">
                <FileSearch className="h-4 w-4" style={{ color: BRAND }} /> Customs duty certificate
              </h2>
              <div>
                <label className={label}>Chassis / VIN number</label>
                <input className={`${inputBase} ${errInputClass(!!fieldErrors.chassis_number)}`} name="chassis_number" value={form.chassis_number} onChange={handleChange} />
                <FieldError message={fieldErrors.chassis_number} />
              </div>
              <div className="mt-3">
                <label className={label}>Duty certificate or receipt</label>
                <p className="text-xs text-cx-muted mb-2">JPG, PNG, WEBP, or PDF — up to 10MB</p>
                {certificate?.url ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-cx-line bg-cx-sunken p-3">
                    <p className="truncate text-[12.5px] font-semibold text-cx-ink">{certificate.fileName}</p>
                    <button type="button" onClick={() => setCertificate(null)} className="shrink-0 text-xs font-semibold text-red-600">Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cx-line-strong p-4 text-[12.5px] font-semibold text-cx-ink-2 hover:border-slate-400">
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
          <div className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-cx-ink">Review your submission</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Applicant</span>
                <span className="font-semibold text-cx-ink">{form.first_name} {form.middle_name} {form.last_name}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Contact</span>
                <span className="font-semibold text-cx-ink">{form.applicant_email} · {form.applicant_phone}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Check type</span>
                <span className="font-semibold text-cx-ink">{CHECK_TYPES.find((c) => c.value === checkType)?.label}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Vehicle</span>
                <span className="font-semibold text-cx-ink">{form.make} {form.model} — {form.plate_number}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Reason</span>
                <span className="font-semibold text-cx-ink">{REASONS.find((r) => r.value === form.reason)?.label}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Delivery address</span>
                <span className="font-semibold text-cx-ink text-right max-w-xs">{form.delivery_address || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Processing Speed</span>
                <span className="font-semibold text-cx-ink">
                  {processingSpeed === "fast_track" ? `Fast Track (+${koboToNaira(fastTrackSurchargeKobo)})` : "Standard"}
                </span>
              </div>
            </div>
          </div>

          {fastTrackAvailable ? (
            <ProcessingSpeedSelector
              value={processingSpeed}
              onChange={setProcessingSpeed}
              fastTrackPriceKobo={fastTrackSurchargeKobo}
              standardTurnaround={fastTrackInfo?.standard_turnaround_label ?? "3–5 business days"}
              fastTrackTurnaround={fastTrackInfo?.turnaround_label ?? "24–48 hours"}
            />
          ) : null}

          <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-cx-ink">Payment</h2>
            {totalFeeKobo != null ? (
              <p className="text-[20px] font-bold text-cx-ink mb-4">Total: {koboToNaira(totalFeeKobo)}</p>
            ) : (
              <p className="text-[13px] font-semibold text-amber-700 mb-4">Not yet priced — contact support.</p>
            )}

            {submitError && <p className="mb-3 text-[13px] font-medium text-red-600">{submitError}</p>}

            {totalFeeKobo != null ? (
              <PaymentOptions
                submitMode={true}
                remainingKobo={totalFeeKobo || 0}
                walletBalanceKobo={walletBalance}
                partialAllowed={partialAllowed}
                minDepositKobo={minDepositKobo}
              depositBaseKobo={priceKobo}
                submitting={submitting}
                onSubmitWithPayment={handleSubmit}
              />
            ) : null}
          </section>
        </section>
      )}

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center justify-between gap-3 border-t border-cx-line bg-cx-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
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
