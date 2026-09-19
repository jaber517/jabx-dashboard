import Link from "next/link";
import { Instagram, WhatsAppIcon, instagramUrl, whatsappUrl } from "./social-icons";
import "./public.css";

export function PublicFooter({ socials = false }: { socials?: boolean }) {
  return <footer className="public-footer public-container">
    <span>© 2026 jabx</span>
    {socials ? <div className="public-footer-socials">
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="jabx on Instagram (opens in a new tab)"><Instagram size={21} aria-hidden="true" /></a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="jabx on WhatsApp (opens in a new tab)"><WhatsAppIcon /></a>
    </div> : null}
    <nav aria-label="Legal" className="public-footer-links"><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link></nav>
  </footer>;
}
