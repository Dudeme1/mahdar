/**
 * Animated Mahdar icon — three rounded lines + circle in brand gold.
 * size: "sm" (inline, 16px tall) | "md" (28px) | "lg" (44px)
 */
export default function MahdarLoader({ size = "sm", style = {} }) {
  const h = size === "lg" ? 44 : size === "md" ? 28 : 16;
  const w = Math.round(h * (300 / 104));
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 300 104"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "inline-block", ...style }}
      aria-hidden="true"
    >
      <rect className="mhl-r1"  x="0"   y="0"  width="300" height="20" rx="10" fill="#c89b58" />
      <rect className="mhl-r2"  x="0"   y="40" width="300" height="20" rx="10" fill="#c89b58" />
      <rect className="mhl-r3"  x="0"   y="80" width="160" height="20" rx="10" fill="#c89b58" />
      <circle className="mhl-dot" cx="190" cy="90" r="14" fill="#c89b58" />
    </svg>
  );
}
