import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Arrow, DayHQIcon, DevelopmentBadge, PlatformPills, Wordmark } from "@/components/public/public-art";
import { publicMetadata } from "@/components/public/public-metadata";
import { aiTeam, founder } from "@/lib/team";

export const metadata = publicMetadata("jabx — Digital work, thoughtfully made", "jabx is an independent digital studio where human direction and AI capability work together to make useful digital products.", "/");

export default function LandingPage() {
  return <PublicShell>
    <section className="public-hero">
      <div className="public-hero-copy">
        <p className="public-eyebrow">Independent digital studio</p>
        <h1>Digital work,<br /><span className="public-accent">thoughtfully made.</span></h1>
        <p className="public-lead">jabx is an independent studio where human direction and AI capability work together to make useful apps and tools.</p>
        <div className="public-actions"><Link href="/projects" className="public-button">Explore projects</Link><Link href="/team" className="public-button-secondary">Meet the team</Link></div>
      </div>
      <div className="public-mark" aria-hidden="true">
        <Wordmark priority />
        <div className="public-mark-caption"><span>jabx.me</span><span>Human-led. Built with AI.</span></div>
      </div>
    </section>

    <section className="public-section" aria-labelledby="selected-work">
      <div className="public-section-heading"><div><p className="public-eyebrow">Selected work</p><h2 id="selected-work">What we&apos;re building</h2></div></div>
      <article className="public-feature public-card">
        <div className="public-feature-copy">
          <DevelopmentBadge />
          <div className="public-app-id"><DayHQIcon /><h3>DayHQ</h3></div>
          <PlatformPills />
          <p>Your personal command center: tasks, calendar, habits, goals, and focus in one app.</p>
          <Link href="/projects" className="public-text-link">View project <Arrow /></Link>
        </div>
        <figure className="public-feature-image"><Image src="/redesign/dayhq-home.png" alt="Two phone mockups showing a dark DayHQ interface concept" width={420} height={379} sizes="(max-width: 700px) 90vw, 460px" /><figcaption>Interface concept</figcaption></figure>
      </article>
    </section>

    <section className="public-teaser public-section" aria-labelledby="team-teaser">
      <div><p className="public-eyebrow">The team</p><h2 id="team-teaser">Human direction.<br />AI capability.</h2></div>
      <div>
        <p>Jaber leads the studio. An AI team of six handles engineering, research, support, and operations under his direction.</p>
        <div className="public-team-strip">
          {[founder, ...aiTeam].map((member) => <Link key={member.id} href="/team" aria-label={`${member.name}, ${member.role}`}><Image src={member.photo} alt="" width={168} height={168} /></Link>)}
        </div>
        <Link href="/team" className="public-text-link">Meet the team <Arrow /></Link>
      </div>
    </section>

    <section className="public-closing public-section"><div><p className="public-eyebrow">Get in touch</p><h2>Have something in mind?</h2></div><a href="mailto:contact@jabx.me" className="public-text-link">contact@jabx.me <Arrow /></a></section>
  </PublicShell>;
}
