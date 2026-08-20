"use client";

import { inputBase } from "@/app/dashboard/_shared/ui";

// Three explicitly labeled Day / Month / Year selects, with the month shown
// by name — this is what actually removes the ambiguity a native
// `<input type="date">` has: it renders using the browser/OS locale format
// (e.g. unlabeled MM/DD/YYYY on a US-locale browser) with no visible cue for
// which segment is the day and which is the month. A labeled "Month: March"
// dropdown can't be misread the way an unlabeled "03" can.
//
// Contract: `value` is an ISO "YYYY-MM-DD" string (or ""), `onChange`
// receives the same — matches what both existing call sites already pass
// around (apply/page.jsx's `dob` state, apply/[id]/page.jsx's
// `form.date_of_birth`), so neither site's surrounding state management,
// age validation, or submit payload needs to change.
//
// Day list is a plain 1-31 (not calendar-aware per month/year) — the
// backend's own date parsing (`_validate_dob_adult`,
// app/modules/driver_licence/schemas.py) already tolerates this the same
// way the rest of this codebase's date handling does; this fix's scope is
// day/month legibility, not full calendar-day validation.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MIN_AGE_YEARS = 16;
const MAX_AGE_YEARS = 100;

function parseIso(value) {
  if (!value) return { day: "", month: "", year: "" };
  const [y, m, d] = String(value).split("-");
  return {
    day: d ? String(parseInt(d, 10)) : "",
    month: m ? String(parseInt(m, 10)) : "",
    year: y || "",
  };
}

function toIso({ day, month, year }) {
  if (!day || !month || !year) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DateOfBirthInput({ value, onChange, hasError }) {
  const { day, month, year } = parseIso(value);
  const currentYear = new Date().getFullYear();

  const update = (patch) => {
    onChange(toIso({ day, month, year, ...patch }));
  };

  const selectCls = `${inputBase} ${hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : ""}`;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">Day</label>
        <select className={selectCls} value={day} onChange={(e) => update({ day: e.target.value })}>
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">Month</label>
        <select className={selectCls} value={month} onChange={(e) => update({ month: e.target.value })}>
          <option value="">Month</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">Year</label>
        <select className={selectCls} value={year} onChange={(e) => update({ year: e.target.value })}>
          <option value="">Year</option>
          {Array.from({ length: MAX_AGE_YEARS - MIN_AGE_YEARS + 1 }, (_, i) => currentYear - MIN_AGE_YEARS - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
