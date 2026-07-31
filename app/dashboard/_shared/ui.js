// Shared button/input/label class strings, consolidated from the
// near-identical copies previously duplicated in apply/page.jsx,
// apply/[id]/page.jsx, and wallet/page.jsx. Color is intentionally left
// out of the button variants (callers pair these with a background color
// class or inline style, since not every btnPrimary usage is brand-green —
// e.g. some are amber for a warning CTA).

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-semibold text-white shadow-sm shadow-emerald-900/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-paper-border bg-white px-5 py-3 text-[13.5px] font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors";

export const inputBase =
  "w-full rounded-xl border border-paper-border bg-slate-50/60 px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-slate-400 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15";

// Sentence-case field label (apply / apply detail forms).
export const label = "block text-[12.5px] font-semibold text-slate-700 mb-1.5";

// Uppercase tracked field label (wallet forms) — kept distinct from `label`
// rather than unified, since collapsing them would be a visual change
// beyond what either page currently asks for.
export const fieldLabel = "block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
