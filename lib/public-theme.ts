// Color tokens for the public-facing "void" design system (landing, about,
// contact, occ, claude, login). Kept separate from the dashboard's CSS
// variables in globals.css so the two themes never collide — the dashboard
// stays on its own warm palette, unaffected by any of this.
export const voidTheme = {
  void: "#06080D",
  panel: "#12161F",
  panelGlass: "rgba(18, 22, 31, 0.55)",
  wire: "#1D2330",
  wireBright: "rgba(255, 255, 255, 0.08)",
  wireTop: "rgba(255, 255, 255, 0.14)",
  paper: "#EDF1F8",
  static: "#8A94A6",
  signal: "#0A84FF",
  glowA: "rgba(10, 132, 255, 0.30)",
  glowB: "rgba(124, 111, 255, 0.16)",
  amber: "#F5A623"
} as const;
