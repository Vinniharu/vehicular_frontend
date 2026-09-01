"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Save, Loader2, AlertCircle } from "lucide-react";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import PriceRowCard from "./PriceRowCard";
import CategoryGrid from "./CategoryGrid";
import { usePricingData } from "../_context/PricingDataContext";
import { cellKey, rowStateFromApiItem, financingPayload } from "../_lib/rowState";

function flattenRows(section, mechanism) {
  const out = [];
  if (section.rows) out.push(...section.rows.filter((r) => r.mechanism === mechanism));
  if (section.subServices) {
    for (const sub of section.subServices) {
      if (sub.rows) out.push(...sub.rows.filter((r) => r.mechanism === mechanism));
    }
  }
  return out;
}

function categoryServiceKeys(section) {
  const keys = [];
  if (section.categoryGrid) keys.push(section.categoryGrid.service_key);
  if (section.subServices) {
    for (const sub of section.subServices) {
      if (sub.categoryGrid) keys.push(sub.categoryGrid.service_key);
    }
  }
  return keys;
}

// A row's own label is short ("3 years", "Amount", "Fallback price...") —
// its sub-panel header already carries the descriptive name, so the delete
// confirmation needs both combined.
function rowFullLabel(groupLabel, row) {
  return row.label && row.label !== "Amount" ? `${groupLabel} — ${row.label}` : groupLabel;
}

const emptyDeletedKeys = () => ({ dl: new Set(), particulars: new Set(), service: new Set(), category: new Set() });

