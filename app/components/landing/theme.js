// Landing-page-only palette. Deliberately NOT merged into globals.css's
// shared :root tokens (those feed the customer dashboard, out of scope for
// this redesign) — kept as a plain JS module so section components can
// import named hex constants instead of retyping magic strings, without
// touching any shared design-token surface.
export const GREEN = "#28A745"; // brand anchor, unchanged
export const INK = "#0B1210"; // warm/green-tinted near-black
export const INK_CARD = "#13221B"; // one step lighter than INK, for cards on dark sections
export const PAPER = "#F3F5F2"; // cool off-white, official-document feel
export const GOLD = "#C9A227"; // seal/stamp accent — the second signature color
export const URGENT = "#D64545"; // sparing use only — expiry/deadline messaging
export const INK_SOFT = "#5B6B60"; // muted secondary text on Paper
