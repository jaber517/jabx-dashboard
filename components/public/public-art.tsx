import Image from "next/image";

// The jabx wordmark: lowercase jab in white, the x in Signal Blue. Always flat.
export function Wordmark({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/jabx-wordmark.svg" alt="jabx" width={310} height={160} priority={priority} className={className} />;
}
export function DayHQIcon() {
  return <Image src="/brand/dayhq-logo.png" alt="" width={144} height={144} className="public-app-icon" />;
}
export function PlatformPills() {
  return <div className="public-platforms"><span>iOS</span><span>Android</span></div>;
}
export function DevelopmentBadge() {
  return <span className="public-status">In development</span>;
}
export function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
