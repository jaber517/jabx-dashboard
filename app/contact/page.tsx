import { Mail } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { Reveal } from "@/components/public/reveal";
import { Arrow } from "@/components/public/public-art";
import { Instagram, WhatsAppIcon, instagramUrl, whatsappUrl } from "@/components/public/social-icons";
import { publicMetadata } from "@/components/public/public-metadata";
import { LeadForm } from "@/components/public/lead-form";

// Unset until the lead Worker is deployed; without it the page offers the email panel instead.
const leadsFormUrl = process.env.NEXT_PUBLIC_LEADS_FORM_URL;

export const metadata = publicMetadata("Contact — jabx", "Ask for a quote, a question about an app, a project idea, or just a hello. Email contact@jabx.me or connect with jabx on Instagram and WhatsApp.", "/contact");

export default function ContactPage() {
  return <PublicShell socials>
    <section className="public-hero public-hero-solo"><Reveal className="public-hero-copy"><p className="public-eyebrow">Contact</p><h1>Start a<br /><span className="public-accent">conversation.</span></h1><p className="public-lead">A quote for your business, a question about an app, a project idea, or just a hello.</p></Reveal></section>
    {leadsFormUrl ? <Reveal as="section" id="request" className="public-request public-card" aria-labelledby="request-heading"><p className="public-eyebrow">Request a quote</p><h2 id="request-heading">Tell us what you need</h2><p>A few details about your business and the problem to solve. Jaber will reply with next steps and a quote.</p><LeadForm action={leadsFormUrl} /><p className="public-request-alt">Prefer email? <a href="mailto:contact@jabx.me" className="public-text-link">contact@jabx.me</a></p></Reveal> : null}
    {/* The form is the main way in; the full email panel only appears when the form is off. */}
    {leadsFormUrl ? null : <Reveal as="section" className="public-email-panel public-card" aria-labelledby="email-heading"><Mail className="public-email-icon" aria-hidden="true" /><div><p className="public-eyebrow">Email</p><h2 id="email-heading"><a href="mailto:contact@jabx.me">contact@jabx.me <Arrow /></a></h2><p>The best way to get in touch with jabx.</p></div><a href="mailto:contact@jabx.me" className="public-button">Send an email <Arrow /></a></Reveal>}
    <section className="public-social-section public-section" aria-labelledby="connect-heading"><Reveal><h2 id="connect-heading">Connect with jabx</h2></Reveal><div className="public-social-grid">
      <Reveal><a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="public-social-card public-card" aria-label="Instagram @jabx.ai (opens in a new tab)"><Instagram className="public-social-icon" aria-hidden="true" /><div><p className="public-eyebrow">Instagram</p><span>@jabx.ai</span></div><Arrow /></a></Reveal>
      <Reveal delay={80}><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="public-social-card public-card" aria-label="WhatsApp — Start a conversation (opens in a new tab)"><WhatsAppIcon className="public-social-icon" /><div><p className="public-eyebrow">WhatsApp</p><span>Start a conversation</span></div><Arrow /></a></Reveal>
    </div></section>
  </PublicShell>;
}
