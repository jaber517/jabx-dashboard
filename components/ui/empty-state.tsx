import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className={cn(buttonVariants({ variant: "secondary" }), "mt-6")}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
