import { Fraunces, IBM_Plex_Mono } from "next/font/google";

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
