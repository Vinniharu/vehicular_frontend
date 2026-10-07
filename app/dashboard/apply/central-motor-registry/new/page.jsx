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
  getCachedUser,
  getReferenceStates,
  listVehicles,
  createVehicle,
  submitCentralMotorRegistryApplication,
  payFromWalletEndpoint,
  getWallet,
  getServicePricing,
  getFastTrackPricingPublic,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import ProcessingSpeedSelector from "@/app/components/dashboard/ProcessingSpeedSelector";
import PaymentOptions from "@/app/components/dashboard/PaymentOptions";
import UploadSlot from "@/app/components/dashboard/UploadSlot";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";
import { goToCheckout } from "@/lib/utils/checkout";
import { useToast } from "@/app/components/shared/ToastProvider";
import SubmissionSuccess from "@/app/dashboard/_kit/SubmissionSuccess";

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
  const pushToast = useToast();
  const router = useRouter();
  const cachedUser = getCachedUser();
  const { draftFormData, hydrated: draftHydrated, save: saveDraft, clearDraft, markSubmitting, unmarkSubmitting } = useApplicationDraft("central_motor_registry");
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
  const [firstName, setFirstName] = useState(() => (cachedUser?.name || "").split(" ")[0] || "");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState(() => {
    const parts = (cachedUser?.name || "").split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  });
  const [nin, setNin] = useState("");
  const [applicantEmail, setApplicantEmail] = useState(() => cachedUser?.email || "");
  const [applicantPhone, setApplicantPhone] = useState(() => cachedUser?.phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [doc, setDoc] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [feeKobo, setFeeKobo] = useState(null);
  const [minDepositKobo, setMinDepositKobo] = useState(null);
  const [partialAllowed, setPartialAllowed] = useState(false);
  const [processingSpeed, setProcessingSpeed] = useState("normal");
  const [fastTrackInfo, setFastTrackInfo] = useState(null);

  useEffect(() => {
    getFastTrackPricingPublic("central_motor_registry", selectedStateId).then((res) => {
      setFastTrackInfo(res.data || null);
    });
  }, [selectedStateId]);

  // Fast Track is only offered when the backend says so (admin can switch it
  // off per service/state); a failed lookup hides it rather than guessing a price.
  const fastTrackAvailable = !!fastTrackInfo && fastTrackInfo.available !== false;
  const fastTrackSurchargeKobo = fastTrackAvailable ? fastTrackInfo.price_kobo ?? 0 : 0;
  useEffect(() => {
    if (!fastTrackAvailable && processingSpeed !== "normal") setProcessingSpeed("normal");
  }, [fastTrackAvailable, processingSpeed]);
  const totalFeeKobo = feeKobo != null ? (feeKobo + (processingSpeed === "fast_track" ? fastTrackSurchargeKobo : 0)) : null;

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
      if (draftFormData.firstName !== undefined) setFirstName(draftFormData.firstName);
      if (draftFormData.middleName !== undefined) setMiddleName(draftFormData.middleName);
      if (draftFormData.lastName !== undefined) setLastName(draftFormData.lastName);
      if (draftFormData.nin) setNin(draftFormData.nin);
      if (draftFormData.applicantEmail !== undefined) setApplicantEmail(draftFormData.applicantEmail);
      if (draftFormData.applicantPhone !== undefined) setApplicantPhone(draftFormData.applicantPhone);
      if (draftFormData.deliveryAddress) setDeliveryAddress(draftFormData.deliveryAddress);
      if (draftFormData.doc) setDoc(draftFormData.doc);
      if (draftFormData.step) setStep(draftFormData.step);
    }
    setDraftRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftHydrated, draftFormData]);

  const buildDraftSnapshot = (targetStep) => ({
    selectedVehicleId, selectedStateId, firstName, middleName, lastName, nin, applicantEmail, applicantPhone, deliveryAddress, doc, step: targetStep,
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
      if (row?.initial_deposit_kobo != null) setMinDepositKobo(row.initial_deposit_kobo);
      if (row?.partial_payment_allowed != null) setPartialAllowed(row.partial_payment_allowed);
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
      if (!firstName.trim()) errors.first_name = "First name is required.";
      if (!lastName.trim()) errors.last_name = "Surname is required.";
      if (!nin.trim()) errors.nin = "NIN is required.";
      else if (!NIN_RE.test(nin.trim())) errors.nin = "NIN must be exactly 11 digits.";
      if (!applicantEmail.trim()) errors.applicant_email = "Email is required.";
      else if (!EMAIL_RE.test(applicantEmail.trim())) errors.applicant_email = "Enter a valid email address.";
      if (!applicantPhone.trim()) errors.applicant_phone = "Phone number is required.";
      if (!deliveryAddress.trim()) errors.deliveryAddress = "Delivery address is required.";
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
    selectedStateId &&
    firstName.trim() &&
    middleName.trim() &&
    lastName.trim() &&
    NIN_RE.test(nin.trim()) &&
    EMAIL_RE.test(applicantEmail.trim()) &&
    applicantPhone.trim() &&
    deliveryAddress.trim() &&
    !!doc?.url;

  const handleSubmit = async (paymentOpts = null) => {
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

    const payment_method = paymentOpts?.payment_method || "card";
    // Initial deposit: send no amount so the server charges its own exact
    // minimum (it prices the deposit on the total including any fast-track
    // surcharge, so a client-side figure can come in under it).
    const payment_amount_kobo = paymentOpts?.deposit ? undefined : (paymentOpts?.payment_amount_kobo || totalFeeKobo);

    const res = await submitCentralMotorRegistryApplication({
      payment_method,
      payment_amount_kobo,
      vehicle_id: selectedVehicleId,
      state_id: Number(selectedStateId),
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      nin: nin.trim(),
      applicant_email: applicantEmail.trim(),
      applicant_phone: applicantPhone.trim(),
      delivery_address: deliveryAddress.trim(),
      vehicle_licence: { doc_type: "vehicle_licence", file_url: doc.url },
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
    setPayOpts(res.data.payment_options);

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
      <SubmissionSuccess
        application={{ ...successApp, payment_options: payOpts ?? successApp.payment_options }}
        title="Application submitted"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-2 sm:py-8">
      <button onClick={() => router.push("/dashboard/services")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-cx-muted hover:text-cx-ink-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="font-display text-[26px] leading-tight text-cx-ink sm:text-[30px]">Apply — ECMR</h1>
        <p className="mt-1.5 text-sm text-cx-muted">
          Register your vehicle on the ECMR. One document, one flat fee — the same for every vehicle.
        </p>
        {feeKobo != null && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-cx-line bg-cx-sunken p-3">
            <p className="text-[12.5px] text-cx-ink-2">Estimated total: {koboToNaira(feeKobo)}</p>
          </div>
        )}
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {step === 1 && (
        <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-cx-ink">
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
                      <p className="text-sm font-semibold text-cx-ink">
                        {v.make} {v.model} {v.plate_number ? `— ${v.plate_number}` : "(no plate yet)"}
                      </p>
                      <p className="text-[12px] text-cx-muted">{v.colour} · {v.state}</p>
                    </div>
                    {active && <CheckCircle2 className="h-4.5 w-4.5" style={{ color: BRAND }} />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setAddingVehicle(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-cx-line-strong p-2.5 text-[12.5px] font-semibold text-cx-ink-2 hover:border-slate-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add another vehicle
              </button>
            </div>
          )}

          {(addingVehicle || (!loadingVehicles && vehicles.length === 0)) && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Plate number <span className="font-normal text-cx-muted">(leave blank if none yet)</span></label>
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
                  <label className={label}>Vehicle category <span className="font-normal text-cx-muted">(optional)</span></label>
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
                  <label className={label}>Year <span className="font-normal text-cx-muted">(optional)</span></label>
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
                  <label className={label}>Chassis number <span className="font-normal text-cx-muted">(optional)</span></label>
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
        <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-cx-ink">Your details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>First Name <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.first_name)}`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ada"
                />
                <FieldError message={fieldErrors.first_name} />
              </div>
              <div>
                <label className={label}>Middle name <span className="font-normal text-cx-muted">(optional)</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.middle_name)}`}
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Chinedu"
                />
                <FieldError message={fieldErrors.middle_name} />
              </div>
              <div>
                <label className={label}>Surname <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.last_name)}`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Obi"
                />
                <FieldError message={fieldErrors.last_name} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div>
                <label className={label}>Mobile / Phone Number <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_phone)}`}
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="08012345678"
                />
                <FieldError message={fieldErrors.applicant_phone} />
              </div>
            </div>
            <div>
              <label className={label}>Delivery Address <span className="text-red-400">*</span></label>
              <input
                className={`${inputBase} ${errInputClass(!!fieldErrors.deliveryAddress)}`}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. 14 Marina Road, Victoria Island, Lagos"
              />
              <p className="mt-1 text-xs text-cx-muted">Physical CMR documents and certificates will be dispatched to this delivery address.</p>
              <FieldError message={fieldErrors.deliveryAddress} />
            </div>
          </div>
        </section>
      )}

      {step === DOC_STEP && (
        <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-cx-ink">Document</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UploadSlot slot={DOC_SLOT} value={doc} onChange={setDoc} />
          </div>
          <FieldError message={fieldErrors.documents} />
        </section>
      )}

      {step === REVIEW_STEP && (
        <section className="space-y-4">
          <div className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-cx-ink">Review your application</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Applicant</span>
                <span className="font-semibold text-cx-ink">{[firstName, middleName, lastName].filter(Boolean).join(" ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Vehicle</span>
                <span className="font-semibold text-cx-ink">
                  {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.plate_number ? ` — ${selectedVehicle.plate_number}` : ""}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">State</span>
                <span className="font-semibold text-cx-ink">{states.find((s) => String(s.id) === String(selectedStateId))?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">NIN</span>
                <span className="font-mono font-semibold text-cx-ink">{nin || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Email &amp; Phone</span>
                <span className="font-semibold text-cx-ink">{applicantEmail || "—"} · {applicantPhone || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Delivery address</span>
                <span className="font-semibold text-cx-ink text-right max-w-xs">{deliveryAddress || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Document</span>
                <span className="font-semibold text-cx-ink">{doc?.url ? "1 of 1 uploaded" : "0 of 1 uploaded"}</span>
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
            <h2 className="mb-1 text-[14px] font-bold text-cx-ink">Payment & Submission</h2>
            <p className="mb-4 text-[12px] text-cx-muted">
              Applications require an initial deposit or full payment to begin processing.
            </p>
            <div className="mb-4 rounded-xl bg-cx-sunken p-3 text-[13px] border border-cx-line space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cx-muted">CMR Registration Fee</span>
                <span className="font-semibold text-cx-ink">{feeKobo != null ? koboToNaira(feeKobo) : "—"}</span>
              </div>
              {processingSpeed === "fast_track" && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Fast Track Surcharge</span>
                  <span className="font-semibold">+{koboToNaira(fastTrackSurchargeKobo)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-cx-line/60 font-bold text-cx-ink">
                <span>Total Fee</span>
                <span className="font-mono">{totalFeeKobo != null ? koboToNaira(totalFeeKobo) : "—"}</span>
              </div>
            </div>

            {submitError && <p className="mb-3 text-[13px] font-medium text-red-600">{submitError}</p>}

            <PaymentOptions
              submitMode={true}
              remainingKobo={totalFeeKobo || 0}
              walletBalanceKobo={walletBalance}
              partialAllowed={partialAllowed}
              minDepositKobo={minDepositKobo}
              depositBaseKobo={feeKobo}
              submitting={submitting}
              onSubmitWithPayment={handleSubmit}
            />
          </section>
        </section>
      )}

      {step < 4 && (
        <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center justify-between gap-3 border-t border-cx-line bg-cx-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
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
