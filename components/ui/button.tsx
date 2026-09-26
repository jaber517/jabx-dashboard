import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition ease-spring active:scale-[0.96] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default: "bg-primary-strong px-4 py-2.5 text-primary-foreground hover:brightness-110",
        secondary:
          "border border-border bg-transparent px-4 py-2.5 text-foreground hover:border-primary",
        ghost: "px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-11 px-5 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);

Button.displayName = "Button";
