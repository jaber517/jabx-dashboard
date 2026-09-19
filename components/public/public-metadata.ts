import type { Metadata } from "next";

export function publicMetadata(title: string, description: string, path: string): Metadata {
  const url = `https://jabx.me${path}`;
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, siteName: "jabx", type: "website",
      images: [{ url: "https://jabx.me/jabx-logo-header.jpg", alt: "jabx" }]
    },
    twitter: {
      card: "summary", title, description,
      images: [{ url: "https://jabx.me/jabx-logo-header.jpg", alt: "jabx" }]
    }
  };
}
