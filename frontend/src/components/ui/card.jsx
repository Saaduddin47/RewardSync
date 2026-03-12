import { cn } from "../../utils/cn";

export const Card = ({ className, ...props }) => (
  <div
    className={cn("rounded-xl border border-border bg-card p-4 text-foreground shadow-sm", className)}
    {...props}
  />
);
