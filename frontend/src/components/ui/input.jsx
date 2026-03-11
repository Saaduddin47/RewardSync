import React from "react";
import { cn } from "../../utils/cn";

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400 dark:border-slate-800 dark:bg-slate-950",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
