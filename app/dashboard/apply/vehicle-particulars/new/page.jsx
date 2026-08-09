"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  Plus,
  Car,
  FileCheck2,
} from "lucide-react";
import {
  getReferenceStates,
  listVehicles,
  createVehicle,
  submitVehicleParticularsApplication,
  uploadApplicationFile,
  payFromWalletEndpoint,
  getWallet,
  getParticularsItemPricing,
  getApplication,
  koboToNaira,
} from "@/lib/api";
import PartialPayControls from "@/app/components/dashboard/PartialPayControls";
import { btnPrimary, btnSecondary, inputBase, label } from "@/app/dashboard/_shared/ui";
import { StepProgress, FieldError, errInputClass } from "@/app/dashboard/_shared/apply-helpers";

const BRAND = "#28A745";
const BRAND_TINT = "rgba(40, 167, 69,0.08)";

// document_type -> display metadata + evidence slots. Evidence doc_type
// strings mirror the backend's REQUIRED_EVIDENCE_BY_DOCUMENT_TYPE exactly
// (app/modules/driver_licence/router.py) — some (owner_id_evidence) are
// shared across multiple document types on purpose, so uploading it once
// satisfies every selected item that needs it, not once per item.
const DOCUMENT_TYPES = [
  {
    document_type: "vehicle_licence",
    title: "Vehicle Licence",
    desc: "The core papers proving your vehicle is registered and road-legal.",
    commercialOnly: false,
    evidence: [
      { doc_type: "vehicle_licence_evidence", title: "Current Vehicle Licence", hint: "Photo of your existing or expiring vehicle licence", image: "/placeholder/vehicle.jpeg" },
    ],
  },
  {
    document_type: "road_worthiness",
    title: "Road Worthiness Certificate",
    desc: "Confirms your vehicle is mechanically fit.",
    commercialOnly: false,
    evidence: [
      { doc_type: "road_worthiness_evidence", title: "Expiring Road Worthiness Certificate", hint: "Photo of your current certificate", image: "/placeholder/vehicle.jpeg" },
    ],
  },
  {
    document_type: "proof_of_ownership",
    title: "Proof of Ownership",
    desc: "For a missing document or a change of ownership.",
    commercialOnly: false,
    evidence: [
      { doc_type: "proof_of_ownership_evidence", title: "Proof of Ownership", hint: "Purchase receipt or current ownership document", image: "/placeholder/proof.jpeg" },
      { doc_type: "owner_id_evidence", title: "Owner's ID", hint: "NIN slip, driver's licence, or international passport", image: "/placeholder/person.jpeg" },
    ],
  },
  {
    document_type: "insurance_third_party",
    title: "Third-Party Insurance",
    desc: "The minimum legal cover for every vehicle.",
    commercialOnly: false,
    evidence: [
      { doc_type: "owner_id_evidence", title: "Owner's ID", hint: "NIN slip, driver's licence, or international passport", image: "/placeholder/person.jpeg" },
    ],
  },
  {
    document_type: "hackney_permit",
    title: "Hackney Permit",
    desc: "The commercial-passenger permit — only for vehicles carrying passengers.",
    commercialOnly: true,
    evidence: [
      { doc_type: "commercial_registration_evidence", title: "Commercial Registration Evidence", hint: "Proof this vehicle is registered for commercial use", image: "/placeholder/vehicle.jpeg" },
    ],
  },
];

const DOC_TYPE_BY_KEY = Object.fromEntries(DOCUMENT_TYPES.map((d) => [d.document_type, d]));

