"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  Plus,
  Car,
  Clock,
  ShieldCheck,
  Building2,
} from "lucide-react";
import {
  getReferenceStates,
  listVehicles,
  createVehicle,
  submitDriverLicenceApplication,
  payFromWalletEndpoint,
  getWallet,
  getNumberPlateFee,
  getDriverLicenceFeeSchedule,
  getApplication,
  getCachedUser,
  koboToNaira,
} from "@/lib/api";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";
import UploadSlot from "@/app/components/dashboard/UploadSlot";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { VEHICLE_CATEGORY_OPTIONS, VEHICLE_CATEGORY_LABELS } from "@/lib/constants/vehicleCategories";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

// Maps the ?type= query param (from the list page's service picker) to the
// real backend application_type, plus display metadata. Mirrors the exact
// figures confirmed for this build (app/core/payment_helpers.py).
const PLATE_TYPES = {
  new: {
    application_type: "number_plate_new",
    title: "New Plate",
    fallbackFeeKobo: 10_500_000,
    requiresExistingPlate: false,
  },
  replacement: {
    application_type: "number_plate_replacement",
    title: "Plate Replacement",
    fallbackFeeKobo: 10_500_000,
    requiresExistingPlate: true,
  },
  "change-of-ownership": {
    application_type: "number_plate_change_of_ownership",
    title: "Change of Ownership",
    fallbackFeeKobo: 12_000_000,
    requiresExistingPlate: true,
  },
  fancy: {
    application_type: "number_plate_fancy",
    title: "Fancy Plate",
    fallbackFeeKobo: 12_500_000,
    requiresExistingPlate: false,
  },
  dealership: {
    application_type: "number_plate_dealership",
    title: "Dealership Plate",
    fallbackFeeKobo: 10_500_000,
    requiresExistingPlate: false,
    // The only plan with no vehicle at all — a plate issued against the
    // dealership's company identity instead.
    requiresVehicle: false,
  },
};

const PLATE_RE = /^[A-Za-z0-9-]{4,15}$/;
const NIN_RE = /^\d{11}$/;

// What the Number Plate fee actually covers, end to end — shown to the
// applicant up front so the price doesn't look like "just a plate." New/
// change-of-ownership get the full list; replacement (a lost/damaged-plate
// reissue, not a fresh registration) only ever produces a plate number.
// Dealership plates cover the same plate-number allocation, just against a
// company identity rather than a specific vehicle.
function getWhatsCovered(planKey) {
  if (planKey === "replacement") return ["Plate number"];
  if (planKey === "dealership") return ["Plate number", "Plate number allocation"];
  return [
    "Plate number",
    "Proof of ownership",
    "Vehicle License",
    "Insurance",
    "Road worthiness",
    "Police clearance",
    "Plate number allocation",
  ];
}

const STEP_KEY_LABELS = {
  vehicle: "Vehicle",
  location: "Use & location",
  applicant: "Applicant details",
  previousOwner: "Previous owner",
  dealership: "Dealership details",
  documents: "Documents",
  review: "Review & submit",
};

