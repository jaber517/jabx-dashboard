import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata(
  "Support — jabx",
  "How to get help with jabx and its apps.",
  "/support"
);

export default function SupportPage() {
  return <PublicShell>
    <article className="public-prose">
      <p className="public-eyebrow">Support</p>
      <h1>Support</h1>
      <p className="public-lead">Help, questions, and feedback for jabx and its apps.</p>

      <h2>Email support</h2>
      <p>The best way to get help is by email: <a href="mailto:contact@jabx.me">contact@jabx.me</a>. To help us sort things out faster, include:</p>
      <ul>
        <li>The name of the app and its version</li>
        <li>Your device and operating system</li>
        <li>What happened, and what you expected to happen</li>
        <li>A screenshot, if it helps</li>
      </ul>

      <h2>Apps</h2>
      <p>DayHQ is currently in development and has not been released, so there is nothing to support yet. You can follow its progress on the <Link href="/projects">Projects</Link> page.</p>

      <h2>Something else?</h2>
      <p>For project ideas or collaboration, use the <Link href="/contact">Contact</Link> page.</p>
    </article>
  </PublicShell>;
}
