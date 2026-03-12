import { cn } from "../../utils/cn";

const map = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  cleared: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  not_claimed: "bg-card text-foreground/80 border border-border",
  not_eligible: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const Badge = ({ status = "pending" }) => (
  <span className={cn("rounded-full px-2 py-1 text-xs font-medium capitalize", map[status] || "bg-card text-foreground/80 border border-border")}>
    {status.replace("_", " ")}
  </span>
);
