import { IBM_Plex_Mono, Inter } from "next/font/google";

// Used across the public-facing pages (landing, about, contact, occ, claude,
// login) for the dark "void" design system — mono labels, nav, buttons, tags.
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono"
});

// The jabx brand typeface (~/Jabx/brand/brand-guide.md), used on the public
// site and the dashboard.
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter"
});