// Reference-photo guides for each upload box — reuses the same generic
// placeholder set as the tinted-permit flow (public/placeholder/).
//
// Fresh registration and change of ownership require exactly these
// documents (replaced, not augmented, per the document-requirements
// overhaul) — no vehicle registration document or owner ID, since a fresh
// registration has no prior registration document to submit. Replacement
// needs only proof of ownership — a lost/damaged-plate reissue for an
// already-registered vehicle, per the confirmed simplification.
// isRegisteredCompany only matters for the dealership plan — the CAC
// certificate slot only appears once the customer has said "yes" to being a
// registered company. Both dealership doc slots are optional regardless
// (never a hard submission requirement — see DLApplicationCreate's schema
// comments), so this never affects the required-docs gate.
function getDocSlots(planKey, isRegisteredCompany) {
  if (planKey === "dealership") {
    const slots = [
      { doc_type: "company_letterhead", title: "Company Letterhead", hint: "Optional — your company's letterhead paper", image: "/placeholder/proof.jpeg", optional: true },
    ];
    if (isRegisteredCompany) {
      slots.push({ doc_type: "cac_certificate", title: "CAC Certificate", hint: "Optional — your company's CAC registration certificate", image: "/placeholder/proof.jpeg", optional: true });
    }
    return slots;
  }
  if (planKey === "replacement") {
    return [
      { doc_type: "proof_of_ownership", title: "Proof of Ownership", hint: "Purchase receipt, sales agreement, or current proof of ownership", image: "/placeholder/proof.jpeg" },
    ];
  }
  const base = [
    { doc_type: "vin_sticker_photo", title: "VIN Sticker Photo", hint: "Usually on driver-side door jamb or dashboard", image: "/placeholder/vin.jpeg" },
    { doc_type: "customs_duty_page_1", title: "Custom Duty — Page 1", hint: "First page of the Customs Duty document", image: "/placeholder/proof.jpeg" },
    { doc_type: "customs_duty_page_2", title: "Custom Duty — Page 2", hint: "Second page of the Customs Duty document", image: "/placeholder/proof.jpeg" },
    { doc_type: "customs_duty_page_3", title: "Custom Duty — Page 3", hint: "Third page of the Customs Duty document", image: "/placeholder/proof.jpeg" },
    { doc_type: "proof_of_ownership", title: "Purchase Receipt / Sales Agreement", hint: "Evidence of ownership", image: "/placeholder/proof.jpeg" },
  ];
  if (planKey === "change-of-ownership") {
    base.push({ doc_type: "previous_owner_particulars", title: "Previous Owner's Particulars", hint: "Old particulars/documents from the previous owner", image: "/placeholder/person.jpeg" });
  }
  return base;
}

