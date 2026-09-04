import Link from "next/link";
import { cn } from "@/lib/utils";

export function MagneticButton({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg bg-[#0A84FF] px-4 py-2 text-[13px] font-medium tracking-[0.03em] text-[#04101F] transition-colors hover:bg-[#3D9EFF] active:scale-[0.96] motion-reduce:active:scale-100",
        className
      )}
    >
      {children}
    </Link>
  );
}
