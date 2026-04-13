import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] text-[var(--foreground)]",
        secondary: "border-transparent bg-[var(--bg-raised)] text-[var(--text-muted)]",
        success: "border-transparent bg-emerald-500/20 text-emerald-300",
        warning: "border-transparent bg-amber-500/20 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
