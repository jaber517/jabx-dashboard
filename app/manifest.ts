import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jaber's Dashboard",
    short_name: "Jaber",
    description: "Personal dashboard for projects, tasks, notes, and resources.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf4ec",
    theme_color: "#f79a6b",
    icons: [
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg"
      }
    ]
  };
}
