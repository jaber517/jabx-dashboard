import Link from "next/link";
import { cn } from "@/lib/utils";

export type Metric = {
  label: string;
  value: string;
  note?: string;
  href?: string;
};

// One flat strip of key numbers, divided by hairlines rather than boxed
// separately: two across on phones, four across on wide screens.
export function MetricStrip({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <section
      aria-label="Overview"
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-surface xl:grid-cols-4",
        className
      )}
    >
      {metrics.map((metric, index) => {
        const body = (
          <>
            <span className="text-[13px] font-semibold text-muted-foreground">{metric.label}</span>
            <span className="text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-foreground">{metric.value}</span>
            {metric.note ? <span className="text-[13px] text-muted-foreground">{metric.note}</span> : null}
          </>
        );
        const cell = cn(
          "flex flex-col gap-1.5 border-border p-5",
          index % 2 === 1 && "border-l",
          index >= 2 && "border-t xl:border-t-0",
          index === 2 && "xl:border-l"
        );
        return metric.href ? (
          <Link key={metric.label} href={metric.href} className={cn(cell, "transition-colors hover:bg-muted/60")}>
            {body}
          </Link>
        ) : (
          <div key={metric.label} className={cell}>
            {body}
          </div>
        );
      })}
    </section>
  );
}
