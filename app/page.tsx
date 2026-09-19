import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Arrow, DevelopmentBadge, PlatformPills, RibbonArt } from "@/components/public/public-art";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata("jabx — Apps, tools, and experiments", "Building mobile experiences and exploring practical uses for AI. An independent digital studio.", "/");

export default function LandingPage() {
  return <PublicShell>
    <section className="public-hero public-home-hero">
      <div className="public-hero-copy">
        <p className="public-eyebrow">Independent digital studio</p>
        <h1>Apps, tools,<br />and <span className="public-accent">experiments.</span></h1>
        <p className="public-lead">Building mobile experiences and exploring practical uses for AI.</p>
        <div className="public-actions"><Link href="/projects" className="public-button">Explore projects</Link><Link href="/about" className="public-text-link">About jabx <Arrow /></Link></div>
      </div>
      <RibbonArt />
    </section>
    <section className="public-work public-section" aria-labelledby="selected-work">
      <div className="public-section-heading"><h2 id="selected-work">Selected work</h2><p className="public-eyebrow">A closer look<br />at what we&apos;re building</p></div>
      <article className="public-feature">
        <div className="public-feature-copy"><DevelopmentBadge /><h3>DayHQ</h3><PlatformPills /><p>A mobile app taking shape.</p><Link href="/projects" className="public-text-link">View project <Arrow /></Link></div>
        <figure className="public-feature-image"><Image src="/redesign/dayhq-home.png" alt="Two phone mockups showing a dark DayHQ interface concept" width={420} height={379} sizes="(max-width: 700px) 90vw, 480px" /><figcaption>Interface concept</figcaption></figure>
      </article>
    </section>
    <section className="public-teaser public-section">
      <div><p className="public-eyebrow">About</p><h2>Built with curiosity.<br />Developed with care.</h2></div>
      <div><p>jabx is an independent studio exploring mobile apps, useful tools, and practical AI.</p><Link href="/about" className="public-text-link">About the studio <Arrow /></Link></div>
    </section>
    <section className="public-closing public-section"><div><p className="public-eyebrow">Get in touch</p><h2>Have something in mind?</h2></div><a href="mailto:contact@jabx.me" className="public-text-link">contact@jabx.me <Arrow /></a></section>
  </PublicShell>;
}
