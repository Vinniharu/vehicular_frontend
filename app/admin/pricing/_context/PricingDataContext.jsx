"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getAdminPricing, updateAdminPricing,
  deleteDlFeeScheduleRow, deleteServicePriceRow, deleteParticularsItemPriceRow,
  getAdminVehicleCategoryPricing, updateAdminVehicleCategoryPricing, deleteAdminVehicleCategoryPriceRow,
} from "@/lib/api";
import { SkeletonList } from "@/app/dashboard/_kit";
import { keyFor, cellKey, rowStateFromApiItem, financingPayload, amountKoboFromRow } from "../_lib/rowState";

const PricingDataCtx = createContext(null);

export function usePricingData() {
  const ctx = useContext(PricingDataCtx);
  if (!ctx) throw new Error("usePricingData must be used within a PricingDataProvider");
  return ctx;
}

// Data layer for the pricing page: one GET each against /admin/pricing and
// /admin/pricing/vehicle-categories, exposed as four row maps. Saves are one
// row (or one set of category cells) at a time — the backend upserts each
// item it's sent, so untouched rows are never rewritten, and editing in a
// state scope only creates an override for the row actually changed.
export function PricingDataProvider({ stateId, reloadKey, children }) {
  const [loading, setLoading] = useState(true);
  const [dlRows, setDlRows] = useState({});
  const [particularsRows, setParticularsRows] = useState({});
  const [serviceRows, setServiceRows] = useState({});
  const [categoryRows, setCategoryRows] = useState({});

  const seedMain = (data) => {
    setDlRows(Object.fromEntries((data.dl_fee_schedule || []).map((r) => [keyFor(r.application_type, r.validity_period), rowStateFromApiItem(r)])));
    setParticularsRows(Object.fromEntries((data.particulars_item_prices || []).map((r) => [r.document_type, rowStateFromApiItem(r)])));
    setServiceRows(Object.fromEntries((data.service_prices || []).map((r) => [r.slug, rowStateFromApiItem(r)])));
  };
  const seedCategories = (prices) => {
    setCategoryRows(Object.fromEntries((prices || []).map((r) => [cellKey(r.service_key, r.vehicle_category), rowStateFromApiItem(r)])));
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId, reloadKey]);

  const getRow = (spec) => {
    const src = spec.mechanism === "dl" ? dlRows : spec.mechanism === "particulars" ? particularsRows : serviceRows;
    return src[spec.key] || rowStateFromApiItem({});
  };
  const getCell = (serviceKey, vehicleCategory) => categoryRows[cellKey(serviceKey, vehicleCategory)] || rowStateFromApiItem({});

  /** Save one flat row. Returns { ok, error }. */
  const saveRow = async (spec, row) => {
    const item = { amount_kobo: amountKoboFromRow(row), ...financingPayload(row) };
    let payload;
    if (spec.mechanism === "dl") payload = { dl_fee_schedule: [{ application_type: spec.application_type, validity_period: spec.validity_period, ...item }] };
    else if (spec.mechanism === "particulars") payload = { particulars_item_prices: [{ document_type: spec.document_type, ...item }] };
    else payload = { service_prices: [{ slug: spec.slug, ...item }] };
    const res = await updateAdminPricing({ ...payload, state_id: stateId });
    if (res.error) return { ok: false, error: res.error };
    if (res.data) seedMain(res.data);
    return { ok: true };
  };

  /** Save one or more category cells of a service. cells: [{ vehicle_category, row }] */
  const saveCells = async (serviceKey, cells) => {
    const prices = cells.map(({ vehicle_category, row }) => ({
      service_key: serviceKey,
      vehicle_category,
      amount_kobo: amountKoboFromRow(row),
      ...financingPayload(row),
    }));
    const res = await updateAdminVehicleCategoryPricing(prices, stateId);
    if (res.error) return { ok: false, error: res.error };
    if (res.data) seedCategories(res.data.prices);
    return { ok: true };
  };

  const deleteResult = (res, seed) => {
    if (res.error) return { ok: false, error: res.status === 404 ? "This price is already using the fallback." : res.error };
    seed(res.data);
    return { ok: true };
  };

  /** Remove a flat row (general price, or this state's override). */
  const deleteRow = async (spec) => {
    let res;
    if (spec.mechanism === "dl") res = await deleteDlFeeScheduleRow({ application_type: spec.application_type, validity_period: spec.validity_period, state_id: stateId });
    else if (spec.mechanism === "particulars") res = await deleteParticularsItemPriceRow({ document_type: spec.document_type, state_id: stateId });
    else res = await deleteServicePriceRow({ slug: spec.slug, state_id: stateId });
    return deleteResult(res, seedMain);
  };

  const deleteCell = async (serviceKey, vehicleCategory) => {
    const res = await deleteAdminVehicleCategoryPriceRow({ service_key: serviceKey, vehicle_category: vehicleCategory, state_id: stateId });
    return deleteResult(res, (d) => seedCategories(d?.prices));
  };

  if (loading) return <SkeletonList rows={4} />;

  return (
    <PricingDataCtx.Provider
      value={{
        stateId,
        isGeneralScope: stateId == null,
        dlRows, particularsRows, serviceRows, categoryRows,
        getRow, getCell, saveRow, saveCells, deleteRow, deleteCell,
      }}
    >
      {children}
    </PricingDataCtx.Provider>
  );
}
