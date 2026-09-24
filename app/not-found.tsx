import Link from "next/link";
import { Wordmark } from "@/components/public/public-art";
import "@/components/public/public.css";

export const metadata = { title: { absolute: "Page not found — jabx" } };

export default function NotFound() {
  return (
    <main className="public-void">
      <div>
        <Wordmark priority />
        <p className="public-eyebrow">404</p>
        <h1>Nothing here.</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="public-button">Back to home</Link>
      </div>
    </main>
  );
}
