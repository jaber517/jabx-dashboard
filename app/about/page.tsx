import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { Arrow } from "@/components/public/public-art";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata("About — jabx", "An independent studio for mobile apps, useful tools, and practical AI, led by Jaber and supported by an AI team.", "/about");
const areas = [
  ["01", "Mobile apps", "Building for iOS and Android."],
  ["02", "Useful tools", "Exploring simpler ways to get things done."],
  ["03", "Practical AI", "Testing ideas through small experiments."]
];

export default function AboutPage() {
  return <PublicShell>
    <section className="public-hero public-hero-solo"><Reveal className="public-hero-copy"><p className="public-eyebrow">About jabx</p><h1>A space to build.<br />Room to <span className="public-accent">explore.</span></h1><p className="public-lead">An independent studio for mobile apps, useful tools, and practical AI.</p></Reveal></section>
    <Reveal as="section" className="public-studio public-section"><p className="public-eyebrow">The studio</p><div><h2>Curiosity is the starting point.</h2><p>jabx brings app development and experimentation together. Jaber sets the direction and an AI team helps carry the work, turning ideas into useful digital experiences.</p></div></Reveal>
    <section className="public-section" aria-labelledby="areas"><Reveal><h2 id="areas">Areas of exploration</h2></Reveal><div className="public-area-grid">{areas.map(([number, title, description], index) => <Reveal key={number} delay={index * 80}><span className="public-area-number">{number}</span><h3>{title}</h3><p>{description}</p></Reveal>)}</div></section>
    <Reveal as="section" className="public-section"><h2>See what is taking shape.</h2><div className="public-actions"><Link href="/projects" className="public-button">Explore projects</Link><Link href="/team" className="public-button-secondary">Meet the team</Link><Link href="/contact" className="public-text-link">Get in touch <Arrow /></Link></div></Reveal>
  </PublicShell>;
}
