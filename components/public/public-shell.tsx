import type { ReactNode } from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import "./public.css";

export function PublicShell({ children, socials = false }: { children: ReactNode; socials?: boolean }) {
  return <div className="public-site">
    <a href="#public-main" className="public-skip">Skip to content</a>
    <PublicHeader />
    <main id="public-main" className="public-container" tabIndex={-1}>{children}</main>
    <PublicFooter socials={socials} />
  </div>;
}
