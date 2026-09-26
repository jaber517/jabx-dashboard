import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// A plain page title row: no panel behind it, left aligned, actions on the right.
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div>
        {eyebrow ? <p className="text-sm font-semibold text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-[-0.04em] text-balance sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-[15px] leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
