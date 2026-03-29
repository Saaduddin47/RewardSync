import { cn } from "../../utils/cn";

const map = {
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  cleared: "bg-green-100 text-green-700 border border-green-200",
  failed: "bg-red-100 text-red-700 border border-red-200",
  not_claimed: "bg-card text-foreground/80 border border-border",
  not_eligible: "bg-gray-100 text-gray-600 border border-gray-200",
};

export const Badge = ({ status = "pending" }) => (
  <span className={cn("rounded-full px-2 py-1 text-xs font-medium capitalize", map[status] || "bg-card text-foreground/80 border border-border")}>
    {status.replace("_", " ")}
  </span>
);
