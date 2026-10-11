import { PublicShell } from "@/components/public/public-shell";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata(
  "Privacy — jabx",
  "How the jabx website handles your information, and where to find privacy information for jabx apps.",
  "/privacy"
);

export default function PrivacyPage() {
  return <PublicShell>
    <article className="public-prose">
      <p className="public-eyebrow">Privacy</p>
      <h1>Privacy</h1>
      <p className="public-lead">A plain description of what the jabx website does and does not do with your information.</p>
      <p className="public-prose-date">Last updated: 11 October 2026</p>

      <h2>This website</h2>
      <p>jabx.me has no accounts, advertising, or analytics trackers. The public pages do not set cookies. Your browser may keep cached copies of pages and images so the site loads faster.</p>

      <h2>If you contact us</h2>
      <p>The contact page has a quote-request form. It asks for your name, company, sector, email address, an optional phone number, which package you are interested in, the problem you want to solve, and your timing. If you prefer, you can still email <a href="mailto:contact@jabx.me">contact@jabx.me</a>, in which case we receive your email address and the contents of your message.</p>
      <p>We use what you send only to reply, to prepare a quote, and to follow up on your enquiry. We do not sell or share it, and we do not add you to any marketing list.</p>
      <p>To limit spam, the form turns your IP address into a one-way code that is used for an hour-long counter. Your IP address itself is not stored.</p>
      <p>Requests that do not lead to a project are deleted within 12 months. You can ask for your request to be deleted sooner by emailing <a href="mailto:contact@jabx.me">contact@jabx.me</a>.</p>

      <h2>Third parties</h2>
      <ul>
        <li>The site is hosted on Vercel, which processes standard technical request data, such as IP address and browser details, to deliver the pages. Vercel&apos;s own privacy policy applies to that processing.</li>
        <li>Quote requests are stored in a database run by Cloudflare (Cloudflare D1), and each one is emailed to Jaber through Resend, an email delivery service. Both process this data on our behalf.</li>
        <li>Links to Instagram and WhatsApp leave this site. Those services have their own privacy policies.</li>
      </ul>

      <h2>Apps</h2>
      <p>Each jabx app will publish its own privacy information describing what that app collects and why, in its store listing and here. DayHQ is in development and has not been released, so it has no published policy yet.</p>

      <h2>Questions</h2>
      <p>For any privacy question, email <a href="mailto:contact@jabx.me">contact@jabx.me</a>. If this page changes, the date above will change with it.</p>
    </article>
  </PublicShell>;
}