// The one generic top-level pricing card, driven entirely by a
// SERVICE_SECTIONS config entry (see ../_data/serviceSections.js). Renders
// either a flat list of sub-service panels (Driver's Licence, Number
// Plate, Vehicle Particulars, Vehicle Verification) or bare rows/a category
// grid directly (Physical Condition Inspection, ECMR, RWX, Tinted Permit).
// One Edit/Save/Cancel per card — clicking Edit puts every
// sub-panel into edit mode at once (panel expand/collapse stays a pure
// viewing convenience), and Save stages all of this card's own rows across
// however many backend mechanisms it touches, firing each PATCH exactly
// once via Promise.allSettled so a failure on one mechanism never discards
// a successful edit on the other.
export default function ServicePricingCard({ section }) {
  const {
    isGeneralScope, dlRows, particularsRows, serviceRows, categoryRows,
    patchMain, patchCategories, deleteDl, deleteParticulars, deleteService, deleteCategoryCell,
    showToast,
  } = usePricingData();

  const dlSpecs = useMemo(() => flattenRows(section, "dl"), [section]);
  const particularsSpecs = useMemo(() => flattenRows(section, "particulars"), [section]);
  const serviceSpecs = useMemo(() => flattenRows(section, "service"), [section]);
  const categoryKeys = useMemo(() => categoryServiceKeys(section), [section]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openSub, setOpenSub] = useState(null);
  const [staged, setStaged] = useState(null);
  const [deletedKeys, setDeletedKeys] = useState(emptyDeletedKeys);

  const hasOverride = !isGeneralScope && [
    ...dlSpecs.map((r) => dlRows[r.key]),
    ...particularsSpecs.map((r) => particularsRows[r.key]),
    ...serviceSpecs.map((r) => serviceRows[r.key]),
    ...categoryKeys.flatMap((sk) => VEHICLE_CATEGORY_OPTIONS.map((c) => categoryRows[cellKey(sk, c.value)])),
  ].some((row) => row?.is_override);

  const startEdit = () => {
    setStaged({
      dl: Object.fromEntries(dlSpecs.map((r) => [r.key, dlRows[r.key] || rowStateFromApiItem({})])),
      particulars: Object.fromEntries(particularsSpecs.map((r) => [r.key, particularsRows[r.key] || rowStateFromApiItem({})])),
      service: Object.fromEntries(serviceSpecs.map((r) => [r.key, serviceRows[r.key] || rowStateFromApiItem({})])),
      category: Object.fromEntries(
        categoryKeys.flatMap((sk) => VEHICLE_CATEGORY_OPTIONS.map((c) => {
          const key = cellKey(sk, c.value);
          return [key, categoryRows[key] || rowStateFromApiItem({})];
        }))
      ),
    });
    setDeletedKeys(emptyDeletedKeys());
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setStaged(null);
    setError(null);
    setEditing(false);
  };

  const getRow = (mechanism, key) => {
    if (editing && staged) return staged[mechanism][key] || rowStateFromApiItem({});
    const src = mechanism === "dl" ? dlRows : mechanism === "particulars" ? particularsRows : serviceRows;
    return src[key] || rowStateFromApiItem({});
  };

  const setStagedRow = (mechanism, key, next) => {
    setStaged((prev) => ({ ...prev, [mechanism]: { ...prev[mechanism], [key]: next } }));
  };
  const setStagedCategoryRow = (key, next) => {
    setStaged((prev) => ({ ...prev, category: { ...prev.category, [key]: next } }));
  };

  const handleDeleteRow = async (mechanism, row, fullLabel) => {
    let ok = false;
    if (mechanism === "dl") ok = await deleteDl({ application_type: row.application_type, validity_period: row.validity_period, label: fullLabel });
    else if (mechanism === "particulars") ok = await deleteParticulars(row.document_type, fullLabel);
    else if (mechanism === "service") ok = await deleteService(row.slug, fullLabel);
    if (ok) setDeletedKeys((prev) => ({ ...prev, [mechanism]: new Set(prev[mechanism]).add(row.key) }));
  };

  const handleDeleteCategoryCell = async (service_key, vehicle_category, label) => {
    const ok = await deleteCategoryCell(service_key, vehicle_category, label);
    if (ok) {
      const key = cellKey(service_key, vehicle_category);
      setDeletedKeys((prev) => ({ ...prev, category: new Set(prev.category).add(key) }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const mainPayload = {};
    if (dlSpecs.length) {
      mainPayload.dl_fee_schedule = dlSpecs.filter((r) => !deletedKeys.dl.has(r.key)).map((r) => {
        const row = staged.dl[r.key] || {};
        return { application_type: r.application_type, validity_period: r.validity_period, amount_kobo: row.amount ? Math.round(parseFloat(row.amount) * 100) : null, ...financingPayload(row) };
      });
    }
    if (particularsSpecs.length) {
      mainPayload.particulars_item_prices = particularsSpecs.filter((r) => !deletedKeys.particulars.has(r.key)).map((r) => {
        const row = staged.particulars[r.key] || {};
        return { document_type: r.document_type, amount_kobo: row.amount ? Math.round(parseFloat(row.amount) * 100) : null, ...financingPayload(row) };
      });
    }
    if (serviceSpecs.length) {
      mainPayload.service_prices = serviceSpecs.filter((r) => !deletedKeys.service.has(r.key)).map((r) => {
        const row = staged.service[r.key] || {};
        return { slug: r.slug, amount_kobo: row.amount ? Math.round(parseFloat(row.amount) * 100) : null, ...financingPayload(row) };
      });
    }
    const mainNeeded = Object.keys(mainPayload).length > 0;

    const categoryPrices = categoryKeys.flatMap((sk) =>
      VEHICLE_CATEGORY_OPTIONS.map((c) => {
        const key = cellKey(sk, c.value);
        if (deletedKeys.category.has(key)) return null;
        const row = staged.category[key] || {};
        return { service_key: sk, vehicle_category: c.value, amount_kobo: row.amount ? Math.round(parseFloat(row.amount) * 100) : null, ...financingPayload(row) };
      }).filter(Boolean)
    );
    const categoryNeeded = categoryKeys.length > 0;

    const [mainResult, categoryResult] = await Promise.allSettled([
      mainNeeded ? patchMain(mainPayload) : Promise.resolve({ ok: true }),
      categoryNeeded ? patchCategories(categoryPrices) : Promise.resolve({ ok: true }),
    ]);
    setSaving(false);

    const mainOk = mainResult.status === "fulfilled" && mainResult.value.ok;
    const categoryOk = categoryResult.status === "fulfilled" && categoryResult.value.ok;

    if (mainOk && categoryOk) {
      setStaged(null);
      setEditing(false);
      showToast("success", `${section.title} pricing updated.`);
    } else {
      const failedParts = [];
      if (!mainOk) failedParts.push("flat prices");
      if (!categoryOk) failedParts.push("category grid");
      setError(`Could not save ${failedParts.join(" and ")} — your changes are still staged, try Save again.`);
      showToast("error", `Could not save ${section.title} — ${failedParts.join(" and ")} failed.`);
    }
  };

  const renderRows = (rows, groupLabel) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {rows.map((row) => (
        <PriceRowCard
          key={row.key}
          label={row.label}
          row={getRow(row.mechanism, row.key)}
          onChange={(next) => setStagedRow(row.mechanism, row.key, next)}
          editing={editing}
          amountRequired={!!row.amountRequired}
          onDelete={editing ? () => handleDeleteRow(row.mechanism, row, rowFullLabel(groupLabel, row)) : null}
          isGeneralScope={isGeneralScope}
        />
      ))}
    </div>
  );

  const renderCategoryGrid = (service_key, groupLabel) => (
    <CategoryGrid
      serviceKey={service_key}
      rows={editing && staged ? staged.category : categoryRows}
      editing={editing}
      onChange={setStagedCategoryRow}
      onDelete={(vehicleCategory, label) => handleDeleteCategoryCell(service_key, vehicleCategory, `${groupLabel} — ${label}`)}
      isGeneralScope={isGeneralScope}
    />
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-base font-semibold text-[#111111]">{section.title}</h2>
            {hasOverride && <span className="inline-flex h-2 w-2 rounded-full bg-[#28A745]" title="Has a state override" />}
            {section.badge && (
              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {section.badge}
              </span>
            )}
          </div>
          {section.subtitle && <p className="text-sm text-slate-500 mt-0.5">{section.subtitle}</p>}
        </div>
        {!editing ? (
          <button type="button" onClick={startEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shrink-0">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#28A745] text-white disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button type="button" onClick={cancelEdit} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-[#E5E5E5]">Cancel</button>
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 sm:px-8 pt-4 flex items-start gap-2 text-[13px] text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {section.subServices ? (
        <div className="divide-y divide-slate-100">
          {section.subServices.map((sub) => {
            const isOpen = openSub === sub.key;
            // While the card is in edit mode, every sub-panel's fields must
            // be visible at once — otherwise "Edit" appears to do nothing
            // (Save/Cancel show up, but no price fields) until the admin
            // separately clicks each row to expand it, which reads as "I
            // can't set the price" for whichever document they didn't
            // happen to click. Read-only browsing still expands one at a
            // time via isOpen.
            const isVisible = isOpen || editing;
            return (
              <div key={sub.key}>
                <button
                  type="button"
                  onClick={() => setOpenSub(isOpen ? null : sub.key)}
                  className="w-full flex items-center justify-between px-6 sm:px-8 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-800">{sub.label}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isVisible ? "rotate-180" : ""}`} />
                </button>
                {isVisible && (
                  <div className="px-6 sm:px-8 pb-6 space-y-4">
                    {sub.rows && sub.rows.length > 0 && renderRows(sub.rows, sub.label)}
                    {sub.categoryGrid && renderCategoryGrid(sub.categoryGrid.service_key, sub.label)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 sm:px-8 py-6 space-y-4">
          {section.rows && section.rows.length > 0 && renderRows(section.rows, section.title)}
          {section.categoryGrid && renderCategoryGrid(section.categoryGrid.service_key, section.title)}
        </div>
      )}
    </div>
  );
}
