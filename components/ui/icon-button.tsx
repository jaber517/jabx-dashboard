import * as React from "react";
import { cn } from "@/lib/utils";

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }
>(({ className, danger, type, ...props }, ref) => (
  <button
    ref={ref}
    type={type ?? "button"}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/90 text-muted-foreground shadow-soft backdrop-blur transition hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
      danger ? "hover:border-danger/40 hover:bg-danger/10 hover:text-danger" : "hover:bg-muted",
      className
    )}
    {...props}
  />
));

IconButton.displayName = "IconButton";