function UploadSlot({ slot, value, onChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    const { data, error: uploadError } = await uploadApplicationFile(file);
    setUploading(false);
    if (uploadError || !data?.file_url) {
      setError(uploadError || "Upload failed. Please try again.");
      return;
    }
    onChange({ fileName: file.name, url: data.file_url });
  };

  const handleRemove = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onChange(null);
  };

  const bgStyle = (url) => ({
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: "#f8fafc",
  });

  if (!value?.url) {
    return (
      <label
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
        className="relative flex aspect-[4/3] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border-2 transition-all"
        style={{ borderColor: dragActive ? BRAND : "#E5E5E5", ...bgStyle(slot.image) }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/50" />
        <div className="relative z-[1] p-3.5">
          <p className="text-[13px] font-semibold text-white drop-shadow-sm">{slot.title}</p>
          {slot.hint && <p className="mt-0.5 text-[11px] text-white/80 drop-shadow-sm">{slot.hint}</p>}
        </div>
        <div className="relative z-[1] p-3.5">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2.5">
            <Upload className="h-4 w-4 shrink-0" style={{ color: BRAND }} />
            <span className="text-[12px] font-semibold text-slate-700">
              {uploading ? "Uploading…" : "Click or drop a file here"}
            </span>
          </div>
          {error && <p className="mt-1.5 rounded-md bg-red-600/90 px-2 py-1 text-[11px] font-medium text-white">{error}</p>}
          <p className="mt-1.5 text-[10.5px] text-white/70 drop-shadow-sm">JPG, PNG, WEBP, HEIC, or PDF · up to 10 MB</p>
        </div>
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </label>
    );
  }

  return (
    <div
      className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-2xl border-2"
      style={{ borderColor: BRAND, ...bgStyle(previewUrl) }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/40" />
      <div className="relative z-[1] p-3.5">
        <p className="text-[13px] font-semibold text-white drop-shadow-sm">{slot.title}</p>
      </div>
      <div className="relative z-[1] flex items-center justify-between gap-2 p-3.5">
        <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="truncate text-[12px] font-semibold text-[#111111]">{value.fileName}</p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="shrink-0 rounded-xl bg-white/95 px-3 py-2.5 text-[11px] font-semibold text-red-600 hover:bg-white"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function VehicleParticularsNewApplicationPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const STEP_LABELS = ["Vehicle", "Pick documents", "Documents", "Review & submit"];

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

  const [prices, setPrices] = useState(null); // { [document_type]: amount_kobo | null }
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isCommercialUse, setIsCommercialUse] = useState(false);
  const [evidenceByDocType, setEvidenceByDocType] = useState({}); // { [evidence_doc_type]: { fileName, url } }
  const [fieldErrors, setFieldErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successApp, setSuccessApp] = useState(null);
  const [payOpts, setPayOpts] = useState(null);
  const [payingFromWallet, setPayingFromWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    Promise.all([getReferenceStates(), listVehicles(), getWallet(), getParticularsItemPricing()]).then(
      ([statesRes, vehiclesRes, walletRes, pricesRes]) => {
        if (statesRes.data) setStates(statesRes.data);
        if (vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
          if (vehiclesRes.data.length > 0) setSelectedVehicleId(vehiclesRes.data[0].id);
          else setAddingVehicle(true);
        } else {
          setAddingVehicle(true);
        }
        if (walletRes.data) setWalletBalance(walletRes.data.balance_kobo || 0);
        if (pricesRes.data?.prices) {
          setPrices(Object.fromEntries(pricesRes.data.prices.map((p) => [p.document_type, p.amount_kobo])));
        }
        setLoadingVehicles(false);
      }
    );
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  // Only document types the customer can currently pick: priced, and not
  // hackney unless the commercial-use toggle is on.
  const availableDocTypes = DOCUMENT_TYPES.filter((d) => !d.commercialOnly || isCommercialUse);

  const totalKobo = useMemo(() => {
    if (!prices) return 0;
    return selectedTypes.reduce((sum, dt) => sum + (prices[dt] || 0), 0);
  }, [prices, selectedTypes]);

  // Union of evidence slots across every selected document type, deduped by
  // doc_type — a shared requirement (e.g. owner_id_evidence) shows once, not
  // once per document that needs it.
  const evidenceSlots = useMemo(() => {
    const slotsByDocType = new Map();
    for (const dt of selectedTypes) {
      const config = DOC_TYPE_BY_KEY[dt];
      if (!config) continue;
      for (const slot of config.evidence) {
        if (!slotsByDocType.has(slot.doc_type)) slotsByDocType.set(slot.doc_type, slot);
      }
    }
    return Array.from(slotsByDocType.values());
  }, [selectedTypes]);

  const toggleDocType = (dt) => {
    setSelectedTypes((prev) => (prev.includes(dt) ? prev.filter((t) => t !== dt) : [...prev, dt]));
  };

  const handleCreateVehicle = async () => {
    const errors = {};
    if (!vehicleForm.plate_number.trim()) errors.plate_number = "Plate number is required.";
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
    }
    if (n === 2) {
      if (selectedTypes.length === 0) errors.documents = "Pick at least one document to renew.";
      const unpriced = selectedTypes.filter((dt) => !prices?.[dt]);
      if (unpriced.length > 0) errors.documents = "One of your selected documents isn't available yet — remove it to continue.";
    }
    if (n === 3) {
      const allUploaded = evidenceSlots.every((slot) => evidenceByDocType[slot.doc_type]?.url);
      if (!allUploaded) errors.evidence = "Upload every required document to continue.";
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
    setStep((s) => Math.min(4, s + 1));
  };

  const canSubmit =
    selectedVehicleId &&
    selectedTypes.length > 0 &&
    selectedTypes.every((dt) => prices?.[dt]) &&
    evidenceSlots.every((slot) => evidenceByDocType[slot.doc_type]?.url);

  const handleSubmit = async () => {
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
    const items = selectedTypes.map((dt) => {
      const config = DOC_TYPE_BY_KEY[dt];
      const evidence_documents = config.evidence.map((slot) => ({
        doc_type: slot.doc_type,
        file_url: evidenceByDocType[slot.doc_type].url,
      }));
      return { document_type: dt, evidence_documents };
    });
    const res = await submitVehicleParticularsApplication({
      vehicle_id: selectedVehicleId,
      is_commercial_use: isCommercialUse,
      items,
    });
    setSubmitting(false);
    if (res.error) {
      setSubmitError(res.error);
      return;
    }
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
        router.push("/dashboard/apply/vehicle-particulars");
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
      const remaining = opts.remaining_kobo ?? opts.amount_kobo ?? 0;
      if (remaining <= 0) {
        router.push("/dashboard/apply/vehicle-particulars");
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
          <h2 className="text-[21px] font-bold tracking-tight text-[#111111]">Renewal request submitted</h2>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-slate-500">
            We'll review your submission, then get each document processed. Track progress from your dashboard.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Reference</span>
              <span className="font-mono font-semibold text-slate-800">#{successApp.id}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-500">Total</span>
              <span className="font-mono font-bold text-[#111111]">{koboToNaira(payOpts?.amount_kobo ?? totalKobo)}</span>
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
                  Pay by card instead
                </a>
              )}
            </div>
          )}

          <button type="button" onClick={() => router.push("/dashboard/apply/vehicle-particulars")} className={`${btnPrimary} mt-6 w-full`} style={{ background: BRAND }}>
            Back to renewal requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <button onClick={() => router.push("/dashboard/apply/vehicle-particulars")} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Renew vehicle particulars</h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Pick any combination of documents to renew — one payment, one request.
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
                      <p className="text-[13.5px] font-semibold text-[#111111]">{v.make} {v.model} — {v.plate_number || "no plate on file"}</p>
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

      {/* Step 2 — Pick documents */}
      {step === 2 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-[13.5px] font-bold text-[#111111]">
            <FileCheck2 className="h-4 w-4" style={{ color: BRAND }} /> Which documents need renewing?
          </h2>

          <label className="mb-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <input
              type="checkbox"
              checked={isCommercialUse}
              onChange={(e) => {
                setIsCommercialUse(e.target.checked);
                if (!e.target.checked) setSelectedTypes((prev) => prev.filter((t) => t !== "hackney_permit"));
              }}
              className="h-4 w-4"
              style={{ accentColor: BRAND }}
            />
            <span className="text-[12.5px] font-semibold text-slate-700">This vehicle is used commercially (carries passengers)</span>
          </label>

          <div className="space-y-2.5">
            {availableDocTypes.map((doc) => {
              const priceKobo = prices?.[doc.document_type];
              const isPriced = priceKobo != null;
              const isSelected = selectedTypes.includes(doc.document_type);
              return (
                <button
                  key={doc.document_type}
                  type="button"
                  disabled={!isPriced}
                  onClick={() => toggleDocType(doc.document_type)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ borderColor: isSelected ? BRAND : "#e2e8f0", background: isSelected ? BRAND_TINT : "#fff" }}
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#111111]">{doc.title}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{doc.desc}</p>
                    {!isPriced && <p className="mt-1 text-[11px] font-semibold text-amber-600">Not yet available for renewal</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isPriced && <span className="text-[13px] font-bold text-[#111111]">{koboToNaira(priceKobo)}</span>}
                    {isSelected && <CheckCircle2 className="h-4.5 w-4.5" style={{ color: BRAND }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTypes.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-[12.5px] font-semibold text-slate-600">Running total</span>
              <span className="text-[15px] font-bold text-[#111111]">{koboToNaira(totalKobo)}</span>
            </div>
          )}
          <FieldError message={fieldErrors.documents} />
        </section>
      )}

      {/* Step 3 — Evidence upload */}
      {step === 3 && (
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Documents</h2>
          <p className="mb-4 text-[12px] text-slate-500">Upload evidence for each document you're renewing.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {evidenceSlots.map((slot) => (
              <UploadSlot
                key={slot.doc_type}
                slot={slot}
                value={evidenceByDocType[slot.doc_type]}
                onChange={(v) => setEvidenceByDocType((prev) => ({ ...prev, [slot.doc_type]: v }))}
              />
            ))}
          </div>
          <FieldError message={fieldErrors.evidence} />
        </section>
      )}

      {/* Step 4 — Review & submit */}
      {step === 4 && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-[13.5px] font-bold text-[#111111]">Review your request</h2>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Vehicle</span>
                <span className="font-semibold text-[#111111]">
                  {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} — ${selectedVehicle.plate_number || "no plate on file"}` : "—"}
                </span>
              </div>
              {selectedTypes.map((dt) => (
                <div key={dt} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-slate-500">{DOC_TYPE_BY_KEY[dt]?.title}</span>
                  <span className="font-semibold text-[#111111]">{koboToNaira(prices?.[dt] || 0)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-slate-500">Evidence uploaded</span>
                <span className="font-semibold text-[#111111]">
                  {evidenceSlots.filter((s) => evidenceByDocType[s.doc_type]?.url).length} of {evidenceSlots.length}
                </span>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-[13.5px] font-bold text-[#111111]">Payment</h2>
            <p className="text-[20px] font-bold text-[#111111]">Total: {koboToNaira(totalKobo)}</p>
            <p className="mt-1 text-[12px] text-slate-500">Pay in full, or at least the ₦10,000 minimum to get started — the rest can follow.</p>
          </section>

          {submitError && <p className="text-[13px] font-medium text-red-600">{submitError}</p>}

          <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit} className={`${btnPrimary} w-full`} style={{ background: BRAND }}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </section>
      )}

      {/* Step navigation */}
      {step < 4 && (
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
      {step === 4 && (
        <button type="button" onClick={() => setStep(3)} className={btnSecondary}>
          Back
        </button>
      )}
    </div>
  );
}
