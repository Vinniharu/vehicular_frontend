"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Package } from "lucide-react";
import { dealerGetMatchedRequest, dealerSubmitBid, dealerAmendBid, dealerShipOrder, koboToNaira } from "@/lib/api";

const BRAND = "#28A745";
const inputBase = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-[#111111] placeholder:text-slate-400 outline-none transition-all focus:border-[#28A745] focus:bg-white focus:ring-2 focus:ring-[#28A745]/15";
const fieldLabel = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60";

export default function DealerRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState(false);

  const [form, setForm] = useState({
    price_kobo: "", delivery_timeline_days: "", condition: "new", is_oem: true, warranty_note: "", notes: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await dealerGetMatchedRequest(requestId);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setRequest(res.data.request);
      setMyBid(res.data.my_bid);
      if (res.data.my_bid) {
        setForm({
          price_kobo: (res.data.my_bid.price_kobo / 100).toString(),
          delivery_timeline_days: res.data.my_bid.delivery_timeline_days.toString(),
          condition: res.data.my_bid.condition,
          is_oem: res.data.my_bid.is_oem,
          warranty_note: res.data.my_bid.warranty_note || "",
          notes: res.data.my_bid.notes || "",
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const price_kobo = Math.round(parseFloat(form.price_kobo) * 100);
    const delivery_timeline_days = parseInt(form.delivery_timeline_days, 10);
    if (!price_kobo || price_kobo <= 0 || !delivery_timeline_days || delivery_timeline_days <= 0) {
      setError("Enter a valid price and delivery timeline.");
      return;
    }

    setSaving(true);
    const payload = {
      price_kobo, delivery_timeline_days, condition: form.condition, is_oem: form.is_oem,
      warranty_note: form.warranty_note || null, notes: form.notes || null,
    };
    const res = myBid ? await dealerAmendBid(myBid.id, payload) : await dealerSubmitBid(requestId, payload);
    setSaving(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setMyBid(res.data);
    setNotice(myBid ? "Bid updated." : "Bid submitted.");
  };

  const handleShip = async () => {
    if (!window.confirm("Confirm you're marking this order as shipped?")) return;
    setShipping(true);
    const res = await dealerShipOrder(requestId);
    setShipping(false);
    if (res.error) {
      setError(res.error);
      return;
    }
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
        <Link href="/dealer" className="mt-4 inline-block text-[13px] font-semibold" style={{ color: BRAND }}>Back to matched requests</Link>
      </div>
    );
  }

  const canBid = request.status === "bidding_open" && (!myBid || myBid.status === "submitted");
  const canShip = request.status === "bid_selected" && myBid?.status === "selected";

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dealer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to matched requests
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-[19px] font-bold text-slate-900">{request.part_name}</h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{request.status}</span>
        </div>
        <p className="mt-1 text-[13.5px] text-slate-500">
          {request.vehicle_make} {request.vehicle_model} ({request.vehicle_year})
        </p>
        {request.description && <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed">{request.description}</p>}
        {request.photo_url && (
          <img src={request.photo_url} alt="Part reference" className="mt-4 max-h-64 rounded-xl border border-slate-100 object-cover" />
        )}
      </div>

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

      {canShip && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-[14px] font-bold text-slate-900">Your bid was selected — escrow is held.</p>
          <p className="mt-1 text-[13px] text-slate-600">Ship the part to the customer, then mark it shipped.</p>
          <button onClick={handleShip} disabled={shipping} className={`${btnPrimary} mt-4`} style={{ background: BRAND }}>
            {shipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            {shipping ? "Marking shipped…" : "Mark as shipped"}
          </button>
        </div>
      )}

      {myBid && !canBid && !canShip && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[13px] text-slate-500">Your bid status: <strong className="text-slate-800">{myBid.status}</strong></p>
        </div>
      )}

      {canBid && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[14px] font-bold text-slate-900">{myBid ? "Amend your bid" : "Submit a bid"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Price (₦)</label>
              <input type="number" min="1" className={inputBase} value={form.price_kobo} onChange={(e) => setForm({ ...form, price_kobo: e.target.value })} required />
            </div>
            <div>
              <label className={fieldLabel}>Delivery timeline (days)</label>
              <input type="number" min="1" className={inputBase} value={form.delivery_timeline_days} onChange={(e) => setForm({ ...form, delivery_timeline_days: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>Condition</label>
              <select className={inputBase} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Origin</label>
              <select className={inputBase} value={form.is_oem ? "oem" : "aftermarket"} onChange={(e) => setForm({ ...form, is_oem: e.target.value === "oem" })}>
                <option value="oem">OEM</option>
                <option value="aftermarket">Aftermarket</option>
              </select>
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Warranty (optional)</label>
            <input className={inputBase} value={form.warranty_note} onChange={(e) => setForm({ ...form, warranty_note: e.target.value })} placeholder="e.g. 30 days" />
          </div>
          <div>
            <label className={fieldLabel}>Notes (optional)</label>
            <textarea className={inputBase} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className={btnPrimary} style={{ background: BRAND }}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : myBid ? "Update bid" : "Submit bid"}
          </button>
        </form>
      )}
    </div>
  );
}
