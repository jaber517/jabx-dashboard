import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Command Center",
    short_name: "Command Center",
    description:
      "Offline-first personal command center for OCC, HSE, Training, AI Projects, and Personal work.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1320",
    theme_color: "#0d1320"
  };
}
