"use client";

// One collapsible card per service (driven by SERVICE_SECTIONS). Read view
// lists every price; tapping a line opens the shared edit sheet, and
// services priced by vehicle type show a tile grid under their default price.

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { VEHICLE_CATEGORY_OPTIONS } from "@/lib/constants/vehicleCategories";
import { Badge } from "@/app/dashboard/_kit";
import { usePricingData } from "../_context/PricingDataContext";
import CategoryGrid from "./CategoryGrid";
import { PriceEditSheet, PriceLine } from "./PriceRow";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function rowsOf(section) {
  return [...(section.rows || []), ...(section.subServices || []).flatMap((s) => s.rows || [])];
}
function gridKeysOf(section) {
  return [section.categoryGrid?.service_key, ...(section.subServices || []).map((s) => s.categoryGrid?.service_key)].filter(Boolean);
}

function Group({ title, gridLabel, rows, gridKey, onEdit, isGeneralScope, getRow }) {
  const [gridOpen, setGridOpen] = useState(false);
  return (
    <div className="border-t border-cx-line first:border-t-0">
      {title ? <h3 className="px-4 pb-1 pt-4 text-[15px] font-semibold text-cx-ink sm:px-5">{title}</h3> : null}
      {rows?.length ? (
        <div className="divide-y divide-cx-line/70">
          {rows.map((spec) => (
            <PriceLine
              key={spec.key}
              label={spec.label}
              hint={spec.hint}
              row={getRow(spec)}
              isGeneralScope={isGeneralScope}
              onEdit={() => onEdit(spec, title)}
            />
          ))}
        </div>
      ) : null}
      {gridKey ? (
        <div className="px-4 pb-4 sm:px-5">
          <button
            type="button"
            onClick={() => setGridOpen((o) => !o)}
            aria-expanded={gridOpen}
            className="cx-focus mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-cx text-[15px] font-semibold text-cx-brand-deep"
          >
            Prices by vehicle type ({VEHICLE_CATEGORY_OPTIONS.length})
            <ChevronDown className={cx("h-4 w-4 transition-transform", gridOpen && "rotate-180")} aria-hidden />
          </button>
          {gridOpen ? (
            <div className="mt-2">
              <CategoryGrid serviceKey={gridKey} groupLabel={gridLabel || title} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ServicePricingCard({ section, open, onToggle }) {
  const { isGeneralScope, getRow, getCell, saveRow, deleteRow } = usePricingData();
  const [editing, setEditing] = useState(null); // { spec, groupTitle }

  const specs = rowsOf(section);
  const gridKeys = gridKeysOf(section);
  const stateOverrides = isGeneralScope
    ? 0
    : specs.filter((s) => getRow(s).is_override).length +
      gridKeys.reduce((n, sk) => n + VEHICLE_CATEGORY_OPTIONS.filter((c) => getCell(sk, c.value).is_override).length, 0);
  const count = specs.length + gridKeys.length * VEHICLE_CATEGORY_OPTIONS.length;

  const editingRow = editing ? getRow(editing.spec) : null;
  const editTitle = editing
    ? [editing.groupTitle || section.title, editing.spec.label !== "Amount" ? editing.spec.label : null].filter(Boolean).join(" — ")
    : "";

  const hasBundle = section.subServices && ((section.rows && section.rows.length) || section.categoryGrid);

  return (
    <section id={`svc-${section.slug}`} className="scroll-mt-28 rounded-cx-lg border border-cx-line bg-cx-surface shadow-cx">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="cx-focus flex w-full items-start gap-3 rounded-cx-lg px-4 py-4 text-left sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-semibold text-cx-ink">{section.title}</h2>
            {stateOverrides ? <Badge tone="amber">{stateOverrides} state price{stateOverrides > 1 ? "s" : ""}</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-cx-muted">
            {count} price{count === 1 ? "" : "s"}
            {section.subtitle ? ` · ${section.subtitle}` : ""}
          </p>
        </div>
        <ChevronDown className={cx("mt-1 h-5 w-5 shrink-0 text-cx-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div className="border-t border-cx-line">
          {section.subServices ? (
            <>
              {hasBundle ? (
                <Group
                  title="All documents together (bundle)"
                  rows={section.rows}
                  gridKey={section.categoryGrid?.service_key}
                  onEdit={(spec, t) => setEditing({ spec, groupTitle: t })}
                  isGeneralScope={isGeneralScope}
                  getRow={getRow}
                />
              ) : null}
              {section.subServices.map((sub) => (
                <Group
                  key={sub.key}
                  title={sub.label}
                  rows={sub.rows}
                  gridKey={sub.categoryGrid?.service_key}
                  onEdit={(spec, t) => setEditing({ spec, groupTitle: t })}
                  isGeneralScope={isGeneralScope}
                  getRow={getRow}
                />
              ))}
            </>
          ) : (
            <Group
              gridLabel={section.title}
              rows={section.rows}
              gridKey={section.categoryGrid?.service_key}
              onEdit={(spec) => setEditing({ spec, groupTitle: section.title })}
              isGeneralScope={isGeneralScope}
              getRow={getRow}
            />
          )}
        </div>
      ) : null}

      <PriceEditSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editTitle}
        row={editingRow}
        isGeneralScope={isGeneralScope}
        amountRequired={!!editing?.spec.amountRequired}
        canDelete={!!editingRow && (isGeneralScope ? !!editingRow.amount : editingRow.is_override)}
        onSave={(next) => saveRow(editing.spec, next)}
        onDelete={() => deleteRow(editing.spec)}
      />
    </section>
  );
}
