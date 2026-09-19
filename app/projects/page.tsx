import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Arrow, DevelopmentBadge, PlatformPills } from "@/components/public/public-art";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata("Projects — jabx", "Mobile apps, useful tools, and experiments in progress. Explore DayHQ, a mobile app in development for iOS and Android.", "/projects");

export default function ProjectsPage() {
  return <PublicShell>
    <section className="public-projects-hero"><p className="public-eyebrow">Projects</p><h1>Ideas <span className="public-accent">taking shape.</span></h1><p className="public-lead">Mobile apps, useful tools, and experiments in progress.</p></section>
    <article className="public-project public-section" aria-labelledby="dayhq">
      <div className="public-project-heading"><div><p className="public-eyebrow">01 / Mobile app</p><h2 id="dayhq">DayHQ</h2><PlatformPills /></div><DevelopmentBadge /></div>
      <figure className="public-project-image"><Image src="/redesign/dayhq-projects.png" alt="Three phone mockups showing dark and light DayHQ interface concepts" width={500} height={333} sizes="(max-width: 700px) 90vw, 680px" /><figcaption>Interface concept</figcaption></figure>
      <div className="public-project-details"><div><h3>DayHQ</h3><p>A mobile app in development for iOS and Android.</p></div><div><h3>Follow the project</h3><p>Get in touch for project updates or questions.</p><a href="mailto:contact@jabx.me" className="public-text-link">contact@jabx.me <Arrow /></a></div></div>
    </article>
    <section className="public-closing public-section"><h2>An idea worth exploring?</h2><Link href="/contact" className="public-text-link">Get in touch <Arrow /></Link></section>
  </PublicShell>;
}
