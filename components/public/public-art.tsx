import Image from "next/image";

export function RibbonArt() {
  return <div className="public-ribbon" aria-hidden="true">
    <Image src="/redesign/blue-ribbon.png" alt="" width={317} height={307} priority sizes="(max-width: 700px) 180px, 380px" />
    <span>Ideas<br />Tools<br />Progress<i /></span>
  </div>;
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
