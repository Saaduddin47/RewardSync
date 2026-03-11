import { cn } from "../../utils/cn";

export const Button = ({ className, variant = "default", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
      variant === "default" && "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900",
      variant === "outline" && "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900",
      variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
      className
    )}
    {...props}
  />
);
