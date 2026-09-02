"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Plus,
  Car,
  MapPin,
  Clock,
  Upload,
} from "lucide-react";
import {
  getCachedUser,
  getReferenceStates,
  getRwxBaysByState,
  getRwxBayAvailability,
  listVehicles,
  createVehicle,
  submitRoadworthinessApplication,
  uploadApplicationFile,
  payFromWalletEndpoint,
  getWallet,
  getServicePricing,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import { VEHICLE_CATEGORY_OPTIONS, isCommercialCategory } from "@/lib/constants/vehicleCategories";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";
import { useApplicationDraft } from "@/lib/hooks/useApplicationDraft";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";
const PLATE_RE = /^[A-Za-z0-9-]{4,15}$/;
const STEP_LABELS = ["Vehicle", "Bay & slot", "Review & pay"];

// jeep_suv and truck have no private/commercial split — 10 of the 12
// categories are split pairs, these two are single entries. Grouping here
// so the form can offer a use toggle only where it's a real choice.
const BODY_TYPES = [
  { key: "saloon", label: "Saloon/Car", private: "saloon_private", commercial: "saloon_commercial" },
  { key: "jeep_suv", label: "Jeep/SUV", single: "jeep_suv" },
  { key: "space_bus", label: "Space bus/Sienna", private: "space_bus_private", commercial: "space_bus_commercial" },
  { key: "pickup", label: "Pick-Up/Hilux", private: "pickup_private", commercial: "pickup_commercial" },
  { key: "bus_18_seater", label: "18 passenger/Bus", private: "bus_18_seater_private", commercial: "bus_18_seater_commercial" },
  { key: "coaster_bus", label: "Coaster Bus", private: "coaster_bus_private", commercial: "coaster_bus_commercial" },
  { key: "truck", label: "Truck", single: "truck" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function RoadworthinessExpressNewApplicationPage() {
  const router = useRouter();
  const user = getCachedUser();

  // A distinct, EARLIER-stage concept from RWX's own existing pre-payment
  // DLApplication.status == "draft" booking (created server-side once this
  // form IS submitted, see status_machine.py's RWX_TRANSITIONS) — this
  // hook only ever touches frontend form state before that submit call
  // fires, and clearDraft() below is never allowed to affect that separate
  // status once a booking exists.
  const { draftFormData, hydrated: draftHydrated, save: saveDraft, clearDraft, markSubmitting } = useApplicationDraft("roadworthiness_express");
  const [draftRestored, setDraftRestored] = useState(false);
  const pendingBayRestoreRef = useRef(null);
  const pendingSlotRestoreRef = useRef(null);

  const [step, setStep] = useState(1);

  const [states, setStates] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [addingVehicle, setAddingVehicle] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    plate_number: "", make: "", model: "", year: "", colour: "",
    chassis_number: "", engine_number: "", state_id: "",
  });
  const [bodyType, setBodyType] = useState("");
  const [useType, setUseType] = useState(""); // "private" | "commercial", ignored for single-entry body types
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [vehicleFieldErrors, setVehicleFieldErrors] = useState({});

  const [servicePrices, setServicePrices] = useState(null);

  const [bayStateId, setBayStateId] = useState("");
  const [bays, setBays] = useState([]);
  const [loadingBays, setLoadingBays] = useState(false);
  const [selectedBayId, setSelectedBayId] = useState(null);
  const [bookingDate, setBookingDate] = useState(todayIso());
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const [papers, setPapers] = useState(null);
  const [uploadingPapers, setUploadingPapers] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
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
  }, []);

  // Restore an in-progress draft once. selectedBayId/selectedSlotId can't
  // be applied directly here — the existing bay/availability-fetch effects
  // below reset them to null whenever bayStateId/selectedBayId changes, so
  // they're staged in refs and re-applied once their matching options have
  // actually loaded.
  useEffect(() => {
    if (!draftHydrated || draftRestored) return;
    if (draftFormData) {
      if (draftFormData.selectedVehicleId != null) setSelectedVehicleId(draftFormData.selectedVehicleId);
      if (draftFormData.bayStateId) setBayStateId(draftFormData.bayStateId);
      if (draftFormData.bookingDate) setBookingDate(draftFormData.bookingDate);
      if (draftFormData.papers) setPapers(draftFormData.papers);
      if (draftFormData.step) setStep(draftFormData.step);
      pendingBayRestoreRef.current = draftFormData.selectedBayId ?? null;
      pendingSlotRestoreRef.current = draftFormData.selectedSlotId ?? null;
    }
    setDraftRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftHydrated, draftFormData]);

  const buildDraftSnapshot = (targetStep) => ({
    selectedVehicleId, bayStateId, selectedBayId, bookingDate, selectedSlotId, papers, step: targetStep,
  });

  // RWX is a flat fee (ServicePrice, not vehicle-category-based) priced per
  // the BAY's state, not the vehicle's (the backend resolves the charge off
  // bay.state_id at booking time) -- so the price shown here has to be
  // re-fetched whenever the bay state changes, or it'll silently keep
  // showing the general-tier price even after a state-specific override
  // exists. Falls back to the general tier before a state is picked.
  useEffect(() => {
    getServicePricing(bayStateId || undefined).then((res) => {
      if (res.data?.prices) setServicePrices(res.data.prices);
    });
  }, [bayStateId]);

  useEffect(() => {
    if (!bayStateId) {
      setBays([]);
      setSelectedBayId(null);
      return;
    }
    setLoadingBays(true);
    getRwxBaysByState(bayStateId).then((res) => {
      const items = res.data?.items || [];
      setBays(items);
      const pendingBayId = pendingBayRestoreRef.current;
      if (pendingBayId != null && items.some((b) => b.id === pendingBayId)) {
        setSelectedBayId(pendingBayId);
      } else {
        setSelectedBayId(null);
      }
      pendingBayRestoreRef.current = null;
      setLoadingBays(false);
    });
  }, [bayStateId]);

  useEffect(() => {
    if (!selectedBayId || !bookingDate) {
      setAvailability(null);
      return;
    }
    setLoadingAvailability(true);
    const pendingSlotId = pendingSlotRestoreRef.current;
    if (!pendingSlotId) setSelectedSlotId(null);
    getRwxBayAvailability(selectedBayId, bookingDate).then((res) => {
      const slots = res.data?.slots || [];
      setAvailability(slots);
      if (pendingSlotId != null && slots.some((s) => s.slot_template_id === pendingSlotId)) {
        setSelectedSlotId(pendingSlotId);
      }
      pendingSlotRestoreRef.current = null;
      setLoadingAvailability(false);
    });
  }, [selectedBayId, bookingDate]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const selectedBay = bays.find((b) => b.id === selectedBayId) || null;

  const rwxFeeKobo = useMemo(() => {
    if (!servicePrices) return null;
    return servicePrices.find((p) => p.slug === "roadworthiness-express")?.amount_kobo ?? null;
  }, [servicePrices]);

  const handleBodyTypeChange = (key) => {
    setBodyType(key);
    const bt = BODY_TYPES.find((b) => b.key === key);
    if (bt?.single) {
      setUseType("");
      setVehicleForm((f) => ({ ...f, vehicle_category: bt.single }));
    } else {
      setUseType("");
      setVehicleForm((f) => ({ ...f, vehicle_category: "" }));
    }
  };

  const resolvedCategory = useMemo(() => {
    const bt = BODY_TYPES.find((b) => b.key === bodyType);
    if (!bt) return "";
    if (bt.single) return bt.single;
    if (useType === "private") return bt.private;
    if (useType === "commercial") return bt.commercial;
    return "";
  }, [bodyType, useType]);

  const handleCreateVehicle = async () => {
    const errors = {};
    if (!vehicleForm.plate_number.trim()) errors.plate_number = "Plate number is required.";
    else if (!PLATE_RE.test(vehicleForm.plate_number.trim())) errors.plate_number = "Use 4-15 letters, digits, or hyphens.";
    if (!vehicleForm.make.trim()) errors.make = "Make is required.";
    if (!vehicleForm.model.trim()) errors.model = "Model is required.";
    if (!vehicleForm.year.trim()) errors.year = "Year is required.";
    if (!vehicleForm.colour.trim()) errors.colour = "Colour is required.";
    if (!vehicleForm.chassis_number.trim()) errors.chassis_number = "Chassis/VIN number is required.";
    if (!vehicleForm.engine_number.trim()) errors.engine_number = "Engine number is required.";
    if (!vehicleForm.state_id) errors.state_id = "Select a state.";
    if (Object.keys(errors).length > 0) {
      setVehicleFieldErrors(errors);
      return;
    }
    setVehicleFieldErrors({});
    setCreatingVehicle(true);
    const res = await createVehicle({
      plate_number: vehicleForm.plate_number,
      make: vehicleForm.make,
      model: vehicleForm.model,
      year: vehicleForm.year,
      colour: vehicleForm.colour,
      chassis_number: vehicleForm.chassis_number,
      engine_number: vehicleForm.engine_number,
      state_id: Number(vehicleForm.state_id),
      vehicle_category: resolvedCategory || undefined,
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
      if (!selectedBayId) errors.bay = "Pick a bay to continue.";
      if (!bookingDate) errors.date = "Pick a date.";
      if (!selectedSlotId) errors.slot = "Pick a time slot.";
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
    const nextStep = Math.min(3, step + 1);
    setStep(nextStep);
    saveDraft(buildDraftSnapshot(nextStep), STEP_LABELS[nextStep - 1]);
  };

  const handlePapersUpload = async (file) => {
    if (!file) return;
    setUploadingPapers(true);
    const { data, error } = await uploadApplicationFile(file);
    setUploadingPapers(false);
    if (!error && data?.file_url) {
      setPapers({ fileName: file.name, url: data.file_url });
    }
  };

  const canSubmit = selectedVehicleId && selectedBayId && bookingDate && selectedSlotId;

  const handleSubmit = async () => {
    const allErrors = { ...validateStep(1), ...validateStep(2) };
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      const firstBadStep = [1, 2].find((s) => Object.keys(validateStep(s)).length > 0);
      if (firstBadStep) setStep(firstBadStep);
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    markSubmitting();
    const res = await submitRoadworthinessApplication({
      vehicle_id: selectedVehicleId,
      bay_id: selectedBayId,
      slot_template_id: selectedSlotId,
      booking_date: bookingDate,
      papers: papers ? { doc_type: "vehicle_papers", file_url: papers.url } : undefined,
    });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
    setSuccessApp(res.data);
    setPayOpts(res.data.payment_options || null);
    clearDraft();
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

  // "Pay by card" opens Monnify in a new tab, same pattern as every other
  // pay-by-card link in the app — this tab notices completion itself once
  // the customer switches back.
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
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Booking created</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            Complete payment to reserve your bay slot — an unpaid booking doesn't hold your seat.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Total</span>
              <span className="font-mono font-bold text-[#111111]">{koboToNaira(payOpts?.amount_kobo ?? rwxFeeKobo ?? 0)}</span>
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
        <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Book Roadworthiness Express</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Same-day inspection at a Vehiculars bay — bring the vehicle at your booked slot and leave with your certificate.
        </p>
      </div>

      <StepProgress steps={STEP_LABELS} current={step} />

      {/* Step 1 — Vehicle */}
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
                      <p className="text-[13.5px] font-semibold text-[#111111]">{v.make} {v.model} — {v.plate_number}</p>
                      <p className="text-[12px] text-slate-500">
                        {v.colour} · {v.state}
                        {v.vehicle_category ? ` · ${VEHICLE_CATEGORY_OPTIONS.find((c) => c.value === v.vehicle_category)?.label || v.vehicle_category}` : " · no category set"}
                      </p>
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
                  <label className={label}>Plate number</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.plate_number)}`} value={vehicleForm.plate_number} onChange={(e) => setVehicleForm((f) => ({ ...f, plate_number: e.target.value }))} />
                  <FieldError message={vehicleFieldErrors.plate_number} />
                </div>
                <div>
                  <label className={label}>Make</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.make)}`} value={vehicleForm.make} onChange={(e) => setVehicleForm((f) => ({ ...f, make: e.target.value }))} placeholder="e.g. Toyota" />
                  <FieldError message={vehicleFieldErrors.make} />
                </div>
                <div>
                  <label className={label}>Model</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.model)}`} value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} placeholder="e.g. Camry" />
                  <FieldError message={vehicleFieldErrors.model} />
                </div>
                <div>
                  <label className={label}>Year</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.year)}`} value={vehicleForm.year} onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="e.g. 2018" inputMode="numeric" />
                  <FieldError message={vehicleFieldErrors.year} />
                </div>
                <div>
                  <label className={label}>Colour</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.colour)}`} value={vehicleForm.colour} onChange={(e) => setVehicleForm((f) => ({ ...f, colour: e.target.value }))} />
                  <FieldError message={vehicleFieldErrors.colour} />
                </div>
                <div>
                  <label className={label}>State</label>
                  <select className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.state_id)}`} value={vehicleForm.state_id} onChange={(e) => setVehicleForm((f) => ({ ...f, state_id: e.target.value }))}>
                    <option value="">Select state</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <FieldError message={vehicleFieldErrors.state_id} />
                </div>
                <div>
                  <label className={label}>Chassis / VIN number</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.chassis_number)}`} value={vehicleForm.chassis_number} onChange={(e) => setVehicleForm((f) => ({ ...f, chassis_number: e.target.value }))} />
                  <FieldError message={vehicleFieldErrors.chassis_number} />
                </div>
                <div>
                  <label className={label}>Engine number</label>
                  <input className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.engine_number)}`} value={vehicleForm.engine_number} onChange={(e) => setVehicleForm((f) => ({ ...f, engine_number: e.target.value }))} />
                  <FieldError message={vehicleFieldErrors.engine_number} />
                </div>
              </div>

              <div>
                <label className={label}>Vehicle type <span className="font-normal text-slate-400">(optional)</span></label>
                <select className={`${inputBase} ${errInputClass(!!vehicleFieldErrors.vehicle_category)}`} value={bodyType} onChange={(e) => handleBodyTypeChange(e.target.value)}>
                  <option value="">Select vehicle type</option>
                  {BODY_TYPES.map((bt) => <option key={bt.key} value={bt.key}>{bt.label}</option>)}
                </select>
                {bodyType && !BODY_TYPES.find((b) => b.key === bodyType)?.single && (
                  <div className="mt-2 flex gap-2">
                    {["private", "commercial"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUseType(u)}
                        className="flex-1 rounded-xl border-2 px-3 py-2 text-[12.5px] font-semibold capitalize transition-all"
                        style={{ borderColor: useType === u ? BRAND : "#e2e8f0", background: useType === u ? BRAND_TINT : "#fff", color: useType === u ? BRAND : "#475569" }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
                <FieldError message={vehicleFieldErrors.vehicle_category} />
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

      {/* Step 2 — Bay & slot */}
      {step === 2 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
            <MapPin className="h-4 w-4" style={{ color: BRAND }} /> Bay &amp; time slot
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>State</label>
              <select className={inputBase} value={bayStateId} onChange={(e) => setBayStateId(e.target.value)}>
                <option value="">Select state</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Date</label>
              <input type="date" min={todayIso()} className={inputBase} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
              <FieldError message={fieldErrors.date} />
            </div>
          </div>

          {bayStateId && (
            <div className="mt-4">
              <label className={label}>Bay</label>
              {loadingBays ? (
                <div className="flex items-center gap-2 py-3 text-[12.5px] text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading bays…</div>
              ) : bays.length === 0 ? (
                <p className="py-2 text-[12.5px] text-slate-400">No bays in this state yet.</p>
              ) : (
                <div className="space-y-2">
                  {bays.map((bay) => {
                    const active = selectedBayId === bay.id;
                    return (
                      <button
                        key={bay.id}
                        type="button"
                        onClick={() => setSelectedBayId(bay.id)}
                        className="flex w-full items-center justify-between rounded-xl border-2 p-3.5 text-left transition-all"
                        style={{ borderColor: active ? BRAND : "#e2e8f0", background: active ? BRAND_TINT : "#fff" }}
                      >
                        <div>
                          <p className="text-[13.5px] font-semibold text-[#111111]">{bay.name}</p>
                          <p className="text-[12px] text-slate-500">{bay.address}</p>
                        </div>
                        {active && <CheckCircle2 className="h-4.5 w-4.5" style={{ color: BRAND }} />}
                      </button>
                    );
                  })}
                </div>
              )}
              <FieldError message={fieldErrors.bay} />
            </div>
          )}

          {selectedBayId && (
            <div className="mt-4">
              <label className={label}>Time slot</label>
              {loadingAvailability ? (
                <div className="flex items-center gap-2 py-3 text-[12.5px] text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…</div>
              ) : !availability || availability.length === 0 ? (
                <p className="py-2 text-[12.5px] text-slate-400">No slots configured for this bay.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {availability.map((slot) => {
                    const active = selectedSlotId === slot.slot_template_id;
                    const full = slot.remaining <= 0;
                    return (
                      <button
                        key={slot.slot_template_id}
                        type="button"
                        disabled={full}
                        onClick={() => setSelectedSlotId(slot.slot_template_id)}
                        className="rounded-xl border-2 p-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ borderColor: active ? BRAND : "#e2e8f0", background: active ? BRAND_TINT : "#fff" }}
                      >
                        <p className="flex items-center justify-center gap-1 text-[12.5px] font-semibold text-[#111111]"><Clock className="h-3 w-3" /> {slot.label}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{full ? "Fully booked" : `${slot.remaining} of ${slot.capacity} left`}</p>
                      </button>
                    );
                  })}
                </div>
              )}
              <FieldError message={fieldErrors.slot} />
            </div>
          )}
        </section>
      )}

      {/* Step 3 — Review & pay */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Review your booking</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-[#111111]">{selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} — ${selectedVehicle.plate_number}` : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Bay</span>
                <span className="font-semibold text-[#111111]">{selectedBay?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Date &amp; slot</span>
                <span className="font-semibold text-[#111111]">
                  {bookingDate} · {availability?.find((s) => s.slot_template_id === selectedSlotId)?.label || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Vehicle papers <span className="font-normal text-slate-400">(optional)</span></h2>
            {papers?.url ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="truncate text-[12.5px] font-semibold text-slate-700">{papers.fileName}</p>
                <button type="button" onClick={() => setPapers(null)} className="shrink-0 text-[11.5px] font-semibold text-red-600">Remove</button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-[12.5px] font-semibold text-slate-600 hover:border-slate-400">
                {uploadingPapers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingPapers ? "Uploading…" : "Upload if you have them to hand"}
                <input type="file" accept="image/*,application/pdf" disabled={uploadingPapers} onChange={(e) => handlePapersUpload(e.target.files?.[0])} className="hidden" />
              </label>
            )}
          </div>

          <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-[13.5px] font-bold text-[#111111]">Payment</h2>
            {rwxFeeKobo != null ? (
              <p className="text-[20px] font-bold text-[#111111]">Total: {koboToNaira(rwxFeeKobo)}</p>
            ) : (
              <p className="text-[13px] font-semibold text-amber-700">Not yet priced — contact support.</p>
            )}
            <p className="mt-1 text-[12px] text-slate-500">Full payment reserves your slot — an unpaid booking doesn't hold your seat.</p>
          </section>

          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}

          <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit || rwxFeeKobo == null} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Booking…" : "Book & continue to payment"}
          </button>
        </section>
      )}

      {/* Step navigation */}
      {step < 3 && (
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
          <button type="button" onClick={goNext} className={btnPrimary} style={{ background: BRAND }}>Continue</button>
        </div>
      )}
      {step === 3 && (
        <button
          type="button"
          onClick={() => {
            setStep(2);
            saveDraft(buildDraftSnapshot(2), STEP_LABELS[1]);
          }}
          className={btnSecondary}
        >
          Back
        </button>
      )}
    </div>
  );
}
