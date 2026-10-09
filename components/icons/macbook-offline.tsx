import type { SVGProps } from "react";

// The approved "MacBook disconnected" mark: a flat open MacBook outline (Mist) with a dark
// screen, a cable from its side with a gap before the unplugged plug, two spark ticks across
// the gap, and a Signal Blue badge with a slash at the laptop's top-right corner.
// Strokes use currentColor, so `color` (or a text-* class) sets the outline colour.
// At 32 px and below it is drawn simpler: the laptop and a slash.
export function MacbookOffline({
  size = 120,
  color = "#D8E3F0",
  accent = "#2F80FF",
  screen = "#07111B",
  simple,
  title,
  ...props
}: Omit<SVGProps<SVGSVGElement>, "color"> & {
  size?: number;
  /** Outline colour (Mist by default); pass "currentColor" to inherit the text colour. */
  color?: string;
  /** Badge and slash colour (Signal Blue by default). */
  accent?: string;
  /** Screen fill, and the ring that separates the badge from the outline. */
  screen?: string;
  /** Force the 24 px drawing; by default it is used at 32 px and below. */
  simple?: boolean;
  /** Accessible name; without it the mark is decorative. */
  title?: string;
}) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
  const style = color === "currentColor" ? props.style : { color, ...props.style };

  if (simple ?? size <= 32) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...a11y}
        {...props}
        style={style}
      >
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2 19.5h20" />
        <path d="M3 3l18 18" stroke={screen} strokeWidth={4.5} />
        <path d="M3 3l18 18" stroke={accent} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
      {...props}
      style={style}
    >
      {/* Lid with a dark screen */}
      <rect x="14" y="34" width="64" height="42" rx="4" fill={screen} />
      <rect x="19" y="39" width="54" height="32" rx="1.5" strokeWidth={1} opacity={0.5} />
      {/* Base with the opening notch */}
      <path d="M6 77h80v2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2z" fill={screen} />
      <path d="M40 77v1.5h12V77" />
      {/* Cable from the side, cut short */}
      <path d="M86 79.5h3a5 5 0 0 1 5 5V95a5 5 0 0 0 5 5" />
      {/* Spark ticks across the gap */}
      <path d="M101.5 93.5l1.5-3" />
      <path d="M101.5 106.5l1.5 3" />
      {/* The unplugged plug: prongs towards the gap, body, tail */}
      <path d="M104.5 97.5h3M104.5 102.5h3" />
      <rect x="107.5" y="94" width="7" height="12" rx="2" fill={screen} />
      <path d="M114.5 100h3.5" />
      {/* Offline badge at the lid's top-right corner */}
      <circle cx="78" cy="34" r="11" fill={accent} stroke={screen} strokeWidth={3} />
      <path d="M73.5 38.5l9-9" stroke="#FFFFFF" strokeWidth={2.5} />
    </svg>
  );
}
