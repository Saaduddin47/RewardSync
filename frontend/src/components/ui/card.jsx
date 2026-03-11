import { cn } from "../../utils/cn";

export const Card = ({ className, ...props }) => (
  <div
    className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}
    {...props}
  />
);
