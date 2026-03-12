import { cn } from "../../utils/cn";

export const Button = ({ className, variant = "default", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
      variant === "default" && "bg-foreground text-background hover:opacity-90",
      variant === "outline" && "border border-border bg-background text-foreground hover:bg-card",
      variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
      className
    )}
    {...props}
  />
);
