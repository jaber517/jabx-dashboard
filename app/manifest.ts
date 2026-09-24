import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPrivateHost } from "@/lib/hosts";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  const privateHost = isPrivateHost(headers().get("host") ?? "");
  return {
    name: privateHost ? "Jaber's Dashboard" : "jabx",
    short_name: privateHost ? "Jaber" : "jabx",
    description: privateHost ? "Personal dashboard for projects, tasks, notes, and resources." : "jabx — AI lab. Apps, tools, and experiments.",
    start_url: privateHost ? "/dashboard" : "/",
    display: "standalone",
    background_color: "#F4F6F9",
    theme_color: "#0A84FF",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
