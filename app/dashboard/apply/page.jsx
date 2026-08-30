"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Info,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Clock,
  X,
  Loader2,
  Phone,
} from "lucide-react";
import {
  getCachedUser,
  authGetMe,
  getReferenceStates,
  getReferenceLgas,
  submitDriverLicenceApplication,
  uploadApplicationFile,
  getMyApplications,
  payFromWalletEndpoint,
  getWallet,
  getDriverLicenceEligibility,
  getDriverLicenceFeeSchedule,
} from "@/lib/api";
import DocumentRing from "@/app/components/design/DocumentRing";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";
import StatusBadge from "@/app/dashboard/_shared/StatusBadge";
import DateOfBirthInput from "@/app/dashboard/_shared/DateOfBirthInput";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { colors } from "@/lib/design-tokens";
import {
  koboToNaira,
  formatDate,
  errInputClass,
  FieldError,
  isApplicationPaid,
  StepProgress,
  IneligibilityNotice,
} from "@/app/dashboard/_shared/apply-helpers";

const BRAND = colors.primary.DEFAULT;
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */
function ageFromDob(dobStr) {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const APPLICATION_TYPES = [
  { value: "fresh", label: "Fresh application", desc: "First-time licence — includes driving school enrollment." },
  { value: "renewal", label: "Renewal", desc: "Renew a licence that's expired or expiring soon." },
  { value: "reissue", label: "Reissue", desc: "Replace a lost, stolen, or damaged licence." },
  { value: "international_permit", label: "International Driver's Permit", desc: "Apply for an international driving permit." },
];

// Delivery-timeline copy per application type — shown so the applicant knows
// what to expect before they submit, not just after.
const TIMELINE_COPY_BY_TYPE = {
  fresh: "Processing takes up to 26 working days before your biometric capturing appointment at the FRSC center.",
  renewal: "Processing takes up to 5 working days.",
  reissue: "Processing takes up to 5 working days.",
  international_permit: "Processing takes up to 2 weeks.",
};

// Standard FRSC licence classes — required for fresh applications so the
// assigned agent knows what to process (app/schemas/application.py
// LICENCE_CLASSES enforces the same set server-side).
const LICENCE_CLASSES = [
  { value: "A", label: "Class A — Motorcycle" },
  { value: "B", label: "Class B — Private car (up to 8 seats)" },
  { value: "C", label: "Class C — Commercial / taxi" },
  { value: "D", label: "Class D — Articulated / heavy truck" },
  { value: "E", label: "Class E — Bus (8+ passengers)" },
  { value: "F", label: "Class F — Agricultural / tractor" },
  { value: "G", label: "Class G — Earth-moving equipment" },
  { value: "H", label: "Class H — Motorised wheelchair" },
];

const VALIDITY_PERIODS = ["3 years", "5 years"];

// Mirrors the backend's validators exactly (app/schemas/application.py
// NAME_RE, NIN_RE, _validate_dob_adult, _validate_height) so bad input is
// caught before submit instead of surfacing only as a 422 on step 5.
const NAME_RE = /^[A-Za-z' -]{2,50}$/;
const NIN_RE = /^\d{11}$/;
const MIN_APPLICANT_AGE = 18;

// Hardcoded last-resort mirror of the backend's fallback fee schedule
// (app/core/payment_helpers.py _FALLBACK_FEE_SCHEDULE) — only used for the
// pre-submission cost preview when the live, state-aware GET
// /applications/driver-licence/fee-schedule call (liveFeeSchedule, fetched
// on selectedState change) hasn't resolved yet. Everywhere else in this
// app, amounts come straight from the backend.
const FEE_SCHEDULE_KOBO = {
  fresh: { "3 years": 3867500, "5 years": 4577500 },
  renewal: { "3 years": 3000000, "5 years": 3500000 },
};
function estimateFeeKobo(appType, period, liveFeeSchedule) {
  const live = liveFeeSchedule?.find((p) => p.application_type === appType && p.validity_period === period);
  if (live?.amount_kobo != null) return live.amount_kobo;
  const bucket = appType === "fresh" ? FEE_SCHEDULE_KOBO.fresh : FEE_SCHEDULE_KOBO.renewal;
  return bucket[period] || bucket["5 years"];
}

function DocUploadSlot({ title, value, onChange, optional = false, hint }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    // file_url is the short server-side storage path (e.g. "/uploads/...")
    // returned by the real upload — never the raw file contents.
    onChange({ fileName: file.name, url: data.file_url });
  };

  return (
    <div>
      <label className={label}>
        {title}{" "}
        {optional ? (
          <span className="font-normal text-slate-400">(optional)</span>
        ) : (
          <span className="text-red-400">*</span>
        )}
      </label>
      {hint && <p className="mb-2 -mt-1 text-[12px] text-slate-500">{hint}</p>}
      {!value?.url ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all"
          style={{
            borderColor: dragActive ? BRAND : "#cbd5e1",
            background: dragActive ? BRAND_TINT : "#f8fafc",
          }}
        >
          <Upload className="h-5 w-5" style={{ color: BRAND }} />
          <p className="text-[12.5px] font-semibold text-slate-700">{uploading ? "Uploading…" : "Click or drop a file here"}</p>
          <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP — up to 10MB</p>
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
        </label>
      ) : (
        <div className="space-y-2 rounded-xl border border-[#E5E5E5] bg-slate-50/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="truncate text-[12.5px] font-semibold text-[#111111]">{value.fileName}</p>
              <span className="shrink-0 text-[11px] text-slate-400">Ready</span>
            </div>
            <button type="button" onClick={() => onChange(null)} className="shrink-0 text-[11px] font-medium text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-[11.5px] font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────────────────────── */
export default function ApplyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(() => getCachedUser());
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [existingApplications, setExistingApplications] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const [payingFromWallet, setPayingFromWallet] = useState(null);
  const payingFromWalletRef = useRef(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const [step, setStep] = useState(1); // 1..5
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [applicationType, setApplicationType] = useState("fresh");
  const [licenceClass, setLicenceClass] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [liveFeeSchedule, setLiveFeeSchedule] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("Nigerian");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [mothersMaidenName, setMothersMaidenName] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [nin, setNin] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [hasFacialMark, setHasFacialMark] = useState(false);
  const [facialMarkDesc, setFacialMarkDesc] = useState("");
  const [hasDisability, setHasDisability] = useState(false);
  const [disabilityDesc, setDisabilityDesc] = useState("");
  const [passportPhoto, setPassportPhoto] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [originLgas, setOriginLgas] = useState([]);
  const [selectedOriginState, setSelectedOriginState] = useState("");
  const [selectedOriginLga, setSelectedOriginLga] = useState("");
  const [nokName, setNokName] = useState("");
  const [nokRelationship, setNokRelationship] = useState("");
  const [nokPhone, setNokPhone] = useState("+234");
  // Renewal/reissue required documents, keyed by exact backend doc_type
  // string (e.g. { old_driver_licence: { fileName, url } }).
  const [renewalDocs, setRenewalDocs] = useState({});
  const [oldLicenceNumber, setOldLicenceNumber] = useState("");
  // { [application_type]: { eligible, reason, current_expiry_date, eligible_from_date } }
  const [eligibilityByType, setEligibilityByType] = useState({});

  useEffect(() => {
    // Computed from the URL directly (not the applicationType state
    // variable) — a separate effect below also sets applicationType from
    // this same ?type= param, and reading state here would race it: both
    // effects' closures capture applicationType as it was at the initial
    // render ("fresh"), regardless of which effect's async callback
    // actually resolves first.
    const typeParam = searchParams.get("type");
    const initialType = ["fresh", "renewal", "reissue"].includes(typeParam) ? typeParam : "fresh";
    getDriverLicenceEligibility().then((res) => {
      if (res.data?.items) {
        const byType = Object.fromEntries(res.data.items.map((i) => [i.application_type, i]));
        setEligibilityByType(byType);
        // If the intended initial type is ineligible (most commonly:
        // "fresh" default, customer already has a licence), don't leave
        // them stuck on a disabled tile with no obvious next step — jump
        // to the first type that IS eligible.
        if (byType[initialType]?.eligible === false) {
          const firstEligible = APPLICATION_TYPES.find((t) => byType[t.value]?.eligible !== false);
          if (firstEligible) setApplicationType(firstEligible.value);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([authGetMe(), getReferenceStates(), getMyApplications({ sort: "updated_at" }), getWallet()]).then(
      ([meRes, statesRes, appsRes, walletRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (appsRes.data) setExistingApplications(appsRes.data.filter((a) => a.application_type !== "tinted_permit"));
        if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
        setLoadingExisting(false);

        if (meRes.data) {
          setUser(meRes.data);
          // Most recent past application is the prefill source (has city,
          // height, disability/facial-mark, passport photo, and real
          // origin-state/LGA ids) — falls through to a hardcoded default
          // when there's no prior application. NIN never prefills: the
          // applications list endpoint redacts it (NDPA), so it starts blank.
          const latestApp = (appsRes.data && appsRes.data[0]) || {};
          const pick = (appVal, fallback = "") =>
            appVal !== undefined && appVal !== null && appVal !== "" ? appVal : fallback;

          setFirstName(pick(latestApp.first_name, (meRes.data.name || "").split(" ")[0] || ""));
          setMiddleName(pick(latestApp.middle_name, ""));
          setLastName(pick(latestApp.last_name, (meRes.data.name || "").split(" ").slice(1).join(" ") || ""));
          setDob(pick(latestApp.date_of_birth, ""));
          setGender(pick(latestApp.gender, ""));
          setNationality(pick(latestApp.nationality, "Nigerian"));
          setMaritalStatus(pick(latestApp.marital_status, ""));
          setMothersMaidenName(pick(latestApp.mothers_maiden_name, ""));
          setResidentialAddress(pick(latestApp.residential_address, ""));
          setCity(latestApp.city || "");
          setCountry(latestApp.country || "Nigeria");
          setNin("");
          setBloodGroup(pick(latestApp.blood_group, ""));
          setHeightCm(latestApp.height_cm != null ? String(latestApp.height_cm) : "");
          if (latestApp.has_facial_mark) {
            setHasFacialMark(true);
            setFacialMarkDesc(latestApp.facial_mark_description || "");
          }
          if (latestApp.has_disability) {
            setHasDisability(true);
            setDisabilityDesc(latestApp.disability_description || "");
          }
          setPassportPhoto(latestApp.passport_photo || "");
          setNokName(pick(latestApp.next_of_kin_name, ""));
          setNokRelationship(pick(latestApp.next_of_kin_relationship, ""));
          setNokPhone(pick(latestApp.next_of_kin_phone, "+234"));
          if (meRes.data.state_id) setSelectedState(String(meRes.data.state_id));
          if (latestApp.origin_state_id) setSelectedOriginState(String(latestApp.origin_state_id));
        }
      }
    );

    // e.g. /dashboard/apply?type=renewal — used by the "Apply for renewal"
    // CTA shown once a fresh application's permanent licence has expired.
    const typeParam = searchParams.get("type");
    if (["fresh", "renewal", "reissue"].includes(typeParam)) {
      setApplicationType(typeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setLgas([]);
      setSelectedLga("");
      return;
    }
    getReferenceLgas(selectedState).then((res) => {
      if (res.data) {
        setLgas(res.data);
        if (user?.lga_id && !selectedLga) {
          const match = res.data.find((l) => String(l.id) === String(user.lga_id));
          if (match) setSelectedLga(String(match.id));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  // Live, state-aware pre-submission price preview — replaces the hardcoded
  // FEE_SCHEDULE_KOBO estimate once a state is selected, so the review-step
  // figure matches what submission will actually charge (per-state pricing).
  useEffect(() => {
    getDriverLicenceFeeSchedule(selectedState ? { state_id: parseInt(selectedState, 10) } : {}).then((res) => {
      if (res.data?.prices) setLiveFeeSchedule(res.data.prices);
    });
  }, [selectedState]);

  useEffect(() => {
    if (!selectedOriginState) {
      setOriginLgas([]);
      setSelectedOriginLga("");
      return;
    }
    getReferenceLgas(selectedOriginState).then((res) => {
      if (res.data) {
        setOriginLgas(res.data);
        const originLgaId = existingApplications[0]?.origin_lga_id;
        if (originLgaId && !selectedOriginLga) {
          const match = res.data.find((l) => String(l.id) === String(originLgaId));
          if (match) setSelectedOriginLga(String(match.id));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOriginState]);

  const stateObj = states.find((s) => String(s.id) === String(selectedState));
  const lgaObj = lgas.find((l) => String(l.id) === String(selectedLga));
  const originStateObj = states.find((s) => String(s.id) === String(selectedOriginState));
  const originLgaObj = originLgas.find((l) => String(l.id) === String(selectedOriginLga));

  // Mirrors the backend's validators exactly (app/schemas/application.py) so
  // incomplete/invalid data is caught here instead of only surfacing as a
  // 422 after the user reaches the final review step.
  const validateStep = (n) => {
    const errors = {};
    if (n === 1) {
      if (eligibilityByType[applicationType]?.eligible === false) errors.applicationType = "This application type isn't available for you right now — see above.";
      if (applicationType !== "international_permit" && !validityPeriod) errors.validityPeriod = "Select a validity period.";
      if (applicationType === "fresh" && !licenceClass) errors.licenceClass = "Select a licence class.";
    }
    if (n === 2) {
      if (!selectedState) errors.selectedState = "Select your state of residence.";
      if (!selectedLga) errors.selectedLga = "Select your LGA.";
      
      if (applicationType === "fresh") {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedMaiden = mothersMaidenName.trim();
      if (!trimmedFirst) errors.firstName = "First name is required.";
      else if (!NAME_RE.test(trimmedFirst)) errors.firstName = "Use 2-50 letters, hyphens, apostrophes, or spaces only.";
      if (!trimmedLast) errors.lastName = "Last name is required.";
      else if (!NAME_RE.test(trimmedLast)) errors.lastName = "Use 2-50 letters, hyphens, apostrophes, or spaces only.";
      if (trimmedMaiden && !NAME_RE.test(trimmedMaiden)) errors.mothersMaidenName = "Use 2-50 letters, hyphens, apostrophes, or spaces only.";
      if (!dob) errors.dob = "Date of birth is required.";
      else {
        const age = ageFromDob(dob);
        if (age === null || age < MIN_APPLICANT_AGE) errors.dob = `Applicant must be at least ${MIN_APPLICANT_AGE} years old.`;
      }

      const trimmedNin = nin.trim();
      if (trimmedNin && !NIN_RE.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (heightCm && (Number(heightCm) < 100 || Number(heightCm) > 250)) errors.heightCm = "Height must be between 100 and 250 cm.";
      if (hasFacialMark && !facialMarkDesc.trim()) errors.facialMarkDesc = "Describe the facial mark, or uncheck this box.";
      if (hasDisability && !disabilityDesc.trim()) errors.disabilityDesc = "Describe the disability, or uncheck this box.";
      }
    }
    if (n === 3 && applicationType === "fresh") {
      if (!nokName.trim()) errors.nokName = "Next of kin's full name is required.";
      if (!nokPhone.trim() || nokPhone.trim() === "+234") errors.nokPhone = "Next of kin's phone number is required.";
    }
    if (n === 4 && applicationType === "fresh") {
      if (!passportPhoto) errors.passportPhoto = "Upload a passport photo to continue.";
    }
    if (n === 4 && applicationType !== "fresh") {
      if (applicationType === "international_permit") {
        if (!renewalDocs.id_document?.url) errors.documents = "Attach a photo of your International Passport or Nigeria Driver's Licence.";
      } else {
        if (!renewalDocs.old_driver_licence?.url) errors.documents = "Attach a photo of the front of your old licence.";
        if (!oldLicenceNumber.trim()) errors.oldLicenceNumber = "Enter your old licence number.";
      }
      const trimmedNin = nin.trim();
      if (!trimmedNin) errors.nin = "NIN is required.";
      else if (!NIN_RE.test(trimmedNin)) errors.nin = "NIN must be exactly 11 digits.";
      if (!passportPhoto) errors.passportPhoto = "Upload a passport photo to continue.";
    }
    return errors;
  };

  const handlePayFromWallet = async (appId, amountKobo) => {
    if (payingFromWalletRef.current) return;
    payingFromWalletRef.current = true;
    setPayingFromWallet(appId);
    const res = await payFromWalletEndpoint(appId, { amount_kobo: amountKobo });
    payingFromWalletRef.current = false;
    setPayingFromWallet(null);
    if (res.error) {
      showToast("error", res.error || "Insufficient wallet funds. Please top up your wallet or pay by card.");
      return;
    }
    showToast(
      "success",
      res.data?.is_fully_paid
        ? `Paid ${koboToNaira(amountKobo)} from your wallet — application fully paid!`
        : `Paid ${koboToNaira(amountKobo)} from your wallet. ${koboToNaira(res.data?.remaining_kobo || 0)} still remaining.`
    );
    const [appsRes, walletRes] = await Promise.all([getMyApplications({ sort: "updated_at" }), getWallet()]);
    if (appsRes.data) {
      setExistingApplications(appsRes.data.filter((a) => a.application_type !== "tinted_permit"));
      if (successApp?.id === appId) {
        const updated = appsRes.data.find((a) => a.id === appId);
        if (updated) setSuccessApp(updated);
      }
    }
    if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
  };

  const handleSubmit = async () => {
    const allErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3), ...validateStep(4) };
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const firstBadStep = [1, 2, 3, 4].find((s) => Object.keys(validateStep(s)).length > 0);
      if (firstBadStep) setStep(firstBadStep);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setSubmitError(null);

    const res = applicationType === "fresh"
      ? await submitDriverLicenceApplication({
          application_type: applicationType,
          licence_class: licenceClass,
          validity_period: validityPeriod,
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob,
          gender,
          nationality,
          marital_status: maritalStatus,
          mothers_maiden_name: mothersMaidenName.trim() || undefined,
          state_of_origin: originStateObj?.name || undefined,
          lga_of_origin: originLgaObj?.name || undefined,
          origin_state_id: selectedOriginState ? parseInt(selectedOriginState, 10) : undefined,
          origin_lga_id: selectedOriginLga ? parseInt(selectedOriginLga, 10) : undefined,
          residential_address: residentialAddress.trim(),
          city: city.trim() || undefined,
          country,
          nin: nin.trim(),
          blood_group: bloodGroup,
          height_cm: heightCm ? parseInt(heightCm, 10) : undefined,
          has_facial_mark: hasFacialMark,
          facial_mark_description: hasFacialMark && facialMarkDesc.trim() ? facialMarkDesc.trim() : undefined,
          has_disability: hasDisability,
          disability_description: hasDisability && disabilityDesc.trim() ? disabilityDesc.trim() : undefined,
          passport_photo: passportPhoto,
          state_of_residence: stateObj?.name || "",
          lga: lgaObj?.name || "",
          state_id: parseInt(selectedState, 10),
          lga_id: parseInt(selectedLga, 10),
          next_of_kin_name: nokName.trim(),
          next_of_kin_relationship: nokRelationship,
          next_of_kin_phone: nokPhone.trim(),
          documents: [],
        })
      : await submitDriverLicenceApplication({
          application_type: applicationType,
          validity_period: validityPeriod,
          state_id: parseInt(selectedState, 10),
          lga_id: parseInt(selectedLga, 10),
          state_of_residence: states.find(s => s.id === parseInt(selectedState, 10))?.name || "",
          lga: lgas.find(l => l.id === parseInt(selectedLga, 10))?.name || "",
          old_licence_number: applicationType !== "international_permit" ? oldLicenceNumber.trim() : undefined,
          nin: nin.trim(),
          passport_photo: passportPhoto,
          id_document: applicationType === "international_permit" && renewalDocs.id_document?.url
            ? { doc_type: "international_passport", file_url: renewalDocs.id_document.url }
            : undefined,
          documents: applicationType !== "international_permit" && renewalDocs.old_driver_licence?.url
            ? [{ doc_type: "old_driver_licence", file_url: renewalDocs.old_driver_licence.url }]
            : [],
        });

    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSuccessApp(res.data);
      setExistingApplications([res.data, ...existingApplications]);
    }
  };

  const resetForm = () => {
    setStep(1);
    setApplicationType("fresh");
    setLicenceClass(""); setValidityPeriod("");
    setDob(""); setMiddleName(""); setGender(""); setNationality("Nigerian");
    setMaritalStatus(""); setMothersMaidenName("");
    setResidentialAddress(""); setCity(""); setCountry("Nigeria");
    setNin(""); setBloodGroup(""); setHeightCm("");
    setHasFacialMark(false); setFacialMarkDesc("");
    setHasDisability(false); setDisabilityDesc(""); setPassportPhoto("");
    setNokName(""); setNokRelationship(""); setNokPhone("+234");
    setOldLicenceNumber("");
    setRenewalDocs({});
    setSubmitError(null);
  };

  /* ── Success screen ── */
  if (successApp) {
    const payOpts = successApp.payment_options;
    const isPaid = isApplicationPaid(successApp);
    return (
      <div className="mx-auto max-w-lg py-10">
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: BRAND_TINT }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: BRAND }} />
          </div>
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Application submitted</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            Your {APPLICATION_TYPES.find((t) => t.value === successApp.application_type)?.label.toLowerCase()} is
            in — we'll walk you through every step from here.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={successApp.status} size="sm" />
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Amount due</span>
              <span className="font-mono font-bold text-[#111111]">
                {payOpts ? koboToNaira(payOpts.amount_kobo) : "—"}
              </span>
            </div>
          </div>

          {!isPaid && payOpts && (
            <div className="mt-5 space-y-2.5 text-left">
              <PartialPayControls
                remainingKobo={payOpts.remaining_kobo ?? payOpts.amount_kobo}
                walletBalanceKobo={walletBalance}
                payingWallet={payingFromWallet === successApp.id}
                onPay={(amountKobo) => handlePayFromWallet(successApp.id, amountKobo)}
              />
              {payOpts.checkout_url && (
                <a
                  href={payOpts.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnSecondary} w-full`}
                >
                  Pay with card or bank transfer
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {isPaid && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-[13px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Application fee paid
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/dashboard/applications")}
              className={`${btnPrimary} flex-1`}
              style={{ background: BRAND }}
            >
              View all applications
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessApp(null);
                resetForm();
              }}
              className={`${btnSecondary} flex-1`}
            >
              Start another
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Application form ── */
  const activeSteps = applicationType === "fresh" ? [1, 2, 3, 4, 5] : [1, 2, 4, 5];
  const activeLabels = applicationType === "fresh"
    ? ["Application type", "Personal details", "Next of kin", "Document", "Review & submit"]
    : ["Application type", "Residence", "Details", "Review & submit"];
  const stepDisplayIndex = Math.max(1, activeSteps.indexOf(step) + 1);

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4 pb-16">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/applications")}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1
            className="text-[21px] tracking-tight text-[#111111]"
            style={{ fontFamily: "var(--font-display-serif)", fontWeight: 500 }}
          >
            New application
          </h1>
          <p className="text-[12.5px] text-[#7A7A7A]">
            {applicationType === "fresh" ? "Fresh application — five short steps." : "Renewal, reissue, or international permit — just a few details."}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-[12.5px] text-slate-600">{TIMELINE_COPY_BY_TYPE[applicationType]}</p>
      </div>

      <StepProgress steps={activeLabels} current={stepDisplayIndex} />

      <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4 p-6">
            <p className="text-[13px] text-slate-500">Choose the type of application you're submitting.</p>
            <div className="space-y-2.5">
              {APPLICATION_TYPES.map((t) => {
                const active = applicationType === t.value;
                const typeEligibility = eligibilityByType[t.value];
                const disabled = typeEligibility?.eligible === false;
                return (
                  <button
                    key={t.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setApplicationType(t.value)}
                    className="flex w-full items-start gap-3.5 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: active ? BRAND : "#e2e8f0",
                      background: active ? BRAND_TINT : "#fff",
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                      style={{ borderColor: active ? BRAND : "#cbd5e1" }}
                    >
                      {active && <div className="h-2 w-2 rounded-full" style={{ background: BRAND }} />}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#111111]">{t.label}</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-500">{t.desc}</p>
                      <IneligibilityNotice eligibility={typeEligibility} />
                    </div>
                  </button>
                );
              })}
            </div>
            <FieldError message={fieldErrors.applicationType} />

            {applicationType === "fresh" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-[12.5px] text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>Fresh applications include driving school enrollment before an agent is assigned to you.</span>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 ${applicationType === "fresh" ? "sm:grid-cols-2" : ""}`}>
              {applicationType === "fresh" && (
                <div>
                  <label className={label}>Licence class <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={licenceClass}
                      onChange={(e) => setLicenceClass(e.target.value)}
                      className={`${inputBase} appearance-none pr-8 ${errInputClass(!!fieldErrors.licenceClass)}`}
                    >
                      <option value="" disabled>Select licence class</option>
                      {LICENCE_CLASSES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.licenceClass} />
                </div>
              )}
              {applicationType !== "international_permit" && (
                <div>
                  <label className={label}>Validity period <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(e.target.value)}
                      className={`${inputBase} appearance-none pr-8 ${errInputClass(!!fieldErrors.validityPeriod)}`}
                    >
                      <option value="" disabled>Select validity period</option>
                      {VALIDITY_PERIODS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.validityPeriod} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
              <div>
                <h2 className="text-[13px] font-medium text-[#111111]">State &amp; LGA of residence</h2>
                <p className="text-[12px] text-[#7A7A7A]">This determines which capturing center processes your application.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>State of residence <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedLga(""); }} className={`${inputBase} appearance-none pr-8 ${errInputClass(!!fieldErrors.selectedState)}`}>
                      <option value="" disabled>Select state</option>
                      {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.selectedState} />
                </div>
                <div>
                  <label className={label}>LGA <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!selectedState || lgas.length === 0} className={`${inputBase} appearance-none pr-8 disabled:opacity-50 ${errInputClass(!!fieldErrors.selectedLga)}`}>
                      <option value="" disabled>Select LGA</option>
                      {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <FieldError message={fieldErrors.selectedLga} />
                </div>
              </div>
            </div>

            {applicationType === "fresh" && (
              <>
                <p className="text-[13px] text-slate-500 mt-4">Pre-filled from your profile — check everything's correct.</p>
            {user && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: BRAND }}>
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#111111]">{user.name}</p>
                  <p className="truncate text-[11.5px] text-slate-500">{user.email} · {user.phone}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>First name <span className="text-red-400">*</span></label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" className={`${inputBase} ${errInputClass(!!fieldErrors.firstName)}`} />
                <FieldError message={fieldErrors.firstName} />
              </div>
              <div>
                <label className={label}>Middle name</label>
                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="(optional)" className={inputBase} />
              </div>
              <div>
                <label className={label}>Last name <span className="text-red-400">*</span></label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Obi" className={`${inputBase} ${errInputClass(!!fieldErrors.lastName)}`} />
                <FieldError message={fieldErrors.lastName} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Date of birth <span className="text-red-400">*</span></label>
                <DateOfBirthInput value={dob} onChange={setDob} hasError={!!fieldErrors.dob} />
                <FieldError message={fieldErrors.dob} />
              </div>
              <div>
                <label className={label}>Gender</label>
                <div className="relative">
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="" disabled>Select gender</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Nationality</label>
                <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Nigerian" className={inputBase} />
              </div>
              <div>
                <label className={label}>Marital status</label>
                <div className="relative">
                  <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select...</option>
                    <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>NIN <span className="text-red-400">*</span></label>
                <input type="text" inputMode="numeric" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))} placeholder="12345678901" maxLength={11} className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`} />
                <FieldError message={fieldErrors.nin} />
              </div>
              <div>
                <label className={label}>Residential address</label>
                <input type="text" value={residentialAddress} onChange={(e) => setResidentialAddress(e.target.value)} placeholder="123 Example Street, Lagos" className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Blood group</label>
                <div className="relative">
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select...</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>State of origin</label>
                <div className="relative">
                  <select value={selectedOriginState} onChange={(e) => { setSelectedOriginState(e.target.value); setSelectedOriginLga(""); }} className={`${inputBase} appearance-none pr-8`}>
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={label}>LGA of origin</label>
                <div className="relative">
                  <select value={selectedOriginLga} onChange={(e) => setSelectedOriginLga(e.target.value)} disabled={!selectedOriginState || originLgas.length === 0} className={`${inputBase} appearance-none pr-8 disabled:opacity-50`}>
                    <option value="">Select LGA</option>
                    {originLgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos, Kano, Abuja" className={inputBase} />
              </div>
              <div>
                <label className={label}>Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Nigeria" className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Mother's maiden name</label>
                <input type="text" value={mothersMaidenName} onChange={(e) => setMothersMaidenName(e.target.value)} placeholder="e.g. Adeyemi" className={`${inputBase} ${errInputClass(!!fieldErrors.mothersMaidenName)}`} />
                <FieldError message={fieldErrors.mothersMaidenName} />
              </div>
              <div>
                <label className={label}>Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 170" min={100} max={250} className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.heightCm)}`} />
                <FieldError message={fieldErrors.heightCm} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Physical Characteristics</p>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={hasFacialMark} onChange={(e) => { setHasFacialMark(e.target.checked); if (!e.target.checked) setFacialMarkDesc(""); }} className="h-4 w-4 rounded accent-[#28A745]" />
                <span className="text-[13.5px] font-medium text-slate-800">Has facial mark</span>
              </label>
              {hasFacialMark && (
                <div>
                  <input type="text" value={facialMarkDesc} onChange={(e) => setFacialMarkDesc(e.target.value)} placeholder="Brief description of facial mark(s)" className={`${inputBase} ${errInputClass(!!fieldErrors.facialMarkDesc)}`} />
                  <FieldError message={fieldErrors.facialMarkDesc} />
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={hasDisability} onChange={(e) => { setHasDisability(e.target.checked); if (!e.target.checked) setDisabilityDesc(""); }} className="h-4 w-4 rounded accent-[#28A745]" />
                <span className="text-[13.5px] font-medium text-slate-800">Has any disability</span>
              </label>
              {hasDisability && (
                <div>
                  <input type="text" value={disabilityDesc} onChange={(e) => setDisabilityDesc(e.target.value)} placeholder="Brief description of disability" className={`${inputBase} ${errInputClass(!!fieldErrors.disabilityDesc)}`} />
                  <FieldError message={fieldErrors.disabilityDesc} />
                </div>
              )}
            </div>
            </>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">Who should we contact in an emergency?</p>
            <div>
              <label className={label}>Full name <span className="text-red-400">*</span></label>
              <input type="text" value={nokName} onChange={(e) => setNokName(e.target.value)} placeholder="Emeka Obi" className={`${inputBase} ${errInputClass(!!fieldErrors.nokName)}`} />
              <FieldError message={fieldErrors.nokName} />
            </div>
            <div>
              <label className={label}>Relationship</label>
              <div className="relative">
                <select value={nokRelationship} onChange={(e) => setNokRelationship(e.target.value)} className={`${inputBase} appearance-none pr-8`}>
                  <option value="">Select relationship...</option>
                  {["Spouse","Parent","Sibling","Child","Grandparent","Grandchild","Aunt / Uncle","Niece / Nephew","Cousin","Friend","Guardian","Other"].map(r => <option key={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className={label}>Phone number <span className="text-red-400">*</span></label>
              <div className="flex rounded-xl border border-[#E5E5E5] bg-slate-50/60 overflow-hidden focus-within:border-[#28A745] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#28A745]/15">
                <span className="flex items-center pl-3.5 pr-3 text-[13.5px] font-semibold text-slate-500 select-none border-r border-[#E5E5E5] bg-slate-100/80">+234</span>
                <input type="tel" value={nokPhone.replace(/^\+?234/, "").replace(/^0/, "")} onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, ""); setNokPhone("+234" + raw); }} placeholder="8012345678" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13.5px] bg-transparent outline-none text-[#111111] font-mono" />
              </div>
              <FieldError message={fieldErrors.nokPhone} />
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && applicationType !== "fresh" && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">
              Your other details are carried over from your most recent application — we just need
              these things to process your {applicationType.replace("_", " ")}.
            </p>
            {applicationType === "international_permit" ? (
              <DocUploadSlot
                title="International Passport or Nigeria Driver's Licence"
                value={renewalDocs.id_document}
                onChange={(v) => setRenewalDocs((p) => ({ ...p, id_document: v }))}
              />
            ) : (
              <DocUploadSlot
                title="Front of your old licence"
                value={renewalDocs.old_driver_licence}
                onChange={(v) => setRenewalDocs((p) => ({ ...p, old_driver_licence: v }))}
              />
            )}
            <FieldError message={fieldErrors.documents} />
            {applicationType !== "international_permit" && (
              <div>
                <label className={label}>Old licence number <span className="text-red-400">*</span></label>
                <input type="text" value={oldLicenceNumber} onChange={(e) => setOldLicenceNumber(e.target.value)} placeholder="e.g. LAG-01-23456789" className={`${inputBase} ${errInputClass(!!fieldErrors.oldLicenceNumber)}`} />
                <FieldError message={fieldErrors.oldLicenceNumber} />
              </div>
            )}
            <div>
              <label className={label}>NIN <span className="text-red-400">*</span></label>
              <input type="text" inputMode="numeric" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))} placeholder="12345678901" maxLength={11} className={`${inputBase} font-mono ${errInputClass(!!fieldErrors.nin)}`} />
              <FieldError message={fieldErrors.nin} />
            </div>
            <DocUploadSlot
              title="Passport photo"
              value={passportPhoto ? { fileName: "Passport photo", url: passportPhoto } : null}
              onChange={(v) => setPassportPhoto(v?.url || "")}
            />
            <FieldError message={fieldErrors.passportPhoto} />
          </div>
        )}

        {step === 4 && applicationType === "fresh" && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">
              Upload a clear passport photograph — this is required to submit your application.
            </p>
            <DocUploadSlot
              title="Passport photo"
              value={passportPhoto ? { fileName: "Passport photo", url: passportPhoto } : null}
              onChange={(v) => setPassportPhoto(v?.url || "")}
            />
            <FieldError message={fieldErrors.passportPhoto} />
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-5 p-6">
            <p className="text-[13px] text-slate-500">Check everything below, then submit.</p>
            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[12.5px] font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{submitError}</span>
              </div>
            )}
            <div className="space-y-3">
              {(applicationType === "fresh"
                ? [
                    {
                      section: "Application",
                      rows: [
                        ["Type", APPLICATION_TYPES.find((t) => t.value === applicationType)?.label],
                        ["Licence class", LICENCE_CLASSES.find((c) => c.value === licenceClass)?.label || "—"],
                        ["Validity period", validityPeriod || "—"],
                      ],
                    },
                    {
                      section: "Personal details",
                      rows: [
                        ["Full name", [firstName, middleName, lastName].filter(Boolean).join(" ")],
                        ["Date of birth", dob],
                        ["Gender", gender || "—"],
                        ["NIN", nin || "—"],
                        ["Nationality", nationality || "—"],
                        ["Marital status", maritalStatus || "—"],
                        ["Blood group", bloodGroup || "—"],
                        ["Residential address", residentialAddress || "—"],
                        ["State / LGA", stateObj?.name && lgaObj?.name ? `${stateObj.name} / ${lgaObj.name}` : "—"],
                      ],
                    },
                    {
                      section: "Next of kin",
                      rows: [
                        ["Name", nokName || "—"],
                        ["Relationship", nokRelationship || "—"],
                        ["Phone", nokPhone || "—"],
                      ],
                    },
                    {
                      section: "Document",
                      rows: [
                        ["Passport photo", passportPhoto ? "Uploaded" : "Not provided"],
                      ],
                    },
                  ]
                : applicationType === "international_permit"
                  ? [
                      {
                        section: "Application",
                        rows: [
                          ["Type", APPLICATION_TYPES.find((t) => t.value === applicationType)?.label],
                          ["State / LGA", (selectedState && selectedLga) ? `${states.find(s => s.id === parseInt(selectedState, 10))?.name || ""} / ${lgas.find(l => l.id === parseInt(selectedLga, 10))?.name || ""}` : "—"],
                        ],
                      },
                      {
                        section: "Permit details",
                        rows: [
                          ["NIN", nin || "—"],
                          ["ID Document", renewalDocs.id_document?.fileName || "Not provided"],
                          ["Passport photo", passportPhoto ? "Uploaded" : "Not provided"],
                        ],
                      },
                    ]
                  : [
                      {
                        section: "Application",
                        rows: [
                          ["Type", APPLICATION_TYPES.find((t) => t.value === applicationType)?.label],
                          ["Validity period", validityPeriod || "—"],
                        ],
                      },
                      {
                        section: `${applicationType === "reissue" ? "Reissue" : "Renewal"} details`,
                        rows: [
                          ["Old licence number", oldLicenceNumber || "—"],
                          ["NIN", nin || "—"],
                          ["Old licence photo", renewalDocs.old_driver_licence?.fileName || "Not provided"],
                          ["Passport photo", passportPhoto ? "Uploaded" : "Not provided"],
                        ],
                      },
                    ]
              ).map(({ section, rows }) => (
                <div key={section} className="overflow-hidden rounded-xl border border-slate-100">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{section}</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {rows.map(([rowLabel, value]) => (
                      <div key={rowLabel} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[12px] text-slate-500">{rowLabel}</span>
                        <span className="max-w-[55%] truncate text-right text-[13px] font-semibold text-[#111111]">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="flex items-start gap-2.5 rounded-xl border p-3.5 text-[12.5px]"
              style={{ borderColor: "rgba(40, 167, 69,0.25)", background: BRAND_TINT, color: "#065f46" }}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND }} />
              <span>
                After you submit, a payment of <strong>{koboToNaira(estimateFeeKobo(applicationType, validityPeriod, liveFeeSchedule))}</strong> will
                be generated — pay by card, bank transfer, or straight from your Vehiculars wallet.
              </span>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          {activeSteps.indexOf(step) > 0 ? (
            <button
              type="button"
              onClick={() => setStep(activeSteps[activeSteps.indexOf(step) - 1])}
              className={btnSecondary}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {activeSteps.indexOf(step) < activeSteps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const errors = validateStep(step);
                if (Object.keys(errors).length > 0) {
                  setFieldErrors(errors);
                  return;
                }
                setFieldErrors({});
                setStep(activeSteps[activeSteps.indexOf(step) + 1]);
              }}
              className={btnPrimary}
              style={{ background: BRAND }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting} className={btnPrimary} style={{ background: BRAND }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          )}
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border transition-all max-w-sm ${
            toast.type === "error"
              ? "bg-white border-red-200 text-red-800"
              : "bg-white border-emerald-200 text-emerald-800"
          }`}
        >
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              toast.type === "error" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#111111]">{toast.type === "error" ? "Payment Failed" : "Success"}</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
