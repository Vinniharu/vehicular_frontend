import { GOLD } from "./theme";

// The page's signature element — an official rubber-stamp/seal mark.
// Reused wherever the design needs to say "verified, and it's real,"
// digitized rather than decorative: the hero trust badge, and small
// verified marks elsewhere on the page.
export default function StampSeal({ size = 140, label = "VERIFIED PROCESS", sublabel = "VEHICULARS", className = "" }) {
  const r = 46;
  const d = `M 50,50 m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="none" stroke={GOLD} strokeWidth="1.5" />
      <circle cx="50" cy="50" r="39" fill="none" stroke={GOLD} strokeWidth="0.6" strokeDasharray="1.5 2.2" opacity="0.75" />
      <path id="stampArc" d={d} fill="none" />
      <text fontSize="6" letterSpacing="0.2em" fill={GOLD} fontFamily="var(--font-mono, monospace)">
        <textPath href="#stampArc" startOffset="1%">
          {`• ${label} `.repeat(2)}
        </textPath>
      </text>
      <g transform="translate(50,48)" stroke={GOLD} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M -13,-1 L -4,9 L 15,-13" />
      </g>
      <text x="50" y="73" textAnchor="middle" fill={GOLD} fontSize="5.5" letterSpacing="0.12em" fontFamily="var(--font-mono, monospace)">
        {sublabel}
      </text>
    </svg>
  );
}
