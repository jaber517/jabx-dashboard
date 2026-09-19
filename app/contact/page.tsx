import { Mail } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { Arrow, RibbonArt } from "@/components/public/public-art";
import { Instagram, WhatsAppIcon, instagramUrl, whatsappUrl } from "@/components/public/social-icons";
import { publicMetadata } from "@/components/public/public-metadata";

export const metadata = publicMetadata("Contact — jabx", "Questions about an app, a project idea, or just a hello. Email contact@jabx.me or connect with jabx on Instagram and WhatsApp.", "/contact");

export default function ContactPage() {
  return <PublicShell socials>
    <section className="public-hero public-contact-hero"><div className="public-hero-copy"><p className="public-eyebrow">Contact</p><h1>Start a<br /><span className="public-accent">conversation.</span></h1><p className="public-lead">Questions about an app, a project idea, or just a hello.</p></div><RibbonArt /></section>
    <section className="public-email-panel" aria-labelledby="email-heading"><Mail className="public-email-icon" aria-hidden="true" /><div><p className="public-eyebrow">Email</p><h2 id="email-heading"><a href="mailto:contact@jabx.me">contact@jabx.me <Arrow /></a></h2><p>The best way to get in touch with jabx.</p></div><a href="mailto:contact@jabx.me" className="public-button">Send an email <Arrow /></a></section>
    <section className="public-social-section public-section" aria-labelledby="connect-heading"><h2 id="connect-heading">Connect with jabx</h2><div className="public-social-grid">
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="public-social-card" aria-label="Instagram @jabx.ai (opens in a new tab)"><Instagram className="public-social-icon" aria-hidden="true" /><div><p className="public-eyebrow">Instagram</p><span>@jabx.ai</span></div><Arrow /></a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="public-social-card" aria-label="WhatsApp — Start a conversation (opens in a new tab)"><WhatsAppIcon className="public-social-icon" /><div><p className="public-eyebrow">WhatsApp</p><span>Start a conversation</span></div><Arrow /></a>
    </div></section>
  </PublicShell>;
}
