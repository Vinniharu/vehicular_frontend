"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import {
  getAdminPricing, updateAdminPricing,
  deleteDlFeeScheduleRow, deleteServicePriceRow, deleteParticularsItemPriceRow,
  getAdminVehicleCategoryPricing, updateAdminVehicleCategoryPricing, deleteAdminVehicleCategoryPriceRow,
} from "@/lib/api";
import { keyFor, cellKey, rowStateFromApiItem } from "../_lib/rowState";

const BRAND = "#28A745";

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };
  return [toast, show, () => setToast(null)];
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-5 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl text-[13px] font-medium border max-w-sm ${toast.type === "success" ? "bg-white border-emerald-200 text-emerald-800" : "bg-white border-red-200 text-red-700"}`}>
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
        {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#111111]">{toast.type === "success" ? "Saved" : "Error"}</p>
        <p className="mt-0.5 text-[12.5px] text-slate-500 leading-relaxed">{toast.msg}</p>
      </div>
      <button type="button" onClick={onClose} className="ml-1 shrink-0 text-slate-400 hover:text-slate-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const PricingDataCtx = createContext(null);

export function usePricingData() {
  const ctx = useContext(PricingDataCtx);
  if (!ctx) throw new Error("usePricingData must be used within a PricingDataProvider");
  return ctx;
}

function confirmDeleteMsg(isGeneral, label) {
  return isGeneral
    ? `Delete the general price for "${label}"? Every state without its own override will lose its fallback price.`
    : `Remove this state's override for "${label}"? It will revert to the general price.`;
}

// Unified data layer for the whole pricing page — one GET each against
// /admin/pricing and /admin/pricing/vehicle-categories, exposed as four
// shared row maps every ServicePricingCard reads from directly when it's
// not editing. Each card stages its OWN edits locally (see
// ServicePricingCard) rather than through this context, so this provider
// only ever mutates its maps in response to a successful Save or Delete —
// never mid-edit.
export function PricingDataProvider({ stateId, reloadKey, children }) {
  const [loading, setLoading] = useState(true);
  const [toast, showToast, closeToast] = useToast();

  const [dlRows, setDlRows] = useState({});
  const [particularsRows, setParticularsRows] = useState({});
  const [serviceRows, setServiceRows] = useState({});
  const [categoryRows, setCategoryRows] = useState({});

  const seedMain = (data) => {
    setDlRows(Object.fromEntries(
      (data.dl_fee_schedule || []).map((r) => [keyFor(r.application_type, r.validity_period), rowStateFromApiItem(r)])
    ));
    setParticularsRows(Object.fromEntries(
      (data.particulars_item_prices || []).map((r) => [r.document_type, rowStateFromApiItem(r)])
    ));
    setServiceRows(Object.fromEntries(
      (data.service_prices || []).map((r) => [r.slug, rowStateFromApiItem(r)])
    ));
  };

  const seedCategories = (prices) => {
    setCategoryRows(Object.fromEntries(
      prices.map((r) => [cellKey(r.service_key, r.vehicle_category), rowStateFromApiItem(r)])
    ));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getAdminPricing(stateId), getAdminVehicleCategoryPricing(stateId)]).then(([mainRes, catRes]) => {
      if (cancelled) return;
      if (mainRes.data) seedMain(mainRes.data);
      if (catRes.data) seedCategories(catRes.data.prices);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId, reloadKey]);

  // A row/cell left blank saves as unset (server defaults it to
  // DEFAULT_PRICE_KOBO, see app/core/price_resolution.py) rather than
  // blocking the whole save. An explicitly-entered non-positive number is
  // still rejected server-side. Only the mechanism keys actually passed are
  // sent — a card that only touches, say, dl_fee_schedule never sends the
  // other two.
  const patchMain = async (payload) => {
    const res = await updateAdminPricing({ ...payload, state_id: stateId });
    if (res.error) return { ok: false };
    if (res.data) seedMain(res.data);
    return { ok: true };
  };

  const patchCategories = async (prices) => {
    const res = await updateAdminVehicleCategoryPricing(prices, stateId);
    if (res.error) return { ok: false };
    if (res.data) seedCategories(res.data.prices);
    return { ok: true };
  };

  const deleteDl = async ({ application_type, validity_period, label }) => {
    if (!window.confirm(confirmDeleteMsg(stateId == null, label))) return false;
    const res = await deleteDlFeeScheduleRow({ application_type, validity_period, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return false;
    }
    seedMain(res.data);
    showToast("success", "Price deleted.");
    return true;
  };

  const deleteParticulars = async (documentType, label) => {
    if (!window.confirm(confirmDeleteMsg(stateId == null, label))) return false;
    const res = await deleteParticularsItemPriceRow({ document_type: documentType, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return false;
    }
    seedMain(res.data);
    showToast("success", "Price deleted.");
    return true;
  };

  const deleteService = async (slug, label) => {
    if (!window.confirm(confirmDeleteMsg(stateId == null, label))) return false;
    const res = await deleteServicePriceRow({ slug, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return false;
    }
    seedMain(res.data);
    showToast("success", "Price deleted.");
    return true;
  };

  const deleteCategoryCell = async (service_key, vehicle_category, label) => {
    if (!window.confirm(confirmDeleteMsg(stateId == null, label))) return false;
    const res = await deleteAdminVehicleCategoryPriceRow({ service_key, vehicle_category, state_id: stateId });
    if (res.error) {
      showToast("error", res.status === 404 ? "Already using the fallback price." : "Could not delete this price.");
      return false;
    }
    seedCategories(res.data.prices);
    showToast("success", "Price deleted.");
    return true;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] px-6 sm:px-8 py-10 flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: BRAND }} />
        <p className="text-sm text-slate-500">Loading pricing...</p>
      </div>
    );
  }

  return (
    <PricingDataCtx.Provider
      value={{
        stateId,
        isGeneralScope: stateId == null,
        dlRows, particularsRows, serviceRows, categoryRows,
        patchMain, patchCategories,
        deleteDl, deleteParticulars, deleteService, deleteCategoryCell,
        showToast,
      }}
    >
      <Toast toast={toast} onClose={closeToast} />
      {children}
    </PricingDataCtx.Provider>
  );
}
