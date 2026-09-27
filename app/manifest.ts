import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPrivateHost } from "@/lib/hosts";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  const privateHost = isPrivateHost(headers().get("host") ?? "");
  return {
    id: privateHost ? "/dashboard" : "/",
    name: privateHost ? "jabx dashboard" : "jabx",
    short_name: "jabx",
    description: privateHost ? "Personal dashboard for projects, tasks, notes, and resources." : "jabx — AI lab. Apps, tools, and experiments.",
    start_url: privateHost ? "/dashboard" : "/",
    scope: "/",
    display: "standalone",
    background_color: "#07111B",
    theme_color: "#07111B",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
