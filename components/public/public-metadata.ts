import type { Metadata } from "next";

export function publicMetadata(title: string, description: string, path: string): Metadata {
  const url = `https://jabx.me${path}`;
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, siteName: "jabx", type: "website",
      images: [{ url: "https://jabx.me/brand/jabx-og.png", width: 1600, height: 800, alt: "jabx" }]
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: [{ url: "https://jabx.me/brand/jabx-og.png", alt: "jabx" }]
    }
  };
}
