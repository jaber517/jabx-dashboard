import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Arrow, RibbonArt } from "@/components/public/public-art";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata("About — jabx", "An independent studio for mobile apps, useful tools, and practical AI. Curiosity is the starting point.", "/about");
const areas = [
  ["01", "Mobile apps", "Building for iOS and Android."],
  ["02", "Useful tools", "Exploring simpler ways to get things done."],
  ["03", "Practical AI", "Testing ideas through small experiments."]
];

export default function AboutPage() {
  return <PublicShell>
    <section className="public-hero"><div className="public-hero-copy"><p className="public-eyebrow">About jabx</p><h1>A space to build.<br />Room to <span className="public-accent">explore.</span></h1><p className="public-lead">An independent studio for mobile apps, useful tools, and practical AI.</p></div><RibbonArt /></section>
    <section className="public-studio public-section"><p className="public-eyebrow">The studio</p><div><h2>Curiosity is the starting point.</h2><p>jabx brings app development and experimentation together. The focus is on turning ideas into useful digital experiences, with room to learn and improve along the way.</p></div></section>
    <section className="public-areas public-section"><h2>Areas of exploration</h2><div className="public-area-grid">{areas.map(([number, title, description]) => <div key={number}><span className="public-area-number">{number}</span><h3>{title}</h3><p>{description}</p></div>)}</div></section>
    <section className="public-current public-section"><p className="public-eyebrow">Currently taking shape</p><h2>DayHQ</h2><p>A mobile app in development.</p><Link href="/projects" className="public-text-link">Explore the project <Arrow /></Link></section>
    <section className="public-about-closing public-section"><h2>See what is taking shape.</h2><div className="public-actions"><Link href="/projects" className="public-button">Explore projects</Link><Link href="/contact" className="public-text-link">Get in touch <Arrow /></Link></div></section>
  </PublicShell>;
}
