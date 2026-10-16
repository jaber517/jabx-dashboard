import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { Arrow } from "@/components/public/public-art";
import { publicMetadata } from "@/components/public/public-metadata";
import { servicePackages } from "@/lib/services";

export const metadata = publicMetadata("Services — jabx", "Business websites, operations dashboards and automations, built by jabx around how your business actually runs. Tell us what you need and ask for a quote.", "/services");

const steps = [
  ["A conversation", "We start by talking through how your business runs today and what should change."],
  ["A written scope and quote", "You get the scope, revisions, ownership and price in writing before any work begins."],
  ["Staged payment", "A deposit to start, then the rest as agreed milestones are accepted."],
  ["It belongs to you", "Work made for you is yours. Hosting and accounts sit in your name wherever practical."],
  ["Care after handover", "Optional ongoing care for hosting, backups and updates, if you want it."]
];

export default function ServicesPage() {
  return <PublicShell>
    <section className="public-hero public-hero-solo"><Reveal className="public-hero-copy"><p className="public-eyebrow">Services</p><h1>Useful software<br /><span className="public-accent">for your business.</span></h1><p className="public-lead">jabx builds websites, dashboards and automations that start from how your business actually runs. Jaber sets the direction, an AI team helps carry the work, and you deal with one person from first call to handover.</p><div className="public-actions"><Link href="/contact" className="public-button">Ask for a quote</Link></div></Reveal></section>

    <section className="public-section" aria-labelledby="packages">
      <Reveal className="public-section-heading"><div><p className="public-eyebrow">Packages</p><h2 id="packages">Three ways to start</h2></div></Reveal>
      <div className="public-area-grid public-package-grid">
        {servicePackages.map((item, index) => <Reveal as="article" key={item.id} delay={index * 80} aria-labelledby={`${item.id}-name`}>
          <h3 id={`${item.id}-name`}>{item.name}</h3>
          <p>{item.summary}</p>
          <dl className="public-package-facts">
            <div><dt>For</dt><dd>{item.audience}</dd></div>
            <div><dt>Delivery</dt><dd>{item.delivery}</dd></div>
          </dl>
          <h4>Includes</h4>
          <ul className="public-list">{item.includes.map((line) => <li key={line}>{line}</li>)}</ul>
          <h4>Not included</h4>
          <ul className="public-list">{item.excludes.map((line) => <li key={line}>{line}</li>)}</ul>
          <Link href={`/contact?package=${item.id}#request`} className="public-text-link" aria-label={`Ask about ${item.name}`}>Ask about this package <Arrow /></Link>
        </Reveal>)}
      </div>
      <p className="public-package-note">Need something bigger? Custom builds are quoted case by case.</p>
    </section>

    <Reveal as="section" className="public-studio public-section" aria-labelledby="how-it-works"><p className="public-eyebrow">How a project works</p><div><h2 id="how-it-works">Clear from the first conversation.</h2>
      <ul className="public-steps">{steps.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ul>
    </div></Reveal>

    <Reveal as="section" className="public-closing public-section"><div><p className="public-eyebrow">Get a quote</p><h2>Tell us what you need.</h2></div><Link href="/contact#request" className="public-button">Ask for a quote <Arrow /></Link></Reveal>
  </PublicShell>;
}
