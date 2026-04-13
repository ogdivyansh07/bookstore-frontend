import React from "react";
import { cn } from "lib/utils";

const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

export { Input };
