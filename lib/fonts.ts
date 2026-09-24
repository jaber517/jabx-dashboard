import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces"
});

// Used across the public-facing pages (landing, about, contact, occ, claude,
// login) for the dark "void" design system — mono labels, nav, buttons, tags.
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono"
});

// The jabx brand typeface (~/Jabx/brand/brand-guide.md), used on the public site.
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-inter"
});
