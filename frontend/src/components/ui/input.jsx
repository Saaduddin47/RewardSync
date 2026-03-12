import React from "react";
import { cn } from "../../utils/cn";

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 focus:border-foreground/40",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
