"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Star, RefreshCw } from "lucide-react";
import {
  sparePartsGetRequest,
  sparePartsListBids,
  sparePartsSelectBid,
  sparePartsVerifyEscrow,
  sparePartsConfirmDelivery,
  sparePartsDispute,
  sparePartsRematch,
  koboToNaira,
} from "@/lib/api";

const BRAND = "#28A745";
const inputBase = "w-full rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";

function SparePartRequestDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = params.id;
  const paymentComplete = searchParams?.get("payment") === "complete";

  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [rematching, setRematching] = useState(false);

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [confirmNote, setConfirmNote] = useState("");
  const [disputeReason, setDisputeReason] = useState("wrong_part");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [acting, setActing] = useState(false);

  const load = async () => {
    const [reqRes, bidsRes] = await Promise.all([
      sparePartsGetRequest(requestId),
      sparePartsListBids(requestId),
    ]);
    if (reqRes.error) setError(reqRes.error);
    else setRequest(reqRes.data);
    if (Array.isArray(bidsRes.data)) setBids(bidsRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [requestId]);

  // Returning from the Monnify checkout — confirm the escrow immediately
  // instead of leaving it 'pending' until the webhook fires.
  useEffect(() => {
    if (!paymentComplete) return;
    (async () => {
      setVerifying(true);
      await sparePartsVerifyEscrow(requestId);
      setVerifying(false);
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentComplete]);

  const handleSelectBid = async (bidId) => {
    if (!window.confirm("Select this bid? You'll be redirected to pay into escrow.")) return;
    setSelecting(bidId);
    setError(null);
    const res = await sparePartsSelectBid(requestId, bidId);
    setSelecting(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.authorization_url) {
      window.location.href = res.data.authorization_url;
    } else {
      load();
    }
  };

  const handleRematch = async () => {
    setRematching(true);
    const res = await sparePartsRematch(requestId);
    setRematching(false);
    if (res.error) setError(res.error);
    else load();
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    setActing(true);
    setError(null);
    const res = await sparePartsConfirmDelivery(requestId, { rating, note: confirmNote || null });
    setActing(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNotice("Delivery confirmed — payment released to the dealer.");
    load();
  };

  const handleDispute = async (e) => {
    e.preventDefault();
    setActing(true);
    setError(null);
    const res = await sparePartsDispute(requestId, { reason: disputeReason, description: disputeDescription || null });
    setActing(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNotice("Dispute raised — our staff will review it shortly.");
    setShowDisputeForm(false);
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-[14px] font-semibold text-red-700">{error || "Request not found."}</p>
        <Link href="/dashboard/spare-parts" className="mt-4 inline-block text-[13px] font-semibold" style={{ color: BRAND }}>Back to Spare Parts</Link>
      </div>
    );
  }

  const canSelectBid = request.status === "bidding_open" && bids.length > 0;
  const canRematch = request.status === "matched" || request.status === "bidding_closed_no_bids";
  const canConfirmOrDispute = request.status === "shipped" || request.status === "delivered";
  const canDisputeOnly = request.status === "bid_selected";

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/spare-parts" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Spare Parts
      </Link>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-bold text-slate-900">{request.part_name}</h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{request.status.replace(/_/g, " ")}</span>
        </div>
        <p className="mt-1 text-[13.5px] text-slate-500">{request.vehicle_make} {request.vehicle_model} ({request.vehicle_year})</p>
        {request.description && <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed">{request.description}</p>}
      </div>

      {verifying && (
        <div className="flex items-center gap-2.5 rounded-xl p-3.5 text-[13px] bg-slate-50 border border-slate-200 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
        </div>
      )}
      {notice && (
        <div className="rounded-xl p-3.5 flex items-center gap-2.5 text-[13px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl p-3.5 flex items-start gap-2.5 text-[12.5px] leading-relaxed bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {canRematch && (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-5 text-center">
          <p className="text-[13.5px] text-slate-600">
            {request.status === "matched" ? "No dealers matched this request yet." : "Bidding closed with no bids."}
          </p>
          <button onClick={handleRematch} disabled={rematching} className={`${btnPrimary} mt-4`} style={{ background: BRAND }}>
            {rematching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Try matching again
          </button>
        </div>
      )}

      {request.status === "bidding_open" && bids.length === 0 && (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-8 text-center">
          <p className="text-[13.5px] text-slate-500">Bidding is open — matched dealers haven't bid yet. Check back soon.</p>
        </div>
      )}

      {canSelectBid && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-bold text-slate-900">Bids ({bids.length})</h2>
          {bids.map((bid) => (
            <div key={bid.id} className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-bold text-slate-900">{koboToNaira(bid.price_kobo)}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{bid.dealer_business_name}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[12px] text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {bid.dealer_rating_avg.toFixed(1)} ({bid.dealer_rating_count}) · {bid.dealer_membership_tier} tier
                  </div>
                  <p className="mt-2 text-[12.5px] text-slate-600">
                    {bid.condition} · {bid.is_oem ? "OEM" : "Aftermarket"} · {bid.delivery_timeline_days} day delivery
                    {bid.warranty_note && ` · Warranty: ${bid.warranty_note}`}
                  </p>
                  {bid.notes && <p className="mt-1 text-[12px] text-slate-400">{bid.notes}</p>}
                </div>
                <button
                  onClick={() => handleSelectBid(bid.id)}
                  disabled={selecting === bid.id}
                  className={btnPrimary}
                  style={{ background: BRAND }}
                >
                  {selecting === bid.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Select & pay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(canConfirmOrDispute || canDisputeOnly) && !showDisputeForm && (
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
          {canConfirmOrDispute && (
            <>
              <h2 className="text-[14px] font-bold text-slate-900">Confirm delivery</h2>
              <form onSubmit={handleConfirmDelivery} className="space-y-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Rate this dealer</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setRating(n)} className="p-0.5">
                        <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-500 text-amber-500" : "text-slate-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea className={inputBase} rows={2} placeholder="Optional note" value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)} />
                <button type="submit" disabled={acting} className={btnPrimary} style={{ background: BRAND }}>
                  {acting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm delivery & release payment
                </button>
              </form>
              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowDisputeForm(true)} className="text-[13px] font-semibold text-red-600 hover:underline">
                  Something's wrong — raise a dispute instead
                </button>
              </div>
            </>
          )}
          {canDisputeOnly && (
            <button type="button" onClick={() => setShowDisputeForm(true)} className={btnPrimary} style={{ background: "#dc2626" }}>
              Raise a dispute
            </button>
          )}
        </div>
      )}

      {showDisputeForm && (
        <form onSubmit={handleDispute} className="space-y-4 rounded-2xl border border-red-200 bg-red-50/40 p-6">
          <h2 className="text-[14px] font-bold text-slate-900">Raise a dispute</h2>
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Reason</label>
            <select className={inputBase} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}>
              <option value="wrong_part">Wrong part sent</option>
              <option value="damaged_in_transit">Damaged in transit</option>
              <option value="never_shipped">Never shipped</option>
              <option value="item_not_as_described">Not as described</option>
              <option value="other">Other</option>
            </select>
          </div>
          <textarea className={inputBase} rows={3} placeholder="Describe what happened" value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)} />
          <div className="flex gap-3">
            <button type="submit" disabled={acting} className={btnPrimary} style={{ background: "#dc2626" }}>
              {acting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit dispute
            </button>
            <button type="button" onClick={() => setShowDisputeForm(false)} className="text-[13px] font-semibold text-slate-500">Cancel</button>
          </div>
        </form>
      )}

      {(request.status === "disputed" || request.status === "under_staff_review") && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[13.5px] text-amber-800">
          Your dispute is under staff review. We'll update you once it's resolved.
        </div>
      )}
    </div>
  );
}

export default function SparePartRequestDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND }} /></div>}>
      <SparePartRequestDetailContent />
    </Suspense>
  );
}
