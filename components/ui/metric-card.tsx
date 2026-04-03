import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  trend,
  icon,
  accentClassName
}: {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  accentClassName?: string;
}) {
  return (
    <Card className={cn("relative overflow-hidden", accentClassName)}>
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5" />
      <CardHeader className="relative gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-3 text-3xl font-semibold">{value}</CardTitle>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            {icon}
          </div>
        </div>
        {trend ? (
          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {trend}
          </div>
        ) : null}
      </CardHeader>
    </Card>
  );
}
