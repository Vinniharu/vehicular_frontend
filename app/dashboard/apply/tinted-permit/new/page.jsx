"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Plus,
  Car,
  Clock,
  Wallet,
} from "lucide-react";
import {
  getCachedUser,
  getReferenceStates,
  listVehicles,
  createVehicle,
  submitDriverLicenceApplication,
  payFromWalletEndpoint,
  getWallet,
  getDriverLicenceFeeSchedule,
  getTintedPermitEligibility,
  getFastTrackPricingPublic,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import ProcessingSpeedSelector from "@/app/components/dashboard/ProcessingSpeedSelector";
import PaymentOptions from "@/app/components/dashboard/PaymentOptions";
import UploadSlot from "@/app/components/dashboard/UploadSlot";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";
import { goToCheckout } from "@/lib/utils/checkout";
import { useToast } from "@/app/components/shared/ToastProvider";
import SubmissionSuccess from "@/app/dashboard/_kit/SubmissionSuccess";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";
// Mirrors app/core/payment_helpers.py — fallback only, used while the live
// fee-schedule fetch (below) hasn't resolved yet or failed.
const TOTAL_FEE_KOBO = 2_705_000;

const PLATE_RE = /^[A-Za-z0-9-]{4,15}$/;

// Reference-photo guides shown as the background of each upload box below.
// Files live in public/placeholder/ — swap in a different photo for a slot
// by replacing that file (or point `image` at a new path) any time; a
// missing file just falls back to a plain background, nothing breaks.
const DOC_SLOTS = [
  { doc_type: "proof_of_ownership", title: "Proof of Ownership", hint: "Proof that you own the vehicle", image: "/placeholder/proof.jpeg" },
  { doc_type: "vehicle_licence", title: "Vehicle Licence", hint: "Front of your vehicle licence", image: "/placeholder/vehicle.jpeg" },
  { doc_type: "tinted_passport_photo", title: "Passport Photograph", hint: "Clear photo of your face", image: "/placeholder/person.jpeg" },
  { doc_type: "vehicle_photo_front", title: "Vehicle Photo — Front", hint: "Full front view of the vehicle", image: "/placeholder/front.jpeg" },
  { doc_type: "vehicle_photo_back", title: "Vehicle Photo — Back", hint: "Full rear view of the vehicle", image: "/placeholder/back.jpeg" },
  { doc_type: "vehicle_photo_side", title: "Vehicle Photo — Side", hint: "Full side profile of the vehicle", image: "/placeholder/side.jpeg" },
  { doc_type: "vin_sticker_photo", title: "VIN Sticker Photo", hint: "Usually on driver-side door jamb or dashboard", image: "/placeholder/vin.jpeg" },
];

const STEP_LABELS = ["Vehicle", "Applicant details", "Documents", "Review & submit"];

export default function TintedPermitNewApplicationPage() {
  const pushToast = useToast();
  const router = useRouter();
  const user = getCachedUser();

  const [step, setStep] = useState(1);

  const [states, setStates] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [addingVehicle, setAddingVehicle] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "", make: "", model: "", colour: "", state_id: "",
  });
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [vehicleFieldErrors, setVehicleFieldErrors] = useState({});

  const [firstName, setFirstName] = useState(() => (user?.name || "").split(" ")[0] || "");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState(() => {
    const parts = (user?.name || "").split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  });
  const [applicantEmail, setApplicantEmail] = useState(() => user?.email || "");
  const [applicantPhone, setApplicantPhone] = useState(() => user?.phone || "");
  const [nin, setNin] = useState("");
  const [justification, setJustification] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [docs, setDocs] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [feeKobo, setFeeKobo] = useState(null);
  const [minDepositKobo, setMinDepositKobo] = useState(null);
  const [partialAllowed, setPartialAllowed] = useState(false);
  const [processingSpeed, setProcessingSpeed] = useState("normal");
  const [fastTrackInfo, setFastTrackInfo] = useState(null);
  // { eligible, reason: "in_flight" | "not_due" | null, current_expiry_date, eligible_from_date }
  const [eligibility, setEligibility] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [payOpts, setPayOpts] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const { draftFormData, hydrated, save, clearDraft, markSubmitting, unmarkSubmitting } = useApplicationDraft("tinted_permit");
  const [draftApplied, setDraftApplied] = useState(false);

  // The permit is charged at the vehicle's state price, so quote that one
  // rather than the general (no-state) row.
  const selectedVehicleStateId = vehicles.find((v) => v.id === selectedVehicleId)?.state_id;
  useEffect(() => {
    if (!selectedVehicleStateId) return;
    let cancelled = false;
    getDriverLicenceFeeSchedule({ state_id: selectedVehicleStateId }).then((res) => {
      if (cancelled) return;
      const row = res.data?.prices?.find((p) => p.application_type === "tinted_permit");
      if (row?.amount_kobo != null) setFeeKobo(row.amount_kobo);
      if (row?.initial_deposit_kobo != null) setMinDepositKobo(row.initial_deposit_kobo);
      if (row?.partial_payment_allowed != null) setPartialAllowed(row.partial_payment_allowed);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedVehicleStateId]);

    // Restore a saved draft once — after this, local state is the source of
  // truth and further hydration passes would just clobber in-progress edits.
  useEffect(() => {
    if (!hydrated || draftApplied) return;
    if (draftFormData) {
      if (draftFormData.selectedVehicleId) setSelectedVehicleId(draftFormData.selectedVehicleId);
      if (draftFormData.firstName !== undefined) setFirstName(draftFormData.firstName);
      if (draftFormData.middleName !== undefined) setMiddleName(draftFormData.middleName);
      if (draftFormData.lastName !== undefined) setLastName(draftFormData.lastName);
      if (draftFormData.applicantEmail !== undefined) setApplicantEmail(draftFormData.applicantEmail);
      if (draftFormData.applicantPhone !== undefined) setApplicantPhone(draftFormData.applicantPhone);
      if (draftFormData.nin) setNin(draftFormData.nin);
      if (draftFormData.justification) setJustification(draftFormData.justification);
      if (draftFormData.deliveryAddress) setDeliveryAddress(draftFormData.deliveryAddress);
      if (draftFormData.docs) setDocs(draftFormData.docs);
    }
    setDraftApplied(true);
  }, [hydrated, draftApplied, draftFormData]);

  useEffect(() => {
    Promise.all([getReferenceStates(), listVehicles(), getWallet(), getDriverLicenceFeeSchedule()]).then(
      ([statesRes, vehiclesRes, walletRes, feeRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
          // Keep a vehicle restored from a draft; only default to the first one.
          if (vehiclesRes.data.length > 0) setSelectedVehicleId((prev) => prev ?? vehiclesRes.data[0].id);
          else setAddingVehicle(true);
        } else {
          setAddingVehicle(true);
        }
        if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
        const tintedRow = feeRes.data?.prices?.find((p) => p.application_type === "tinted_permit");
        if (tintedRow?.amount_kobo != null) setFeeKobo(tintedRow.amount_kobo);
        if (tintedRow?.initial_deposit_kobo != null) setMinDepositKobo(tintedRow.initial_deposit_kobo);
        if (tintedRow?.partial_payment_allowed != null) setPartialAllowed(tintedRow.partial_payment_allowed);
        setLoadingVehicles(false);
      }
    );
  }, []);

  // Eligibility is per-vehicle — re-fetch whenever the selected vehicle
  // changes, including right after "Add another vehicle" picks a brand-new
  // one with no history at all (always eligible).
  useEffect(() => {
    if (!selectedVehicleId) return;
    getTintedPermitEligibility(selectedVehicleId).then((res) => {
      if (res.data) setEligibility(res.data);
    });
  }, [selectedVehicleId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  useEffect(() => {
    getFastTrackPricingPublic("tinted_permit", selectedVehicle?.state_id).then((res) => {
      setFastTrackInfo(res.data || null);
    });
  }, [selectedVehicle?.state_id]);

  // Fast Track is only offered when the backend says so (admin can switch it
  // off per service/state); a failed lookup hides it rather than guessing a price.
  const fastTrackAvailable = !!fastTrackInfo && fastTrackInfo.available !== false;
  const fastTrackSurchargeKobo = fastTrackAvailable ? fastTrackInfo.price_kobo ?? 0 : 0;
  useEffect(() => {
    if (!fastTrackAvailable && processingSpeed !== "normal") setProcessingSpeed("normal");
  }, [fastTrackAvailable, processingSpeed]);
  const displayFeeKobo = (feeKobo ?? TOTAL_FEE_KOBO) + (processingSpeed === "fast_track" ? fastTrackSurchargeKobo : 0);

  const handleCreateVehicle = async () => {
    const errors = {};
    if (!vehicleForm.plate_number.trim()) errors.plate_number = "Plate number is required.";
    else if (!PLATE_RE.test(vehicleForm.plate_number.trim())) errors.plate_number = "Use 4-15 letters, digits, or hyphens.";
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
    const res = await createVehicle({ ...vehicleForm, state_id: Number(vehicleForm.state_id) });
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
      else if (eligibility && !eligibility.eligible) errors.vehicle = "This vehicle isn't eligible for a new tinted permit request right now — see above.";
    }
    if (n === 2) {
      if (!firstName.trim()) errors.first_name = "First name is required.";
      if (!lastName.trim()) errors.last_name = "Surname is required.";
      if (!applicantEmail.trim()) errors.applicant_email = "Email address is required.";
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(applicantEmail.trim())) errors.applicant_email = "Enter a valid email address.";
      if (!applicantPhone.trim()) errors.applicant_phone = "Phone number is required.";
      const trimmedNin = nin.trim();
      if (!trimmedNin) errors.nin = "NIN is required.";
      else if (!/^\d{11}$/.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (!deliveryAddress.trim()) errors.deliveryAddress = "Delivery address is required.";
    }
    if (n === 3) {
      const allDocsUploaded = DOC_SLOTS.every((slot) => docs[slot.doc_type]?.url);
      if (!allDocsUploaded) errors.documents = "Upload every required document to continue.";
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
    save({ selectedVehicleId, firstName, middleName, lastName, applicantEmail, applicantPhone, nin, justification, deliveryAddress, docs }, STEP_LABELS[nextStep - 1]);
  };

  const canSubmit =
    selectedVehicleId &&
    firstName.trim() &&
    middleName.trim() &&
    lastName.trim() &&
    applicantEmail.trim() &&
    applicantPhone.trim() &&
    /^\d{11}$/.test(nin) &&
    deliveryAddress.trim() &&
    DOC_SLOTS.every((slot) => docs[slot.doc_type]?.url);

  const handleSubmit = async (paymentOpts = null) => {
    const allErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3) };
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const firstBadStep = [1, 2, 3].find((s) => Object.keys(validateStep(s)).length > 0);
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
    const payment_amount_kobo = paymentOpts?.deposit ? undefined : (paymentOpts?.payment_amount_kobo || displayFeeKobo);

    const res = await submitDriverLicenceApplication({
      payment_method,
      payment_amount_kobo,
      application_type: "tinted_permit",
      vehicle_id: selectedVehicleId,
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      applicant_email: applicantEmail.trim(),
      applicant_phone: applicantPhone.trim(),
      nin,
      justification: justification || undefined,
      delivery_address: deliveryAddress.trim(),
      documents: DOC_SLOTS.map((slot) => ({ doc_type: slot.doc_type, file_url: docs[slot.doc_type].url })),
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

  // "Pay by card" opens Monnify in a new tab (consistent with every other
  // pay-by-card link in this app) — this tab never gets a callback, so it
  // has to notice payment completion itself once the customer switches
  // back, instead of leaving them stranded on this form.
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
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkPayment();
    };
    window.addEventListener("focus", checkPayment);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", checkPayment);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [successApp, isPaid, router]);

  if (successApp) {
    return (
      <SubmissionSuccess
        application={{ ...successApp, payment_options: payOpts ?? successApp.payment_options }}
        title="Tinted permit application submitted"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-2 sm:py-8">
      <button onClick={() => router.push("/dashboard/services")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-cx-muted hover:text-cx-ink-2">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="font-display text-[26px] leading-tight text-cx-ink sm:text-[30px]">Apply for Tinted Permit</h1>
        <p className="mt-1.5 text-sm text-cx-muted">
          Upload the documents and vehicle photos below. We'll process your application end-to-end.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-start gap-2.5 rounded-xl border border-cx-line bg-cx-sunken p-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cx-muted" />
            <p className="text-[12.5px] text-cx-ink-2">5 working days — proof of process &amp; payment so you can drive freely</p>
          </div>
          <div className="flex flex-1 items-start gap-2.5 rounded-xl border border-cx-line bg-cx-sunken p-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cx-muted" />
            <p className="text-[12.5px] text-cx-ink-2">7 working days — main Permit certificate</p>
          </div>
        </div>
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {/* Step 1 — Vehicle */}
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
                      <p className="text-sm font-semibold text-cx-ink">{v.make} {v.model} — {v.plate_number}</p>
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

          {eligibility && !eligibility.eligible && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[12.5px] text-amber-800">
              {eligibility.reason === "in_flight"
                ? "This vehicle already has a tinted permit request in progress — check your existing requests."
                : eligibility.eligible_from_date
                ? `This vehicle's tinted permit isn't due for renewal yet — eligible from ${new Date(eligibility.eligible_from_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}.`
                : "This vehicle isn't due for tinted permit renewal yet."}
            </div>
          )}

          {(addingVehicle || (!loadingVehicles && vehicles.length === 0)) && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Plate number</label>
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

      {/* Step 2 — Applicant details */}
      {step === 2 && (
        <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-cx-ink">Applicant details</h2>
          <div className="space-y-3">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>Email address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_email)}`}
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="ada@example.com"
                />
                <FieldError message={fieldErrors.applicant_email} />
              </div>
              <div>
                <label className={label}>Mobile / Phone number <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_phone)}`}
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="08012345678"
                />
                <FieldError message={fieldErrors.applicant_phone} />
              </div>
              <div>
                <label className={label}>NIN <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.nin)}`}
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="11-digit NIN"
                  inputMode="numeric"
                />
                <FieldError message={fieldErrors.nin} />
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
              <p className="mt-1 text-xs text-cx-muted">Physical tinted permit documents will be delivered to this address.</p>
              <FieldError message={fieldErrors.deliveryAddress} />
            </div>
            <div>
              <label className={label}>Justification <span className="font-normal text-cx-muted">(optional)</span></label>
              <textarea
                className={inputBase}
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Any justification the authority asks for (e.g. medical reason)."
              />
            </div>
          </div>
        </section>
      )}

      {/* Step 3 — Documents & photos */}
      {step === 3 && (
        <section className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-cx-ink">Documents &amp; photos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DOC_SLOTS.map((slot) => (
              <UploadSlot
                key={slot.doc_type}
                slot={slot}
                value={docs[slot.doc_type]}
                onChange={(v) => setDocs((prev) => ({ ...prev, [slot.doc_type]: v }))}
              />
            ))}
          </div>
          <FieldError message={fieldErrors.documents} />
        </section>
      )}

      {/* Step 4 — Review & submit */}
      {step === 4 && (
        <section className="space-y-4">
          <div className="rounded-cx-lg border border-cx-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-cx-ink">Review your application</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Applicant</span>
                <span className="font-semibold text-cx-ink">{[firstName, middleName, lastName].filter(Boolean).join(" ") || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Email &amp; Phone</span>
                <span className="font-semibold text-cx-ink">{applicantEmail} · {applicantPhone}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Vehicle</span>
                <span className="font-semibold text-cx-ink">
                  {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} — ${selectedVehicle.plate_number}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">NIN</span>
                <span className="font-mono font-semibold text-cx-ink">{nin || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Delivery address</span>
                <span className="font-semibold text-cx-ink text-right max-w-xs">{deliveryAddress || "—"}</span>
              </div>
              {justification.trim() && (
                <div className="py-2.5 text-[13px]">
                  <span className="block text-cx-muted">Justification</span>
                  <span className="mt-1 block text-cx-ink">{justification}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-cx-muted">Documents</span>
                <span className="font-semibold text-cx-ink">
                  {DOC_SLOTS.filter((s) => docs[s.doc_type]?.url).length} of {DOC_SLOTS.length} uploaded
                </span>
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
                <span className="text-cx-muted">Tinted Permit Fee</span>
                <span className="font-semibold text-cx-ink">{koboToNaira(feeKobo ?? TOTAL_FEE_KOBO)}</span>
              </div>
              {processingSpeed === "fast_track" && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Fast Track Surcharge</span>
                  <span className="font-semibold">+{koboToNaira(fastTrackSurchargeKobo)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-cx-line/60 font-bold text-cx-ink">
                <span>Total Fee</span>
                <span className="font-mono">{koboToNaira(displayFeeKobo)}</span>
              </div>
            </div>

            {submitError && <p className="mb-3 text-[13px] font-medium text-red-600">{submitError}</p>}

            <PaymentOptions
              submitMode={true}
              remainingKobo={displayFeeKobo || 0}
              walletBalanceKobo={walletBalance}
              partialAllowed={partialAllowed}
              minDepositKobo={minDepositKobo}
              depositBaseKobo={(feeKobo ?? TOTAL_FEE_KOBO)}
              submitting={submitting}
              onSubmitWithPayment={handleSubmit}
            />
          </section>
        </section>
      )}

      {/* Step navigation */}
      {step < 4 && (
        <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-4 flex items-center justify-between gap-3 border-t border-cx-line bg-cx-surface/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className={btnSecondary}>
              Back
            </button>
          ) : <span />}
          <button type="button" onClick={goNext} className={btnPrimary} style={{ background: BRAND }}>
            Continue
          </button>
        </div>
      )}
      {step === 4 && (
        <button type="button" onClick={() => setStep(3)} className={btnSecondary}>
          Back
        </button>
      )}
    </div>
  );
}