export default function NumberPlateNewApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = PLATE_TYPES[searchParams.get("type")] ? searchParams.get("type") : "new";
  const plan = PLATE_TYPES[planKey];
  const isChangeOfOwnership = planKey === "change-of-ownership";
  const isDealership = planKey === "dealership";
  // Dealership plates are the only plan with no vehicle at all.
  const requiresVehicle = plan.requiresVehicle !== false;
  // Fresh registration and change of ownership collect full applicant
  // identity (tester feedback) — replacement stays a lightweight
  // vehicle+documents submission for an already-registered plate.
  // Dealership has its own dedicated step for its (different) identity
  // fields, so it's excluded here too.
  const needsApplicantDetails = planKey !== "replacement" && !isDealership;

  const [step, setStep] = useState(1);

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
  const [previousOwnerDetails, setPreviousOwnerDetails] = useState("");
  const [applicantForm, setApplicantForm] = useState(() => {
    const cachedUser = getCachedUser();
    return {
      first_name: "", middle_name: "", last_name: "", residential_address: "",
      applicant_phone: cachedUser?.phone || "", nin: "", former_registration_number: "",
    };
  });
  // Requested plate number -- fancy plate only (a standalone plan now, not
  // a toggle inside new/change-of-ownership).
  const [fancyPlateNumber, setFancyPlateNumber] = useState("");

  // Dealership only — no vehicle at all, a distinct set of identity fields.
  // CAC certificate stays optional even when isRegisteredCompany is true
  // (per the confirmed requirement) — it only controls whether the upload
  // slot is offered, never a submission requirement.
  const [isRegisteredCompany, setIsRegisteredCompany] = useState(true);
  const [dealershipForm, setDealershipForm] = useState(() => {
    const cachedUser = getCachedUser();
    return {
      dealership_name: "", residential_address: "",
      applicant_phone: cachedUser?.phone || "", applicant_email: cachedUser?.email || "", nin: "",
    };
  });
  const [dealershipPassportPhoto, setDealershipPassportPhoto] = useState("");

  const docSlots = getDocSlots(planKey, isRegisteredCompany);
  const requiredDocSlots = docSlots.filter((s) => !s.optional);
  const stepKeys = [
    ...(requiresVehicle ? ["vehicle"] : []),
    "location",
    ...(needsApplicantDetails ? ["applicant"] : []),
    ...(isChangeOfOwnership ? ["previousOwner"] : []),
    ...(isDealership ? ["dealership"] : []),
    "documents",
    "review",
  ];
  const stepLabels = stepKeys.map((k) => STEP_KEY_LABELS[k]);
  const totalSteps = stepKeys.length;
  const stepIndex = (key) => stepKeys.indexOf(key) + 1;
  const DOC_STEP = stepIndex("documents");
  const REVIEW_STEP = stepIndex("review");

  const [docs, setDocs] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const [feeKobo, setFeeKobo] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [payOpts, setPayOpts] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Draft autosave/resume, keyed by the resolved subtype (this wizard's
  // subtype is fixed via ?type= before mount, unlike driver's-licence).
  const { draftFormData, hydrated, save, clearDraft, markSubmitting } = useApplicationDraft(plan.application_type);
  const draftAppliedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || draftAppliedRef.current) return;
    draftAppliedRef.current = true;
    if (!draftFormData) return;
    if (draftFormData.selectedVehicleId != null) setSelectedVehicleId(draftFormData.selectedVehicleId);
    if (draftFormData.selectedStateId != null) setSelectedStateId(draftFormData.selectedStateId);
    if (draftFormData.previousOwnerDetails != null) setPreviousOwnerDetails(draftFormData.previousOwnerDetails);
    if (draftFormData.applicantForm) setApplicantForm((f) => ({ ...f, ...draftFormData.applicantForm }));
    if (draftFormData.fancyPlateNumber != null) setFancyPlateNumber(draftFormData.fancyPlateNumber);
    if (draftFormData.isRegisteredCompany != null) setIsRegisteredCompany(draftFormData.isRegisteredCompany);
    if (draftFormData.dealershipForm) setDealershipForm((f) => ({ ...f, ...draftFormData.dealershipForm }));
    if (draftFormData.dealershipPassportPhoto != null) setDealershipPassportPhoto(draftFormData.dealershipPassportPhoto);
    if (draftFormData.docs) setDocs(draftFormData.docs);
    if (draftFormData.step != null) setStep(draftFormData.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, draftFormData]);

  useEffect(() => {
    Promise.all([getReferenceStates(), listVehicles(), getWallet()]).then(
      ([statesRes, vehiclesRes, walletRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
          // Functional update — a draft restore (see the hydration effect
          // above) may set selectedVehicleId around the same time this
          // resolves; reading the latest state here (instead of defaulting
          // unconditionally) means whichever of the two actually finishes
          // last never clobbers a real draft-restored selection.
          if (vehiclesRes.data.length > 0) setSelectedVehicleId((prev) => prev ?? vehiclesRes.data[0].id);
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

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const estimatedFeeKobo = feeKobo ?? plan.fallbackFeeKobo;

  // Live, state-aware flat price (vehicle category no longer affects it) --
  // refetched whenever the selected vehicle or registration state changes.
  // Falls back to plan.fallbackFeeKobo (set above) until both are chosen.
  useEffect(() => {
    if (isDealership) {
      // No vehicle to key the fee lookup on — dealership is flat, state-aware
      // pricing (like tinted permit / RWX), so it's quoted from the same
      // published fee-schedule the rest of the catalog uses. This is
      // deliberately NOT the hardcoded fallbackFeeKobo — that's a last-resort
      // only, so an admin price edit via /admin/pricing is reflected live
      // here instead of silently diverging from what checkout actually charges.
      getDriverLicenceFeeSchedule({ state_id: selectedStateId ? Number(selectedStateId) : undefined }).then((res) => {
        const row = res.data?.prices?.find((p) => p.application_type === "number_plate_dealership");
        if (row?.amount_kobo != null) setFeeKobo(row.amount_kobo);
      });
      return;
    }
    if (!selectedVehicleId || !selectedStateId) return;
    getNumberPlateFee({
      application_type: plan.application_type,
      vehicle_id: selectedVehicleId,
      state_id: Number(selectedStateId),
    }).then((res) => {
      if (res.data?.amount_kobo != null) setFeeKobo(res.data.amount_kobo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId, selectedStateId, isDealership]);

  const handleCreateVehicle = async () => {
    const errors = {};
    if (plan.requiresExistingPlate) {
      if (!vehicleForm.plate_number.trim()) errors.plate_number = "This vehicle's current plate number is required.";
      else if (!PLATE_RE.test(vehicleForm.plate_number.trim())) errors.plate_number = "Use 4-15 letters, digits, or hyphens.";
    } else if (vehicleForm.plate_number.trim() && !PLATE_RE.test(vehicleForm.plate_number.trim())) {
      errors.plate_number = "Use 4-15 letters, digits, or hyphens, or leave blank.";
    }
    if (!vehicleForm.make.trim()) errors.make = "Make is required.";
    if (!vehicleForm.model.trim()) errors.model = "Model is required.";
    if (!vehicleForm.colour.trim()) errors.colour = "Colour is required.";
    if (!vehicleForm.state_id) errors.state_id = "Select a state.";
    if (needsApplicantDetails && !vehicleForm.chassis_number.trim()) {
      errors.chassis_number = "Chassis/VIN number is required for this application type.";
    }
    if (Object.keys(errors).length > 0) {
      setVehicleFieldErrors(errors);
      return;
    }
    setVehicleFieldErrors({});
    setCreatingVehicle(true);
    const res = await createVehicle({
      ...vehicleForm,
      plate_number: vehicleForm.plate_number.trim() || undefined,
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
    // Key-based (not raw step-number) checks — "vehicle" isn't always step
    // 1 now that dealership omits it entirely, so stepKeys[n-1] is the only
    // reliable way to know which step is actually being validated.
    if (stepKeys[n - 1] === "vehicle") {
      if (!selectedVehicleId) errors.vehicle = "Pick a vehicle, or add one, to continue.";
      else if (plan.requiresExistingPlate && !selectedVehicle?.plate_number) {
        errors.vehicle = "This vehicle has no plate number on file — add its current plate number, or choose 'New Plate' instead.";
      } else if (needsApplicantDetails && !selectedVehicle?.chassis_number) {
        errors.vehicle = "This vehicle has no chassis/VIN number on file — add a new vehicle with a chassis number, or update this one.";
      }
    }
    if (stepKeys[n - 1] === "location") {
      if (!selectedStateId) errors.state = "Select the state to register this plate in.";
    }
    if (stepKeys[n - 1] === "dealership") {
      if (!dealershipForm.dealership_name.trim()) errors.dealership_name = "Dealership name is required.";
      if (!dealershipForm.residential_address.trim()) errors.residential_address = "Address is required.";
      if (!dealershipForm.applicant_phone.trim()) errors.applicant_phone = "Phone number is required.";
      if (!dealershipForm.applicant_email.trim()) errors.applicant_email = "Email is required.";
      const trimmedNin = dealershipForm.nin.trim();
      if (!trimmedNin) errors.nin = "NIN is required.";
      else if (!NIN_RE.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (!dealershipPassportPhoto) errors.passportPhoto = "Upload a passport photo to continue.";
    }
    if (n === stepIndex("applicant")) {
      if (!applicantForm.first_name.trim()) errors.first_name = "First name is required.";
      if (!applicantForm.last_name.trim()) errors.last_name = "Surname is required.";
      if (!applicantForm.residential_address.trim()) errors.residential_address = "Address is required.";
      if (!applicantForm.applicant_phone.trim()) errors.applicant_phone = "Phone number is required.";
      const trimmedNin = applicantForm.nin.trim();
      if (!trimmedNin) errors.nin = "NIN is required.";
      else if (!NIN_RE.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (planKey === "fancy") {
        const trimmedFancy = fancyPlateNumber.trim();
        if (!trimmedFancy) errors.fancyPlateNumber = "Enter your requested plate number.";
        else if (trimmedFancy.length > 8) errors.fancyPlateNumber = "Must be at most 8 characters.";
      }
    }
    if (n === stepIndex("previousOwner")) {
      if (!previousOwnerDetails.trim()) errors.previousOwnerDetails = "Previous owner's details are required.";
    }
    if (n === DOC_STEP) {
      const allRequiredDocsUploaded = requiredDocSlots.every((slot) => docs[slot.doc_type]?.url);
      if (!allRequiredDocsUploaded) errors.documents = "Upload every required document to continue.";
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
    const nextStep = Math.min(totalSteps, step + 1);
    setStep(nextStep);
    save(
      {
        selectedVehicleId,
        selectedStateId,
        previousOwnerDetails,
        applicantForm,
        fancyPlateNumber,
        isRegisteredCompany,
        dealershipForm,
        dealershipPassportPhoto,
        docs,
        step: nextStep,
      },
      `Step ${nextStep} of ${totalSteps}`
    );
  };

  const canSubmit =
    (!requiresVehicle || selectedVehicleId) &&
    (!plan.requiresExistingPlate || selectedVehicle?.plate_number) &&
    (!needsApplicantDetails || selectedVehicle?.chassis_number) &&
    selectedStateId &&
    (!needsApplicantDetails || (
      applicantForm.first_name.trim() && applicantForm.last_name.trim() &&
      applicantForm.residential_address.trim() && applicantForm.applicant_phone.trim() &&
      NIN_RE.test(applicantForm.nin.trim())
    )) &&
    (planKey !== "fancy" || (fancyPlateNumber.trim() && fancyPlateNumber.trim().length <= 8)) &&
    (!isChangeOfOwnership || previousOwnerDetails.trim()) &&
    (!isDealership || (
      dealershipForm.dealership_name.trim() && dealershipForm.residential_address.trim() &&
      dealershipForm.applicant_phone.trim() && dealershipForm.applicant_email.trim() &&
      NIN_RE.test(dealershipForm.nin.trim()) && dealershipPassportPhoto
    )) &&
    requiredDocSlots.every((slot) => docs[slot.doc_type]?.url);

  const handleSubmit = async () => {
    const stepsToCheck = Array.from({ length: totalSteps - 1 }, (_, i) => i + 1);
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
    const res = await submitDriverLicenceApplication({
      application_type: plan.application_type,
      vehicle_id: isDealership ? undefined : selectedVehicleId,
      state_id: Number(selectedStateId),
      previous_owner_details: isChangeOfOwnership ? previousOwnerDetails : undefined,
      first_name: needsApplicantDetails ? applicantForm.first_name.trim() : undefined,
      middle_name: needsApplicantDetails ? applicantForm.middle_name.trim() || undefined : undefined,
      last_name: needsApplicantDetails ? applicantForm.last_name.trim() : undefined,
      residential_address: isDealership ? dealershipForm.residential_address.trim() : (needsApplicantDetails ? applicantForm.residential_address.trim() : undefined),
      applicant_phone: isDealership ? dealershipForm.applicant_phone.trim() : (needsApplicantDetails ? applicantForm.applicant_phone.trim() : undefined),
      nin: isDealership ? dealershipForm.nin.trim() : (needsApplicantDetails ? applicantForm.nin.trim() : undefined),
      former_registration_number: needsApplicantDetails ? applicantForm.former_registration_number.trim() || undefined : undefined,
      fancy_plate_number: planKey === "fancy" ? fancyPlateNumber.trim() : undefined,
      // Dealership only.
      applicant_email: isDealership ? dealershipForm.applicant_email.trim() : undefined,
      dealership_name: isDealership ? dealershipForm.dealership_name.trim() : undefined,
      is_registered_company: isDealership ? isRegisteredCompany : undefined,
      passport_photo: isDealership ? dealershipPassportPhoto : undefined,
      documents: docSlots.filter((slot) => docs[slot.doc_type]?.url).map((slot) => ({ doc_type: slot.doc_type, file_url: docs[slot.doc_type].url })),
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
        router.push("/dashboard/apply/number-plate");
        return;
      }
      setPayOpts((prev) => ({ ...prev, remaining_kobo: res.data.remaining_kobo, amount_kobo: prev?.amount_kobo }));
    }
  };

  const isPaid = successApp ? (payOpts?.remaining_kobo ?? payOpts?.amount_kobo ?? 0) <= 0 : false;

  // "Pay by card" opens Monnify in a new tab — this tab never gets a
  // callback, so it has to notice payment completion itself once the
  // customer switches back, instead of leaving them stranded on this form.
  useEffect(() => {
    if (!successApp || isPaid) return;
    const checkPayment = async () => {
      const res = await getApplication(successApp.id);
      const opts = res.data?.payment_options;
      if (!opts) return;
      const remaining = opts.remaining_kobo ?? opts.amount_kobo ?? 0;
      if (remaining <= 0) {
        router.push("/dashboard/apply/number-plate");
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
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: BRAND_TINT }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: BRAND }} />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">{plan.title} application submitted</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            We'll route this to VIO and keep you updated in your dashboard.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Total</span>
              <span className="font-mono font-bold text-[#111111]">{koboToNaira(payOpts?.amount_kobo ?? estimatedFeeKobo)}</span>
            </div>
          </div>

          {!isPaid && payOpts && (
            <div className="mt-5 space-y-2.5 text-left">
              <PartialPayControls
                remainingKobo={payOpts.remaining_kobo ?? payOpts.amount_kobo}
                walletBalanceKobo={walletBalance}
                payingWallet={payingFromWallet}
                onPay={handlePayFromWallet}
              />
              {payOpts.checkout_url && (
                <a href={payOpts.checkout_url} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} w-full`}>
                  Card or Transfer
                </a>
              )}
            </div>
          )}

          <button type="button" onClick={() => router.push("/dashboard/apply/number-plate")} className={`${btnPrimary} mt-6 w-full`} style={{ background: BRAND }}>
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
        <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Apply — {plan.title}</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Upload the documents below. We'll process your application with VIO end-to-end.
        </p>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-[12.5px] text-slate-600">Estimated total: {koboToNaira(estimatedFeeKobo)}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
          <ShieldCheck className="h-4 w-4" style={{ color: BRAND }} /> What your payment covers
        </h2>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {getWhatsCovered(planKey).map((item) => (
            <li key={item} className="flex items-center gap-2 text-[12.5px] text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND }} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <StepProgress steps={stepLabels} current={step} />

      {/* Step — Vehicle (omitted entirely for dealership) */}
      {requiresVehicle && stepKeys[step - 1] === "vehicle" && (
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
                  <label className={label}>
                    Plate number {!plan.requiresExistingPlate && <span className="font-normal text-slate-400">(leave blank if none yet)</span>}
                  </label>
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
                  <label className={label}>
                    Chassis number {needsApplicantDetails ? <span className="text-red-400">*</span> : <span className="font-normal text-slate-400">(optional)</span>}
                  </label>
                  <input
                    className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.chassis_number)}`}
                    value={vehicleForm.chassis_number}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, chassis_number: e.target.value }))}
                  />
                  <FieldError message={vehicleFieldErrors.chassis_number} />
                </div>
                <div>
                  <label className={label}>Engine number <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    className={inputBase}
                    value={vehicleForm.engine_number}
                    onChange={(e) => setVehicleForm((f) => ({ ...f, engine_number: e.target.value }))}
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

      {/* Step — Location */}
      {stepKeys[step - 1] === "location" && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Location</h2>
          <div className="space-y-4">
            <div>
              <label className={label}>State to register this plate in</label>
              <select
                className={`${inputBase} ${errInputClass(!!fieldErrors.state)}`}
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
              >
                <option value="">Select state</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <FieldError message={fieldErrors.state} />
              <p className="mt-1.5 text-[11.5px] text-slate-500">
                Price is based on this state — the same flat fee for every {isDealership ? "dealership" : "vehicle"}.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Step — Dealership details (dealership only) */}
      {isDealership && step === stepIndex("dealership") && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
            <Building2 className="h-4 w-4" style={{ color: BRAND }} /> Dealership details
          </h2>
          <div className="space-y-4">
            <div>
              <label className={label}>Is this a registered company?</label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisteredCompany(true)}
                  className="flex-1 rounded-xl border-2 p-3 text-[13px] font-semibold transition-all"
                  style={{ borderColor: isRegisteredCompany ? BRAND : "#e2e8f0", background: isRegisteredCompany ? BRAND_TINT : "#fff", color: isRegisteredCompany ? BRAND : "#475569" }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisteredCompany(false)}
                  className="flex-1 rounded-xl border-2 p-3 text-[13px] font-semibold transition-all"
                  style={{ borderColor: !isRegisteredCompany ? BRAND : "#e2e8f0", background: !isRegisteredCompany ? BRAND_TINT : "#fff", color: !isRegisteredCompany ? BRAND : "#475569" }}
                >
                  No
                </button>
              </div>
              <p className="mt-1.5 text-[11.5px] text-slate-500">
                {isRegisteredCompany
                  ? "You'll be able to attach your CAC certificate on the next step — optional."
                  : "No problem — we'll just need your dealership's details below."}
              </p>
            </div>
            <div>
              <label className={label}>Dealership name <span className="text-red-400">*</span></label>
              <input
                className={`${inputBase} ${errInputClass(!!fieldErrors.dealership_name)}`}
                value={dealershipForm.dealership_name}
                onChange={(e) => setDealershipForm((f) => ({ ...f, dealership_name: e.target.value }))}
                placeholder="e.g. THE BEATS AUTOS"
              />
              <FieldError message={fieldErrors.dealership_name} />
            </div>
            <div>
              <label className={label}>Address <span className="text-red-400">*</span></label>
              <input
                className={`${inputBase} ${errInputClass(!!fieldErrors.residential_address)}`}
                value={dealershipForm.residential_address}
                onChange={(e) => setDealershipForm((f) => ({ ...f, residential_address: e.target.value }))}
                placeholder="e.g. 74 Modupe Young Thomas Estate, Ajah, Lagos, Nigeria"
              />
              <FieldError message={fieldErrors.residential_address} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Phone number <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_phone)}`}
                  value={dealershipForm.applicant_phone}
                  onChange={(e) => setDealershipForm((f) => ({ ...f, applicant_phone: e.target.value }))}
                />
                <FieldError message={fieldErrors.applicant_phone} />
              </div>
              <div>
                <label className={label}>Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_email)}`}
                  value={dealershipForm.applicant_email}
                  onChange={(e) => setDealershipForm((f) => ({ ...f, applicant_email: e.target.value }))}
                />
                <FieldError message={fieldErrors.applicant_email} />
              </div>
            </div>
            <div>
              <label className={label}>NIN <span className="text-red-400">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`}
                value={dealershipForm.nin}
                onChange={(e) => setDealershipForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))}
                placeholder="12345678901"
              />
              <FieldError message={fieldErrors.nin} />
            </div>
            <div>
              <label className={label}>Passport photo <span className="text-red-400">*</span></label>
              <UploadSlot
                slot={{ doc_type: "passport_photo", title: "Passport photo", hint: "A clear photo of the dealership's contact person" }}
                value={dealershipPassportPhoto ? { fileName: "Passport photo", url: dealershipPassportPhoto } : null}
                onChange={(v) => setDealershipPassportPhoto(v?.url || "")}
              />
              <FieldError message={fieldErrors.passportPhoto} />
            </div>
          </div>
        </section>
      )}

      {/* Step — Applicant details (fresh registration + change of ownership only) */}
      {needsApplicantDetails && step === stepIndex("applicant") && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Applicant details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>First Name <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.first_name)}`}
                  value={applicantForm.first_name}
                  onChange={(e) => setApplicantForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="Ada"
                />
                <FieldError message={fieldErrors.first_name} />
              </div>
              <div>
                <label className={label}>Other name <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  className={inputBase}
                  value={applicantForm.middle_name}
                  onChange={(e) => setApplicantForm((f) => ({ ...f, middle_name: e.target.value }))}
                />
              </div>
              <div>
                <label className={label}>Surname <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} ${errInputClass(!!fieldErrors.last_name)}`}
                  value={applicantForm.last_name}
                  onChange={(e) => setApplicantForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Obi"
                />
                <FieldError message={fieldErrors.last_name} />
              </div>
            </div>
            <div>
              <label className={label}>Address <span className="text-red-400">*</span></label>
              <input
                className={`${inputBase} ${errInputClass(!!fieldErrors.residential_address)}`}
                value={applicantForm.residential_address}
                onChange={(e) => setApplicantForm((f) => ({ ...f, residential_address: e.target.value }))}
                placeholder="123 Example Street, Lagos"
              />
              <FieldError message={fieldErrors.residential_address} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Phone number <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  className={`${inputBase} ${errInputClass(!!fieldErrors.applicant_phone)}`}
                  value={applicantForm.applicant_phone}
                  onChange={(e) => setApplicantForm((f) => ({ ...f, applicant_phone: e.target.value }))}
                />
                <FieldError message={fieldErrors.applicant_phone} />
              </div>
              <div>
                <label className={label}>NIN <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`}
                  value={applicantForm.nin}
                  onChange={(e) => setApplicantForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))}
                  placeholder="12345678901"
                />
                <FieldError message={fieldErrors.nin} />
              </div>
            </div>
            <div>
              <label className={label}>Former Registration Number <span className="font-normal text-slate-400">(if any)</span></label>
              <input
                className={inputBase}
                value={applicantForm.former_registration_number}
                onChange={(e) => setApplicantForm((f) => ({ ...f, former_registration_number: e.target.value }))}
              />
            </div>
            {planKey === "fancy" && (
              <div>
                <label className={label}>Requested plate number <span className="text-red-400">*</span></label>
                <input
                  className={`${inputBase} font-mono uppercase ${errInputClass(!!fieldErrors.fancyPlateNumber)}`}
                  value={fancyPlateNumber}
                  maxLength={8}
                  onChange={(e) => setFancyPlateNumber(e.target.value.toUpperCase())}
                  placeholder="BOSS001"
                />
                <FieldError message={fieldErrors.fancyPlateNumber} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 3 — Previous owner (change of ownership only) */}
      {isChangeOfOwnership && step === stepIndex("previousOwner") && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Previous owner</h2>
          <label className={label}>Previous owner's details</label>
          <textarea
            className={`${inputBase} ${errInputClass(!!fieldErrors.previousOwnerDetails)}`}
            rows={4}
            value={previousOwnerDetails}
            onChange={(e) => setPreviousOwnerDetails(e.target.value)}
            placeholder="Name, contact, and any details relevant to the transfer."
          />
          <FieldError message={fieldErrors.previousOwnerDetails} />
        </section>
      )}

      {/* Step — Documents */}
      {step === DOC_STEP && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Documents</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {docSlots.map((slot) => (
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

      {/* Step — Review & submit */}
      {step === REVIEW_STEP && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Review your application</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Service</span>
                <span className="font-semibold text-[#111111]">{plan.title}</span>
              </div>
              {requiresVehicle && (
                <>
                  <div className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-semibold text-[#111111]">
                      {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}${selectedVehicle.plate_number ? ` — ${selectedVehicle.plate_number}` : ""}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="text-slate-500">Vehicle category</span>
                    <span className="font-semibold text-[#111111]">
                      {selectedVehicle?.vehicle_category ? VEHICLE_CATEGORY_LABELS[selectedVehicle.vehicle_category] : "—"}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">State</span>
                <span className="font-semibold text-[#111111]">{states.find((s) => String(s.id) === String(selectedStateId))?.name || "—"}</span>
              </div>
              {isDealership && (
                <>
                  <div className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="text-slate-500">Dealership</span>
                    <span className="font-semibold text-[#111111]">{dealershipForm.dealership_name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-[13px]">
                    <span className="text-slate-500">Registered company</span>
                    <span className="font-semibold text-[#111111]">{isRegisteredCompany ? "Yes" : "No"}</span>
                  </div>
                </>
              )}
              {needsApplicantDetails && (
                <div className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-slate-500">Applicant</span>
                  <span className="font-semibold text-[#111111]">
                    {[applicantForm.first_name, applicantForm.middle_name, applicantForm.last_name].filter(Boolean).join(" ") || "—"}
                  </span>
                </div>
              )}
              {isChangeOfOwnership && previousOwnerDetails.trim() && (
                <div className="py-2.5 text-[13px]">
                  <span className="block text-slate-500">Previous owner</span>
                  <span className="mt-1 block text-[#111111]">{previousOwnerDetails}</span>
                </div>
              )}
              {planKey === "fancy" && fancyPlateNumber.trim() && (
                <div className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-slate-500">Fancy plate number</span>
                  <span className="font-mono font-semibold text-[#111111]">{fancyPlateNumber.trim()}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Documents</span>
                <span className="font-semibold text-[#111111]">
                  {docSlots.filter((s) => docs[s.doc_type]?.url).length} of {docSlots.length} uploaded
                </span>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-[13.5px] font-bold text-[#111111]">Payment</h2>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">{plan.title}</span>
              <span className="font-semibold text-[#111111]">{koboToNaira(estimatedFeeKobo)}</span>
            </div>
            <p className="mt-2 text-[20px] font-bold text-[#111111]">Total: {koboToNaira(estimatedFeeKobo)}</p>
            <p className="mt-1 text-[12px] text-slate-500">Pay in full, or at least the ₦10,000 minimum to get started — the rest can follow.</p>
          </section>

          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}

          <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit application"}
          </button>
        </section>
      )}

      {/* Step navigation */}
      {step < totalSteps && (
        <div className="flex items-center justify-between gap-3">
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
      {step === totalSteps && (
        <button type="button" onClick={() => setStep(totalSteps - 1)} className={btnSecondary}>
          Back
        </button>
      )}
    </div>
  );
}
