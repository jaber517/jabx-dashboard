import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jaber's Dashboard",
    short_name: "Jaber",
    description: "Personal dashboard for projects, tasks, notes, and resources.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4F6F9",
    theme_color: "#0A84FF",
    icons: [
      {
        src: "/icon.jpg",
        sizes: "512x512",
        type: "image/jpeg"
      }
    ]
  };
}
